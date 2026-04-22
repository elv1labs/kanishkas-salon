export const dynamic = "force-dynamic";
// app/api/loyalty/reject/route.ts
// Admin rejects a PENDING_APPROVAL loyalty transaction.
// A rejection note is REQUIRED — enforced at 400 if missing or empty.

import { NextRequest } from "next/server";
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiNotFound } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const RejectSchema = z.object({
  transactionId: z.string().min(1, "transactionId is required"),
  note:          z.string().min(10, "Rejection note is required (minimum 10 characters)").max(500),
});

const APPROVER_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.OWNER];

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return apiUnauthorized();
    }
    if (!APPROVER_ROLES.includes(session.user.role as UserRole)) {
      return apiForbidden("Only Admin or Owner can reject");
    }

    const body = await req.json();
    const parsed = RejectSchema.safeParse(body);
    if (!parsed.success) {
      // Surface the note validation error clearly to the UI
      const noteError = parsed.error.flatten().fieldErrors.note?.[0];
      return apiError(noteError ?? "Validation failed", 400, parsed.error.flatten());
    }

    const { transactionId, note } = parsed.data;

    // 1. Fetch transaction and verify it's still pending
    const tx = await prisma.loyaltyTransaction.findUnique({
      where: { id: transactionId },
      include: { loyaltyAccount: { select: { userId: true } } },
    });

    if (!tx) {
      return apiNotFound("Transaction not found");
    }
    if (tx.status !== "PENDING_APPROVAL") {
      return apiError(`Transaction is already ${tx.status} — cannot reject`, 409);
    }

    const now = new Date();

    // 2. Mark as REJECTED — no points change (they were never credited)
    const updatedTx = await prisma.loyaltyTransaction.update({
      where: { id: transactionId },
      data: {
        status:     "REJECTED",
        approvedBy: session.user.id,
        approvedAt: now,
        note,
      },
    });

    // 3. Notify the client that the points were not awarded
    await prisma.notification.create({
      data: {
        userId:    tx.loyaltyAccount.userId,
        type:      "LOYALTY_POINTS",
        title:     "Loyalty Points Not Credited",
        message:   `Your loyalty points for a recent visit were not credited. Reason: ${note}`,
        actionUrl: "/dashboard/client/loyalty",
      },
    });

    // 4. Activity log
    await prisma.activityLog.create({
      data: {
        userId:   session.user.id,
        action:   "REJECT_LOYALTY",
        entity:   "LoyaltyTransaction",
        entityId: transactionId,
        details:  { points: tx.points, note, clientUserId: tx.loyaltyAccount.userId },
      },
    });

    return apiSuccess({
      data: { transactionId, status: "REJECTED", note },
    });
  } catch (error) {
    console.error("[POST /api/loyalty/reject]", error);
    return apiError("Internal server error", 500);
  }
}
