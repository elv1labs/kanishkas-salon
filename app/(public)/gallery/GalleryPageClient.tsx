"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";

const CSS = `
    @keyframes galleryFadeUp {
        from { opacity: 0; transform: translateY(24px); }
        to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes galleryScrollHint {
        0%, 100% { transform: translateY(0); }
        50%       { transform: translateY(8px); }
    }
    @keyframes galleryLightboxIn {
        from { opacity: 0; transform: scale(0.96); }
        to   { opacity: 1; transform: scale(1); }
    }
    @keyframes galleryOverlayIn {
        from { opacity: 0; }
        to   { opacity: 1; }
    }

    .gl-hero-eyebrow { animation: galleryFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.2s both; }
    .gl-hero-title { animation: galleryFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.45s both; }
    .gl-hero-rule { animation: galleryFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.6s both; width: 0; }
    .gl-hero-subtitle { animation: galleryFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.75s both; }
    .gl-hero-scroll { animation: galleryFadeUp 0.5s ease 1.5s both, galleryScrollHint 2s ease-in-out 2s infinite; }

    .gl-tab-btn {
        font-family: 'Montserrat', sans-serif;
        font-size: 10px;
        font-weight: 500;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: rgba(245,240,232,0.4);
        padding: 10px 20px;
        background: none;
        border: none;
        cursor: pointer;
        position: relative;
        transition: color 0.3s ease;
        white-space: nowrap;
    }
    .gl-tab-btn::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        width: 0;
        height: 1.5px;
        background: #C9A84C;
        transform: translateX(-50%);
        transition: width 0.35s cubic-bezier(0.22,1,0.36,1);
    }
    .gl-tab-btn:hover, .gl-tab-btn.active {
        color: #C9A84C;
    }
    .gl-tab-btn.active::after {
        width: 100%;
    }

    .gl-gallery-item {
        position: relative;
        overflow: hidden;
        cursor: pointer;
        break-inside: avoid;
        margin-bottom: 12px;
        border-radius: 2px;
        background: #141414;
    }
    .gl-gallery-item img {
        transition: transform 0.7s cubic-bezier(0.22,1,0.36,1), filter 0.4s ease;
        display: block;
        width: 100%;
        filter: brightness(0.85) saturate(0.85);
    }
    .gl-gallery-item:hover img {
        transform: scale(1.06);
        filter: brightness(0.55) saturate(0.7);
    }

    .gl-gallery-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(to top, rgba(13,13,13,0.9) 0%, rgba(13,13,13,0.2) 50%, transparent 100%);
        opacity: 0;
        transition: opacity 0.4s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
        padding: 20px 16px;
        pointer-events: none;
    }
    .gl-gallery-item:hover .gl-gallery-overlay {
        opacity: 1;
    }

    .gl-gallery-item-title {
        font-family: 'Cormorant Garamond', serif;
        font-size: clamp(14px, 1.5vw, 18px);
        font-weight: 500;
        color: #F5F0E8;
        text-align: center;
        margin-bottom: 8px;
        transform: translateY(10px);
        opacity: 0;
        transition: transform 0.4s ease 0.05s, opacity 0.4s ease 0.05s;
    }
    .gl-gallery-item:hover .gl-gallery-item-title {
        transform: translateY(0);
        opacity: 1;
    }

    .gl-gallery-zoom-icon {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.7);
        opacity: 0;
        transition: opacity 0.3s ease, transform 0.3s ease;
    }
    .gl-gallery-item:hover .gl-gallery-zoom-icon {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
    }

    .gl-gallery-category {
        position: absolute;
        top: 10px;
        left: 10px;
        font-family: 'Montserrat', sans-serif;
        font-size: 9px;
        font-weight: 600;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: #C9A84C;
        background: rgba(13,13,13,0.75);
        backdrop-filter: blur(6px);
        padding: 3px 8px;
        border: 1px solid rgba(201,168,76,0.2);
        transform: translateY(-6px);
        opacity: 0;
        transition: transform 0.3s ease 0.05s, opacity 0.3s ease 0.05s;
    }
    .gl-gallery-item:hover .gl-gallery-category {
        transform: translateY(0);
        opacity: 1;
    }

    .gl-lightbox-overlay {
        position: fixed;
        inset: 0;
        background: rgba(10,8,6,0.97);
        backdrop-filter: blur(16px);
        z-index: 100;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        animation: galleryOverlayIn 0.25s ease forwards;
    }

    .gl-lightbox-img {
        max-width: 100%;
        max-height: 80vh;
        object-fit: contain;
        border-radius: 2px;
        box-shadow: 0 32px 80px rgba(0,0,0,0.6);
        animation: galleryLightboxIn 0.3s cubic-bezier(0.22,1,0.36,1) forwards;
    }

    .gl-lightbox-close {
        position: absolute;
        top: 20px;
        right: 20px;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(245,240,232,0.12);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.25s ease, border-color 0.25s ease;
        color: rgba(245,240,232,0.7);
    }
    .gl-lightbox-close:hover {
        background: rgba(201,168,76,0.2);
        border-color: rgba(201,168,76,0.4);
        color: #C9A84C;
    }

    .gl-lightbox-nav {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(245,240,232,0.12);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.25s ease, border-color 0.25s ease;
        color: rgba(245,240,232,0.7);
    }
    .gl-lightbox-nav:hover {
        background: rgba(201,168,76,0.2);
        border-color: rgba(201,168,76,0.4);
        color: #C9A84C;
    }

    @media (max-width: 767px) {
        .gl-tab-btn { padding: 8px 12px; font-size: 9px; }
        .gl-tabs-wrap { overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none; }
        .gl-tabs-wrap::-webkit-scrollbar { display: none; }
        .gl-lightbox-nav { width: 40px; height: 40px; }
        .gl-lightbox-close { width: 40px; height: 40px; top: 12px; right: 12px; }
    }
    @media (prefers-reduced-motion: reduce) {
        .gl-hero-eyebrow, .gl-hero-title, .gl-hero-rule, .gl-hero-subtitle,
        .gl-hero-scroll, .gl-gallery-item img, .gl-gallery-overlay,
        .gl-gallery-item-title, .gl-gallery-zoom-icon, .gl-gallery-category { animation: none !important; transition: none !important; }
        .gl-gallery-overlay { opacity: 1; }
        .gl-gallery-item-title, .gl-gallery-zoom-icon, .gl-gallery-category { opacity: 1; transform: none; }
    }
`;

interface GalleryItem {
    id: string;
    title: string | null;
    imageUrl: string;
    fullImageUrl?: string;
    category: string;
    altText: string | null;
}

interface GalleryPageClientProps {
    items: GalleryItem[];
    categories: { key: string; label: string }[];
    heroTag: string;
    heroDesc: string;
    noImages: string;
}

export default function GalleryPageClient({ items, categories, heroTag, heroDesc, noImages }: GalleryPageClientProps) {
    const [activeCategory, setActiveCategory] = useState("ALL");
    const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);
    const [lightboxIdx, setLightboxIdx] = useState(0);
    const gridRef = useRef<HTMLDivElement>(null);

    const filtered = activeCategory === "ALL"
        ? items
        : items.filter(i => i.category === activeCategory);

    const closeLightbox = useCallback(() => setLightboxItem(null), []);
    const goNext = useCallback(() => {
        const next = (lightboxIdx + 1) % filtered.length;
        setLightboxItem(filtered[next]);
        setLightboxIdx(next);
    }, [lightboxIdx, filtered]);
    const goPrev = useCallback(() => {
        const prev = (lightboxIdx - 1 + filtered.length) % filtered.length;
        setLightboxItem(filtered[prev]);
        setLightboxIdx(prev);
    }, [lightboxIdx, filtered]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (!lightboxItem) return;
            if (e.key === "Escape") closeLightbox();
            if (e.key === "ArrowRight") goNext();
            if (e.key === "ArrowLeft") goPrev();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [lightboxItem, closeLightbox, goNext, goPrev]);

    useEffect(() => {
        document.body.style.overflow = lightboxItem ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [lightboxItem]);

    useEffect(() => {
        if (!gridRef.current) return;
        const observer = new IntersectionObserver(
            (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("gl-item-visible"); }),
            { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
        );
        gridRef.current.querySelectorAll(".gl-gallery-item").forEach((el, i) => {
            (el as HTMLElement).style.transitionDelay = `${Math.min(i * 50, 600)}ms`;
            observer.observe(el);
        });
        return () => observer.disconnect();
    }, [activeCategory]);

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: CSS }} />

            {/* ── HERO ── */}
            <section style={{
                position: "relative",
                minHeight: "70dvh",
                display: "flex",
                alignItems: "flex-end",
                background: "#0D0D0D",
                overflow: "hidden",
            }}>
                <div style={{
                    position: "absolute", inset: 0,
                    background: "radial-gradient(ellipse at 30% 40%, rgba(201,168,76,0.05) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(201,168,76,0.03) 0%, transparent 50%)",
                }} />
                <div style={{
                    position: "absolute",
                    bottom: "20%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 500,
                    height: 300,
                    background: "radial-gradient(ellipse at center, rgba(201,168,76,0.05) 0%, transparent 70%)",
                }} />

                <div style={{
                    position: "relative",
                    zIndex: 2,
                    padding: "clamp(32px, 6vw, 80px)",
                    width: "100%",
                }}>
                    <div style={{ maxWidth: 700 }}>
                        <p className="gl-hero-eyebrow" style={{
                            fontFamily: "'Montserrat', sans-serif",
                            fontSize: 11,
                            fontWeight: 500,
                            letterSpacing: "0.3em",
                            textTransform: "uppercase",
                            color: "#C9A84C",
                            marginBottom: 20,
                        }}>
                            {heroTag}
                        </p>
                        <h1 className="gl-hero-title" style={{
                            fontFamily: "'Cormorant Garamond', serif",
                            fontSize: "clamp(52px, 8vw, 100px)",
                            fontWeight: 600,
                            color: "#F5F0E8",
                            lineHeight: 1.0,
                            letterSpacing: "-0.025em",
                            margin: 0,
                        }}>
                            Beauty Gallery
                        </h1>
                        <div className="gl-hero-rule" style={{
                            height: 1.5,
                            background: "linear-gradient(90deg, #C9A84C, #E2C97E)",
                            marginTop: 20,
                            boxShadow: "0 0 12px rgba(201,168,76,0.4)",
                        }} />
                        <p className="gl-hero-subtitle" style={{
                            fontFamily: "'Montserrat', sans-serif",
                            fontSize: 16,
                            fontWeight: 300,
                            color: "rgba(245,240,232,0.6)",
                            lineHeight: 1.65,
                            marginTop: 20,
                            maxWidth: 460,
                        }}>
                            {heroDesc}
                        </p>
                    </div>
                </div>

                <div
                    className="gl-hero-scroll"
                    style={{
                        position: "absolute",
                        bottom: 36,
                        left: "50%",
                        transform: "translateX(-50%)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 6,
                        cursor: "pointer",
                    }}
                    onClick={() => window.scrollBy({ top: window.innerHeight * 0.7, behavior: "smooth" })}
                >
                    <span style={{
                        fontFamily: "'Montserrat', sans-serif",
                        fontSize: 9,
                        fontWeight: 500,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        color: "rgba(245,240,232,0.25)",
                    }}>Scroll</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(201,168,76,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 5v14M5 12l7 7 7-7" />
                    </svg>
                </div>
            </section>

            {/* ── GALLERY SECTION ── */}
            <section style={{
                background: "#0D0D0D",
                padding: "clamp(48px, 8vw, 96px) clamp(16px, 5vw, 80px)",
            }}>
                <div style={{ maxWidth: 1320, margin: "0 auto" }}>
                    {/* Category tabs */}
                    <div
                        className="gl-tabs-wrap"
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            flexWrap: "wrap",
                            marginBottom: "clamp(32px, 5vw, 56px)",
                            borderBottom: "1px solid #2A2A2A",
                        }}
                    >
                        {categories.map(cat => (
                            <button
                                key={cat.key}
                                className={`gl-tab-btn ${activeCategory === cat.key ? "active" : ""}`}
                                onClick={() => setActiveCategory(cat.key)}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Masonry grid */}
                    {filtered.length === 0 ? (
                        <div style={{
                            textAlign: "center",
                            padding: "80px 20px",
                            color: "rgba(245,240,232,0.4)",
                            fontFamily: "'Montserrat', sans-serif",
                            fontSize: 14,
                        }}>
                            {noImages}
                        </div>
                    ) : (
                        <div ref={gridRef}>
                            <style>{`
                                .gl-masonry { columns: 2; column-gap: 12px; }
                                @media (min-width: 640px) { .gl-masonry { columns: 3; } }
                                @media (min-width: 1024px) { .gl-masonry { columns: 4; } }
                                .gl-gallery-item {
                                    opacity: 0;
                                    transform: translateY(24px);
                                    transition: opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1);
                                }
                                .gl-gallery-item.gl-item-visible {
                                    opacity: 1;
                                    transform: translateY(0);
                                }
                                @media (prefers-reduced-motion: reduce) {
                                    .gl-gallery-item { opacity: 1 !important; transform: none !important; }
                                }
                            `}</style>
                            <div className="gl-masonry">
                                {filtered.map((item, i) => (
                                    <div
                                        key={item.id}
                                        className="gl-gallery-item"
                                        onClick={() => { setLightboxItem(item); setLightboxIdx(i); }}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={item.imageUrl}
                                            alt={item.altText || item.title || "Gallery"}
                                            loading="lazy"
                                            decoding="async"
                                        />
                                        <div className="gl-gallery-category">
                                            {categories.find(c => c.key === item.category)?.label || item.category}
                                        </div>
                                        <div className="gl-gallery-zoom-icon">
                                            <ZoomIn size={32} color="#C9A84C" strokeWidth={1.5} />
                                        </div>
                                        <div className="gl-gallery-overlay">
                                            {item.title && <p className="gl-gallery-item-title">{item.title}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* ── LIGHTBOX ── */}
            {lightboxItem && (
                <div
                    className="gl-lightbox-overlay"
                    onClick={closeLightbox}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Image lightbox"
                >
                    <button className="gl-lightbox-close" onClick={closeLightbox} aria-label="Close">
                        <X size={18} color="currentColor" strokeWidth={1.5} />
                    </button>

                    {filtered.length > 1 && (
                        <button
                            className="gl-lightbox-nav"
                            style={{ left: "clamp(12px, 3vw, 40px)" }}
                            onClick={(e) => { e.stopPropagation(); goPrev(); }}
                            aria-label="Previous"
                        >
                            <ChevronLeft size={20} color="currentColor" strokeWidth={1.5} />
                        </button>
                    )}

                    <div style={{ maxWidth: 900, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            key={lightboxItem.id}
                            src={lightboxItem.fullImageUrl ?? lightboxItem.imageUrl}
                            alt={lightboxItem.altText || lightboxItem.title || "Gallery"}
                            className="gl-lightbox-img"
                        />
                        {lightboxItem.title && (
                            <p style={{
                                fontFamily: "'Cormorant Garamond', serif",
                                fontSize: 18,
                                fontStyle: "italic",
                                color: "rgba(245,240,232,0.7)",
                                marginTop: 16,
                            }}>
                                {lightboxItem.title}
                            </p>
                        )}
                        {filtered.length > 1 && (
                            <p style={{
                                fontFamily: "'Montserrat', sans-serif",
                                fontSize: 11,
                                color: "rgba(245,240,232,0.3)",
                                marginTop: 6,
                                letterSpacing: "0.1em",
                            }}>
                                {lightboxIdx + 1} / {filtered.length}
                            </p>
                        )}
                    </div>

                    {filtered.length > 1 && (
                        <button
                            className="gl-lightbox-nav"
                            style={{ right: "clamp(12px, 3vw, 40px)" }}
                            onClick={(e) => { e.stopPropagation(); goNext(); }}
                            aria-label="Next"
                        >
                            <ChevronRight size={20} color="currentColor" strokeWidth={1.5} />
                        </button>
                    )}
                </div>
            )}
        </>
    );
}
