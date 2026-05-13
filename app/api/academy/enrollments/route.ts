export const dynamic = "force-dynamic";
// app/api/academy/enrollments/route.ts
// Admin CRUD for CourseEnrollment
// GET    — list enrollments (filterable by courseId, status, search)
// POST   — admin manually enrols a student
// PATCH  — update enrollment status
// DELETE — drop a student (?enrollmentId=...)

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { z } from "zod";
import {
    apiSuccess,
    apiError,
    parseJsonBody,
    requireActiveSession,
    validatePagination,
    buildPaginationMeta,
    handlePrismaError,
} from "@/lib/api-utils";

const STAFF_ROLES = ["ADMIN", "OWNER", "RECEPTIONIST"];

function requireStaff(role: string) {
    if (!STAFF_ROLES.includes(role)) return apiError("Forbidden", 403);
    return null;
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
    try {
        const session = await getAuthSession();
        const authError = await requireActiveSession(session);
        if (authError) return authError;

        const role = session!.user.role as string;
        const forbidden = requireStaff(role);
        if (forbidden) return forbidden;

        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = validatePagination(searchParams, { page: 1, limit: 100, maxLimit: 200 });

        const statusFilter  = searchParams.get("status");
        const courseId      = searchParams.get("courseId");
        const paymentStatus = searchParams.get("paymentStatus");
        const search        = searchParams.get("search");

        const where: Record<string, unknown> = {};
        if (statusFilter)  where.status        = statusFilter;
        if (courseId)      where.courseId       = courseId;
        if (paymentStatus) where.paymentStatus  = paymentStatus;
        if (search) {
            where.OR = [
                { studentName: { contains: search, mode: "insensitive" } },
                { email:       { contains: search, mode: "insensitive" } },
            ];
        }

        const [enrollments, total] = await Promise.all([
            prisma.courseEnrollment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    course: { select: { id: true, name: true, price: true } },
                },
            }),
            prisma.courseEnrollment.count({ where }),
        ]);

        return apiSuccess({ enrollments, pagination: buildPaginationMeta(page, limit, total) });
    } catch (e) {
        return handlePrismaError(e);
    }
}

// ── POST — admin enrols a student ─────────────────────────────────────────────

const EnrolSchema = z.object({
    courseId:    z.string().cuid(),
    studentName: z.string().min(2).max(100),
    phone:       z.string().min(5).max(20),
    email:       z.string().email(),
    notes:       z.string().max(500).optional(),
    startDate:   z.string().optional(),
});

export async function POST(req: NextRequest) {
    try {
        const session = await getAuthSession();
        const authError = await requireActiveSession(session);
        if (authError) return authError;

        const role = session!.user.role as string;
        const forbidden = requireStaff(role);
        if (forbidden) return forbidden;

        const { data: body, error: bodyError } = await parseJsonBody(req);
        if (bodyError) return bodyError;

        const parsed = EnrolSchema.safeParse(body);
        if (!parsed.success) return apiError("Validation failed", 400, parsed.error.flatten());

        const { courseId, studentName, phone, email, notes, startDate } = parsed.data;

        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (!course) return apiError("Course not found", 404);

        const enrollment = await prisma.courseEnrollment.create({
            data: {
                courseId,
                studentName,
                phone,
                email,
                notes: notes ?? null,
                startDate: startDate ? new Date(startDate) : null,
                status: "ENROLLED",
                confirmedBy: session!.user.id,
                confirmedAt: new Date(),
            },
        });

        await prisma.activityLog.create({
            data: {
                userId:   session!.user.id,
                action:   "ENROL_STUDENT",
                entity:   "CourseEnrollment",
                entityId: enrollment.id,
                details:  { courseId, studentName },
            },
        });

        return apiSuccess({ enrollment }, 201);
    } catch (e) {
        return handlePrismaError(e);
    }
}

// ── PATCH — update enrollment status ─────────────────────────────────────────

const PatchSchema = z.object({
    enrollmentId: z.string().cuid(),
    status: z.enum(["ENQUIRY", "ENROLLED", "ACTIVE", "COMPLETED", "DROPPED"]),
});

export async function PATCH(req: NextRequest) {
    try {
        const session = await getAuthSession();
        const authError = await requireActiveSession(session);
        if (authError) return authError;

        const role = session!.user.role as string;
        const forbidden = requireStaff(role);
        if (forbidden) return forbidden;

        const { data: body, error: bodyError } = await parseJsonBody(req);
        if (bodyError) return bodyError;

        const parsed = PatchSchema.safeParse(body);
        if (!parsed.success) return apiError("Validation failed", 400, parsed.error.flatten());

        const { enrollmentId, status } = parsed.data;

        const enrollment = await prisma.courseEnrollment.update({
            where: { id: enrollmentId },
            data:  { status },
        });

        return apiSuccess({ enrollment });
    } catch (e) {
        return handlePrismaError(e);
    }
}

// ── DELETE — drop a student ───────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
    try {
        const session = await getAuthSession();
        const authError = await requireActiveSession(session);
        if (authError) return authError;

        const role = session!.user.role as string;
        const forbidden = requireStaff(role);
        if (forbidden) return forbidden;

        const { searchParams } = new URL(req.url);
        const enrollmentId = searchParams.get("enrollmentId");
        if (!enrollmentId) return apiError("enrollmentId is required", 400);

        // Soft-drop rather than hard-delete
        await prisma.courseEnrollment.update({
            where: { id: enrollmentId },
            data:  { status: "DROPPED" },
        });

        return apiSuccess({ message: "Student dropped from course" });
    } catch (e) {
        return handlePrismaError(e);
    }
}
