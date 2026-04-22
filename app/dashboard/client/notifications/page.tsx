"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, Loader2, Check, CheckCheck, Trash2 } from "lucide-react";
import Link from "next/link";

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    actionUrl: string | null;
    isRead: boolean;
    createdAt: string;
}

export default function ClientNotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/notifications?limit=50");
            const data = await res.json();
            setNotifications(data.notifications ?? []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

    const markRead = async (id: string) => {
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, isRead: true }),
            });
            setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
        } catch (e) { console.error(e); }
    };

    const markAllRead = async () => {
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ markAllRead: true }),
            });
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        } catch (e) { console.error(e); }
    };

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    const typeIcon = (type: string) => {
        switch (type) {
            case "APPOINTMENT_CONFIRMED": return "📅";
            case "APPOINTMENT_REMINDER": return "⏰";
            case "APPOINTMENT_CANCELLED": return "❌";
            case "ORDER_UPDATE": return "📦";
            case "LOYALTY_POINTS": return "⭐";
            case "VOUCHER_EXPIRY": return "🎁";
            case "PROMOTIONAL": return "📢";
            default: return "🔔";
        }
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-2xl text-espresso flex items-center gap-2">
                        <Bell className="text-gold" size={22} /> Notifications
                    </h1>
                    <p className="text-sm text-charcoal-lighter mt-1">
                        {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "You're all caught up!"}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button onClick={markAllRead}
                        className="flex items-center gap-1.5 text-sm text-gold hover:text-gold-dark transition-colors">
                        <CheckCheck size={16} /> Mark all read
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gold" size={28} /></div>
            ) : notifications.length === 0 ? (
                <div className="text-center py-16 text-charcoal-lighter">
                    <Bell size={48} className="mx-auto mb-3 opacity-20" />
                    <p className="text-lg font-display text-espresso mb-1">No notifications yet</p>
                    <p className="text-sm">We&apos;ll notify you about appointments, orders, and rewards here.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {notifications.map((n) => (
                        <div key={n.id}
                            className={`bg-white rounded-sm border p-4 transition-all ${n.isRead ? "border-cream-darker/30" : "border-gold/30 bg-gold/[0.02]"}`}>
                            <div className="flex items-start gap-3">
                                <span className="text-lg flex-shrink-0 mt-0.5">{typeIcon(n.type)}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className={`text-sm font-medium ${n.isRead ? "text-charcoal" : "text-espresso"}`}>{n.title}</h3>
                                        <span className="text-xs text-charcoal-lighter flex-shrink-0">{timeAgo(n.createdAt)}</span>
                                    </div>
                                    <p className="text-sm text-charcoal-lighter mt-0.5 leading-relaxed">{n.message}</p>
                                    <div className="flex items-center gap-3 mt-2">
                                        {n.actionUrl && (
                                            <Link href={n.actionUrl}
                                                className="text-xs text-gold hover:text-gold-dark font-medium transition-colors">
                                                View Details →
                                            </Link>
                                        )}
                                        {!n.isRead && (
                                            <button onClick={() => markRead(n.id)}
                                                className="text-xs text-charcoal-lighter hover:text-charcoal flex items-center gap-1 transition-colors">
                                                <Check size={12} /> Mark read
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {!n.isRead && <div className="w-2 h-2 rounded-full bg-gold flex-shrink-0 mt-2" />}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
