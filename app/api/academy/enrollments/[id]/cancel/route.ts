export const dynamic = "force-dynamic";
// app/api/academy/enrollments/[id]/cancel/route.ts
// PATCH — admin cancels an enrollment (requires a reason, min 10 chars)

import { NextRequest } from "next/server";
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiNotFound } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const CancelSchema = z.object({
    reason: z.string().min(10, "Cancellation reason must be at least 10 characters").max(500),
});

const STAFF_ROLES: readonly UserRole[] = [UserRole.ADMIN, UserRole.OWNER, UserRole.RECEPTIONIST];

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getAuthSession();
        if (!session?.user) {
            return apiUnauthorized();
        }
        if (!STAFF_ROLES.includes(session.user.role as UserRole)) {
            return apiForbidden();
        }

        const body = await req.json();
        const parsed = CancelSchema.safeParse(body);
        if (!parsed.success) {
            return apiError("Validation failed", 400, parsed.error.flatten());
        }

        const enrollment = await prisma.courseEnrollment.findUnique({
            where: { id: params.id },
            include: { course: { select: { name: true } } },
        });

        if (!enrollment) {
            return apiNotFound("Enrollment not found");
        }
        if (enrollment.status === "CANCELLED") {
            return apiError("Enrollment is already cancelled", 409);
        }

        const updated = await prisma.courseEnrollment.update({
            where: { id: params.id },
            data: {
                status: "CANCELLED",
                notes: parsed.data.reason,
            },
        });

        // Notify the client
        if (enrollment.userId) {
            await prisma.notification.create({
                data: {
                    userId: enrollment.userId,
                    type: "SYSTEM",
                    title: "Enrollment Cancelled",
                    message: `Your enrollment for "${enrollment.course.name}" has been cancelled. Reason: ${parsed.data.reason}`,
                    actionUrl: "/academy",
                    metadata: { enrollmentId: enrollment.id },
                },
            });
        }

        await prisma.activityLog.create({
            data: {
                userId: session.user.id,
                action: "UPDATE",
                entity: "CourseEnrollment",
                entityId: enrollment.id,
                details: { status: "CANCELLED", reason: parsed.data.reason },
            },
        });

        return apiSuccess({ enrollment: updated });
    } catch (error: any) {
        console.error("[PATCH /api/academy/enrollments/[id]/cancel]", error);
        return apiError("Internal server error", 500);
    }
}
