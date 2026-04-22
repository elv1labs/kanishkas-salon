export const dynamic = "force-dynamic";
// app/api/clients/[id]/timeline/route.ts
// Client Timeline CRM — aggregate view of a client's full history for staff.
// Combines: appointments, orders, loyalty transactions, reviews, enrollments.

import { NextRequest } from "next/server";
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiNotFound } from "@/lib/api-utils";
import { getAuthSession, hasPermission } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return apiUnauthorized();

    // Staff can view any client; clients can only view their own
    const isStaff = hasPermission(session.user.role as UserRole, "manageAppointments");
    const clientId = params.id;

    if (!isStaff && session.user.id !== clientId) {
      return apiForbidden("You can only view your own timeline");
    }

    // ── 1. Client profile ─────────────────────────────────────────────────
    const client = await prisma.user.findUnique({
      where: { id: clientId },
      include: {
        profile: true,
        loyaltyAccount: true,
      },
    });

    if (!client) return apiNotFound("Client not found");

    // ── 2. Appointments (last 50) ─────────────────────────────────────────
    const appointments = await prisma.appointment.findMany({
      where: { clientId },
      orderBy: { date: "desc" },
      take: 50,
      select: {
        id: true, date: true, startTime: true, endTime: true,
        status: true, totalAmount: true, bookingRef: true, notes: true,
        service: { select: { name: true, category: true, price: true } },
        staff: { select: { name: true } },
      },
    });

    // ── 3. Orders (last 20) ───────────────────────────────────────────────
    const orders = await prisma.order.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true, orderRef: true, status: true, total: true,
        createdAt: true,
      },
    });

    // Separate query for order item counts
    const orderItemCounts = await prisma.orderItem.groupBy({
      by: ["orderId"],
      where: { orderId: { in: orders.map(o => o.id) } },
      _count: { id: true },
    });
    const itemCountMap = new Map(orderItemCounts.map(c => [c.orderId, c._count.id]));

    // ── 4. Loyalty transactions (last 30) ─────────────────────────────────
    const loyaltyTransactions = client.loyaltyAccount
      ? await prisma.loyaltyTransaction.findMany({
          where: { loyaltyAccountId: client.loyaltyAccount.id },
          orderBy: { createdAt: "desc" },
          take: 30,
          select: {
            id: true, type: true, points: true, description: true,
            status: true, createdAt: true,
          },
        })
      : [];

    // ── 5. Reviews ────────────────────────────────────────────────────────
    const reviews = await prisma.review.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true, rating: true, comment: true, isApproved: true,
        ownerResponse: true, createdAt: true,
        service: { select: { name: true } },
      },
    });

    // ── 6. Academy enrollments ────────────────────────────────────────────
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { userId: clientId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true, status: true, paymentStatus: true,
        paymentAmount: true, createdAt: true,
        course: { select: { name: true } },
      },
    });

    // ── 7. Aggregate stats ────────────────────────────────────────────────
    const completedAppts = appointments.filter(a => a.status === "COMPLETED");
    const totalServiceSpend = completedAppts.reduce(
      (sum, a) => sum + Number(a.totalAmount ?? 0), 0
    );
    const totalProductSpend = orders
      .filter(o => o.status !== "CANCELLED")
      .reduce((sum, o) => sum + Number(o.total), 0);

    const firstVisit = appointments.length > 0
      ? appointments[appointments.length - 1].date
      : client.createdAt;
    const lastVisit = completedAppts.length > 0
      ? completedAppts[0].date
      : null;

    const avgRating = reviews.length > 0
      ? Math.round(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length * 10) / 10
      : null;

    // Build unified timeline
    const timeline = [
      ...appointments.map(a => ({
        type: "appointment" as const,
        date: a.date,
        title: a.service.name,
        subtitle: `${a.startTime} · ${a.staff?.name ?? "Any"}`,
        status: a.status,
        amount: Number(a.totalAmount ?? 0),
        ref: a.bookingRef,
        id: a.id,
      })),
      ...orders.map(o => ({
        type: "order" as const,
        date: o.createdAt,
        title: `Order #${o.orderRef.slice(-6).toUpperCase()}`,
        subtitle: `${itemCountMap.get(o.id) ?? 0} item(s)`,
        status: o.status,
        amount: Number(o.total),
        ref: o.orderRef,
        id: o.id,
      })),
      ...enrollments.map(e => ({
        type: "enrollment" as const,
        date: e.createdAt,
        title: e.course.name,
        subtitle: `Academy enrollment`,
        status: e.status,
        amount: Number(e.paymentAmount ?? 0),
        ref: null as string | null,
        id: e.id,
      })),
      ...reviews.map(r => ({
        type: "review" as const,
        date: r.createdAt,
        title: `${r.rating}★ Review`,
        subtitle: r.comment?.slice(0, 80) ?? "",
        status: r.isApproved ? "APPROVED" : "PENDING",
        amount: 0,
        ref: null as string | null,
        id: r.id,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return apiSuccess({
      client: {
        id: client.id,
        name: client.name,
        email: client.email?.endsWith("@kanishkas.local") ? null : client.email,
        phone: client.phone,
        createdAt: client.createdAt,
        isActive: client.isActive,
        dateOfBirth: client.profile?.dateOfBirth,
        skinType: client.profile?.skinType,
        hairType: client.profile?.hairType,
        allergies: client.profile?.allergies,
        preferredStaff: client.profile?.preferredStaff,
        notes: client.profile?.notes,
      },
      loyalty: client.loyaltyAccount
        ? {
            totalPoints: client.loyaltyAccount.totalPoints,
            lifetimeEarned: client.loyaltyAccount.lifetimeEarned,
            lifetimeRedeemed: client.loyaltyAccount.lifetimeRedeemed,
            tier: client.loyaltyAccount.tier,
          }
        : null,
      stats: {
        totalVisits: completedAppts.length,
        totalServiceSpend: Math.round(totalServiceSpend),
        totalProductSpend: Math.round(totalProductSpend),
        totalSpend: Math.round(totalServiceSpend + totalProductSpend),
        firstVisit,
        lastVisit,
        avgRating,
        reviewCount: reviews.length,
        noShowCount: appointments.filter(a => a.status === "NO_SHOW").length,
        cancelCount: appointments.filter(a => a.status === "CANCELLED").length,
      },
      timeline,
      loyaltyTransactions,
    });
  } catch (error: any) {
    console.error("[GET /api/clients/[id]/timeline]", error);
    return apiError("Internal server error", 500);
  }
}
