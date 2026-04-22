"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

interface Testimonial {
    id: string;
    name: string;
    service: string;
    rating: number;
    comment: string;
}

interface TestimonialCarouselProps {
    testimonials: Testimonial[];
}

export default function TestimonialCarousel({
    testimonials,
}: TestimonialCarouselProps) {
    const [current, setCurrent] = useState(0);

    const next = useCallback(() => {
        setCurrent((prev) => (prev + 1) % testimonials.length);
    }, [testimonials.length]);

    const prev = useCallback(() => {
        setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    }, [testimonials.length]);

    useEffect(() => {
        const timer = setInterval(next, 5000);
        return () => clearInterval(timer);
    }, [next]);

    if (testimonials.length === 0) return null;

    const t = testimonials[current];

    return (
        <div className="relative max-w-3xl mx-auto px-4">
            <AnimatePresence mode="wait">
                <motion.div
                    key={current}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.4 }}
                    className="text-center"
                >
                    {/* Stars */}
                    <div className="flex justify-center gap-1 mb-6">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                                key={i}
                                size={20}
                                className={
                                    i < t.rating
                                        ? "fill-gold text-gold"
                                        : "fill-cream-darker text-cream-darker"
                                }
                            />
                        ))}
                    </div>

                    {/* Quote */}
                    <p className="font-accent text-xl sm:text-2xl italic text-charcoal leading-relaxed mb-6">
                        &ldquo;{t.comment}&rdquo;
                    </p>

                    {/* Author */}
                    <div>
                        <p className="font-display text-lg font-semibold text-espresso">
                            {t.name}
                        </p>
                        <p className="text-sm text-charcoal-lighter">{t.service}</p>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            {testimonials.length > 1 && (
                <>
                    <button
                        onClick={prev}
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-cream-darker flex items-center justify-center text-charcoal-lighter hover:text-gold hover:border-gold transition-colors"
                        aria-label="Previous testimonial"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        onClick={next}
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-cream-darker flex items-center justify-center text-charcoal-lighter hover:text-gold hover:border-gold transition-colors"
                        aria-label="Next testimonial"
                    >
                        <ChevronRight size={18} />
                    </button>

                    {/* Dots */}
                    <div className="flex justify-center gap-2 mt-8">
                        {testimonials.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrent(i)}
                                className={`w-2 h-2 rounded-full transition-all ${i === current
                                        ? "bg-gold w-6"
                                        : "bg-cream-darker hover:bg-gold/50"
                                    }`}
                                aria-label={`Go to testimonial ${i + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
