export const dynamic = 'force-dynamic';
// Blog Detail Page
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize-html";
import MotionWrapper from "@/components/ui/MotionWrapper";
import { ArrowLeft, Clock, Calendar, User, Tag } from "lucide-react";
import type { Metadata } from "next";

interface BlogDetailPageProps {
    params: { slug: string };
}

async function getPost(slug: string) {
    try {
        const post = await prisma.blogPost.findUnique({
            where: { slug, status: "PUBLISHED" },
            include: { author: { select: { name: true, image: true } } },
        });
        return post;
    } catch {
        return null;
    }
}

async function getRelatedPosts(category: string | null, currentSlug: string) {
    try {
        return await prisma.blogPost.findMany({
            where: {
                status: "PUBLISHED",
                slug: { not: currentSlug },
                ...(category ? { category } : {}),
            },
            select: { title: true, slug: true, excerpt: true, readTime: true, category: true },
            take: 3,
            orderBy: { publishedAt: "desc" },
        });
    } catch {
        return [];
    }
}

export async function generateMetadata({ params }: BlogDetailPageProps): Promise<Metadata> {
    const post = await getPost(params.slug);
    if (!post) return { title: "Post Not Found" };

    return {
        title: post.seoTitle ?? post.title,
        description: post.seoDescription ?? post.excerpt ?? `Read ${post.title} on Kanishka's Blog`,
        openGraph: {
            title: post.title,
            description: post.excerpt ?? "",
            type: "article",
            publishedTime: post.publishedAt?.toISOString(),
            authors: [post.author.name],
            images: post.ogImage ? [post.ogImage] : post.coverImage ? [post.coverImage] : [],
        },
    };
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
    const post = await getPost(params.slug);

    if (!post) {
        // Show a styled fallback for demo purposes
        return (
            <>
                <section className="bg-espresso py-16 sm:py-20">
                    <div className="container-salon text-center px-4">
                        <MotionWrapper>
                            <span className="font-accent text-sm uppercase tracking-[0.3em] text-gold mb-4 block">
                                Blog Article
                            </span>
                            <h1 className="font-display text-3xl sm:text-4xl font-bold text-cream mb-4">
                                Article Preview
                            </h1>
                            <p className="text-cream/60 max-w-xl mx-auto">
                                This article will be available once the database is connected and blog posts are created.
                            </p>
                        </MotionWrapper>
                    </div>
                </section>
                <section className="section-padding bg-cream">
                    <div className="container-salon max-w-3xl text-center">
                        <Link href="/blog" className="btn-outline">
                            <ArrowLeft size={16} className="mr-2" /> Back to Blog
                        </Link>
                    </div>
                </section>
            </>
        );
    }

    const relatedPosts = await getRelatedPosts(post.category, post.slug);

    // JSON-LD
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.excerpt,
        datePublished: post.publishedAt?.toISOString(),
        dateModified: post.updatedAt.toISOString(),
        author: { "@type": "Person", name: post.author.name },
        publisher: {
            "@type": "Organization",
            name: "Kanishka's Family Salon & Academy",
        },
        image: post.coverImage ?? undefined,
        wordCount: post.content?.split(/\s+/).length ?? 0,
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            {/* Header */}
            <section className="bg-espresso py-16 sm:py-20">
                <div className="container-salon px-4 max-w-3xl">
                    <MotionWrapper>
                        <Link href="/blog" className="inline-flex items-center gap-2 text-gold/60 hover:text-gold text-sm mb-6 transition-colors">
                            <ArrowLeft size={14} /> Back to Blog
                        </Link>
                        {post.category && (
                            <span className="inline-block bg-gold/15 text-gold text-xs uppercase tracking-wider px-3 py-1 rounded-sm mb-4">
                                {post.category}
                            </span>
                        )}
                        <h1 className="font-display text-3xl sm:text-4xl font-bold text-cream mb-4 leading-tight">
                            {post.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-4 text-cream/40 text-sm">
                            <span className="flex items-center gap-1.5">
                                <User size={14} /> {post.author.name}
                            </span>
                            {post.publishedAt && (
                                <span className="flex items-center gap-1.5">
                                    <Calendar size={14} />
                                    {new Date(post.publishedAt).toLocaleDateString("en-IN", {
                                        day: "numeric", month: "long", year: "numeric",
                                    })}
                                </span>
                            )}
                            {post.readTime && (
                                <span className="flex items-center gap-1.5">
                                    <Clock size={14} /> {post.readTime} min read
                                </span>
                            )}
                        </div>
                    </MotionWrapper>
                </div>
            </section>

            {/* Content */}
            <section className="section-padding bg-cream">
                <div className="container-salon max-w-3xl">
                    <MotionWrapper>
                        <article className="prose prose-lg max-w-none text-charcoal leading-relaxed">
                            <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }} />
                        </article>

                        {/* Tags */}
                        {post.tags.length > 0 && (
                            <div className="mt-10 pt-6 border-t border-cream-darker/50 flex flex-wrap items-center gap-2">
                                <Tag size={14} className="text-charcoal-lighter" />
                                {post.tags.map((tag) => (
                                    <span key={tag} className="text-xs bg-cream-dark text-charcoal-lighter px-3 py-1 rounded-sm">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </MotionWrapper>
                </div>
            </section>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
                <section className="section-padding bg-white">
                    <div className="container-salon max-w-3xl">
                        <h2 className="font-display text-2xl text-espresso mb-6">Related Articles</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {relatedPosts.map((rp) => (
                                <Link key={rp.slug} href={`/blog/${rp.slug}`} className="card-luxury p-4 group">
                                    <h3 className="font-display text-sm font-semibold text-espresso group-hover:text-gold-dark transition-colors line-clamp-2 mb-2">
                                        {rp.title}
                                    </h3>
                                    <p className="text-xs text-charcoal-lighter line-clamp-2">{rp.excerpt}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </>
    );
}
