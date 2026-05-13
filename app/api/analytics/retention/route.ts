export const dynamic = "force-dynamic";
// app/api/analytics/retention/route.ts
// Client retention analytics — tracks clients who haven't returned in 30/60/90 days,
// no-show rate, rebooking rate, and peak hours heatmap.

import { NextRequest } from "next/server";
import { apiSuccess, apiUnauthorized, apiForbidden, apiError, requirePermission } from "@/lib/api-utils";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays, format } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return apiUnauthorized();
    const permError = await requirePermission(session, "viewAnalytics");
    if (permError) return permError;

    const now = new Date();

    // ── 1. Client Retention Buckets ─────────────────────────────────────────
    // Find all clients with completed appointments, then bucket by last visit
    const clientLastVisits = await prisma.appointment.groupBy({
      by: ["clientId"],
      where: { status: "COMPLETED" },
      _max: { date: true },
      _count: { id: true },
    });

    const totalClients = clientLastVisits.length;
    const buckets = { active: 0, risk30: 0, risk60: 0, lost90: 0 };

    for (const client of clientLastVisits) {
      const lastVisit = client._max.date;
      if (!lastVisit) { buckets.lost90++; continue; }
      const daysSince = Math.floor((now.getTime() - new Date(lastVisit).getTime()) / 86_400_000);
      if (daysSince <= 30) buckets.active++;
      else if (daysSince <= 60) buckets.risk30++;
      else if (daysSince <= 90) buckets.risk60++;
      else buckets.lost90++;
    }

    // ── 2. At-Risk Client Details (30-90 days since last visit) ─────────────
    const atRiskThreshold = subDays(now, 30);
    const lostThreshold = subDays(now, 90);

    const atRiskClients = await prisma.$queryRaw<Array<{
      id: string; name: string; email: string | null; phone: string | null;
      last_visit: Date; visit_count: number; total_spent: number;
    }>>`
      SELECT
        u.id, u.name, u.email, u.phone,
        MAX(a.date) as last_visit,
        COUNT(a.id)::int as visit_count,
        COALESCE(SUM(a."totalAmount"), 0)::float as total_spent
      FROM users u
      JOIN appointments a ON a."clientId" = u.id AND a.status = 'COMPLETED'
      GROUP BY u.id
      HAVING MAX(a.date) < ${atRiskThreshold} AND MAX(a.date) >= ${lostThreshold}
      ORDER BY MAX(a.date) ASC
      LIMIT 50
    `;

    // ── 3. No-Show Rate ────────────────────────────────────────────────────
    const last90Days = subDays(now, 90);
    const [appointmentCounts] = await prisma.$queryRaw<Array<{
      total: number; completed: number; no_shows: number; cancelled: number;
    }>>`
      SELECT
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE status = 'COMPLETED')::int as completed,
        COUNT(*) FILTER (WHERE status = 'NO_SHOW')::int as no_shows,
        COUNT(*) FILTER (WHERE status = 'CANCELLED')::int as cancelled
      FROM appointments
      WHERE date >= ${last90Days}
    `;

    const noShowRate = appointmentCounts.total > 0
      ? Math.round((appointmentCounts.no_shows / appointmentCounts.total) * 100)
      : 0;

    // ── 4. Rebooking Rate (% of clients who book again within 60 days) ─────
    const repeatClients = clientLastVisits.filter(c => (c._count?.id ?? 0) > 1).length;
    const rebookingRate = totalClients > 0
      ? Math.round((repeatClients / totalClients) * 100)
      : 0;

    // ── 5. Peak Hours Heatmap ──────────────────────────────────────────────
    const peakHoursRaw = await prisma.$queryRaw<Array<{
      day_of_week: number; hour: number; count: number;
    }>>`
      SELECT
        EXTRACT(DOW FROM date)::int as day_of_week,
        EXTRACT(HOUR FROM "startTime"::time)::int as hour,
        COUNT(*)::int as count
      FROM appointments
      WHERE status = 'COMPLETED' AND date >= ${last90Days}
      GROUP BY day_of_week, hour
      ORDER BY day_of_week, hour
    `;

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const peakHours = peakHoursRaw.map(r => ({
      day: dayNames[r.day_of_week],
      dayIndex: r.day_of_week,
      hour: r.hour,
      hourLabel: `${r.hour}:00`,
      count: r.count,
    }));

    // ── 6. Average Ticket Size ─────────────────────────────────────────────
    const avgTicketResult = await prisma.appointment.aggregate({
      where: { status: "COMPLETED", date: { gte: last90Days } },
      _avg: { totalAmount: true },
      _count: { id: true },
    });
    const avgTicketSize = Math.round(Number(avgTicketResult._avg.totalAmount ?? 0));

    return apiSuccess({
      retention: {
        totalClients,
        buckets,
        bucketLabels: {
          active: "Active (< 30 days)",
          risk30: "At Risk (30-60 days)",
          risk60: "High Risk (60-90 days)",
          lost90: "Lost (> 90 days)",
        },
      },
      atRiskClients: atRiskClients.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        lastVisit: c.last_visit,
        daysSinceVisit: Math.floor((now.getTime() - new Date(c.last_visit).getTime()) / 86_400_000),
        visitCount: c.visit_count,
        totalSpent: Math.round(c.total_spent),
      })),
      metrics: {
        noShowRate,
        rebookingRate,
        avgTicketSize,
        totalAppointments90d: appointmentCounts.total,
        completedAppointments90d: appointmentCounts.completed,
      },
      peakHours,
    });
  } catch (error: any) {
    console.error("[GET /api/analytics/retention]", error);
    return apiError("Internal server error", 500);
  }
}
