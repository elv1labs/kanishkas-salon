export const dynamic = "force-dynamic";
// app/api/academy/enroll/route.ts
// POST — client submits an enrollment request for a course

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

const EnrollSchema = z.object({
    courseId: z.string().cuid("Invalid course ID"),
    note: z.string().max(300, "Note must be 300 characters or fewer").optional(),
});

export async function POST(req: NextRequest) {
    try {
        const session = await getAuthSession();
        const authError = await requireActiveSession(session);
        if (authError) return authError;

        const { data: body, error: bodyError } = await parseJsonBody(req);
        if (bodyError) return bodyError;

        const parsed = EnrollSchema.safeParse(body);
        if (!parsed.success) {
            return apiError("Validation failed", 400, parsed.error.flatten());
        }

        const { courseId, note } = parsed.data;
        const userId = session!.user.id;

        // 1. Course must exist and be active
        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (!course) return apiError("Course not found", 404);
        if (!course.isActive) return apiError("This course is not currently accepting enrollments", 400);

        // 2. Duplicate check — no existing SUBMITTED or CONFIRMED enrollment
        const existing = await prisma.courseEnrollment.findFirst({
            where: {
                userId,
                courseId,
                status: { in: ["SUBMITTED", "CONFIRMED"] },
            },
        });
        if (existing) {
            return apiError(
                existing.status === "SUBMITTED"
                    ? "You already have a pending enrollment for this course"
                    : "You are already confirmed for this course",
                409
            );
        }

        // 3. Get user profile for studentName / phone / email
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, email: true, phone: true },
        });

        // 4. Create enrollment
        const enrollment = await prisma.courseEnrollment.create({
            data: {
                courseId,
                userId,
                studentName: user!.name,
                phone: user!.phone ?? "",
                email: user!.email,
                status: "SUBMITTED",
                paymentStatus: "PENDING",
                note: note ?? null,
            },
        });

        // 5. Notify admin via internal Notification model
        const admins = await prisma.user.findMany({
            where: { role: { in: ["ADMIN", "OWNER"] }, isActive: true },
            select: { id: true },
        });

        if (admins.length > 0) {
            await prisma.notification.createMany({
                data: admins.map((admin) => ({
                    userId: admin.id,
                    type: "SYSTEM" as const,
                    title: "New Academy Enrollment Request",
                    message: `${user!.name} has submitted an enrollment request for "${course.name}".`,
                    actionUrl: "/admin/academy/enrollments",
                    metadata: { enrollmentId: enrollment.id, courseId, studentName: user!.name },
                })),
            });
        }

        // 6. Activity log
        await prisma.activityLog.create({
            data: {
                userId,
                action: "CREATE",
                entity: "CourseEnrollment",
                entityId: enrollment.id,
                details: { courseId, courseName: course.name, status: "SUBMITTED" },
            },
        });

        return apiSuccess({ enrollment, message: "Enrollment request submitted successfully" }, 201);
    } catch (e) {
        return handlePrismaError(e);
    }
}
