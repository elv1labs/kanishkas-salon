export const dynamic = "force-dynamic";
// app/api/loyalty/pending/route.ts
// Returns all PENDING_APPROVAL loyalty transactions joined with
// client name, appointment date, service name, and points to award.
// Used by the admin loyalty-approvals page and the sidebar badge count.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";

const APPROVER_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.OWNER];

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });
    }
    if (!APPROVER_ROLES.includes(session.user.role as UserRole)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const countOnly = searchParams.get("countOnly") === "true"; // lightweight flag for sidebar badge

    if (countOnly) {
      const count = await prisma.loyaltyTransaction.count({
        where: { status: "PENDING_APPROVAL" },
      });
      return NextResponse.json({ success: true, data: { count } });
    }

    const transactions = await prisma.loyaltyTransaction.findMany({
      where: { status: "PENDING_APPROVAL" },
      include: {
        loyaltyAccount: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
        appointment: {
          include: {
            service: { select: { name: true, price: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" }, // oldest first — FIFO for fairness
    });

    const data = transactions.map((tx) => ({
      id:              tx.id,
      points:          tx.points,
      description:     tx.description,
      createdAt:       tx.createdAt,
      client: {
        id:    tx.loyaltyAccount.user.id,
        name:  tx.loyaltyAccount.user.name,
        email: tx.loyaltyAccount.user.email,
        phone: tx.loyaltyAccount.user.phone,
      },
      appointment: tx.appointment
        ? {
            id:          tx.appointment.id,
            date:        tx.appointment.date,
            startTime:   tx.appointment.startTime,
            serviceName: tx.appointment.service.name,
            amount:      Number(tx.appointment.totalAmount),
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        transactions: data,
        total: data.length,
      },
    });
  } catch (error) {
    console.error("[GET /api/loyalty/pending]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
