export const dynamic = "force-dynamic";
// app/api/orders/mark-paid/route.ts
// Offline payment confirmation for orders (UPI / CASH / CARD)

import { NextRequest } from "next/server";
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiNotFound } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { UserRole, PaymentMethod } from "@prisma/client";
import { z } from "zod";
import { markAsPaid } from "@/lib/payments/markAsPaid";

const MarkPaidSchema = z.object({
  orderId: z.string().min(1, "orderId is required"),
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

    const { orderId, paymentMethod, paymentAmount, transactionRef, paymentNote } =
      parsed.data;

    // ── Fetch order for notification context ──────────────────────────────
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: { select: { id: true, name: true } },
        items: { include: { product: { select: { name: true } } } },
      },
    });

    if (!order) {
      return apiNotFound("Order not found");
    }

    // ── Use shared payment helper ─────────────────────────────────────────
    let result;
    try {
      result = await markAsPaid({
        id: orderId,
        type: "order",
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
    const itemSummary = order.items
      .map((i) => i.product.name)
      .slice(0, 3)
      .join(", ");

    await prisma.notification.create({
      data: {
        userId: order.clientId,
        type: "ORDER_UPDATE",
        title: "Payment Confirmed",
        message: `Payment of ₹${paymentAmount.toLocaleString("en-IN")} for your order (${itemSummary}) has been recorded (${paymentMethod}).`,
        actionUrl: `/dashboard/client/orders`,
      },
    });

    // ── Audit log ─────────────────────────────────────────────────────────
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "MARK_ORDER_PAYMENT_PAID",
        entity: "Payment",
        entityId: result.payment.id,
        details: {
          orderId,
          paymentMethod,
          paymentAmount,
          transactionRef,
        },
      },
    });

    return apiSuccess({
      payment: {
        id: result.payment.id,
        orderId,
        status: result.payment.status,
        method: result.payment.method,
        amount: result.payment.amount,
        transactionRef: result.payment.transactionRef,
        paymentNote: result.payment.paymentNote,
        paidAt: result.payment.paidAt,
      },
    });
  } catch (error: any) {
    console.error("[POST /api/orders/mark-paid]", error);
    return apiError("Internal server error", 500);
  }
}
