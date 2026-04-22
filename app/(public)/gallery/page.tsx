export const dynamic = 'force-dynamic';
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import MotionWrapper from "@/components/ui/MotionWrapper";
import GalleryClientView from "./GalleryClientView";

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

    const serializedItems = items.map((item) => ({
        id: item.id,
        title: item.title,
        // Use thumbnail for grid (smaller WebP), fall back to full image URL
        imageUrl: item.thumbnailUrl ?? item.imageUrl,
        // Keep full-res URL separately for lightbox
        fullImageUrl: item.imageUrl,
        category: item.category,
        altText: item.altText,
    }));

    return (
        <>
            {/* Hero */}
            <section className="relative py-32 sm:py-40 bg-espresso overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-espresso/80 to-espresso" />
                <div className="absolute top-20 left-20 w-60 h-60 rounded-full bg-rose-gold/5 blur-3xl" />
                <div className="relative z-10 container-salon text-center px-4">
                    <MotionWrapper>
                        <span className="font-accent text-sm uppercase tracking-[0.3em] text-gold mb-4 block">
                            Our Work
                        </span>
                        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-cream mb-4">
                            Beauty Gallery
                        </h1>
                        <p className="font-body text-cream/60 max-w-xl mx-auto">
                            A visual showcase of transformations, artistry, and beauty.
                        </p>
                    </MotionWrapper>
                </div>
            </section>

            {/* Gallery */}
            <section className="section-padding bg-cream">
                <div className="container-salon">
                    <GalleryClientView items={serializedItems} />
                </div>
            </section>
        </>
    );
}
