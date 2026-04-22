export const dynamic = "force-dynamic";
// app/api/client/vouchers/route.ts
// Returns gift vouchers purchased BY the current user, plus any received by their email.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getAuthSession();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const userEmail = session.user.email;

        // Fetch purchased by me + received (matched by email)
        const [purchased, received] = await Promise.all([
            // Vouchers I bought for others
            prisma.giftVoucher.findMany({
                where: { purchasedById: userId },
                select: {
                    id: true,
                    code: true,
                    value: true,
                    remainingValue: true,
                    status: true,
                    recipientName: true,
                    recipientEmail: true,
                    message: true,
                    expiresAt: true,
                    redeemedAt: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "desc" },
            }),
            // Vouchers gifted to my email address (if exists)
            userEmail
                ? prisma.giftVoucher.findMany({
                    where: {
                        recipientEmail: { equals: userEmail, mode: "insensitive" },
                        purchasedById: { not: userId }, // exclude self-purchased
                    },
                    select: {
                        id: true,
                        code: true,
                        value: true,
                        remainingValue: true,
                        status: true,
                        recipientName: true,
                        recipientEmail: true,
                        message: true,
                        expiresAt: true,
                        redeemedAt: true,
                        createdAt: true,
                        purchasedBy: { select: { name: true } },
                    },
                    orderBy: { createdAt: "desc" },
                })
                : [],
        ]);

        return NextResponse.json({
            purchased,
            received,
            totalPurchased: purchased.length,
            totalReceived: received.length,
        });
    } catch (error) {
        console.error("[GET /api/client/vouchers]", error);
        return NextResponse.json({ error: "Failed to fetch vouchers" }, { status: 500 });
    }
}
