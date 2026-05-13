"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, ArrowRight, Scissors, Sparkles, Palette, Gem, Flower2, Heart, GraduationCap, Users } from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    HAIR_STYLING: <Scissors size={16} color="#C9A84C" strokeWidth={1.5} />,
    HAIR_TREATMENTS: <Sparkles size={16} color="#C9A84C" strokeWidth={1.5} />,
    SKIN_CARE: <Sparkles size={16} color="#C9A84C" strokeWidth={1.5} />,
    MAKEUP: <Palette size={16} color="#C9A84C" strokeWidth={1.5} />,
    NAIL_CARE: <Gem size={16} color="#C9A84C" strokeWidth={1.5} />,
    WAXING: <Flower2 size={16} color="#C9A84C" strokeWidth={1.5} />,
    BODY_TREATMENTS: <Heart size={16} color="#C9A84C" strokeWidth={1.5} />,
    BRIDAL: <Sparkles size={16} color="#C9A84C" strokeWidth={1.5} />,
    ACADEMY: <GraduationCap size={16} color="#C9A84C" strokeWidth={1.5} />,
};

const CATEGORY_IMAGES: Record<string, string> = {
    HAIR_STYLING: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&h=360&fit=crop&q=85",
    HAIR_TREATMENTS: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&h=360&fit=crop&q=85",
    SKIN_CARE: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&h=360&fit=crop&q=85",
    MAKEUP: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=500&h=360&fit=crop&q=85",
    NAIL_CARE: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500&h=360&fit=crop&q=85",
    WAXING: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=500&h=360&fit=crop&q=85",
    BODY_TREATMENTS: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&h=360&fit=crop&q=85",
    BRIDAL: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=500&h=360&fit=crop&q=85",
    ACADEMY: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=500&h=360&fit=crop&q=85",
};

const STAT_ITEMS = [
    { value: 30, suffix: "+", label: "Services" },
    { value: 9, suffix: "", label: "Categories" },
    { value: 15, suffix: "+", label: "Years" },
    { value: 365, suffix: "", label: "Days Open" },
];

// ── Gender Toggle ─────────────────────────────────────────────────────────────

function GenderToggle({ priceMale, priceFemale }: { priceMale: number; priceFemale: number }) {
    const [gender, setGender] = useState<"MALE" | "FEMALE">("FEMALE");

    return (
        <div style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
        }}>
            <span style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: 10,
                fontWeight: 500,
                color: "rgba(245,240,232,0.4)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
            }}>
                For
            </span>
            <div style={{
                display: "flex",
                background: "#1E1E1E",
                border: "1px solid #2A2A2A",
                borderRadius: 4,
                padding: 2,
                gap: 0,
            }}>
                {(["FEMALE", "MALE"] as const).map((g) => (
                    <button
                        key={g}
                        onClick={() => setGender(g)}
                        style={{
                            background: gender === g ? "#C9A84C" : "transparent",
                            border: "none",
                            borderRadius: 3,
                            padding: "3px 10px",
                            cursor: "pointer",
                            fontFamily: "'Montserrat', sans-serif",
                            fontSize: 10,
                            fontWeight: 600,
                            letterSpacing: "0.08em",
                            color: gender === g ? "#0D0D0D" : "rgba(245,240,232,0.5)",
                            transition: "all 0.2s ease",
                        }}
                    >
                        {g === "FEMALE" ? "Female" : "Male"}
                    </button>
                ))}
            </div>
            <span style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: 13,
                fontWeight: 600,
                color: "#C9A84C",
                letterSpacing: "0.02em",
            }}>
                ₹{(gender === "MALE" ? priceMale : priceFemale).toLocaleString("en-IN")}
            </span>
        </div>
    );
}

const CSS = `
    @keyframes svcFadeUp {
        from { opacity: 0; transform: translateY(24px); }
        to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes svcScrollHint {
        0%, 100% { transform: translateY(0); }
        50%       { transform: translateY(8px); }
    }
    .svc-hero-eyebrow { animation: svcFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.2s both; }
    .svc-hero-title { animation: svcFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.45s both; }
    .svc-hero-rule { animation: svcFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.6s both; width: 0; }
    .svc-hero-subtitle { animation: svcFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.75s both; }
    .svc-hero-stats { animation: svcFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.9s both; }
    .svc-hero-scroll { animation: svcFadeUp 0.5s ease 1.5s both, svcScrollHint 2s ease-in-out 2s infinite; }

    .svc-stat-item {
        opacity: 0;
        transform: translateY(12px);
        transition: opacity 0.5s ease, transform 0.5s ease;
    }
    .svc-stat-item.svc-stat-visible {
        opacity: 1;
        transform: translateY(0);
    }

    .svc-tab-btn {
        font-family: 'Montserrat', sans-serif;
        font-size: 10px;
        font-weight: 500;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: rgba(245,240,232,0.45);
        padding: 10px 20px;
        background: none;
        border: none;
        cursor: pointer;
        position: relative;
        transition: color 0.3s ease;
        white-space: nowrap;
    }
    .svc-tab-btn::after {
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
    .svc-tab-btn:hover, .svc-tab-btn.active {
        color: #C9A84C;
    }
    .svc-tab-btn.active::after {
        width: 100%;
    }

    .svc-card {
        background: #1A1A1A;
        border: 1px solid #2A2A2A;
        overflow: hidden;
        transition: border-color 0.4s ease, box-shadow 0.4s ease, transform 0.5s cubic-bezier(0.22,1,0.36,1);
        display: flex;
        flex-direction: column;
        text-decoration: none;
    }
    .svc-card:hover {
        border-color: rgba(201,168,76,0.4);
        box-shadow: 0 16px 48px rgba(0,0,0,0.4), 0 0 24px rgba(201,168,76,0.06);
        transform: translateY(-6px);
    }
    .svc-card-img {
        transition: transform 0.7s cubic-bezier(0.22,1,0.36,1);
    }
    .svc-card:hover .svc-card-img {
        transform: scale(1.06);
    }

    .svc-card-desc {
        opacity: 0;
        transform: translateY(8px);
        max-height: 0;
        overflow: hidden;
        transition: opacity 0.35s ease, transform 0.35s ease, max-height 0.4s ease, padding 0.4s ease;
        padding-bottom: 0;
    }
    .svc-card:hover .svc-card-desc {
        opacity: 1;
        transform: translateY(0);
        max-height: 60px;
    }

    .svc-book-cta {
        transform: translateY(100%);
        transition: transform 0.35s cubic-bezier(0.22,1,0.36,1);
    }
    .svc-card:hover .svc-book-cta {
        transform: translateY(0);
    }

    .svc-reveal {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1);
    }
    .svc-reveal.revealed {
        opacity: 1;
        transform: translateY(0);
    }

    .svc-cta-btn {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 14px 32px;
        background: transparent;
        border: 1.5px solid #C9A84C;
        color: #C9A84C;
        font-family: 'Montserrat', sans-serif;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        cursor: pointer;
        transition: all 0.35s ease;
        text-decoration: none;
    }
    .svc-cta-btn:hover {
        background: #C9A84C;
        color: #0D0D0D;
    }

    @media (max-width: 767px) {
        .svc-tab-btn { padding: 8px 14px; font-size: 9px; }
        .svc-tabs-wrap { overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none; }
        .svc-tabs-wrap::-webkit-scrollbar { display: none; }
    }
    @media (prefers-reduced-motion: reduce) {
        .svc-hero-eyebrow, .svc-hero-title, .svc-hero-rule, .svc-hero-subtitle,
        .svc-hero-stats, .svc-hero-scroll, .svc-stat-item, .svc-reveal {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
        }
        .svc-card-img { transition: none !important; }
        .svc-card-desc, .svc-book-cta { transform: none !important; opacity: 1 !important; max-height: none !important; }
        .svc-tab-btn::after { transition: none !important; }
    }
`;

interface ServiceData {
    id: string;
    name: string;
    slug: string;
    price: number;
    priceMax: number | null;
    priceMale?: number | null;
    note?: string | null;
    duration: number;
    category: string;
    isFeatured: boolean;
    imageUrl: string | null;
}

interface CourseData {
    id: string;
    name: string;
    slug: string;
    price: number;
    duration: string;
    maxStudents: number;
    description: string | null;
    imageUrl: string | null;
    isFeatured: boolean;
    isActive: boolean;
    enrolledCount: number;
}

interface ServicesPageClientProps {
    services: ServiceData[];
    courses: CourseData[];
    categories: { key: string; label: string }[];
    initialCategory: string;
    featuredLabel: string;
    bookNowLabel: string;
}

function useCountUp(target: number, active: boolean) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!active) return;
        if (target === 0) { setCount(0); return; }
        const start = performance.now();
        const duration = 1800;
        const frame = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
    }, [active, target]);
    return count;
}

function StatItem({ value, suffix, label, delay, active }: { value: number; suffix: string; label: string; delay: number; active: boolean }) {
    const count = useCountUp(value, active);
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 6,
            padding: "clamp(8px, 2vw, 16px) clamp(20px, 4vw, 48px)",
            opacity: active ? 1 : 0,
            transform: active ? "translateY(0)" : "translateY(12px)",
            transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
        }}>
            <div style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(22px, 3vw, 32px)",
                fontWeight: 600,
                color: "#F5F0E8",
                lineHeight: 1,
            }}>
                {count}{suffix}
            </div>
            <div style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#888888",
            }}>
                {label}
            </div>
        </div>
    );
}

export default function ServicesPageClient({ services, courses, categories, initialCategory, featuredLabel, bookNowLabel }: ServicesPageClientProps) {
    const [activeCategory, setActiveCategory] = useState(initialCategory);
    const statsRef = useRef<HTMLDivElement>(null);
    const [statsActive, setStatsActive] = useState(false);
    const gridRef = useRef<HTMLDivElement>(null);
    const revealObserverRef = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setStatsActive(true); observer.disconnect(); } },
            { threshold: 0.3 }
        );
        if (statsRef.current) observer.observe(statsRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (revealObserverRef.current) revealObserverRef.current.disconnect();
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("revealed"); observer.unobserve(e.target); } });
            },
            { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
        );
        revealObserverRef.current = observer;
        requestAnimationFrame(() => {
            if (gridRef.current) {
                gridRef.current.querySelectorAll(".svc-reveal").forEach(el => observer.observe(el));
            }
        });
        return () => observer.disconnect();
    }, [activeCategory]);

    const filtered = activeCategory === "ALL"
        ? services
        : services.filter(s => s.category === activeCategory);

    const showCourses = activeCategory === "ACADEMY";
    const filteredCourses = showCourses ? courses : [];

    const formatPrice = (p: number) =>
        new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(p).replace("₹", "₹");

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: CSS }} />

            {/* ── HERO ── */}
            <section style={{
                position: "relative",
                minHeight: "80dvh",
                display: "flex",
                alignItems: "flex-end",
                background: "#0D0D0D",
                overflow: "hidden",
            }}>
                {/* Background atmosphere */}
                <div style={{
                    position: "absolute", inset: 0,
                    background: "radial-gradient(ellipse at 70% 30%, rgba(201,168,76,0.05) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(201,168,76,0.03) 0%, transparent 50%)",
                }} />
                <div style={{
                    position: "absolute",
                    top: "15%",
                    right: "5%",
                    width: 400,
                    height: 400,
                    background: "radial-gradient(ellipse, rgba(201,168,76,0.06) 0%, transparent 70%)",
                    borderRadius: "50%",
                }} />

                <div style={{
                    position: "relative",
                    zIndex: 2,
                    padding: "clamp(32px, 6vw, 80px)",
                    width: "100%",
                }}>
                    <div style={{ maxWidth: 800 }}>
                        <p className="svc-hero-eyebrow" style={{
                            fontFamily: "'Montserrat', sans-serif",
                            fontSize: 11,
                            fontWeight: 500,
                            letterSpacing: "0.3em",
                            textTransform: "uppercase",
                            color: "#C9A84C",
                            marginBottom: 20,
                        }}>
                            ANAND BAZAR, INDORE
                        </p>
                        <h1 className="svc-hero-title" style={{
                            fontFamily: "'Cormorant Garamond', serif",
                            fontSize: "clamp(52px, 8vw, 100px)",
                            fontWeight: 600,
                            color: "#F5F0E8",
                            lineHeight: 1.0,
                            letterSpacing: "-0.025em",
                            margin: 0,
                        }}>
                            Our Services
                        </h1>
                        <div className="svc-hero-rule" style={{
                            height: 1.5,
                            background: "linear-gradient(90deg, #C9A84C, #E2C97E)",
                            marginTop: 20,
                            boxShadow: "0 0 12px rgba(201,168,76,0.4)",
                        }} />
                        <p className="svc-hero-subtitle" style={{
                            fontFamily: "'Montserrat', sans-serif",
                            fontSize: 16,
                            fontWeight: 300,
                            color: "rgba(245,240,232,0.6)",
                            lineHeight: 1.65,
                            marginTop: 20,
                            maxWidth: 480,
                        }}>
                            From hair transformations to bridal glam — discover our complete range of premium beauty services.
                        </p>
                    </div>
                </div>

                {/* Scroll hint */}
                <div
                    className="svc-hero-scroll"
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
                    onClick={() => window.scrollBy({ top: window.innerHeight * 0.8, behavior: "smooth" })}
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

            {/* ── STATS STRIP ── */}
            <section style={{
                background: "#141414",
                borderTop: "1px solid #2A2A2A",
                borderBottom: "1px solid #2A2A2A",
                padding: "clamp(20px, 4vw, 44px) clamp(16px, 4vw, 48px)",
            }}>
                <div
                    ref={statsRef}
                    style={{
                        maxWidth: 1320,
                        margin: "0 auto",
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {STAT_ITEMS.map((stat, i) => (
                        <div key={stat.label} style={{ display: "flex", alignItems: "center" }}>
                            <StatItem {...stat} delay={i * 100} active={statsActive} />
                            {i < STAT_ITEMS.length - 1 && (
                                <div style={{
                                    width: 1,
                                    height: 32,
                                    background: "rgba(201,168,76,0.2)",
                                    margin: "0 clamp(16px, 3vw, 40px)",
                                    flexShrink: 0,
                                }} />
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CATEGORY TABS + GRID ── */}
            <section style={{
                background: "#0D0D0D",
                padding: "clamp(48px, 8vw, 96px) clamp(16px, 5vw, 80px)",
            }}>
                <div style={{ maxWidth: 1320, margin: "0 auto" }}>
                    {/* Tabs */}
                    <div
                        className="svc-tabs-wrap"
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            flexWrap: "wrap",
                            marginBottom: "clamp(32px, 5vw, 56px)",
                            borderBottom: "1px solid #2A2A2A",
                            paddingBottom: 0,
                        }}
                    >
                        {categories.map(cat => (
                            <button
                                key={cat.key}
                                className={`svc-tab-btn ${activeCategory === cat.key ? "active" : ""}`}
                                onClick={() => {
                                    setActiveCategory(cat.key);
                                    setTimeout(() => {
                                        gridRef.current?.querySelectorAll(".svc-reveal").forEach((el, i) => {
                                            setTimeout(() => el.classList.add("revealed"), i * 60);
                                        });
                                    }, 50);
                                }}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Bento-style grid — bridal featured large */}
                    <div ref={gridRef}>
                        {showCourses ? (
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                                gap: 20,
                            }}>
                                {filteredCourses.length === 0 ? (
                                    <div style={{
                                        gridColumn: "1 / -1",
                                        textAlign: "center",
                                        padding: "80px 20px",
                                        color: "rgba(245,240,232,0.4)",
                                        fontFamily: "'Montserrat', sans-serif",
                                        fontSize: 14,
                                    }}>
                                        No courses available currently.
                                    </div>
                                ) : (
                                    filteredCourses.map((course, i) => {
                                        const spotsLeft = Math.max(0, course.maxStudents - course.enrolledCount);
                                        return (
                                            <Link
                                                key={course.id}
                                                href={`/academy/${course.id}`}
                                                className="svc-reveal"
                                                style={{
                                                    textDecoration: "none",
                                                    transitionDelay: `${i * 60}ms`,
                                                }}
                                            >
                                                <article className="svc-card" style={{
                                                    background: "#1A1A1A",
                                                    border: "1px solid #2A2A2A",
                                                    borderRadius: 2,
                                                    overflow: "hidden",
                                                    transition: "transform 0.4s ease, box-shadow 0.4s ease",
                                                }}>
                                                    <div style={{
                                                        position: "relative",
                                                        aspectRatio: "16/10",
                                                        overflow: "hidden",
                                                        background: "#141414",
                                                    }}>
                                                        {course.imageUrl ? (
                                                            <Image
                                                                src={course.imageUrl}
                                                                alt={course.name}
                                                                fill
                                                                className="svc-card-img"
                                                                style={{ objectFit: "cover", filter: "brightness(0.7) saturate(0.9)" }}
                                                                unoptimized
                                                            />
                                                        ) : (
                                                            <div style={{
                                                                width: "100%",
                                                                height: "100%",
                                                                background: "linear-gradient(135deg, rgba(201,168,76,0.1) 0%, rgba(183,110,121,0.1) 100%)",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                            }}>
                                                                <GraduationCap size={40} color="rgba(201,168,76,0.2)" />
                                                            </div>
                                                        )}
                                                        <div style={{
                                                            position: "absolute",
                                                            inset: 0,
                                                            background: "linear-gradient(to top, rgba(13,13,13,0.8) 0%, transparent 50%)",
                                                        }} />
                                                        {course.isFeatured && (
                                                            <div style={{
                                                                position: "absolute",
                                                                top: 12,
                                                                right: 12,
                                                                background: "#C9A84C",
                                                                padding: "3px 10px",
                                                            }}>
                                                                <span style={{
                                                                    fontFamily: "'Montserrat', sans-serif",
                                                                    fontSize: 9,
                                                                    fontWeight: 600,
                                                                    letterSpacing: "0.14em",
                                                                    textTransform: "uppercase",
                                                                    color: "#0D0D0D",
                                                                }}>
                                                                    ★ Featured
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div style={{ padding: "20px" }}>
                                                        <h3 style={{
                                                            fontFamily: "'Cormorant Garamond', serif",
                                                            fontSize: 20,
                                                            fontWeight: 600,
                                                            color: "#F5F0E8",
                                                            lineHeight: 1.3,
                                                            marginBottom: 8,
                                                        }}>
                                                            {course.name}
                                                        </h3>
                                                        {course.description && (
                                                            <p style={{
                                                                fontFamily: "'Montserrat', sans-serif",
                                                                fontSize: 12,
                                                                color: "rgba(245,240,232,0.5)",
                                                                lineHeight: 1.6,
                                                                marginBottom: 12,
                                                                display: "-webkit-box",
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient: "vertical",
                                                                overflow: "hidden",
                                                            }}>
                                                                {course.description}
                                                            </p>
                                                        )}
                                                        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                                <Clock size={14} color="rgba(245,240,232,0.4)" />
                                                                <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 11, color: "rgba(245,240,232,0.5)" }}>
                                                                    {course.duration}
                                                                </span>
                                                            </div>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                                <Users size={14} color="rgba(245,240,232,0.4)" />
                                                                <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 11, color: "rgba(245,240,232,0.5)" }}>
                                                                    Max {course.maxStudents}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                            <span style={{
                                                                fontFamily: "'Cormorant Garamond', serif",
                                                                fontSize: 22,
                                                                fontWeight: 600,
                                                                color: "#C9A84C",
                                                            }}>
                                                                ₹{course.price.toLocaleString("en-IN")}
                                                            </span>
                                                            <span style={{
                                                                fontFamily: "'Montserrat', sans-serif",
                                                                fontSize: 11,
                                                                fontWeight: 500,
                                                                color: "#C9A84C",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: 4,
                                                            }}>
                                                                View Course <ArrowRight size={14} />
                                                            </span>
                                                        </div>
                                                    </div>
                                                </article>
                                            </Link>
                                        );
                                    })
                                )}
                            </div>
                        ) : filtered.length === 0 ? (
                            <div style={{
                                textAlign: "center",
                                padding: "80px 20px",
                                color: "rgba(245,240,232,0.4)",
                                fontFamily: "'Montserrat', sans-serif",
                                fontSize: 14,
                            }}>
                                No services found in this category.
                            </div>
                        ) : (
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                                gap: 16,
                            }}>
                                {filtered.map((svc, i) => {
                                    const img = svc.imageUrl || CATEGORY_IMAGES[svc.category] || CATEGORY_IMAGES.HAIR_STYLING;
                                    const icon = CATEGORY_ICONS[svc.category];
                                    const isBridal = svc.category === "BRIDAL";
                                    return (
                                        <Link
                                            key={svc.id}
                                            href={`/book?service=${svc.slug}`}
                                            className="svc-reveal"
                                            style={{
                                                textDecoration: "none",
                                                transitionDelay: `${i * 60}ms`,
                                            }}
                                        >
                                            <article
                                                className="svc-card"
                                                style={isBridal ? {
                                                    gridColumn: "span 2",
                                                } : undefined}
                                            >
                                                {/* Image */}
                                                <div style={{
                                                    position: "relative",
                                                    aspectRatio: isBridal ? "16/9" : "4/3",
                                                    overflow: "hidden",
                                                    background: "#141414",
                                                }}>
                                                    <Image
                                                        src={img}
                                                        alt={svc.name}
                                                        fill
                                                        className="svc-card-img"
                                                        style={{ objectFit: "cover", filter: "brightness(0.65) saturate(0.8)" }}
                                                        unoptimized
                                                    />
                                                    <div style={{
                                                        position: "absolute",
                                                        inset: 0,
                                                        background: "linear-gradient(to top, rgba(13,13,13,0.7) 0%, transparent 50%)",
                                                    }} />

                                                    {/* Category badge + icon */}
                                                    <div style={{
                                                        position: "absolute",
                                                        top: 12,
                                                        left: 12,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 6,
                                                        background: "rgba(13,13,13,0.7)",
                                                        backdropFilter: "blur(8px)",
                                                        padding: "4px 10px",
                                                        border: "1px solid rgba(201,168,76,0.2)",
                                                    }}>
                                                        <span style={{ color: "#C9A84C" }}>{icon}</span>
                                                        <span style={{
                                                            fontFamily: "'Montserrat', sans-serif",
                                                            fontSize: 9,
                                                            fontWeight: 600,
                                                            letterSpacing: "0.16em",
                                                            textTransform: "uppercase",
                                                            color: "rgba(245,240,232,0.7)",
                                                        }}>
                                                            {categories.find(c => c.key === svc.category)?.label || svc.category}
                                                        </span>
                                                    </div>

                                                    {svc.isFeatured && (
                                                        <div style={{
                                                            position: "absolute",
                                                            top: 12,
                                                            right: 12,
                                                            background: "#C9A84C",
                                                            padding: "3px 10px",
                                                        }}>
                                                            <span style={{
                                                                fontFamily: "'Montserrat', sans-serif",
                                                                fontSize: 9,
                                                                fontWeight: 600,
                                                                letterSpacing: "0.14em",
                                                                textTransform: "uppercase",
                                                                color: "#0D0D0D",
                                                            }}>
                                                        {featuredLabel}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Book CTA slides up */}
                                            <div className="svc-book-cta" style={{
                                                position: "absolute",
                                                bottom: 0,
                                                left: 0,
                                                right: 0,
                                                padding: "14px 16px",
                                                background: "rgba(201,168,76,0.95)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: 6,
                                            }}>
                                                <span style={{
                                                    fontFamily: "'Montserrat', sans-serif",
                                                    fontSize: 10,
                                                    fontWeight: 600,
                                                    letterSpacing: "0.15em",
                                                    textTransform: "uppercase",
                                                    color: "#0D0D0D",
                                                }}>
                                                    {bookNowLabel}
                                                </span>
                                                        <ArrowRight size={12} color="#0D0D0D" />
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div style={{
                                                    padding: "clamp(14px, 2vw, 22px)",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: 8,
                                                    flex: 1,
                                                }}>
                                                    <h3 style={{
                                                        fontFamily: "'Cormorant Garamond', serif",
                                                        fontSize: isBridal ? "clamp(20px, 2.5vw, 28px)" : "clamp(17px, 2vw, 22px)",
                                                        fontWeight: 500,
                                                        color: "#F5F0E8",
                                                        lineHeight: 1.25,
                                                        transition: "color 0.3s ease",
                                                    }}>
                                                        {svc.name}
                                                    </h3>

                                                    {/* Desc on hover */}
                                                    <div className="svc-card-desc" style={{
                                                        fontFamily: "'Montserrat', sans-serif",
                                                        fontSize: 12,
                                                        fontWeight: 300,
                                                        color: "rgba(245,240,232,0.5)",
                                                        lineHeight: 1.6,
                                                    }}>
                                                        {isBridal ? "Complete bridal packages — HD makeup, hairstyling, draping & more." : "Premium service with expert care and precision."}
                                                    </div>

                                                    {/* Price + Duration footer */}
                                                    <div style={{
                                                        marginTop: "auto",
                                                        paddingTop: 12,
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        gap: 6,
                                                        borderTop: "1px solid #2A2A2A",
                                                    }}>
                                                        {/* Gender toggle */}
                                                        {"priceMale" in svc && svc.priceMale !== undefined && svc.priceMale !== null && svc.priceMale !== Number(svc.price) ? (
                                                            <GenderToggle
                                                                priceMale={svc.priceMale}
                                                                priceFemale={svc.price}
                                                            />
                                                        ) : null}

                                                        <div style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "space-between",
                                                        }}>
                                                            <div>
                                                                <span style={{
                                                                    fontFamily: "'Montserrat', sans-serif",
                                                                    fontSize: 15,
                                                                    fontWeight: 600,
                                                                    color: "#C9A84C",
                                                                    letterSpacing: "0.02em",
                                                                }}>
                                                                    ₹{svc.price.toLocaleString("en-IN")}
                                                                </span>
                                                                {svc.priceMax && (
                                                                    <span style={{
                                                                        fontFamily: "'Montserrat', sans-serif",
                                                                        fontSize: 12,
                                                                        fontWeight: 400,
                                                                        color: "rgba(245,240,232,0.4)",
                                                                    }}>
                                                                        {" "}– ₹{svc.priceMax.toLocaleString("en-IN")}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div style={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: 4,
                                                            }}>
                                                                <Clock size={11} color="rgba(201,168,76,0.6)" strokeWidth={1.5} />
                                                                <span style={{
                                                                    fontFamily: "'Montserrat', sans-serif",
                                                                    fontSize: 11,
                                                                    fontWeight: 400,
                                                                    color: "rgba(245,240,232,0.4)",
                                                                }}>
                                                                    {svc.duration} min
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Service note */}
                                                        {"note" in svc && svc.note ? (
                                                            <span style={{
                                                                fontFamily: "'Montserrat', sans-serif",
                                                                fontSize: 10,
                                                                color: "rgba(201,168,76,0.5)",
                                                                letterSpacing: "0.04em",
                                                            }}>
                                                                * {svc.note}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </article>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* CTA at bottom */}
                    <div style={{
                        marginTop: "clamp(48px, 6vw, 80px)",
                        textAlign: "center",
                    }}>
                        <p style={{
                            fontFamily: "'Montserrat', sans-serif",
                            fontSize: 13,
                            fontWeight: 300,
                            color: "rgba(245,240,232,0.5)",
                            marginBottom: 24,
                        }}>
                            Not sure which service is right for you?
                        </p>
                        <Link href="/book" className="svc-cta-btn">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            Book a Consultation
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}
