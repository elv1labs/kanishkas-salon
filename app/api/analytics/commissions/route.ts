// app/api/analytics/commissions/route.ts
// Staff commission report — calculates earnings per staff member for a date range.
// Based on completed appointments where staff member was assigned.
//
// GET /api/analytics/commissions?from=2026-04-01&to=2026-04-30&staffId=xyz
// Query params:
//   from     — start date (YYYY-MM-DD) — defaults to start of current month
//   to       — end date (YYYY-MM-DD)   — defaults to today
//   staffId  — optional: filter to a single staff member

import { NextRequest } from "next/server";
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { getAuthSession, hasPermission } from "@/lib/auth";
import { UserRole, CommissionType } from "@prisma/client";
import { startOfMonth, endOfDay, parseISO, format } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getAuthSession();
  if (!session?.user) return apiUnauthorized();

  const role = session.user.role as UserRole;
  if (!hasPermission(role, "viewAnalytics")) {
    return apiForbidden("Analytics access required");
  }

  const { searchParams } = new URL(req.url);
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");
  const staffId = searchParams.get("staffId");

  const fromDate = fromStr ? parseISO(fromStr) : startOfMonth(new Date());
  const toDate = toStr ? endOfDay(parseISO(toStr)) : endOfDay(new Date());

  try {
    // Get staff with commission settings
    const staffFilter: any = {
      role: { in: ["ADMIN", "OWNER", "RECEPTIONIST"] as UserRole[] },
      staffProfile: { isNot: null },
    };
    if (staffId) staffFilter.id = staffId;

    const staffMembers = await prisma.user.findMany({
      where: staffFilter,
      include: {
        staffProfile: true,
      },
    });

    // Get completed appointments in date range for these staff
    const staffIds = staffMembers.map((s) => s.id);
    const appointments = await prisma.appointment.findMany({
      where: {
        staffId: { in: staffIds },
        status: "COMPLETED",
        date: { gte: fromDate, lte: toDate },
      },
      include: {
        service: { select: { name: true, price: true } },
        staff: { select: { id: true, name: true } },
      },
    });

    // Calculate commissions per staff
    const commissionReport = staffMembers.map((staff) => {
      const profile = staff.staffProfile;
      const commissionType = profile?.commissionType ?? CommissionType.PERCENTAGE;
      const commissionRate = Number(profile?.commissionRate ?? 0);
      
      const staffAppointments = appointments.filter((a) => a.staffId === staff.id);
      
      let totalServiceRevenue = 0;
      let totalCommission = 0;
      const breakdown: Array<{
        appointmentId: string;
        date: string;
        service: string;
        servicePrice: number;
        commission: number;
      }> = [];

      for (const appt of staffAppointments) {
        const servicePrice = Number(appt.service.price);
        totalServiceRevenue += servicePrice;

        let commission = 0;
        if (commissionType === CommissionType.PERCENTAGE) {
          commission = servicePrice * (commissionRate / 100);
        } else {
          // Flat rate per completed service
          commission = commissionRate;
        }
        totalCommission += commission;

        breakdown.push({
          appointmentId: appt.id,
          date: format(appt.date, "yyyy-MM-dd"),
          service: appt.service.name,
          servicePrice,
          commission: Math.round(commission * 100) / 100,
        });
      }

      return {
        staffId: staff.id,
        staffName: staff.name,
        designation: profile?.designation ?? "Staff",
        commissionType,
        commissionRate,
        period: {
          from: format(fromDate, "yyyy-MM-dd"),
          to: format(toDate, "yyyy-MM-dd"),
        },
        summary: {
          totalAppointments: staffAppointments.length,
          totalServiceRevenue: Math.round(totalServiceRevenue * 100) / 100,
          totalCommission: Math.round(totalCommission * 100) / 100,
        },
        breakdown,
      };
    });

    // Grand totals
    const totals = commissionReport.reduce(
      (acc, r) => ({
        totalAppointments: acc.totalAppointments + r.summary.totalAppointments,
        totalServiceRevenue: Math.round((acc.totalServiceRevenue + r.summary.totalServiceRevenue) * 100) / 100,
        totalCommission: Math.round((acc.totalCommission + r.summary.totalCommission) * 100) / 100,
      }),
      { totalAppointments: 0, totalServiceRevenue: 0, totalCommission: 0 }
    );

    return apiSuccess({
      period: {
        from: format(fromDate, "yyyy-MM-dd"),
        to: format(toDate, "yyyy-MM-dd"),
      },
      totals,
      staff: commissionReport,
    });
  } catch (error) {
    console.error("[GET /api/analytics/commissions]", error);
    return apiError("Failed to generate commission report", 500);
  }
}
