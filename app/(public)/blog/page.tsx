export const dynamic = 'force-dynamic';
// Blog Listing Page
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SectionHeading from "@/components/ui/SectionHeading";
import MotionWrapper from "@/components/ui/MotionWrapper";
import { Clock, Tag, Search } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Beauty Blog — Tips, Trends & Expert Advice",
    description:
        "Expert beauty tips, hair care trends, skincare advice, and salon updates from Kanishka's Family Salon & Academy, Indore.",
};

async function getBlogPosts(category?: string, page = 1) {
    try {
        const where: any = { status: "PUBLISHED" as const };
        if (category) where.category = category;

        const [posts, total] = await Promise.all([
            prisma.blogPost.findMany({
                where,
                include: { author: { select: { name: true, image: true } } },
                orderBy: { publishedAt: "desc" },
                skip: (page - 1) * 9,
                take: 9,
            }),
            prisma.blogPost.count({ where }),
        ]);
        return { posts, total, pages: Math.ceil(total / 9) };
    } catch {
        return { posts: [], total: 0, pages: 0 };
    }
}

async function getCategories() {
    try {
        const posts = await prisma.blogPost.findMany({
            where: { status: "PUBLISHED" },
            select: { category: true },
            distinct: ["category"],
        });
        return posts.map((p) => p.category).filter(Boolean) as string[];
    } catch {
        return [];
    }
}

export default async function BlogPage({
    searchParams,
}: {
    searchParams: { category?: string; page?: string };
}) {
    const category = searchParams?.category
        ? decodeURIComponent(searchParams.category)
        : undefined;
    const page = searchParams?.page ? parseInt(searchParams.page) : 1;

    const [{ posts, total, pages }, categories] = await Promise.all([
        getBlogPosts(category, page),
        getCategories(),
    ]);

    // When filtering: show empty state if no results (don't pollute with unrelated fallback)
    // When not filtering: show hardcoded fallback if DB is empty
    const isFiltered = !!category;
    const fallbackPosts = [
        {
            id: "1", title: "10 Bridal Makeup Trends for 2025", slug: "bridal-makeup-trends-2025",
            excerpt: "Discover the hottest bridal makeup trends that will make you glow on your big day. From dewy glass skin to bold lip colors.",
            coverImage: null, publishedAt: new Date(), readTime: 5, category: "Bridal",
            tags: ["bridal", "makeup", "trends"], author: { name: "Kanishka Sen", image: null },
        },
        {
            id: "2", title: "Hair Spa vs Hair Botox: Which Is Right For You?", slug: "hair-spa-vs-botox",
            excerpt: "Understand the key differences between hair spa and hair botox treatments. Learn which one suits your hair type best.",
            coverImage: null, publishedAt: new Date(), readTime: 4, category: "Hair Care",
            tags: ["hair", "treatments"], author: { name: "Kanishka Sen", image: null },
        },
        {
            id: "3", title: "5 Skincare Mistakes You're Making Every Day", slug: "skincare-mistakes",
            excerpt: "Common skincare habits that might be damaging your skin, and expert tips on how to fix them for glowing results.",
            coverImage: null, publishedAt: new Date(), readTime: 3, category: "Skin Care",
            tags: ["skincare", "tips"], author: { name: "Kanishka Sen", image: null },
        },
        {
            id: "4", title: "The Complete Guide to Nail Art in 2025", slug: "nail-art-guide-2025",
            excerpt: "From minimalist designs to elaborate 3D nail art — everything you need to know about the latest nail trends.",
            coverImage: null, publishedAt: new Date(), readTime: 6, category: "Nail Care",
            tags: ["nails", "art", "trends"], author: { name: "Kanishka Sen", image: null },
        },
        {
            id: "5", title: "How Often Should You Get a Haircut?", slug: "how-often-haircut",
            excerpt: "Expert advice on the ideal haircut frequency based on your hair type, length, and styling goals.",
            coverImage: null, publishedAt: new Date(), readTime: 3, category: "Hair Care",
            tags: ["hair", "tips"], author: { name: "Kanishka Sen", image: null },
        },
        {
            id: "6", title: "Pre-Wedding Skincare Routine: A 3-Month Plan", slug: "pre-wedding-skincare",
            excerpt: "Start your bridal glow journey 3 months early with this dermatologist-approved skincare routine.",
            coverImage: null, publishedAt: new Date(), readTime: 7, category: "Bridal",
            tags: ["bridal", "skincare"], author: { name: "Kanishka Sen", image: null },
        },
    ];
    const displayPosts = posts.length > 0 ? posts : isFiltered ? [] : fallbackPosts;

    const displayCategories = categories.length > 0 ? categories : ["Hair Care", "Skin Care", "Bridal", "Nail Care", "Makeup"];

    return (
        <>
            {/* Hero */}
            <section className="bg-espresso py-16 sm:py-20">
                <div className="container-salon text-center px-4">
                    <MotionWrapper>
                        <span className="font-accent text-sm uppercase tracking-[0.3em] text-gold mb-4 block">
                            Beauty Blog
                        </span>
                        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-cream mb-4">
                            Tips, Trends & Expert Advice
                        </h1>
                        <p className="text-cream/60 max-w-xl mx-auto">
                            Stay updated with the latest beauty trends, expert tips, and salon news from our team.
                        </p>
                    </MotionWrapper>
                </div>
            </section>

            {/* Category Filter */}
            <section className="bg-white border-b border-cream-darker/50 sticky top-0 z-20">
                <div className="container-salon px-4 py-3 flex items-center gap-3 overflow-x-auto">
                    <Link
                        href="/blog"
                        className={`text-xs uppercase tracking-wider font-semibold px-3 py-1.5 rounded-sm whitespace-nowrap transition-colors ${
                            !category ? "bg-gold text-espresso" : "text-charcoal-lighter hover:bg-cream"
                        }`}
                    >
                        All Posts
                    </Link>
                    {displayCategories.map((cat) => (
                        <Link
                            key={cat}
                            href={`/blog?category=${encodeURIComponent(cat)}`}
                            className={`text-xs uppercase tracking-wider font-semibold px-3 py-1.5 rounded-sm whitespace-nowrap transition-colors ${
                                category === cat
                                    ? "bg-gold text-espresso"
                                    : "text-charcoal-lighter hover:bg-cream"
                            }`}
                        >
                            {cat}
                        </Link>
                    ))}
                </div>
            </section>

            {/* Posts Grid */}
            <section className="section-padding bg-cream">
                <div className="container-salon">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayPosts.length === 0 && (
                            <div className="col-span-3 text-center py-20">
                                <p className="font-display text-xl text-charcoal-lighter">
                                    No posts found in this category yet.
                                </p>
                                <a href="/blog" className="mt-4 inline-block text-gold underline text-sm">
                                    View all posts
                                </a>
                            </div>
                        )}
                        {displayPosts.map((post: any, i: number) => (
                            <MotionWrapper key={post.id} delay={i * 0.1}>
                                <Link href={`/blog/${post.slug}`} className="group block">
                                    <div className="card-luxury">
                                        {/* Image */}
                                        <div className="aspect-[16/10] bg-cream-dark relative overflow-hidden">
                                            {post.coverImage ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={post.coverImage}
                                                    alt={post.title}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-gold/10 to-rose-gold/10 flex items-center justify-center">
                                                    <span className="font-display text-4xl text-gold/20">K</span>
                                                </div>
                                            )}
                                            {post.category && (
                                                <span className="absolute top-3 left-3 bg-gold text-espresso text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm">
                                                    {post.category}
                                                </span>
                                            )}
                                        </div>
                                        <div className="p-5">
                                            <h2 className="font-display text-lg font-semibold text-espresso mb-2 group-hover:text-gold-dark transition-colors line-clamp-2">
                                                {post.title}
                                            </h2>
                                            <p className="text-sm text-charcoal-lighter line-clamp-2 mb-4">
                                                {post.excerpt}
                                            </p>
                                            <div className="flex items-center justify-between text-xs text-charcoal-lighter">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={12} />
                                                        {post.readTime ?? 3} min
                                                    </span>
                                                    <span>{post.author?.name ?? "Kanishka"}</span>
                                                </div>
                                                <span className="text-gold font-semibold uppercase tracking-wider group-hover:text-gold-dark">
                                                    Read →
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </MotionWrapper>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section for AEO */}
            <section className="section-padding bg-white">
                <div className="container-salon max-w-3xl">
                    <SectionHeading accent="FAQ" title="Frequently Asked Questions" subtitle="Common beauty questions answered by our experts." />
                    <div className="space-y-4 mt-8">
                        {[
                            { q: "How often should I visit the salon for a haircut?", a: "For most hair types, we recommend a trim every 6-8 weeks to maintain healthy hair and prevent split ends. If you're growing your hair out, every 10-12 weeks works well." },
                            { q: "What's the best facial treatment for glowing skin?", a: "Our Gold Facial is our most popular treatment for instant glow. For long-term results, we recommend a monthly facial suited to your skin type — consult with our experts for a personalized recommendation." },
                            { q: "How far in advance should I book bridal makeup?", a: "We recommend booking bridal makeup at least 2-3 months in advance, especially during wedding season (October-February). A trial session 3-4 weeks before the wedding is highly recommended." },
                        ].map((faq, i) => (
                            <MotionWrapper key={i} delay={i * 0.1}>
                                <details className="group border border-cream-darker/50 rounded-sm">
                                    <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-display text-base text-espresso hover:text-gold-dark transition-colors">
                                        {faq.q}
                                        <span className="text-gold text-xl ml-4 group-open:rotate-45 transition-transform">+</span>
                                    </summary>
                                    <div className="px-5 pb-4 text-sm text-charcoal-lighter leading-relaxed">
                                        {faq.a}
                                    </div>
                                </details>
                            </MotionWrapper>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}
