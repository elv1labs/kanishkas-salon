// Re-fetch founder photo and staff on every request so Media Manager updates appear immediately.
export const dynamic = "force-dynamic";

import type { Metadata } from "next";

import Link from "next/link";
import { Award, Shield, Sparkles, Heart } from "lucide-react";
import { prisma } from "@/lib/prisma";
import MotionWrapper from "@/components/ui/MotionWrapper";
import SectionHeading from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Kanishka Sen and the story behind Kanishka's Family Salon & Academy — 15+ years of beauty expertise in Indore.",
};

const values = [
  { icon: Award,    title: "Expertise", desc: "15+ years of experience with continuous training in the latest beauty techniques and trends." },
  { icon: Sparkles, title: "Luxury",    desc: "Premium products, world-class ambience, and personalized attention for every client." },
  { icon: Shield,   title: "Hygiene",   desc: "Strict sanitization protocols, single-use tools where possible, and a spotless environment." },
  { icon: Heart,    title: "Results",   desc: "We measure success by the smiles and confidence our clients leave with every single time." },
];

const FALLBACK_AVATARS = [
  "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&h=533&fit=crop&q=80",
  "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&h=533&fit=crop&q=80",
  "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=533&fit=crop&q=80",
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=533&fit=crop&q=80",
];

async function getPageData() {
  try {
    const [staff, founderImage] = await Promise.all([
      prisma.user.findMany({
        where: { staffProfile: { isNot: null }, isActive: true },
        include: { staffProfile: true },
        take: 8,
        orderBy: { createdAt: "asc" },
      }),
      prisma.siteImage.findUnique({ where: { key: "about_founder" } }),
    ]);
    return { staff, founderImageUrl: founderImage?.imageUrl ?? null };
  } catch {
    return { staff: [] as any[], founderImageUrl: null };
  }
}

export default async function AboutPage() {
  const { staff, founderImageUrl } = await getPageData();

  const founderImg = founderImageUrl ??
    "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&h=533&fit=crop&q=80";

  // Map staff to display objects, use DB avatarUrl when available
  const teamMembers = staff.length > 0
    ? staff.map((s, i) => ({
        id: s.id,
        name: s.name ?? "Team Member",
        role: s.staffProfile?.designation ?? "Beauty Specialist",
        experience: s.staffProfile?.experience ?? 0,
        specializations: s.staffProfile?.specializations ?? [],
        img: s.staffProfile?.avatarUrl ?? FALLBACK_AVATARS[i % FALLBACK_AVATARS.length],
      }))
    : [
        { id: "1", name: "Kanishka Sen", role: "Founder & Lead Stylist", experience: 15, specializations: ["Bridal Makeup", "Hair Styling"], img: FALLBACK_AVATARS[0] },
        { id: "2", name: "Priya Verma",  role: "Senior Makeup Artist",   experience: 8,  specializations: ["Bridal Makeup", "HD Makeup"], img: FALLBACK_AVATARS[1] },
        { id: "3", name: "Anita Sharma", role: "Academy Head",            experience: 10, specializations: ["Training", "Nail Art", "Skin Care"], img: FALLBACK_AVATARS[2] },
      ];

  return (
    <>
      {/* Hero */}
      <section className="relative py-32 sm:py-40 bg-espresso overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-espresso/80 to-espresso" />
        <div className="absolute top-10 right-10 w-80 h-80 rounded-full bg-gold/5 blur-3xl" />
        <div className="relative z-10 container-salon text-center px-4">
          <MotionWrapper>
            <span className="font-accent text-sm uppercase tracking-[0.3em] text-gold mb-4 block">Our Story</span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-cream mb-4">About Us</h1>
            <p className="font-body text-cream/60 max-w-xl mx-auto">A legacy of beauty, trust, and transformation.</p>
          </MotionWrapper>
        </div>
      </section>

      {/* Kanishka Sen Story */}
      <section className="section-padding bg-cream">
        <div className="container-salon">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <MotionWrapper>
              <div className="relative">
                <div className="aspect-[4/5] bg-white rounded-sm overflow-hidden shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={founderImg} alt="Kanishka Sen — Founder" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-espresso text-cream px-6 py-4 rounded-sm shadow-lg">
                  <p className="font-display text-2xl font-bold text-gold">Since 2009</p>
                  <p className="text-xs text-cream/60 uppercase tracking-wider">Indore, Madhya Pradesh</p>
                </div>
              </div>
            </MotionWrapper>
            <div>
              <SectionHeading accent="The Founder" title="Kanishka Sen" centered={false} />
              <MotionWrapper delay={0.2}>
                <p className="text-charcoal-light leading-relaxed mb-4">
                  <strong className="text-espresso">Kanishka Sen</strong> is a visionary beauty professional with over{" "}
                  <strong className="text-espresso">15 years of experience</strong> in hair styling, makeup artistry, skin care, and beauty training.
                </p>
                <p className="text-charcoal-light leading-relaxed mb-4">
                  After training under some of India&apos;s finest beauty experts and international workshops, Kanishka established{" "}
                  <strong className="text-espresso">Kanishka&apos;s Family Salon &amp; Academy</strong> in the heart of Indore at Anand Bazar.
                </p>
                <p className="text-charcoal-light leading-relaxed mb-6">
                  Through her academy, she has trained <strong className="text-espresso">hundreds of aspiring beauty professionals</strong>, empowering them to build successful careers.
                  Her philosophy is simple: <em className="text-rose-gold">&quot;Every person deserves to feel beautiful.&quot;</em>
                </p>
              </MotionWrapper>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding bg-white">
        <div className="container-salon">
          <SectionHeading accent="Why Choose Us" title="Our Four Pillars" subtitle="The principles that guide every service we deliver." />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <MotionWrapper key={v.title} delay={i * 0.1}>
                <div className="card-luxury p-8 text-center h-full">
                  <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-5">
                    <v.icon size={28} className="text-gold" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-espresso mb-3">{v.title}</h3>
                  <p className="text-sm text-charcoal-lighter leading-relaxed">{v.desc}</p>
                </div>
              </MotionWrapper>
            ))}
          </div>
        </div>
      </section>

      {/* Meet the Team — dynamic from DB */}
      <section className="section-padding bg-cream">
        <div className="container-salon">
          <SectionHeading accent="Our Experts" title="Meet the Team" subtitle="Skilled professionals dedicated to making you look and feel your best." />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers.map((member, i) => (
              <MotionWrapper key={member.id} delay={i * 0.1}>
                <div className="card-luxury overflow-hidden group">
                  <div className="aspect-[3/4] relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={member.img} alt={member.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-espresso/0 group-hover:bg-espresso/30 transition-all duration-300" />
                  </div>
                  <div className="p-5 text-center">
                    <h3 className="font-display text-lg font-semibold text-espresso">{member.name}</h3>
                    <p className="text-sm text-gold font-accent italic mb-2">{member.role}</p>
                    {member.experience > 0 && <p className="text-xs text-charcoal-lighter">{member.experience}+ years experience</p>}
                    <div className="flex flex-wrap justify-center gap-1 mt-2">
                      {member.specializations.slice(0, 3).map((s: string) => (
                        <span key={s} className="text-[10px] bg-cream px-2 py-0.5 rounded-sm text-charcoal-lighter">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </MotionWrapper>
            ))}
          </div>
        </div>
      </section>

      {/* Academy Teaser */}
      <section className="relative py-20 sm:py-28 overflow-hidden bg-espresso">
        <div className="absolute inset-0 bg-gradient-to-r from-espresso via-espresso-50 to-espresso" />
        <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full bg-gold/5 blur-3xl" />
        <div className="relative z-10 container-salon text-center px-4">
          <MotionWrapper>
            <span className="font-accent text-sm uppercase tracking-[0.3em] text-gold mb-4 block">🎓 Academy</span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-cream mb-4">Learn From the Best</h2>
            <p className="font-body text-cream/60 max-w-xl mx-auto mb-8">Professional certifications in Makeup, Hair, Nails, and Skin Care. Join our academy and launch your beauty career.</p>
            <Link href="/services?cat=ACADEMY" className="btn-gold">Explore Academy Courses</Link>
          </MotionWrapper>
        </div>
      </section>
    </>
  );
}
