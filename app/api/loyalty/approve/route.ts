export const dynamic = "force-dynamic";
// app/api/loyalty/approve/route.ts
// Admin approves a PENDING_APPROVAL loyalty transaction.
// Points are credited to the wallet atomically in the same transaction.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const ApproveSchema = z.object({
  transactionId: z.string().min(1, "transactionId is required"),
  note:          z.string().max(500).optional(),
});

const APPROVER_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.OWNER];

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorised" }, { status: 401 });
    }
    if (!APPROVER_ROLES.includes(session.user.role as UserRole)) {
      return NextResponse.json({ success: false, error: "Forbidden — only Admin or Owner can approve" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = ApproveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { transactionId, note } = parsed.data;

    // 1. Fetch transaction and verify it's awaiting approval
    const tx = await prisma.loyaltyTransaction.findUnique({
      where: { id: transactionId },
      include: { loyaltyAccount: { select: { id: true, userId: true, totalPoints: true, tier: true } } },
    });

    if (!tx) {
      return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 });
    }
    if (tx.status !== "PENDING_APPROVAL") {
      return NextResponse.json(
        { success: false, error: `Transaction is already ${tx.status} — cannot approve again` },
        { status: 409 }
      );
    }

    const now = new Date();

    // 2. Approve the transaction AND credit points atomically
    const [updatedTx, updatedAccount] = await prisma.$transaction([
      prisma.loyaltyTransaction.update({
        where: { id: transactionId },
        data: {
          status:     "APPROVED",
          approvedBy: session.user.id,
          approvedAt: now,
          note:       note ?? null,
        },
      }),
      prisma.loyaltyAccount.update({
        where: { id: tx.loyaltyAccount.id },
        data: {
          totalPoints:    { increment: tx.points },
          lifetimeEarned: { increment: tx.points },
          updatedAt:      now,
        },
      }),
    ]);

    // 3. Recalculate tier after point update
    const newTotal = updatedAccount.totalPoints;
    const newTier =
      newTotal >= 10000 ? "PLATINUM" :
      newTotal >= 5000  ? "GOLD" :
      newTotal >= 1500  ? "SILVER" :
                          "BRONZE";

    if (newTier !== updatedAccount.tier) {
      await prisma.loyaltyAccount.update({
        where: { id: tx.loyaltyAccount.id },
        data: { tier: newTier, tierUpdatedAt: now },
      });
    }

    // 4. Notify the client
    await prisma.notification.create({
      data: {
        userId:    tx.loyaltyAccount.userId,
        type:      "LOYALTY_POINTS",
        title:     "Loyalty Points Credited",
        message:   `${tx.points} points have been added to your loyalty account. New balance: ${newTotal} points.`,
        actionUrl: "/dashboard/client/loyalty",
      },
    });

    // 5. Activity log
    await prisma.activityLog.create({
      data: {
        userId:   session.user.id,
        action:   "APPROVE_LOYALTY",
        entity:   "LoyaltyTransaction",
        entityId: transactionId,
        details:  { points: tx.points, newTotal, clientUserId: tx.loyaltyAccount.userId },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        transactionId,
        pointsCredited: tx.points,
        newTotal,
        newTier,
      },
    });
  } catch (error) {
    console.error("[POST /api/loyalty/approve]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
