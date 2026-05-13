export const dynamic = "force-dynamic";
// app/api/vouchers/route.ts
// Voucher management — GET list (admin), POST create (admin-issued voucher)
// Client purchase stays in /api/vouchers/purchase

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import {
  apiSuccess,
  apiError,
  parseJsonBody,
  requireActiveSession,
  validatePagination,
  buildPaginationMeta,
  handlePrismaError,
  requirePermission,
} from "@/lib/api-utils";

const STAFF_ROLES: readonly UserRole[] = [UserRole.ADMIN, UserRole.OWNER, UserRole.RECEPTIONIST];

const VOUCHER_SELECT = {
  id: true,
  code: true,
  value: true,
  remainingValue: true,
  status: true,
  recipientName: true,
  recipientEmail: true,
  message: true,
  validFrom: true,
  expiresAt: true,
  redeemedAt: true,
  createdAt: true,
  updatedAt: true,
  redeemedOnAppointmentId: true,
  purchasedBy: { select: { id: true, name: true, email: true } },
  redeemedBy: { select: { id: true, name: true, email: true } },
} as const;

// ── GET — list vouchers (staff only) ────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    const authError = await requireActiveSession(session);
    if (authError) return authError;

    const role = session!.user.role as UserRole;
    if (!STAFF_ROLES.includes(role)) {
      return apiError("Forbidden — staff only", 403);
    }

    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = validatePagination(searchParams, { page: 1, limit: 30, maxLimit: 100 });

    const status   = searchParams.get("status");
    const search   = searchParams.get("search");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo   = searchParams.get("dateTo");
    const amountMin = parseFloat(searchParams.get("amountMin") ?? "0") || 0;
    const amountMax = parseFloat(searchParams.get("amountMax") ?? "0") || 0;
    const sortBy    = searchParams.get("sortBy")    ?? "createdAt";
    const sortOrder = searchParams.get("sortOrder")  ?? "desc";

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { code:           { contains: search, mode: "insensitive" } },
        { recipientName:   { contains: search, mode: "insensitive" } },
        { recipientEmail:  { contains: search, mode: "insensitive" } },
      ];
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

    if (amountMin > 0) {
      where.value = { ...(where.value as object || {}), gte: amountMin };
    }
    if (amountMax > 0) {
      where.value = { ...(where.value as object || {}), lte: amountMax };
    }

    const allowedSortFields: Record<string, string> = {
      createdAt:  "createdAt",
      expiresAt:  "expiresAt",
      value:      "value",
    };
    const orderByField = allowedSortFields[sortBy] ?? "createdAt";
    const orderByDir   = sortOrder === "asc" ? "asc" as const : "desc" as const;

    const [vouchers, total, statusCounts] = await Promise.all([
      prisma.giftVoucher.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderByField]: orderByDir },
        select: VOUCHER_SELECT,
      }),
      prisma.giftVoucher.count({ where }),
      prisma.giftVoucher.groupBy({
        by: ["status"],
        _count: true,
      }),
    ]);

    const counts = Object.fromEntries(statusCounts.map((c) => [c.status, c._count])) as Record<string, number>;

    return apiSuccess({
      vouchers,
      pagination: buildPaginationMeta(page, limit, total),
      counts,
    });
  } catch (e) {
    return handlePrismaError(e, "GET /api/vouchers");
  }
}

// ── POST — admin issues a voucher manually ──────────────────────────────────

const AdminCreateSchema = z.object({
  value: z.number().int("Amount must be a whole number").min(100).max(50000),
  recipientName: z.string().min(2).max(100),
  recipientEmail: z.string().email().optional().or(z.literal("")),
  message: z.string().max(200).optional(),
  expiresInMonths: z.number().int().min(1).max(24).optional(), // default 12
});

/** Generates a unique 8-char alphanumeric code like KSGIFT-AB12CD34 */
async function generateUniqueCode(): Promise<string> {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 10; attempt++) {
    let suffix = "";
    for (let i = 0; i < 8; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
    const code = `KSGIFT-${suffix}`;
    const existing = await prisma.giftVoucher.findUnique({ where: { code } });
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique voucher code — please try again.");
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    const authError = await requireActiveSession(session);
    if (authError) return authError;

    const permError = await requirePermission(session, "manageServices");
    if (permError) return permError;

    const { data: body, error: jsonError } = await parseJsonBody(req);
    if (jsonError) return jsonError;

    const parsed = AdminCreateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    const { value, recipientName, recipientEmail, message, expiresInMonths } = parsed.data;

    const code = await generateUniqueCode();
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + (expiresInMonths ?? 12));

    const voucher = await prisma.giftVoucher.create({
      data: {
        code,
        value,
        remainingValue: value,
        status: "ACTIVE",
        purchasedById: session!.user.id, // admin is the "purchaser"
        recipientName,
        recipientEmail: recipientEmail || null,
        message: message || null,
        validFrom: new Date(),
        expiresAt,
      },
      select: VOUCHER_SELECT,
    });

    await prisma.activityLog.create({
      data: {
        userId: session!.user.id,
        action: "ISSUE_VOUCHER",
        entity: "GiftVoucher",
        entityId: voucher.id,
        details: { code, value, recipientName },
      },
    });

    return apiSuccess({
      voucher: {
        ...voucher,
        value: Number(voucher.value),
        remainingValue: Number(voucher.remainingValue),
      },
    }, 201);
  } catch (e) {
    return handlePrismaError(e, "POST /api/vouchers");
  }
}
