export const dynamic = "force-dynamic";
// app/api/users/[id]/route.ts
// Individual user — GET detail, PATCH update, DELETE (soft-delete)

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  parseJsonBody,
  handlePrismaError,
  requirePermission,
} from "@/lib/api-utils";

// Shared select shape — matches the list GET in /api/users
const USER_SELECT = {
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
} as const;

// ---- Validation schema for updating a single user ----
const UpdateUserByIdSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100).optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().min(10).max(15).optional().nullable(),
  role: z.nativeEnum(UserRole, { errorMap: () => ({ message: "Invalid role" }) }).optional(),
  isActive: z.boolean().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

// ---- GET: Fetch single user by ID ----
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return apiUnauthorized();
    const permError = await requirePermission(session, "manageUsers");
    if (permError) return permError;

    const { id } = await context.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });

    if (!user) {
      return apiNotFound("User not found");
    }

    return apiSuccess({ user });
  } catch (error) {
    return handlePrismaError(error, "GET /api/users/[id]");
  }
}

// ---- PATCH: Update user fields ----
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return apiUnauthorized();
    const permError = await requirePermission(session, "manageUsers");
    if (permError) return permError;

    const { id } = await context.params;

    const { data: body, error: jsonError } = await parseJsonBody(req);
    if (jsonError) return jsonError;

    const parsed = UpdateUserByIdSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    const updateData = parsed.data;

    // Verify user exists
    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, email: true },
    });
    if (!existing) {
      return apiNotFound("User not found");
    }

    // Prevent admin from deactivating themselves
    if (id === session.user.id && updateData.isActive === false) {
      return apiError("You cannot deactivate your own account", 400);
    }

    // Prevent admin from removing their own admin role
    if (id === session.user.id && updateData.role && updateData.role !== UserRole.ADMIN) {
      return apiError("You cannot remove your own admin role", 400);
    }

    // Check email uniqueness if being changed
    if (updateData.email && updateData.email !== existing.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: updateData.email },
        select: { id: true },
      });
      if (emailTaken) {
        return apiError("A user with this email already exists", 409);
      }
    }

    // Check phone uniqueness if being changed
    if (updateData.phone) {
      const phoneTaken = await prisma.user.findFirst({
        where: { phone: updateData.phone, id: { not: id } },
        select: { id: true },
      });
      if (phoneTaken) {
        return apiError("A user with this phone number already exists", 409);
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: USER_SELECT,
    });

    // Log the action
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
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

    return apiSuccess({ user });
  } catch (error) {
    return handlePrismaError(error, "PATCH /api/users/[id]");
  }
}

// ---- DELETE: Soft-delete (deactivate) a user ----
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return apiUnauthorized();
    const permError = await requirePermission(session, "manageUsers");
    if (permError) return permError;

    const { id } = await context.params;

    // Prevent self-deletion
    if (id === session.user.id) {
      return apiError("You cannot deactivate your own account", 400);
    }

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, role: true },
    });
    if (!existing) {
      return apiNotFound("User not found");
    }

    // Soft-delete: deactivate user
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE_USER",
        entity: "User",
        entityId: id,
        details: { name: existing.name, action: "deactivated" },
      },
    });

    await prisma.notification.create({
      data: {
        userId: id,
        type: "SYSTEM",
        title: "Account Deactivated",
        message: "Your account has been deactivated. Please contact the salon for more information.",
      },
    });

    return apiSuccess({ success: true, message: `${existing.name} has been deactivated` });
  } catch (error) {
    return handlePrismaError(error, "DELETE /api/users/[id]");
  }
}
