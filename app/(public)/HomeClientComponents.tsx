"use client";
// Autonomous client sub-components for the homepage
// These are extracted so the main page.tsx can be a server component (for DB fetching)

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

// ─────────────────────────────────────────────
// HERO SLIDER
// ─────────────────────────────────────────────
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

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [slide, setSlide] = useState(0);
  const [typedText, setTypedText] = useState("");
  const t = useTranslations();

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => setSlide((s) => (s + 1) % slides.length), 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Typewriter effect for subtitle
  useEffect(() => {
    const text = slides[slide]?.subtitle ?? "";
    setTypedText("");
    if (!text) return;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setTypedText(text.slice(0, i));
      if (i >= text.length) clearInterval(timer);
    }, 28);
    return () => clearInterval(timer);
  }, [slide, slides]);

  if (!slides.length) return null;
  const current = slides[slide];

  return (
    <section className="relative h-screen min-h-[600px] overflow-hidden">
      {/* Ken Burns zoom effect on active slide */}
      {slides.map((s, i) => (
        <div key={s.id} className={`absolute inset-0 transition-opacity duration-1000 ${i === slide ? "opacity-100" : "opacity-0"}`}>
          <img
            src={s.imageUrl}
            alt={s.eyebrow ?? s.title}
            className="w-full h-full object-cover"
            style={{
              transform: i === slide ? "scale(1.08)" : "scale(1)",
              transition: "transform 6s ease-out",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />
          {/* Bottom vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
      ))}

      {/* Floating gold particles */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-gold/20 float" style={{ animationDelay: "0s" }} />
        <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 rounded-full bg-gold/15 float" style={{ animationDelay: "1.5s" }} />
        <div className="absolute bottom-1/4 left-1/3 w-1 h-1 rounded-full bg-gold/25 float" style={{ animationDelay: "3s" }} />
      </div>

      <div className="relative z-10 h-full flex items-center">
        <div className="container-salon px-4 sm:px-8">
          <div className="max-w-2xl">
            {current.eyebrow && (
              <span
                key={`eyebrow-${slide}`}
                className="font-accent text-sm uppercase tracking-[0.4em] text-gold mb-4 block"
                style={{ animation: "fadeUp 0.6s ease-out both" }}
              >
                {current.eyebrow}
              </span>
            )}
            <h1
              key={`title-${slide}`}
              className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-4"
              style={{ animation: "fadeUp 0.6s ease-out 0.15s both" }}
            >
              {current.title}
              {current.titleItalic && <><br /><em className="text-gradient-gold" style={{ WebkitTextFillColor: "transparent" }}>{current.titleItalic}</em></>}
            </h1>
            {current.subtitle && (
              <p className="text-white/70 text-lg mb-8 min-h-[28px]">
                {typedText}
                <span className="inline-block w-0.5 h-5 bg-gold/70 ml-0.5 align-middle" style={{ animation: "pulseGold 1s ease-in-out infinite" }} />
              </p>
            )}
            <div
              className="flex flex-wrap gap-4"
              style={{ animation: "fadeUp 0.6s ease-out 0.45s both" }}
            >
              <Link href={current.ctaHref} className="btn-gold px-8 py-4 text-sm gold-glow">{current.ctaLabel}</Link>
              <Link href="/services" className="btn-outline px-8 py-4 text-sm text-white border-white hover:bg-white hover:text-espresso">
                {t('hero.ourServices')}
              </Link>
            </div>
            <div
              className="flex flex-wrap items-center gap-6 mt-6 pt-6 border-t border-white/10"
              style={{ animation: "fadeUp 0.6s ease-out 0.6s both" }}
            >
              <div className="flex items-center gap-2">
                <div className="flex">{[...Array(5)].map((_, i) => <span key={i} className="text-gold text-sm">★</span>)}</div>
                <span className="text-white/60 text-xs">{t('hero.rating')}</span>
              </div>
              <div className="w-px h-4 bg-white/20 hidden sm:block" />
              <span className="text-white/60 text-xs">📍 {t('hero.location')}</span>
              <div className="w-px h-4 bg-white/20 hidden sm:block" />
              <span className="text-white/60 text-xs">⏰ {t('hero.openHours')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Slide indicators — upgraded with active animation */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setSlide(i)}
              className={`h-1 transition-all duration-500 rounded-full ${i === slide ? "bg-gold w-12" : "bg-white/40 w-6 hover:bg-white/60"}`} />
          ))}
        </div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────
// ANIMATED COUNTER SECTION
// ─────────────────────────────────────────────
const counterTargets = [15, 500, 30, 365];
const counterLabels  = ["counters.yearsExperience", "counters.happyClients", "counters.services", "counters.daysOpen"];
const counterSuffixes = ["+", "+", "+", ""];

export function AnimatedCounters() {
  const [vals, setVals] = useState([0, 0, 0, 0]);
  const ref = useRef<HTMLDivElement>(null);
  const animated = useRef(false);
  const t = useTranslations();

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !animated.current) {
        animated.current = true;
        counterTargets.forEach((target, i) => {
          let start = 0;
          const step = Math.ceil(target / 40);
          const interval = setInterval(() => {
            start = Math.min(start + step, target);
            setVals(prev => { const n = [...prev]; n[i] = start; return n; });
            if (start >= target) clearInterval(interval);
          }, 40);
        });
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
      {counterTargets.map((_, i) => (
        <div key={i} className="text-center">
          <p className="font-display text-3xl font-bold text-gold">{vals[i]}{counterSuffixes[i]}</p>
          <p className="text-cream/50 text-xs mt-1">{t(counterLabels[i])}</p>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// PRICING TABS
// ─────────────────────────────────────────────
const PRICING: { [k: string]: { name: string; desc: string; price: string }[] } = {
  "Hair Services": [
    { name: "Haircut & Blow Dry", desc: "Professional cut with styling", price: "Rs.500" },
    { name: "Blow Dry & Curl", desc: "Voluminous curls & styling", price: "Rs.400" },
    { name: "Shampoo & Set", desc: "Wash and setting", price: "Rs.300" },
    { name: "Hair Color", desc: "Global or highlight coloring", price: "Rs.1,200+" },
    { name: "Keratin Treatment", desc: "Smooth, frizz-free hair", price: "Rs.3,500+" },
    { name: "Hair Spa", desc: "Deep conditioning treatment", price: "Rs.800+" },
  ],
  "Skin Care": [
    { name: "Gold Facial", desc: "Premium gold-infused facial", price: "Rs.1,200" },
    { name: "Cleanup", desc: "Deep cleansing & toning", price: "Rs.350" },
    { name: "Bleach", desc: "Skin brightening treatment", price: "Rs.250" },
    { name: "Body Polish", desc: "Full body exfoliation", price: "Rs.2,500+" },
    { name: "Full Body Waxing", desc: "Complete body waxing", price: "Rs.1,200+" },
    { name: "Threading", desc: "Precise eyebrow shaping", price: "Rs.50+" },
  ],
  "Bridal": [
    { name: "Basic Bridal", desc: "Essential bridal makeup", price: "Rs.8,000" },
    { name: "Premium Bridal", desc: "HD makeup with draping", price: "Rs.14,000+" },
    { name: "Royal Bridal Package", desc: "Complete bridal experience", price: "Rs.20,000+" },
    { name: "Party Makeup", desc: "Glamorous party look", price: "Rs.2,500+" },
    { name: "Engagement Makeup", desc: "Stunning engagement look", price: "Rs.5,000+" },
  ],
  "Nails": [
    { name: "Manicure", desc: "Hand care & nail shaping", price: "Rs.300" },
    { name: "Pedicure", desc: "Foot care & treatment", price: "Rs.400" },
    { name: "Nail Art", desc: "Creative nail designs", price: "Rs.50+/nail" },
    { name: "Gel Nails", desc: "Long-lasting gel polish", price: "Rs.800+" },
    { name: "Extensions", desc: "Nail extension application", price: "Rs.1,500+" },
  ],
};

export function PricingTabs() {
  const [tab, setTab] = useState("Hair Services");
  return (
    <>
      <div className="flex justify-center gap-2 mb-8 flex-wrap">
        {Object.keys(PRICING).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-semibold transition-all rounded-sm ${tab === t ? "bg-gold text-white" : "bg-cream text-charcoal hover:bg-cream-darker"}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="max-w-2xl mx-auto bg-cream rounded-sm overflow-hidden">
        {PRICING[tab].map((item, i) => (
          <div key={i} className={`flex items-center justify-between px-6 py-4 ${i < PRICING[tab].length - 1 ? "border-b border-cream-darker/50" : ""}`}>
            <div>
              <p className="font-display text-espresso text-sm">{item.name}</p>
              <p className="text-charcoal-lighter text-xs mt-0.5">{item.desc}</p>
            </div>
            <p className="font-display text-gold font-bold text-sm whitespace-nowrap ml-4">{item.price}</p>
          </div>
        ))}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// NEWSLETTER
// ─────────────────────────────────────────────
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [msg, setMsg] = useState("");
  const t = useTranslations();

  const handleSubmit = async () => {
    if (!email.trim()) { setMsg(t('common.error')); setStatus("error"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setMsg(t('common.error')); setStatus("error"); return; }
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (res.ok) { setStatus("success"); setMsg(t('homepage.subscribed')); setEmail(""); }
      else { setStatus("error"); setMsg(data.error ?? t('common.error')); }
    } catch { setStatus("error"); setMsg(t('common.error')); }
  };

  return (
    <div className="flex flex-col gap-2 w-full sm:w-auto">
      <div className="flex gap-2">
        <input type="email" value={email} onChange={e => { setEmail(e.target.value); setStatus("idle"); }}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          placeholder={t('homepage.emailPlaceholder')}
          disabled={status === "loading" || status === "success"}
          className="flex-1 sm:w-72 bg-white/10 border border-white/30 text-white placeholder-white/50 px-4 py-3 text-sm focus:outline-none focus:border-white rounded-sm disabled:opacity-60" />
        <button onClick={handleSubmit} disabled={status === "loading" || status === "success"}
          className="bg-espresso text-white px-6 py-3 text-sm font-semibold hover:bg-espresso/80 transition-colors rounded-sm disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap">
          {status === "loading" ? "..." : status === "success" ? `✓ ${t('common.done')}` : t('homepage.subscribe')}
        </button>
      </div>
      {msg && <p className={`text-xs font-medium ${status === "success" ? "text-white" : "text-red-200"}`}>{msg}</p>}
    </div>
  );
}
