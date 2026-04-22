export const dynamic = 'force-dynamic';
// Products / Shop Page
import Link from "next/link";
import AddToCartBtn from "@/components/ui/AddToCartBtn";
import { prisma } from "@/lib/prisma";
import SectionHeading from "@/components/ui/SectionHeading";
import MotionWrapper from "@/components/ui/MotionWrapper";
import { ShoppingBag, Star, Filter } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Shop Premium Beauty Products",
    description:
        "Shop premium hair care, skincare, makeup, tools & accessories from Kanishka's Family Salon & Academy, Indore. Free shipping on orders above ₹500.",
};

const categoryLabels: Record<string, string> = {
    HAIR_CARE: "Hair Care", MAKEUP_COSMETICS: "Makeup", SKIN_CARE: "Skincare",
    NAIL_CARE: "Nail Care", TOOLS_ACCESSORIES: "Tools", GIFT_VOUCHER: "Gift Vouchers",
};

async function getProducts(category?: string, sortBy = "createdAt", page = 1) {
    try {
        const where: any = { isActive: true };
        if (category) where.category = category;

        const validSorts: Record<string, any> = {
            createdAt: { createdAt: "desc" }, price_asc: { price: "asc" },
            price_desc: { price: "desc" }, name: { name: "asc" },
        };

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                orderBy: validSorts[sortBy] ?? { createdAt: "desc" },
                skip: (page - 1) * 12,
                take: 12,
                include: {
                    reviews: { where: { isPublished: true }, select: { rating: true } },
                },
            }),
            prisma.product.count({ where }),
        ]);

        return {
            products: products.map((p) => {
                const avgRating = p.reviews.length > 0
                    ? Math.round((p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length) * 10) / 10
                    : null;
                return { ...p, avgRating, reviewCount: p.reviews.length };
            }),
            total,
            pages: Math.ceil(total / 12),
        };
    } catch {
        return { products: [], total: 0, pages: 0 };
    }
}



export default async function ProductsPage({ searchParams }: { searchParams: { category?: string } }) {
    const { products } = await getProducts(searchParams?.category);

    const displayProducts = products; 

    return (
        <>
            {/* Hero */}
            <section className="bg-espresso py-16 sm:py-20">
                <div className="container-salon text-center px-4">
                    <MotionWrapper>
                        <span className="font-accent text-sm uppercase tracking-[0.3em] text-gold mb-4 block">
                            <ShoppingBag className="inline w-4 h-4 mr-2" />
                            Shop
                        </span>
                        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-cream mb-4">
                            Premium Beauty Products
                        </h1>
                        <p className="text-cream/60 max-w-xl mx-auto">
                            Salon-quality products delivered to your doorstep. Free shipping on orders above ₹500.
                        </p>
                    </MotionWrapper>
                </div>
            </section>

            {/* Category Filter */}
            <section className="bg-white border-b border-cream-darker/50 sticky top-0 z-20">
                <div className="container-salon px-4 py-3 flex items-center gap-3 overflow-x-auto">
                    <Link
                        href="/products"
                        className={`text-xs uppercase tracking-wider font-semibold px-3 py-1.5 rounded-sm whitespace-nowrap transition-colors ${
                            !searchParams?.category
                                ? "bg-gold text-espresso"
                                : "text-charcoal-lighter hover:bg-cream"
                        }`}
                    >
                        All Products
                    </Link>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                        <Link
                            key={key}
                            href={`/products?category=${key}`}
                            className={`text-xs uppercase tracking-wider font-semibold px-3 py-1.5 rounded-sm whitespace-nowrap transition-colors ${
                                searchParams?.category === key
                                    ? "bg-gold text-espresso"
                                    : "text-charcoal-lighter hover:bg-cream"
                            }`}
                        >
                            {label}
                        </Link>
                    ))}
                </div>
            </section>

            {/* Product Grid */}
            <section className="section-padding bg-cream">
                <div className="container-salon">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                        {displayProducts.length === 0 && (
                            <div className="col-span-4 text-center py-20">
                                <p className="font-display text-xl text-charcoal-lighter">
                                    No products available in this category yet.
                                </p>
                                <a href="/products" className="mt-4 inline-block text-gold underline text-sm">
                                    Browse all products
                                </a>
                            </div>
                        )}
                        {displayProducts.map((product: any) => (
                            <div key={product.id}>
                                <Link href={`/products/${product.slug}`} className="card-luxury group block">
                                    {/* Image */}
                                    <div className="aspect-square bg-cream-dark relative overflow-hidden">
                                        {product.thumbnailUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={product.thumbnailUrl}
                                                alt={product.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-gold/10 to-rose-gold/10 flex items-center justify-center">
                                                <ShoppingBag className="text-gold/20" size={40} />
                                            </div>
                                        )}
                                        {product.comparePrice && Number(product.comparePrice) > Number(product.price) && (
                                            <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">
                                                {Math.round((1 - Number(product.price) / Number(product.comparePrice)) * 100)}% OFF
                                            </span>
                                        )}
                                        {product.isFeatured && (
                                            <span className="absolute top-2 right-2 bg-gold text-espresso text-[10px] font-bold px-2 py-0.5 rounded-sm">
                                                ★ Featured
                                            </span>
                                        )}
                                    </div>

                                    <div className="p-3 sm:p-4">
                                        {/* Category */}
                                        <span className="text-[10px] uppercase tracking-wider text-charcoal-lighter">
                                            {categoryLabels[product.category] ?? product.category}
                                        </span>

                                        <h3 className="font-display text-sm sm:text-base font-semibold text-espresso mt-1 group-hover:text-gold-dark transition-colors line-clamp-2">
                                            {product.name}
                                        </h3>

                                        {/* Rating */}
                                        {product.avgRating && (
                                            <div className="flex items-center gap-1 mt-1.5">
                                                <Star size={12} className="text-gold fill-gold" />
                                                <span className="text-xs text-charcoal-lighter">
                                                    {product.avgRating} ({product.reviewCount})
                                                </span>
                                            </div>
                                        )}

                                        {/* Price */}
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="font-display text-lg font-bold text-espresso">
                                                ₹{Number(product.price).toLocaleString("en-IN")}
                                            </span>
                                            {product.comparePrice && Number(product.comparePrice) > Number(product.price) && (
                                                <span className="text-xs text-charcoal-lighter line-through">
                                                    ₹{Number(product.comparePrice).toLocaleString("en-IN")}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                                <AddToCartBtn product={product} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}
