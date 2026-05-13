// app/(public)/page.tsx — SERVER COMPONENT
// Luxury dark redesign 2026 — cinematic hero, editorial bento services,
// magazine testimonials, radial-glow CTA.
export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import CinematicHero from "@/components/CinematicHero";
import LuxuryStatsStrip from "@/components/LuxuryStatsStrip";
import BentoServicesGrid from "@/components/BentoServicesGrid";
import LuxuryTestimonials from "@/components/LuxuryTestimonials";
import LuxuryCTA from "@/components/LuxuryCTA";

const FALLBACK_SLIDES = [
  {
    id: "f1",
    imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1800&h=1000&fit=crop&q=85",
    eyebrow: "Indore's Premier Salon",
    title: "Kanishka's Family",
    titleItalic: "Salon & Academy",
    subtitle: "Step into a world of beauty & luxury — trusted by hundreds of happy clients in Indore since 2009",
    ctaLabel: "Book Appointment",
    ctaHref: "/book",
  },
  {
    id: "f2",
    imageUrl: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=1800&h=1000&fit=crop&q=85",
    eyebrow: "Bridal Services",
    title: "Your Dream",
    titleItalic: "Wedding Look",
    subtitle: "Premium bridal packages crafted with love and precision — HD makeup, draping, hairstyling & more",
    ctaLabel: "Book Bridal",
    ctaHref: "/book",
  },
  {
    id: "f3",
    imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1800&h=1000&fit=crop&q=85",
    eyebrow: "Beauty & Care",
    title: "Glow With",
    titleItalic: "Confidence",
    subtitle: "Expert skincare, hair treatments, and nail art — premium products, lasting results",
    ctaLabel: "Book Appointment",
    ctaHref: "/book",
  },
];

async function getHeroSlides() {
  try {
    const slides = await prisma.heroSlide.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return slides.length > 0 ? slides : FALLBACK_SLIDES;
  } catch { return FALLBACK_SLIDES; }
}

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────
export default async function HomePage() {
  const [slides, t] = await Promise.all([
    getHeroSlides(),
    getTranslations(),
  ]);

  return (
    <>
      {/* ── CINEMATIC HERO ── */}
      <CinematicHero slides={slides} />

      {/* ── STATS TRUST STRIP (dark, gold rules, count-up) ── */}
      <LuxuryStatsStrip />

      {/* ── SERVICES BENTO GRID (asymmetric editorial) ── */}
      <BentoServicesGrid />

      {/* ── TESTIMONIALS (magazine-style, gold progress bar) ── */}
      <LuxuryTestimonials />

      {/* ── BOOKING CTA (full-bleed radial gold glow) ── */}
      <LuxuryCTA />

      {/* ── JSON-LD ── */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "BeautySalon",
        "name": "Kanishka's Family Salon & Academy",
        "description": "Premier beauty salon and academy in Indore, Madhya Pradesh offering professional hair styling, makeup, skin care, nail art, bridal packages, and beauty academy courses.",
        "address": { "@type": "PostalAddress", "streetAddress": "Anand Bazar, Baikunth Dham", "addressLocality": "Indore", "addressRegion": "Madhya Pradesh", "postalCode": "452001", "addressCountry": "IN" },
        "geo": { "@type": "GeoCoordinates", "latitude": 22.7175, "longitude": 75.8494 },
        "telephone": "+91-9171230292", "email": "kanishkasen100@gmail.com",
        "openingHoursSpecification": [{ "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"], "opens": "10:00", "closes": "21:00" }],
        "priceRange": "₹₹", "areaServed": { "@type": "City", "name": "Indore" },
      }) }} />
    </>
  );
}