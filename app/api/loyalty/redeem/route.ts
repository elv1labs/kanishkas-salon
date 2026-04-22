export const dynamic = "force-dynamic";
// app/api/loyalty/redeem/route.ts
// In-salon loyalty point redemption — called by receptionist at checkout.
//
// Auth:    RECEPTIONIST | ADMIN | OWNER
// Method:  POST
// Body:    { userId, appointmentId, pointsToRedeem }
//
// Behaviour (atomic $transaction):
//  1. Fetch client's loyalty account — 400 if no account or insufficient balance
//  2. Verify appointment exists, belongs to userId, not already paid
//  3. Compute discountAmount = pointsToRedeem * LOYALTY_POINT_VALUE_INR
//  4. Deduct points from LoyaltyAccount (totalPoints, lifetimeRedeemed)
//  5. Create LoyaltyTransaction { type: REDEEM, points: -pointsToRedeem, status: APPROVED }
//  6. ADD to appointment.voucherDiscountAmt (preserves any gift-voucher discount already applied)
// Returns: { success: true, data: { pointsRedeemed, discountAmount, newBalance } }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { UserRole, LoyaltyTransactionType } from "@prisma/client";
import { z } from "zod";
import { LOYALTY_POINT_VALUE_INR, LOYALTY_MIN_REDEEM_POINTS } from "@/lib/constants";

const ALLOWED_ROLES: UserRole[] = [UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.OWNER];

const RedeemSchema = z.object({
  userId:          z.string().cuid("Invalid user ID"),
  appointmentId:   z.string().cuid("Invalid appointment ID"),
  pointsToRedeem:  z
    .number()
    .int("Must be a whole number")
    .min(LOYALTY_MIN_REDEEM_POINTS, `Minimum redemption is ${LOYALTY_MIN_REDEEM_POINTS} points`),
});

export async function POST(req: NextRequest) {
  try {
    // ── Auth ────────────────────────────────────────────────────────────────────
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });
    }
    if (!ALLOWED_ROLES.includes(session.user.role as UserRole)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // ── Parse & validate body ──────────────────────────────────────────────────
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }
    const parsed = RedeemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, appointmentId, pointsToRedeem } = parsed.data;

    // ── Pre-transaction checks (lightweight — real guards re-run inside tx) ────
    const [loyaltyAccount, appointment] = await Promise.all([
      prisma.loyaltyAccount.findUnique({ where: { userId } }),
      prisma.appointment.findUnique({
        where:  { id: appointmentId },
        select: {
          id:                 true,
          clientId:           true,
          status:             true,
          totalAmount:        true,
          voucherDiscountAmt: true,
          payment:            { select: { status: true } },
        },
      }),
    ]);

    if (!loyaltyAccount) {
      return NextResponse.json({ success: false, error: "Client has no loyalty account" }, { status: 404 });
    }
    if (loyaltyAccount.totalPoints < pointsToRedeem) {
      return NextResponse.json(
        { success: false, error: `Insufficient balance. Available: ${loyaltyAccount.totalPoints} pts` },
        { status: 400 }
      );
    }
    if (!appointment) {
      return NextResponse.json({ success: false, error: "Appointment not found" }, { status: 404 });
    }
    if (appointment.clientId !== userId) {
      return NextResponse.json({ success: false, error: "Appointment does not belong to this client" }, { status: 400 });
    }
    if (appointment.payment?.status === "PAID") {
      return NextResponse.json({ success: false, error: "Appointment is already paid — cannot apply discount" }, { status: 409 });
    }

    // ── Compute discount ────────────────────────────────────────────────────────
    const servicePrice        = Number(appointment.totalAmount);
    const existingDiscount    = Number(appointment.voucherDiscountAmt ?? 0);
    const maxRedeemsAllowed   = Math.max(0, servicePrice - existingDiscount); // remaining undiscounted amount
    const discountAmount      = Math.min(pointsToRedeem * LOYALTY_POINT_VALUE_INR, maxRedeemsAllowed);

    if (discountAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Full discount already applied — no remaining amount to discount" },
        { status: 400 }
      );
    }

    // ── Atomic transaction ──────────────────────────────────────────────────────
    const result = await prisma.$transaction(async (tx) => {
      // 1. Re-fetch balance inside tx (guard against race)
      const freshAccount = await tx.loyaltyAccount.findUnique({ where: { userId } });
      if (!freshAccount || freshAccount.totalPoints < pointsToRedeem) {
        throw { code: "INSUFFICIENT_BALANCE" };
      }

      // 2. Deduct points
      const updatedAccount = await tx.loyaltyAccount.update({
        where: { userId },
        data: {
          totalPoints:      { decrement: pointsToRedeem },
          lifetimeRedeemed: { increment: pointsToRedeem },
        },
      });

      // 3. Create REDEEM transaction
      await tx.loyaltyTransaction.create({
        data: {
          loyaltyAccountId: freshAccount.id,
          type:             LoyaltyTransactionType.REDEEM,
          points:           -pointsToRedeem,   // negative = debit
          description:      `Redeemed ${pointsToRedeem} pts for ₹${discountAmount.toFixed(2)} off appointment`,
          status:           "APPROVED",         // instant — no approval step
          appointmentId,
        },
      });

      // 4. ADD discount to appointment (don't overwrite existing voucher discount)
      await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          voucherDiscountAmt: existingDiscount + discountAmount,
        },
      });

      return { newBalance: updatedAccount.totalPoints };
    });

    // ── Activity log (non-critical, outside tx) ─────────────────────────────────
    await prisma.activityLog.create({
      data: {
        userId:   session.user.id,
        action:   "REDEEM_LOYALTY_POINTS",
        entity:   "LoyaltyTransaction",
        entityId: appointmentId,
        details:  { userId, appointmentId, pointsToRedeem, discountAmount },
      },
    }).catch(() => { /* non-critical */ });

    return NextResponse.json({
      success: true,
      data: {
        pointsRedeemed: pointsToRedeem,
        discountAmount: Math.round(discountAmount * 100) / 100,
        newBalance:     result.newBalance,
      },
    });
  } catch (error: any) {
    if (error?.code === "INSUFFICIENT_BALANCE") {
      return NextResponse.json({ success: false, error: "Insufficient balance (race condition)" }, { status: 409 });
    }
    console.error("[POST /api/loyalty/redeem]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
