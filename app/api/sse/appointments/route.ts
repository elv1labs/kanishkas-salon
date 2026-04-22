export const dynamic = "force-dynamic";
// app/api/sse/appointments/route.ts
// Server-Sent Events endpoint for real-time appointment updates.
// Admin/staff dashboard connects here and receives push events.

import { NextRequest } from "next/server";
import { getAuthSession, hasPermission } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { eventBus, CHANNELS } from "@/lib/event-bus";

export async function GET(req: NextRequest) {
  // Auth check — only staff/admin can subscribe
  const session = await getAuthSession();
  if (!session?.user || !hasPermission(session.user.role as UserRole, "manageAppointments")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ status: "connected", timestamp: new Date().toISOString() })}\n\n`)
      );

      // Keep-alive every 30 seconds to prevent connection timeout
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keepalive ${Date.now()}\n\n`));
        } catch {
          clearInterval(keepAlive);
        }
      }, 30_000);

      // Subscribe to appointment events
      const unsubAppointments = eventBus.subscribe(CHANNELS.APPOINTMENTS, (data) => {
        try {
          controller.enqueue(
            encoder.encode(`event: appointment\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // Client disconnected
        }
      });

      // Subscribe to order events
      const unsubOrders = eventBus.subscribe(CHANNELS.ORDERS, (data) => {
        try {
          controller.enqueue(
            encoder.encode(`event: order\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // Client disconnected
        }
      });

      // Cleanup on client disconnect
      req.signal.addEventListener("abort", () => {
        clearInterval(keepAlive);
        unsubAppointments();
        unsubOrders();
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}
