export const dynamic = "force-dynamic";
// app/api/vouchers/validate/route.ts
// Validates a gift voucher code WITHOUT marking it used.
// Redeem happens separately in POST /api/vouchers/redeem after booking succeeds.
//
// SECURITY RULE: Generic error message to client regardless of failure reason.
//   Internal console.log gets the real reason for ops debugging.
//
// POST body: { code: string, serviceId: string }
// Returns:   { valid: true, voucherName, discountApplied, finalPrice }
//            { valid: false, error: "Invalid or expired code" }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { VoucherStatus } from "@prisma/client";
import { z } from "zod";

const GENERIC_INVALID = "Invalid or expired code";

const ValidateSchema = z.object({
    code: z.string().min(1, "Voucher code is required").max(50),
    serviceId: z.string().cuid("Invalid service ID"),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = ValidateSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ valid: false, error: GENERIC_INVALID }, { status: 400 });
        }

        const { code, serviceId } = parsed.data;
        const upperCode = code.trim().toUpperCase();

        // Fetch voucher and service in parallel
        const [voucher, service] = await Promise.all([
            prisma.giftVoucher.findFirst({ where: { code: upperCode } }),
            prisma.service.findUnique({ where: { id: serviceId }, select: { price: true, name: true } }),
        ]);

        if (!service) {
            return NextResponse.json({ valid: false, error: GENERIC_INVALID }, { status: 400 });
        }

        // ── Validate voucher — log real reason internally, surface generic to client ──

        if (!voucher) {
            console.log(`[vouchers/validate] code="${upperCode}" → not found`);
            return NextResponse.json({ valid: false, error: GENERIC_INVALID });
        }

        if (voucher.status !== VoucherStatus.ACTIVE) {
            console.log(`[vouchers/validate] code="${upperCode}" → status=${voucher.status}`);
            return NextResponse.json({ valid: false, error: GENERIC_INVALID });
        }

        const now = new Date();

        if (voucher.validFrom > now) {
            console.log(`[vouchers/validate] code="${upperCode}" → not yet valid (validFrom=${voucher.validFrom})`);
            return NextResponse.json({ valid: false, error: GENERIC_INVALID });
        }

        if (voucher.expiresAt < now) {
            console.log(`[vouchers/validate] code="${upperCode}" → expired (expiresAt=${voucher.expiresAt})`);
            return NextResponse.json({ valid: false, error: GENERIC_INVALID });
        }

        if (Number(voucher.remainingValue) <= 0) {
            console.log(`[vouchers/validate] code="${upperCode}" → zero remaining balance`);
            return NextResponse.json({ valid: false, error: GENERIC_INVALID });
        }

        if (voucher.redeemedOnAppointmentId) {
            console.log(`[vouchers/validate] code="${upperCode}" → already redeemed on appointment=${voucher.redeemedOnAppointmentId}`);
            return NextResponse.json({ valid: false, error: GENERIC_INVALID });
        }

        // ── Server-side price calculation — client never touches this ──
        const servicePrice = Number(service.price);
        const remainingValue = Number(voucher.remainingValue);
        // Cap discount at service price so total never goes negative
        const discountApplied = Math.min(remainingValue, servicePrice);
        const finalPrice = Math.max(0, servicePrice - discountApplied);

        return NextResponse.json({
            valid: true,
            voucherName: voucher.recipientName ?? "Gift Voucher",
            discountApplied: Math.round(discountApplied * 100) / 100,
            finalPrice: Math.round(finalPrice * 100) / 100,
        });
    } catch (error) {
        console.error("[POST /api/vouchers/validate]", error);
        return NextResponse.json({ valid: false, error: GENERIC_INVALID }, { status: 500 });
    }
}
