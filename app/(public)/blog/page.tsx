export const dynamic = 'force-dynamic';
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import BlogPageClient from "./BlogPageClient";

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
    const t = await getTranslations("blogPage");

    const [{ posts, total, pages }, categories] = await Promise.all([
        getBlogPosts(category, page),
        getCategories(),
    ]);

    const isFiltered = !!category;
    const fallbackPosts = [
        { id: "1", title: "10 Bridal Makeup Trends for 2025", slug: "bridal-makeup-trends-2025", excerpt: "Discover the hottest bridal makeup trends that will make you glow on your big day. From dewy glass skin to bold lip colors.", coverImage: null, publishedAt: new Date(), readTime: 5, category: "Bridal", tags: ["bridal", "makeup", "trends"], author: { name: "Kanishka Sen", image: null } },
        { id: "2", title: "Hair Spa vs Hair Botox: Which Is Right For You?", slug: "hair-spa-vs-botox", excerpt: "Understand the key differences between hair spa and hair botox treatments. Learn which one suits your hair type best.", coverImage: null, publishedAt: new Date(), readTime: 4, category: "Hair Care", tags: ["hair", "treatments"], author: { name: "Kanishka Sen", image: null } },
        { id: "3", title: "5 Skincare Mistakes You're Making Every Day", slug: "skincare-mistakes", excerpt: "Common skincare habits that might be damaging your skin, and expert tips on how to fix them for glowing results.", coverImage: null, publishedAt: new Date(), readTime: 3, category: "Skin Care", tags: ["skincare", "tips"], author: { name: "Kanishka Sen", image: null } },
        { id: "4", title: "The Complete Guide to Nail Art in 2025", slug: "nail-art-guide-2025", excerpt: "From minimalist designs to elaborate 3D nail art — everything you need to know about the latest nail trends.", coverImage: null, publishedAt: new Date(), readTime: 6, category: "Nail Care", tags: ["nails", "art", "trends"], author: { name: "Kanishka Sen", image: null } },
        { id: "5", title: "How Often Should You Get a Haircut?", slug: "how-often-haircut", excerpt: "Expert advice on the ideal haircut frequency based on your hair type, length, and styling goals.", coverImage: null, publishedAt: new Date(), readTime: 3, category: "Hair Care", tags: ["hair", "tips"], author: { name: "Kanishka Sen", image: null } },
        { id: "6", title: "Pre-Wedding Skincare Routine: A 3-Month Plan", slug: "pre-wedding-skincare", excerpt: "Start your bridal glow journey 3 months early with this dermatologist-approved skincare routine.", coverImage: null, publishedAt: new Date(), readTime: 7, category: "Bridal", tags: ["bridal", "skincare"], author: { name: "Kanishka Sen", image: null } },
    ];

    const displayPosts = posts.length > 0 ? posts : (isFiltered ? [] : fallbackPosts);
    const displayCategories = categories.length > 0 ? categories : ["Hair Care", "Skin Care", "Bridal", "Nail Care", "Makeup"];

    return (
        <BlogPageClient
            posts={displayPosts}
            categories={displayCategories}
            activeCategory={category}
            heroTag={t("heroTag")}
            heroTitle={t("heroTitle")}
            heroDesc={t("heroDesc")}
            allPosts={t("allPosts")}
            noPosts={t("noPosts")}
            minRead={t("minRead")}
            readCta={t("readCta")}
            featuredLabel={t("featuredLabel")}
        />
    );
}
