"use client";

// components/dashboard/NotificationDrawer.tsx
// Slide-over notification panel built on @radix-ui/react-dialog (already installed).
// Opens when the bell icon is clicked. Fetches last 5 notifications, marks all read on open.

import { useState, useEffect, useCallback } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Bell, X, CheckCheck, Calendar, ShoppingBag, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Notification = {
    id: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    type?: string;
};

interface Props {
    initialCount: number;
}

function notifIcon(type?: string) {
    if (type === "APPOINTMENT") return <Calendar size={14} className="text-gold" />;
    if (type === "ORDER") return <ShoppingBag size={14} className="text-blue-500" />;
    return <Info size={14} className="text-charcoal-lighter" />;
}

export default function NotificationDrawer({ initialCount }: Props) {
    const [open, setOpen] = useState(false);
    const [count, setCount] = useState(initialCount);
    const [notifs, setNotifs] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);

    const loadAndMarkRead = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/notifications?unreadOnly=false&limit=5");
            const data = await res.json();
            setNotifs(data.notifications ?? []);
            // Mark all unread as read
            const hasUnread = (data.notifications ?? []).some((n: Notification) => !n.isRead);
            if (hasUnread) {
                await fetch("/api/notifications", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ markAll: true }),
                });
                setCount(0);
            }
        } catch {
            // silent — drawer still opens with empty state
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (open) loadAndMarkRead();
    }, [open, loadAndMarkRead]);

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
                <button
                    title={`${count} notification${count !== 1 ? "s" : ""}`}
                    style={{
                        position: "relative",
                        width: 36, height: 36,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        borderRadius: 8,
                        border: "1px solid rgba(0,0,0,0.08)",
                        background: "rgba(255,255,255,0.6)",
                        cursor: "pointer",
                        color: "rgba(30,25,20,0.5)",
                        transition: "all 0.2s",
                    }}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "#C9A84C55";
                        (e.currentTarget as HTMLButtonElement).style.color = "#C9A84C";
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,0,0,0.08)";
                        (e.currentTarget as HTMLButtonElement).style.color = "rgba(30,25,20,0.5)";
                    }}
                >
                    <Bell size={15} />
                    {count > 0 && (
                        <span className="notif-badge" style={{
                            position: "absolute", top: -4, right: -4,
                            width: 16, height: 16,
                            background: "#C9A84C",
                            color: "#fff",
                            fontSize: 8.5, fontWeight: 700,
                            borderRadius: "50%",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 0 0 2px #F5F1EC, 0 2px 6px #C9A84C66",
                        }}>
                            {count > 9 ? "9+" : count}
                        </span>
                    )}
                </button>
            </Dialog.Trigger>

            {/* Overlay */}
            <Dialog.Portal>
                <Dialog.Overlay
                    style={{
                        position: "fixed", inset: 0, zIndex: 100,
                        background: "rgba(0,0,0,0.35)",
                        backdropFilter: "blur(4px)",
                        animation: "overlayIn 0.2s ease",
                    }}
                />

                {/* Slide-over panel from the right */}
                <Dialog.Content
                    style={{
                        position: "fixed", top: 0, right: 0, bottom: 0,
                        width: "min(380px, 92vw)",
                        zIndex: 101,
                        background: "#FDFAF5",
                        borderLeft: "1px solid rgba(0,0,0,0.07)",
                        boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
                        display: "flex", flexDirection: "column",
                        animation: "slideIn 0.25s cubic-bezier(0.22,1,0.36,1)",
                        outline: "none",
                    }}
                >
                    <style>{`
                        @keyframes overlayIn { from { opacity:0 } to { opacity:1 } }
                        @keyframes slideIn { from { transform:translateX(100%) } to { transform:translateX(0) } }
                    `}</style>

                    {/* Header */}
                    <div style={{
                        padding: "20px 20px 16px",
                        borderBottom: "1px solid rgba(0,0,0,0.06)",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}>
                        <div>
                            <Dialog.Title style={{
                                fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
                                fontSize: 18, fontWeight: 500, color: "#1A1510", margin: 0,
                            }}>
                                Notifications
                            </Dialog.Title>
                            {count === 0 && (
                                <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(60,50,40,0.4)", display: "flex", alignItems: "center", gap: 4 }}>
                                    <CheckCheck size={11} /> All caught up
                                </p>
                            )}
                        </div>
                        <Dialog.Close asChild>
                            <button style={{
                                width: 30, height: 30,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                borderRadius: 7, border: "1px solid rgba(0,0,0,0.08)",
                                background: "transparent", cursor: "pointer", color: "rgba(30,25,20,0.4)",
                            }}>
                                <X size={14} />
                            </button>
                        </Dialog.Close>
                    </div>

                    {/* Body */}
                    <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
                        {loading ? (
                            // Skeleton
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} style={{ padding: "14px 20px", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                                    <div style={{ height: 12, width: "60%", borderRadius: 4, background: "rgba(0,0,0,0.07)", marginBottom: 8, animation: "pulse 1.5s ease-in-out infinite" }} />
                                    <div style={{ height: 10, width: "85%", borderRadius: 4, background: "rgba(0,0,0,0.05)", animation: "pulse 1.5s ease-in-out infinite" }} />
                                    <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
                                </div>
                            ))
                        ) : notifs.length === 0 ? (
                            <div style={{ padding: "48px 20px", textAlign: "center" }}>
                                <Bell size={28} style={{ color: "rgba(0,0,0,0.12)", margin: "0 auto 10px" }} />
                                <p style={{ fontSize: 13, color: "rgba(60,50,40,0.4)", margin: 0 }}>No notifications yet</p>
                            </div>
                        ) : (
                            notifs.map(n => (
                                <div key={n.id} style={{
                                    padding: "14px 20px",
                                    borderBottom: "1px solid rgba(0,0,0,0.04)",
                                    background: n.isRead ? "transparent" : "rgba(201,168,76,0.04)",
                                    transition: "background 0.2s",
                                }}>
                                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                        <div style={{
                                            width: 28, height: 28, borderRadius: "50%",
                                            background: "rgba(201,168,76,0.1)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            flexShrink: 0, marginTop: 1,
                                        }}>
                                            {notifIcon(n.type)}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 500, color: "#1A1510", lineHeight: 1.35 }}>
                                                {n.title}
                                            </p>
                                            <p style={{ margin: "0 0 4px", fontSize: 12, color: "rgba(60,50,40,0.55)", lineHeight: 1.45 }}>
                                                {n.message}
                                            </p>
                                            <p style={{ margin: 0, fontSize: 10.5, color: "rgba(60,50,40,0.35)" }}>
                                                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>
                                        {!n.isRead && (
                                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#C9A84C", flexShrink: 0, marginTop: 5 }} />
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                        <a href="/dashboard/owner/appointments" style={{
                            display: "block", textAlign: "center",
                            fontSize: 12, color: "#C9A84C", fontWeight: 500,
                            textDecoration: "none", letterSpacing: "0.04em",
                        }}>
                            View all appointments →
                        </a>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
