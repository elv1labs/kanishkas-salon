export const dynamic = "force-dynamic";
// app/api/loyalty/approve/bulk/route.ts
// Bulk-approves multiple PENDING_APPROVAL loyalty transactions.

import { NextRequest } from "next/server";
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, applyRateLimit } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const ApproveBulkSchema = z.object({
  transactionIds: z.array(z.string().min(1)).min(1, "At least one transaction ID is required").max(50),
  note: z.string().max(500).optional(),
});

const APPROVER_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.OWNER];

export async function POST(req: NextRequest) {
  const rlError = applyRateLimit(req, "loyalty:approve:bulk", { max: 5, windowMs: 60_000 });
  if (rlError) return rlError;
  try {
    const session = await getAuthSession();
    if (!session?.user) return apiUnauthorized();
    if (!APPROVER_ROLES.includes(session.user.role as UserRole)) {
      return apiForbidden("Only Admin or Owner can approve");
    }

    const body = await req.json();
    const parsed = ApproveBulkSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    const { transactionIds, note } = parsed.data;

    const pending = await prisma.loyaltyTransaction.findMany({
      where: { id: { in: transactionIds }, status: "PENDING_APPROVAL" },
      include: { loyaltyAccount: { select: { id: true, userId: true, totalPoints: true, tier: true } } },
      orderBy: { createdAt: "asc" },
    });

    if (pending.length === 0) {
      return apiError("No pending transactions found for the provided IDs", 404);
    }

    const alreadyHandled = transactionIds.length - pending.length;
    const results: { transactionId: string; status: string; points: number; newTotal?: number; error?: string }[] = [];
    const notifications: { userId: string; points: number; newTotal: number }[] = [];
    const now = new Date();

    for (const tx of pending) {
      try {
        const [, updatedAccount] = await prisma.$transaction([
          prisma.loyaltyTransaction.update({
            where: { id: tx.id },
            data: { status: "APPROVED", approvedBy: session.user.id, approvedAt: now, note: note ?? null },
          }),
          prisma.loyaltyAccount.update({
            where: { id: tx.loyaltyAccount.id },
            data: { totalPoints: { increment: tx.points }, lifetimeEarned: { increment: tx.points }, updatedAt: now },
          }),
        ]);

        const newTier =
          updatedAccount.totalPoints >= 10000 ? "PLATINUM" :
          updatedAccount.totalPoints >= 5000  ? "GOLD" :
          updatedAccount.totalPoints >= 1500  ? "SILVER" : "BRONZE";

        if (newTier !== updatedAccount.tier) {
          await prisma.loyaltyAccount.update({
            where: { id: tx.loyaltyAccount.id },
            data: { tier: newTier, tierUpdatedAt: now },
          });
        }

        await prisma.notification.create({
          data: {
            userId:    tx.loyaltyAccount.userId,
            type:      "LOYALTY_POINTS",
            title:     "Loyalty Points Credited",
            message:   `${tx.points} points have been added to your loyalty account. New balance: ${updatedAccount.totalPoints} points.`,
            actionUrl: "/dashboard/client/loyalty",
          },
        }).catch(() => {});

        await prisma.activityLog.create({
          data: {
            userId:   session.user.id,
            action:   "APPROVE_LOYALTY",
            entity:   "LoyaltyTransaction",
            entityId: tx.id,
            details:  { points: tx.points, newTotal: updatedAccount.totalPoints, clientUserId: tx.loyaltyAccount.userId, bulk: true },
          },
        }).catch(() => {});

        results.push({ transactionId: tx.id, status: "APPROVED", points: tx.points, newTotal: updatedAccount.totalPoints });
      } catch (err) {
        results.push({ transactionId: tx.id, status: "ERROR", points: tx.points, error: String(err) });
      }
    }

    return apiSuccess({
      data: {
        processed: results.length,
        skipped: alreadyHandled,
        results,
      },
    });
  } catch (error) {
    console.error("[POST /api/loyalty/approve/bulk]", error);
    return apiError("Internal server error", 500);
  }
}