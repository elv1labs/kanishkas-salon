"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

interface HeroSlide {
  id: string;
  imageUrl: string;
  eyebrow: string | null;
  title: string;
  titleItalic: string | null;
  subtitle: string | null;
  ctaLabel: string;
  ctaHref: string;
}

interface CinematicHeroProps {
  slides: HeroSlide[];
}

const CSS = `
  @keyframes heroFadeUp {
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes heroSlideLeft {
    from { opacity: 0; transform: translateX(-50px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes heroSlideRight {
    from { opacity: 0; transform: translateX(50px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes goldRuleDraw {
    from { transform: scaleX(0); transform-origin: left center; }
    to   { transform: scaleX(1); transform-origin: left center; }
  }
  @keyframes heroParallax {
    from { transform: scale(1.08) translateY(0); }
    to   { transform: scale(1.0)  translateY(0); }
  }
  @keyframes heroParallaxExit {
    from { transform: scale(1.0) translateY(0); }
    to   { transform: scale(1.08) translateY(-20px); }
  }

  .hero-eyebrow { animation: heroFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.2s both; }
  .hero-title-1 { animation: heroSlideLeft 0.9s cubic-bezier(0.22,1,0.36,1) 0.4s both; }
  .hero-title-2 { animation: heroSlideRight 0.9s cubic-bezier(0.22,1,0.36,1) 0.6s both; }
  .hero-subtitle { animation: heroFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.85s both; }
  .hero-actions  { animation: heroFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 1.05s both; }
  .hero-stats    { animation: heroFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 1.2s both; }
  .hero-rule     { animation: goldRuleDraw 0.8s cubic-bezier(0.22,1,0.36,1) 0.75s both; }
  .hero-scroll   { animation: heroFadeUp 0.5s ease-out 1.5s both, scrollBounce 2s ease-in-out 2s infinite; }

  @keyframes scrollBounce {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(8px); }
  }

  /* CTA Shimmer button */
  .btn-shimmer {
    position: relative;
    overflow: hidden;
    cursor: pointer;
    background: transparent;
    border: 1.5px solid #C9A84C;
    color: #C9A84C;
    padding: 14px 36px;
    font-family: 'Montserrat', sans-serif;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    transition: color 0.35s ease, border-color 0.35s ease;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .btn-shimmer::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(201,168,76,0.15) 40%, rgba(255,255,255,0.2) 50%, rgba(201,168,76,0.15) 60%, transparent);
    background-size: 200% 100%;
    transform: translateX(-100%);
    transition: transform 0.6s ease;
  }
  .btn-shimmer:hover::before {
    transform: translateX(100%);
  }
  .btn-shimmer:hover {
    color: #0D0D0D;
    background: #C9A84C;
    border-color: #C9A84C;
  }
  .btn-shimmer:active {
    transform: scale(0.97);
  }

  /* Secondary ghost button */
  .btn-ghost {
    cursor: pointer;
    background: transparent;
    border: 1.5px solid rgba(245,240,232,0.3);
    color: #F5F0E8;
    padding: 14px 32px;
    font-family: 'Montserrat', sans-serif;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .btn-ghost:hover {
    border-color: rgba(245,240,232,0.8);
    background: rgba(245,240,232,0.08);
  }
  .btn-ghost:active {
    transform: scale(0.97);
  }

  /* Parallax layer */
  .hero-bg-layer {
    transition: opacity 1.2s ease;
  }
  .hero-bg-layer.entering {
    animation: heroParallax 6s ease-out forwards;
  }
  .hero-bg-layer.exiting {
    animation: heroParallaxExit 1.2s ease-in forwards;
  }

  /* Ken Burns zoom */
  .hero-ken-burns {
    transition: transform 8s ease-out;
    transform: scale(1.06);
  }
  .hero-ken-burns.zoomed {
    transform: scale(1.0);
  }

  /* Progress bar */
  .hero-progress {
    transition: width 0.3s ease;
  }

  @media (prefers-reduced-motion: reduce) {
    .hero-eyebrow, .hero-title-1, .hero-title-2, .hero-subtitle,
    .hero-actions, .hero-stats, .hero-rule, .hero-scroll {
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
    }
    .btn-shimmer::before, .hero-ken-burns {
      animation: none !important;
      transition: none !important;
    }
    .hero-bg-layer { transition: opacity 0.3s ease; }
  }
`;

export default function CinematicHero({ slides }: CinematicHeroProps) {
  const [current, setCurrent] = useState(0);
  const [next, setNext] = useState(-1);
  const [transitioning, setTransitioning] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => setZoomed(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    timerRef.current = setTimeout(() => {
      setNext((current + 1) % slides.length);
      setTransitioning(true);
    }, 6500);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, slides.length]);

  useEffect(() => {
    if (next === -1) return;
    const t = setTimeout(() => {
      setCurrent(next);
      setNext(-1);
      setTransitioning(false);
    }, 1200);
    return () => clearTimeout(t);
  }, [next]);

  if (!slides.length) return null;
  const slide = slides[current];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <section
        style={{
          position: "relative",
          height: "100dvh",
          minHeight: 600,
          overflow: "hidden",
          background: "#0D0D0D",
        }}
      >
        {/* ── BACKGROUND LAYER ── */}
        {slides.map((s, i) => (
          <div
            key={s.id}
            className={`hero-bg-layer ${i === current ? (transitioning ? "exiting" : "entering") : "opacity-0"}`}
            style={{
              position: "absolute",
              inset: 0,
              opacity: i === current && !transitioning ? 1 : 0,
              transition: "opacity 1.2s ease",
              zIndex: 0,
            }}
          >
            <Image
              src={s.imageUrl}
              alt={s.eyebrow ?? s.title}
              fill
              priority={i === 0}
              className={`object-cover ${mounted && i === current ? (zoomed ? "hero-ken-burns zoomed" : "hero-ken-burns") : ""}`}
              style={{ filter: "brightness(0.55) saturate(0.9)" }}
              unoptimized
            />
          </div>
        ))}

        {/* ── MULTI-LAYER GRADIENT OVERLAY ── */}
        {/* Top: very subtle to let hero image breathe */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "25%",
          background: "linear-gradient(to bottom, rgba(13,13,13,0.15) 0%, transparent 100%)",
          zIndex: 1,
        }} />
        {/* Left gradient for text legibility */}
        <div style={{
          position: "absolute", top: 0, left: 0, bottom: 0, width: "55%",
          background: "linear-gradient(to right, rgba(13,13,13,0.7) 0%, rgba(13,13,13,0.4) 50%, transparent 100%)",
          zIndex: 1,
        }} />
        {/* Bottom vignette: dark, pushes up so text reads */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "55%",
          background: "linear-gradient(to top, rgba(13,13,13,0.92) 0%, rgba(13,13,13,0.5) 40%, transparent 100%)",
          zIndex: 1,
        }} />

        {/* ── SUBTLE RADIAL GOLD GLOW (bottom center) ── */}
        <div style={{
          position: "absolute",
          bottom: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "300px",
          background: "radial-gradient(ellipse at center, rgba(201,168,76,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 1,
        }} />

        {/* ── CONTENT ── */}
        <div style={{
          position: "relative",
          zIndex: 2,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "clamp(32px, 5vw, 80px)",
        }}>
          <div style={{ maxWidth: 720 }}>
            {/* Eyebrow */}
            {slide.eyebrow && (
              <p className="hero-eyebrow" style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "#C9A84C",
                marginBottom: 16,
              }}>
                {slide.eyebrow}
              </p>
            )}

            {/* Title Line 1 — slides from left */}
            <h1 className="hero-title-1" style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(44px, 7vw, 88px)",
              fontWeight: 600,
              color: "#F5F0E8",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              margin: 0,
            }}>
              {slide.title}
            </h1>

            {/* Title Line 2 — slides from right (italic feel) */}
            {slide.titleItalic && (
              <h1 className="hero-title-2" style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                fontSize: "clamp(36px, 6vw, 72px)",
                fontWeight: 400,
                color: "#C9A84C",
                lineHeight: 1.1,
                letterSpacing: "-0.01em",
                margin: 0,
                marginTop: "-2px",
              }}>
                {slide.titleItalic}
              </h1>
            )}

            {/* Gold rule — draws itself */}
            <div className="hero-rule" style={{
              width: "clamp(80px, 12vw, 160px)",
              height: 1.5,
              background: "linear-gradient(90deg, #C9A84C, #E2C97E)",
              marginTop: 20,
              marginBottom: 0,
              boxShadow: "0 0 12px rgba(201,168,76,0.4)",
            }} />

            {/* Subtitle */}
            {slide.subtitle && (
              <p className="hero-subtitle" style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: 15,
                fontWeight: 300,
                color: "rgba(245,240,232,0.65)",
                lineHeight: 1.6,
                marginTop: 20,
                maxWidth: 480,
              }}>
                {slide.subtitle}
              </p>
            )}

            {/* CTA Buttons */}
            <div className="hero-actions" style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              marginTop: 32,
            }}>
              <Link href={slide.ctaHref} className="btn-shimmer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                {slide.ctaLabel}
              </Link>
              <Link href="/services" className="btn-ghost">
                Explore Services
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>

            {/* Stats strip */}
            <div className="hero-stats" style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 0,
              marginTop: 40,
              paddingTop: 20,
              borderTop: "1px solid rgba(245,240,232,0.1)",
            }}>
              {[
                { icon: "★", text: "5.0 Rating" },
                { divider: true },
                { icon: "◎", text: "Indore, MP" },
                { divider: true },
                { icon: "◯", text: "Mon–Sun 10AM–9PM" },
              ].map((item: any, i) =>
                item.divider ? (
                  <div key={i} style={{ width: 1, height: 16, background: "rgba(245,240,232,0.15)", marginLeft: 16, marginRight: 16, alignSelf: "center" }} />
                ) : (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: "#C9A84C", fontSize: 10 }}>{item.icon}</span>
                    <span style={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontSize: 11,
                      fontWeight: 400,
                      color: "rgba(245,240,232,0.5)",
                      letterSpacing: "0.04em",
                    }}>
                      {item.text}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* ── SCROLL INDICATOR ── */}
        <div className="hero-scroll" style={{
          position: "absolute",
          bottom: 36,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          zIndex: 3,
          cursor: "pointer",
        }}
          onClick={() => window.scrollBy({ top: window.innerHeight, behavior: "smooth" })}
        >
          <span style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 9,
            fontWeight: 500,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(245,240,232,0.3)",
          }}>
            Scroll
          </span>
          <ChevronDown size={14} color="rgba(201,168,76,0.6)" />
        </div>

        {/* ── SLIDE INDICATORS ── */}
        {slides.length > 1 && (
          <div style={{
            position: "absolute",
            bottom: 40,
            right: "clamp(32px, 5vw, 80px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 6,
            zIndex: 3,
          }}>
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  if (timerRef.current) clearTimeout(timerRef.current);
                  setCurrent(i);
                  setTransitioning(false);
                  setNext(-1);
                }}
                style={{
                  background: "none",
                  border: "none",
                  padding: 4,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  flexDirection: "row-reverse",
                }}
                aria-label={`Go to slide ${i + 1}`}
              >
                <div style={{
                  width: i === current ? 24 : 6,
                  height: 2,
                  background: i === current ? "#C9A84C" : "rgba(245,240,232,0.25)",
                  borderRadius: 1,
                  transition: "width 0.4s cubic-bezier(0.22,1,0.36,1), background 0.3s ease",
                  boxShadow: i === current ? "0 0 8px rgba(201,168,76,0.4)" : "none",
                }} />
              </button>
            ))}
          </div>
        )}
      </section>
    </>
  );
}