export const dynamic = "force-dynamic";
// app/api/products/[id]/route.ts
// Individual product — GET detail, PATCH update, DELETE (soft-delete)

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { ProductCategory } from "@prisma/client";
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

const UpdateProductSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  shortDesc: z.string().max(300).optional().nullable(),
  category: z.nativeEnum(ProductCategory).optional(),
  brand: z.string().max(100).optional().nullable(),
  sku: z.string().max(50).optional().nullable(),
  price: z.number().positive().optional(),
  comparePrice: z.number().positive().optional().nullable(),
  costPrice: z.number().positive().optional().nullable(),
  stock: z.number().int().min(0).optional(),
  lowStockAlert: z.number().int().min(0).optional(),
  images: z.array(z.string().url()).max(10).optional(),
  thumbnailUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  ingredients: z.string().max(5000).optional().nullable(),
  howToUse: z.string().max(5000).optional().nullable(),
  seoTitle: z.string().max(60).optional().nullable(),
  seoDescription: z.string().max(160).optional().nullable(),
});

// Shared select shape
const PRODUCT_SELECT = {
  id: true,
  name: true,
  slug: true,
  shortDesc: true,
  description: true,
  category: true,
  brand: true,
  sku: true,
  price: true,
  comparePrice: true,
  costPrice: true,
  stock: true,
  lowStockAlert: true,
  images: true,
  thumbnailUrl: true,
  isActive: true,
  isFeatured: true,
  tags: true,
  ingredients: true,
  howToUse: true,
  seoTitle: true,
  seoDescription: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { reviews: true, orderItems: true } },
} as const;

type RouteContext = { params: Promise<{ id: string }> };

// ---- GET: Single product detail ----
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const product = await prisma.product.findUnique({
      where: { id },
      select: PRODUCT_SELECT,
    });

    if (!product) {
      return apiNotFound("Product not found");
    }

    return apiSuccess({ product });
  } catch (error) {
    return handlePrismaError(error, "GET /api/products/[id]");
  }
}

// ---- PATCH: Update product (admin/owner only) ----
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const session = await getAuthSession();
    const authError = await requireActiveSession(session);
    if (authError) return authError;

    const permError = await requirePermission(session, "manageProducts");
    if (permError) return permError;

    const { id } = await context.params;

    const { data: body, error: jsonError } = await parseJsonBody(req);
    if (jsonError) return jsonError;

    const parsed = UpdateProductSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    // Verify product exists
    const existing = await prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true, stock: true },
    });
    if (!existing) {
      return apiNotFound("Product not found");
    }

    const updateData = { ...parsed.data } as Record<string, any>;

    // If name changed, regenerate slug
    if (updateData.name) {
      let slug = slugify(updateData.name, { lower: true, strict: true });
      const slugConflict = await prisma.product.findFirst({
        where: { slug, id: { not: id } },
      });
      if (slugConflict) slug = `${slug}-${Date.now()}`;
      updateData.slug = slug;
    }

    // Log stock changes for audit trail
    const stockChanged = updateData.stock !== undefined && updateData.stock !== existing.stock;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      select: PRODUCT_SELECT,
    });

    await prisma.activityLog.create({
      data: {
        userId: session!.user.id,
        action: "UPDATE_PRODUCT",
        entity: "Product",
        entityId: id,
        details: {
          fields: Object.keys(parsed.data),
          ...(stockChanged ? { stockChange: { from: existing.stock, to: updateData.stock } } : {}),
        },
      },
    });

    return apiSuccess({ product });
  } catch (error) {
    return handlePrismaError(error, "PATCH /api/products/[id]");
  }
}

// ---- DELETE: Soft-delete product (admin/owner only) ----
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await getAuthSession();
    const authError = await requireActiveSession(session);
    if (authError) return authError;

    const permError = await requirePermission(session, "manageProducts");
    if (permError) return permError;

    const { id } = await context.params;

    const existing = await prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
    if (!existing) {
      return apiNotFound("Product not found");
    }

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    await prisma.activityLog.create({
      data: {
        userId: session!.user.id,
        action: "DELETE_PRODUCT",
        entity: "Product",
        entityId: id,
        details: { name: existing.name },
      },
    });

    return apiSuccess({ success: true, message: `${existing.name} deactivated` });
  } catch (error) {
    return handlePrismaError(error, "DELETE /api/products/[id]");
  }
}
