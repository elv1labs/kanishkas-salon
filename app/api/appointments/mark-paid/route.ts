export const dynamic = "force-dynamic";
// app/api/appointments/mark-paid/route.ts
// Offline payment confirmation for appointments (UPI / CASH / CARD)

import { NextRequest, NextResponse } from "next/server";
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!STAFF_ROLES.includes(session.user.role as UserRole)) {
      return NextResponse.json(
        { error: "Forbidden — only staff can mark payments" },
        { status: 403 }
      );
    }

    // ── Validate input ────────────────────────────────────────────────────
    const body = await req.json();
    const parsed = MarkPaidSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
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
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
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
        return NextResponse.json({ error: err.message }, { status: err.status });
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

    return NextResponse.json(
      {
        success: true,
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
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[POST /api/appointments/mark-paid]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
