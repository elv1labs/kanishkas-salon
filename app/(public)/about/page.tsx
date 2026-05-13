export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import AboutPageClient from "./AboutPageClient";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about Kanishka Sen and the story behind Kanishka's Family Salon & Academy — 15+ years of beauty expertise in Indore.",
};

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
  const t = await getTranslations("about");

  const founderImg = founderImageUrl ??
    "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&h=750&fit=crop&q=85";

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
        { id: "1", name: "Kanishka Sen",  role: "Founder & Lead Stylist",    experience: 15, specializations: ["Bridal Makeup", "Hair Styling"], img: FALLBACK_AVATARS[0] },
        { id: "2", name: "Priya Verma",   role: "Senior Makeup Artist",      experience: 8,  specializations: ["Bridal Makeup", "HD Makeup"], img: FALLBACK_AVATARS[1] },
        { id: "3", name: "Anita Sharma",  role: "Academy Head",               experience: 10, specializations: ["Training", "Nail Art", "Skin Care"], img: FALLBACK_AVATARS[2] },
        { id: "4", name: "Neha Gupta",    role: "Senior Hair Stylist",         experience: 6,  specializations: ["Hair Coloring", "Keratin"], img: FALLBACK_AVATARS[3] },
      ];

  const values = [
    { iconKey: "award",    title: t("expertiseTitle"),  desc: t("expertiseDesc") },
    { iconKey: "sparkles", title: t("luxuryTitle"),     desc: t("luxuryDesc") },
    { iconKey: "shield",   title: t("hygieneTitle"),   desc: t("hygieneDesc") },
    { iconKey: "heart",    title: t("resultsTitle"),   desc: t("resultsDesc") },
  ];

  const milestones = [
    { year: "2009",  label: "Founded in Indore" },
    { year: "2012",  label: "First bridal team assembled" },
    { year: "2015",  label: "Beauty Academy launched" },
    { year: "2018",  label: "1,000+ clients served" },
    { year: "2021",  label: "Premium nail studio opened" },
    { year: "2024",  label: "Expanded skincare wing" },
  ];

  return (
    <AboutPageClient
      founderImg={founderImg}
      teamMembers={teamMembers}
      values={values}
      milestones={milestones}
    />
  );
}
