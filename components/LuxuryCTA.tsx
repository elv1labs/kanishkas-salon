"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Phone } from "lucide-react";

const CSS = `
  .cta-section {
    position: relative;
    overflow: hidden;
    background: #0D0D0D;
  }
  .cta-glow {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 800px;
    height: 400px;
    background: radial-gradient(ellipse at center, rgba(201,168,76,0.08) 0%, transparent 65%);
    pointer-events: none;
    z-index: 1;
  }
  .cta-top-rule {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, #C9A84C44 30%, #C9A84C88 50%, #C9A84C44 70%, transparent 100%);
    z-index: 2;
  }
  .cta-bottom-rule {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, #C9A84C22 30%, #C9A84C44 50%, #C9A84C22 70%, transparent 100%);
    z-index: 2;
  }

  .cta-reveal {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1);
  }
  .cta-reveal.cta-visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* Gold shimmer CTA button */
  .cta-btn {
    position: relative;
    overflow: hidden;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 16px 40px;
    background: transparent;
    border: 1.5px solid #C9A84C;
    color: #C9A84C;
    font-family: 'Montserrat', sans-serif;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    text-decoration: none;
    transition: color 0.4s ease;
  }
  .cta-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255,255,255,0.1) 40%,
      rgba(255,255,255,0.15) 50%,
      rgba(255,255,255,0.1) 60%,
      transparent 100%
    );
    background-size: 200% 100%;
    transform: translateX(-100%);
    transition: transform 0.7s ease;
  }
  .cta-btn:hover::before {
    transform: translateX(100%);
  }
  .cta-btn:hover {
    color: #0D0D0D;
    background: #C9A84C;
    border-color: #C9A84C;
    box-shadow: 0 8px 32px rgba(201,168,76,0.3);
  }
  .cta-btn:active {
    transform: scale(0.97);
  }

  .cta-phone {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: 'Montserrat', sans-serif;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(245,240,232,0.35);
    text-decoration: none;
    transition: color 0.3s ease;
    cursor: pointer;
  }
  .cta-phone:hover {
    color: rgba(245,240,232,0.7);
  }

  @media (prefers-reduced-motion: reduce) {
    .cta-reveal { opacity: 1; transform: none; transition: none; }
    .cta-btn::before { transition: none; }
  }
`;

export default function LuxuryCTA() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const items = el.querySelectorAll(".cta-reveal");
          items.forEach((item, i) => {
            setTimeout(() => item.classList.add("cta-visible"), i * 150);
          });
          observer.unobserve(el);
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <section className="cta-section">
        <div className="cta-top-rule" />
        <div className="cta-glow" />

        <div
          ref={ref}
          style={{
            position: "relative",
            zIndex: 2,
            padding: "clamp(80px, 12vw, 140px) clamp(16px, 5vw, 80px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 0,
          }}
        >
          {/* Eyebrow */}
          <p className="cta-reveal" style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#C9A84C",
            marginBottom: 20,
          }}>
            Ready for Your Transformation?
          </p>

          {/* Headline */}
          <h2 className="cta-reveal" style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(36px, 6vw, 80px)",
            fontWeight: 600,
            color: "#F5F0E8",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            margin: 0,
            maxWidth: 800,
          }}>
            Book Your
          </h2>
          <h2 className="cta-reveal" style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontSize: "clamp(36px, 6vw, 80px)",
            fontWeight: 400,
            color: "#C9A84C",
            lineHeight: 1.1,
            letterSpacing: "-0.01em",
            margin: "-8px 0 0",
            maxWidth: 800,
          }}>
            Appointment Today
          </h2>

          {/* Gold rule */}
          <div className="cta-reveal" style={{
            width: 80,
            height: 1.5,
            background: "linear-gradient(90deg, #C9A84C, #E2C97E)",
            marginTop: 28,
            boxShadow: "0 0 16px rgba(201,168,76,0.3)",
          }} />

          {/* Subtext */}
          <p className="cta-reveal" style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 13,
            fontWeight: 300,
            color: "#666666",
            lineHeight: 1.7,
            marginTop: 24,
            maxWidth: 420,
          }}>
            Experience luxury beauty services crafted for you. Our experts are ready to transform your look.
          </p>

          {/* CTA Buttons */}
          <div className="cta-reveal" style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 20,
            justifyContent: "center",
            alignItems: "center",
            marginTop: 40,
          }}>
            <Link href="/book" className="cta-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Book Appointment
            </Link>

            <a href="tel:+919171230292" className="cta-phone">
              <Phone size={12} />
              +91 91712 30292
            </a>
          </div>

          {/* Location + hours */}
          <div className="cta-reveal" style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            marginTop: 48,
            paddingTop: 28,
            borderTop: "1px solid #1E1E1E",
          }}>
            {[
              { text: "Anand Bazar, Indore", sep: true },
              { text: "Mon – Sun", sep: true },
              { text: "10 AM – 9 PM", sep: false },
            ].map((item: any, i) => (
              <>
                <span key={i} style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: 10,
                  fontWeight: 400,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#444444",
                }}>
                  {item.text}
                </span>
                {item.sep && i < 2 && (
                  <span style={{ width: 3, height: 3, background: "#C9A84C44", borderRadius: "50%", display: "inline-block" }} />
                )}
              </>
            ))}
          </div>
        </div>

        <div className="cta-bottom-rule" />
      </section>
    </>
  );
}