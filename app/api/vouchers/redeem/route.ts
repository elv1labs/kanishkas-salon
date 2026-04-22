export const dynamic = "force-dynamic";
// app/api/vouchers/redeem/route.ts
// Atomically redeems a voucher against a confirmed appointment.
//
// IMPORTANT DESIGN RULES:
//  1. Called AFTER the booking is confirmed (appointment already exists in DB).
//  2. Re-validates the voucher INSIDE the $transaction — catches the race where
//     another request claimed the code between validate and redeem.
//  3. If race condition fires → return 409. Booking is NOT rolled back.
//     The client already has a confirmed appointment, just without the discount.
//  4. The @unique constraint on redeemedOnAppointmentId is a DB-level guard on top.
//
// POST body: { code: string, appointmentId: string }
// Returns:   { success: true, discountApplied: number }
//            { success: false, error: string, status: 409 } on race condition

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { VoucherStatus } from "@prisma/client";
import { z } from "zod";

const RedeemSchema = z.object({
    code: z.string().min(1).max(50),
    appointmentId: z.string().cuid("Invalid appointment ID"),
});

export async function POST(req: NextRequest) {
    try {
        // Auth — must be a logged-in client
        const session = await getAuthSession();
        if (!session?.user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const parsed = RedeemSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: "Invalid request", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { code, appointmentId } = parsed.data;
        const upperCode = code.trim().toUpperCase();

        // Verify the appointment belongs to the calling user
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            select: { id: true, clientId: true, serviceId: true, service: { select: { price: true } } },
        });

        if (!appointment) {
            return NextResponse.json({ success: false, error: "Appointment not found" }, { status: 404 });
        }
        if (appointment.clientId !== session.user.id) {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        // ── Atomic transaction ──────────────────────────────────────────────────

        try {
            const result = await prisma.$transaction(async (tx) => {
                // 1. Re-validate voucher inside transaction (race condition guard)
                const voucher = await tx.giftVoucher.findFirst({
                    where: { code: upperCode },
                });

                const now = new Date();

                if (
                    !voucher ||
                    voucher.status !== VoucherStatus.ACTIVE ||
                    voucher.validFrom > now ||
                    voucher.expiresAt < now ||
                    Number(voucher.remainingValue) <= 0 ||
                    voucher.redeemedOnAppointmentId !== null
                ) {
                    // Voucher was invalidated between validate and redeem
                    throw { code: "VOUCHER_EXPIRED_OR_USED", status: 409 };
                }

                // 2. Server-side: compute the discount
                const servicePrice = Number(appointment.service.price);
                const remainingValue = Number(voucher.remainingValue);
                const discountApplied = Math.min(remainingValue, servicePrice);
                const newRemainingValue = remainingValue - discountApplied;

                // 3. Mark voucher as redeemed — the @unique on redeemedOnAppointmentId
                //    acts as the final DB-level guard against any concurrent redemptions
                const updatedVoucher = await tx.giftVoucher.update({
                    where: { id: voucher.id },
                    data: {
                        status: newRemainingValue <= 0 ? VoucherStatus.REDEEMED : VoucherStatus.ACTIVE,
                        remainingValue: newRemainingValue,
                        redeemedById: session.user.id,
                        redeemedOnAppointmentId: appointmentId,
                        redeemedAt: now,
                    },
                });

                // 4. Stamp voucherCode + voucherDiscountAmt on the appointment
                await tx.appointment.update({
                    where: { id: appointmentId },
                    data: {
                        voucherCode: upperCode,
                        voucherDiscountAmt: discountApplied,
                    },
                });

                return {
                    discountApplied: Math.round(discountApplied * 100) / 100,
                    newRemainingValue: Math.round(newRemainingValue * 100) / 100,
                };
            });

            // 5. Activity log (outside transaction — non-critical)
            await prisma.activityLog.create({
                data: {
                    userId: session.user.id,
                    action: "REDEEM_VOUCHER",
                    entity: "GiftVoucher",
                    entityId: upperCode,
                    details: {
                        appointmentId,
                        code: upperCode,
                        discountApplied: result.discountApplied,
                    },
                },
            }).catch(() => { /* non-critical — don't fail the response */ });

            return NextResponse.json(
                { success: true, discountApplied: result.discountApplied },
                { status: 200 }
            );
        } catch (txError: any) {
            if (txError?.code === "VOUCHER_EXPIRED_OR_USED") {
                console.log(`[vouchers/redeem] race condition: code="${upperCode}" already claimed`);
                return NextResponse.json(
                    {
                        success: false,
                        error: "This voucher was already claimed. Your booking is still confirmed — no discount applied.",
                    },
                    { status: 409 }
                );
            }
            // P2002 = unique constraint violation (redeemedOnAppointmentId)
            if (txError?.code === "P2002") {
                console.log(`[vouchers/redeem] DB unique constraint hit: code="${upperCode}"`);
                return NextResponse.json(
                    {
                        success: false,
                        error: "This voucher was already claimed. Your booking is still confirmed.",
                    },
                    { status: 409 }
                );
            }
            throw txError; // re-throw unexpected errors
        }
    } catch (error) {
        console.error("[POST /api/vouchers/redeem]", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
