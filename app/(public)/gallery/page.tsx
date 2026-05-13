export const dynamic = 'force-dynamic';
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import GalleryPageClient from "./GalleryPageClient";

export const metadata: Metadata = {
    title: "Gallery",
    description:
        "Browse our gallery of hair transformations, bridal looks, nail art, and more at Kanishka's Family Salon & Academy, Indore.",
};

async function getGalleryItems() {
    try {
        return await prisma.galleryItem.findMany({
            where: { isPublished: true },
            orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
        });
    } catch {
        return [];
    }
}

export default async function GalleryPage() {
    const items = await getGalleryItems();
    const t = await getTranslations("galleryPage");

    const serializedItems = items.map((item) => ({
        id: item.id,
        title: item.title,
        imageUrl: item.thumbnailUrl ?? item.imageUrl,
        fullImageUrl: item.imageUrl,
        category: item.category,
        altText: item.altText,
    }));

    const categories = [
        { key: "ALL", label: t("catAll") },
        { key: "HAIR", label: t("catHair") },
        { key: "MAKEUP", label: t("catMakeup") },
        { key: "NAILS", label: t("catNails") },
        { key: "SKIN", label: t("catSkin") },
        { key: "BRIDAL", label: t("catBridal") },
        { key: "ACADEMY", label: t("catAcademy") },
        { key: "BEFORE_AFTER", label: t("catBeforeAfter") },
    ];

    return (
        <GalleryPageClient
            items={serializedItems}
            categories={categories}
            heroTag={t("heroTag")}
            heroDesc={t("heroDesc")}
            noImages={t("noImages")}
        />
    );
}
