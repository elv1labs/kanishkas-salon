// app/(public)/page.tsx — SERVER COMPONENT
// All images, slides, gallery, and team data pulled from database.
// Interactive parts (slider, counters, pricing tabs, newsletter) are client sub-components.
// force-dynamic: ensures admin media changes (hero slides, site images, gallery, team)
// are reflected immediately without requiring a rebuild.
export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { HeroSlider, AnimatedCounters, PricingTabs, NewsletterForm } from "./HomeClientComponents";

// ─────────────────────────────────────────────
// FALLBACK DATA (if DB is empty)
// ─────────────────────────────────────────────
const FALLBACK_SLIDES = [
  {
    id: "f1", imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&h=900&fit=crop&q=80",
    eyebrow: "Indore's Premier Salon", title: "Kanishka's Family", titleItalic: "Salon & Academy",
    subtitle: "Step into a world of beauty & luxury — trusted by 500+ happy clients in Indore",
    ctaLabel: "Book Appointment", ctaHref: "/book",
  },
  {
    id: "f2", imageUrl: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1600&h=900&fit=crop&q=80",
    eyebrow: "Bridal Services", title: "Your Dream", titleItalic: "Wedding Look",
    subtitle: "Premium bridal packages crafted with love", ctaLabel: "Book Appointment", ctaHref: "/book",
  },
  {
    id: "f3", imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1600&h=900&fit=crop&q=80",
    eyebrow: "Beauty & Care", title: "Glow With", titleItalic: "Confidence",
    subtitle: "Expert skincare & hair treatments", ctaLabel: "Book Appointment", ctaHref: "/book",
  },
];

const FALLBACK_GALLERY = [
  { id: "g1", imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=500&fit=crop&q=80", title: null, altText: null, isWide: false },
  { id: "g2", imageUrl: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&h=300&fit=crop&q=80", title: null, altText: null, isWide: false },
  { id: "g3", imageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=300&fit=crop&q=80", title: null, altText: null, isWide: false },
  { id: "g4", imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=300&fit=crop&q=80", title: null, altText: null, isWide: true },
  { id: "g5", imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop&q=80", title: null, altText: null, isWide: false },
];

const FALLBACK_SITE_IMAGES: Record<string, string> = {
  homepage_about:  "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&h=750&fit=crop&q=80",
  why_us_photo:    "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&h=600&fit=crop&q=80",
  cta_background:  "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&h=600&fit=crop&q=80",
};

const FALLBACK_TEAM = [
  { id: "t1", name: "Ms. Kanishka Sen", avatarUrl: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=300&h=300&fit=crop&q=80", designation: "Founder & Lead Stylist" },
  { id: "t2", name: "Priya Verma",       avatarUrl: "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=300&h=300&fit=crop&q=80", designation: "Senior Makeup Artist" },
  { id: "t3", name: "Anita Sharma",      avatarUrl: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=300&h=300&fit=crop&q=80", designation: "Academy Head" },
];

const TEAM_FALLBACK_AVATARS = [
  "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=300&h=300&fit=crop&q=80",
  "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=300&h=300&fit=crop&q=80",
  "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=300&h=300&fit=crop&q=80",
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&h=300&fit=crop&q=80",
];

const SERVICE_CARDS = [
  { img: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=600&h=700&fit=crop&q=80", label: "Bridal", title: "Bridal Makeup", href: "/services?cat=BRIDAL" },
  { img: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=700&fit=crop&q=80", label: "Hair", title: "Hair Styling", href: "/services?cat=HAIR_STYLING" },
  { img: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=700&fit=crop&q=80", label: "Nails", title: "Nail Art", href: "/services?cat=NAIL_CARE" },
];

const SERVICES_GRID = [
  { img: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop&q=80", title: "Hair Styling", desc: "Expert cuts, styling, and blowouts for every occasion.", href: "/services?cat=HAIR_STYLING" },
  { img: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=300&fit=crop&q=80", title: "Skin Care", desc: "Facials, cleanups, and advanced skin treatments.", href: "/services?cat=SKIN_CARE" },
  { img: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&h=300&fit=crop&q=80", title: "Bridal Makeup", desc: "Complete bridal packages for your perfect day.", href: "/services?cat=BRIDAL" },
  { img: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=300&fit=crop&q=80", title: "Nail Art", desc: "Manicures, pedicures, gel nails, and nail art.", href: "/services?cat=NAIL_CARE" },
  { img: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&h=300&fit=crop&q=80", title: "Waxing & Threading", desc: "Full body waxing and precise threading services.", href: "/services?cat=WAXING" },
  { img: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&h=300&fit=crop&q=80", title: "Academy", desc: "Professional beauty courses and certifications.", href: "/services?cat=ACADEMY" },
];

const TESTIMONIALS = [
  { name: "Priya Sharma",  service: "Bridal Makeup", rating: 5, comment: "Kanishka ma'am made me look absolutely stunning on my wedding day. The bridal package was worth every penny!" },
  { name: "Anjali Patel",  service: "Hair Spa",      rating: 5, comment: "Best hair spa experience in Indore! My hair felt so soft and rejuvenated. Pure luxury." },
  { name: "Ritu Agrawal",  service: "Gold Facial",   rating: 5, comment: "I've been coming here for 3 years. The gold facial is divine — my skin glows for weeks." },
  { name: "Meera Joshi",   service: "Nail Art",      rating: 5, comment: "The nail art here is incredible. So creative and long-lasting. Love this salon!" },
];

// ─────────────────────────────────────────────
// DATA FETCHERS
// ─────────────────────────────────────────────
async function getHeroSlides() {
  try {
    const slides = await prisma.heroSlide.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return slides.length > 0 ? slides : FALLBACK_SLIDES;
  } catch {
    return FALLBACK_SLIDES;
  }
}

async function getFeaturedGallery() {
  try {
    const items = await prisma.galleryItem.findMany({
      where: { isPublished: true, isFeatured: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    return items.length > 0 ? items.map(i => ({ id: i.id, imageUrl: i.imageUrl, title: i.title, altText: i.altText, isWide: false })) : FALLBACK_GALLERY;
  } catch {
    return FALLBACK_GALLERY;
  }
}

async function getActiveStaff() {
  try {
    const staff = await prisma.user.findMany({
      where: { staffProfile: { isNot: null }, isActive: true },
      include: { staffProfile: true },
      take: 6,
    });
    if (staff.length === 0) return FALLBACK_TEAM;
    return staff.map((s, i) => ({
      id: s.id,
      name: s.name ?? "Staff Member",
      avatarUrl: s.staffProfile?.avatarUrl ?? TEAM_FALLBACK_AVATARS[i % TEAM_FALLBACK_AVATARS.length],
      designation: s.staffProfile?.designation ?? "Beauty Specialist",
    }));
  } catch {
    return FALLBACK_TEAM;
  }
}

async function getSiteImages(): Promise<Record<string, string>> {
  try {
    const rows = await prisma.siteImage.findMany({ where: { key: { in: ["homepage_about", "why_us_photo", "cta_background"] } } });
    const map: Record<string, string> = { ...FALLBACK_SITE_IMAGES };
    for (const row of rows) map[row.key] = row.imageUrl;
    return map;
  } catch {
    return FALLBACK_SITE_IMAGES;
  }
}

async function getBlogPreviews() {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 3,
      select: { title: true, slug: true, excerpt: true, coverImage: true, category: true, readTime: true },
    });
    return posts.map(p => ({
      img: p.coverImage ?? "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&h=250&fit=crop&q=80",
      title: p.title,
      cat: p.category ?? "Beauty",
      desc: p.excerpt ?? "",
      time: `${p.readTime ?? 4} min`,
      slug: p.slug,
    }));
  } catch {
    return [
      { img: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&h=250&fit=crop&q=80", title: "10 Bridal Makeup Trends for 2025", cat: "Bridal", desc: "Discover the hottest bridal makeup trends that will make you glow.", time: "5 min", slug: "bridal-makeup-trends-2025" },
      { img: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=250&fit=crop&q=80", title: "Hair Spa vs Hair Botox: Which Is Right?", cat: "Hair Care", desc: "Understand the key differences between hair spa and botox treatments.", time: "4 min", slug: "hair-spa-vs-botox" },
      { img: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=250&fit=crop&q=80", title: "5 Skincare Mistakes You're Making", cat: "Skin Care", desc: "Common habits that might be damaging your skin, and how to fix them.", time: "3 min", slug: "skincare-mistakes" },
    ];
  }
}

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────
export default async function HomePage() {
  const [slides, gallery, team, siteImages, blogs, t] = await Promise.all([
    getHeroSlides(),
    getFeaturedGallery(),
    getActiveStaff(),
    getSiteImages(),
    getBlogPreviews(),
    getTranslations(),
  ]);

  return (
    <>
      {/* ── HERO ── */}
      <HeroSlider slides={slides} />

      {/* ── SERVICE HIGHLIGHT CARDS ── */}
      <section className="section-padding bg-cream-textured section-divider-wave-espresso">
        <div className="container-salon px-4">
          <div className="text-center mb-12 reveal">
            <span className="font-accent text-sm uppercase tracking-widest text-gold">{t('homepage.satisfactionPriority')}</span>
            <div className="ornament-separator"><span className="text-gold/60">✦</span></div>
            <h2 className="font-display text-3xl sm:text-4xl text-espresso mt-2">{t('homepage.salonServices')}</h2>
            <p className="text-charcoal-lighter mt-3 max-w-lg mx-auto">{t('homepage.salonServicesDesc')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {SERVICE_CARDS.map((c, i) => (
              <Link key={c.title} href={c.href} className={`group relative overflow-hidden rounded-sm aspect-[3/4] block reveal delay-${(i + 1) * 100}`}>
                <img src={c.img} alt={c.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="text-gold text-xs uppercase tracking-widest font-accent">{c.label}</span>
                  <h3 className="font-display text-2xl text-white mt-1">{c.title}</h3>
                  <span className="text-white/60 text-sm mt-2 inline-block group-hover:text-gold transition-colors">{t('homepage.explore')}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── LOCATION ── */}
      <section className="section-padding bg-espresso-rich relative overflow-hidden section-divider-wave-espresso">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-gold/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full bg-rose-gold/5 blur-3xl pointer-events-none" />
        <div className="container-salon px-4 relative z-10">
          <div className="text-center mb-10 reveal">
            <span className="font-accent text-sm uppercase tracking-widest text-gold">{t('homepage.findUs')}</span>
            <h2 className="font-display text-3xl sm:text-4xl text-cream mt-2">{t('homepage.visitUsInIndore')}</h2>
            <p className="text-cream/50 mt-3 max-w-md mx-auto text-sm">{t('homepage.visitUsInIndoreDesc')}</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            <div className="reveal rounded-sm overflow-hidden shadow-2xl" style={{ minHeight: 340 }}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3680.5488!2d75.8494!3d22.7175!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3962fd0b1e3c35b1%3A0xe5b234e56afc5bd6!2sAnand%20Bazar%2C%20Baikunth%20Dham%2C%20Indore%2C%20Madhya%20Pradesh%20452001!5e0!3m2!1sen!2sin!4v1711700000000!5m2!1sen!2sin"
                width="100%" height="100%" style={{ border: 0, minHeight: 340, width: "100%" }}
                allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                title="Kanishka's Family Salon Location — Anand Bazar, Indore"
              />
            </div>
            <div className="reveal-right rounded-sm p-8 flex flex-col justify-between" style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(201,168,76,0.2)" }}>
              <div className="space-y-6">
                {[
                  { icon: "📍", label: "Address", value: "Anand Bazar, Baikunth Dham\nIndore, Madhya Pradesh 452001", href: "https://maps.google.com/?q=Anand+Bazar+Baikunth+Dham+Indore" },
                  { icon: "📞", label: "Phone", value: "+91 9171230292", href: "tel:+919171230292" },
                  { icon: "📧", label: "Email", value: "kanishkasen100@gmail.com", href: "mailto:kanishkasen100@gmail.com" },
                  { icon: "⏰", label: "Hours", value: "Open 7 Days a Week\n10:00 AM – 9:00 PM", href: null },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gold/15 border border-gold/20 flex-shrink-0 flex items-center justify-center text-lg">{item.icon}</div>
                    <div>
                      <p className="font-semibold text-cream/90 text-sm">{item.label}</p>
                      {item.href ? (
                        <a href={item.href} className="text-cream/60 text-sm mt-0.5 hover:text-gold transition-colors whitespace-pre-line block">{item.value}</a>
                      ) : (
                        <p className="text-cream/60 text-sm mt-0.5 whitespace-pre-line">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-white/10">
                <a href="https://maps.google.com/?q=Anand+Bazar+Baikunth+Dham+Indore" target="_blank" rel="noopener noreferrer" className="btn-gold flex-1 text-center">{t('homepage.getDirections')}</a>
                <a href="https://wa.me/919171230292?text=Hi%2C%20I%27d%20like%20to%20book%20an%20appointment" target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white font-semibold tracking-widest uppercase text-xs px-6 py-3 hover:bg-[#1ea855] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 fill-white" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section className="section-padding bg-espresso-rich section-divider-wave-cream">
        <div className="container-salon px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="relative rounded-sm overflow-hidden aspect-[4/5]">
                <img src={siteImages.homepage_about} alt="Salon interior" className="w-full h-full object-cover" />
                <div className="absolute bottom-6 right-6 bg-gold px-6 py-4 text-center">
                  <p className="font-display text-3xl font-bold text-white">15+</p>
                  <p className="text-white/80 text-xs uppercase tracking-wider">{t('homepage.yearsExcellence')}</p>
                </div>
              </div>
            </div>
            <div className="reveal-right">
              <span className="font-accent text-sm uppercase tracking-widest text-gold">{t('homepage.aboutUs')}</span>
              <h2 className="font-display text-3xl sm:text-4xl text-cream mt-2 mb-4 text-gradient-gold">{t('homepage.aboutTitle')}</h2>
              <div className="w-16 h-0.5 bg-gold mb-6" />
              <p className="text-cream/60 mb-4">{t('homepage.aboutDesc1')}</p>
              <p className="text-cream/60 mb-8">{t('homepage.aboutDesc2')}</p>
              <AnimatedCounters />
              <Link href="/about" className="btn-outline text-cream border-cream hover:bg-cream hover:text-espresso">{t('homepage.readMore')}</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES GRID ── */}
      <section className="section-padding bg-cream-textured bg-dots section-divider-wave-white">
        <div className="container-salon px-4">
          <div className="text-center mb-12 reveal">
            <span className="font-accent text-sm uppercase tracking-widest text-gold">{t('homepage.whatWeOffer')}</span>
            <div className="ornament-separator"><span className="text-gold/60">✦</span></div>
            <h2 className="font-display text-3xl sm:text-4xl text-espresso mt-2">{t('homepage.premiumTreatments')}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES_GRID.map((s, i) => (
              <Link key={s.title} href={s.href} className={`group card-luxury rounded-sm overflow-hidden reveal-scale delay-${i * 100}`}>
                <div className="relative overflow-hidden aspect-video">
                  <img src={s.img} alt={s.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg text-espresso mb-1">{s.title}</h3>
                  <p className="text-charcoal-lighter text-sm">{s.desc}</p>
                  <span className="text-gold text-xs font-semibold mt-3 inline-block group-hover:translate-x-1 transition-transform">{t('homepage.viewDetails')}</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-10">
              <Link href="/services" className="btn-gold gold-glow">{t('homepage.viewAllServices')}</Link>
          </div>
        </div>
      </section>

      {/* ── WHY US ── */}
      <section className="section-padding bg-white section-divider-wave-cream">
        <div className="container-salon px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative rounded-sm overflow-hidden aspect-square">
              <img src={siteImages.why_us_photo} alt="Salon experience" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="font-accent text-sm uppercase tracking-widest text-gold">{t('homepage.whyChooseUs')}</span>
              <h2 className="font-display text-3xl sm:text-4xl text-espresso mt-2 mb-8">{t('homepage.kanishkaStandard')}</h2>
              <div className="space-y-6">
                {[
                  { title: t('homepage.expertSpecialists'), desc: t('homepage.expertSpecialistsDesc') },
                  { title: t('homepage.premiumProducts'), desc: t('homepage.premiumProductsDesc') },
                  { title: t('homepage.customerService'), desc: t('homepage.customerServiceDesc') },
                  { title: t('homepage.luxuryLounge'), desc: t('homepage.luxuryLoungeDesc') },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-gold text-xs font-bold">{i + 1}</span>
                    </div>
                    <div>
                      <h3 className="font-display text-base text-espresso mb-1">{item.title}</h3>
                      <p className="text-charcoal-lighter text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TEAM ── */}
      <section className="section-padding bg-cream-textured section-divider-wave-espresso">
        <div className="container-salon px-4">
          <div className="text-center mb-12">
            <span className="font-accent text-sm uppercase tracking-widest text-gold">{t('homepage.ourExperts')}</span>
            <div className="ornament-separator"><span className="text-gold/60">✦</span></div>
            <h2 className="font-display text-3xl sm:text-4xl text-espresso mt-2">{t('homepage.meetTheArtists')}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {team.map((m, i) => (
              <div key={m.id} className={`text-center group reveal delay-${i * 200}`}>
                <div className="relative w-40 h-40 rounded-full overflow-hidden mx-auto mb-4 border-4 border-cream-darker group-hover:border-gold transition-colors duration-300">
                  <img src={m.avatarUrl} alt={m.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                </div>
                <h3 className="font-display text-lg text-espresso">{m.name}</h3>
                <p className="text-charcoal-lighter text-sm mt-1">{m.designation}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="section-padding bg-espresso-rich section-divider-wave-cream">
        <div className="container-salon px-4">
          <div className="text-center mb-12">
            <span className="font-accent text-sm uppercase tracking-widest text-gold">{t('homepage.clientLove')}</span>
            <div className="ornament-separator"><span className="text-gold/40">✦</span></div>
            <h2 className="font-display text-3xl sm:text-4xl text-cream mt-2 text-gradient-gold">{t('homepage.whatTheySay')}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TESTIMONIALS.map((item, i) => (
              <div key={item.name} className={`reveal delay-${i * 100} card-glass rounded-sm p-6 flex flex-col group cursor-default transition-all duration-300 hover:-translate-y-2 hover:shadow-xl`}
                style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(201,168,76,0.2)", boxShadow: "0 4px 24px rgba(0,0,0,0.2)" }}>
                <div className="flex gap-0.5 mb-4">{Array.from({ length: item.rating }).map((_, j) => <span key={j} className="text-gold text-sm">★</span>)}</div>
                <p className="text-cream/70 text-sm leading-relaxed mb-4 flex-1">&ldquo;{item.comment}&rdquo;</p>
                <div className="border-t border-white/10 pt-4">
                  <p className="font-display text-cream text-sm">{item.name}</p>
                  <p className="text-gold text-xs mt-0.5 font-accent">{item.service}</p>
                  <p className="text-cream/30 text-xs mt-0.5">Indore</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GALLERY ── */}
      <section className="section-padding bg-cream-textured bg-lines section-divider-wave-white">
        <div className="container-salon px-4">
          <div className="text-center mb-12">
            <span className="font-accent text-sm uppercase tracking-widest text-gold">{t('homepage.ourWork')}</span>
            <div className="ornament-separator"><span className="text-gold/60">✦</span></div>
            <h2 className="font-display text-3xl sm:text-4xl text-espresso mt-2">{t('homepage.beautyGallery')}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 h-[500px]">
            {gallery[0] && (
              <div className="row-span-2 rounded-sm overflow-hidden">
                <img src={gallery[0].imageUrl} alt={gallery[0].altText ?? gallery[0].title ?? "Gallery"} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
            )}
            {gallery.slice(1).map((item) => (
              <div key={item.id} className="rounded-sm overflow-hidden">
                <img src={item.imageUrl} alt={item.altText ?? item.title ?? "Gallery"} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/gallery" className="btn-outline">{t('homepage.viewFullGallery')}</Link>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="section-padding bg-white">
        <div className="container-salon px-4">
          <div className="text-center mb-12">
            <span className="font-accent text-sm uppercase tracking-widest text-gold">{t('homepage.transparentPricing')}</span>
            <div className="ornament-separator"><span className="text-gold/60">✦</span></div>
            <h2 className="font-display text-3xl sm:text-4xl text-espresso mt-2">{t('homepage.serviceMenu')}</h2>
          </div>
          <PricingTabs />
        </div>
      </section>

      {/* ── BOOKING CTA ── */}
      <section className="relative py-24 overflow-hidden">
        <img src={siteImages.cta_background} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-espresso/80" />
        <div className="relative z-10 container-salon px-4">
          <div className="max-w-3xl mx-auto text-center">
            <span className="font-accent text-sm uppercase tracking-widest text-gold mb-4 block">{t('homepage.readyToGlow')}</span>
            <h2 className="font-display text-3xl sm:text-5xl font-bold text-cream mb-6 text-gradient-gold">{t('homepage.bookYourSalonExperience')}</h2>
            <p className="text-cream/60 mb-8">{t('homepage.bookYourSalonExperienceDesc')}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link href="/book" className="btn-gold px-10 py-4 gold-glow pulse-gold">{t('nav.bookAppointment')}</Link>
              <a href="tel:+919171230292" className="btn-outline text-cream border-cream hover:bg-cream hover:text-espresso px-10 py-4">+91 9171230292</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── BLOG ── */}
      <section className="section-padding bg-cream-textured">
        <div className="container-salon px-4">
          <div className="text-center mb-12">
            <span className="font-accent text-sm uppercase tracking-widest text-gold">{t('homepage.beautyTips')}</span>
            <div className="ornament-separator"><span className="text-gold/60">✦</span></div>
            <h2 className="font-display text-3xl sm:text-4xl text-espresso mt-2">{t('homepage.latestArticles')}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {blogs.map((b, i) => (
              <Link key={b.slug} href={`/blog/${b.slug}`} className={`group card-luxury rounded-sm overflow-hidden reveal delay-${i * 150}`}>
                <div className="relative overflow-hidden aspect-video">
                  <img src={b.img} alt={b.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <span className="absolute top-3 left-3 bg-gold text-white text-xs px-2 py-1 font-semibold">{b.cat}</span>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-base text-espresso mb-2 group-hover:text-gold transition-colors">{b.title}</h3>
                  <p className="text-charcoal-lighter text-xs">{b.desc}</p>
                  <p className="text-xs text-charcoal-lighter mt-3">{b.time} read</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ── */}
      <section className="bg-gold py-16">
        <div className="container-salon px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-display text-2xl text-white">{t('homepage.subscribeNewsletter')}</h3>
              <p className="text-white/70 mt-1">{t('homepage.subscribeDesc')}</p>
            </div>
            <NewsletterForm />
          </div>
        </div>
      </section>

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
