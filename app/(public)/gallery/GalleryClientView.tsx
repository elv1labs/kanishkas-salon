"use client";

import { useState } from "react";
import CategoryFilter from "@/components/ui/CategoryFilter";
import GalleryGrid from "@/components/ui/GalleryGrid";
import { useTranslations } from "next-intl";


// Placeholder items shown ONLY when the gallery is genuinely empty (no DB records).
// Once real photos are added, this list is never shown.
const placeholderItems = [
    { id: "p1", title: "Bridal Glamour", imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=500&fit=crop", fullImageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&fit=crop", category: "BRIDAL", altText: "Bridal makeup look" },
    { id: "p2", title: "Hair Transformation", imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop", fullImageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&fit=crop", category: "HAIR", altText: "Hair styling" },
    { id: "p3", title: "Nail Art Design", imageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=400&fit=crop", fullImageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1200&fit=crop", category: "NAILS", altText: "Nail art" },
    { id: "p4", title: "Skin Glow", imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=500&fit=crop", fullImageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&fit=crop", category: "SKIN", altText: "Facial treatment" },
    { id: "p5", title: "Party Makeup", imageUrl: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=300&fit=crop", fullImageUrl: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1200&fit=crop", category: "MAKEUP", altText: "Party makeup" },
    { id: "p6", title: "Hair Color", imageUrl: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&h=400&fit=crop", fullImageUrl: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=1200&fit=crop", category: "HAIR", altText: "Hair coloring" },
    { id: "p7", title: "Academy Training", imageUrl: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&h=500&fit=crop", fullImageUrl: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=1200&fit=crop", category: "ACADEMY", altText: "Beauty training" },
    { id: "p8", title: "Bridal Hairstyle", imageUrl: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&h=300&fit=crop", fullImageUrl: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=1200&fit=crop", category: "BRIDAL", altText: "Bridal hairstyle" },
];

interface GalleryItem {
    id: string;
    title: string | null;
    /** Thumbnail URL for grid display (400px WebP for uploaded files) */
    imageUrl: string;
    /** Full-resolution URL for lightbox (may equal imageUrl for external URLs) */
    fullImageUrl?: string;
    category: string;
    altText: string | null;
}

interface GalleryClientViewProps {
    items: GalleryItem[];
    categories?: { key: string; label: string }[];
}

const defaultCategories = [
    { key: "ALL", label: "All" },
    { key: "HAIR", label: "Hair" },
    { key: "MAKEUP", label: "Makeup" },
    { key: "NAILS", label: "Nails" },
    { key: "SKIN", label: "Skin" },
    { key: "BRIDAL", label: "Bridal" },
    { key: "ACADEMY", label: "Academy" },
    { key: "BEFORE_AFTER", label: "Before/After" },
];

export default function GalleryClientView({ items, categories = defaultCategories }: GalleryClientViewProps) {
    const [activeCategory, setActiveCategory] = useState("ALL");
    const t = useTranslations("galleryPage");

    // Only fall back to placeholders when there are genuinely no DB items.
    const displayItems = items.length > 0 ? items : placeholderItems;

    const filtered =
        activeCategory === "ALL"
            ? displayItems
            : displayItems.filter((item) => item.category === activeCategory);

    return (
        <>
            <CategoryFilter
                categories={categories}
                activeCategory={activeCategory}
                onSelect={setActiveCategory}
            />
            {filtered.length > 0 ? (
                <GalleryGrid images={filtered} />
            ) : (
                <div className="text-center py-16">
                    <p className="text-charcoal-lighter text-lg">
                        {t("noImages")}
                    </p>
                </div>
            )}
        </>
    );
}
