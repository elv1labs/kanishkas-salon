export const dynamic = "force-dynamic";
// app/api/academy/enrollments/[id]/confirm/route.ts
// PATCH — admin confirms a SUBMITTED enrollment

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import {
    apiSuccess,
    apiError,
    requireActiveSession,
    handlePrismaError,
} from "@/lib/api-utils";

export async function PATCH(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getAuthSession();
        const authError = await requireActiveSession(session);
        if (authError) return authError;

        if (session!.user.role !== "ADMIN") {
            return apiError("Forbidden", 403);
        }

        const enrollment = await prisma.courseEnrollment.findUnique({
            where: { id: params.id },
            include: { course: { select: { name: true } }, user: { select: { id: true, name: true } } },
        });

        if (!enrollment) return apiError("Enrollment not found", 404);
        if (enrollment.status !== "SUBMITTED") {
            return apiError(`Cannot confirm an enrollment with status "${enrollment.status}"`, 400);
        }

        const updated = await prisma.courseEnrollment.update({
            where: { id: params.id },
            data: {
                status: "CONFIRMED",
                confirmedBy: session!.user.id,
                confirmedAt: new Date(),
            },
        });

        // Notify client if they have a userId
        if (enrollment.userId) {
            await prisma.notification.create({
                data: {
                    userId: enrollment.userId,
                    type: "SYSTEM",
                    title: "Enrollment Confirmed!",
                    message: `Your enrollment for "${enrollment.course.name}" has been confirmed. Our team will contact you to arrange payment and schedule your start date.`,
                    actionUrl: "/dashboard/client/academy",
                    metadata: { enrollmentId: enrollment.id, courseId: enrollment.courseId },
                },
            });
        }

        await prisma.activityLog.create({
            data: {
                userId: session!.user.id,
                action: "UPDATE",
                entity: "CourseEnrollment",
                entityId: enrollment.id,
                details: { status: "CONFIRMED", studentName: enrollment.studentName, courseName: enrollment.course.name },
            },
        });

        return apiSuccess(updated, 200);
    } catch (e) {
        return handlePrismaError(e);
    }
}
