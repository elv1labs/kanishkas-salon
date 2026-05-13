// app/api/gallery/stats/route.ts
import { apiSuccess, checkPermission } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getAuthSession();
    const isStaff = session?.user && await checkPermission(session, "manageGallery");

    const [total, published] = await Promise.all([
      prisma.galleryItem.count({ where: isStaff ? {} : { isPublished: true } }),
      prisma.galleryItem.count({ where: { isPublished: true } }),
    ]);

    return apiSuccess({
      total,
      published,
      hidden: total - published,
      allTotal: isStaff ? total : null,
    });
  } catch {
    return apiSuccess({ total: 0, published: 0, hidden: 0 });
  }
}