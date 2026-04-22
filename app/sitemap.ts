import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.kanishkasacademy.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Static pages
    const staticPages = [
        { url: `${BASE}/`, changeFrequency: "weekly" as const, priority: 1 },
        { url: `${BASE}/about`, changeFrequency: "monthly" as const, priority: 0.8 },
        { url: `${BASE}/services`, changeFrequency: "weekly" as const, priority: 0.9 },
        { url: `${BASE}/gallery`, changeFrequency: "weekly" as const, priority: 0.7 },
        { url: `${BASE}/blog`, changeFrequency: "daily" as const, priority: 0.8 },
        { url: `${BASE}/products`, changeFrequency: "daily" as const, priority: 0.8 },
        { url: `${BASE}/book`, changeFrequency: "monthly" as const, priority: 0.9 },
        { url: `${BASE}/contact`, changeFrequency: "monthly" as const, priority: 0.7 },
        { url: `${BASE}/academy`, changeFrequency: "monthly" as const, priority: 0.7 },
        { url: `${BASE}/gift-vouchers`, changeFrequency: "monthly" as const, priority: 0.6 },
        { url: `${BASE}/privacy`, changeFrequency: "yearly" as const, priority: 0.3 },
        { url: `${BASE}/terms`, changeFrequency: "yearly" as const, priority: 0.3 },
    ];

    // Dynamic pages from database
    try {
        const [posts, services] = await Promise.all([
            prisma.blogPost.findMany({
                where: { status: "PUBLISHED" },
                select: { slug: true, updatedAt: true },
            }),
            prisma.service.findMany({
                where: { isActive: true },
                select: { id: true, updatedAt: true },
            }),
        ]);

        const blogPages = posts.map((p) => ({
            url: `${BASE}/blog/${p.slug}`,
            lastModified: p.updatedAt,
            changeFrequency: "monthly" as const,
            priority: 0.6,
        }));

        const servicePages = services.map((s) => ({
            url: `${BASE}/services/${s.id}`,
            lastModified: s.updatedAt,
            changeFrequency: "monthly" as const,
            priority: 0.7,
        }));

        return [...staticPages, ...blogPages, ...servicePages];
    } catch {
        return staticPages;
    }
}

