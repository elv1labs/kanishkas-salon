export const dynamic = "force-dynamic";
// app/api/services/[id]/route.ts
// Individual service — GET detail, PATCH update, DELETE (hard-delete)

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { ServiceCategory } from "@prisma/client";
import { z } from "zod";
import slugify from "slugify";
import {
  apiSuccess,
  apiError,
  apiNotFound,
  parseJsonBody,
  handlePrismaError,
  requireActiveSession,
  requirePermission,
} from "@/lib/api-utils";

const UpdateServiceSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  shortDesc: z.string().max(300).optional().nullable(),
  categoryId: z.string().optional(),
  category: z.nativeEnum(ServiceCategory).optional(),
  price: z.number().positive().optional(),
  priceMax: z.number().positive().optional().nullable(),
  duration: z.number().int().positive().max(480).optional(),
  imageUrl: z.string().url().optional().nullable(),
  gallery: z.array(z.string().url()).max(20).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  requiresDeposit: z.boolean().optional(),
  depositAmount: z.number().positive().optional().nullable(),
  staffRequired: z.array(z.string()).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  seoTitle: z.string().max(60).optional().nullable(),
  seoDescription: z.string().max(160).optional().nullable(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
});

// Shared select shape
const SERVICE_SELECT = {
  id: true,
  name: true,
  slug: true,
  shortDesc: true,
  description: true,
  category: true,
  categoryId: true,
  price: true,
  priceMax: true,
  duration: true,
  imageUrl: true,
  gallery: true,
  isFeatured: true,
  isPopular: true,
  isActive: true,
  sortOrder: true,
  tags: true,
  seoTitle: true,
  seoDescription: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { appointments: true } },
} as const;

type RouteContext = { params: Promise<{ id: string }> };

// ---- GET: Single service detail ----
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const service = await prisma.service.findUnique({
      where: { id },
      select: SERVICE_SELECT,
    });

    if (!service) {
      return apiNotFound("Service not found");
    }

    return apiSuccess({ service });
  } catch (error) {
    return handlePrismaError(error, "GET /api/services/[id]");
  }
}

// ---- PATCH: Update service (admin/owner only) ----
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

    const parsed = UpdateServiceSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    // Verify service exists
    const existing = await prisma.service.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
    if (!existing) {
      return apiNotFound("Service not found");
    }

    const updateData = { ...parsed.data } as Record<string, any>;

    // If name changed, regenerate slug
    if (updateData.name) {
      let slug = slugify(updateData.name, { lower: true, strict: true });
      const slugConflict = await prisma.service.findFirst({
        where: { slug, id: { not: id } },
      });
      if (slugConflict) slug = `${slug}-${Date.now()}`;
      updateData.slug = slug;
    }

    const service = await prisma.service.update({
      where: { id },
      data: updateData,
      select: SERVICE_SELECT,
    });

    await prisma.activityLog.create({
      data: {
        userId: session!.user.id,
        action: "UPDATE_SERVICE",
        entity: "Service",
        entityId: id,
        details: { fields: Object.keys(parsed.data) },
      },
    });

    return apiSuccess({ service });
  } catch (error) {
    return handlePrismaError(error, "PATCH /api/services/[id]");
  }
}

// ---- DELETE: Hard-delete service (admin/owner only) ----
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await getAuthSession();
    const authError = await requireActiveSession(session);
    if (authError) return authError;

    const permError = await requirePermission(session, "manageServices");
    if (permError) return permError;

    const { id } = await context.params;

    // Check the service exists and count related records
    const existing = await prisma.service.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            appointments: true,
            reviews: true,
            bundleItems: true,
            waitlistEntries: true,
          },
        },
      },
    });
    if (!existing) {
      return apiNotFound("Service not found");
    }

    const { appointments, reviews, bundleItems, waitlistEntries } = existing._count;
    if (appointments > 0 || reviews > 0 || bundleItems > 0 || waitlistEntries > 0) {
      const refs = [
        appointments > 0 && `${appointments} appointment(s)`,
        reviews > 0 && `${reviews} review(s)`,
        bundleItems > 0 && `${bundleItems} bundle(s)`,
        waitlistEntries > 0 && `${waitlistEntries} waitlist entry/entries`,
      ].filter(Boolean).join(", ");
      return apiError(
        `Cannot delete "${existing.name}" because it has linked records: ${refs}. Deactivate it instead.`,
        409,
      );
    }

    await prisma.service.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        userId: session!.user.id,
        action: "DELETE_SERVICE",
        entity: "Service",
        entityId: id,
        details: { name: existing.name },
      },
    });

    return apiSuccess({ success: true, message: `"${existing.name}" permanently deleted` });
  } catch (error) {
    return handlePrismaError(error, "DELETE /api/services/[id]");
  }
}
