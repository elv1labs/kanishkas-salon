// app/admin/orders/[id]/page.tsx
// Full order detail view with offline payment confirmation
// Shows confirmation timestamp + confirming staff name from ActivityLog

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import OrderDetailClient from "./OrderDetailClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    select: { orderRef: true },
  });
  return { title: order ? `Order #${order.orderRef.slice(-8).toUpperCase()}` : "Order" };
}

async function getOrderDetail(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, email: true, phone: true } },
      items: {
        include: {
          product: {
            select: { id: true, name: true, slug: true, thumbnailUrl: true, price: true },
          },
        },
      },
      payment: true,
    },
  });
  return order;
}

async function getPaymentConfirmLog(orderId: string) {
  // Get the ActivityLog entry for MARK_ORDER_PAYMENT_PAID to show who confirmed + when
  const log = await prisma.activityLog.findFirst({
    where: { entity: "Payment", action: "MARK_ORDER_PAYMENT_PAID", details: { path: ["orderId"], equals: orderId } },
    include: { user: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "desc" },
  });
  return log;
}

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const [order, confirmLog] = await Promise.all([
    getOrderDetail(params.id),
    getPaymentConfirmLog(params.id),
  ]);

  if (!order) notFound();

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-sm text-charcoal-lighter hover:text-gold transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Orders
      </Link>

      {/* Pass serializable data to client component */}
      <OrderDetailClient
        order={JSON.parse(JSON.stringify(order))}
        confirmLog={confirmLog ? JSON.parse(JSON.stringify(confirmLog)) : null}
      />
    </div>
  );
}
