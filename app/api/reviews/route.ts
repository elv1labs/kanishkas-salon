export const dynamic = "force-dynamic";
// app/api/reviews/route.ts
// Reviews API — fetch reviews for services/products, submit new reviews

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { awardReviewPoints } from "@/lib/loyalty";
import {
    apiSuccess,
    apiError,
    parseJsonBody,
    validatePagination,
    buildPaginationMeta,
    handlePrismaError,
    requireActiveSession,
    requirePermission,
    checkPermission,
    applyRateLimit,
} from "@/lib/api-utils";

// ---- Validation schemas ----
const CreateReviewSchema = z.object({
    serviceId: z.string().cuid("Invalid service ID").optional(),
    productId: z.string().cuid("Invalid product ID").optional(),
    appointmentId: z.string().cuid("Invalid appointment ID").optional(),
    rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
    title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title is too long").optional(),
    comment: z.string().max(500, "Comment must be 500 characters or fewer").optional(),
});

// ---- GET: Fetch reviews for a service or product ----
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = validatePagination(searchParams, { page: 1, limit: 10, maxLimit: 50 });
        
        const serviceId = searchParams.get("serviceId");
        const productId = searchParams.get("productId");

        // Must provide either serviceId or productId
        if (!serviceId && !productId) {
            return apiError("Either serviceId or productId query parameter is required", 400);
        }

        // Validate IDs if provided
        if (serviceId && !serviceId.match(/^[\w-]+$/)) {
            return apiError("Invalid service ID format", 400);
        }
        if (productId && !productId.match(/^[\w-]+$/)) {
            return apiError("Invalid product ID format", 400);
        }

        const where: any = {
            isPublished: true,
        };

        if (serviceId) where.serviceId = serviceId;
        if (productId) where.productId = productId;

        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                where,
                include: {
                    client: { 
                        select: { 
                            id: true, 
                            name: true, 
                            image: true
                        } 
                    },
                    service: { select: { id: true, name: true, slug: true } },
                    product: { select: { id: true, name: true, slug: true } },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.review.count({ where }),
        ]);

        // Calculate average rating
        const avgRating = reviews.length > 0 
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
            : 0;

        return apiSuccess({
            reviews,
            averageRating: Math.round(avgRating * 10) / 10,
            totalCount: total,
            pagination: buildPaginationMeta(page, limit, total),
        });
    } catch (error) {
        return handlePrismaError(error, "GET /api/reviews");
    }
}

// ---- POST: Submit a new review ----
export async function POST(req: NextRequest) {
    const rlError = applyRateLimit(req, "reviews:create", { max: 5, windowMs: 60_000 });
    if (rlError) return rlError;
    const { data: body, error: jsonError } = await parseJsonBody(req);
    if (jsonError) return jsonError;

    try {
        const session = await getAuthSession();
        const authError = await requireActiveSession(session);
        if (authError) return authError;

        const parsed = CreateReviewSchema.safeParse(body);
        if (!parsed.success) {
            return apiError("Validation failed", 400, parsed.error.flatten());
        }

        const { serviceId, productId, appointmentId, rating, title, comment } = parsed.data;

        // Must provide either serviceId or productId
        if (!serviceId && !productId) {
            return apiError("Either serviceId or productId is required", 400);
        }

        // Verify linked entities exist
        if (serviceId) {
            const service = await prisma.service.findUnique({ 
                where: { id: serviceId },
                select: { id: true, name: true }
            });
            if (!service) {
                return apiError("Service not found", 404);
            }
        }

        if (productId) {
            const product = await prisma.product.findUnique({ 
                where: { id: productId },
                select: { id: true, name: true }
            });
            if (!product) {
                return apiError("Product not found", 404);
            }
        }

        // Verify appointment belongs to client if provided
        let appointment = null;
        if (appointmentId) {
            appointment = await prisma.appointment.findUnique({
                where: { id: appointmentId },
                include: { 
                    client: { select: { id: true } },
                    service: { select: { id: true } }
                }
            });

            if (!appointment) {
                return apiError("Appointment not found", 404);
            }

            // Check ownership unless user has permission to manage all appointments
            const canManageAll = await checkPermission(session, "manageAllAppointments");
            if (!canManageAll &&
                appointment.clientId !== session!.user.id) {
                return apiError("You don't have permission to review this appointment", 403);
            }

            // Verify appointment service matches review service if both provided
            if (serviceId && appointment.serviceId !== serviceId) {
                return apiError("Appointment service does not match review service", 400);
            }
        }

        // Check if user has already reviewed this service/product+appointment combination
        const existingWhere: any = {
            clientId: session!.user.id,
        };

        if (serviceId) existingWhere.serviceId = serviceId;
        if (productId) existingWhere.productId = productId;
        if (appointmentId) existingWhere.appointmentId = appointmentId;

        const existingReview = await prisma.review.findFirst({
            where: existingWhere
        });

        if (existingReview) {
            return apiError("You have already submitted a review for this item", 409);
        }

        // Create review
        const review = await prisma.review.create({
            data: {
                clientId: session!.user.id,
                serviceId: serviceId || null,
                productId: productId || null,
                appointmentId: appointmentId || null,
                rating,
                title: title || null,
                comment,
                isApproved: false, // Requires admin approval
                isPublished: false, // Not published until approved
            },
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: session!.user.id,
                action: "SUBMIT_REVIEW",
                entity: "Review",
                entityId: review.id,
                details: { 
                    rating, 
                    serviceId, 
                    productId,
                    appointmentId 
                },
            },
        });

        return apiSuccess(
            { 
                message: "Review submitted successfully and is pending approval",
                review 
            }, 
            201
        );
    } catch (error) {
        return handlePrismaError(error, "POST /api/reviews");
    }
}
// ---- PATCH: Admin moderation — approve or reject a review ----
export async function PATCH(req: NextRequest) {
    const { data: body, error: jsonError } = await parseJsonBody(req);
    if (jsonError) return jsonError;

    try {
        const session = await getAuthSession();
        if (!session?.user) return apiError("Authentication required", 401);

        // Only admins and owners can moderate reviews
        const adminRoles: UserRole[] = [UserRole.ADMIN, UserRole.OWNER];
        if (!adminRoles.includes(session.user.role as UserRole)) {
            return apiError("Only admins can moderate reviews", 403);
        }

        const parsed = z.object({
            id: z.string().cuid("Invalid review ID"),
            action: z.enum(["approve", "reject", "respond"]),
            ownerResponse: z.string().max(500).optional(),
        }).safeParse(body);

        if (!parsed.success) {
            return apiError("Validation failed", 400, parsed.error.flatten());
        }

        const { id, action, ownerResponse } = parsed.data;

        const review = await prisma.review.findUnique({
            where: { id },
            select: { id: true, clientId: true },
        });

        if (!review) return apiError("Review not found", 404);

        // Handle owner response action
        if (action === "respond") {
            if (!ownerResponse) return apiError("Response text is required", 400);
            const responded = await prisma.review.update({
                where: { id },
                data: { ownerResponse, respondedAt: new Date() },
                include: {
                    client: { select: { id: true, name: true } },
                    product: { select: { id: true, name: true } },
                    service: { select: { id: true, name: true } },
                },
            });
            return apiSuccess({ message: "Response saved", review: responded });
        }

        const updated = await prisma.review.update({
            where: { id },
            data: {
                isApproved: action === "approve",
                isPublished: action === "approve",
            },
            include: {
                client: { select: { id: true, name: true } },
                product: { select: { id: true, name: true } },
                service: { select: { id: true, name: true } },
            },
        });

        // Award loyalty points for approved reviews (fire-and-forget)
        if (action === "approve") {
            awardReviewPoints(id).catch(console.error);
        }

        await prisma.activityLog.create({
            data: {
                userId: session.user.id,
                action: action === "approve" ? "APPROVE_REVIEW" : "REJECT_REVIEW",
                entity: "Review",
                entityId: id,
                details: { reviewId: id },
            },
        });

        return apiSuccess({
            message: action === "approve" ? "Review approved and published" : "Review rejected",
            review: updated,
        });
    } catch (error) {
        return handlePrismaError(error, "PATCH /api/reviews");
    }
}
