export const dynamic = "force-dynamic";
// app/api/vouchers/purchase/route.ts
// POST — authenticated client purchases a gift voucher (offline model: code generated, payment arranged at salon)

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { z } from "zod";
import {
    apiSuccess,
    apiError,
    parseJsonBody,
    requireActiveSession,
    handlePrismaError,
} from "@/lib/api-utils";

const PurchaseSchema = z.object({
    value: z.number().int("Amount must be a whole number").min(100, "Minimum voucher value is ₹100").max(50000, "Maximum voucher value is ₹50,000"),
    recipientName: z.string().min(2, "Recipient name is required").max(100),
    recipientEmail: z.string().email("Invalid email").optional().or(z.literal("")),
    message: z.string().max(200, "Message must be 200 characters or fewer").optional(),
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

        const { data: body, error: bodyError } = await parseJsonBody(req);
        if (bodyError) return bodyError;

        const parsed = PurchaseSchema.safeParse(body);
        if (!parsed.success) {
            return apiError("Validation failed", 400, parsed.error.flatten());
        }

        const { value, recipientName, recipientEmail, message } = parsed.data;

        const code = await generateUniqueCode();

        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1); // valid for 12 months

        const voucher = await prisma.giftVoucher.create({
            data: {
                code,
                value,
                remainingValue: value,
                status: "ACTIVE",
                purchasedById: session!.user.id,
                recipientName,
                recipientEmail: recipientEmail || null,
                message: message || null,
                validFrom: new Date(),
                expiresAt,
            },
        });

        // Notify admins
        await prisma.notification.createMany({
            data: (await prisma.user.findMany({
                where: { role: { in: ["ADMIN", "OWNER"] }, isActive: true },
                select: { id: true },
            })).map(admin => ({
                userId: admin.id,
                type: "SYSTEM" as const,
                title: "New Gift Voucher Purchase Request",
                message: `${session!.user.name} purchased a ₹${value.toLocaleString("en-IN")} gift voucher for ${recipientName}. Code: ${code}`,
                actionUrl: "/admin/users",
                metadata: { voucherCode: code, value, recipientName },
            })),
        }).catch(() => { /* non-critical */ });

        // Activity log
        await prisma.activityLog.create({
            data: {
                userId: session!.user.id,
                action: "CREATE",
                entity: "GiftVoucher",
                entityId: voucher.id,
                details: { code, value, recipientName },
            },
        }).catch(() => { /* non-critical */ });

        return apiSuccess({
            code: voucher.code,
            value: Number(voucher.value),
            recipientName: voucher.recipientName,
            expiresAt: voucher.expiresAt.toISOString(),
            message: "Voucher created successfully. Please arrange payment at the salon.",
        }, 201);
    } catch (e) {
        return handlePrismaError(e);
    }
}
