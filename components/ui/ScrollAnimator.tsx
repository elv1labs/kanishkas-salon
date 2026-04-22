'use client';

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SELECTORS = ".reveal, .reveal-left, .reveal-right, .reveal-scale";

function observeElements(observer: IntersectionObserver) {
    const elements = document.querySelectorAll<HTMLElement>(SELECTORS);
    elements.forEach((el) => {
        if (el.classList.contains("visible")) return; // already done

        // Stagger siblings by index
        const siblings = Array.from(el.parentElement?.children ?? []);
        const idx = siblings.indexOf(el);
        if (idx > 0 && !el.style.transitionDelay) {
            el.style.transitionDelay = `${Math.min(idx * 80, 400)}ms`;
        }

        // If already in viewport → show immediately
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight - 40) {
            requestAnimationFrame(() => el.classList.add("visible"));
        } else {
            observer.observe(el);
        }
    });
}

export default function ScrollAnimator() {
    const pathname = usePathname();

    useEffect(() => {
        // Respect reduced-motion preference
        const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (prefersReduced) {
            document.querySelectorAll<HTMLElement>(SELECTORS).forEach((el) =>
                el.classList.add("visible")
            );
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
        );

        // Sweep 1 — 80ms: catches server-rendered elements
        const t1 = setTimeout(() => observeElements(observer), 80);

        // Sweep 2 — 450ms: catches elements rendered by fast client components
        const t2 = setTimeout(() => observeElements(observer), 450);

        // Sweep 3 — 1000ms: the last-resort catch for slow hydrating components
        const t3 = setTimeout(() => observeElements(observer), 1000);

        // MutationObserver: watches for NEW elements added to the DOM
        // (e.g. ServicesClientView, GalleryClientView painting their cards after hydration)
        const mutationObs = new MutationObserver(() => {
            observeElements(observer);
        });
        mutationObs.observe(document.body, { childList: true, subtree: true });

        // Stop the MutationObserver after 3s — DOM is stable by then
        const tStop = setTimeout(() => mutationObs.disconnect(), 3000);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            clearTimeout(tStop);
            observer.disconnect();
            mutationObs.disconnect();
        };
    }, [pathname]);

    return null;
}
