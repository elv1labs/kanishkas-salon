"use client";
import { extractApiError } from "@/lib/extract-error";
import { useState, useEffect, useCallback, useRef } from "react";
import {
    GraduationCap, Clock, CheckCircle, XCircle,
    Loader2, RefreshCw, MessageSquare, Phone, Mail,
    IndianRupee, X, AlertCircle, ChevronLeft, ChevronRight, Search,
} from "lucide-react";

type EnrollmentStatus = "ENQUIRY" | "ENROLLED" | "ACTIVE" | "COMPLETED" | "DROPPED";
type PaymentMethod = "UPI" | "CASH" | "CARD";

type Enrollment = {
    id: string; studentName: string; email: string; phone: string;
    status: EnrollmentStatus; paymentStatus: string; paymentMethod?: PaymentMethod | null;
    note: string | null; createdAt: string; paymentAmount?: string | null;
    course: { id: string; name: string; price: string };
    user: { id: string; name: string; email: string; phone: string | null } | null;
};

const statusConfig: Record<EnrollmentStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    ENQUIRY:    { label: "Enquiry",    color: "text-amber-700",  bg: "bg-amber-50 border-amber-200",   icon: <Clock size={11} /> },
    ENROLLED:   { label: "Enrolled",   color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",     icon: <GraduationCap size={11} /> },
    ACTIVE:     { label: "Active",     color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200", icon: <GraduationCap size={11} /> },
    COMPLETED:  { label: "Completed",  color: "text-teal-700",   bg: "bg-teal-50 border-teal-200",     icon: <CheckCircle size={11} /> },
    DROPPED:    { label: "Dropped",    color: "text-red-600",    bg: "bg-red-50 border-red-200",       icon: <XCircle size={11} /> },
};

const FILTERS = ["All", "ENQUIRY", "ENROLLED", "ACTIVE", "COMPLETED", "DROPPED"];
const PAGE_SIZE = 20;

function CancelModal({ enrollment, onClose, onSuccess }: { enrollment: Enrollment; onClose: () => void; onSuccess: () => void }) {
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    const handleConfirm = async () => {
        setLoading(true); setError("");
        try {
            const res = await fetch(`/api/academy/enrollments/${enrollment.id}`, {
                method: "PATCH", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "cancel", note: note.trim() || undefined }),
            });
            const data = await res.json();
            if (!res.ok) { setError(extractApiError(data, "Failed to cancel.")); return; }
            onSuccess(); onClose();
        } catch { setError("Network error. Please try again."); }
        finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-cream-darker/30">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={18} className="text-red-500" />
                        <h2 className="font-display text-lg text-espresso font-bold">Cancel Enrollment</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-cream/60 text-charcoal-lighter transition-colors"><X size={16} /></button>
                </div>
                <div className="px-6 py-5 space-y-4">
                    <p className="text-sm text-charcoal">Cancel <strong>{enrollment.studentName}</strong>'s enrollment in <strong>{enrollment.course.name}</strong>?</p>
                    <div>
                        <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">Reason / Note (optional)</label>
                        <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} maxLength={300}
                            placeholder="e.g. Student requested cancellation, course full..."
                            className="w-full border border-cream-darker rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-gold/50 resize-none" />
                    </div>
                    {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}
                </div>
                <div className="px-6 py-4 border-t border-cream-darker/30 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 text-sm border border-cream-darker/50 rounded-md text-charcoal-lighter hover:border-gold/30 transition-colors">Keep Enrollment</button>
                    <button onClick={handleConfirm} disabled={loading}
                        className="flex-1 py-2.5 text-sm bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                        {loading ? <><Loader2 size={14} className="animate-spin" /> Cancelling…</> : <><XCircle size={14} /> Confirm Cancel</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

function MarkPaidModal({ enrollment, onClose, onSuccess }: { enrollment: Enrollment; onClose: () => void; onSuccess: () => void }) {
    const [method, setMethod] = useState<PaymentMethod>("CASH");
    const [amount, setAmount] = useState(String(Number(enrollment.course.price)));
    const [ref, setRef] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const overlayRef = useRef<HTMLDivElement>(null);

    const METHODS: PaymentMethod[] = ["CASH", "UPI", "CARD"];
    const METHOD_LABELS: Record<PaymentMethod, string> = { CASH: "Cash", UPI: "UPI", CARD: "Card" };

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    const handleSubmit = async () => {
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) { setError("Please enter a valid amount."); return; }
        setLoading(true); setError("");
        try {
            const res = await fetch(`/api/academy/enrollments/${enrollment.id}/mark-paid`, {
                method: "PATCH", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentMethod: method, paymentAmount: parsedAmount, transactionRef: ref.trim() || null }),
            });
            const data = await res.json();
            if (!res.ok) { setError(extractApiError(data, "Failed to record payment.")); return; }
            onSuccess(); onClose();
        } catch { setError("Network error. Please try again."); }
        finally { setLoading(false); }
    };

    return (
        <div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
            onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-cream-darker/30">
                    <div>
                        <h2 className="font-display text-lg text-espresso font-bold">Record Payment</h2>
                        <p className="text-xs text-charcoal-lighter mt-0.5">{enrollment.studentName} · {enrollment.course.name}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-cream/60 text-charcoal-lighter transition-colors"><X size={16} /></button>
                </div>
                <div className="px-6 py-5 space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-2">Payment Method</label>
                        <div className="grid grid-cols-3 gap-2">
                            {METHODS.map(m => (
                                <button key={m} onClick={() => setMethod(m)}
                                    className={`py-2.5 rounded-md border-2 text-xs font-semibold transition-all ${
                                        method === m ? "border-gold bg-gold/10 text-espresso" : "border-cream-darker/50 text-charcoal-lighter hover:border-gold/30"
                                    }`}>{METHOD_LABELS[m]}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-2">Amount (₹)</label>
                        <div className="relative">
                            <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-lighter" />
                            <input type="number" min="1" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
                                className="w-full bg-white border border-cream-darker/50 rounded-md py-2.5 pl-9 pr-4 text-sm font-medium text-espresso focus:outline-none focus:border-gold/50" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-2">
                            {method === "UPI" ? "UTR Reference (optional)" : method === "CARD" ? "Card Last 4 (optional)" : "Receipt No. (optional)"}
                        </label>
                        <input type="text" value={ref} onChange={e => setRef(e.target.value)}
                            placeholder={method === "UPI" ? "e.g. 123456789012" : method === "CARD" ? "e.g. 4242" : "e.g. RC-001"}
                            className="w-full bg-white border border-cream-darker/50 rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-gold/50" />
                    </div>
                    {error && <div className="bg-red-50 border border-red-200 rounded-md px-4 py-2.5"><p className="text-sm text-red-600">{error}</p></div>}
                </div>
                <div className="px-6 py-4 border-t border-cream-darker/30 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 text-sm border border-cream-darker/50 rounded-md text-charcoal-lighter hover:border-gold/30 transition-colors">Cancel</button>
                    <button onClick={handleSubmit} disabled={loading}
                        className="flex-1 py-2.5 text-sm bg-espresso text-cream rounded-md font-semibold hover:bg-espresso/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                        {loading ? <><span className="inline-block w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin" /> Saving...</> : <><CheckCircle size={15} /> Confirm Payment</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AcademyEnrollmentsPage() {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("All");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [confirming, setConfirming] = useState<string | null>(null);
    const [cancelTarget, setCancelTarget] = useState<Enrollment | null>(null);
    const [markPaidTarget, setMarkPaidTarget] = useState<Enrollment | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
            if (filter !== "All") params.set("status", filter);
            if (search.trim()) params.set("search", search.trim());

            const [enrollmentsRes, statsRes] = await Promise.all([
                fetch(`/api/academy/enrollments?${params}`),
                fetch("/api/academy/enrollments/stats"),
            ]);

            const data = await enrollmentsRes.json();
            const statsData = await statsRes.json();

            setEnrollments(data.enrollments ?? []);
            setTotal(data.total ?? 0);
            setCounts(statsData.counts ?? {});
        } catch (e) { console.error("Failed to load enrollments", e); }
        finally { setLoading(false); }
    }, [filter, search, page]);

    useEffect(() => { load(); }, [load]);

    const totalPages = Math.ceil(total / PAGE_SIZE);

    const handleConfirm = async (enrollment: Enrollment) => {
        setConfirming(enrollment.id);
        try {
            const res = await fetch(`/api/academy/enrollments/${enrollment.id}`, {
                method: "PATCH", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "confirm" }),
            });
            if (res.ok) load();
        } catch (e) { console.error("Failed to confirm enrollment", e); }
        finally { setConfirming(null); }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-xl text-espresso">Academy Enrollment Requests</h1>
                    <p className="text-xs text-charcoal-lighter mt-0.5">Review and confirm student enrollment applications</p>
                </div>
                <button onClick={load} className="flex items-center gap-1.5 text-xs text-charcoal-lighter hover:text-gold transition-colors">
                    <RefreshCw size={13} /> Refresh
                </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                    { key: "ALL", label: "All", color: "text-charcoal" },
                    { key: "ENQUIRY", label: "Enquiry", color: "text-amber-600" },
                    { key: "ENROLLED", label: "Enrolled", color: "text-blue-600" },
                    { key: "ACTIVE", label: "Active", color: "text-indigo-600" },
                    { key: "COMPLETED", label: "Completed", color: "text-teal-600" },
                    { key: "DROPPED", label: "Dropped", color: "text-red-600" },
                ].map(s => {
                    const cnt = s.key === "ALL" ? Object.values(counts).reduce((a, b) => a + b, 0) : (counts[s.key] ?? 0);
                    return (
                        <button key={s.key} onClick={() => { setFilter(s.key); setPage(1); }}
                            className={`bg-white rounded-sm border p-3 text-center hover:border-gold/30 transition-all ${filter === s.key ? "border-gold shadow-sm" : "border-cream-darker/30"}`}>
                            <p className={`font-display text-xl font-bold ${s.color}`}>{loading ? "—" : cnt}</p>
                            <p className="text-[10px] text-charcoal-lighter mt-0.5">{s.label}</p>
                        </button>
                    );
                })}
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-lighter" />
                <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                    onKeyDown={e => e.key === "Enter" && setPage(1)}
                    placeholder="Search by student name or email..."
                    className="w-full bg-white border border-cream-darker/50 rounded-sm py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-gold/40" />
            </div>

            {/* Table */}
            <div className="bg-white rounded-sm border border-cream-darker/50 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gold" size={28} /></div>
                ) : enrollments.length === 0 ? (
                    <div className="text-center py-16">
                        <GraduationCap className="w-10 h-10 text-charcoal-lighter/30 mx-auto mb-3" />
                        <p className="text-charcoal-lighter text-sm">No enrollment requests found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-cream/50 border-b border-cream-darker/30">
                                    {["Student", "Course", "Date", "Status", "Payment", "Note", "Actions"].map(h => (
                                        <th key={h} className={`py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider font-semibold ${
                                            h === "Actions" ? "text-right" : h === "Status" || h === "Payment" ? "text-center" : "text-left"
                                        }`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {enrollments.map(enrollment => {
                                    const cfg = statusConfig[enrollment.status] ?? statusConfig.ENQUIRY;
                                    const isActionable = enrollment.status === "ENQUIRY";
                                    const isPaid = enrollment.paymentStatus === "PAID";
                                    return (
                                        <tr key={enrollment.id} className="border-b border-cream-darker/10 hover:bg-cream/20 transition-colors">
                                            <td className="py-3 px-4">
                                                <p className="font-medium text-espresso">{enrollment.studentName}</p>
                                                <a href={`mailto:${enrollment.email}`} className="flex items-center gap-1 text-xs text-charcoal-lighter hover:text-gold mt-0.5">
                                                    <Mail size={10} /> {enrollment.email}
                                                </a>
                                                {enrollment.phone && (
                                                    <a href={`tel:${enrollment.phone}`} className="flex items-center gap-1 text-xs text-charcoal-lighter hover:text-gold mt-0.5">
                                                        <Phone size={10} /> {enrollment.phone}
                                                    </a>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <p className="font-medium text-espresso text-sm">{enrollment.course.name}</p>
                                                <p className="flex items-center gap-0.5 text-xs text-gold mt-0.5">
                                                    <IndianRupee size={10} />
                                                    {Number(enrollment.course.price).toLocaleString("en-IN")}
                                                </p>
                                            </td>
                                            <td className="py-3 px-4 text-xs text-charcoal-lighter whitespace-nowrap">
                                                {new Date(enrollment.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                <p className="text-[10px] mt-0.5">{new Date(enrollment.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border ${cfg.bg} ${cfg.color}`}>{cfg.icon} {cfg.label}</span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {isPaid ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border bg-green-50 border-green-200 text-green-700">
                                                        <CheckCircle size={10} /> Paid {enrollment.paymentMethod ? `· ${enrollment.paymentMethod}` : ""}
                                                    </span>
                                                ) : (
                                                    <button onClick={() => setMarkPaidTarget(enrollment)}
                                                        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 transition-colors">
                                                        <Clock size={10} /> Mark Paid
                                                    </button>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 max-w-[180px]">
                                                {enrollment.note ? (
                                                    <div className="flex items-start gap-1.5">
                                                        <MessageSquare size={11} className="text-charcoal-lighter flex-shrink-0 mt-0.5" />
                                                        <p className="text-xs text-charcoal-lighter line-clamp-2">{enrollment.note}</p>
                                                    </div>
                                                ) : <span className="text-[10px] text-charcoal-lighter/40">—</span>}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                {isActionable ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => handleConfirm(enrollment)} disabled={confirming === enrollment.id}
                                                            className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors whitespace-nowrap">
                                                            {confirming === enrollment.id ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle size={10} />} Confirm
                                                        </button>
                                                        <button onClick={() => setCancelTarget(enrollment)}
                                                            className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors whitespace-nowrap">
                                                            <XCircle size={10} /> Cancel
                                                        </button>
                                                    </div>
                                                ) : <span className="text-[10px] text-charcoal-lighter/40">—</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {total > PAGE_SIZE && (
                    <div className="px-4 py-3 bg-cream/30 border-t border-cream-darker/20 flex items-center justify-between">
                        <p className="text-xs text-charcoal-lighter">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}</p>
                        <div className="flex items-center gap-1">
                            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                                className="p-1.5 rounded border border-cream-darker/30 text-charcoal-lighter hover:border-gold/40 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft size={14} /></button>
                            <span className="text-xs px-2">Page {page} of {totalPages}</span>
                            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                                className="p-1.5 rounded border border-cream-darker/30 text-charcoal-lighter hover:border-gold/40 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronRight size={14} /></button>
                        </div>
                    </div>
                )}
            </div>

            {cancelTarget && <CancelModal enrollment={cancelTarget} onClose={() => setCancelTarget(null)} onSuccess={load} />}
            {markPaidTarget && <MarkPaidModal enrollment={markPaidTarget} onClose={() => setMarkPaidTarget(null)} onSuccess={load} />}
        </div>
    );
}