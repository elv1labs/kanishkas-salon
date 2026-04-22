export const dynamic = "force-dynamic";
// app/api/referral/route.ts
// GET — returns the authenticated client's referral code (generates one if missing) + referral history

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { apiSuccess, apiError, handlePrismaError } from "@/lib/api-utils";

/** Generates a 6-char alphanumeric referral code like KS-AB12CD */
function generateCode(name: string): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const initials = name.slice(0, 2).toUpperCase().replace(/[^A-Z]/g, "X").padEnd(2, "K");
    let suffix = "";
    for (let i = 0; i < 6; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
    return `KS${initials}${suffix}`;
}

export async function GET() {
    try {
        const session = await getAuthSession();
        if (!session?.user) return apiError("Authentication required", 401);

        const userId = session.user.id;

        // Fetch user with referral data
        let user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                referralCode: true,
                referralsMade: {
                    select: {
                        id: true,
                        isConverted: true,
                        convertedAt: true,
                        rewardPoints: true,
                        createdAt: true,
                        referred: { select: { name: true, createdAt: true } },
                    },
                    orderBy: { createdAt: "desc" },
                    take: 20,
                },
            },
        });

        if (!user) return apiError("User not found", 404);

        // Auto-generate referral code if the user doesn't have one yet
        let referralCode = user.referralCode;
        if (!referralCode) {
            // Retry on collision (extremely unlikely)
            for (let i = 0; i < 5; i++) {
                const candidate = generateCode(user.name);
                const existing = await prisma.user.findUnique({ where: { referralCode: candidate } });
                if (!existing) {
                    referralCode = candidate;
                    break;
                }
            }
            if (referralCode) {
                await prisma.user.update({ where: { id: userId }, data: { referralCode } });
            }
        }

        const totalReferred = user.referralsMade.length;
        const totalConverted = user.referralsMade.filter(r => r.isConverted).length;
        const totalPointsEarned = user.referralsMade.reduce((sum, r) => sum + r.rewardPoints, 0);

        return apiSuccess({
            referralCode,
            totalReferred,
            totalConverted,
            totalPointsEarned,
            referrals: user.referralsMade,
        });
    } catch (e) {
        return handlePrismaError(e);
    }
}
