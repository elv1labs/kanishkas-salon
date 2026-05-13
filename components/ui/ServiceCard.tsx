import Link from "next/link";
import Image from "next/image";
import { Clock, IndianRupee, ArrowRight } from "lucide-react";

const categoryImages: Record<string, string> = {
    HAIR_STYLING: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop&q=80",
    HAIR_TREATMENTS: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop&q=80",
    HAIR_COLORING: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&h=300&fit=crop&q=80",
    SKIN_CARE: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=300&fit=crop&q=80",
    MAKEUP: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=300&fit=crop&q=80",
    NAIL_CARE: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=300&fit=crop&q=80",
    WAXING: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=300&fit=crop&q=80",
    BODY_TREATMENTS: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&h=300&fit=crop&q=80",
    HAND_FOOT_CARE: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=300&fit=crop&q=80",
    BRIDAL: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&h=300&fit=crop&q=80",
    ACADEMY: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&h=300&fit=crop&q=80",
};

const categoryLabels: Record<string, string> = {
    HAIR_STYLING: "Hair Styling",
    HAIR_TREATMENTS: "Hair Treatments",
    HAIR_COLORING: "Hair Coloring",
    SKIN_CARE: "Skin Care",
    MAKEUP: "Makeup",
    NAIL_CARE: "Nail Care",
    WAXING: "Waxing",
    BODY_TREATMENTS: "Body",
    HAND_FOOT_CARE: "Hand & Foot",
    BRIDAL: "Bridal",
    ACADEMY: "Academy",
};

interface ServiceCardProps {
    name: string;
    slug: string;
    price: number;
    priceMax?: number | null;
    duration: number;
    category: string;
    icon?: string;
    imageUrl?: string | null;
    isFeatured?: boolean;
    delay?: number;
    bookNowLabel?: string;
    featuredLabel?: string;
}

export default function ServiceCard({
    name, slug, price, priceMax, duration, category, imageUrl, isFeatured = false,
    bookNowLabel = "Book Now", featuredLabel = "Featured",
}: ServiceCardProps) {
    const img = imageUrl || categoryImages[category] || categoryImages.HAIR_STYLING;
    const label = categoryLabels[category] || category.replace(/_/g, " ");

    const formatPrice = (p: number) =>
        new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(p);

    return (
        <Link href={`/book?service=${slug}`} className="block group" aria-label={`Book ${name}`}>
            <div
                className="bg-white overflow-hidden h-full flex flex-col transition-all duration-400"
                style={{
                    border: "1px solid rgba(201,168,76,0.12)",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                    transform: "translateY(0px)",
                    transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s ease, border-color 0.3s ease",
                }}
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-8px)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 20px 50px rgba(201,168,76,0.12), 0 8px 20px rgba(0,0,0,0.08)";
                    (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(201,168,76,0.4)";
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0px)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)";
                    (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(201,168,76,0.12)";
                }}
            >
                {/* Image */}
                <div className="relative overflow-hidden" style={{ aspectRatio: "4/3" }}>
                    <Image
                        src={img}
                        alt={name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110 block"
                        loading="lazy"
                        decoding="async"
                        unoptimized
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                        {isFeatured && (
                            <span className="bg-gold text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 shadow-md">
                                {featuredLabel}
                            </span>
                        )}
                        <span className="bg-espresso/80 text-cream/90 text-[10px] font-accent uppercase tracking-wider px-2.5 py-1 backdrop-blur-sm">
                            {label}
                        </span>
                    </div>

                    {/* Book now CTA that slides up on hover */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <div className="flex items-center justify-center gap-1.5 bg-gold text-white text-xs font-bold uppercase tracking-widest py-2.5 w-full">
                            {bookNowLabel} <ArrowRight size={12} />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-display text-base font-semibold text-espresso mb-4 group-hover:text-gold transition-colors duration-200 leading-snug">
                        {name}
                    </h3>
                    <div className="mt-auto pt-3 flex items-center justify-between border-t border-cream-darker/40">
                        <div className="flex items-center gap-1 text-espresso">
                            <IndianRupee size={13} className="text-gold" />
                            <span className="font-semibold text-sm">
                                {formatPrice(price).replace("₹", "")}
                                {priceMax ? <span className="text-charcoal-lighter font-normal"> – {formatPrice(priceMax).replace("₹", "")}</span> : ""}
                            </span>
                        </div>
                        <div className="flex items-center gap-1 text-charcoal-lighter text-xs">
                            <Clock size={11} className="text-gold/60" />
                            <span>{duration} min</span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
