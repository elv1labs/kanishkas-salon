// app/api/services/stats/route.ts
import { apiSuccess } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user) return apiSuccess({ total: 0, active: 0, inactive: 0 });

    const [total, active] = await Promise.all([
      prisma.service.count(),
      prisma.service.count({ where: { isActive: true } }),
    ]);

    return apiSuccess({ total, active, inactive: total - active });
  } catch {
    return apiSuccess({ total: 0, active: 0, inactive: 0 });
  }
}