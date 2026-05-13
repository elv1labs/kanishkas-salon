// app/api/blog/stats/route.ts
import { apiSuccess } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user) return apiSuccess({ total: 0, published: 0, draft: 0 });

    const [total, published, draft] = await Promise.all([
      prisma.blogPost.count(),
      prisma.blogPost.count({ where: { status: "PUBLISHED" } }),
      prisma.blogPost.count({ where: { status: "DRAFT" } }),
    ]);

    return apiSuccess({ total, published, draft });
  } catch {
    return apiSuccess({ total: 0, published: 0, draft: 0 });
  }
}