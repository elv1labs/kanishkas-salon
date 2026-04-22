export const dynamic = "force-dynamic";
// app/api/loyalty/balance/route.ts
// Lightweight endpoint — returns only points balance for a given userId.
// Used by receptionist UI to show available points before redemption.
//
// Auth: RECEPTIONIST | ADMIN | OWNER (staff only)
// GET  /api/loyalty/balance?userId=<cuid>
// Returns: { success: true, data: { userId, totalPoints, worthRupees } }

import { NextRequest }     from "next/server";
import { prisma }          from "@/lib/prisma";
import { getAuthSession }  from "@/lib/auth";
import { UserRole }        from "@prisma/client";
import { LOYALTY_POINT_VALUE_INR } from "@/lib/constants";
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from "@/lib/api-utils";

const ALLOWED_ROLES: UserRole[] = [UserRole.RECEPTIONIST, UserRole.ADMIN, UserRole.OWNER];

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return apiUnauthorized();
    }
    if (!ALLOWED_ROLES.includes(session.user.role as UserRole)) {
      return apiForbidden();
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return apiError("userId is required", 400);
    }

    const account = await prisma.loyaltyAccount.findUnique({
      where:  { userId },
      select: { totalPoints: true },
    });

    const totalPoints = account?.totalPoints ?? 0;

    return apiSuccess({
      data: {
        userId,
        totalPoints,
        worthRupees: Math.round(totalPoints * LOYALTY_POINT_VALUE_INR * 100) / 100,
      },
    });
  } catch (error) {
    console.error("[GET /api/loyalty/balance]", error);
    return apiError("Internal server error", 500);
  }
}
