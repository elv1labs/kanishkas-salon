export const dynamic = "force-dynamic";
// app/api/users/me/route.ts
// Current user profile — GET own data, PATCH own profile

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { apiSuccess, apiError, handlePrismaError } from "@/lib/api-utils";
import { z } from "zod";

const UpdateProfileSchema = z.object({
  // User fields
  name: z.string().min(2).max(100).optional(),
  phone: z
    .string()
    .min(10)
    .max(15)
    .optional()
    .nullable(),

  // ClientProfile fields
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  pincode: z.string().max(10).optional().nullable(),
  dateOfBirth: z.string().optional().nullable(), // ISO date string
  gender: z.string().max(20).optional().nullable(),
  skinType: z.string().max(50).optional().nullable(),
  hairType: z.string().max(50).optional().nullable(),
  allergies: z.string().max(500).optional().nullable(),
  preferredStaff: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

// GET: Fetch current user's full profile including ClientProfile
export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return apiError("Authentication required", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        isActive: true,
        createdAt: true,
        profile: {
          select: {
            id: true,
            dateOfBirth: true,
            gender: true,
            address: true,
            city: true,
            pincode: true,
            skinType: true,
            hairType: true,
            allergies: true,
            preferredStaff: true,
            notes: true,
            totalVisits: true,
            lastVisitAt: true,
          },
        },
        staffProfile: {
          select: {
            id: true,
            designation: true,
            bio: true,
            specializations: true,
            experience: true,
            isAvailable: true,
          },
        },
        // Loyalty info for client
        loyaltyAccount: {
          select: {
            totalPoints: true,
            lifetimeEarned: true,
            tier: true,
          },
        },
      },
    });

    if (!user) {
      return apiError("User not found", 404);
    }

    return apiSuccess({ user });
  } catch (error) {
    return handlePrismaError(error, "GET /api/users/me");
  }
}

// PATCH: Update current user's profile
export async function PATCH(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return apiError("Authentication required", 401);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return apiError("Invalid JSON body", 400);
    }

    const parsed = UpdateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    const {
      name,
      phone,
      address,
      city,
      pincode,
      dateOfBirth,
      gender,
      skinType,
      hairType,
      allergies,
      preferredStaff,
      notes,
    } = parsed.data;

    // Separate User fields from ClientProfile fields
    const userUpdate: Record<string, unknown> = {};
    if (name !== undefined) userUpdate.name = name;
    if (phone !== undefined) {
      // Check phone uniqueness if changing
      if (phone) {
        const existing = await prisma.user.findFirst({
          where: { phone, NOT: { id: session.user.id } },
        });
        if (existing) {
          return apiError("This phone number is already registered to another account", 409);
        }
      }
      userUpdate.phone = phone;
    }

    const profileUpdate: Record<string, unknown> = {};
    if (address !== undefined) profileUpdate.address = address;
    if (city !== undefined) profileUpdate.city = city;
    if (pincode !== undefined) profileUpdate.pincode = pincode;
    if (gender !== undefined) profileUpdate.gender = gender;
    if (skinType !== undefined) profileUpdate.skinType = skinType;
    if (hairType !== undefined) profileUpdate.hairType = hairType;
    if (allergies !== undefined) profileUpdate.allergies = allergies;
    if (preferredStaff !== undefined) profileUpdate.preferredStaff = preferredStaff;
    if (notes !== undefined) profileUpdate.notes = notes;
    if (dateOfBirth !== undefined) {
      profileUpdate.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    }

    // Update user and upsert profile in a transaction
    const user = await prisma.$transaction(async (tx) => {
      // Update user core fields if any
      let updatedUser = await tx.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, email: true, phone: true, role: true },
      });

      if (Object.keys(userUpdate).length > 0) {
        updatedUser = await tx.user.update({
          where: { id: session.user.id },
          data: userUpdate,
          select: { id: true, name: true, email: true, phone: true, role: true },
        });
      }

      // Upsert ClientProfile if there are profile fields
      let profile = null;
      if (Object.keys(profileUpdate).length > 0) {
        profile = await tx.clientProfile.upsert({
          where: { userId: session.user.id },
          create: {
            userId: session.user.id,
            ...profileUpdate,
          },
          update: profileUpdate,
        });
      } else {
        profile = await tx.clientProfile.findUnique({
          where: { userId: session.user.id },
        });
      }

      return { ...updatedUser, profile };
    });

    // Log the update
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_PROFILE",
        entity: "User",
        entityId: session.user.id,
        details: {
          fields: Object.keys(parsed.data),
        },
      },
    });

    return apiSuccess({ user });
  } catch (error) {
    return handlePrismaError(error, "PATCH /api/users/me");
  }
}
