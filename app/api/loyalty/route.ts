export const dynamic = "force-dynamic";
// app/api/loyalty/route.ts
// Loyalty program API — fetch account & transactions, award points

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, hasPermission } from "@/lib/auth";
import { UserRole, LoyaltyTransactionType } from "@prisma/client";
import { z } from "zod";
import {
    apiSuccess,
    apiError,
    parseJsonBody,
    validatePagination,
    handlePrismaError,
    requireActiveSession,
} from "@/lib/api-utils";

// ---- Validation schemas ----
const AwardPointsSchema = z.object({
    userId: z.string().cuid("Invalid user ID"),
    points: z.number().int().positive("Points must be a positive integer"),
    type: z.nativeEnum(LoyaltyTransactionType, { errorMap: () => ({ message: "Invalid transaction type" }) }),
    description: z.string().min(1, "Description is required").max(500, "Description is too long"),
    appointmentId: z.string().cuid("Invalid appointment ID").optional(),
    orderId: z.string().cuid("Invalid order ID").optional(),
});

// ---- GET: Fetch user's loyalty account + recent transactions ----
export async function GET(req: NextRequest) {
    try {
        const session = await getAuthSession();
        const authError = await requireActiveSession(session);
        if (authError) return authError;

        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = validatePagination(searchParams, { page: 1, limit: 10, maxLimit: 50 });

        // Regular clients can only see their own account
        // Staff can view any account
        const userId = hasPermission(session!.user.role as UserRole, "viewClients")
            ? searchParams.get("userId") || session!.user.id
            : session!.user.id;

        const [account, transactions] = await Promise.all([
            prisma.loyaltyAccount.findUnique({
                where: { userId },
                include: {
                    user: { select: { name: true, email: true } },
                },
            }),
            prisma.loyaltyTransaction.findMany({
                where: { loyaltyAccount: { userId } },
                include: {
                    appointment: { select: { id: true, bookingRef: true, service: { select: { name: true } } } },
                    order: { select: { id: true, orderRef: true } },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
        ]);

        if (!account) {
            return apiError("Loyalty account not found", 404);
        }

        return apiSuccess({
            account,
            transactions,
            pagination: { page, limit, total: account.totalPoints, pages: Math.ceil(account.totalPoints / limit) },
        });
    } catch (error) {
        return handlePrismaError(error, "GET /api/loyalty");
    }
}

// ---- POST: Award loyalty points ----
export async function POST(req: NextRequest) {
    const { data: body, error: jsonError } = await parseJsonBody(req);
    if (jsonError) return jsonError;

    try {
        const session = await getAuthSession();
        const authError = await requireActiveSession(session);
        if (authError) return authError;

        // Only staff can award points
        if (!hasPermission(session!.user.role as UserRole, "manageOrders")) {
            return apiError("You don't have permission to award loyalty points", 403);
        }

        const parsed = AwardPointsSchema.safeParse(body);
        if (!parsed.success) {
            return apiError("Validation failed", 400, parsed.error.flatten());
        }

        const { userId, points, type, description, appointmentId, orderId } = parsed.data;

        // Verify user exists
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return apiError("User not found", 404);
        }

        // Verify linked entities exist
        if (appointmentId) {
            const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
            if (!appointment) {
                return apiError("Appointment not found", 404);
            }
        }

        if (orderId) {
            const order = await prisma.order.findUnique({ where: { id: orderId } });
            if (!order) {
                return apiError("Order not found", 404);
            }
        }

        // Create or update loyalty account and transaction atomically
        const [account, transaction] = await prisma.$transaction(async (tx) => {
            // Create/update loyalty account
            let account = await tx.loyaltyAccount.findUnique({ where: { userId } });
            if (!account) {
                account = await tx.loyaltyAccount.create({
                    data: { userId, totalPoints: points, lifetimeEarned: points },
                });
            } else {
                account = await tx.loyaltyAccount.update({
                    where: { userId },
                    data: {
                        totalPoints: { increment: points },
                        lifetimeEarned: { increment: points },
                    },
                });
            }

            // Create transaction record
            const transaction = await tx.loyaltyTransaction.create({
                data: {
                    loyaltyAccountId: account.id,
                    type,
                    points,
                    description,
                    appointmentId: appointmentId || null,
                    orderId: orderId || null,
                },
            });

            return [account, transaction];
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: session!.user.id,
                action: "AWARD_LOYALTY_POINTS",
                entity: "LoyaltyTransaction",
                entityId: transaction.id,
                details: { points, type, userId },
            },
        });

        return apiSuccess({ account, transaction }, 201);
    } catch (error) {
        return handlePrismaError(error, "POST /api/loyalty");
    }
}
