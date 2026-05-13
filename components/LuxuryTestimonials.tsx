"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

interface Testimonial {
  name: string;
  service: string;
  rating: number;
  comment: string;
  location?: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Priya Sharma",
    service: "Bridal Makeup",
    rating: 5,
    comment: "Kanishka ma'am made me look absolutely stunning on my wedding day. The bridal package was worth every rupee — the attention to detail, the products used, and the final look exceeded all expectations.",
    location: "Indore",
  },
  {
    name: "Anjali Patel",
    service: "Hair Spa & Keratin",
    rating: 5,
    comment: "Best hair spa experience in Indore. My hair felt unbelievably soft and silky for weeks. The keratin treatment is professional-grade — comparable to any top salon in Mumbai.",
    location: "Indore",
  },
  {
    name: "Ritu Agrawal",
    service: "Gold Facial",
    rating: 5,
    comment: "I've been a loyal client for three years. The gold facial is pure luxury — my skin glows for weeks afterward. The ambience and hygiene standards are impeccable.",
    location: "Indore",
  },
  {
    name: "Meera Joshi",
    service: "Nail Art & Gel Extensions",
    rating: 5,
    comment: "The nail art here is extraordinary. So creative, so precise, and incredibly long-lasting. My nails stayed perfect for five weeks! The team is genuinely passionate about their craft.",
    location: "Indore",
  },
  {
    name: "Sunita Dwivedi",
    service: "Academy Course",
    rating: 5,
    comment: "The makeup academy changed my life. I now work as a professional bridal makeup artist. The instructors are industry experts, and the hands-on training is invaluable.",
    location: "Indore",
  },
];

const CSS = `
  .testimonial-card {
    background: #1C1C1C;
    border: 1px solid #2A2A2A;
    transition: border-color 0.4s ease, box-shadow 0.4s ease, opacity 0.6s ease;
  }
  .testimonial-card.active {
    border-color: rgba(201,168,76,0.3);
    box-shadow: 0 12px 48px rgba(0,0,0,0.4), 0 4px 16px rgba(201,168,76,0.06);
  }
  .testimonial-card:not(.active) {
    opacity: 0.35;
  }

  .testimonial-quote-mark {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(80px, 12vw, 140px);
    line-height: 0.6;
    color: #C9A84C;
    opacity: 0.5;
    user-select: none;
    pointer-events: none;
  }

  .testimonial-name {
    font-family: 'Montserrat', sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #F5F0E8;
  }
  .testimonial-service {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: 14px;
    color: #C9A84C;
    margin-top: 3px;
  }

  /* Progress bar */
  .testimonial-progress-track {
    background: #2A2A2A;
    border-radius: 1px;
    overflow: hidden;
    height: 2px;
  }
  .testimonial-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #C9A84C, #E2C97E);
    border-radius: 1px;
    transition: width 0.1s linear;
    box-shadow: 0 0 6px rgba(201,168,76,0.4);
  }

  /* Nav buttons */
  .testimonial-nav-btn {
    width: 40px;
    height: 40px;
    border: 1px solid #2A2A2A;
    background: transparent;
    color: #888888;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    flex-shrink: 0;
  }
  .testimonial-nav-btn:hover {
    border-color: #C9A84C;
    color: #C9A84C;
    background: rgba(201,168,76,0.06);
  }
  .testimonial-nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  /* Star */
  .star-icon { color: #C9A84C; }

  @media (prefers-reduced-motion: reduce) {
    .testimonial-card { transition: none; }
    .testimonial-progress-fill { transition: none; }
  }
`;

export default function LuxuryTestimonials() {
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const DURATION = 6000;

  const goTo = useCallback((index: number) => {
    setCurrent(index);
    setProgress(0);
  }, []);

  const next = useCallback(() => {
    goTo((current + 1) % TESTIMONIALS.length);
  }, [current, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  }, [current, goTo]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setProgress(p => {
        const increment = 100 / (DURATION / 50);
        if (p + increment >= 100) {
          next();
          return 0;
        }
        return p + increment;
      });
    }, 50);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [current, next]);

  const testimonial = TESTIMONIALS[current];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <section style={{
        background: "#141414",
        padding: "clamp(64px, 8vw, 100px) clamp(16px, 4vw, 48px)",
      }}>
        {/* Header */}
        <div style={{ maxWidth: 1320, margin: "0 auto 48px" }}>
          <p style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "#C9A84C",
            marginBottom: 14,
          }}>
            Client Love
          </p>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(30px, 4vw, 50px)",
            fontWeight: 500,
            color: "#F5F0E8",
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
          }}>
            What They Say
          </h2>
          <div style={{ marginTop: 16, width: 60, height: 1.5, background: "linear-gradient(90deg, #C9A84C, #E2C97E40)" }} />
        </div>

        {/* Main testimonial display */}
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 0,
            position: "relative",
          }}>
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.name}
                className={`testimonial-card ${i === current ? "active" : ""}`}
                style={{
                  padding: "clamp(24px, 4vw, 48px)",
                  borderRadius: 3,
                  display: i === current ? "flex" : "none",
                  flexDirection: "column",
                  gap: 20,
                  transition: "opacity 0.6s ease, border-color 0.4s ease, box-shadow 0.4s ease",
                }}
                aria-hidden={i !== current}
              >
                {/* Quote mark + stars */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div className="testimonial-quote-mark">"</div>
                  <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} className="star-icon" fill="#C9A84C" />
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <blockquote>
                  <p style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "clamp(16px, 2.5vw, 22px)",
                    fontWeight: 400,
                    fontStyle: "italic",
                    color: "#F5F0E8",
                    lineHeight: 1.65,
                    letterSpacing: "0.01em",
                  }}>
                    {t.comment}
                  </p>
                </blockquote>

                {/* Attribution */}
                <div style={{ borderTop: "1px solid #2A2A2A", paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p className="testimonial-name">{t.name}</p>
                    <p className="testimonial-service">{t.service}</p>
                  </div>
                  {t.location && (
                    <p style={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontSize: 10,
                      fontWeight: 500,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "#555",
                    }}>
                      {t.location}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Navigation + Progress */}
          <div style={{
            marginTop: 24,
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}>
            {/* Prev */}
            <button
              className="testimonial-nav-btn"
              onClick={prev}
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Progress + Dots */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Progress bar */}
              <div className="testimonial-progress-track">
                <div
                  className="testimonial-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Dots */}
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                {TESTIMONIALS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 4,
                      cursor: "pointer",
                    }}
                    aria-label={`Go to testimonial ${i + 1}`}
                  >
                    <div style={{
                      width: i === current ? 20 : 6,
                      height: 2,
                      background: i === current ? "#C9A84C" : "#2A2A2A",
                      borderRadius: 1,
                      transition: "width 0.4s cubic-bezier(0.22,1,0.36,1), background 0.3s ease",
                      boxShadow: i === current ? "0 0 8px rgba(201,168,76,0.4)" : "none",
                    }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Next */}
            <button
              className="testimonial-nav-btn"
              onClick={next}
              aria-label="Next testimonial"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Caption counter */}
          <p style={{
            marginTop: 20,
            textAlign: "center",
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0.2em",
            color: "#444",
          }}>
            {String(current + 1).padStart(2, "0")} / {String(TESTIMONIALS.length).padStart(2, "0")}
          </p>
        </div>
      </section>
    </>
  );
}