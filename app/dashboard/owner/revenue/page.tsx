"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart3, TrendingUp, IndianRupee, Calendar, ArrowUpRight, ArrowDownRight, Scissors, Loader2, Download } from "lucide-react";

type DailyRevenue = {
    date: string;
    day: string;
    services: number;
    products: number;
    total: number;
};

type CategoryBreakdown = {
    name: string;
    revenue: string;
    appointments: number;
    share: number;
};

type TopService = {
    name: string;
    count: number;
    revenue: string;
};

type Summary = {
    totalRevenue: number;
    servicesRevenue: number;
    productsRevenue: number;
    avgPerDay: number;
    percentageChange: number;
};

type RevenueData = {
    dailyRevenue: DailyRevenue[];
    categoryBreakdown: CategoryBreakdown[];
    topServices: TopService[];
    summary: Summary;
    period: string;
};

export default function OwnerRevenuePage() {
    const [period, setPeriod] = useState<"today" | "week" | "month">("month");
    const [data, setData] = useState<RevenueData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRevenue = useCallback(async (p: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/analytics/revenue?period=${p}`);
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            const result: RevenueData = await res.json();
            setData(result);
        } catch (err: any) {
            console.error("Failed to fetch revenue data:", err);
            setError(err.message || "Failed to load revenue data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRevenue(period);
    }, [period, fetchRevenue]);

    const formatTrend = (change: number) => {
        const up = change >= 0;
        return {
            trend: `${up ? "+" : ""}${change}%`,
            up,
        };
    };

    const exportCSV = () => {
        if (!data) return;
        const headers = ["Date", "Day", "Services (₹)", "Products (₹)", "Total (₹)"];
        const rows = data.dailyRevenue.map((d) => [
            d.date,
            new Date(d.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
            d.services,
            d.products,
            d.total,
        ]);
        const csvContent = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([csvContent], { type: "text/csv;charset=utf-8;" }));
        a.download = `kanishkas-revenue-${period}-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <Loader2 className="animate-spin text-gold" size={32} />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="text-center py-24 text-charcoal-lighter">
                <p className="text-red-500 font-medium">{error || "No data available"}</p>
                <button 
                    onClick={() => fetchRevenue(period)} 
                    className="mt-4 btn-gold text-xs"
                >
                    Try Again
                </button>
            </div>
        );
    }

    const { dailyRevenue, categoryBreakdown, topServices, summary } = data;
    const maxRevenue = Math.max(...dailyRevenue.map((d) => d.total), 1);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h1 className="font-display text-xl text-espresso">Revenue Analytics</h1>
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex gap-1 bg-cream rounded-sm p-1">
                    {(["today", "week", "month"] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-sm capitalize transition-all ${period === p ? "bg-white text-espresso shadow-sm" : "text-charcoal-lighter hover:bg-white/50"}`}
                        >
                            {p === "today" ? "Today" : p === "week" ? "This Week" : "This Month"}
                        </button>
                    ))}
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => fetchRevenue(period)}
                            className="text-xs px-3 py-1.5 border border-charcoal/20 rounded-sm text-charcoal-lighter hover:border-gold/30 transition-colors"
                        >
                            Refresh
                        </button>
                        <button onClick={exportCSV}
                            className="text-xs px-3 py-1.5 border border-charcoal/20 rounded-sm text-charcoal-lighter hover:border-gold/30 transition-colors flex items-center gap-1">
                            Export CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Revenue Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Revenue", value: `₹${summary.totalRevenue.toLocaleString()}`, icon: <IndianRupee size={20} /> },
                    { label: "Services Revenue", value: `₹${summary.servicesRevenue.toLocaleString()}`, icon: <Scissors size={20} /> },
                    { label: "Product Sales", value: `₹${summary.productsRevenue.toLocaleString()}`, icon: <BarChart3 size={20} /> },
                    { label: "Avg. per Day", value: `₹${summary.avgPerDay.toLocaleString()}`, icon: <Calendar size={20} /> },
                ].map((stat, index) => {
                    const trend = index === 0 ? formatTrend(summary.percentageChange) : { trend: "N/A", up: true };
                    return (
                        <div key={stat.label} className="bg-white rounded-sm border border-cream-darker/50 p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-9 h-9 rounded-full bg-gold/10 flex items-center justify-center text-gold">{stat.icon}</div>
                                {index === 0 && (
                                    <span className={`text-xs font-semibold flex items-center gap-0.5 ${trend.up ? "text-green-500" : "text-red-500"}`}>
                                        {trend.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                        {trend.trend}
                                    </span>
                                )}
                            </div>
                            <p className="font-display text-2xl font-bold text-espresso">{stat.value}</p>
                            <p className="text-xs text-charcoal-lighter mt-0.5">{stat.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Bar Chart */}
            <div className="bg-white rounded-sm border border-cream-darker/50 p-6">
                <h2 className="font-display text-base text-espresso mb-6">
                    {period === "today" ? "Today's Revenue" : period === "week" ? "Weekly Revenue" : "Monthly Revenue"}
                </h2>
                {dailyRevenue.length > 0 ? (
                    <div className="flex items-end gap-3 h-48">
                        {dailyRevenue.map((day) => {
                            const height = (day.total / maxRevenue) * 100;
                            const servicesHeight = day.total > 0 ? (day.services / day.total) * height : 0;
                            const productsHeight = day.total > 0 ? (day.products / day.total) * height : 0;
                            return (
                                <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group">
                                    <div className="relative w-full flex flex-col justify-end" style={{ height: "100%" }}>
                                        {/* Tooltip */}
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-espresso text-cream text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                                            ₹{day.total.toLocaleString()}
                                        </div>
                                        <div className="w-full flex flex-col rounded-t-sm overflow-hidden transition-all">
                                            <div className="bg-gold hover:bg-gold-dark transition-colors" style={{ height: `${servicesHeight}%`, minHeight: servicesHeight > 0 ? "4px" : "0" }} />
                                            <div className="bg-rose-gold/60 hover:bg-rose-gold transition-colors" style={{ height: `${productsHeight}%`, minHeight: productsHeight > 0 ? "4px" : "0" }} />
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-charcoal-lighter font-medium">{day.day}</span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-48 text-charcoal-lighter">
                        No revenue data for this period
                    </div>
                )}
                <div className="flex items-center gap-6 mt-4 pt-3 border-t border-cream-darker/20">
                    <div className="flex items-center gap-2 text-xs text-charcoal-lighter">
                        <div className="w-3 h-3 rounded-sm bg-gold" /> Services
                    </div>
                    <div className="flex items-center gap-2 text-xs text-charcoal-lighter">
                        <div className="w-3 h-3 rounded-sm bg-rose-gold/60" /> Products
                    </div>
                </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white rounded-sm border border-cream-darker/50 p-6">
                <h2 className="font-display text-base text-espresso mb-4">Revenue by Category</h2>
                {categoryBreakdown.length > 0 ? (
                    <div className="space-y-3">
                        {categoryBreakdown.map((cat) => (
                            <div key={cat.name} className="flex items-center gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-sm text-espresso font-medium truncate">{cat.name}</p>
                                        <span className="text-sm font-bold text-espresso">{cat.revenue}</span>
                                    </div>
                                    <div className="w-full h-2 bg-cream rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-gold to-gold-light rounded-full transition-all" style={{ width: `${cat.share}%` }} />
                                    </div>
                                </div>
                                <span className="text-xs text-charcoal-lighter w-12 text-right">{cat.share}%</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-charcoal-lighter">
                        No category data available
                    </div>
                )}
            </div>

            {/* Top Services */}
            <div className="bg-white rounded-sm border border-cream-darker/50 p-6">
                <h2 className="font-display text-base text-espresso mb-4">Top Performing Services</h2>
                {topServices.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-cream-darker/30">
                                    <th className="text-left py-2 text-xs text-charcoal-lighter uppercase tracking-wider font-semibold">#</th>
                                    <th className="text-left py-2 text-xs text-charcoal-lighter uppercase tracking-wider font-semibold">Service</th>
                                    <th className="text-center py-2 text-xs text-charcoal-lighter uppercase tracking-wider font-semibold">Bookings</th>
                                    <th className="text-right py-2 text-xs text-charcoal-lighter uppercase tracking-wider font-semibold">Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topServices.map((svc, i) => (
                                    <tr key={svc.name} className="border-b border-cream-darker/10 hover:bg-cream/30 transition-colors">
                                        <td className="py-3 text-charcoal-lighter">{i + 1}</td>
                                        <td className="py-3 font-medium text-espresso">{svc.name}</td>
                                        <td className="py-3 text-center text-charcoal-lighter">{svc.count}</td>
                                        <td className="py-3 text-right font-bold text-espresso">{svc.revenue}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-charcoal-lighter">
                        No service data available
                    </div>
                )}
            </div>
        </div>
    );
}
