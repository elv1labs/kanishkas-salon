// app/api/payments/confirm-upi/route.ts
// Client self-reports UPI payment — submits UTR for staff verification.
// Payment stays PENDING_VERIFICATION until staff confirms via mark-paid.

import { NextRequest } from "next/server";
import { apiSuccess, apiError, apiUnauthorized, apiNotFound } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { z } from "zod";

const ConfirmUpiSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  transactionRef: z
    .string()
    .min(6, "Transaction reference must be at least 6 characters")
    .max(30, "Transaction reference is too long")
    .regex(/^[A-Za-z0-9]+$/, "Transaction reference must be alphanumeric"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return apiUnauthorized("Authentication required");
    }

    const body = await req.json();
    const parsed = ConfirmUpiSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message ?? "Validation failed";
      return apiError(firstError);
    }

    const { orderId, transactionRef } = parsed.data;

    // Verify the order belongs to this user
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order || order.clientId !== session.user.id) {
      return apiNotFound("Order not found");
    }

    if (order.status === "CANCELLED") {
      return apiError("This order has been cancelled");
    }

    // Check if payment already confirmed
    if (order.payment?.status === "PAID") {
      return apiError("Payment already confirmed");
    }

    // Update or create payment record
    if (order.payment) {
      await prisma.payment.update({
        where: { id: order.payment.id },
        data: {
          method: "UPI",
          transactionRef,
          status: "PENDING_VERIFICATION",
        },
      });
    } else {
      await prisma.payment.create({
        data: {
          orderId,
          amount: order.total,
          method: "UPI",
          transactionRef,
          status: "PENDING_VERIFICATION",
        },
      });
    }

    // Notify admin/owner about the UPI payment
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "OWNER"] }, isActive: true },
      select: { id: true },
    });

    const shortRef = order.orderRef.slice(-6).toUpperCase();
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: "ORDER_UPDATE",
          title: `💳 UPI Payment Submitted — #${shortRef}`,
          message: `Client submitted UPI payment for order #${shortRef}. UTR: ${transactionRef}. Please verify and confirm.`,
          actionUrl: "/dashboard/owner/orders",
        },
      });
    }

    // Activity log
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPI_PAYMENT_SUBMITTED",
        entity: "Payment",
        entityId: orderId,
        details: { transactionRef, orderRef: order.orderRef },
      },
    });

    return apiSuccess({
      message: "Payment submitted! Our team will verify and confirm shortly.",
      status: "PENDING_VERIFICATION",
    });
  } catch (error) {
    console.error("[POST /api/payments/confirm-upi]", error);
    return apiError("Internal server error", 500);
  }
}
