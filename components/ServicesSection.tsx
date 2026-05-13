"use client";

import { useEffect, useRef, useState, useCallback } from "react";

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

const CSS = `
  .stats-wrapper { background: #141414; }
  .stats-item { opacity: 0; transform: translateY(16px); transition: opacity 0.6s ease, transform 0.6s ease; }
  .stats-item.visible { opacity: 1; transform: translateY(0); }
  .stat-divider {
    width: 1px;
    height: clamp(32px, 4vw, 44px);
    background: linear-gradient(180deg, transparent, #C9A84C66, transparent);
    flex-shrink: 0;
    align-self: center;
  }
  @media (max-width: 639px) {
    .stats-inner { flex-direction: column !important; }
    .stat-divider { width: 40px; height: 1px; background: linear-gradient(90deg, transparent, #C9A84C44, transparent); }
  }
  @media (prefers-reduced-motion: reduce) {
    .stats-item { opacity: 1; transform: none; transition: none; }
  }
`;

export default function StatsStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setActive(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <section
        className="stats-wrapper"
        style={{ borderTop: "1px solid #2A2A2A", borderBottom: "1px solid #2A2A2A" }}
      >
        <div
          ref={ref}
          className="stats-inner"
          style={{
            maxWidth: 1320,
            margin: "0 auto",
            padding: "clamp(24px, 4vw, 40px) clamp(16px, 4vw, 48px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0,
            flexWrap: "wrap",
          }}
        >
          {STATS.map((stat, i) => (
            <div key={stat.label} className="stats-item" style={{ transitionDelay: `${i * 100}ms` }}>
              <div
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "clamp(8px, 2vw, 16px) clamp(20px, 4vw, 40px)" }}
              >
                <StatNumber stat={stat} active={active} />
                <span style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#888888",
                  textAlign: "center",
                }}>
                  {stat.label}
                </span>
              </div>
              {i < STATS.length - 1 && (
                <div className="stat-divider" />
              )}
            </div>
          ))}
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var items = document.querySelectorAll('.stats-item');
                var observer = new IntersectionObserver(function(entries) {
                  entries.forEach(function(e) {
                    if (e.isIntersecting) {
                      e.target.classList.add('visible');
                      observer.unobserve(e.target);
                    }
                  });
                }, { threshold: 0.2 });
                items.forEach(function(el) { observer.observe(el); });
              })();
            `,
          }}
        />
      </section>
    </>
  );
}