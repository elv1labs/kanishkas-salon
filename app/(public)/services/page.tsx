import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import ServicesPageClient from "./ServicesPageClient";

export const metadata: Metadata = {
    title: "Our Services",
    description:
        "Explore the full range of beauty services at Kanishka's Family Salon — Hair, Skin, Makeup, Nails, Waxing, Bridal, Body Treatments & Academy courses.",
};

export const revalidate = 60;

const SERVICE_SELECT = {
    id: true,
    name: true,
    slug: true,
    price: true,
    priceMax: true,
    priceMale: true,
    note: true,
    duration: true,
    category: true,
    isFeatured: true,
    imageUrl: true,
};

const COURSE_SELECT = {
    id: true,
    name: true,
    slug: true,
    price: true,
    duration: true,
    maxStudents: true,
    description: true,
    imageUrl: true,
    isFeatured: true,
    isActive: true,
    _count: { select: { enrollments: { where: { status: { in: ["CONFIRMED", "ENROLLED", "ACTIVE"] } } } } },
};

async function getServices() {
    try {
        return await prisma.service.findMany({
            where: { isActive: true },
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
            select: SERVICE_SELECT,
        });
    } catch {
        return [];
    }
}

async function getCourses() {
    try {
        return await prisma.course.findMany({
            where: { isActive: true },
            orderBy: { createdAt: "desc" },
            select: COURSE_SELECT,
        });
    } catch {
        return [];
    }
}

const FALLBACK_SERVICES = [
    { id: "1", name: "Women's Hair Cut", slug: "womens-hair-cut", price: 300, priceMax: null, duration: 45, category: "HAIR_STYLING", isFeatured: true, imageUrl: null },
    { id: "2", name: "Hair Spa & Treatment", slug: "hair-spa", price: 800, priceMax: 1500, duration: 90, category: "HAIR_TREATMENTS", isFeatured: true, imageUrl: null },
    { id: "3", name: "Gold Facial", slug: "gold-facial", price: 1200, priceMax: null, duration: 75, category: "SKIN_CARE", isFeatured: false, imageUrl: null },
    { id: "4", name: "Bridal Makeup", slug: "bridal-makeup", price: 8000, priceMax: 20000, duration: 180, category: "BRIDAL", isFeatured: true, imageUrl: null },
    { id: "5", name: "Nail Art & Extensions", slug: "nail-art", price: 300, priceMax: 800, duration: 60, category: "NAIL_CARE", isFeatured: false, imageUrl: null },
    { id: "6", name: "Full Body Waxing", slug: "full-body-waxing", price: 1200, priceMax: 1800, duration: 120, category: "WAXING", isFeatured: false, imageUrl: null },
    { id: "7", name: "Body Massage & Polishing", slug: "body-treatment", price: 1500, priceMax: 2500, duration: 90, category: "BODY_TREATMENTS", isFeatured: false, imageUrl: null },
    { id: "8", name: "Party Makeup", slug: "party-makeup", price: 2000, priceMax: 5000, duration: 90, category: "MAKEUP", isFeatured: false, imageUrl: null },
];

export default async function ServicesPage({
    searchParams,
}: {
    searchParams: { cat?: string };
}) {
    const [services, courses] = await Promise.all([getServices(), getCourses()]);
    const initialCategory = searchParams?.cat ?? "ALL";
    const t = await getTranslations("servicesPage");

    const displayServices = services.length > 0
        ? services.map((s) => ({
            id: s.id,
            name: s.name,
            slug: s.slug,
            price: Number(s.price),
            priceMax: s.priceMax ? Number(s.priceMax) : null,
            priceMale: s.priceMale ? Number(s.priceMale) : null,
            note: s.note ?? null,
            duration: s.duration,
            category: s.category,
            isFeatured: s.isFeatured,
            imageUrl: s.imageUrl,
        }))
        : FALLBACK_SERVICES;

    const displayCourses = courses.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        price: Number(c.price),
        duration: c.duration,
        maxStudents: c.maxStudents,
        description: c.description,
        imageUrl: c.imageUrl,
        isFeatured: c.isFeatured,
        isActive: c.isActive,
        enrolledCount: c._count.enrollments,
    }));

    const categories = [
        { key: "ALL", label: t("catAll") },
        { key: "HAIR_STYLING", label: t("catHair") },
        { key: "SKIN_CARE", label: t("catSkin") },
        { key: "MAKEUP", label: t("catMakeup") },
        { key: "NAIL_CARE", label: t("catNails") },
        { key: "WAXING", label: t("catWaxing") },
        { key: "BODY_TREATMENTS", label: t("catBody") },
        { key: "BRIDAL", label: t("catBridal") },
        { key: "ACADEMY", label: t("catAcademy") },
    ];

    return (
        <ServicesPageClient
            services={displayServices}
            courses={displayCourses}
            categories={categories}
            initialCategory={initialCategory}
            featuredLabel={t("featured")}
            bookNowLabel={t("bookNow")}
        />
    );
}
