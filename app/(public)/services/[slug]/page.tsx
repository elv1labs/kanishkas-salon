export const dynamic = 'force-dynamic';
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, IndianRupee, ArrowLeft, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import MotionWrapper from "@/components/ui/MotionWrapper";
import ServiceCard from "@/components/ui/ServiceCard";
import ReviewForm from "@/components/ui/ReviewForm";

const categoryIcons: Record<string, string> = {
    HAIR_STYLING: "✂️", HAIR_TREATMENTS: "💆", HAIR_COLORING: "🎨",
    SKIN_CARE: "✨", MAKEUP: "💄", NAIL_CARE: "💅", WAXING: "🌸",
    BODY_TREATMENTS: "🧖", HAND_FOOT_CARE: "🤲", BRIDAL: "👰", ACADEMY: "🎓",
};

interface PageProps {
    params: { slug: string };
}

async function getService(slug: string) {
    try {
        return await prisma.service.findUnique({ where: { slug } });
    } catch {
        return null;
    }
}

async function getRelatedServices(category: string, excludeSlug: string) {
    try {
        return await prisma.service.findMany({
            where: { category: category as any, isActive: true, slug: { not: excludeSlug } },
            take: 3,
            orderBy: { sortOrder: "asc" },
        });
    } catch {
        return [];
    }
}

async function getServiceReviews(serviceId: string) {
    try {
        return await prisma.review.findMany({
            where: { serviceId, isPublished: true },
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
                id: true, rating: true, title: true, comment: true, createdAt: true,
                ownerResponse: true, respondedAt: true,
                client: { select: { name: true } },
            },
        });
    } catch {
        return [];
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const service = await getService(params.slug);
    if (!service) return { title: "Service Not Found" };

    return {
        title: service.seoTitle || service.name,
        description:
            service.seoDescription ||
            `Book ${service.name} at Kanishka's Family Salon & Academy, Indore. Starting at ₹${service.price}. ${service.duration} minutes.`,
        openGraph: {
            title: service.seoTitle || service.name,
            description: service.seoDescription || `Book ${service.name} in Indore`,
            images: service.imageUrl ? [service.imageUrl] : undefined,
        },
    };
}

export default async function ServiceDetailPage({ params }: PageProps) {
    const service = await getService(params.slug);

    if (!service) {
        notFound();
    }

    const [related, reviews] = await Promise.all([
        getRelatedServices(service.category, service.slug),
        getServiceReviews(service.id),
    ]);
    const avgRating = reviews.length > 0
        ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
        : null;
    const formatPrice = (p: number) =>
        new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(p);

    return (
        <>
            {/* Breadcrumb */}
            <section className="pt-28 pb-4 bg-cream">
                <div className="container-salon px-4 sm:px-6 lg:px-8">
                    <Link
                        href="/services"
                        className="inline-flex items-center gap-2 text-sm text-charcoal-lighter hover:text-gold transition-colors"
                    >
                        <ArrowLeft size={14} />
                        Back to Services
                    </Link>
                </div>
            </section>

            {/* Service Detail */}
            <section className="section-padding pt-8 bg-cream">
                <div className="container-salon">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Image */}
                        <MotionWrapper>
                            <div className="aspect-[4/3] bg-white rounded-sm overflow-hidden shadow-md">
                                <div className="w-full h-full bg-gradient-to-br from-gold/10 to-rose-gold/10 flex items-center justify-center">
                                    <span className="text-7xl">
                                        {categoryIcons[service.category] || "✦"}
                                    </span>
                                </div>
                            </div>
                        </MotionWrapper>

                        {/* Details */}
                        <div>
                            <MotionWrapper delay={0.1}>
                                <span className="font-accent text-sm uppercase tracking-[0.2em] text-gold mb-2 block">
                                    {service.category.replace(/_/g, " ")}
                                </span>
                                <h1 className="font-display text-3xl sm:text-4xl font-bold text-espresso mb-4">
                                    {service.name}
                                </h1>
                                <div className="gold-line mb-6" />
                            </MotionWrapper>

                            <MotionWrapper delay={0.2}>
                                {/* Price & Duration */}
                                <div className="flex items-center gap-6 mb-6">
                                    <div className="flex items-center gap-2">
                                        <IndianRupee size={18} className="text-gold" />
                                        <span className="font-display text-2xl font-bold text-espresso">
                                            {formatPrice(Number(service.price))}
                                            {service.priceMax
                                                ? ` – ${formatPrice(Number(service.priceMax))}`
                                                : ""}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-charcoal-lighter">
                                        <Clock size={16} />
                                        <span className="text-sm">{service.duration} minutes</span>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="prose prose-sm max-w-none mb-8">
                                    <p className="text-charcoal-light leading-relaxed">
                                        {service.description ||
                                            `Experience our premium ${service.name} service at Kanishka's Family Salon & Academy. Our expert stylists use top-quality products to deliver outstanding results every time. Book your appointment today and step into luxury.`}
                                    </p>
                                </div>

                                {/* Tags */}
                                {service.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-8">
                                        {service.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="text-xs bg-cream-dark text-charcoal-lighter px-3 py-1 rounded-sm"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* CTA */}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Link href="/contact" className="btn-gold">
                                        Book This Service
                                    </Link>
                                    <Link
                                        href={`https://wa.me/919171230292?text=Hi%2C%20I'd%20like%20to%20book%20${encodeURIComponent(service.name)}`}
                                        target="_blank"
                                        className="btn-outline"
                                    >
                                        WhatsApp to Book
                                    </Link>
                                </div>

                                {service.requiresDeposit && (
                                    <p className="mt-4 text-xs text-charcoal-lighter italic">
                                        * This service requires a deposit of{" "}
                                        {formatPrice(Number(service.depositAmount || 0))} for
                                        confirmation.
                                    </p>
                                )}
                            </MotionWrapper>
                        </div>
                    </div>
                </div>
            </section>

            {/* Related Services */}
            {related.length > 0 && (
                <section className="section-padding bg-white">
                    <div className="container-salon">
                        <h2 className="font-display text-2xl font-bold text-espresso mb-2">
                            Related Services
                        </h2>
                        <div className="gold-line mb-8" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {related.map((s, i) => (
                                <ServiceCard
                                    key={s.id}
                                    name={s.name}
                                    slug={s.slug}
                                    price={Number(s.price)}
                                    priceMax={s.priceMax ? Number(s.priceMax) : null}
                                    duration={s.duration}
                                    category={s.category}
                                    icon={categoryIcons[s.category]}
                                    delay={i * 0.1}
                                />
                            ))}
                        </div>
                    </div>
                </section>
            )}
            {/* Reviews */}
            <section className="section-padding bg-cream">
                <div className="container-salon">
                    <div className="max-w-2xl mx-auto">
                        <h2 className="font-display text-2xl font-bold text-espresso mb-1">Client Reviews</h2>
                        <div className="gold-line mb-8" />

                        {/* Existing reviews */}
                        {reviews.length > 0 ? (
                            <div className="space-y-4 mb-10">
                                {avgRating && (
                                    <div className="flex items-center gap-3 mb-6 pb-6 border-b border-cream-darker/50">
                                        <span className="font-display text-4xl font-bold text-espresso">{avgRating}</span>
                                        <div>
                                            <div className="flex gap-0.5">
                                                {[1,2,3,4,5].map(s => (
                                                    <Star key={s} size={16}
                                                        className={s <= Math.round(avgRating) ? "text-gold fill-gold" : "text-cream-darker fill-cream-darker"} />
                                                ))}
                                            </div>
                                            <p className="text-xs text-charcoal-lighter mt-0.5">
                                                {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {reviews.map(r => (
                                    <div key={r.id} className="bg-white border border-cream-darker/50 rounded-sm p-5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="flex gap-0.5">
                                                {[1,2,3,4,5].map(s => (
                                                    <Star key={s} size={12}
                                                        className={s <= r.rating ? "text-gold fill-gold" : "text-cream-darker fill-cream-darker"} />
                                                ))}
                                            </div>
                                            <span className="text-sm font-medium text-espresso">{r.client.name}</span>
                                        </div>
                                        {r.title && <p className="font-semibold text-sm text-espresso mb-1">{r.title}</p>}
                                        {r.comment && <p className="text-sm text-charcoal-lighter">{r.comment}</p>}
                                        {r.ownerResponse && (
                                            <div className="mt-3 pl-4 border-l-2 border-gold/30 bg-gold/5 rounded-r-sm p-3">
                                                <p className="text-[10px] uppercase tracking-wider text-gold font-semibold mb-1">Salon Response</p>
                                                <p className="text-sm text-charcoal-lighter">{r.ownerResponse}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-charcoal-lighter mb-8">No reviews yet — be the first!</p>
                        )}

                        {/* Submission form */}
                        <div className="bg-white border border-cream-darker/50 rounded-sm p-6">
                            <h3 className="font-display text-lg text-espresso mb-4">Leave a Review</h3>
                            <ReviewForm serviceId={service.id} subjectName={service.name} />
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
