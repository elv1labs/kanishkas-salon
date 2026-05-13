// app/api/academy/enrollments/stats/route.ts
import { apiSuccess } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user) return apiSuccess({ counts: {} });

    const counts = await prisma.courseEnrollment.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    const result: Record<string, number> = {};
    for (const row of counts) { result[row.status] = row._count.id; }
    return apiSuccess({ counts: result });
  } catch {
    return apiSuccess({ counts: {} });
  }
}