"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Award, Shield, Sparkles, Heart,
  Clock, MapPin, Phone,
  ArrowRight, Star, Users, Scissors, Trophy,
} from "lucide-react";

function ValueIcon({ iconKey }: { iconKey: string }) {
  switch (iconKey) {
    case "shield":  return <Shield size={20} color="#C9A84C" strokeWidth={1.5} />;
    case "heart":   return <Heart size={20} color="#C9A84C" strokeWidth={1.5} />;
    case "sparkles":return <Sparkles size={20} color="#C9A84C" strokeWidth={1.5} />;
    default:        return <Award size={20} color="#C9A84C" strokeWidth={1.5} />;
  }
}

const CSS = `
  @keyframes aboutFadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes aboutFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes counterUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }
  .about-hero-section {
    position: relative;
    height: 100dvh;
    min-height: 640px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .about-hero-bg {
    position: absolute; inset: 0;
    background: linear-gradient(180deg, rgba(13,13,13,0.85) 0%, rgba(13,13,13,0.7) 50%, rgba(13,13,13,0.85) 100%),
                url('https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920&q=80') center/cover no-repeat;
    background-blend-mode: overlay;
  }
  .about-hero-grain {
    position: absolute; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
    opacity: 0.03;
    pointer-events: none;
  }
  .about-hero-glow {
    position: absolute;
    top: 30%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 600px;
    height: 600px;
    background: radial-gradient(ellipse at center, rgba(201,168,76,0.08) 0%, transparent 60%);
    pointer-events: none;
  }
  .about-hero-content {
    position: relative;
    z-index: 2;
    text-align: center;
    padding: 0 clamp(20px, 5vw, 48px);
    max-width: 900px;
  }
  .about-eyebrow {
    animation: aboutFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.2s both;
    background: linear-gradient(90deg, #C9A84C, #E2C97E, #C9A84C);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .about-title {
    animation: aboutFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.4s both;
  }
  .about-rule {
    animation: scaleIn 0.9s cubic-bezier(0.22,1,0.36,1) 0.6s both;
  }
  .about-subtitle {
    animation: aboutFadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.8s both;
  }
  .about-scroll-hint {
    animation: aboutFadeUp 0.5s ease 1.5s both, float 3s ease-in-out 2s infinite;
  }

  .scroll-reveal {
    opacity: 0.4;
    transform: translateY(16px);
    transition: opacity 0.4s ease-out, transform 0.4s ease-out;
    will-change: opacity, transform;
  }
  .scroll-reveal.revealed {
    opacity: 1;
    transform: translateY(0);
  }
  .scroll-reveal-left {
    opacity: 0.4;
    transform: translateX(-24px);
    transition: opacity 0.4s ease-out, transform 0.4s ease-out;
    will-change: opacity, transform;
  }
  .scroll-reveal-left.revealed {
    opacity: 1;
    transform: translateX(0);
  }
  .scroll-reveal-right {
    opacity: 0.4;
    transform: translateX(24px);
    transition: opacity 0.4s ease-out, transform 0.4s ease-out;
    will-change: opacity, transform;
  }
  .scroll-reveal-right.revealed {
    opacity: 1;
    transform: translateX(0);
  }

  .team-card {
    transition: transform 0.5s cubic-bezier(0.22,1,0.36,1), box-shadow 0.5s ease;
  }
  .team-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 24px 64px rgba(201,168,76,0.15), 0 12px 32px rgba(0,0,0,0.5);
  }
  .team-card:hover .team-card-img {
    transform: scale(1.08);
  }
  .team-card-img {
    transition: transform 0.8s cubic-bezier(0.22,1,0.36,1);
  }

  .stats-counter {
    animation: counterUp 0.6s cubic-bezier(0.22,1,0.36,1) both;
  }

  .timeline-dot {
    animation: scaleIn 0.5s cubic-bezier(0.22,1,0.36,1) both;
  }

  .value-card {
    transition: background 0.4s ease, transform 0.4s ease;
  }
  .value-card:hover {
    background: rgba(201,168,76,0.04);
    transform: translateY(-4px);
  }
  .value-icon-wrap {
    transition: all 0.3s ease;
  }
  .value-card:hover .value-icon-wrap {
    background: rgba(201,168,76,0.12);
    box-shadow: 0 0 24px rgba(201,168,76,0.15);
    transform: scale(1.05);
  }

  .cta-btn-gold {
    transition: all 0.35s cubic-bezier(0.22,1,0.36,1);
  }
  .cta-btn-gold:hover {
    background: #E2C97E;
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(201,168,76,0.3);
  }

  .floating-shape {
    animation: float 6s ease-in-out infinite;
  }
  .floating-shape:nth-child(2) { animation-delay: -2s; }
  .floating-shape:nth-child(3) { animation-delay: -4s; }

  @media (max-width: 767px) {
    .about-story-grid { flex-direction: column !important; }
    .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
  }

  @media (prefers-reduced-motion: reduce) {
    .about-eyebrow, .about-title, .about-rule, .about-subtitle,
    .about-scroll-hint, .scroll-reveal, .scroll-reveal-left, .scroll-reveal-right,
    .team-card, .team-card-img, .stats-counter, .timeline-dot,
    .value-card, .value-icon-wrap, .cta-btn-gold, .floating-shape {
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
      transition: none !important;
    }
  }
`;

interface TeamMember {
  id: string;
  name: string;
  role: string;
  experience: number;
  specializations: string[];
  img: string;
}

interface Value {
  iconKey: string;
  title: string;
  desc: string;
}

interface Props {
  founderImg: string;
  teamMembers: TeamMember[];
  values: Value[];
  milestones: Milestone[];
}

interface Milestone {
  year: string;
  label: string;
}

const stats = [
  { icon: Users, value: 15000, suffix: "+", label: "Happy Clients" },
  { icon: Scissors, value: 15, suffix: "+", label: "Years Experience" },
  { icon: Award, value: 12, suffix: "", label: "Awards Won" },
  { icon: Star, value: 4.9, suffix: "/5", label: "Rating" },
];

function AnimatedCounter({ value, suffix, delay }: { value: number; suffix: string; delay: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;
    let current = 0;
    const increment = value / steps;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current * 10) / 10);
      }
    }, stepDuration);
    return () => clearInterval(timer);
  }, [isVisible, value]);

  return (
    <span ref={ref} className="stats-counter" style={{ animationDelay: `${delay}ms` }}>
      {count}{suffix}
    </span>
  );
}

function useScrollReveal(threshold = 0.05) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) entry.target.classList.add("revealed"); },
      { threshold: 0, rootMargin: "0px 0px -80px 0px" }
    );
    const els = ref.current.querySelectorAll(".scroll-reveal, .scroll-reveal-left, .scroll-reveal-right");
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [threshold]);
  return ref;
}

export default function AboutPageClient({ founderImg, teamMembers, values, milestones }: Props) {
  const [visibleStats, setVisibleStats] = useState(false);
  const [visibleTimeline, setVisibleTimeline] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const revealRef = useScrollReveal();

  useEffect(() => {
    const statsObserver = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisibleStats(true); },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    if (statsRef.current) statsObserver.observe(statsRef.current);
    return () => statsObserver.disconnect();
  }, []);

  useEffect(() => {
    const timelineObserver = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisibleTimeline(true); },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    if (timelineRef.current) timelineObserver.observe(timelineRef.current);
    return () => timelineObserver.disconnect();
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ── HERO ── */}
      <section className="about-hero-section">
        <div className="about-hero-bg" />
        <div className="about-hero-grain" />
        <div className="about-hero-glow" />

        {/* Floating decorative elements */}
        <div style={{ position: "absolute", top: "20%", right: "10%", zIndex: 1, pointerEvents: "none" }}>
          <div className="floating-shape" style={{ width: 120, height: 120, border: "1px solid rgba(201,168,76,0.1)", borderRadius: "50%", position: "relative" }}>
            <div style={{ position: "absolute", inset: 8, border: "1px solid rgba(201,168,76,0.15)", borderRadius: "50%" }} />
          </div>
        </div>
        <div style={{ position: "absolute", bottom: "25%", left: "8%", zIndex: 1, pointerEvents: "none" }}>
          <div className="floating-shape" style={{ width: 80, height: 80, border: "1px solid rgba(201,168,76,0.08)", position: "relative" }}>
            <div style={{ position: "absolute", inset: 16, border: "1px solid rgba(201,168,76,0.12)" }} />
          </div>
        </div>

        <div className="about-hero-content">
          <p className="about-eyebrow" style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            marginBottom: 24,
          }}>
            ANAND BAZAR, INDORE
          </p>
          <h1 className="about-title" style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(56px, 10vw, 112px)",
            fontWeight: 500,
            color: "#FDFAF5",
            lineHeight: 1.02,
            letterSpacing: "-0.02em",
            margin: 0,
          }}>
            Our Story
          </h1>
          <div className="about-rule" style={{
            height: 1,
            width: 80,
            background: "linear-gradient(90deg, transparent, #C9A84C, transparent)",
            margin: "28px auto 0",
          }} />
          <p className="about-subtitle" style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "clamp(15px, 2vw, 18px)",
            fontWeight: 300,
            color: "rgba(253,250,245,0.55)",
            lineHeight: 1.7,
            marginTop: 28,
            maxWidth: 540,
            marginLeft: "auto",
            marginRight: "auto",
          }}>
            A legacy of beauty, trust, and transformation since 2009
          </p>
        </div>

        {/* Scroll hint */}
        <div
          className="about-scroll-hint"
          style={{
            position: "absolute",
            bottom: 40,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            zIndex: 3,
            cursor: "pointer",
          }}
          onClick={() => window.scrollBy({ top: window.innerHeight * 0.8, behavior: "smooth" })}
        >
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(253,250,245,0.25)",
          }}>
            Discover
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(201,168,76,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </section>

      <div ref={revealRef}>
        {/* ── STATS BAR ── */}
        <section ref={statsRef} style={{
          background: "#0A0A0A",
          padding: "clamp(40px, 8vw, 72px) clamp(20px, 5vw, 60px)",
          borderTop: "1px solid #1A1A1A",
          borderBottom: "1px solid #1A1A1A",
        }}>
          <div style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "clamp(20px, 4vw, 48px)",
          }} className="stats-grid">
            {stats.map((stat, i) => (
              <div key={stat.label} style={{ textAlign: "center" }}>
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  border: "1px solid rgba(201,168,76,0.15)",
                  marginBottom: 16,
                }}>
                  <stat.icon size={18} color="#C9A84C" strokeWidth={1.5} />
                </div>
                <div style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "clamp(32px, 4vw, 48px)",
                  fontWeight: 500,
                  color: "#FDFAF5",
                  lineHeight: 1,
                  marginBottom: 8,
                }}>
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} delay={i * 150} />
                </div>
                <div style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11,
                  fontWeight: 400,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(253,250,245,0.4)",
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── STORY SECTION ── */}
        <section style={{
          background: "#0D0D0D",
          padding: "clamp(80px, 12vw, 140px) clamp(20px, 5vw, 80px)",
          overflow: "hidden",
        }}>
          <div
            style={{
              maxWidth: 1300,
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "1fr 1.3fr",
              gap: "clamp(48px, 8vw, 100px)",
              alignItems: "center",
            }}
            className="about-story-grid"
          >
            {/* Pull Quote */}
            <div className="scroll-reveal-left">
              <div style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(30px, 4vw, 52px)",
                fontStyle: "italic",
                fontWeight: 400,
                color: "#C9A84C",
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
                position: "relative",
              }}>
                <span style={{
                  position: "absolute",
                  top: -24,
                  left: -8,
                  fontSize: 100,
                  color: "rgba(201,168,76,0.08)",
                  fontStyle: "normal",
                  lineHeight: 1,
                  fontFamily: "'Playfair Display', serif",
                }}>"</span>
                Every client who walks through our doors deserves a moment of magic.
              </div>
              <div style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(253,250,245,0.35)",
                marginTop: 32,
              }}>
                — Kanishka Sen, Founder
              </div>
            </div>

            {/* Narrative Text */}
            <div className="scroll-reveal-right">
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 16,
                fontWeight: 300,
                color: "rgba(253,250,245,0.7)",
                lineHeight: 1.85,
                marginBottom: 24,
              }}>
                Founded in 2009 by Kanishka Sen, Kanishka&apos;s Family Salon &amp; Academy began as a small space on Anand Bazar with one vision — to bring world-class beauty services to the heart of Indore.
              </p>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 16,
                fontWeight: 300,
                color: "rgba(253,250,245,0.7)",
                lineHeight: 1.85,
                marginBottom: 24,
              }}>
                Over 15 years, we have grown into a full-service luxury salon and beauty academy. From bridal transformations to everyday elegance, every service is delivered with precision, premium products, and genuine care.
              </p>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 16,
                fontWeight: 300,
                color: "rgba(253,250,245,0.7)",
                lineHeight: 1.85,
              }}>
                Our academy trains the next generation of beauty professionals — not just techniques, but the art of client care. The same standards that define our salon flow into everything we do.
              </p>
            </div>
          </div>
        </section>

        {/* ── VALUES SECTION ── */}
        <section style={{
          background: "#111111",
          padding: "clamp(80px, 12vw, 140px) clamp(20px, 5vw, 80px)",
          borderTop: "1px solid #1A1A1A",
          borderBottom: "1px solid #1A1A1A",
        }}>
          <div style={{ maxWidth: 1300, margin: "0 auto" }}>
            <div className="scroll-reveal" style={{ textAlign: "center", marginBottom: "clamp(48px, 8vw, 80px)" }}>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                color: "#C9A84C",
                marginBottom: 16,
              }}>
                What We Stand For
              </p>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(36px, 5vw, 60px)",
                fontWeight: 500,
                color: "#FDFAF5",
                lineHeight: 1.15,
                letterSpacing: "-0.01em",
              }}>
                Our Philosophy
              </h2>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 0,
            }}>
              {values.map((value, i) => (
                <div
                  key={i}
                  className="value-card scroll-reveal"
                  style={{
                    padding: "clamp(32px, 5vw, 56px)",
                    borderRight: i < values.length - 1 ? "1px solid #1A1A1A" : "none",
                    borderLeft: i === 0 ? "none" : "1px solid #1A1A1A",
                    transitionDelay: `${i * 120}ms`,
                  }}
                >
                  <div className="value-icon-wrap" style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    border: "1px solid rgba(201,168,76,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 24,
                  }}>
                    <ValueIcon iconKey={value.iconKey} />
                  </div>
                  <h3 style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "clamp(22px, 2.5vw, 28px)",
                    fontWeight: 500,
                    color: "#FDFAF5",
                    lineHeight: 1.3,
                    marginBottom: 14,
                  }}>
                    {value.title}
                  </h3>
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    fontWeight: 300,
                    color: "rgba(253,250,245,0.5)",
                    lineHeight: 1.75,
                  }}>
                    {value.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TEAM SECTION ── */}
        <section style={{
          background: "#0D0D0D",
          padding: "clamp(80px, 12vw, 140px) clamp(20px, 5vw, 80px)",
        }}>
          <div style={{ maxWidth: 1300, margin: "0 auto" }}>
            <div className="scroll-reveal" style={{ textAlign: "center", marginBottom: "clamp(48px, 8vw, 80px)" }}>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                color: "#C9A84C",
                marginBottom: 16,
              }}>
                The People Behind the Magic
              </p>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(36px, 5vw, 60px)",
                fontWeight: 500,
                color: "#FDFAF5",
                lineHeight: 1.15,
                letterSpacing: "-0.01em",
              }}>
                Meet Our Team
              </h2>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "clamp(20px, 4vw, 40px)",
            }}>
              {teamMembers.map((member, i) => (
                <div
                  key={member.id}
                  className="team-card scroll-reveal"
                  style={{
                    background: "#141414",
                    border: "1px solid #1A1A1A",
                    borderRadius: 4,
                    overflow: "hidden",
                    transitionDelay: `${i * 100}ms`,
                  }}
                >
                  <div style={{ position: "relative", aspectRatio: "3/4", overflow: "hidden", background: "#0A0A0A" }}>
                    <Image
                      src={member.img}
                      alt={member.name}
                      fill
                      className="team-card-img"
                      style={{ objectFit: "cover", objectPosition: "center top" }}
                      unoptimized
                    />
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(to top, rgba(13,13,13,0.7) 0%, transparent 45%)",
                    }} />
                  </div>
                  <div style={{
                    padding: "clamp(18px, 2.5vw, 28px)",
                    borderTop: "1px solid rgba(201,168,76,0.08)",
                  }}>
                    <h3 style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: "clamp(20px, 2vw, 24px)",
                      fontWeight: 500,
                      color: "#FDFAF5",
                      lineHeight: 1.2,
                      marginBottom: 6,
                    }}>
                      {member.name}
                    </h3>
                    <p style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 10,
                      fontWeight: 500,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: "#C9A84C",
                      marginBottom: 12,
                    }}>
                      {member.role}
                    </p>
                    <div style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 12,
                      fontWeight: 400,
                      color: "rgba(253,250,245,0.4)",
                    }}>
                      {member.experience > 0 && `${member.experience}+ years experience`}
                    </div>
                    {member.specializations.length > 0 && (
                      <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {member.specializations.slice(0, 3).map((spec, si) => (
                          <span key={si} style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: 9,
                            fontWeight: 500,
                            letterSpacing: "0.08em",
                            color: "rgba(253,250,245,0.35)",
                            border: "1px solid rgba(201,168,76,0.12)",
                            padding: "4px 10px",
                            borderRadius: 2,
                          }}>
                            {spec}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TIMELINE SECTION ── */}
        <section
          ref={timelineRef}
          style={{
            background: "#111111",
            padding: "clamp(80px, 12vw, 140px) clamp(20px, 5vw, 80px)",
            borderTop: "1px solid #1A1A1A",
            overflow: "hidden",
          }}
        >
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div className="scroll-reveal" style={{ textAlign: "center", marginBottom: "clamp(48px, 8vw, 80px)" }}>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                color: "#C9A84C",
                marginBottom: 16,
              }}>
                Our Journey
              </p>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(36px, 5vw, 60px)",
                fontWeight: 500,
                color: "#FDFAF5",
                lineHeight: 1.15,
                letterSpacing: "-0.01em",
              }}>
                Since 2009
              </h2>
            </div>

            {/* Timeline */}
            <div className="scroll-reveal" style={{ position: "relative", paddingTop: 40 }}>
              {/* Line */}
              <div style={{
                position: "absolute",
                top: 40,
                left: 0,
                right: 0,
                height: 1,
                background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.15) 10%, rgba(201,168,76,0.25) 50%, rgba(201,168,76,0.15) 90%, transparent)",
              }} />

              <div style={{
                display: "grid",
                gridTemplateColumns: `repeat(${milestones.length}, 1fr)`,
                position: "relative",
              }}>
                {milestones.map((m, i) => (
                  <div
                    key={m.year}
                    style={{
                      textAlign: "center",
                      padding: "0 12px",
                      opacity: visibleTimeline ? 1 : 0,
                      transform: visibleTimeline ? "translateY(0)" : "translateY(20px)",
                      transition: `opacity 0.7s ease ${i * 150}ms, transform 0.7s ease ${i * 150}ms`,
                    }}
                  >
                    <div
                      className="timeline-dot"
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: "#C9A84C",
                        boxShadow: "0 0 20px rgba(201,168,76,0.4)",
                        border: "3px solid #111111",
                        margin: "0 auto 20px",
                      }}
                    />
                    <div style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: "clamp(26px, 3.5vw, 42px)",
                      fontWeight: 500,
                      color: "#C9A84C",
                      lineHeight: 1,
                      marginBottom: 12,
                    }}>
                      {m.year}
                    </div>
                    <div style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 12,
                      fontWeight: 400,
                      color: "rgba(253,250,245,0.5)",
                      lineHeight: 1.5,
                      maxWidth: 160,
                      margin: "0 auto",
                    }}>
                      {m.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FOUNDER IMAGE & CTA ── */}
        <section style={{
          background: "#0D0D0D",
          padding: "clamp(80px, 12vw, 140px) clamp(20px, 5vw, 80px)",
        }}>
          <div style={{
            maxWidth: 1300,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 1.1fr",
            gap: "clamp(48px, 8vw, 100px)",
            alignItems: "center",
          }}>
            {/* Founder image with frame effect */}
            <div className="scroll-reveal-left" style={{ position: "relative" }}>
              <div style={{
                position: "relative",
                aspectRatio: "4/5",
                borderRadius: 4,
                overflow: "hidden",
              }}>
                <Image
                  src={founderImg}
                  alt="Kanishka Sen — Founder"
                  fill
                  style={{ objectFit: "cover", objectPosition: "center top" }}
                  unoptimized
                />
                <div style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(135deg, rgba(13,13,13,0.1) 0%, transparent 50%)",
                }} />
              </div>
              {/* Decorative frame */}
              <div style={{
                position: "absolute",
                top: -16,
                left: -16,
                right: 16,
                bottom: 16,
                border: "1px solid rgba(201,168,76,0.2)",
                borderRadius: 4,
                zIndex: -1,
              }} />
              <div style={{
                position: "absolute",
                bottom: 24,
                left: 24,
                background: "#0D0D0D",
                padding: "16px 24px",
                borderRadius: 2,
                border: "1px solid rgba(201,168,76,0.15)",
              }}>
                <div style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 9,
                  fontWeight: 500,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "rgba(253,250,245,0.4)",
                  marginBottom: 4,
                }}>
                  Founder &amp; Creative Director
                </div>
                <div style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 22,
                  fontWeight: 500,
                  color: "#FDFAF5",
                }}>
                  Kanishka Sen
                </div>
              </div>
            </div>

            {/* CTA content */}
            <div className="scroll-reveal-right">
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                color: "#C9A84C",
                marginBottom: 20,
              }}>
                Visit Us
              </p>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(36px, 4.5vw, 56px)",
                fontWeight: 500,
                color: "#FDFAF5",
                lineHeight: 1.15,
                letterSpacing: "-0.01em",
                marginBottom: 28,
              }}>
                Experience the Salon
              </h2>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                fontWeight: 300,
                color: "rgba(253,250,245,0.55)",
                lineHeight: 1.8,
                marginBottom: 36,
              }}>
                Step into our world of beauty and transformation. Whether it&apos;s a bridal appointment or a simple grooming session, we can&apos;t wait to welcome you.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 40 }}>
                {[
                  { icon: MapPin, text: "Anand Bazar, Baikunth Dham, Indore, MP 452001" },
                  { icon: Phone, text: "+91-9171230292" },
                  { icon: Clock, text: "Mon–Sun, 10:00 AM – 9:00 PM" },
                ].map(({ icon: Icon, text }, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      border: "1px solid rgba(201,168,76,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <Icon size={14} color="#C9A84C" strokeWidth={1.5} />
                    </div>
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 14,
                      fontWeight: 300,
                      color: "rgba(253,250,245,0.55)",
                      lineHeight: 1.6,
                      alignSelf: "center",
                    }}>
                      {text}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <Link href="/book" className="cta-btn-gold" style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "16px 36px",
                  background: "#C9A84C",
                  color: "#0D0D0D",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  border: "1.5px solid #C9A84C",
                  borderRadius: 2,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Book Appointment
                </Link>
                <Link href="/services" style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "16px 36px",
                  background: "transparent",
                  color: "#FDFAF5",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  border: "1.5px solid rgba(253,250,245,0.2)",
                  borderRadius: 2,
                  transition: "all 0.3s ease",
                }}>
                  View Services
                  <ArrowRight size={14} strokeWidth={1.5} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}