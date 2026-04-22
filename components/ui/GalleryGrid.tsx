"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ZoomIn } from "lucide-react";

interface GalleryImage {
    id: string;
    title?: string | null;
    /** Thumbnail / grid image URL */
    imageUrl: string;
    /** Full-resolution URL for lightbox; falls back to imageUrl */
    fullImageUrl?: string;
    category: string;
    altText?: string | null;
}

interface GalleryGridProps {
    images: GalleryImage[];
}

export default function GalleryGrid({ images }: GalleryGridProps) {
    const [lightboxImage, setLightboxImage] = useState<GalleryImage | null>(null);
    const [lightboxIdx, setLightboxIdx] = useState<number>(0);

    const openLightbox = (img: GalleryImage, idx: number) => {
        setLightboxImage(img);
        setLightboxIdx(idx);
    };

    const closeLightbox = useCallback(() => setLightboxImage(null), []);

    const goNext = useCallback(() => {
        const next = (lightboxIdx + 1) % images.length;
        setLightboxImage(images[next]);
        setLightboxIdx(next);
    }, [lightboxIdx, images]);

    const goPrev = useCallback(() => {
        const prev = (lightboxIdx - 1 + images.length) % images.length;
        setLightboxImage(images[prev]);
        setLightboxIdx(prev);
    }, [lightboxIdx, images]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (!lightboxImage) return;
            if (e.key === "Escape") closeLightbox();
            if (e.key === "ArrowRight") goNext();
            if (e.key === "ArrowLeft") goPrev();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [lightboxImage, closeLightbox, goNext, goPrev]);

    // Prevent body scroll when lightbox is open
    useEffect(() => {
        document.body.style.overflow = lightboxImage ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [lightboxImage]);

    return (
        <>
            {/* Masonry Grid — uses native <img> to support any image hostname from DB */}
            <div className="masonry-grid">
                {images.map((img, i) => (
                    <div
                        key={img.id}
                        className="cursor-pointer group mb-4 break-inside-avoid"
                        onClick={() => openLightbox(img, i)}
                        style={{
                            animation: `fadeUp 0.5s ease both`,
                            animationDelay: `${Math.min(i * 60, 500)}ms`,
                        }}
                    >
                        <div className="relative overflow-hidden rounded-sm shadow-md hover:shadow-xl transition-all duration-300">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={img.imageUrl}
                                alt={img.altText || img.title || "Gallery"}
                                className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105 block"
                                loading="lazy"
                                decoding="async"
                            />
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-espresso/0 group-hover:bg-espresso/55 transition-all duration-300 flex flex-col items-center justify-center gap-2">
                                <ZoomIn
                                    size={28}
                                    className="text-white opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100"
                                />
                                {img.title && (
                                    <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-accent text-sm tracking-wider text-center px-4">
                                        {img.title}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Lightbox */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4"
                    style={{ background: "rgba(20,14,10,0.96)", backdropFilter: "blur(12px)" }}
                    onClick={closeLightbox}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Image lightbox"
                >
                    {/* Close button */}
                    <button
                        onClick={closeLightbox}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-gold/30 flex items-center justify-center text-white transition-colors z-10"
                        aria-label="Close lightbox"
                    >
                        <X size={20} />
                    </button>

                    {/* Prev arrow */}
                    {images.length > 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); goPrev(); }}
                            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-gold/30 flex items-center justify-center text-white text-2xl font-light transition-colors z-10"
                            aria-label="Previous image"
                        >
                            ‹
                        </button>
                    )}

                    {/* Image container */}
                    <div
                        className="max-w-5xl w-full flex flex-col items-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            key={lightboxImage.id}
                            src={lightboxImage.fullImageUrl ?? lightboxImage.imageUrl}
                            alt={lightboxImage.altText || lightboxImage.title || "Gallery image"}
                            className="w-auto max-w-full max-h-[80vh] object-contain rounded-sm shadow-2xl"
                            style={{ animation: "fadeIn 0.2s ease" }}
                        />
                        {lightboxImage.title && (
                            <p className="text-white/80 font-accent text-base mt-4 tracking-wider text-center">
                                {lightboxImage.title}
                            </p>
                        )}
                        {images.length > 1 && (
                            <p className="text-white/30 text-xs mt-1 font-accent">
                                {lightboxIdx + 1} / {images.length}
                            </p>
                        )}
                        <p className="text-white/20 text-xs mt-2">Press ESC or ← → to navigate</p>
                    </div>

                    {/* Next arrow */}
                    {images.length > 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); goNext(); }}
                            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-gold/30 flex items-center justify-center text-white text-2xl font-light transition-colors z-10"
                            aria-label="Next image"
                        >
                            ›
                        </button>
                    )}
                </div>
            )}
        </>
    );
}
