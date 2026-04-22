// hooks/useSSE.ts
// React hook for consuming Server-Sent Events from the admin SSE endpoint.
// Provides real-time updates for appointments and orders.
//
// Usage:
//   const { events, isConnected, connectionError } = useSSE();
//   // events is an array of the latest events (max 50, LIFO)

"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface SSEEvent {
  type: string;          // "appointment" | "order" | "connected"
  data: any;
  receivedAt: Date;
}

interface UseSSEOptions {
  /** Max events to keep in buffer (default: 50) */
  maxEvents?: number;
  /** Auto-reconnect delay in ms (default: 3000) */
  reconnectDelay?: number;
  /** Enable/disable connection (default: true) */
  enabled?: boolean;
}

export function useSSE(opts: UseSSEOptions = {}) {
  const { maxEvents = 50, reconnectDelay = 3000, enabled = true } = opts;
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addEvent = useCallback((type: string, data: any) => {
    setEvents((prev) => {
      const newEvent: SSEEvent = { type, data, receivedAt: new Date() };
      const updated = [newEvent, ...prev];
      return updated.slice(0, maxEvents);
    });
  }, [maxEvents]);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource("/api/sse/appointments");
    eventSourceRef.current = es;

    es.addEventListener("connected", (e) => {
      setIsConnected(true);
      setConnectionError(null);
      try {
        addEvent("connected", JSON.parse(e.data));
      } catch {}
    });

    es.addEventListener("appointment", (e) => {
      try {
        addEvent("appointment", JSON.parse(e.data));
      } catch {}
    });

    es.addEventListener("order", (e) => {
      try {
        addEvent("order", JSON.parse(e.data));
      } catch {}
    });

    es.onerror = () => {
      setIsConnected(false);
      setConnectionError("Connection lost. Reconnecting...");
      es.close();
      eventSourceRef.current = null;

      // Auto-reconnect
      reconnectTimer.current = setTimeout(() => {
        if (enabled) connect();
      }, reconnectDelay);
    };
  }, [enabled, reconnectDelay, addEvent]);

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    events,
    isConnected,
    connectionError,
    clearEvents,
    disconnect,
    reconnect: connect,
  };
}
