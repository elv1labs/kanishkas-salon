export const dynamic = "force-dynamic";
// app/api/orders/[id]/route.ts
// Individual order — GET detail, PATCH (status transitions + refund), DELETE (cancel)

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { OrderStatus } from "@prisma/client";
import { z } from "zod";
import {
  apiSuccess,
  apiError,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  handlePrismaError,
  checkPermission,
} from "@/lib/api-utils";
import { sendEmail, EmailTemplates } from "@/lib/resend";
import { sendSMS } from "@/lib/twilio";

const UpdateOrderSchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  notes: z.string().max(500).optional(),
  refundReason: z.string().max(500).optional(),
});

// All valid status transitions (including REFUNDED)
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

const ORDER_INCLUDE = {
  client: { select: { id: true, name: true, email: true, phone: true } },
  items: {
    include: {
      product: { select: { id: true, name: true, slug: true, thumbnailUrl: true, price: true, stock: true } },
    },
  },
  payment: {
    select: {
      id: true, status: true, amount: true, method: true,
      paidAt: true, transactionRef: true, paymentNote: true,
    },
  },
} as const;

type RouteContext = { params: Promise<{ id: string }> };

// ---- GET: Single order detail ----
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return apiUnauthorized();

    const { id } = await context.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });

    if (!order) return apiNotFound("Order not found");

    // Clients can only view their own
    const isStaff = await checkPermission(session, "manageOrders");
    if (!isStaff && order.clientId !== session.user.id) {
      return apiForbidden();
    }

    return apiSuccess({ order });
  } catch (error) {
    return handlePrismaError(error, "GET /api/orders/[id]");
  }
}

// ---- PATCH: Update order status ----
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return apiUnauthorized();

    const { id } = await context.params;

    const body = await req.json();
    const parsed = UpdateOrderSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten());
    }

    const { status, notes, refundReason } = parsed.data;
    const isStaff = await checkPermission(session, "manageOrders");

    const existing = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { select: { productId: true, quantity: true } },
        client: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    if (!existing) return apiNotFound("Order not found");

    // Clients can only cancel their own PENDING orders
    if (!isStaff) {
      if (existing.clientId !== session.user.id) return apiForbidden();
      if (status && status !== OrderStatus.CANCELLED) {
        return apiForbidden("You can only cancel orders");
      }
      if (existing.status !== "PENDING") {
        return apiError("Only pending orders can be cancelled");
      }
    }

    if (status) {
      // Validate status transition
      const allowed = VALID_TRANSITIONS[existing.status] ?? [];
      if (!allowed.includes(status)) {
        return apiError(
          `Cannot transition from ${existing.status} to ${status}. Allowed: ${allowed.join(", ") || "none"}`,
          400
        );
      }
    }

    const updateData: Record<string, any> = {};
    if (status) {
      updateData.status = status;
      if (status === "DELIVERED") updateData.deliveredAt = new Date();
      if (status === "REFUNDED") updateData.refundedAt = new Date();
      if (notes) updateData.notes = notes;
    }

    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: updateData,
        include: ORDER_INCLUDE,
      });

      // Restore stock if order cancelled or refunded
      if (status === "CANCELLED" || status === "REFUNDED") {
        for (const item of existing.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }

        // Mark payment as refunded if refunding
        if (status === "REFUNDED" && updated.payment) {
          await tx.payment.update({
            where: { id: updated.payment.id },
            data: {
              status: "REFUNDED",
              paymentNote: refundReason ?? "Order refunded by admin",
            },
          });
        }
      }

      return updated;
    });

    // ── Notification ──
    await prisma.notification.create({
      data: {
        userId: existing.clientId,
        type: "ORDER_UPDATE",
        title: `Order ${status ? status.charAt(0) + status.slice(1).toLowerCase() : "Updated"}`,
        message: `Your order #${order.orderRef.slice(-6).toUpperCase()} has been ${(status ?? "updated").toLowerCase()}.`,
        actionUrl: `/dashboard/client/orders`,
      },
    });

    // ── SMS/Email for key transitions ──
    if (status && ["SHIPPED", "DELIVERED", "REFUNDED"].includes(status) && existing.client?.email) {
      const shortRef = order.orderRef.slice(-6).toUpperCase();
      const statusLabel = status.toLowerCase();
      const smsBody = `Hi ${existing.client.name ?? "Customer"}, your order #${shortRef} has been ${statusLabel}. Thank you — Kanishka's Academy`;

      if (existing.client.phone) {
        sendSMS({ to: existing.client.phone, body: smsBody }).catch(console.error);
      }
      sendEmail({
        to: existing.client.email,
        subject: `📦 Order ${status.charAt(0) + status.slice(1).toLowerCase()} — #${shortRef}`,
        html: `<p>Hi <strong>${existing.client.name ?? "Customer"}</strong>,</p><p>Your order <strong>#${shortRef}</strong> has been <strong>${statusLabel}</strong>.</p>`,
      }).catch(console.error);
    }

    // ── Audit log ──
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: status === "REFUNDED" ? "REFUND_ORDER" : "UPDATE_ORDER",
        entity: "Order",
        entityId: id,
        details: {
          previousStatus: existing.status,
          newStatus: status,
          ...(refundReason ? { refundReason } : {}),
        },
      },
    });

    return apiSuccess({ order });
  } catch (error) {
    return handlePrismaError(error, "PATCH /api/orders/[id]");
  }
}

// ---- DELETE: Cancel order (soft) ----
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return apiUnauthorized();

    const { id } = await context.params;
    const isStaff = await checkPermission(session, "manageOrders");

    const existing = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { select: { productId: true, quantity: true } },
      },
    });

    if (!existing) return apiNotFound("Order not found");
    if (!isStaff && existing.clientId !== session.user.id) return apiForbidden();

    if (existing.status === "CANCELLED") {
      return apiError("Order is already cancelled");
    }

    // Only pending/processing orders can be cancelled
    if (!["PENDING", "PROCESSING"].includes(existing.status)) {
      return apiError(`Cannot cancel an order with status: ${existing.status}`);
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: { status: OrderStatus.CANCELLED },
      });

      // Restore stock
      for (const item of existing.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    });

    await prisma.notification.create({
      data: {
        userId: existing.clientId,
        type: "ORDER_UPDATE",
        title: "Order Cancelled",
        message: `Your order #${existing.orderRef.slice(-6).toUpperCase()} has been cancelled.`,
        actionUrl: `/dashboard/client/orders`,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CANCEL_ORDER",
        entity: "Order",
        entityId: id,
        details: { orderRef: existing.orderRef },
      },
    });

    return apiSuccess({ success: true, message: "Order cancelled and stock restored" });
  } catch (error) {
    return handlePrismaError(error, "DELETE /api/orders/[id]");
  }
}
