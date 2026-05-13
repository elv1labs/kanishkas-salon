export const dynamic = "force-dynamic";
// app/api/client/enrollments/route.ts
// GET — returns the current logged-in CLIENT's course enrollments

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import {
    apiSuccess,
    apiError,
    requireActiveSession,
    validatePagination,
    buildPaginationMeta,
    handlePrismaError,
} from "@/lib/api-utils";

export async function GET(req: NextRequest) {
    try {
        const session = await getAuthSession();
        const authError = await requireActiveSession(session);
        if (authError) return authError;

        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = validatePagination(searchParams, { page: 1, limit: 20, maxLimit: 50 });

        const [enrollments, total] = await Promise.all([
            prisma.courseEnrollment.findMany({
                where: { userId: session!.user.id },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
                select: {
                    id: true,
                    status: true,
                    paymentStatus: true,
                    paymentMethod: true,
                    paymentAmount: true,
                    paidAt: true,
                    notes: true,
                    createdAt: true,
                    course: {
                        select: {
                            id: true,
                            name: true,
                            duration: true,
                            price: true,
                            certificate: true,
                        },
                    },
                },
            }),
            prisma.courseEnrollment.count({ where: { userId: session!.user.id } }),
        ]);

        return apiSuccess({
            enrollments,
            total,
            pagination: buildPaginationMeta(page, limit, total),
        });
    } catch (error) {
        return handlePrismaError(error, "GET /api/client/enrollments");
    }
}
