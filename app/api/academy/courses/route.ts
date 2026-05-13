export const dynamic = "force-dynamic";
// app/api/academy/courses/route.ts
// Course management — GET list, POST create
// Mirrors /api/products/route.ts patterns

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import slugify from "slugify";
import {
  apiSuccess,
  apiError,
  parseJsonBody,
  requireActiveSession,
  validatePagination,
  buildPaginationMeta,
  handlePrismaError,
  requirePermission,
} from "@/lib/api-utils";

const STAFF_ROLES: readonly UserRole[] = [UserRole.ADMIN, UserRole.OWNER, UserRole.RECEPTIONIST];

const COURSE_SELECT = {
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

// ── GET — list courses ──────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    const authError = await requireActiveSession(session);
    if (authError) return authError;

    const role = session!.user.role as UserRole;
    const isStaff = STAFF_ROLES.includes(role);

    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = validatePagination(searchParams, { page: 1, limit: 50, maxLimit: 100 });

    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    // Non-staff can only see active courses
    if (!isStaff) {
      where.isActive = true;
    } else if (isActive !== null) {
      where.isActive = isActive === "true";
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: COURSE_SELECT,
      }),
      prisma.course.count({ where }),
    ]);

    return apiSuccess({
      courses,
      pagination: buildPaginationMeta(page, limit, total),
    });
  } catch (e) {
    return handlePrismaError(e, "GET /api/academy/courses");
  }
}

// ── POST — create course ────────────────────────────────────────────────────

const CreateCourseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(200),
  description: z.string().max(5000).optional().nullable(),
  duration: z.string().min(1, "Duration is required").max(100),
  price: z.number().positive("Price must be positive"),
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

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    const authError = await requireActiveSession(session);
    if (authError) return authError;

    const permError = await requirePermission(session, "manageServices");
    if (permError) return permError;

    const { data: body, error: jsonError } = await parseJsonBody(req);
    if (jsonError) return jsonError;

    const parsed = CreateCourseSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    const { name, ...rest } = parsed.data;

    // Generate unique slug
    let slug = slugify(name, { lower: true, strict: true });
    const slugConflict = await prisma.course.findFirst({ where: { slug } });
    if (slugConflict) slug = `${slug}-${Date.now()}`;

    const course = await prisma.course.create({
      data: {
        name,
        slug,
        description: rest.description ?? null,
        duration: rest.duration,
        price: rest.price,
        maxStudents: rest.maxStudents ?? 10,
        schedule: rest.schedule ?? null,
        curriculum: rest.curriculum ?? null,
        prerequisites: rest.prerequisites ?? null,
        certificate: rest.certificate ?? true,
        imageUrl: rest.imageUrl ?? null,
        isActive: rest.isActive ?? false, // draft by default
        isFeatured: rest.isFeatured ?? false,
        seoTitle: rest.seoTitle ?? null,
        seoDescription: rest.seoDescription ?? null,
      },
      select: COURSE_SELECT,
    });

    await prisma.activityLog.create({
      data: {
        userId: session!.user.id,
        action: "CREATE_COURSE",
        entity: "Course",
        entityId: course.id,
        details: { name, slug },
      },
    });

    return apiSuccess({ course }, 201);
  } catch (e) {
    return handlePrismaError(e, "POST /api/academy/courses");
  }
}
