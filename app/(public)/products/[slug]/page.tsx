export const dynamic = 'force-dynamic';
// Product Detail Page
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import MotionWrapper from "@/components/ui/MotionWrapper";
import { ArrowLeft, ShoppingBag, Star, Truck, Shield, RotateCcw, Package } from "lucide-react";
import AddToCartBtn from "@/components/ui/AddToCartBtn";
import ReviewForm from "@/components/ui/ReviewForm";
import type { Metadata } from "next";

interface ProductDetailProps {
    params: { slug: string };
}

async function getProduct(slug: string) {
    try {
        return await prisma.product.findUnique({
            where: { slug, isActive: true },
            include: {
                reviews: {
                    where: { isPublished: true },
                    orderBy: { createdAt: "desc" },
                    take: 10,
                    select: {
                        id: true, rating: true, title: true, comment: true, createdAt: true,
                        ownerResponse: true, respondedAt: true,
                        client: { select: { name: true } },
                    },
                },
            },
        });
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }: ProductDetailProps): Promise<Metadata> {
    const product = await getProduct(params.slug);
    if (!product) return { title: "Product Not Found" };
    return {
        title: product.seoTitle ?? product.name,
        description: product.seoDescription ?? product.shortDesc ?? product.description?.slice(0, 160),
    };
}

export default async function ProductDetailPage({ params }: ProductDetailProps) {
    const product = await getProduct(params.slug);

    if (!product) {
        return (
            <>
                <section className="bg-espresso py-16 sm:py-20">
                    <div className="container-salon text-center px-4">
                        <MotionWrapper>
                            <h1 className="font-display text-3xl text-cream mb-4">Product Preview</h1>
                            <p className="text-cream/60">This product page will be available once the database is connected.</p>
                        </MotionWrapper>
                    </div>
                </section>
                <section className="section-padding bg-cream text-center">
                    <Link href="/products" className="btn-outline">
                        <ArrowLeft size={16} className="mr-2" /> Back to Shop
                    </Link>
                </section>
            </>
        );
    }

    const avgRating = product.reviews.length > 0
        ? Math.round((product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length) * 10) / 10
        : null;

    const discount = product.comparePrice && Number(product.comparePrice) > Number(product.price)
        ? Math.round((1 - Number(product.price) / Number(product.comparePrice)) * 100)
        : null;

    // JSON-LD
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description,
        image: product.images,
        brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
        sku: product.sku,
        offers: {
            "@type": "Offer",
            price: Number(product.price),
            priceCurrency: "INR",
            availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            seller: { "@type": "Organization", name: "Kanishka's Family Salon & Academy" },
        },
        aggregateRating: avgRating ? {
            "@type": "AggregateRating",
            ratingValue: avgRating,
            reviewCount: product.reviews.length,
        } : undefined,
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            <section className="section-padding bg-cream">
                <div className="container-salon">
                    <Link href="/products" className="inline-flex items-center gap-2 text-charcoal-lighter hover:text-gold text-sm mb-8 transition-colors">
                        <ArrowLeft size={14} /> Back to Shop
                    </Link>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                        {/* Image */}
                        <MotionWrapper>
                            <div className="aspect-square bg-white rounded-sm border border-cream-darker/50 overflow-hidden relative">
                                {(product.thumbnailUrl || product.images?.[0]) ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={product.thumbnailUrl || product.images[0]}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-gold/10 to-rose-gold/10 flex items-center justify-center">
                                        <Package className="text-gold/20" size={80} />
                                    </div>
                                )}
                                {discount && (
                                    <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-sm">
                                        {discount}% OFF
                                    </span>
                                )}
                            </div>
                        </MotionWrapper>

                        {/* Info */}
                        <MotionWrapper delay={0.2}>
                            <div>
                                {product.brand && (
                                    <span className="text-xs uppercase tracking-wider text-charcoal-lighter">{product.brand}</span>
                                )}
                                <h1 className="font-display text-2xl sm:text-3xl font-bold text-espresso mt-1 mb-3">
                                    {product.name}
                                </h1>

                                {/* Rating */}
                                {avgRating && (
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="flex items-center gap-0.5">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <Star key={s} size={16} className={s <= Math.round(avgRating) ? "text-gold fill-gold" : "text-cream-darker"} />
                                            ))}
                                        </div>
                                        <span className="text-sm text-charcoal-lighter">
                                            {avgRating} ({product.reviews.length} reviews)
                                        </span>
                                    </div>
                                )}

                                {/* Price */}
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="font-display text-3xl font-bold text-espresso">
                                        ₹{Number(product.price).toLocaleString("en-IN")}
                                    </span>
                                    {product.comparePrice && Number(product.comparePrice) > Number(product.price) && (
                                        <span className="text-lg text-charcoal-lighter line-through">
                                            ₹{Number(product.comparePrice).toLocaleString("en-IN")}
                                        </span>
                                    )}
                                </div>

                                {/* Description */}
                                <p className="text-charcoal-light leading-relaxed mb-6">
                                    {product.description ?? product.shortDesc ?? "Premium quality product from Kanishka's Salon."}
                                </p>

                                {/* Stock */}
                                <div className="mb-6">
                                    {product.stock > 0 ? (
                                        <span className="text-green-600 text-sm font-medium">✓ In Stock ({product.stock} available)</span>
                                    ) : (
                                        <span className="text-red-500 text-sm font-medium">✕ Out of Stock</span>
                                    )}
                                </div>

                                {/* CTA */}
                                {product.stock > 0 ? (
                                    <AddToCartBtn product={{
                                        id: product.id,
                                        name: product.name,
                                        price: String(product.price),
                                        thumbnailUrl: product.images?.[0] ?? null,
                                        slug: product.slug,
                                    }} />
                                ) : (
                                    <button className="btn-gold w-full sm:w-auto py-3.5 mb-4 opacity-50 cursor-not-allowed" disabled>
                                        <ShoppingBag size={18} className="mr-2" />
                                        Out of Stock
                                    </button>
                                )}

                                {/* Trust badges */}
                                <div className="grid grid-cols-3 gap-3 mt-8 pt-6 border-t border-cream-darker/50">
                                    {[
                                        { icon: <Truck size={18} />, label: "Free shipping\nabove ₹500" },
                                        { icon: <Shield size={18} />, label: "100%\nAuthentic" },
                                        { icon: <RotateCcw size={18} />, label: "Easy\nReturns" },
                                    ].map((badge) => (
                                        <div key={badge.label} className="text-center">
                                            <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-1.5 text-gold">
                                                {badge.icon}
                                            </div>
                                            <p className="text-[10px] text-charcoal-lighter whitespace-pre-line">{badge.label}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* How to Use */}
                                {product.howToUse && (
                                    <div className="mt-8 pt-6 border-t border-cream-darker/50">
                                        <h3 className="font-display text-base font-semibold text-espresso mb-2">How to Use</h3>
                                        <p className="text-sm text-charcoal-lighter leading-relaxed">{product.howToUse}</p>
                                    </div>
                                )}

                                {/* Ingredients */}
                                {product.ingredients && (
                                    <div className="mt-6 pt-6 border-t border-cream-darker/50">
                                        <h3 className="font-display text-base font-semibold text-espresso mb-2">Ingredients</h3>
                                        <p className="text-sm text-charcoal-lighter leading-relaxed">{product.ingredients}</p>
                                    </div>
                                )}
                            </div>
                        </MotionWrapper>
                    </div>

                    {/* Reviews */}
                    <div className="mt-16">
                        <h2 className="font-display text-xl text-espresso mb-6">Customer Reviews</h2>
                        {product.reviews.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                                {product.reviews.map((review) => (
                                    <div key={review.id} className="bg-white rounded-sm border border-cream-darker/50 p-5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="flex items-center gap-0.5">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <Star key={s} size={12} className={s <= review.rating ? "text-gold fill-gold" : "text-cream-darker"} />
                                                ))}
                                            </div>
                                            <span className="text-sm font-medium text-espresso">{review.client.name}</span>
                                        </div>
                                        {review.title && <p className="font-medium text-sm text-espresso mb-1">{review.title}</p>}
                                        {review.comment && <p className="text-sm text-charcoal-lighter">{review.comment}</p>}
                                        {review.ownerResponse && (
                                            <div className="mt-3 pl-4 border-l-2 border-gold/30 bg-gold/5 rounded-r-sm p-3">
                                                <p className="text-[10px] uppercase tracking-wider text-gold font-semibold mb-1">Salon Response</p>
                                                <p className="text-sm text-charcoal-lighter">{review.ownerResponse}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        {product.reviews.length === 0 && (
                            <p className="text-sm text-charcoal-lighter mb-8">No reviews yet — be the first!</p>
                        )}

                        {/* Submission form */}
                        <div className="bg-cream border border-cream-darker/50 rounded-sm p-6 max-w-lg">
                            <h3 className="font-display text-lg text-espresso mb-4">Leave a Review</h3>
                            <ReviewForm productId={product.id} subjectName={product.name} />
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
