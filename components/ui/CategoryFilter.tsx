"use client";

import { motion } from "framer-motion";

interface CategoryFilterProps {
    categories: { key: string; label: string }[];
    activeCategory: string;
    onSelect: (key: string) => void;
}

export default function CategoryFilter({
    categories,
    activeCategory,
    onSelect,
}: CategoryFilterProps) {
    return (
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10">
            {categories.map((cat) => (
                <button
                    key={cat.key}
                    onClick={() => onSelect(cat.key)}
                    className={`relative px-4 sm:px-6 py-2 text-sm font-body font-medium tracking-wide rounded-sm transition-colors ${activeCategory === cat.key
                            ? "text-espresso"
                            : "text-charcoal-lighter hover:text-charcoal"
                        }`}
                >
                    {cat.label}
                    {activeCategory === cat.key && (
                        <motion.div
                            layoutId="category-underline"
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                    )}
                </button>
            ))}
        </div>
    );
}
