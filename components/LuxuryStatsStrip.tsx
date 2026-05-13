"use client";

import { useEffect, useRef, useState } from "react";

interface StatItem {
  value: number;
  suffix: string;
  label: string;
  special?: boolean;
}

const STATS: StatItem[] = [
  { value: 2009, suffix: "",  label: "Established", special: true },
  { value: 30,   suffix: "+", label: "Premium Services" },
  { value: 9,    suffix: "",  label: "Beauty Categories" },
  { value: 15,   suffix: "+", label: "Years Experience" },
  { value: 365,  suffix: "",  label: "Days Open" },
];

function useCountUp(target: number, active: boolean, duration = 2000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (target === 2009) { setCount(target); return; }
    const start = performance.now();
    const frame = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [active, target, duration]);
  return count;
}

function StatNumber({ stat, active }: { stat: StatItem; active: boolean }) {
  const count = useCountUp(stat.value, active);
  return (
    <>
      <span style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: stat.special ? "clamp(26px, 3.5vw, 38px)" : "clamp(22px, 3vw, 32px)",
        fontWeight: stat.special ? 500 : 600,
        color: stat.special ? "#C9A84C" : "#F5F0E8",
        fontStyle: stat.special ? "italic" : "normal",
        letterSpacing: stat.special ? "0" : "-0.02em",
        lineHeight: 1.1,
      }}>
        {count}{stat.suffix}
      </span>
    </>
  );
}

const CSS_INJECTED = `
  .luxury-stats-item {
    opacity: 0;
    transform: translateY(16px);
    transition: opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1);
  }
  .luxury-stats-item.luxury-visible {
    opacity: 1 !important;
    transform: translateY(0) !important;
  }
  .luxury-stat-divider {
    width: 1px;
    height: clamp(28px, 3.5vw, 40px);
    background: linear-gradient(180deg, transparent 0%, #C9A84C55 50%, transparent 100%);
    flex-shrink: 0;
    align-self: center;
  }
  @media (max-width: 639px) {
    .luxury-stats-row { flex-direction: column !important; }
    .luxury-stat-divider { width: 60px; height: 1px; background: linear-gradient(90deg, transparent, #C9A84C33, transparent); }
    .luxury-stats-item { align-items: center !important; }
  }
  @media (prefers-reduced-motion: reduce) {
    .luxury-stats-item { opacity: 1 !important; transform: none !important; transition: none !important; }
  }
`;

export default function LuxuryStatsStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setActive(true); },
      { threshold: 0.25 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return;
    const items = ref.current?.querySelectorAll(".luxury-stats-item");
    if (!items) return;
    items.forEach((el, i) => {
      setTimeout(() => el.classList.add("luxury-visible"), i * 120);
    });
  }, [active]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS_INJECTED }} />
      <section
        style={{
          background: "#141414",
          borderTop: "1px solid #2A2A2A",
          borderBottom: "1px solid #2A2A2A",
        }}
      >
        <div
          ref={ref}
          className="luxury-stats-row"
          style={{
            maxWidth: 1320,
            margin: "0 auto",
            padding: "clamp(20px, 4vw, 44px) clamp(16px, 4vw, 48px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {STATS.map((stat, i) => (
            <>
              <div
                key={stat.label}
                className="luxury-stats-item"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 6,
                  padding: "clamp(8px, 2vw, 16px) clamp(20px, 4vw, 48px)",
                  transitionDelay: `${i * 100}ms`,
                }}
              >
                <StatNumber stat={stat} active={active} />
                <span style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#888888",
                  textAlign: "left",
                }}>
                  {stat.label}
                </span>
              </div>
              {i < STATS.length - 1 && (
                <div key={`div-${i}`} className="luxury-stat-divider" />
              )}
            </>
          ))}
        </div>
      </section>
    </>
  );
}