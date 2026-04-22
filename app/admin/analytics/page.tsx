"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart3, TrendingUp, IndianRupee, Calendar,
  RefreshCw, Loader2, ArrowUp, ArrowDown,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type RevenueData = {
  period: string;
  totalRevenue: number;
  appointmentRevenue: number;
  orderRevenue: number;
  totalTransactions: number;
  avgTransactionValue: number;
  growth?: number;
  daily?: { date: string; revenue: number; appointments: number; orders: number }[];
  topServices?: { name: string; revenue: number; count: number }[];
};

// ── Stat Card ──────────────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, sub, growth,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  growth?: number;
}) {
  const isPositive = (growth ?? 0) >= 0;
  return (
    <div className="bg-white rounded-sm border border-cream-darker/50 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold">
          {icon}
        </div>
        {growth !== undefined && (
          <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${isPositive ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600"}`}>
            {isPositive ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
            {Math.abs(growth).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="font-display text-2xl text-espresso font-bold">{value}</p>
      <p className="text-xs text-charcoal-lighter mt-0.5">{label}</p>
      {sub && <p className="text-xs text-charcoal-lighter/60 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

// Map frontend period labels to API-accepted values
const PERIOD_MAP: Record<string, string> = {
  "7d":  "week",
  "30d": "month",
  "90d": "month",  // API doesn't have 90d; fall back to month
  "1y":  "month",  // API doesn't have 1y; fall back to month
};

const PERIODS = [
  { label: "7 days",   value: "7d" },
  { label: "30 days",  value: "30d" },
  { label: "3 months", value: "90d" },
  { label: "1 year",   value: "1y" },
];

export default function AdminAnalyticsPage() {
  const [data, setData]       = useState<RevenueData | null>(null);
  const [period, setPeriod]   = useState("30d");
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiPeriod = PERIOD_MAP[period] ?? "month";
      const res  = await fetch(`/api/analytics/revenue?period=${apiPeriod}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load analytics.");
      // Map API response shape to component's RevenueData type
      const summary = json.summary ?? {};
      const mapped: RevenueData = {
        period: json.period ?? apiPeriod,
        totalRevenue:       summary.totalRevenue       ?? 0,
        appointmentRevenue: summary.servicesRevenue    ?? 0,
        orderRevenue:       summary.productsRevenue    ?? 0,
        totalTransactions:  (json.dailyRevenue?.reduce((s: number, d: any) => s + (d.appointments ?? 0) + (d.orders ?? 0), 0)) ?? 0,
        avgTransactionValue: summary.avgPerDay         ?? 0,
        growth:              summary.percentageChange  ?? undefined,
        daily: (json.dailyRevenue ?? []).map((d: any) => ({
          date:         d.date,
          revenue:      (d.services ?? 0) + (d.products ?? 0),
          appointments: d.appointments ?? 0,
          orders:       d.orders       ?? 0,
        })),
        topServices: (json.topServices ?? []).map((s: any) => ({
          name:    s.name,
          // API returns revenue as formatted string (₹...) — parse it back
          revenue: typeof s.revenue === "string" ? parseFloat(s.revenue.replace(/[^0-9.]/g, "")) || 0 : (s.revenue ?? 0),
          count:   s.count ?? 0,
        })),
      };
      setData(mapped);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load analytics.");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-xl text-espresso flex items-center gap-2">
            <BarChart3 size={20} className="text-gold" /> Analytics
          </h1>
          <p className="text-xs text-charcoal-lighter mt-0.5">Revenue insights and business performance</p>
        </div>
        <div className="flex gap-2 items-center">
          {/* Period tabs */}
          <div className="flex items-center gap-1 bg-cream/60 rounded-sm border border-cream-darker/30 p-1">
            {PERIODS.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-[3px] transition-all ${period === p.value ? "bg-espresso text-cream" : "text-charcoal-lighter hover:text-espresso"}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={load} className="btn-outline text-xs py-2 px-3 flex items-center gap-1.5">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-sm px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={load} className="text-xs text-red-500 underline">Try again</button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-gold" size={28} />
        </div>
      ) : data ? (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<IndianRupee size={18} />}  label="Total Revenue"          value={fmt(data.totalRevenue)}           growth={data.growth} />
            <StatCard icon={<Calendar size={18} />}      label="Appointment Revenue"    value={fmt(data.appointmentRevenue)}     />
            <StatCard icon={<TrendingUp size={18} />}    label="Order Revenue"          value={fmt(data.orderRevenue)}           />
            <StatCard icon={<BarChart3 size={18} />}     label="Avg. Transaction Value" value={fmt(data.avgTransactionValue)}    sub={`${data.totalTransactions} transactions`} />
          </div>

          {/* Daily breakdown */}
          {data.daily && data.daily.length > 0 && (
            <div className="bg-white rounded-sm border border-cream-darker/50 overflow-hidden">
              <div className="px-5 py-4 border-b border-cream-darker/20">
                <h2 className="font-display text-base text-espresso">Daily Breakdown</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-cream/50 border-b border-cream-darker/30">
                      <th className="text-left py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Date</th>
                      <th className="text-right py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Revenue</th>
                      <th className="text-right py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Appointments</th>
                      <th className="text-right py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...data.daily].reverse().slice(0, 14).map(day => (
                      <tr key={day.date} className="border-b border-cream-darker/10 hover:bg-cream/20 transition-colors">
                        <td className="py-3 px-4 text-charcoal-lighter text-xs">
                          {new Date(day.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-espresso">{fmt(day.revenue)}</td>
                        <td className="py-3 px-4 text-right text-charcoal-lighter">{day.appointments}</td>
                        <td className="py-3 px-4 text-right text-charcoal-lighter">{day.orders}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Top services */}
          {data.topServices && data.topServices.length > 0 && (
            <div className="bg-white rounded-sm border border-cream-darker/50 overflow-hidden">
              <div className="px-5 py-4 border-b border-cream-darker/20">
                <h2 className="font-display text-base text-espresso">Top Services by Revenue</h2>
              </div>
              <div className="divide-y divide-cream-darker/10">
                {data.topServices.map((svc, i) => {
                  const pct = data.totalRevenue > 0 ? (svc.revenue / data.totalRevenue) * 100 : 0;
                  return (
                    <div key={svc.name} className="px-5 py-3 flex items-center gap-4">
                      <span className="text-xs font-bold text-charcoal-lighter w-5">{i + 1}.</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-espresso">{svc.name}</p>
                        <div className="mt-1 h-1.5 bg-cream-darker/20 rounded-full overflow-hidden">
                          <div className="h-full bg-gold/60 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-espresso">{fmt(svc.revenue)}</p>
                        <p className="text-xs text-charcoal-lighter">{svc.count} appts</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
