export const dynamic = "force-dynamic";
// app/api/orders/route.ts
// Offline-first order management — payment collected at store / on delivery

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession, hasPermission } from "@/lib/auth";
import { UserRole, OrderStatus, VoucherStatus } from "@prisma/client";
import { z } from "zod";
import { sendEmail, EmailTemplates } from "@/lib/resend";
import { sendSMS, SMSTemplates } from "@/lib/twilio";
import { awardPurchasePoints } from "@/lib/loyalty";

const CreateOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().cuid(),
      quantity: z.number().int().positive(),
    })
  ).min(1),
  voucherCode: z.string().optional(),
  loyaltyPointsToRedeem: z.number().int().min(0).default(0),
  shippingName: z.string().min(2).max(100),
  shippingPhone: z.string().min(10).max(15),
  shippingAddress: z.string().min(3, "Address must be at least 3 characters").max(300),
  shippingCity: z.string().min(2).max(100),
  shippingPincode: z.string().regex(/^\d{6}$/),
  notes: z.string().max(500).optional(),
});

// ── GET: List orders ─────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as OrderStatus | null;
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "10");

    const isStaff = hasPermission(session.user.role as UserRole, "manageOrders");

    const where: any = {};
    if (!isStaff) where.clientId = session.user.id;
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, thumbnailUrl: true, slug: true } },
            },
          },
          client: { select: { id: true, name: true, email: true, phone: true } },
          payment: {
            select: {
              status: true, amount: true, method: true,
              paidAt: true, transactionRef: true, paymentNote: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /api/orders]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── POST: Create order (offline-first) ───────────────────────────────────────
// Payment is collected at store / on delivery — admin marks it paid via
// POST /api/orders/mark-paid

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CreateOrderSchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstError = Object.entries(fieldErrors)
        .map(([field, msgs]) => `${field}: ${(msgs as string[])[0]}`)
        .join("; ");
      return NextResponse.json(
        { error: firstError || "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      items, voucherCode, loyaltyPointsToRedeem,
      shippingName, shippingPhone, shippingAddress,
      shippingCity, shippingPincode, notes,
    } = parsed.data;

    // ── Validate products & stock ───────────────────────────────────────────
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    if (products.length !== items.length) {
      return NextResponse.json({ error: "One or more products are unavailable" }, { status: 400 });
    }

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)!;
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for "${product.name}"` },
          { status: 400 }
        );
      }
    }

    // ── Calculate totals ────────────────────────────────────────────────────
    let subtotal = 0;
    const orderItems = items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const unitPrice = Number(product.price);
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;
      return { productId: item.productId, quantity: item.quantity, unitPrice, totalPrice };
    });

    // Voucher discount
    let discountAmount = 0;
    let validVoucher: any = null;
    if (voucherCode) {
      validVoucher = await prisma.giftVoucher.findFirst({
        where: {
          code: voucherCode.toUpperCase(),
          status: VoucherStatus.ACTIVE,
          expiresAt: { gt: new Date() },
        },
      });
      if (!validVoucher) {
        return NextResponse.json({ error: "Invalid or expired voucher code" }, { status: 400 });
      }
      discountAmount = Math.min(Number(validVoucher.remainingValue), subtotal);
    }

    // Loyalty points (1 point = ₹1)
    if (loyaltyPointsToRedeem > 0) {
      const loyaltyAccount = await prisma.loyaltyAccount.findUnique({
        where: { userId: session.user.id },
      });
      if (!loyaltyAccount || loyaltyAccount.totalPoints < loyaltyPointsToRedeem) {
        return NextResponse.json({ error: "Insufficient loyalty points" }, { status: 400 });
      }
      discountAmount += loyaltyPointsToRedeem;
    }

    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = Math.round(taxableAmount * 0.18 * 100) / 100;
    const shippingAmount = subtotal >= 500 ? 0 : 50;
    const total = taxableAmount + taxAmount + shippingAmount;

    // ── Atomic transaction ──────────────────────────────────────────────────
    const order = await prisma.$transaction(async (tx) => {
      // 1. Create order
      const newOrder = await tx.order.create({
        data: {
          clientId: session.user.id,
          status: OrderStatus.PENDING,
          subtotal, discountAmount, taxAmount, shippingAmount, total,
          voucherCode: voucherCode?.toUpperCase(),
          loyaltyUsed: loyaltyPointsToRedeem,
          shippingName, shippingPhone, shippingAddress, shippingCity, shippingPincode,
          notes,
          items: { create: orderItems },
        },
        include: { items: true },
      });

      // 2. Create PENDING payment record — admin/staff will mark paid via mark-paid endpoint
      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          amount: total,
          currency: "INR",
          status: "PENDING",
          // method and paidAt set later by POST /api/orders/mark-paid
        },
      });

      // 3. Decrement stock
      for (const item of orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // 4. Handle loyalty redemption
      if (loyaltyPointsToRedeem > 0) {
        const la = await tx.loyaltyAccount.findUnique({ where: { userId: session.user.id } });
        if (la) {
          await tx.loyaltyAccount.update({
            where: { userId: session.user.id },
            data: {
              totalPoints: { decrement: loyaltyPointsToRedeem },
              lifetimeRedeemed: { increment: loyaltyPointsToRedeem },
            },
          });
          await tx.loyaltyTransaction.create({
            data: {
              loyaltyAccountId: la.id,
              orderId: newOrder.id,
              type: "REDEEM",
              points: -loyaltyPointsToRedeem,
              description: `Redeemed ${loyaltyPointsToRedeem} pts for order #${newOrder.orderRef.slice(-8).toUpperCase()}`,
            },
          });
        }
      }

      // 5. Handle voucher redemption
      if (validVoucher && discountAmount > 0) {
        const voucherUsed = Math.min(discountAmount, Number(validVoucher.remainingValue));
        const remaining = Number(validVoucher.remainingValue) - voucherUsed;
        await tx.giftVoucher.update({
          where: { id: validVoucher.id },
          data: {
            remainingValue: remaining,
            status: remaining <= 0 ? "REDEEMED" : "ACTIVE",
            ...(remaining <= 0
              ? { redeemedById: session.user.id, redeemedAt: new Date() }
              : {}),
          },
        });
      }

      // 6. In-app notification
      await tx.notification.create({
        data: {
          userId: session.user.id,
          type: "ORDER_UPDATE",
          title: "Order Placed",
          message: `Order #${newOrder.orderRef.slice(-8).toUpperCase()} (₹${total.toLocaleString("en-IN")}) placed. Payment collected on delivery.`,
          actionUrl: `/dashboard/client/orders`,
        },
      });

      // 7. Activity log
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: "CREATE_ORDER",
          entity: "Order",
          entityId: newOrder.id,
          details: { itemCount: orderItems.length, total },
        },
      });

      return newOrder;
    });

    // ── Fire-and-forget: award loyalty purchase points ─────────────────────
    awardPurchasePoints(order.id).catch(console.error);

    // ── Fire-and-forget: order confirmation notifications ─────────────────
    const client = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, phone: true },
    });
    if (client) {
      const shortRef = order.orderRef.slice(-8).toUpperCase();
      const itemSummary = orderItems.map((i) => {
        const product = products.find((p) => p.id === i.productId)!;
        return { name: product.name, quantity: i.quantity, price: i.unitPrice };
      });

      // Email
      if (client.email) {
        const tmpl = EmailTemplates.orderConfirmed({
          clientName: client.name ?? "Customer",
          orderRef: shortRef,
          items: itemSummary,
          total,
        });
        sendEmail({ to: client.email, ...tmpl }).catch(console.error);
      }

      // SMS
      if (client.phone) {
        const smsBody = SMSTemplates.orderConfirmed(
          client.name ?? "Customer",
          shortRef,
          total.toLocaleString("en-IN")
        );
        sendSMS({ to: client.phone, body: smsBody }).catch(console.error);
      }
    }

    return NextResponse.json(
      { orderId: order.id, orderRef: order.orderRef, total },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[POST /api/orders]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── PATCH: Update order status (admin/staff only) ────────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "id and status are required" }, { status: 400 });
    }

    const isStaff = hasPermission(session.user.role as UserRole, "manageOrders");

    // Clients can only cancel their own PENDING orders
    if (!isStaff) {
      if (status !== "CANCELLED") {
        return NextResponse.json({ error: "You can only cancel orders" }, { status: 403 });
      }
      const existing = await prisma.order.findUnique({
        where: { id },
        select: { clientId: true, status: true },
      });
      if (!existing || existing.clientId !== session.user.id) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      if (existing.status !== "PENDING") {
        return NextResponse.json(
          { error: "Only pending orders can be cancelled" },
          { status: 400 }
        );
      }
    }

    const validStatuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        status: status as OrderStatus,
        ...(status === "DELIVERED" ? { deliveredAt: new Date() } : {}),
      },
      include: {
        client: { select: { id: true, name: true, email: true, phone: true } },
        items: { include: { product: { select: { id: true, name: true, stock: true } } } },
      },
    });

    // Restore stock if order cancelled
    if (status === "CANCELLED") {
      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    await prisma.notification.create({
      data: {
        userId: order.clientId,
        type: "ORDER_UPDATE",
        title: `Order ${status.charAt(0) + status.slice(1).toLowerCase()}`,
        message: `Your order #${order.orderRef.slice(-6).toUpperCase()} has been ${status.toLowerCase()}.`,
        actionUrl: `/dashboard/client/orders`,
      },
    });

    // Fire-and-forget: SMS for shipped/delivered status changes
    if ((status === "SHIPPED" || status === "DELIVERED") && order.client?.email) {
      const shortRef = order.orderRef.slice(-6).toUpperCase();
      const statusLabel = status === "SHIPPED" ? "shipped" : "delivered";
      const smsBody = `Hi ${order.client.name ?? "Customer"}, your order #${shortRef} has been ${statusLabel}. Track it at www.kanishkasacademy.com`;
      if (order.client.phone) {
        sendSMS({ to: order.client.phone, body: smsBody }).catch(console.error);
      }
      // Email update
      sendEmail({
        to: order.client.email,
        subject: `📦 Order ${status === "SHIPPED" ? "Shipped" : "Delivered"} — #${shortRef}`,
        html: `<p>Hi <strong>${order.client.name ?? "Customer"}</strong>,</p><p>Your order <strong>#${shortRef}</strong> has been <strong>${statusLabel}</strong>. Thank you for shopping with Kanishka's Family Salon!</p>`,
      }).catch(console.error);
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("[PATCH /api/orders]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
