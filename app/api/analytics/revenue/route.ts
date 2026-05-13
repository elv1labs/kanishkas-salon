export const dynamic = "force-dynamic";
// app/api/analytics/revenue/route.ts
// Revenue analytics API — owner + admin only

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, requirePermission } from "@/lib/api-utils";
import { startOfDay, endOfDay, subDays, format, eachDayOfInterval } from "date-fns";
import { z } from "zod";

const PeriodSchema = z.enum(["today", "week", "month"]).default("week");

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return apiUnauthorized();
    }
    const permError = await requirePermission(session, "viewAnalytics");
    if (permError) return permError;

    const { searchParams } = new URL(req.url);
    const periodResult = PeriodSchema.safeParse(searchParams.get("period") ?? undefined);
    if (!periodResult.success) {
      return apiError("Invalid period. Use: today, week, or month", 400);
    }
    const period = periodResult.data;

    // Determine date range
    const now = new Date();
    const rangeStart =
      period === "today"  ? startOfDay(now)         :
      period === "week"   ? startOfDay(subDays(now, 6)) :
      /* month */           startOfDay(subDays(now, 29));
    const rangeEnd = endOfDay(now);

    // Previous period for % change
    const prevRangeLength = Math.round((rangeEnd.getTime() - rangeStart.getTime()) / 86_400_000);
    const prevStart = startOfDay(subDays(rangeStart, prevRangeLength));
    const prevEnd   = endOfDay(subDays(rangeEnd, prevRangeLength));

    // ── Fetch completed appointments in range ──────────────────────────────
    const [appointments, prevAppointments, orders, prevOrders] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          status: "COMPLETED",
          date: { gte: rangeStart, lte: rangeEnd },
        },
        include: {
          service: { select: { name: true, category: true, price: true } },
        },
      }),
      prisma.appointment.findMany({
        where: {
          status: "COMPLETED",
          date: { gte: prevStart, lte: prevEnd },
        },
        select: { totalAmount: true },
      }),
      prisma.order.findMany({
        where: {
          status: { in: ["DELIVERED", "SHIPPED", "PROCESSING"] },
          createdAt: { gte: rangeStart, lte: rangeEnd },
        },
        select: { total: true, createdAt: true },
      }),
      prisma.order.findMany({
        where: {
          status: { in: ["DELIVERED", "SHIPPED", "PROCESSING"] },
          createdAt: { gte: prevStart, lte: prevEnd },
        },
        select: { total: true },
      }),
    ]);

    // ── Revenue totals ─────────────────────────────────────────────────────
    const servicesRevenue = appointments.reduce(
      (s, a) => s + Number(a.totalAmount ?? 0), 0
    );
    const productsRevenue = orders.reduce(
      (s, o) => s + Number(o.total ?? 0), 0
    );
    const totalRevenue = servicesRevenue + productsRevenue;

    const prevServicesRevenue = prevAppointments.reduce(
      (s, a) => s + Number(a.totalAmount ?? 0), 0
    );
    const prevProductsRevenue = prevOrders.reduce(
      (s, o) => s + Number(o.total ?? 0), 0
    );
    const prevTotal = prevServicesRevenue + prevProductsRevenue;

    const days = period === "today" ? 1 : period === "week" ? 7 : 30;
    const avgPerDay = Math.round(totalRevenue / days);

    // Revenue per transaction: total completed appointments + qualifying orders
    // totalTransactions = count of COMPLETED appointments + count of qualifying orders in range
    const totalTransactions = appointments.length + orders.length;
    const avgTransactionValue =
      totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;

    const percentageChange =
      prevTotal === 0
        ? totalRevenue > 0 ? 100 : 0
        : Math.round(((totalRevenue - prevTotal) / prevTotal) * 100);

    // ── Daily revenue breakdown ────────────────────────────────────────────
    const allDays = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

    const dailyRevenue = allDays.map((d) => {
      const dayStr = format(d, "yyyy-MM-dd");

      const dayAppointments = appointments.filter(
        (a) => format(new Date(a.date), "yyyy-MM-dd") === dayStr
      );
      const dayOrdersList = orders.filter(
        (o) => format(new Date(o.createdAt), "yyyy-MM-dd") === dayStr
      );

      const dayServices = dayAppointments.reduce(
        (s, a) => s + Number(a.totalAmount ?? 0), 0
      );
      const dayProducts = dayOrdersList.reduce(
        (s, o) => s + Number(o.total ?? 0), 0
      );

      return {
        date: dayStr,
        day: format(d, period === "month" ? "d MMM" : "EEE"),
        services: dayServices,
        products: dayProducts,
        total: dayServices + dayProducts,
        appointments: dayAppointments.length,
        orders: dayOrdersList.length,
      };
    });

    // ── Category breakdown ─────────────────────────────────────────────────
    const catMap: Record<string, { revenue: number; count: number }> = {};
    for (const appt of appointments) {
      const cat = appt.service?.category ?? "Other";
      if (!catMap[cat]) catMap[cat] = { revenue: 0, count: 0 };
      catMap[cat].revenue += Number(appt.totalAmount ?? 0);
      catMap[cat].count += 1;
    }

    const categoryBreakdown = Object.entries(catMap)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .map(([name, { revenue, count }]) => ({
        name: name.replace(/_/g, " "),
        revenue: fmt(revenue),
        appointments: count,
        share:
          totalRevenue > 0
            ? Math.round((revenue / totalRevenue) * 100)
            : 0,
      }));

    // ── Top services ───────────────────────────────────────────────────────
    const svcMap: Record<string, { revenue: number; count: number }> = {};
    for (const appt of appointments) {
      const name = appt.service?.name ?? "Unknown";
      if (!svcMap[name]) svcMap[name] = { revenue: 0, count: 0 };
      svcMap[name].revenue += Number(appt.totalAmount ?? 0);
      svcMap[name].count += 1;
    }

    const topServices = Object.entries(svcMap)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 10)
      .map(([name, { revenue, count }]) => ({
        name,
        count,
        revenue: fmt(revenue),
      }));

    return apiSuccess({
      dailyRevenue,
      categoryBreakdown,
      topServices,
      summary: {
        totalRevenue,
        servicesRevenue,
        productsRevenue,
        avgPerDay,
        // Avg. Transaction Value = Total Revenue ÷ number of completed transactions (appointments + orders)
        totalTransactions,
        avgTransactionValue,
        percentageChange,
      },
      period,
    });
  } catch (error: any) {
    console.error("[GET /api/analytics/revenue]", error);
    return apiError("Internal server error", 500);
  }
}
