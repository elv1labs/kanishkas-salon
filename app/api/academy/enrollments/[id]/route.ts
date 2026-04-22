export const dynamic = "force-dynamic";
// app/api/academy/enrollments/[id]/route.ts
// PATCH — confirm or cancel an enrollment (owner / admin / receptionist)

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { z } from "zod";
import {
    apiSuccess,
    apiError,
    parseJsonBody,
    requireActiveSession,
    handlePrismaError,
} from "@/lib/api-utils";

const UpdateSchema = z.object({
    action: z.enum(["confirm", "cancel"]),
    note: z.string().max(300).optional(),
});

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getAuthSession();
        const authError = await requireActiveSession(session);
        if (authError) return authError;

        const role = session!.user.role as string;
        if (!["ADMIN", "OWNER", "RECEPTIONIST"].includes(role)) {
            return apiError("Forbidden — staff only", 403);
        }

        const { data: body, error: bodyError } = await parseJsonBody(req);
        if (bodyError) return bodyError;

        const parsed = UpdateSchema.safeParse(body);
        if (!parsed.success) {
            return apiError("Validation failed", 400, parsed.error.flatten());
        }

        const { action, note } = parsed.data;
        const enrollmentId = params.id;

        const enrollment = await prisma.courseEnrollment.findUnique({
            where: { id: enrollmentId },
            include: { course: { select: { name: true } }, user: { select: { name: true } } },
        });

        if (!enrollment) return apiError("Enrollment not found", 404);

        if (action === "confirm" && enrollment.status === "ENROLLED") {
            return apiError("Enrollment is already enrolled", 400);
        }
        if (action === "cancel" && enrollment.status === "DROPPED") {
            return apiError("Enrollment is already dropped", 400);
        }

        const newStatus = action === "confirm" ? "ENROLLED" : "DROPPED";

        const updated = await prisma.courseEnrollment.update({
            where: { id: enrollmentId },
            data: {
                status: newStatus,
                ...(note ? { note } : {}),
            },
        });

        // Activity log
        await prisma.activityLog.create({
            data: {
                userId: session!.user.id,
                action: "UPDATE",
                entity: "CourseEnrollment",
                entityId: enrollmentId,
                details: {
                    newStatus,
                    courseName: enrollment.course.name,
                    studentName: enrollment.user?.name ?? enrollment.studentName,
                },
            },
        });

        // Notify student
        if (enrollment.userId) {
            await prisma.notification.create({
                data: {
                    userId: enrollment.userId,
                    type: "SYSTEM",
                    title: action === "confirm"
                        ? `Your enrollment in "${enrollment.course.name}" is confirmed! 🎓`
                        : `Your enrollment in "${enrollment.course.name}" was cancelled`,
                    message: action === "confirm"
                        ? "Our team will contact you shortly to arrange payment and schedule details."
                        : note ?? "Please contact us if you have questions.",
                    actionUrl: `/academy/${enrollment.courseId}`,
                },
            });
        }

        return apiSuccess({ enrollment: updated, message: `Enrollment ${action === "confirm" ? "enrolled" : "dropped"}` });
    } catch (e) {
        return handlePrismaError(e);
    }
}
