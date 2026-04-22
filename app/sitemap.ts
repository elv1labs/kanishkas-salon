import { MetadataRoute } from "next";

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
    ];

    // Dynamic pages (blog posts, products, services) would be fetched from DB here
    // try {
    //     const posts = await prisma.blogPost.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } });
    //     const blogPages = posts.map(p => ({ url: `${BASE}/blog/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 }));
    //     return [...staticPages, ...blogPages];
    // } catch {}

    return staticPages;
}
