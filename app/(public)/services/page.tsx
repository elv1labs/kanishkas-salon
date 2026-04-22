export const dynamic = 'force-dynamic';
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import MotionWrapper from "@/components/ui/MotionWrapper";
import SectionHeading from "@/components/ui/SectionHeading";
import ServicesClientView from "./ServicesClientView";

export const metadata: Metadata = {
    title: "Our Services",
    description:
        "Explore the full range of beauty services at Kanishka's Family Salon — Hair, Skin, Makeup, Nails, Waxing, Bridal, Body Treatments & Academy courses.",
};

const categoryMap: Record<string, string> = {
    ALL: "All Services",
    HAIR_STYLING: "Hair",
    SKIN_CARE: "Skin",
    MAKEUP: "Makeup",
    NAIL_CARE: "Nails",
    WAXING: "Waxing",
    BODY_TREATMENTS: "Body",
    BRIDAL: "Bridal",
    ACADEMY: "Academy",
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
                            Anand Bazar, Indore
                        </span>
                        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-cream mb-4">
                            Our Services
                        </h1>
                        <p className="font-body text-cream/60 max-w-xl mx-auto">
                            From hair transformations to bridal glam — discover our complete range of premium beauty services.
                        </p>
                        {/* Stats row */}
                        <div className="flex flex-wrap items-center justify-center gap-8 mt-8 pt-8 border-t border-white/10">
                            {[
                                { num: "30+", label: "Services" },
                                { num: "9", label: "Categories" },
                                { num: "15+", label: "Years Experience" },
                                { num: "365", label: "Days Open" },
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
