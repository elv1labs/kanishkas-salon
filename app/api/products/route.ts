export const dynamic = "force-dynamic";
// app/api/products/route.ts
// Products API — public listing & admin management

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, hasPermission } from "@/lib/auth";
import { UserRole, ProductCategory } from "@prisma/client";
import { z } from "zod";
import slugify from "slugify";
import {
  apiSuccess,
  apiError,
  parseJsonBody,
  validatePagination,
  handlePrismaError,
  requireActiveSession,
} from "@/lib/api-utils";

// ---- Validation schemas ----
const CreateProductSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(200, "Name is too long"),
  description: z.string().max(5000, "Description is too long").optional().nullable(),
  shortDesc: z.string().max(300, "Short description is too long").optional().nullable(),
  category: z.nativeEnum(ProductCategory, { errorMap: () => ({ message: "Invalid product category" }) }),
  brand: z.string().max(100, "Brand name is too long").optional().nullable(),
  sku: z.string().max(50, "SKU is too long").optional().nullable(),
  price: z.number().positive("Price must be positive"),
  comparePrice: z.number().positive("Compare price must be positive").optional().nullable(),
  costPrice: z.number().positive("Cost price must be positive").optional().nullable(),
  stock: z.number().int("Stock must be a whole number").min(0, "Stock cannot be negative").default(0),
  lowStockAlert: z.number().int().min(0).default(5),
  images: z.array(z.string().url()).max(10, "Too many images").default([]),
  thumbnailUrl: z.string().url("Invalid thumbnail URL").optional().nullable(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  tags: z.array(z.string().max(50)).max(20, "Too many tags").default([]),
  ingredients: z.string().max(5000, "Ingredients text is too long").optional().nullable(),
  howToUse: z.string().max(5000, "Usage instructions are too long").optional().nullable(),
  seoTitle: z.string().max(60, "SEO title is too long").optional().nullable(),
  seoDescription: z.string().max(160, "SEO description is too long").optional().nullable(),
});

const UpdateProductSchema = CreateProductSchema.partial().extend({
  id: z.string().cuid("Invalid product ID"),
});

// ---- GET: List products (public) ----
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = validatePagination(searchParams, { page: 1, limit: 12, maxLimit: 100 });
    const category = searchParams.get("category") as ProductCategory | null;
    const featured = searchParams.get("featured") === "true";
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") ?? "createdAt";
    const sortOrder = (searchParams.get("sortOrder") ?? "desc") as "asc" | "desc";

    // Validate category filter
    if (category && !Object.values(ProductCategory).includes(category)) {
      return apiError(`Invalid category. Valid values: ${Object.values(ProductCategory).join(", ")}`, 400);
    }

    // Validate sort order
    if (!["asc", "desc"].includes(sortOrder)) {
      return apiError("sortOrder must be 'asc' or 'desc'", 400);
    }

    const session = await getAuthSession();
    const isAdmin = session?.user && hasPermission(
      session.user.role as UserRole,
      "manageProducts"
    );

    const where: any = {};
    if (!isAdmin) where.isActive = true;
    if (category) where.category = category;
    if (featured) where.isFeatured = true;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
        { tags: { hasSome: [search] } },
      ];
    }

    const validSortFields = ["price", "createdAt", "name", "stock"];
    const orderBy = validSortFields.includes(sortBy)
      ? { [sortBy]: sortOrder }
      : { createdAt: "desc" as const };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          reviews: {
            where: { isPublished: true },
            select: { rating: true },
          },
          _count: { select: { reviews: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Compute average ratings
    const productsWithRatings = products.map((p) => {
      const avgRating =
        p.reviews.length > 0
          ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length
          : null;
      return { ...p, avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null };
    });

    return apiSuccess({
      products: productsWithRatings,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handlePrismaError(error, "GET /api/products");
  }
}

// ---- POST: Create product (admin/owner only) ----
export async function POST(req: NextRequest) {
  const { data: body, error: jsonError } = await parseJsonBody(req);
  if (jsonError) return jsonError;

  try {
    const session = await getAuthSession();
    const authError = await requireActiveSession(session);
    if (authError) return authError;

    if (!hasPermission(session!.user.role as UserRole, "manageProducts")) {
      return apiError("You don't have permission to create products", 403);
    }

    const parsed = CreateProductSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstError = Object.entries(fieldErrors)
        .map(([field, msgs]) => `${field}: ${(msgs as string[])[0]}`)
        .join("; ");
      return apiError(firstError || "Validation failed", 400, parsed.error.flatten());
    }

    const data = parsed.data;

    // Generate unique slug
    let slug = slugify(data.name, { lower: true, strict: true });
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const product = await prisma.product.create({
      data: {
        ...data,
        slug,
        price: data.price,
        comparePrice: data.comparePrice ?? null,
        costPrice: data.costPrice ?? null,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session!.user.id,
        action: "CREATE_PRODUCT",
        entity: "Product",
        entityId: product.id,
        details: { name: data.name, category: data.category },
      },
    });

    return apiSuccess(product, 201);
  } catch (error) {
    return handlePrismaError(error, "POST /api/products");
  }
}

// ---- PATCH: Update product (admin/owner only) ----
export async function PATCH(req: NextRequest) {
  const { data: body, error: jsonError } = await parseJsonBody(req);
  if (jsonError) return jsonError;

  try {
    const session = await getAuthSession();
    const authError = await requireActiveSession(session);
    if (authError) return authError;

    if (!hasPermission(session!.user.role as UserRole, "manageProducts")) {
      return apiError("You don't have permission to update products", 403);
    }

    const parsed = UpdateProductSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstError = Object.entries(fieldErrors)
        .map(([field, msgs]) => `${field}: ${(msgs as string[])[0]}`)
        .join("; ");
      return apiError(firstError || "Validation failed", 400, parsed.error.flatten());
    }

    const { id, ...updateFields } = parsed.data;

    // If name changed, regenerate slug
    if (updateFields.name) {
      let slug = slugify(updateFields.name, { lower: true, strict: true });
      const existing = await prisma.product.findFirst({
        where: { slug, id: { not: id } },
      });
      if (existing) slug = `${slug}-${Date.now()}`;
      (updateFields as any).slug = slug;
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateFields as any,
    });

    await prisma.activityLog.create({
      data: {
        userId: session!.user.id,
        action: "UPDATE_PRODUCT",
        entity: "Product",
        entityId: product.id,
        details: { fields: Object.keys(updateFields) },
      },
    });

    return apiSuccess(product);
  } catch (error) {
    return handlePrismaError(error, "PATCH /api/products");
  }
}

// ---- DELETE: Soft-delete product (admin/owner only) ----
export async function DELETE(req: NextRequest) {
  try {
    const session = await getAuthSession();
    const authError = await requireActiveSession(session);
    if (authError) return authError;

    if (!hasPermission(session!.user.role as UserRole, "manageProducts")) {
      return apiError("You don't have permission to delete products", 403);
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return apiError("Product ID is required", 400);
    }

    const product = await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    await prisma.activityLog.create({
      data: {
        userId: session!.user.id,
        action: "DELETE_PRODUCT",
        entity: "Product",
        entityId: id,
        details: { name: product.name },
      },
    });

    return apiSuccess({ success: true, message: "Product deactivated" });
  } catch (error) {
    return handlePrismaError(error, "DELETE /api/products");
  }
}
