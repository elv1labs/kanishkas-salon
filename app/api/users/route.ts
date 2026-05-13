export const dynamic = "force-dynamic";
// app/api/users/route.ts
// User management API — admin listing + role/status updates

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import {
    apiSuccess,
    apiError,
    parseJsonBody,
    validatePagination,
    buildPaginationMeta,
    handlePrismaError,
    requireActiveSession,
    requirePermission,
} from "@/lib/api-utils";

// ---- Validation schema ----
const UpdateUserSchema = z.object({
    id: z.string().cuid("Invalid user ID"),
    role: z.nativeEnum(UserRole, { errorMap: () => ({ message: "Invalid role" }) }).optional(),
    isActive: z.boolean().optional(),
    name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long").optional(),
    email: z.string().email("Invalid email address").optional(),
    phone: z.string().min(10, "Phone number is too short").max(15, "Phone number is too long").optional().nullable(),
});

// ---- GET: List users (admin only) ----
export async function GET(req: NextRequest) {
    try {
        const session = await getAuthSession();
        const authError = await requireActiveSession(session);
        if (authError) return authError;

        const permError = await requirePermission(session, "manageUsers");
        if (permError) return permError;

        const { searchParams } = new URL(req.url);
        const { page, limit, skip } = validatePagination(searchParams);
        const role = searchParams.get("role") as UserRole | null;
        const isActive = searchParams.get("isActive");
        const search = searchParams.get("search");

        // Validate role filter
        if (role && !Object.values(UserRole).includes(role)) {
            return apiError(`Invalid role filter. Valid values: ${Object.values(UserRole).join(", ")}`, 400);
        }

        const where: any = {};
        if (role) where.role = role;
        if (isActive !== null && isActive !== undefined && isActive !== "") {
            where.isActive = isActive === "true";
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
            ];
        }

        const [users, total, roleCounts] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    role: true,
                    isActive: true,
                    image: true,
                    createdAt: true,
                    updatedAt: true,
                    profile: {
                        select: {
                            totalVisits: true,
                            lastVisitAt: true,
                            city: true,
                        },
                    },
                    staffProfile: {
                        select: {
                            designation: true,
                            experience: true,
                            isAvailable: true,
                        },
                    },
                    loyaltyAccount: {
                        select: {
                            totalPoints: true,
                            tier: true,
                        },
                    },
                    _count: {
                        select: {
                            appointments: true,
                            orders: true,
                            reviews: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.user.count({ where }),
            prisma.user.groupBy({
                by: ["role"],
                _count: true,
            }),
        ]);

        const counts = Object.fromEntries(roleCounts.map((c) => [c.role, c._count])) as Record<string, number>;

        return apiSuccess({
            users,
            pagination: buildPaginationMeta(page, limit, total),
            counts,
        });
    } catch (error) {
        return handlePrismaError(error, "GET /api/users");
    }
}

// ---- PATCH: Update user role/status (admin only) ----
export async function PATCH(req: NextRequest) {
    const { data: body, error: jsonError } = await parseJsonBody(req);
    if (jsonError) return jsonError;

    try {
        const session = await getAuthSession();
        const authError = await requireActiveSession(session);
        if (authError) return authError;

        const permError = await requirePermission(session, "manageUsers");
        if (permError) return permError;

        const parsed = UpdateUserSchema.safeParse(body);
        if (!parsed.success) {
            return apiError("Validation failed", 400, parsed.error.flatten());
        }

        const { id, ...updateData } = parsed.data;

        // Prevent admin from deactivating themselves
        if (id === session!.user.id && updateData.isActive === false) {
            return apiError("You cannot deactivate your own account", 400);
        }

        // Prevent admin from removing their own admin role
        if (id === session!.user.id && updateData.role && updateData.role !== UserRole.ADMIN) {
            return apiError("You cannot remove your own admin role", 400);
        }

        // Verify user exists before updating
        const existingUser = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true } });
        if (!existingUser) {
            return apiError("User not found", 404);
        }

        // Check email uniqueness if being changed
        if (updateData.email && updateData.email !== existingUser.email) {
            const emailTaken = await prisma.user.findUnique({
                where: { email: updateData.email },
                select: { id: true },
            });
            if (emailTaken) {
                return apiError("A user with this email already exists", 409);
            }
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
            },
        });

        await prisma.activityLog.create({
            data: {
                userId: session!.user.id,
                action: "UPDATE_USER",
                entity: "User",
                entityId: id,
                details: {
                    fields: Object.keys(updateData),
                    changes: updateData,
                },
            },
        });

        // Notify user of role change
        if (updateData.role) {
            await prisma.notification.create({
                data: {
                    userId: id,
                    type: "SYSTEM",
                    title: "Account Role Updated",
                    message: `Your account role has been updated to ${updateData.role}. Your dashboard access has changed accordingly.`,
                    actionUrl: "/login",
                },
            });
        }

        // Notify user of deactivation
        if (updateData.isActive === false) {
            await prisma.notification.create({
                data: {
                    userId: id,
                    type: "SYSTEM",
                    title: "Account Deactivated",
                    message: "Your account has been deactivated. Please contact the salon for more information.",
                },
            });
        }

        return apiSuccess(user);
    } catch (error) {
        return handlePrismaError(error, "PATCH /api/users");
    }
}
