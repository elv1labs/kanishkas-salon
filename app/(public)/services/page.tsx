export const dynamic = 'force-dynamic';
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import MotionWrapper from "@/components/ui/MotionWrapper";
import ServicesClientView from "./ServicesClientView";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
    title: "Our Services",
    description:
        "Explore the full range of beauty services at Kanishka's Family Salon — Hair, Skin, Makeup, Nails, Waxing, Bridal, Body Treatments & Academy courses.",
};

async function getServices() {
    try {
        return await prisma.service.findMany({
            where: { isActive: true },
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        });
    } catch {
        return [];
    }
}

export default async function ServicesPage({
    searchParams,
}: {
    searchParams: { cat?: string };
}) {
    const services = await getServices();
    const initialCategory = searchParams?.cat ?? "ALL";
    const t = await getTranslations("servicesPage");

    const serializedServices = services.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        price: Number(s.price),
        priceMax: s.priceMax ? Number(s.priceMax) : null,
        duration: s.duration,
        category: s.category,
        isFeatured: s.isFeatured,
        imageUrl: s.imageUrl,
    }));

    const categoryMap: Record<string, string> = {
        ALL: t("catAll"),
        HAIR_STYLING: t("catHair"),
        SKIN_CARE: t("catSkin"),
        MAKEUP: t("catMakeup"),
        NAIL_CARE: t("catNails"),
        WAXING: t("catWaxing"),
        BODY_TREATMENTS: t("catBody"),
        BRIDAL: t("catBridal"),
        ACADEMY: t("catAcademy"),
    };

    const categories = Object.entries(categoryMap).map(([key, label]) => ({
        key,
        label,
    }));

    return (
        <>
            {/* Hero */}
            <section className="relative py-28 sm:py-36 bg-espresso overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-espresso via-espresso-50 to-espresso" />
                <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-gold/6 blur-3xl" />
                <div className="absolute top-10 right-10 w-60 h-60 rounded-full bg-rose-gold/5 blur-3xl" />
                <div className="relative z-10 container-salon text-center px-4">
                    <MotionWrapper>
                        <span className="font-accent text-sm uppercase tracking-[0.3em] text-gold mb-4 block">
                            {t("heroLocation")}
                        </span>
                        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-cream mb-4">
                            {t("heroTitle")}
                        </h1>
                        <p className="font-body text-cream/60 max-w-xl mx-auto">
                            {t("heroDesc")}
                        </p>
                        {/* Stats row */}
                        <div className="flex flex-wrap items-center justify-center gap-8 mt-8 pt-8 border-t border-white/10">
                            {[
                                { num: "30+", label: t("statServices") },
                                { num: "9", label: t("statCategories") },
                                { num: "15+", label: t("statExperience") },
                                { num: "365", label: t("statDaysOpen") },
                            ].map((s) => (
                                <div key={s.label} className="text-center">
                                    <p className="font-display text-2xl font-bold text-gold">{s.num}</p>
                                    <p className="text-cream/50 text-xs uppercase tracking-wider mt-0.5">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </MotionWrapper>
                </div>
            </section>

            {/* Services Grid */}
            <section className="section-padding bg-cream">
                <div className="container-salon">
                    <ServicesClientView
                        services={serializedServices}
                        categories={categories}
                        initialCategory={initialCategory}
                    />
                </div>
            </section>
        </>
    );
}
