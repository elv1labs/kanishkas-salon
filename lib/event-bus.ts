// lib/event-bus.ts
// In-memory event bus for Server-Sent Events (SSE).
// Used to push real-time updates to admin dashboard without WebSockets.
//
// Architecture:
//   1. API routes call `eventBus.emit(channel, data)` when data changes
//   2. SSE endpoint subscribes to channels and pushes to connected clients
//   3. Client-side React hook `useSSE()` receives and dispatches updates
//
// This is intentionally simple for a single-server deployment (Docker VPS).
// For multi-server, replace with Redis pub/sub.

type Listener = (data: any) => void;

class EventBus {
  private listeners = new Map<string, Set<Listener>>();

  /**
   * Subscribe to a channel. Returns an unsubscribe function.
   */
  subscribe(channel: string, listener: Listener): () => void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }
    this.listeners.get(channel)!.add(listener);

    return () => {
      const channelListeners = this.listeners.get(channel);
      if (channelListeners) {
        channelListeners.delete(listener);
        if (channelListeners.size === 0) {
          this.listeners.delete(channel);
        }
      }
    };
  }

  /**
   * Emit an event to all subscribers on a channel.
   */
  emit(channel: string, data: any): void {
    const channelListeners = this.listeners.get(channel);
    if (!channelListeners) return;

    for (const listener of Array.from(channelListeners)) {
      try {
        listener(data);
      } catch (err) {
        console.error(`[EventBus] Listener error on channel "${channel}":`, err);
      }
    }
  }

  /**
   * Get the number of active listeners on a channel (for monitoring).
   */
  listenerCount(channel: string): number {
    return this.listeners.get(channel)?.size ?? 0;
  }
}

// Singleton — shared across all API route handlers in the same process
export const eventBus = new EventBus();

// ── Event channels ─────────────────────────────────────────────────────────────
export const CHANNELS = {
  APPOINTMENTS: "appointments",
  ORDERS: "orders",
  NOTIFICATIONS: "notifications",
} as const;

// ── Event types ────────────────────────────────────────────────────────────────
export interface AppointmentEvent {
  type: "created" | "updated" | "cancelled" | "completed" | "no_show";
  appointmentId: string;
  bookingRef?: string;
  clientName?: string;
  serviceName?: string;
  staffName?: string;
  status?: string;
  timestamp: string;
}

export interface OrderEvent {
  type: "created" | "paid" | "cancelled";
  orderId: string;
  orderRef?: string;
  clientName?: string;
  total?: number;
  timestamp: string;
}
