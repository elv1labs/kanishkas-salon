export const dynamic = "force-dynamic";
// app/api/vouchers/[id]/route.ts
// Single voucher — GET detail, PATCH update (extend/cancel), DELETE (cancel)
// Mirrors /api/academy/courses/[id]/route.ts patterns

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import {
  apiSuccess,
  apiError,
  apiNotFound,
  parseJsonBody,
  requireActiveSession,
  handlePrismaError,
  requirePermission,
} from "@/lib/api-utils";

const VOUCHER_DETAIL_SELECT = {
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
  redeemedOnAppointment: {
    select: { id: true, date: true, service: { select: { name: true } } },
  },
} as const;

type RouteContext = { params: Promise<{ id: string }> };

// ── GET — single voucher detail ─────────────────────────────────────────────

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await getAuthSession();
    const authError = await requireActiveSession(session);
    if (authError) return authError;

    const role = session!.user.role as UserRole;
    const staffRoles: readonly UserRole[] = [UserRole.ADMIN, UserRole.OWNER, UserRole.RECEPTIONIST];
    if (!staffRoles.includes(role)) {
      return apiError("Forbidden — staff only", 403);
    }

    const { id } = await context.params;

    const voucher = await prisma.giftVoucher.findUnique({
      where: { id },
      select: VOUCHER_DETAIL_SELECT,
    });

    if (!voucher) {
      return apiNotFound("Voucher not found");
    }

    return apiSuccess({
      voucher: {
        ...voucher,
        value: Number(voucher.value),
        remainingValue: Number(voucher.remainingValue),
      },
    });
  } catch (error) {
    return handlePrismaError(error, "GET /api/vouchers/[id]");
  }
}

// ── PATCH — update voucher (extend expiry, cancel, adjust value) ────────────

const UpdateVoucherSchema = z.object({
  status: z.enum(["ACTIVE", "CANCELLED", "EXPIRED"]).optional(),
  expiresAt: z.string().datetime().optional(),
  remainingValue: z.number().min(0).max(50000).optional(),
  recipientName: z.string().min(2).max(100).optional(),
  recipientEmail: z.string().email().optional().or(z.literal("")).optional(),
  message: z.string().max(200).optional(),
});

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const session = await getAuthSession();
    const authError = await requireActiveSession(session);
    if (authError) return authError;

    const permError = await requirePermission(session, "manageServices");
    if (permError) return permError;

    const { id } = await context.params;

    const { data: body, error: jsonError } = await parseJsonBody(req);
    if (jsonError) return jsonError;

    const parsed = UpdateVoucherSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    const existing = await prisma.giftVoucher.findUnique({
      where: { id },
      select: { id: true, code: true, status: true },
    });
    if (!existing) {
      return apiNotFound("Voucher not found");
    }

    // Don't allow editing a REDEEMED voucher's value
    if (existing.status === "REDEEMED" && parsed.data.remainingValue !== undefined) {
      return apiError("Cannot adjust value of a fully redeemed voucher", 400);
    }

    const updateData: Record<string, unknown> = {};

    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
    if (parsed.data.expiresAt !== undefined) updateData.expiresAt = new Date(parsed.data.expiresAt);
    if (parsed.data.remainingValue !== undefined) updateData.remainingValue = parsed.data.remainingValue;
    if (parsed.data.recipientName !== undefined) updateData.recipientName = parsed.data.recipientName;
    if (parsed.data.recipientEmail !== undefined) updateData.recipientEmail = parsed.data.recipientEmail || null;
    if (parsed.data.message !== undefined) updateData.message = parsed.data.message || null;

    const voucher = await prisma.giftVoucher.update({
      where: { id },
      data: updateData,
      select: VOUCHER_DETAIL_SELECT,
    });

    await prisma.activityLog.create({
      data: {
        userId: session!.user.id,
        action: "UPDATE_VOUCHER",
        entity: "GiftVoucher",
        entityId: id,
        details: { code: existing.code, fields: Object.keys(parsed.data) },
      },
    });

    return apiSuccess({
      voucher: {
        ...voucher,
        value: Number(voucher.value),
        remainingValue: Number(voucher.remainingValue),
      },
    });
  } catch (error) {
    return handlePrismaError(error, "PATCH /api/vouchers/[id]");
  }
}

// ── DELETE — cancel voucher ─────────────────────────────────────────────────

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await getAuthSession();
    const authError = await requireActiveSession(session);
    if (authError) return authError;

    const permError = await requirePermission(session, "manageServices");
    if (permError) return permError;

    const { id } = await context.params;

    const existing = await prisma.giftVoucher.findUnique({
      where: { id },
      select: { id: true, code: true, status: true },
    });
    if (!existing) {
      return apiNotFound("Voucher not found");
    }

    if (existing.status === "REDEEMED") {
      return apiError("Cannot cancel a fully redeemed voucher", 400);
    }

    if (existing.status === "CANCELLED") {
      return apiError("Voucher is already cancelled", 409);
    }

    await prisma.giftVoucher.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    await prisma.activityLog.create({
      data: {
        userId: session!.user.id,
        action: "CANCEL_VOUCHER",
        entity: "GiftVoucher",
        entityId: id,
        details: { code: existing.code },
      },
    });

    return apiSuccess({
      success: true,
      message: `Voucher ${existing.code} has been cancelled`,
    });
  } catch (error) {
    return handlePrismaError(error, "DELETE /api/vouchers/[id]");
  }
}
