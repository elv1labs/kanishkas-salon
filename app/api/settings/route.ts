export const dynamic = "force-dynamic";
// app/api/settings/route.ts
// Business settings API — admin only

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, hasPermission } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { apiSuccess, apiError, parseJsonBody, handlePrismaError } from "@/lib/api-utils";
import { z } from "zod";

const UpdateSettingsSchema = z.object({
  salonName: z.string().min(1).max(200).optional(),
  tagline: z.string().max(500).optional().nullable(),
  phone: z.string().min(5).max(20).optional(),
  email: z.string().email().optional(),
  address: z.string().max(500).optional(),
  googleMapsUrl: z.string().url().optional().nullable(),
  googleMapsEmbed: z.string().optional().nullable(),
  instagramUrl: z.string().url().optional().nullable(),
  facebookUrl: z.string().url().optional().nullable(),
  whatsappNumber: z.string().max(20).optional().nullable(),
  openTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  currency: z.string().max(5).optional(),
  timezone: z.string().max(50).optional(),
  loyaltyPointsValue: z.number().min(0).max(100).optional(),
  appointmentBuffer: z.number().int().min(0).max(120).optional(),
  cancellationPolicy: z.string().max(2000).optional().nullable(),
  privacyPolicy: z.string().max(10000).optional().nullable(),
  termsAndConditions: z.string().max(10000).optional().nullable(),
  upiId: z.string().max(100).optional().nullable(),
  upiQrImageUrl: z.string().max(500).optional().nullable(),
});

// GET: Fetch current business settings
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    if (!hasPermission(session.user.role as UserRole, "manageSettings")) {
      return apiError("Forbidden", 403);
    }

    // Get or create default settings
    let settings = await prisma.businessSettings.findFirst();

    if (!settings) {
      settings = await prisma.businessSettings.create({ data: {} });
    }

    return apiSuccess({ settings });
  } catch (error) {
    return handlePrismaError(error, "GET /api/settings");
  }
}

// PATCH: Update business settings
export async function PATCH(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return apiError("Unauthorized", 401);
    }

    if (!hasPermission(session.user.role as UserRole, "manageSettings")) {
      return apiError("Forbidden", 403);
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return apiError("Invalid JSON body", 400);
    }

    const parsed = UpdateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    // Get or create settings record
    let existing = await prisma.businessSettings.findFirst();
    if (!existing) {
      existing = await prisma.businessSettings.create({ data: {} });
    }

    const settings = await prisma.businessSettings.update({
      where: { id: existing.id },
      data: parsed.data as any,
    });

    // Log the change
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_SETTINGS",
        entity: "BusinessSettings",
        entityId: settings.id,
        details: { fields: Object.keys(parsed.data) },
      },
    });

    return apiSuccess({ settings });
  } catch (error) {
    return handlePrismaError(error, "PATCH /api/settings");
  }
}
