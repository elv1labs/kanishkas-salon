export const dynamic = "force-dynamic";
// app/api/services/route.ts
// Services API — public listing + admin CRUD

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, hasPermission } from "@/lib/auth";
import { UserRole, ServiceCategory } from "@prisma/client";
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
const CreateServiceSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(200, "Name is too long"),
    description: z.string().max(5000, "Description is too long").optional(),
    shortDesc: z.string().max(300, "Short description is too long").optional(),
    // categoryId is optional — we'll look up or create the first available one
    categoryId: z.string().optional(),
    // category enum is optional — defaults to HAIR_STYLING
    category: z.nativeEnum(ServiceCategory).optional().default(ServiceCategory.HAIR_STYLING),
    price: z.number().positive("Price must be positive"),
    priceMax: z.number().positive("Max price must be positive").optional(),
    duration: z.number().int("Duration must be whole minutes").positive("Duration must be positive").max(480, "Duration cannot exceed 8 hours"),
    imageUrl: z.string().url("Invalid image URL").optional(),
    gallery: z.array(z.string().url()).max(20, "Too many gallery images").default([]),
    isActive: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
    isPopular: z.boolean().default(false),
    requiresDeposit: z.boolean().default(false),
    depositAmount: z.number().positive("Deposit must be positive").optional(),
    staffRequired: z.array(z.string()).default([]),
    tags: z.array(z.string().max(50)).max(20, "Too many tags").default([]),
    seoTitle: z.string().max(60, "SEO title is too long").optional(),
    seoDescription: z.string().max(160, "SEO description is too long").optional(),
    sortOrder: z.number().int().min(0).max(9999).default(0),
});

const UpdateServiceSchema = CreateServiceSchema.partial().extend({
    id: z.string().min(1, "Service ID is required"),
});

// ---- GET: List services (public) ----
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const { page, limit, skip } = validatePagination(searchParams, { page: 1, limit: 50, maxLimit: 100 });
        const category = searchParams.get("category");
        const featured = searchParams.get("featured") === "true";
        const search = searchParams.get("search");

        // Validate category filter
        if (category && !Object.values(ServiceCategory).includes(category as any)) {
            return apiError(`Invalid category. Valid values: ${Object.values(ServiceCategory).join(", ")}`, 400);
        }

        const session = await getAuthSession();
        const isAdmin = session?.user && hasPermission(session.user.role as UserRole, "manageServices");

        const where: any = {};
        if (!isAdmin) where.isActive = true;
        if (category) where.category = category as any;
        if (featured) where.isFeatured = true;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { tags: { hasSome: [search] } },
            ];
        }

        const [services, total] = await Promise.all([
            prisma.service.findMany({
                where,
                orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
                skip,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    shortDesc: true,
                    description: true,
                    category: true,
                    price: true,
                    priceMax: true,
                    duration: true,
                    imageUrl: true,
                    isFeatured: true,
                    isPopular: true,
                    isActive: true,
                    sortOrder: true,
                    tags: true,
                },
            }),
            prisma.service.count({ where }),
        ]);

        return apiSuccess({
            services,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        return handlePrismaError(error, "GET /api/services");
    }
}

// ---- POST: Create service (admin/owner only) ----
export async function POST(req: NextRequest) {
    const { data: body, error: jsonError } = await parseJsonBody(req);
    if (jsonError) return jsonError;

    try {
        const session = await getAuthSession();
        const authError = await requireActiveSession(session);
        if (authError) return authError;

        if (!hasPermission(session!.user.role as UserRole, "manageServices")) {
            return apiError("You don't have permission to create services", 403);
        }

        const parsed = CreateServiceSchema.safeParse(body);
        if (!parsed.success) {
            return apiError("Validation failed", 400, parsed.error.flatten());
        }

        const data = parsed.data;

        // Resolve categoryId — use provided, or fall back to first available category
        let resolvedCategoryId = data.categoryId;
        if (!resolvedCategoryId) {
            const firstCat = await prisma.serviceCategory_Model.findFirst({ orderBy: { sortOrder: "asc" } });
            if (!firstCat) {
                // Auto-create a default category if none exist
                const defaultCat = await prisma.serviceCategory_Model.create({
                    data: { name: "General", slug: "general" },
                });
                resolvedCategoryId = defaultCat.id;
            } else {
                resolvedCategoryId = firstCat.id;
            }
        }

        // Generate unique slug
        let slug = slugify(data.name, { lower: true, strict: true });
        const existing = await prisma.service.findUnique({ where: { slug } });
        if (existing) slug = `${slug}-${Date.now()}`;

        const service = await prisma.service.create({
            data: {
                name: data.name,
                slug,
                description: data.description,
                shortDesc: data.shortDesc,
                categoryId: resolvedCategoryId,
                category: data.category ?? ServiceCategory.HAIR_STYLING,
                price: data.price,
                priceMax: data.priceMax ?? null,
                duration: data.duration,
                imageUrl: data.imageUrl,
                gallery: data.gallery,
                isActive: data.isActive ?? true,
                isFeatured: data.isFeatured ?? false,
                isPopular: data.isPopular ?? false,
                requiresDeposit: data.requiresDeposit ?? false,
                depositAmount: data.depositAmount ?? null,
                staffRequired: data.staffRequired ?? [],
                tags: data.tags ?? [],
                seoTitle: data.seoTitle,
                seoDescription: data.seoDescription,
                sortOrder: data.sortOrder ?? 0,
            },
        });

        await prisma.activityLog.create({
            data: {
                userId: session!.user.id,
                action: "CREATE_SERVICE",
                entity: "Service",
                entityId: service.id,
                details: { name: data.name, category: data.category },
            },
        });

        return apiSuccess(service, 201);
    } catch (error) {
        return handlePrismaError(error, "POST /api/services");
    }
}

// ---- PATCH: Update service (admin/owner only) ----
export async function PATCH(req: NextRequest) {
    const { data: body, error: jsonError } = await parseJsonBody(req);
    if (jsonError) return jsonError;

    try {
        const session = await getAuthSession();
        const authError = await requireActiveSession(session);
        if (authError) return authError;

        if (!hasPermission(session!.user.role as UserRole, "manageServices")) {
            return apiError("You don't have permission to update services", 403);
        }

        const parsed = UpdateServiceSchema.safeParse(body);
        if (!parsed.success) {
            return apiError("Validation failed", 400, parsed.error.flatten());
        }

        const { id, ...updateData } = parsed.data;

        // If name changed, regenerate slug
        if (updateData.name) {
            let slug = slugify(updateData.name, { lower: true, strict: true });
            const existing = await prisma.service.findFirst({
                where: { slug, id: { not: id } },
            });
            if (existing) slug = `${slug}-${Date.now()}`;
            (updateData as any).slug = slug;
        }

        const service = await prisma.service.update({
            where: { id },
            data: updateData as any,
        });

        await prisma.activityLog.create({
            data: {
                userId: session!.user.id,
                action: "UPDATE_SERVICE",
                entity: "Service",
                entityId: service.id,
                details: { fields: Object.keys(updateData) },
            },
        });

        return apiSuccess(service);
    } catch (error) {
        return handlePrismaError(error, "PATCH /api/services");
    }
}

// ---- DELETE: Soft-delete service (admin/owner only) ----
export async function DELETE(req: NextRequest) {
    try {
        const session = await getAuthSession();
        const authError = await requireActiveSession(session);
        if (authError) return authError;

        if (!hasPermission(session!.user.role as UserRole, "manageServices")) {
            return apiError("You don't have permission to delete services", 403);
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return apiError("Service ID is required", 400);
        }

        const service = await prisma.service.update({
            where: { id },
            data: { isActive: false },
        });

        await prisma.activityLog.create({
            data: {
                userId: session!.user.id,
                action: "DELETE_SERVICE",
                entity: "Service",
                entityId: id,
                details: { name: service.name },
            },
        });

        return apiSuccess({ success: true, message: "Service deactivated" });
    } catch (error) {
        return handlePrismaError(error, "DELETE /api/services");
    }
}
