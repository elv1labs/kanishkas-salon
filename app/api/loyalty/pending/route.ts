export const dynamic = "force-dynamic";
// app/api/loyalty/pending/route.ts
// Returns PENDING_APPROVAL loyalty transactions with optional
// search, date range, and pagination.
// Used by the admin loyalty-approvals page and the sidebar badge count.

import { NextRequest } from "next/server";
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";

const APPROVER_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.OWNER];

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return apiUnauthorized();
    }
    if (!APPROVER_ROLES.includes(session.user.role as UserRole)) {
      return apiForbidden();
    }

    const { searchParams } = new URL(req.url);
    const countOnly = searchParams.get("countOnly") === "true";

    const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20));
    const skip  = (page - 1) * limit;

    const search     = searchParams.get("search")?.trim() ?? "";
    const dateFrom   = searchParams.get("dateFrom") ?? "";
    const dateTo     = searchParams.get("dateTo")   ?? "";

    // Count query (always unfiltered for sidebar badge)
    if (countOnly) {
      const count = await prisma.loyaltyTransaction.count({
        where: { status: "PENDING_APPROVAL" },
      });
      return apiSuccess({ data: { count } });
    }

    const where: Record<string, unknown> = { status: "PENDING_APPROVAL" };

    if (search) {
      where.loyaltyAccount = {
        user: {
          OR: [
            { name:  { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
          ],
        },
      };
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      where.createdAt = { ...(where.createdAt as object || {}), gte: from };
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      where.createdAt = { ...(where.createdAt as object || {}), lte: to };
    }

    const [transactions, total] = await Promise.all([
      prisma.loyaltyTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "asc" },
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
      }),
      prisma.loyaltyTransaction.count({ where }),
    ]);

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

    return apiSuccess({
      data: {
        transactions: data,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[GET /api/loyalty/pending]", error);
    return apiError("Internal server error", 500);
  }
}
