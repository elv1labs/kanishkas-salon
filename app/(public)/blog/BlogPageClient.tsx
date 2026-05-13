"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";

const CSS = `
    @keyframes blogFadeUp {
        from { opacity: 0; transform: translateY(24px); }
        to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes blogScrollHint {
        0%, 100% { transform: translateY(0); }
        50%       { transform: translateY(8px); }
    }
    .blog-hero-eyebrow { animation: blogFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.2s both; }
    .blog-hero-title { animation: blogFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.45s both; }
    .blog-hero-rule { animation: blogFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.6s both; width: 0; }
    .blog-hero-subtitle { animation: blogFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.75s both; }
    .blog-hero-scroll { animation: blogFadeUp 0.5s ease 1.5s both, blogScrollHint 2s ease-in-out 2s infinite; }

    .blog-tab-btn {
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
        text-decoration: none;
    }
    .blog-tab-btn::after {
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
    .blog-tab-btn:hover, .blog-tab-btn.active {
        color: #C9A84C;
    }
    .blog-tab-btn.active::after {
        width: 100%;
    }

    .blog-post-card {
        background: #1A1A1A;
        border: 1px solid #2A2A2A;
        overflow: hidden;
        transition: border-color 0.4s ease, box-shadow 0.4s ease, transform 0.5s cubic-bezier(0.22,1,0.36,1);
        text-decoration: none;
        display: block;
    }
    .blog-post-card:hover {
        border-color: rgba(201,168,76,0.35);
        box-shadow: 0 16px 48px rgba(0,0,0,0.4), 0 0 24px rgba(201,168,76,0.05);
        transform: translateY(-5px);
    }
    .blog-post-card:hover .blog-card-img {
        transform: scale(1.05);
    }
    .blog-post-card:hover .blog-card-title {
        color: #C9A84C;
    }
    .blog-post-card:hover .blog-read-more {
        gap: 14px;
    }
    .blog-post-card:hover .blog-read-arrow {
        transform: translateX(4px);
    }

    .blog-card-img {
        transition: transform 0.7s cubic-bezier(0.22,1,0.36,1);
        display: block;
        filter: brightness(0.8) saturate(0.85);
    }

    .blog-read-more {
        transition: gap 0.3s ease;
    }

    .blog-read-arrow {
        transition: transform 0.3s ease;
    }

    .blog-reveal {
        opacity: 0;
        transform: translateY(24px);
        transition: opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1);
    }
    .blog-reveal.revealed {
        opacity: 1;
        transform: translateY(0);
    }

    .blog-featured-overlay {
        background: linear-gradient(to right, rgba(13,13,13,0.95) 0%, rgba(13,13,13,0.7) 45%, transparent 100%);
    }

    @media (max-width: 767px) {
        .blog-tab-btn { padding: 8px 12px; font-size: 9px; }
        .blog-tabs-wrap { overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none; }
        .blog-tabs-wrap::-webkit-scrollbar { display: none; }
    }
    @media (prefers-reduced-motion: reduce) {
        .blog-hero-eyebrow, .blog-hero-title, .blog-hero-rule, .blog-hero-subtitle,
        .blog-hero-scroll, .blog-card-img, .blog-read-arrow, .blog-reveal {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
        }
        .blog-post-card { transform: none !important; transition: none !important; }
    }
`;

const FALLBACK_IMAGES: Record<string, string> = {
    "Bridal": "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=800&h=500&fit=crop&q=85",
    "Hair Care": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=500&fit=crop&q=85",
    "Skin Care": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&h=500&fit=crop&q=85",
    "Nail Care": "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=500&fit=crop&q=85",
    "Makeup": "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&h=500&fit=crop&q=85",
    default: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=500&fit=crop&q=85",
};

function getCategoryImage(cat: string | null) {
    return cat ? (FALLBACK_IMAGES[cat] || FALLBACK_IMAGES.default) : FALLBACK_IMAGES.default;
}

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    coverImage: string | null;
    publishedAt: Date | null;
    readTime: number | null;
    category: string | null;
    tags: string[];
    author: { name: string | null; image: string | null };
}

interface BlogPageClientProps {
    posts: BlogPost[];
    categories: string[];
    activeCategory?: string;
    heroTag: string;
    heroTitle: string;
    heroDesc: string;
    allPosts: string;
    noPosts: string;
    minRead: string;
    readCta: string;
    featuredLabel: string;
}

export default function BlogPageClient({
    posts, categories, activeCategory,
    heroTag, heroTitle, heroDesc,
    allPosts, noPosts, minRead, readCta, featuredLabel,
}: BlogPageClientProps) {
    const gridRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!gridRef.current) return;
        const observer = new IntersectionObserver(
            (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("revealed"); }),
            { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
        );
        gridRef.current.querySelectorAll(".blog-reveal").forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, [posts]);

    const [featured, ...restPosts] = posts;
    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    };

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
                    background: "radial-gradient(ellipse at 60% 30%, rgba(201,168,76,0.05) 0%, transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(201,168,76,0.03) 0%, transparent 50%)",
                }} />

                <div style={{
                    position: "relative",
                    zIndex: 2,
                    padding: "clamp(32px, 6vw, 80px)",
                    width: "100%",
                }}>
                    <div style={{ maxWidth: 700 }}>
                        <p className="blog-hero-eyebrow" style={{
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
                        <h1 className="blog-hero-title" style={{
                            fontFamily: "'Cormorant Garamond', serif",
                            fontSize: "clamp(52px, 8vw, 100px)",
                            fontWeight: 600,
                            color: "#F5F0E8",
                            lineHeight: 1.0,
                            letterSpacing: "-0.025em",
                            margin: 0,
                        }}>
                            {heroTitle}
                        </h1>
                        <div className="blog-hero-rule" style={{
                            height: 1.5,
                            background: "linear-gradient(90deg, #C9A84C, #E2C97E)",
                            marginTop: 20,
                            boxShadow: "0 0 12px rgba(201,168,76,0.4)",
                        }} />
                        <p className="blog-hero-subtitle" style={{
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
                    className="blog-hero-scroll"
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

            {/* ── CATEGORY TABS ── */}
            <section style={{
                background: "#141414",
                borderBottom: "1px solid #2A2A2A",
                position: "sticky",
                top: 0,
                zIndex: 20,
            }}>
                <div
                    className="blog-tabs-wrap"
                    style={{
                        maxWidth: 1320,
                        margin: "0 auto",
                        padding: "0 clamp(16px, 4vw, 48px)",
                        display: "flex",
                        justifyContent: "center",
                        flexWrap: "wrap",
                    }}
                >
                    <Link
                        href="/blog"
                        className={`blog-tab-btn ${!activeCategory ? "active" : ""}`}
                    >
                        {allPosts}
                    </Link>
                    {categories.map(cat => (
                        <Link
                            key={cat}
                            href={`/blog?category=${encodeURIComponent(cat)}`}
                            className={`blog-tab-btn ${activeCategory === cat ? "active" : ""}`}
                        >
                            {cat}
                        </Link>
                    ))}
                </div>
            </section>

            {/* ── POSTS ── */}
            <section style={{
                background: "#0D0D0D",
                padding: "clamp(48px, 8vw, 96px) clamp(16px, 5vw, 80px)",
            }}>
                <div style={{ maxWidth: 1320, margin: "0 auto" }}>
                    {posts.length === 0 ? (
                        <div style={{
                            textAlign: "center",
                            padding: "80px 20px",
                            color: "rgba(245,240,232,0.4)",
                            fontFamily: "'Montserrat', sans-serif",
                            fontSize: 14,
                        }}>
                            {noPosts}
                            <div style={{ marginTop: 16 }}>
                                <Link href="/blog" style={{
                                    color: "#C9A84C",
                                    fontFamily: "'Montserrat', sans-serif",
                                    fontSize: 12,
                                    fontWeight: 500,
                                    letterSpacing: "0.1em",
                                    textDecoration: "none",
                                }}>
                                    View all posts
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div ref={gridRef}>
                            {/* ── FEATURED POST — full-width editorial ── */}
                            {featured && (
                                <div className="blog-reveal" style={{ marginBottom: 32 }}>
                                    <Link href={`/blog/${featured.slug}`} className="blog-post-card" style={{
                                        display: "grid",
                                        gridTemplateColumns: "1.2fr 1fr",
                                        minHeight: 360,
                                    }}>
                                        {/* Image */}
                                        <div style={{ position: "relative", overflow: "hidden", background: "#141414" }}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={featured.coverImage || getCategoryImage(featured.category)}
                                                alt={featured.title}
                                                className="blog-card-img"
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                    objectPosition: "center",
                                                    display: "block",
                                                }}
                                            />
                                        </div>
                                        {/* Content */}
                                        <div style={{
                                            padding: "clamp(28px, 4vw, 56px)",
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "center",
                                            gap: 16,
                                            background: "#1A1A1A",
                                        }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                <span style={{
                                                    fontFamily: "'Montserrat', sans-serif",
                                                    fontSize: 9,
                                                    fontWeight: 600,
                                                    letterSpacing: "0.2em",
                                                    textTransform: "uppercase",
                                                    color: "#0D0D0D",
                                                    background: "#C9A84C",
                                                    padding: "3px 10px",
                                                }}>
                                                    {featuredLabel}
                                                </span>
                                                {featured.category && (
                                                    <span style={{
                                                        fontFamily: "'Montserrat', sans-serif",
                                                        fontSize: 9,
                                                        fontWeight: 500,
                                                        letterSpacing: "0.16em",
                                                        textTransform: "uppercase",
                                                        color: "#C9A84C",
                                                    }}>
                                                        {featured.category}
                                                    </span>
                                                )}
                                            </div>
                                            <h2 className="blog-card-title" style={{
                                                fontFamily: "'Cormorant Garamond', serif",
                                                fontSize: "clamp(24px, 3.5vw, 40px)",
                                                fontWeight: 600,
                                                color: "#F5F0E8",
                                                lineHeight: 1.2,
                                                letterSpacing: "-0.01em",
                                                transition: "color 0.3s ease",
                                            }}>
                                                {featured.title}
                                            </h2>
                                            <p style={{
                                                fontFamily: "'Montserrat', sans-serif",
                                                fontSize: 14,
                                                fontWeight: 300,
                                                color: "rgba(245,240,232,0.55)",
                                                lineHeight: 1.7,
                                            }}>
                                                {featured.excerpt}
                                            </p>
                                            <div style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                paddingTop: 16,
                                                borderTop: "1px solid #2A2A2A",
                                                marginTop: 8,
                                            }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                    {featured.readTime && (
                                                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                            <Clock size={11} color="rgba(201,168,76,0.6)" strokeWidth={1.5} />
                                                            <span style={{
                                                                fontFamily: "'Montserrat', sans-serif",
                                                                fontSize: 11,
                                                                color: "rgba(245,240,232,0.4)",
                                                            }}>
                                                                {featured.readTime} {minRead}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <span style={{
                                                        fontFamily: "'Montserrat', sans-serif",
                                                        fontSize: 11,
                                                        color: "rgba(245,240,232,0.3)",
                                                    }}>
                                                        {featured.author?.name || "Kanishka"}
                                                    </span>
                                                </div>
                                                <div className="blog-read-more" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                    <span style={{
                                                        fontFamily: "'Montserrat', sans-serif",
                                                        fontSize: 10,
                                                        fontWeight: 500,
                                                        letterSpacing: "0.12em",
                                                        textTransform: "uppercase",
                                                        color: "#C9A84C",
                                                    }}>
                                                        {readCta}
                                                    </span>
                                                    <ArrowRight size={12} color="#C9A84C" strokeWidth={1.5} className="blog-read-arrow" />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            )}

                            {/* ── POST GRID ── */}
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                                gap: 20,
                            }}>
                                {restPosts.map((post, i) => (
                                    <Link
                                        key={post.id}
                                        href={`/blog/${post.slug}`}
                                        className="blog-post-card blog-reveal"
                                        style={{ transitionDelay: `${(i + 1) * 80}ms` }}
                                    >
                                        {/* Image */}
                                        <div style={{ position: "relative", aspectRatio: "16/10", overflow: "hidden", background: "#141414" }}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={post.coverImage || getCategoryImage(post.category)}
                                                alt={post.title}
                                                className="blog-card-img"
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                    objectPosition: "center",
                                                    display: "block",
                                                }}
                                                loading="lazy"
                                            />
                                            {/* Category badge */}
                                            {post.category && (
                                                <span style={{
                                                    position: "absolute",
                                                    top: 12,
                                                    left: 12,
                                                    fontFamily: "'Montserrat', sans-serif",
                                                    fontSize: 9,
                                                    fontWeight: 600,
                                                    letterSpacing: "0.16em",
                                                    textTransform: "uppercase",
                                                    color: "#0D0D0D",
                                                    background: "#C9A84C",
                                                    padding: "3px 10px",
                                                }}>
                                                    {post.category}
                                                </span>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div style={{ padding: "clamp(16px, 2vw, 24px)" }}>
                                            <h3 className="blog-card-title" style={{
                                                fontFamily: "'Cormorant Garamond', serif",
                                                fontSize: "clamp(18px, 2vw, 24px)",
                                                fontWeight: 600,
                                                color: "#F5F0E8",
                                                lineHeight: 1.3,
                                                marginBottom: 10,
                                                transition: "color 0.3s ease",
                                            }}>
                                                {post.title}
                                            </h3>
                                            <p style={{
                                                fontFamily: "'Montserrat', sans-serif",
                                                fontSize: 13,
                                                fontWeight: 300,
                                                color: "rgba(245,240,232,0.5)",
                                                lineHeight: 1.65,
                                                marginBottom: 16,
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden",
                                            }}>
                                                {post.excerpt}
                                            </p>
                                            <div style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                paddingTop: 12,
                                                borderTop: "1px solid #2A2A2A",
                                            }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                    {post.readTime && (
                                                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                            <Clock size={10} color="rgba(201,168,76,0.6)" strokeWidth={1.5} />
                                                            <span style={{
                                                                fontFamily: "'Montserrat', sans-serif",
                                                                fontSize: 10,
                                                                color: "rgba(245,240,232,0.4)",
                                                            }}>
                                                                {post.readTime} min
                                                            </span>
                                                        </div>
                                                    )}
                                                    <span style={{
                                                        fontFamily: "'Montserrat', sans-serif",
                                                        fontSize: 10,
                                                        color: "rgba(245,240,232,0.3)",
                                                    }}>
                                                        {post.author?.name || "Kanishka"}
                                                    </span>
                                                </div>
                                                <div className="blog-read-more" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    <span style={{
                                                        fontFamily: "'Montserrat', sans-serif",
                                                        fontSize: 9,
                                                        fontWeight: 500,
                                                        letterSpacing: "0.1em",
                                                        textTransform: "uppercase",
                                                        color: "#C9A84C",
                                                    }}>
                                                        Read
                                                    </span>
                                                    <ArrowRight size={11} color="#C9A84C" strokeWidth={1.5} className="blog-read-arrow" />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
