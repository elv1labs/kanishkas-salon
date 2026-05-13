"use client";

// components/dashboard/MetricsPanel.tsx
// Client component: owns auto-refresh logic (60s interval + manual), lastUpdated timestamp,
// metric card rendering with empty-state UX and error state.

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TrendingUp, Calendar, ShoppingBag, Users, RefreshCw, AlertTriangle, Scissors, Package, UserCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Stats = {
    todayRevenue: number;
    todayAppts: number;
    pendingOrders: number;
    totalClients: number;
    totalServices?: number;
    activeProducts?: number;
    totalStaff?: number;
    error?: boolean;
};

interface Props {
    stats: Stats;
}

type CardDef = {
    icon: React.ReactNode;
    value: number | string;
    rawValue: number;
    label: string;
    href: string;
    emptyLabel: string;
    emptyHref: string;
    emptyAction: string;
};

export default function MetricsPanel({ stats }: Props) {
    const router = useRouter();
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [refreshing, setRefreshing] = useState(false);
    const [errorDismissed, setErrorDismissed] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Update lastUpdated whenever stats prop changes (i.e. after a server refresh)
    const prevStatsRef = useRef<string>("");
    useEffect(() => {
        const key = JSON.stringify(stats);
        if (key !== prevStatsRef.current) {
            prevStatsRef.current = key;
            setLastUpdated(new Date());
            setRefreshing(false);
        }
    }, [stats]);

    const doRefresh = useCallback(() => {
        setRefreshing(true);
        router.refresh();
        // Reset the 60s timer on manual refresh
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            router.refresh();
        }, 60_000);
    }, [router]);

    // Auto-refresh every 60s
    useEffect(() => {
        timerRef.current = setInterval(() => {
            router.refresh();
        }, 60_000);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [router]);

    const cards: CardDef[] = [
        {
            icon: <TrendingUp size={20} className="text-green-500" />,
            value: `Rs.${Number(stats.todayRevenue).toLocaleString("en-IN")}`,
            rawValue: stats.todayRevenue,
            label: "Today's Revenue",
            href: "/dashboard/owner/revenue",
            emptyLabel: "No revenue yet today",
            emptyHref: "/dashboard/owner/appointments",
            emptyAction: "View bookings",
        },
        {
            icon: <Calendar size={20} className="text-gold" />,
            value: stats.todayAppts,
            rawValue: stats.todayAppts,
            label: "Today's Appointments",
            href: "/dashboard/owner/appointments",
            emptyLabel: "No appointments today",
            emptyHref: "/dashboard/owner/appointments",
            emptyAction: "Schedule one",
        },
        {
            icon: <ShoppingBag size={20} className="text-blue-500" />,
            value: stats.pendingOrders,
            rawValue: stats.pendingOrders,
            label: "Pending Orders",
            href: "/dashboard/owner/orders",
            emptyLabel: "No pending orders",
            emptyHref: "/dashboard/owner/orders",
            emptyAction: "View orders",
        },
        {
            icon: <Users size={20} className="text-rose-gold" />,
            value: stats.totalClients,
            rawValue: stats.totalClients,
            label: "Total Clients",
            href: "/dashboard/receptionist/clients",
            emptyLabel: "No clients yet",
            emptyHref: "/dashboard/receptionist/clients",
            emptyAction: "View clients",
        },
        {
            icon: <Scissors size={20} className="text-purple-500" />,
            value: stats.totalServices ?? 0,
            rawValue: stats.totalServices ?? 0,
            label: "Total Services",
            href: "/admin/services",
            emptyLabel: "No services yet",
            emptyHref: "/admin/services",
            emptyAction: "Add services",
        },
        {
            icon: <Package size={20} className="text-teal-500" />,
            value: stats.activeProducts ?? 0,
            rawValue: stats.activeProducts ?? 0,
            label: "Active Products",
            href: "/dashboard/owner/products",
            emptyLabel: "No active products",
            emptyHref: "/dashboard/owner/products",
            emptyAction: "View products",
        },
        {
            icon: <UserCheck size={20} className="text-amber-600" />,
            value: stats.totalStaff ?? 0,
            rawValue: stats.totalStaff ?? 0,
            label: "Active Staff",
            href: "/admin/staff",
            emptyLabel: "No active staff",
            emptyHref: "/admin/staff",
            emptyAction: "View staff",
        },
    ];

    const isError = stats.error === true;

    return (
        <div className="space-y-4">
            {/* ── Error banner ── */}
            {isError && !errorDismissed && (
                <div style={{
                    display: "flex", alignItems: "flex-start", gap: 12,
                    padding: "12px 16px",
                    background: "rgba(251,191,36,0.08)",
                    border: "1px solid rgba(251,191,36,0.35)",
                    borderRadius: 8,
                }}>
                    <AlertTriangle size={16} style={{ color: "#D97706", flexShrink: 0, marginTop: 1 }} />
                    <p style={{ flex: 1, margin: 0, fontSize: 13, color: "#92400E", lineHeight: 1.5 }}>
                        Dashboard data could not be loaded — showing last known values.{" "}
                        <button
                            onClick={doRefresh}
                            style={{
                                background: "none", border: "none", cursor: "pointer",
                                color: "#B45309", fontWeight: 600, fontSize: 13,
                                padding: 0, textDecoration: "underline",
                            }}
                        >
                            Retry
                        </button>
                    </p>
                    <button
                        onClick={() => setErrorDismissed(true)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#92400E", padding: 2, flexShrink: 0, lineHeight: 1 }}
                        aria-label="Dismiss"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* ── Section header: last updated + refresh ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                <span style={{ fontSize: 11, color: "rgba(60,50,40,0.4)", fontVariantNumeric: "tabular-nums" }}>
                    Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
                </span>
                <button
                    onClick={doRefresh}
                    disabled={refreshing}
                    title="Refresh metrics"
                    style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        width: 28, height: 28, borderRadius: 7,
                        border: "1px solid rgba(0,0,0,0.08)",
                        background: "rgba(255,255,255,0.7)",
                        cursor: refreshing ? "not-allowed" : "pointer",
                        color: refreshing ? "rgba(0,0,0,0.25)" : "rgba(60,50,40,0.5)",
                        transition: "all 0.2s",
                    }}
                >
                    <RefreshCw
                        size={12}
                        style={{ transition: "transform 0.4s", transform: refreshing ? "rotate(180deg)" : "rotate(0deg)" }}
                    />
                </button>
            </div>

            {/* ── Metric cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card) => (
                    <Link
                        key={card.label}
                        href={card.href}
                        className="bg-white rounded-sm border border-cream-darker/50 p-5 hover:shadow-md hover:border-gold/20 transition-all group"
                        style={{ textDecoration: "none" }}
                    >
                        {/* Icon + arrow */}
                        <div className="flex items-center justify-between mb-3">
                            {card.icon}
                            <span style={{
                                fontSize: 11, color: "rgba(201,168,76,0.7)",
                                transition: "transform 0.2s, color 0.2s",
                            }}
                                className="group-hover:text-gold"
                            >
                                ↗
                            </span>
                        </div>

                        {/* Value */}
                        {isError ? (
                            <div className="flex items-center gap-2 mb-0.5">
                                <p className="font-display text-2xl text-espresso">—</p>
                                <span style={{
                                    width: 7, height: 7, borderRadius: "50%",
                                    background: "#EF4444", flexShrink: 0,
                                    boxShadow: "0 0 0 2px rgba(239,68,68,0.2)",
                                }} />
                            </div>
                        ) : (
                            <p className="font-display text-2xl text-espresso">{card.value}</p>
                        )}

                        {/* Label */}
                        <p className="text-xs text-charcoal-lighter mt-0.5">{card.label}</p>

                        {/* Empty-state CTA — only when value is 0 and no error */}
                        {!isError && card.rawValue === 0 && (
                            <p style={{ marginTop: 8, fontSize: 11, color: "rgba(60,50,40,0.4)", lineHeight: 1.4 }}>
                                {card.emptyLabel}{" "}
                                <span
                                    style={{ color: "#C9A84C", fontWeight: 500 }}
                                    onClick={e => e.stopPropagation()}
                                >
                                    <Link href={card.emptyHref} style={{ color: "#C9A84C", textDecoration: "none" }}>
                                        {card.emptyAction} →
                                    </Link>
                                </span>
                            </p>
                        )}
                    </Link>
                ))}
            </div>
        </div>
    );
}
