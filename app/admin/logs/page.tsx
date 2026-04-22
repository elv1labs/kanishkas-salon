"use client";

import { useState, useEffect, useCallback } from "react";
import { ClipboardList, Search, Download, ChevronLeft, ChevronRight, Shield, User, Settings, Package, Calendar as CalendarIcon, CreditCard, Loader2, AlertCircle, Image as ImageIcon, FileText } from "lucide-react";

type LogEntry = {
    id: string;
    timestamp: string;
    user: string;
    role: string;
    action: string;
    rawAction: string;
    entity: string;
    entityId: string | null;
    details: string;
    ip: string;
};

type LogStats = { today: number; creates: number; updates: number; deletes: number };

const actionColors: Record<string, string> = {
    CREATE: "bg-green-50 text-green-700 border-green-200",
    UPDATE: "bg-blue-50 text-blue-700 border-blue-200",
    DELETE: "bg-red-50 text-red-600 border-red-200",
    AUTO: "bg-gray-100 text-gray-600 border-gray-200",
};

const roleColors: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-700",
    OWNER: "bg-gold/15 text-gold-dark",
    RECEPTIONIST: "bg-blue-100 text-blue-700",
    CLIENT: "bg-green-100 text-green-700",
    SYSTEM: "bg-gray-100 text-gray-600",
};

const entityIcons: Record<string, React.ReactNode> = {
    BusinessSettings: <Settings size={12} />,
    Settings: <Settings size={12} />,
    Service: <Package size={12} />,
    Appointment: <CalendarIcon size={12} />,
    User: <User size={12} />,
    Product: <Package size={12} />,
    BlogPost: <FileText size={12} />,
    Blog: <FileText size={12} />,
    GalleryItem: <ImageIcon size={12} />,
    Gallery: <ImageIcon size={12} />,
    Order: <CreditCard size={12} />,
    Loyalty: <Shield size={12} />,
    LoyaltyAccount: <Shield size={12} />,
};

const actionFilters = ["All", "CREATE", "UPDATE", "DELETE", "AUTO"];

export default function AdminLogsPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [stats, setStats] = useState<LogStats>({ today: 0, creates: 0, updates: 0, deletes: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionFilter, setActionFilter] = useState("All");
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalEntries, setTotalEntries] = useState(0);
    const perPage = 15;

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(t);
    }, [search]);

    const loadLogs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ page: page.toString(), limit: perPage.toString() });
            if (actionFilter !== "All") params.set("action", actionFilter);
            if (debouncedSearch) params.set("search", debouncedSearch);

            const res = await fetch(`/api/activity-logs?${params}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            setLogs(data.logs ?? []);
            setStats(data.stats ?? { today: 0, creates: 0, updates: 0, deletes: 0 });
            setTotalPages(data.pagination?.pages ?? 1);
            setTotalEntries(data.pagination?.total ?? 0);
        } catch (err: any) {
            console.error("Failed to load logs", err);
            setError(err.message || "Failed to load activity logs");
        } finally {
            setLoading(false);
        }
    }, [page, actionFilter, debouncedSearch]);

    useEffect(() => { loadLogs(); }, [loadLogs]);

    // Reset page when filters change
    useEffect(() => { setPage(1); }, [actionFilter, debouncedSearch]);

    const handleExport = () => {
        const csvRows = [
            ["Timestamp", "User", "Role", "Action", "Entity", "Details", "IP"].join(","),
            ...logs.map(l => [
                new Date(l.timestamp).toISOString(),
                `"${l.user}"`,
                l.role,
                l.action,
                l.entity,
                `"${l.details.replace(/"/g, '""')}"`,
                l.ip,
            ].join(",")),
        ];
        const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const formatTimestamp = (ts: string) => {
        const d = new Date(ts);
        return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }) + ", " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h1 className="font-display text-xl text-espresso">System Audit Logs</h1>
                <button onClick={handleExport} disabled={logs.length === 0} className="btn-outline text-xs py-2 px-4 disabled:opacity-40">
                    <Download size={14} className="mr-1.5" /> Export Logs
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Today", value: loading ? "—" : stats.today.toString() },
                    { label: "Creates", value: loading ? "—" : stats.creates.toString() },
                    { label: "Updates", value: loading ? "—" : stats.updates.toString() },
                    { label: "Deletes", value: loading ? "—" : stats.deletes.toString() },
                ].map((s) => (
                    <div key={s.label} className="bg-white rounded-sm border border-cream-darker/50 p-3 text-center">
                        <p className="font-display text-xl font-bold text-espresso">{s.value}</p>
                        <p className="text-[10px] text-charcoal-lighter">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Search & Filter */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-lighter" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search logs..."
                        className="w-full bg-white border border-cream-darker/50 rounded-sm py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-gold/40 transition-all" />
                </div>
                <div className="flex gap-1 bg-cream rounded-sm p-1">
                    {actionFilters.map((f) => (
                        <button key={f} onClick={() => setActionFilter(f)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-sm transition-all ${actionFilter === f ? "bg-white text-espresso shadow-sm" : "text-charcoal-lighter hover:bg-white/50"}`}>
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Loading / Error */}
            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gold" size={28} /></div>
            ) : error ? (
                <div className="bg-white rounded-sm border border-red-200 p-10 text-center">
                    <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                    <p className="text-red-500 text-sm font-medium">{error}</p>
                    <button onClick={loadLogs} className="mt-3 btn-gold text-xs py-2 px-4">Retry</button>
                </div>
            ) : logs.length === 0 ? (
                <div className="bg-white rounded-sm border border-cream-darker/50 p-10 text-center">
                    <ClipboardList className="w-10 h-10 text-cream-darker mx-auto mb-3" />
                    <p className="text-charcoal-lighter text-sm">No activity logs found{debouncedSearch ? ` for "${debouncedSearch}"` : ""}.</p>
                </div>
            ) : (
                /* Log Table */
                <div className="bg-white rounded-sm border border-cream-darker/50 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-cream/50 border-b border-cream-darker/30">
                                    <th className="text-left py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider font-semibold">Timestamp</th>
                                    <th className="text-left py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider font-semibold">User</th>
                                    <th className="text-center py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider font-semibold">Action</th>
                                    <th className="text-left py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider font-semibold">Entity</th>
                                    <th className="text-left py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider font-semibold">Details</th>
                                    <th className="text-right py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider font-semibold">IP</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id} className="border-b border-cream-darker/10 hover:bg-cream/20 transition-colors">
                                        <td className="py-3 px-4 text-xs text-charcoal-lighter whitespace-nowrap">{formatTimestamp(log.timestamp)}</td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-espresso text-xs">{log.user}</span>
                                                <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${roleColors[log.role] ?? "bg-gray-100 text-gray-600"}`}>{log.role}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${actionColors[log.action] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>{log.action}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="inline-flex items-center gap-1 text-xs text-charcoal-lighter">
                                                {entityIcons[log.entity] ?? <ClipboardList size={12} />} {log.entity}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-xs text-charcoal-lighter max-w-[200px] truncate">{log.details || "—"}</td>
                                        <td className="py-3 px-4 text-right font-mono text-[10px] text-charcoal-lighter/60">{log.ip}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-4 py-3 bg-cream/30 border-t border-cream-darker/20">
                        <span className="text-xs text-charcoal-lighter">
                            Page {page} of {totalPages} · {totalEntries} entries
                        </span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                                className="w-8 h-8 rounded-sm bg-white border border-cream-darker/50 flex items-center justify-center text-charcoal-lighter hover:text-espresso disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                                <ChevronLeft size={14} />
                            </button>
                            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                                className="w-8 h-8 rounded-sm bg-white border border-cream-darker/50 flex items-center justify-center text-charcoal-lighter hover:text-espresso disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
