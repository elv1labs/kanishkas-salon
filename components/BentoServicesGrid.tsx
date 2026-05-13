"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface ServiceCategory {
  id: string;
  label: string;
  title: string;
  desc: string;
  img: string;
  href: string;
  featured?: boolean;
}

const CATEGORIES: ServiceCategory[] = [
  {
    id: "bridal",
    label: "BRIDAL",
    title: "Bridal Makeup & Styling",
    desc: "Complete bridal packages — HD makeup, draping, hairstyling & pre-wedding rituals. Your perfect day, perfected.",
    img: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=900&h=1100&fit=crop&q=85",
    href: "/services?cat=BRIDAL",
    featured: true,
  },
  {
    id: "hair",
    label: "HAIR",
    title: "Hair Styling & Treatments",
    desc: "Expert cuts, global colouring, keratin, and restorative spa treatments for every hair type.",
    img: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=400&fit=crop&q=85",
    href: "/services?cat=HAIR_STYLING",
  },
  {
    id: "skincare",
    label: "SKIN CARE",
    title: "Facials & Skin Treatments",
    desc: "Gold facials, cleanup, body polishing, and advanced skin therapies for lasting radiance.",
    img: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=400&fit=crop&q=85",
    href: "/services?cat=SKIN_CARE",
  },
  {
    id: "nails",
    label: "NAIL ART",
    title: "Nail Care & Extensions",
    desc: "Manicures, gel nails, creative nail art, and extensions with premium international products.",
    img: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=400&fit=crop&q=85",
    href: "/services?cat=NAIL_CARE",
  },
  {
    id: "waxing",
    label: "BODY CARE",
    title: "Waxing & Threading",
    desc: "Full body waxing, Rica waxing, upper lip, brow shaping, and threading by trained specialists.",
    img: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&h=400&fit=crop&q=85",
    href: "/services?cat=WAXING",
  },
  {
    id: "academy",
    label: "ACADEMY",
    title: "Beauty Academy",
    desc: "Professional certification courses in makeup, hair, and aesthetics. Build your career in beauty.",
    img: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&h=400&fit=crop&q=85",
    href: "/services?cat=ACADEMY",
  },
];

const CSS = `
  .bento-card {
    position: relative;
    overflow: hidden;
    cursor: pointer;
    background: #0D0D0D;
    border: 1px solid #2A2A2A;
    transition: border-color 0.4s cubic-bezier(0.22,1,0.36,1);
  }
  .bento-card:hover {
    border-color: rgba(201,168,76,0.4);
  }
  .bento-card img {
    transition: transform 0.7s cubic-bezier(0.22,1,0.36,1);
  }
  .bento-card:hover img {
    transform: scale(1.05);
  }

  /* Category label sweep */
  .bento-label {
    position: relative;
    display: inline-block;
  }
  .bento-label::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 1.5px;
    background: #C9A84C;
    transition: width 0.4s cubic-bezier(0.22,1,0.36,1);
  }
  .bento-card:hover .bento-label::after {
    width: 100%;
  }

  /* Description fade up on hover */
  .bento-desc {
    opacity: 0;
    transform: translateY(8px);
    transition: opacity 0.35s ease, transform 0.35s ease;
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.4s ease, opacity 0.35s ease, transform 0.35s ease;
  }
  .bento-card:hover .bento-desc {
    opacity: 1;
    transform: translateY(0);
    max-height: 80px;
  }

  /* Arrow slide */
  .bento-arrow {
    transform: translateX(-6px);
    opacity: 0;
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
  .bento-card:hover .bento-arrow {
    transform: translateX(0);
    opacity: 1;
  }

  /* Gold border reveal on hover */
  .bento-border-gold {
    position: absolute;
    inset: 0;
    border: 1.5px solid rgba(201,168,76,0.5);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.4s ease;
  }
  .bento-card:hover .bento-border-gold {
    opacity: 1;
  }

  /* Scroll reveal */
  .bento-reveal {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1);
  }
  .bento-reveal.bento-visible {
    opacity: 1;
    transform: translateY(0);
  }

  @media (prefers-reduced-motion: reduce) {
    .bento-card img { transition: none; }
    .bento-desc { opacity: 1; transform: none; max-height: none; }
    .bento-arrow { transform: none; opacity: 1; }
    .bento-reveal { opacity: 1; transform: none; transition: none; }
    .bento-border-gold { opacity: 1; }
  }
`;

function BentoCard({ cat, delay, style }: { cat: ServiceCategory; delay: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("bento-visible"); observer.unobserve(el); } },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Link
      ref={ref}
      href={cat.href}
      className="bento-reveal"
      style={{
        ...style,
        display: "block",
        textDecoration: "none",
        transitionDelay: `${delay}ms`,
      }}
    >
      <article className="bento-card" style={{ height: "100%" }}>
        {/* Gold border overlay */}
        <div className="bento-border-gold" />

        {/* Image */}
        <div style={{ position: "relative", height: cat.featured ? "65%" : "55%", overflow: "hidden" }}>
          <Image
            src={cat.img}
            alt={cat.title}
            fill
            className="object-cover"
            style={{ filter: "brightness(0.7) saturate(0.85)" }}
            unoptimized
          />
          {/* Subtle top overlay */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, rgba(13,13,13,0.15) 0%, transparent 40%)",
          }} />
        </div>

        {/* Content */}
        <div style={{
          padding: "clamp(14px, 2vw, 22px)",
          background: "linear-gradient(to bottom, #0D0D0D 0%, #111 100%)",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}>
          {/* Category label */}
          <span className="bento-label" style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 9.5,
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#C9A84C",
          }}>
            {cat.label}
          </span>

          {/* Title */}
          <h3 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: cat.featured ? "clamp(18px, 2.5vw, 24px)" : "clamp(15px, 2vw, 20px)",
            fontWeight: 500,
            color: "#F5F0E8",
            lineHeight: 1.2,
            letterSpacing: "0.01em",
            transition: "color 0.3s ease",
          }}>
            {cat.title}
          </h3>

          {/* Description — slides up on hover */}
          <p className="bento-desc" style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 12,
            fontWeight: 300,
            color: "#888888",
            lineHeight: 1.6,
            marginTop: 4,
          }}>
            {cat.desc}
          </p>

          {/* Arrow indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <span className="bento-arrow" style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#C9A84C",
              transition: "opacity 0.3s ease",
            }}>
              Explore
            </span>
            <ArrowUpRight size={12} color="#C9A84C" style={{ transition: "transform 0.3s ease" }} />
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function BentoServicesGrid() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <section style={{ background: "#0D0D0D", padding: "clamp(64px, 8vw, 100px) clamp(16px, 4vw, 48px)" }}>
        {/* Section header */}
        <div style={{
          maxWidth: 1320,
          margin: "0 auto 48px",
        }}>
          <p style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "#C9A84C",
            marginBottom: 14,
          }}>
            What We Offer
          </p>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(30px, 4vw, 50px)",
            fontWeight: 500,
            color: "#F5F0E8",
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
          }}>
            Our Services
          </h2>
          <div style={{
            marginTop: 16,
            width: 60,
            height: 1.5,
            background: "linear-gradient(90deg, #C9A84C, #E2C97E40)",
          }} />
        </div>

        {/* Bento Grid */}
        {/* Desktop: asymmetric — Bridal large left, rest in 3-col grid */}
        {/* Bridal takes 5/12 width, rest in 7/12 */}
        <div style={{
          maxWidth: 1320,
          margin: "0 auto",
          display: "grid",
          gap: 12,
          gridTemplateColumns: "5fr 7fr",
          gridTemplateRows: "repeat(2, clamp(220px, 28vw, 340px))",
          gridTemplateAreas: '"bridal hair" "nails academy"',
        }}>
          {/* Bridal — spans rows, featured */}
          <div style={{ gridArea: "bridal", height: "100%" }}>
            <BentoCard cat={CATEGORIES[0]} delay={0} style={{ height: "100%" }} />
          </div>

          {/* Top-right: hair + skincare */}
          <div style={{ gridArea: "hair", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <BentoCard cat={CATEGORIES[1]} delay={100} />
            <BentoCard cat={CATEGORIES[2]} delay={150} />
          </div>

          {/* Bottom-right: nails + waxing + academy */}
          <div style={{ gridArea: "nails", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <BentoCard cat={CATEGORIES[3]} delay={200} />
            <BentoCard cat={CATEGORIES[4]} delay={250} />
          </div>

          <div style={{ gridArea: "academy", display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
            <BentoCard cat={CATEGORIES[5]} delay={300} style={{ height: "100%" }} />
          </div>
        </div>

        {/* View all link */}
        <div style={{
          maxWidth: 1320,
          margin: "32px auto 0",
          display: "flex",
          justifyContent: "flex-end",
        }}>
          <Link
            href="/services"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "'Montserrat', sans-serif",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#C9A84C",
              textDecoration: "none",
              transition: "gap 0.3s ease",
              cursor: "pointer",
            }}
            onMouseEnter={e => (e.currentTarget.style.gap = "14px")}
            onMouseLeave={e => (e.currentTarget.style.gap = "8px")}
          >
            View All Services
            <ArrowUpRight size={13} />
          </Link>
        </div>
      </section>
    </>
  );
}