export const dynamic = "force-dynamic";
// app/api/staff/route.ts
// Staff management API — list + create staff members

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiForbidden,
  parseJsonBody,
  handlePrismaError,
  requirePermission,
} from "@/lib/api-utils";

// ---- Validation schema for creating staff ----
const CreateStaffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10).max(15).optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  role: z.enum(["OWNER", "RECEPTIONIST"] as const).default("RECEPTIONIST"),
  designation: z.string().min(2).max(100),
  specializations: z.array(z.string()).default([]),
  bio: z.string().max(500).optional(),
  experience: z.number().int().min(0).default(0),
  workingDays: z
    .array(z.string())
    .default(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]),
  workStartTime: z.string().default("10:00"),
  workEndTime: z.string().default("21:00"),
  commissionType: z.enum(["PERCENTAGE", "FLAT"]).default("PERCENTAGE"),
  commissionRate: z.number().min(0).default(0),
});

// ---- GET: List all staff members ----
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return apiUnauthorized();
    const permError = await requirePermission(session, "manageStaff");
    if (permError) return permError;

    const staff = await prisma.user.findMany({
      where: { staffProfile: { isNot: null } },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        image: true,
        isActive: true,
        createdAt: true,
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
            commissionType: true,
            commissionRate: true,
          },
        },
        _count: {
          select: { staffAppointments: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return apiSuccess({ staff });
  } catch (error) {
    return handlePrismaError(error, "GET /api/staff");
  }
}

// ---- POST: Create a new staff member ----
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return apiUnauthorized();
    const permError = await requirePermission(session, "manageStaff");
    if (permError) return permError;

    const { data: body, error: jsonError } = await parseJsonBody(req);
    if (jsonError) return jsonError;

    const parsed = CreateStaffSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    const {
      name, email, phone, password, role, designation,
      specializations, bio, experience, workingDays,
      workStartTime, workEndTime, commissionType, commissionRate,
    } = parsed.data;

    // Check for duplicate email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return apiError("A user with this email already exists", 409);
    }

    // Check for duplicate phone
    if (phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone } });
      if (existingPhone) {
        return apiError("A user with this phone number already exists", 409);
      }
    }

    // Generate random 10-char temp password if none provided
    const finalPassword = password ?? Math.random().toString(36).slice(-5) + Math.random().toString(36).slice(-5);
    const passwordHash = await bcrypt.hash(finalPassword, 12);

    // Create user + staff profile in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          phone: phone ?? null,
          passwordHash,
          role: role as UserRole,
          emailVerified: new Date(),
          isActive: true,
        },
      });

      await tx.staffProfile.create({
        data: {
          userId: newUser.id,
          designation,
          specializations,
          bio: bio ?? null,
          experience,
          workingDays,
          workStartTime,
          workEndTime,
          commissionType: commissionType as any,
          commissionRate,
        },
      });

      return newUser;
    });

    // Log the action
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entity: "Staff",
        entityId: user.id,
        details: { name, email, role, designation },
      },
    });

    // Return the full staff record matching GET shape
    const created = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        image: true,
        isActive: true,
        createdAt: true,
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
            commissionType: true,
            commissionRate: true,
          },
        },
        _count: {
          select: { staffAppointments: true },
        },
      },
    });

    return apiSuccess({ staff: created }, 201);
  } catch (error) {
    return handlePrismaError(error, "POST /api/staff");
  }
}
