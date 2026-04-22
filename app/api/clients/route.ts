export const dynamic = "force-dynamic";
// app/api/clients/route.ts
// Client list for CRM — staff-only view with search, filtering, and aggregate stats.

import { NextRequest } from "next/server";
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from "@/lib/api-utils";
import { getAuthSession, hasPermission } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return apiUnauthorized();
    if (!hasPermission(session.user.role as UserRole, "manageAppointments")) return apiForbidden();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() ?? "";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
    const sortBy = searchParams.get("sort") ?? "lastVisit";
    const skip = (page - 1) * limit;

    // Build search filter
    const where: any = { role: "CLIENT" };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }

    const [clients, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          loyaltyAccount: {
            select: { totalPoints: true, tier: true },
          },
        },
        orderBy: sortBy === "name"
          ? { name: "asc" }
          : { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Get appointment + order counts per client (batch)
    const clientIds = clients.map(c => c.id);

    const [apptCounts, orderCounts, lastVisits] = await Promise.all([
      prisma.appointment.groupBy({
        by: ["clientId"],
        where: { clientId: { in: clientIds }, status: "COMPLETED" },
        _count: { id: true },
      }),
      prisma.order.groupBy({
        by: ["clientId"],
        where: { clientId: { in: clientIds } },
        _count: { id: true },
      }),
      prisma.appointment.groupBy({
        by: ["clientId"],
        where: { clientId: { in: clientIds }, status: "COMPLETED" },
        _max: { date: true },
      }),
    ]);

    const apptCountMap = new Map(apptCounts.map(a => [a.clientId, a._count.id]));
    const orderCountMap = new Map(orderCounts.map(o => [o.clientId, o._count.id]));
    const lastVisitMap = new Map(lastVisits.map(lv => [lv.clientId, lv._max.date]));

    const enriched = clients.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email?.endsWith("@kanishkas.local") ? null : c.email,
      phone: c.phone,
      createdAt: c.createdAt,
      isActive: c.isActive,
      loyaltyPoints: c.loyaltyAccount?.totalPoints ?? 0,
      loyaltyTier: c.loyaltyAccount?.tier ?? "BRONZE",
      appointmentCount: apptCountMap.get(c.id) ?? 0,
      orderCount: orderCountMap.get(c.id) ?? 0,
      lastVisit: lastVisitMap.get(c.id) ?? null,
    }));

    // Re-sort by last visit if requested
    if (sortBy === "lastVisit") {
      enriched.sort((a, b) => {
        if (!a.lastVisit && !b.lastVisit) return 0;
        if (!a.lastVisit) return 1;
        if (!b.lastVisit) return -1;
        return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
      });
    }

    return apiSuccess({
      clients: enriched,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error("[GET /api/clients]", error);
    return apiError("Internal server error", 500);
  }
}
