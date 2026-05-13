export const dynamic = "force-dynamic";
// app/api/activity-logs/route.ts
// Activity log viewer API — admin only

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { validatePagination, buildPaginationMeta, apiSuccess, apiError, handlePrismaError, requirePermission } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    const permError = await requirePermission(session, "manageSettings");
    if (permError) return permError;

    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = validatePagination(searchParams, { page: 1, limit: 50, maxLimit: 100 });

    const action = searchParams.get("action");
    const entity = searchParams.get("entity");
    const userId = searchParams.get("userId");
    const search = searchParams.get("search");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const where: any = {};

    if (action && action !== "All") {
      // Map filter values to action patterns
      if (action === "CREATE") where.action = { startsWith: "CREATE" };
      else if (action === "UPDATE") where.action = { startsWith: "UPDATE" };
      else if (action === "DELETE") where.action = { startsWith: "DELETE" };
      else if (action === "AUTO") where.action = { startsWith: "AUTO" };
      else where.action = action;
    }

    if (entity) {
      if (entity.includes(",")) {
        where.entity = { in: entity.split(",") };
      } else {
        where.entity = entity;
      }
    }

    if (userId) {
      where.userId = userId;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { entity: { contains: search, mode: "insensitive" } },
        { entityId: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, role: true, image: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    // Get summary stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayCount, createCount, updateCount, deleteCount] = await Promise.all([
      prisma.activityLog.count({ where: { createdAt: { gte: today } } }),
      prisma.activityLog.count({ where: { action: { startsWith: "CREATE" } } }),
      prisma.activityLog.count({ where: { action: { startsWith: "UPDATE" } } }),
      prisma.activityLog.count({ where: { action: { startsWith: "DELETE" } } }),
    ]);

    return apiSuccess({
      logs: logs.map((log) => ({
        id: log.id,
        timestamp: log.createdAt,
        user: log.user?.name ?? "System",
        role: log.user?.role ?? "SYSTEM",
        action: log.action.startsWith("CREATE") ? "CREATE"
             : log.action.startsWith("UPDATE") ? "UPDATE"
             : log.action.startsWith("DELETE") ? "DELETE"
             : log.action.startsWith("AUTO") ? "AUTO"
             : log.action,
        rawAction: log.action,
        entity: log.entity,
        entityId: log.entityId,
        details: typeof log.details === "object" && log.details !== null
          ? Object.entries(log.details as Record<string, any>)
              .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
              .join(", ")
          : String(log.details ?? ""),
        ip: log.ipAddress ?? "—",
      })),
      stats: { today: todayCount, creates: createCount, updates: updateCount, deletes: deleteCount },
      pagination: buildPaginationMeta(page, limit, total),
    });
  } catch (error) {
    return handlePrismaError(error, "GET /api/activity-logs");
  }
}
