// lib/payments/markAsPaid.ts
// Shared offline payment confirmation logic for Appointments & Orders

import { prisma } from "@/lib/prisma";
import { PaymentStatus, PaymentMethod } from "@prisma/client";

export type PaymentEntityType = "appointment" | "order";

export interface MarkPaidInput {
  id: string;
  type: PaymentEntityType;
  paymentMethod: PaymentMethod;
  paymentAmount: number;
  transactionRef?: string;
  paymentNote?: string;
}

export interface MarkPaidResult {
  payment: {
    id: string;
    status: PaymentStatus;
    method: PaymentMethod;
    amount: unknown; // Decimal from Prisma
    transactionRef: string | null;
    paymentNote: string | null;
    paidAt: Date | null;
  };
  entityId: string;
  entityType: PaymentEntityType;
}

/**
 * Marks an Appointment or Order as PAID by upserting a Payment record.
 *
 * - Validates the target entity exists
 * - Prevents duplicate payments (409 if already PAID)
 * - Upserts the Payment row with PAID status
 *
 * Throws an object `{ status, message }` on validation / not-found errors.
 */
export async function markAsPaid(input: MarkPaidInput): Promise<MarkPaidResult> {
  const { id, type, paymentMethod, paymentAmount, transactionRef, paymentNote } = input;

  // ── Validate entity exists ──────────────────────────────────────────────
  if (type === "appointment") {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { payment: true },
    });

    if (!appointment) {
      throw { status: 404, message: "Appointment not found" };
    }

    if (appointment.payment?.status === PaymentStatus.PAID) {
      throw { status: 409, message: "This appointment is already marked as paid" };
    }

    const payment = await prisma.payment.upsert({
      where: { appointmentId: id },
      create: {
        appointmentId: id,
        amount: paymentAmount,
        currency: "INR",
        status: PaymentStatus.PAID,
        method: paymentMethod,
        transactionRef: transactionRef ?? null,
        paymentNote: paymentNote ?? null,
        paidAt: new Date(),
      },
      update: {
        amount: paymentAmount,
        status: PaymentStatus.PAID,
        method: paymentMethod,
        transactionRef: transactionRef ?? null,
        paymentNote: paymentNote ?? null,
        paidAt: new Date(),
      },
    });

    return {
      payment: {
        id: payment.id,
        status: payment.status,
        method: payment.method!,
        amount: payment.amount,
        transactionRef: payment.transactionRef,
        paymentNote: payment.paymentNote,
        paidAt: payment.paidAt,
      },
      entityId: id,
      entityType: "appointment",
    };
  }

  // ── Order flow ──────────────────────────────────────────────────────────
  const order = await prisma.order.findUnique({
    where: { id },
    include: { payment: true },
  });

  if (!order) {
    throw { status: 404, message: "Order not found" };
  }

  if (order.payment?.status === PaymentStatus.PAID) {
    throw { status: 409, message: "This order is already marked as paid" };
  }

  const payment = await prisma.payment.upsert({
    where: { orderId: id },
    create: {
      orderId: id,
      amount: paymentAmount,
      currency: "INR",
      status: PaymentStatus.PAID,
      method: paymentMethod,
      transactionRef: transactionRef ?? null,
      paymentNote: paymentNote ?? null,
      paidAt: new Date(),
    },
    update: {
      amount: paymentAmount,
      status: PaymentStatus.PAID,
      method: paymentMethod,
      transactionRef: transactionRef ?? null,
      paymentNote: paymentNote ?? null,
      paidAt: new Date(),
    },
  });

  return {
    payment: {
      id: payment.id,
      status: payment.status,
      method: payment.method!,
      amount: payment.amount,
      transactionRef: payment.transactionRef,
      paymentNote: payment.paymentNote,
      paidAt: payment.paidAt,
    },
    entityId: id,
    entityType: "order",
  };
}
