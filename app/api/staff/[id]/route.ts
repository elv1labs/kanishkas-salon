export const dynamic = "force-dynamic";
// app/api/staff/[id]/route.ts
// Individual staff member — GET detail, PATCH update, DELETE (soft-delete)

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

// ---- Validation schema for updating staff ----
const UpdateStaffSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().min(10).max(15).optional().nullable(),
  role: z.enum(["OWNER", "RECEPTIONIST"] as const).optional(),
  isActive: z.boolean().optional(),
  designation: z.string().min(2).max(100).optional(),
  specializations: z.array(z.string()).optional(),
  bio: z.string().max(500).optional().nullable(),
  experience: z.number().int().min(0).optional(),
  isAvailable: z.boolean().optional(),
  workingDays: z.array(z.string()).optional(),
  workStartTime: z.string().optional(),
  workEndTime: z.string().optional(),
  commissionType: z.enum(["PERCENTAGE", "FLAT"]).optional(),
  commissionRate: z.number().min(0).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

// ---- GET: Staff member detail ----
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return apiUnauthorized();
    const permError = await requirePermission(session, "manageStaff");
    if (permError) return permError;

    const { id } = await context.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        image: true,
        isActive: true,
        createdAt: true,
        staffProfile: true,
        _count: { select: { staffAppointments: true } },
      },
    });

    if (!user || !user.staffProfile) {
      return apiNotFound("Staff member not found");
    }

    return apiSuccess({ staff: user });
  } catch (error) {
    return handlePrismaError(error, "GET /api/staff/[id]");
  }
}

// ---- PATCH: Update staff member ----
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return apiUnauthorized();
    const permError = await requirePermission(session, "manageStaff");
    if (permError) return permError;

    const { id } = await context.params;

    const { data: body, error: jsonError } = await parseJsonBody(req);
    if (jsonError) return jsonError;

    const parsed = UpdateStaffSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    // Verify user exists and has a staff profile
    const existing = await prisma.user.findUnique({
      where: { id },
      include: { staffProfile: true },
    });
    if (!existing || !existing.staffProfile) {
      return apiNotFound("Staff member not found");
    }

    const { name, phone, role, isActive, ...profileData } = parsed.data;

    // Update user fields (name, phone, role) + staff profile fields in a transaction
    await prisma.$transaction(async (tx) => {
      // Update User table fields if provided
      const userData: Record<string, any> = {};
      if (name !== undefined) userData.name = name;
      if (phone !== undefined) userData.phone = phone;
      if (role !== undefined) userData.role = role;
      if (isActive !== undefined) userData.isActive = isActive;

      if (Object.keys(userData).length > 0) {
        await tx.user.update({ where: { id }, data: userData });
      }

      // Update StaffProfile fields if any provided
      if (Object.keys(profileData).length > 0) {
        await tx.staffProfile.update({
          where: { userId: id },
          data: profileData as any,
        });
      }
    });

    // Log the action
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entity: "Staff",
        entityId: id,
        details: { fields: Object.keys(parsed.data) },
      },
    });

    // Fetch updated record
    const updated = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        staffProfile: {
          select: {
            designation: true,
            specializations: true,
            isAvailable: true,
            bio: true,
            experience: true,
            workingDays: true,
            workStartTime: true,
            workEndTime: true,
          },
        },
      },
    });

    return apiSuccess({ staff: updated });
  } catch (error) {
    return handlePrismaError(error, "PATCH /api/staff/[id]");
  }
}

// ---- DELETE: Soft-delete (deactivate) a staff member ----
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return apiUnauthorized();
    const permError = await requirePermission(session, "manageStaff");
    if (permError) return permError;

    const { id } = await context.params;

    // Prevent self-deletion
    if (id === session.user.id) {
      return apiError("You cannot deactivate your own account", 400);
    }

    const existing = await prisma.user.findUnique({
      where: { id },
      include: { staffProfile: true },
    });
    if (!existing || !existing.staffProfile) {
      return apiNotFound("Staff member not found");
    }

    // Soft-delete: deactivate user + set staff profile unavailable
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: { isActive: false },
      });
      await tx.staffProfile.update({
        where: { userId: id },
        data: { isAvailable: false },
      });
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        entity: "Staff",
        entityId: id,
        details: { name: existing.name, action: "deactivated" },
      },
    });

    return apiSuccess({ success: true, message: `${existing.name} has been deactivated` });
  } catch (error) {
    return handlePrismaError(error, "DELETE /api/staff/[id]");
  }
}
