"use client";

import { useState, useEffect, useCallback } from "react";
import { BarChart3, Loader2, TrendingUp, Star, Users, IndianRupee } from "lucide-react";

interface StaffAnalytics {
    id: string;
    name: string;
    specializations: string[];
    totalAppointments: number;
    completed: number;
    cancelled: number;
    noShows: number;
    completionRate: number;
    revenue: number;
    avgRating: number | null;
    reviewCount: number;
}

export default function StaffAnalyticsPage() {
    const [analytics, setAnalytics] = useState<StaffAnalytics[]>([]);
    const [loading, setLoading] = useState(true);
    const [months, setMonths] = useState(3);
    const [period, setPeriod] = useState<{ from: string; to: string } | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/analytics/staff?months=${months}`);
            const data = await res.json();
            setAnalytics(data.analytics ?? []);
            setPeriod(data.period ?? null);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [months]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const totalRevenue = analytics.reduce((s, a) => s + a.revenue, 0);
    const totalAppts = analytics.reduce((s, a) => s + a.totalAppointments, 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="font-display text-2xl text-espresso flex items-center gap-2">
                        <BarChart3 className="text-gold" size={22} /> Staff Analytics
                    </h1>
                    <p className="text-sm text-charcoal-lighter mt-1">
                        Performance metrics for your team
                        {period && <> · {new Date(period.from).toLocaleDateString("en-IN", { month: "short", year: "numeric" })} — {new Date(period.to).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</>}
                    </p>
                </div>
                <div className="flex gap-2">
                    {[1, 3, 6, 12].map((m) => (
                        <button key={m} onClick={() => setMonths(m)}
                            className={`px-3 py-1.5 text-xs rounded-sm border transition-all ${months === m ? "border-gold bg-gold/10 text-gold font-medium" : "border-cream-darker text-charcoal-lighter hover:border-gold/30"}`}>
                            {m === 1 ? "1M" : m === 3 ? "3M" : m === 6 ? "6M" : "1Y"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-sm border border-cream-darker/50 p-4">
                    <div className="flex items-center gap-2 mb-2"><Users size={16} className="text-blue-500" /><span className="text-xs text-charcoal-lighter">Staff Members</span></div>
                    <p className="font-display text-2xl text-espresso">{analytics.length}</p>
                </div>
                <div className="bg-white rounded-sm border border-cream-darker/50 p-4">
                    <div className="flex items-center gap-2 mb-2"><TrendingUp size={16} className="text-green-500" /><span className="text-xs text-charcoal-lighter">Total Appointments</span></div>
                    <p className="font-display text-2xl text-espresso">{totalAppts}</p>
                </div>
                <div className="bg-white rounded-sm border border-cream-darker/50 p-4">
                    <div className="flex items-center gap-2 mb-2"><IndianRupee size={16} className="text-gold" /><span className="text-xs text-charcoal-lighter">Total Revenue</span></div>
                    <p className="font-display text-2xl text-espresso">₹{totalRevenue.toLocaleString("en-IN")}</p>
                </div>
                <div className="bg-white rounded-sm border border-cream-darker/50 p-4">
                    <div className="flex items-center gap-2 mb-2"><Star size={16} className="text-amber-500" /><span className="text-xs text-charcoal-lighter">Avg Rating</span></div>
                    <p className="font-display text-2xl text-espresso">
                        {analytics.filter((a) => a.avgRating).length > 0
                            ? (analytics.reduce((s, a) => s + (a.avgRating ?? 0), 0) / analytics.filter((a) => a.avgRating).length).toFixed(1)
                            : "—"}
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gold" size={28} /></div>
            ) : analytics.length === 0 ? (
                <div className="text-center py-12 text-charcoal-lighter">No staff data available.</div>
            ) : (
                <div className="bg-white rounded-sm border border-cream-darker/50 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-cream text-left">
                                    <th className="px-4 py-3 font-medium text-charcoal">Staff</th>
                                    <th className="px-4 py-3 font-medium text-charcoal text-center">Appts</th>
                                    <th className="px-4 py-3 font-medium text-charcoal text-center">Completed</th>
                                    <th className="px-4 py-3 font-medium text-charcoal text-center">Rate</th>
                                    <th className="px-4 py-3 font-medium text-charcoal text-right">Revenue</th>
                                    <th className="px-4 py-3 font-medium text-charcoal text-center">Rating</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-cream-darker/30">
                                {analytics.map((s) => (
                                    <tr key={s.id} className="hover:bg-cream/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-espresso">{s.name}</p>
                                            {s.specializations.length > 0 && <p className="text-xs text-charcoal-lighter">{s.specializations.join(", ")}</p>}
                                        </td>
                                        <td className="px-4 py-3 text-center">{s.totalAppointments}</td>
                                        <td className="px-4 py-3 text-center text-green-600">{s.completed}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`font-medium ${s.completionRate >= 80 ? "text-green-600" : s.completionRate >= 50 ? "text-amber-600" : "text-red-500"}`}>
                                                {s.completionRate}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono">₹{s.revenue.toLocaleString("en-IN")}</td>
                                        <td className="px-4 py-3 text-center">
                                            {s.avgRating ? (
                                                <span className="text-gold font-medium">{s.avgRating} <span className="text-xs text-charcoal-lighter">({s.reviewCount})</span></span>
                                            ) : (
                                                <span className="text-charcoal-lighter text-xs">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
