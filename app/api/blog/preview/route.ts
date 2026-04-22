import { apiSuccess } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

// Fetches the 3 most recent published blog posts for the homepage preview section.
export async function GET() {
    try {
        const posts = await prisma.blogPost.findMany({
            where: { status: "PUBLISHED" },
            orderBy: { publishedAt: "desc" },
            take: 3,
            select: {
                slug: true,
                title: true,
                category: true,
                excerpt: true,
                readTime: true,
                coverImage: true,
            },
        });

        const mapped = posts.map(p => ({
            slug: p.slug,
            title: p.title,
            cat: p.category ?? "Beauty",
            desc: p.excerpt ?? "",
            time: `${p.readTime ?? 3} min`,
            img: p.coverImage ?? "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=250&fit=crop&q=80",
        }));

        return apiSuccess({ posts: mapped });
    } catch {
        return apiSuccess({ posts: [] });
    }
}
