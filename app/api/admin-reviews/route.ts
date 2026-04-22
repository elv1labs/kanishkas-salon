export const dynamic = "force-dynamic";
// app/api/admin-reviews/route.ts
// Admin-only endpoint to list ALL reviews (published + pending) with status filter

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { apiSuccess, apiError, handlePrismaError } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
    try {
        const session = await getAuthSession();
        if (!session?.user) return apiError("Authentication required", 401);

        const adminRoles: UserRole[] = [UserRole.ADMIN, UserRole.OWNER];
        if (!adminRoles.includes(session.user.role as UserRole)) {
            return apiError("Admin access required", 403);
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status") ?? "ALL";
        const limitParam = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
        const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
        const skip = (page - 1) * limitParam;

        const where: any = {};

        if (status === "PENDING") {
            where.isPublished = false;
            where.isApproved  = false;
        } else if (status === "APPROVED") {
            where.isApproved  = true;
            where.isPublished = true;
        } else if (status === "REJECTED") {
            where.isApproved  = false;
            where.isPublished = false;
            // To distinguish rejected from never-moderated, we can't easily tell without a field
            // For now return all unpublished (pending or rejected look the same)
        }

        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limitParam,
                select: {
                    id: true,
                    rating: true,
                    title: true,
                    comment: true,
                    isPublished: true,
                    isApproved: true,
                    createdAt: true,
                    client: { select: { id: true, name: true } },
                    product: { select: { id: true, name: true, slug: true } },
                    service: { select: { id: true, name: true, slug: true } },
                },
            }),
            prisma.review.count({ where }),
        ]);

        return apiSuccess({
            reviews,
            total,
            pagination: { page, limit: limitParam, total, pages: Math.ceil(total / limitParam) },
        });
    } catch (error) {
        return handlePrismaError(error, "GET /api/admin-reviews");
    }
}
