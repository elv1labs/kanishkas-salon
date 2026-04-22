export const dynamic = "force-dynamic";
// app/api/notifications/route.ts
// User notifications — read, list, mark as read

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { apiSuccess, apiError, validatePagination } from "@/lib/api-utils";

// ---- GET: List notifications for current user ----
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return apiError("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = validatePagination(searchParams, { page: 1, limit: 20, maxLimit: 100 });
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const where: Record<string, unknown> = { userId: session.user.id };
    if (unreadOnly) where.isRead = false;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return apiSuccess({
      notifications,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /api/notifications]", error);
    return apiError("Internal server error", 500);
  }
}

// ---- PATCH: Mark notifications as read ----
export async function PATCH(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return apiError("Unauthorized", 401);

    const body = await req.json().catch(() => ({}));
    const { ids, markAll } = body as { ids?: string[]; markAll?: boolean };

    if (markAll) {
      await prisma.notification.updateMany({
        where: { userId: session.user.id, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
    } else if (ids?.length) {
      await prisma.notification.updateMany({
        where: { userId: session.user.id, id: { in: ids } },
        data: { isRead: true, readAt: new Date() },
      });
    } else {
      return apiError("Provide ids[] or markAll=true", 400);
    }

    return apiSuccess({ success: true });
  } catch (error) {
    console.error("[PATCH /api/notifications]", error);
    return apiError("Internal server error", 500);
  }
}
