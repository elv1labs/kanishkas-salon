// app/api/analytics/staff/route.ts
// Staff performance analytics — appointments, revenue, ratings per staff member.

import { NextRequest } from "next/server";
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from "@/lib/api-utils";
import { getAuthSession, hasPermission } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      return apiUnauthorized();
    }
    if (!hasPermission(session.user.role as UserRole, "manageStaff")) {
      return apiForbidden("Insufficient permissions");
    }

    const { searchParams } = new URL(req.url);
    const months = Math.min(parseInt(searchParams.get("months") ?? "3", 10), 12);

    const now = new Date();
    const periodStart = startOfMonth(subMonths(now, months - 1));
    const periodEnd = endOfMonth(now);

    // Get all users who have a staff profile (they could be OWNER or RECEPTIONIST)
    const staffUsers = await prisma.user.findMany({
      where: { staffProfile: { isNot: null }, isActive: true },
      include: {
        staffProfile: { select: { specializations: true } },
      },
    });

    const staffIds = staffUsers.map((s) => s.id);

    // Get appointments in the period
    const appointments = await prisma.appointment.findMany({
      where: {
        staffId: { in: staffIds },
        date: { gte: periodStart, lte: periodEnd },
      },
      select: {
        staffId: true,
        status: true,
        service: { select: { price: true } },
      },
    });

    // Get reviews for staff (via appointments)
    const reviews = await prisma.review.findMany({
      where: {
        isApproved: true,
        appointment: { staffId: { in: staffIds } },
      },
      select: {
        rating: true,
        appointment: { select: { staffId: true } },
      },
    });

    // Aggregate per staff member
    const analytics = staffUsers.map((staff) => {
      const staffAppts = appointments.filter((a) => a.staffId === staff.id);
      const completed = staffAppts.filter((a) => a.status === "COMPLETED");
      const cancelled = staffAppts.filter((a) => a.status === "CANCELLED");
      const noShows = staffAppts.filter((a) => a.status === "NO_SHOW");
      const revenue = completed.reduce((sum, a) => sum + Number(a.service.price), 0);

      const staffReviews = reviews.filter((r) => r.appointment?.staffId === staff.id);
      const avgRating = staffReviews.length > 0
        ? staffReviews.reduce((sum, r) => sum + r.rating, 0) / staffReviews.length
        : null;

      return {
        id: staff.id,
        name: staff.name,
        specializations: staff.staffProfile?.specializations ?? [],
        totalAppointments: staffAppts.length,
        completed: completed.length,
        cancelled: cancelled.length,
        noShows: noShows.length,
        completionRate: staffAppts.length > 0
          ? Math.round((completed.length / staffAppts.length) * 100)
          : 0,
        revenue,
        avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
        reviewCount: staffReviews.length,
      };
    });

    // Sort by revenue descending
    analytics.sort((a, b) => b.revenue - a.revenue);

    return apiSuccess({
      analytics,
      period: { from: periodStart.toISOString(), to: periodEnd.toISOString(), months },
    });
  } catch (error) {
    console.error("[GET /api/analytics/staff]", error);
    return apiError("Internal server error", 500);
  }
}
