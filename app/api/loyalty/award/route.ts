export const dynamic = "force-dynamic";
// app/api/loyalty/award/route.ts
// Creates a PENDING_APPROVAL loyalty transaction for a completed appointment.
// Points are NOT credited until admin approves via POST /api/loyalty/approve.

import { NextRequest } from "next/server";
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiNotFound } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const AwardSchema = z.object({
  appointmentId: z.string().min(1, "appointmentId is required"),
  points:        z.number().int().positive("points must be a positive integer"),
  description:   z.string().max(500).optional(),
});

const STAFF_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.OWNER, UserRole.RECEPTIONIST];

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return apiUnauthorized();
    }
    if (!STAFF_ROLES.includes(session.user.role as UserRole)) {
      return apiForbidden();
    }

    const body = await req.json();
    const parsed = AwardSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    const { appointmentId, points, description } = parsed.data;

    // 1. Confirm the appointment exists and is COMPLETED
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        client: { select: { id: true, name: true } },
        service: { select: { name: true } },
      },
    });

    if (!appointment) {
      return apiNotFound("Appointment not found");
    }
    if (appointment.status !== "COMPLETED") {
      return apiError("Loyalty points can only be awarded for COMPLETED appointments");
    }

    // 2. Guard: don't create a duplicate award for the same appointment
    const existing = await prisma.loyaltyTransaction.findFirst({
      where: { appointmentId, type: "EARN_APPOINTMENT" },
    });
    if (existing) {
      return apiError("A loyalty transaction already exists for this appointment", 409);
    }

    // 3. Ensure the client has a loyalty account (create if missing)
    const loyaltyAccount = await prisma.loyaltyAccount.upsert({
      where:  { userId: appointment.clientId },
      update: {},
      create: { userId: appointment.clientId },
    });

    // 4. Create the PENDING_APPROVAL transaction — no points added yet
    const transaction = await prisma.loyaltyTransaction.create({
      data: {
        loyaltyAccountId: loyaltyAccount.id,
        appointmentId,
        type:        "EARN_APPOINTMENT",
        points,
        description: description ?? `Points for ${appointment.service.name}`,
        status:      "PENDING_APPROVAL",
      },
    });

    // 5. Activity log
    await prisma.activityLog.create({
      data: {
        userId:   session.user.id,
        action:   "CREATE_LOYALTY_AWARD",
        entity:   "LoyaltyTransaction",
        entityId: transaction.id,
        details:  { appointmentId, points, clientId: appointment.clientId },
      },
    });

    return apiSuccess(
      { data: { transactionId: transaction.id, points, status: "PENDING_APPROVAL" } },
      201
    );
  } catch (error) {
    console.error("[POST /api/loyalty/award]", error);
    return apiError("Internal server error", 500);
  }
}
