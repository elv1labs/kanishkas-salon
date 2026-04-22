export const dynamic = "force-dynamic";
// app/api/gallery/route.ts
// Gallery API — public listing + staff CRUD

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, hasPermission } from "@/lib/auth";
import { UserRole, GalleryCategory } from "@prisma/client";
import { z } from "zod";
import {
    apiSuccess,
    apiError,
    parseJsonBody,
    validatePagination,
    handlePrismaError,
    requireActiveSession,
} from "@/lib/api-utils";

// ---- Validation schemas ----
const imageUrlSchema = z.string().min(1, "Image URL is required").refine(
    (val) => {
        // Accept https:// external URLs (e.g. Unsplash)
        if (val.startsWith("https://")) return true;
        // Accept only the correct served path — /api/uploads/
        if (val.startsWith("/api/uploads/")) return true;
        // Reject bare /uploads/ (legacy broken paths), Google Drive, http://, etc.
        return false;
    },
    { message: "Must be a valid URL (https://...) or image path" }
);

const CreateGalleryItemSchema = z.object({
    title: z.string().max(200, "Title is too long").optional(),
    description: z.string().max(500, "Description is too long").optional(),
    imageUrl: imageUrlSchema,
    thumbnailUrl: imageUrlSchema.optional(),
    category: z.nativeEnum(GalleryCategory, { errorMap: () => ({ message: "Invalid gallery category" }) }),
    tags: z.array(z.string().max(50)).max(20, "Too many tags").default([]),
    altText: z.string().max(200, "Alt text is too long").optional(),
    isFeatured: z.boolean().default(false),
    isPublished: z.boolean().default(true),
    sortOrder: z.number().int().min(0).max(9999).default(0),
});

const UpdateGalleryItemSchema = CreateGalleryItemSchema.partial().extend({
    id: z.string().cuid("Invalid gallery item ID"),
});

// ---- GET: List gallery items (public) ----
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = validatePagination(searchParams, { page: 1, limit: 24, maxLimit: 100 });
        const category = searchParams.get("category") as GalleryCategory | null;
        const featured = searchParams.get("featured") === "true";

        // Validate category filter
        if (category && !Object.values(GalleryCategory).includes(category)) {
            return apiError(`Invalid category. Valid values: ${Object.values(GalleryCategory).join(", ")}`, 400);
        }

        const session = await getAuthSession();
        const isStaff = session?.user && hasPermission(session.user.role as UserRole, "manageGallery");

        const where: any = {};
        if (!isStaff) where.isPublished = true;
        if (category) where.category = category;
        if (featured) where.isFeatured = true;

        const [items, total] = await Promise.all([
            prisma.galleryItem.findMany({
                where,
                orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
                skip,
                take: limit,
                include: {
                    uploadedBy: { select: { id: true, name: true } },
                },
            }),
            prisma.galleryItem.count({ where }),
        ]);

        return apiSuccess({
            items,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        return handlePrismaError(error, "GET /api/gallery");
    }
}

// ---- POST: Upload gallery item (staff only) ----
export async function POST(req: NextRequest) {
    const { data: body, error: jsonError } = await parseJsonBody(req);
    if (jsonError) return jsonError;

    try {
        const session = await getAuthSession();
        if (!session) return apiError("Authentication required", 401);

        if (!hasPermission(session.user.role as UserRole, "manageGallery")) {
            return apiError("You don't have permission to manage the gallery", 403);
        }

        const parsed = CreateGalleryItemSchema.safeParse(body);
        if (!parsed.success) {
            const fieldErrors = parsed.error.flatten().fieldErrors;
            const messages = Object.entries(fieldErrors)
                .map(([field, errs]) => `${field}: ${(errs as string[]).join(", ")}`)
                .join("; ");
            return apiError(`Validation failed — ${messages}`, 400, parsed.error.flatten());
        }

        const item = await prisma.galleryItem.create({
            data: {
                ...parsed.data,
                uploadedById: session.user.id,
            },
        });

        await prisma.activityLog.create({
            data: {
                userId: session.user.id,
                action: "CREATE_GALLERY_ITEM",
                entity: "GalleryItem",
                entityId: item.id,
                details: { category: parsed.data.category, title: parsed.data.title },
            },
        });

        return apiSuccess(item, 201);
    } catch (error) {
        return handlePrismaError(error, "POST /api/gallery");
    }
}

// ---- PATCH: Update gallery item (staff only) ----
export async function PATCH(req: NextRequest) {
    const { data: body, error: jsonError } = await parseJsonBody(req);
    if (jsonError) return jsonError;

    try {
        const session = await getAuthSession();
        if (!session) return apiError("Authentication required", 401);

        if (!hasPermission(session.user.role as UserRole, "manageGallery")) {
            return apiError("You don't have permission to manage the gallery", 403);
        }

        const parsed = UpdateGalleryItemSchema.safeParse(body);
        if (!parsed.success) {
            const fieldErrors = parsed.error.flatten().fieldErrors;
            const messages = Object.entries(fieldErrors)
                .map(([field, errs]) => `${field}: ${(errs as string[]).join(", ")}`)
                .join("; ");
            return apiError(`Validation failed — ${messages}`, 400, parsed.error.flatten());
        }

        const { id, ...updateFields } = parsed.data;

        const item = await prisma.galleryItem.update({
            where: { id },
            data: updateFields,
        });

        await prisma.activityLog.create({
            data: {
                userId: session.user.id,
                action: "UPDATE_GALLERY_ITEM",
                entity: "GalleryItem",
                entityId: id,
                details: { fields: Object.keys(updateFields) },
            },
        });

        return apiSuccess(item);
    } catch (error) {
        return handlePrismaError(error, "PATCH /api/gallery");
    }
}

// ---- DELETE: Remove gallery item (admin/owner only) ----
export async function DELETE(req: NextRequest) {
    try {
        const session = await getAuthSession();
        if (!session) return apiError("Authentication required", 401);

        if (!([UserRole.ADMIN, UserRole.OWNER] as readonly UserRole[]).includes(session.user.role as UserRole)) {
            return apiError("Only admins can delete gallery items", 403);
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return apiError("Gallery item ID is required", 400);
        }

        await prisma.galleryItem.delete({ where: { id } });

        await prisma.activityLog.create({
            data: {
                userId: session!.user.id,
                action: "DELETE_GALLERY_ITEM",
                entity: "GalleryItem",
                entityId: id,
            },
        });

        return apiSuccess({ success: true, message: "Gallery item deleted" });
    } catch (error) {
        return handlePrismaError(error, "DELETE /api/gallery");
    }
}
