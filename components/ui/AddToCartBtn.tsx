"use client";
import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { ShoppingCart } from "lucide-react";

interface Product {
    id: string;
    name: string;
    price: string;
    thumbnailUrl: string | null;
    slug: string;
}

export default function AddToCartBtn({ product }: { product: Product }) {
    const { addItem } = useCart();
    const [state, setState] = useState<"idle" | "added">("idle");

    const handleAdd = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addItem(product);
        setState("added");
        // Reset after 4s so the user can re-add if needed
        setTimeout(() => setState("idle"), 4000);
    };

    if (state === "added") {
        return (
            <div className="space-y-2">
                {/* Confirmation row */}
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-sm px-4 py-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="font-medium">Added to cart!</span>
                </div>

                {/* Action row */}
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={handleAdd}
                        className="py-3 text-xs font-semibold uppercase tracking-wider border border-cream-darker/50 text-charcoal-lighter hover:border-gold hover:text-espresso transition-all duration-200 bg-white"
                    >
                        + Add Another
                    </button>
                    <Link
                        href="/cart"
                        className="py-3 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 bg-espresso text-gold hover:bg-espresso/90 transition-all duration-200"
                    >
                        <ShoppingCart size={13} />
                        View Cart
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={handleAdd}
            className="w-full py-3.5 text-sm font-semibold uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 bg-espresso text-gold hover:bg-gold hover:text-white active:scale-[0.98]"
        >
            <ShoppingCart size={16} />
            Add to Cart
        </button>
    );
}
