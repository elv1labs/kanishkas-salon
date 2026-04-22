export const dynamic = "force-dynamic";
// app/api/appointments/mark-paid/route.ts
// Offline payment confirmation for appointments (UPI / CASH / CARD)

import { NextRequest } from "next/server";
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiNotFound } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { UserRole, PaymentMethod } from "@prisma/client";
import { z } from "zod";
import { markAsPaid } from "@/lib/payments/markAsPaid";

const MarkPaidSchema = z.object({
  appointmentId: z.string().min(1, "appointmentId is required"),
  paymentMethod: z.nativeEnum(PaymentMethod),
  paymentAmount: z
    .number({ invalid_type_error: "paymentAmount must be a number" })
    .positive("paymentAmount must be positive"),
  transactionRef: z.string().max(200).optional(),
  paymentNote: z.string().max(500).optional(),
});

const STAFF_ROLES: readonly UserRole[] = [
  UserRole.ADMIN,
  UserRole.OWNER,
  UserRole.RECEPTIONIST,
];

export async function POST(req: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────
    const session = await getAuthSession();
    if (!session?.user) {
      return apiUnauthorized();
    }

    if (!STAFF_ROLES.includes(session.user.role as UserRole)) {
      return apiForbidden("Only staff can mark payments");
    }

    // ── Validate input ────────────────────────────────────────────────────
    const body = await req.json();
    const parsed = MarkPaidSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    const { appointmentId, paymentMethod, paymentAmount, transactionRef, paymentNote } =
      parsed.data;

    // ── Fetch appointment for notification context ─────────────────────────
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

    // ── Use shared payment helper ─────────────────────────────────────────
    let result;
    try {
      result = await markAsPaid({
        id: appointmentId,
        type: "appointment",
        paymentMethod,
        paymentAmount,
        transactionRef,
        paymentNote,
      });
    } catch (err: any) {
      if (err?.status && err?.message) {
        return apiError(err.message, err.status);
      }
      throw err;
    }

    // ── In-app notification to client ─────────────────────────────────────
    await prisma.notification.create({
      data: {
        userId: appointment.clientId,
        type: "APPOINTMENT_CONFIRMED",
        title: "Payment Confirmed",
        message: `Payment of ₹${paymentAmount.toLocaleString("en-IN")} for ${appointment.service.name} has been recorded (${paymentMethod}).`,
        actionUrl: `/dashboard/client/appointments`,
      },
    });

    // ── Audit log ─────────────────────────────────────────────────────────
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "MARK_PAYMENT_PAID",
        entity: "Payment",
        entityId: result.payment.id,
        details: {
          appointmentId,
          paymentMethod,
          paymentAmount,
          transactionRef,
        },
      },
    });

    return apiSuccess({
      payment: {
        id: result.payment.id,
        appointmentId,
        status: result.payment.status,
        method: result.payment.method,
        amount: result.payment.amount,
        transactionRef: result.payment.transactionRef,
        paymentNote: result.payment.paymentNote,
        paidAt: result.payment.paidAt,
      },
    });
  } catch (error: any) {
    console.error("[POST /api/appointments/mark-paid]", error);
    return apiError("Internal server error", 500);
  }
}
