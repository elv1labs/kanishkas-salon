"use client";

import { useState } from "react";
import CategoryFilter from "@/components/ui/CategoryFilter";
import ServiceCard from "@/components/ui/ServiceCard";

const categoryIcons: Record<string, string> = {
    HAIR_STYLING: "✂️",
    HAIR_TREATMENTS: "💆",
    HAIR_COLORING: "🎨",
    SKIN_CARE: "✨",
    MAKEUP: "💄",
    NAIL_CARE: "💅",
    WAXING: "🌸",
    BODY_TREATMENTS: "🧖",
    HAND_FOOT_CARE: "🤲",
    BRIDAL: "👰",
    ACADEMY: "🎓",
};

interface ServiceData {
    id: string;
    name: string;
    slug: string;
    price: number;
    priceMax: number | null;
    duration: number;
    category: string;
    isFeatured: boolean;
    imageUrl: string | null;
}

interface ServicesClientViewProps {
    services: ServiceData[];
    categories: { key: string; label: string }[];
    initialCategory?: string;
}

export default function ServicesClientView({
    services,
    categories,
    initialCategory = "ALL",
}: ServicesClientViewProps) {
    const [activeCategory, setActiveCategory] = useState(initialCategory);

    const filtered =
        activeCategory === "ALL"
            ? services
            : services.filter((s) => s.category === activeCategory);

    // Fallback if no services from DB
    const displayServices =
        filtered.length > 0
            ? filtered
            : [
                { id: "1", name: "Women's Hair Cut", slug: "womens-hair-cut", price: 300, priceMax: null, duration: 45, category: "HAIR_STYLING", isFeatured: true, imageUrl: null },
                { id: "2", name: "Hair Spa", slug: "hair-spa", price: 800, priceMax: 1500, duration: 90, category: "HAIR_TREATMENTS", isFeatured: true, imageUrl: null },
                { id: "3", name: "Gold Facial", slug: "gold-facial", price: 1200, priceMax: null, duration: 75, category: "SKIN_CARE", isFeatured: true, imageUrl: null },
                { id: "4", name: "Bridal Makeup", slug: "bridal-makeup", price: 8000, priceMax: 20000, duration: 180, category: "MAKEUP", isFeatured: true, imageUrl: null },
                { id: "5", name: "Nail Art", slug: "nail-art", price: 300, priceMax: 800, duration: 60, category: "NAIL_CARE", isFeatured: true, imageUrl: null },
                { id: "6", name: "Full Body Waxing", slug: "full-body-waxing", price: 1200, priceMax: 1800, duration: 120, category: "WAXING", isFeatured: false, imageUrl: null },
            ];

    return (
        <>
            <CategoryFilter
                categories={categories}
                activeCategory={activeCategory}
                onSelect={setActiveCategory}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayServices.map((s, i) => (
                    <ServiceCard
                        key={s.id}
                        name={s.name}
                        slug={s.slug}
                        price={s.price}
                        priceMax={s.priceMax}
                        duration={s.duration}
                        category={s.category}
                        icon={categoryIcons[s.category]}
                        isFeatured={s.isFeatured}
                        delay={i * 0.05}
                    />
                ))}
            </div>
            {displayServices.length === 0 && (
                <div className="text-center py-16">
                    <p className="text-charcoal-lighter text-lg">
                        No services found in this category.
                    </p>
                </div>
            )}
        </>
    );
}
