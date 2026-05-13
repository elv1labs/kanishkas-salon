export const dynamic = "force-dynamic";
// app/api/academy/courses/[id]/route.ts
// Single course — GET detail, PATCH update, DELETE (soft-delete)
// Mirrors /api/products/[id]/route.ts patterns

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { z } from "zod";
import slugify from "slugify";
import {
  apiSuccess,
  apiError,
  apiNotFound,
  parseJsonBody,
  requireActiveSession,
  handlePrismaError,
  requirePermission,
} from "@/lib/api-utils";

const COURSE_DETAIL_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  duration: true,
  price: true,
  maxStudents: true,
  schedule: true,
  curriculum: true,
  prerequisites: true,
  certificate: true,
  imageUrl: true,
  isActive: true,
  isFeatured: true,
  seoTitle: true,
  seoDescription: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { enrollments: true } },
} as const;

type RouteContext = { params: Promise<{ id: string }> };

// ── GET — single course detail ──────────────────────────────────────────────

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const course = await prisma.course.findUnique({
      where: { id },
      select: {
        ...COURSE_DETAIL_SELECT,
        enrollments: {
          select: {
            id: true,
            studentName: true,
            status: true,
            paymentStatus: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!course) {
      return apiNotFound("Course not found");
    }

    return apiSuccess({ course });
  } catch (error) {
    return handlePrismaError(error, "GET /api/academy/courses/[id]");
  }
}

// ── PATCH — update course ───────────────────────────────────────────────────

const UpdateCourseSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  duration: z.string().min(1).max(100).optional(),
  price: z.number().positive().optional(),
  maxStudents: z.number().int().min(1).max(500).optional(),
  schedule: z.string().max(500).optional().nullable(),
  curriculum: z.any().optional().nullable(),
  prerequisites: z.string().max(2000).optional().nullable(),
  certificate: z.boolean().optional(),
  imageUrl: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  seoTitle: z.string().max(60).optional().nullable(),
  seoDescription: z.string().max(160).optional().nullable(),
});

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const session = await getAuthSession();
    const authError = await requireActiveSession(session);
    if (authError) return authError;

    const permError = await requirePermission(session, "manageServices");
    if (permError) return permError;

    const { id } = await context.params;

    const { data: body, error: jsonError } = await parseJsonBody(req);
    if (jsonError) return jsonError;

    const parsed = UpdateCourseSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    // Verify course exists
    const existing = await prisma.course.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
    if (!existing) {
      return apiNotFound("Course not found");
    }

    const updateData = { ...parsed.data } as Record<string, unknown>;

    // If name changed, regenerate slug
    if (updateData.name && typeof updateData.name === "string") {
      let slug = slugify(updateData.name, { lower: true, strict: true });
      const slugConflict = await prisma.course.findFirst({
        where: { slug, id: { not: id } },
      });
      if (slugConflict) slug = `${slug}-${Date.now()}`;
      updateData.slug = slug;
    }

    const course = await prisma.course.update({
      where: { id },
      data: updateData,
      select: COURSE_DETAIL_SELECT,
    });

    await prisma.activityLog.create({
      data: {
        userId: session!.user.id,
        action: "UPDATE_COURSE",
        entity: "Course",
        entityId: id,
        details: { fields: Object.keys(parsed.data) },
      },
    });

    return apiSuccess({ course });
  } catch (error) {
    return handlePrismaError(error, "PATCH /api/academy/courses/[id]");
  }
}

// ── DELETE — soft-delete (deactivate) or hard-delete if no enrollments ─────

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await getAuthSession();
    const authError = await requireActiveSession(session);
    if (authError) return authError;

    const permError = await requirePermission(session, "manageServices");
    if (permError) return permError;

    const { id } = await context.params;

    const existing = await prisma.course.findUnique({
      where: { id },
      select: { id: true, name: true, _count: { select: { enrollments: true } } },
    });
    if (!existing) {
      return apiNotFound("Course not found");
    }

    if (existing._count.enrollments > 0) {
      // Soft-delete: deactivate the course
      await prisma.course.update({
        where: { id },
        data: { isActive: false },
      });
    } else {
      // No enrollments — safe to hard-delete
      await prisma.course.delete({ where: { id } });
    }

    await prisma.activityLog.create({
      data: {
        userId: session!.user.id,
        action: "DELETE_COURSE",
        entity: "Course",
        entityId: id,
        details: {
          name: existing.name,
          hardDelete: existing._count.enrollments === 0,
        },
      },
    });

    return apiSuccess({
      success: true,
      message: existing._count.enrollments > 0
        ? `"${existing.name}" deactivated (has ${existing._count.enrollments} enrollments)`
        : `"${existing.name}" permanently deleted`,
    });
  } catch (error) {
    return handlePrismaError(error, "DELETE /api/academy/courses/[id]");
  }
}
