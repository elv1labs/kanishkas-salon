"use client";
import { extractApiError } from "@/lib/extract-error";
// app/admin/academy/enrollments/page.tsx
// Admin enrollment management — list, confirm, mark-paid, cancel

import { useState, useEffect, useCallback } from "react";
import {
    GraduationCap, CheckCircle, XCircle, Clock, User,
    Calendar, CreditCard, RefreshCw, ChevronDown, ChevronUp,
    Loader2, AlertCircle, Search, Filter
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Enrollment = {
    id: string;
    studentName: string;
    phone: string;
    email: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string | null;
    paymentAmount: number | null;
    note: string | null;
    notes: string | null;
    createdAt: string;
    confirmedAt: string | null;
    paidAt: string | null;
    course: { id: string; name: string; price: number };
    user: { id: string; name: string; email: string; phone: string | null } | null;
};

// ── Status badges ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        SUBMITTED:  "bg-amber-50 text-amber-700 border-amber-200",
        CONFIRMED:  "bg-blue-50 text-blue-700 border-blue-200",
        ENROLLED:   "bg-indigo-50 text-indigo-700 border-indigo-200",
        ACTIVE:     "bg-green-50 text-green-700 border-green-200",
        COMPLETED:  "bg-purple-50 text-purple-700 border-purple-200",
        DROPPED:    "bg-gray-50 text-gray-500 border-gray-200",
        CANCELLED:  "bg-red-50 text-red-600 border-red-200",
        ENQUIRY:    "bg-gray-50 text-gray-600 border-gray-200",
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium border ${map[status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
            {status}
        </span>
    );
}

function PaymentBadge({ status }: { status: string }) {
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium border ${
            status === "PAID"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
        }`}>
            {status}
        </span>
    );
}

// ── Row component ─────────────────────────────────────────────────────────────

function EnrollmentRow({
    enrollment,
    onConfirmed,
    onPaid,
    onCancelled,
}: {
    enrollment: Enrollment;
    onConfirmed: (id: string) => void;
    onPaid: (id: string, data: { paymentStatus: string; paymentMethod: string | null; paymentAmount: number | null; paidAt: string | null }) => void;
    onCancelled: (id: string) => void;
}) {
    const [confirming, setConfirming] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [cancelling, setCancelling] = useState(false);
    const [markPaidOpen, setMarkPaidOpen] = useState(false);
    const [payMethod, setPayMethod] = useState<"UPI" | "CASH" | "CARD">("UPI");
    const [payAmount, setPayAmount] = useState(String(enrollment.course.price ?? ""));
    const [payNote, setPayNote] = useState("");
    const [marking, setMarking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isCancelled = enrollment.status === "CANCELLED";
    const isPaid = enrollment.paymentStatus === "PAID";

    const handleConfirm = async () => {
        setConfirming(true);
        setError(null);
        try {
            const res = await fetch(`/api/academy/enrollments/${enrollment.id}/confirm`, { method: "PATCH" });
            const data = await res.json();
            if (!res.ok) { setError(extractApiError(data, "Failed to confirm")); return; }
            onConfirmed(enrollment.id);
        } catch { setError("Network error"); }
        finally { setConfirming(false); }
    };

    const handleCancel = async () => {
        if (cancelReason.trim().length < 10) {
            setError("Reason must be at least 10 characters.");
            return;
        }
        setCancelling(true);
        setError(null);
        try {
            const res = await fetch(`/api/academy/enrollments/${enrollment.id}/cancel`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason: cancelReason.trim() }),
            });
            const data = await res.json();
            if (!res.ok) { setError(extractApiError(data, "Failed to cancel")); return; }
            onCancelled(enrollment.id);
        } catch { setError("Network error"); }
        finally { setCancelling(false); }
    };

    const handleMarkPaid = async () => {
        const amt = parseFloat(payAmount);
        if (!payMethod || isNaN(amt) || amt <= 0) {
            setError("Please enter a valid amount and payment method.");
            return;
        }
        setMarking(true);
        setError(null);
        try {
            const res = await fetch(`/api/academy/enrollments/${enrollment.id}/mark-paid`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentMethod: payMethod, paymentAmount: amt, paymentNote: payNote || undefined }),
            });
            const data = await res.json();
            if (!res.ok) { setError(extractApiError(data, "Failed to mark paid")); return; }
            setMarkPaidOpen(false);
            onPaid(enrollment.id, {
                paymentStatus: "PAID",
                paymentMethod: payMethod,
                paymentAmount: amt,
                paidAt: new Date().toISOString(),
            });
        } catch { setError("Network error"); }
        finally { setMarking(false); }
    };

    return (
        <div className={`border rounded-sm bg-white mb-3 overflow-hidden transition-opacity ${isCancelled ? "opacity-60" : ""}`}>
            {/* Main row */}
            <div className="px-5 py-4 flex flex-wrap items-start gap-4">
                {/* Client info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-cream-dark flex items-center justify-center flex-shrink-0">
                        <User size={16} className="text-charcoal-lighter" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-espresso text-sm truncate">{enrollment.studentName}</p>
                        <p className="text-charcoal-lighter text-xs truncate">{enrollment.email}</p>
                        {enrollment.phone && <p className="text-charcoal-lighter text-xs">{enrollment.phone}</p>}
                    </div>
                </div>

                {/* Course */}
                <div className="min-w-[160px]">
                    <p className="text-xs text-charcoal/50 uppercase tracking-wider mb-1">Course</p>
                    <p className="text-sm font-medium text-espresso">{enrollment.course.name}</p>
                    <p className="text-xs text-charcoal-lighter">₹{Number(enrollment.course.price).toLocaleString("en-IN")}</p>
                </div>

                {/* Submitted */}
                <div className="min-w-[100px]">
                    <p className="text-xs text-charcoal/50 uppercase tracking-wider mb-1">Submitted</p>
                    <p className="text-xs text-charcoal-lighter">
                        {new Date(enrollment.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                </div>

                {/* Status */}
                <div className="flex flex-col gap-1">
                    <StatusBadge status={enrollment.status} />
                    <PaymentBadge status={enrollment.paymentStatus} />
                </div>

                {/* Actions */}
                {!isCancelled && (
                    <div className="flex items-center gap-2 flex-wrap">
                        {enrollment.status === "SUBMITTED" && (
                            <button
                                onClick={handleConfirm}
                                disabled={confirming}
                                className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-600 text-white rounded-sm hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                            >
                                {confirming ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                                Confirm
                            </button>
                        )}

                        {!isPaid && (
                            <button
                                onClick={() => { setMarkPaidOpen((o) => !o); setCancelOpen(false); setError(null); }}
                                className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-sm border transition-colors font-medium ${
                                    markPaidOpen
                                        ? "border-green-400 text-green-700 bg-green-50"
                                        : "border-charcoal/20 text-charcoal-lighter hover:border-green-400 hover:text-green-700"
                                }`}
                            >
                                <CreditCard size={12} />
                                Mark as Paid
                                {markPaidOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                        )}

                        <button
                            onClick={() => { setCancelOpen((o) => !o); setMarkPaidOpen(false); setError(null); }}
                            className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-sm border transition-colors font-medium ${
                                cancelOpen
                                    ? "border-red-300 text-red-600 bg-red-50"
                                    : "border-charcoal/20 text-charcoal-lighter hover:border-red-300 hover:text-red-600"
                            }`}
                        >
                            <XCircle size={12} />
                            Cancel
                            {cancelOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                    </div>
                )}
            </div>

            {/* Client note */}
            {enrollment.note && (
                <div className="px-5 pb-3">
                    <p className="text-xs text-charcoal/60 bg-cream px-3 py-2 rounded-sm border border-charcoal/10">
                        <span className="font-medium text-charcoal-lighter">Note from client:</span> {enrollment.note}
                    </p>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="mx-5 mb-3 flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-200 rounded-sm px-3 py-2">
                    <AlertCircle size={13} className="flex-shrink-0" />
                    {error}
                </div>
            )}

            {/* Mark Paid expansion */}
            {markPaidOpen && !isCancelled && (
                <div className="border-t border-charcoal/10 bg-green-50/40 px-5 py-4 space-y-3">
                    <p className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Record Payment</p>
                    <div className="flex flex-wrap gap-3">
                        <div>
                            <label className="text-xs text-charcoal/60 mb-1 block">Method</label>
                            <select
                                value={payMethod}
                                onChange={(e) => setPayMethod(e.target.value as "UPI" | "CASH" | "CARD")}
                                className="text-sm border border-charcoal/20 rounded-sm px-2 py-1.5 bg-white text-espresso focus:outline-none focus:ring-1 focus:ring-gold/50"
                            >
                                <option value="UPI">UPI</option>
                                <option value="CASH">Cash</option>
                                <option value="CARD">Card</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-charcoal/60 mb-1 block">Amount (₹)</label>
                            <input
                                type="number"
                                value={payAmount}
                                onChange={(e) => setPayAmount(e.target.value)}
                                className="text-sm border border-charcoal/20 rounded-sm px-2 py-1.5 w-32 bg-white text-espresso focus:outline-none focus:ring-1 focus:ring-gold/50"
                                placeholder="Amount"
                            />
                        </div>
                        <div className="flex-1 min-w-[160px]">
                            <label className="text-xs text-charcoal/60 mb-1 block">Note (optional)</label>
                            <input
                                type="text"
                                value={payNote}
                                onChange={(e) => setPayNote(e.target.value)}
                                className="text-sm border border-charcoal/20 rounded-sm px-2 py-1.5 w-full bg-white text-espresso focus:outline-none focus:ring-1 focus:ring-gold/50"
                                placeholder="UPI ref / transaction note"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleMarkPaid}
                        disabled={marking}
                        className="inline-flex items-center gap-1.5 text-xs px-4 py-2 bg-green-600 text-white rounded-sm hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                    >
                        {marking ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                        Confirm Payment
                    </button>
                </div>
            )}

            {/* Cancel expansion */}
            {cancelOpen && !isCancelled && (
                <div className="border-t border-charcoal/10 bg-red-50/40 px-5 py-4 space-y-3">
                    <p className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Cancel Enrollment</p>
                    <textarea
                        rows={2}
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Reason for cancellation (min 10 characters, required)"
                        className="w-full text-sm border border-charcoal/20 rounded-sm px-3 py-2 bg-white text-espresso placeholder:text-charcoal/30 focus:outline-none focus:ring-1 focus:ring-red-300 resize-none"
                    />
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleCancel}
                            disabled={cancelling || cancelReason.trim().length < 10}
                            className="inline-flex items-center gap-1.5 text-xs px-4 py-2 bg-red-600 text-white rounded-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            {cancelling ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                            Confirm Cancellation
                        </button>
                        <span className={`text-xs ${cancelReason.trim().length < 10 ? "text-charcoal/40" : "text-green-600"}`}>
                            {cancelReason.trim().length}/10 min chars
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
    { label: "All", value: "" },
    { label: "Submitted", value: "SUBMITTED" },
    { label: "Confirmed", value: "CONFIRMED" },
    { label: "Enrolled", value: "ENROLLED" },
    { label: "Active", value: "ACTIVE" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Cancelled", value: "CANCELLED" },
];

export default function AdminEnrollmentsPage() {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const LIMIT = 20;

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: String(LIMIT), page: String(page) });
            if (statusFilter) params.set("status", statusFilter);
            if (search.trim()) params.set("search", search.trim());
            const res = await fetch(`/api/academy/enrollments?${params}`);
            const data = await res.json();
            setEnrollments(data.data?.enrollments ?? []);
            setTotal(data.data?.total ?? 0);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, search, page]);

    useEffect(() => { load(); }, [load]);

    const handleConfirmed = (id: string) => {
        setEnrollments((prev) =>
            prev.map((e) => e.id === id ? { ...e, status: "CONFIRMED", confirmedAt: new Date().toISOString() } : e)
        );
    };
    const handlePaid = (id: string, data: Enrollment["paymentStatus"] extends string ? any : never) => {
        setEnrollments((prev) => prev.map((e) => e.id === id ? { ...e, ...data } : e));
    };
    const handleCancelled = (id: string) => {
        setEnrollments((prev) => prev.map((e) => e.id === id ? { ...e, status: "CANCELLED" } : e));
    };

    const submitted = enrollments.filter((e) => e.status === "SUBMITTED").length;
    const totalPages = Math.ceil(total / LIMIT);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold text-espresso">Academy Enrollments</h1>
                    <p className="text-charcoal-lighter text-sm mt-1">
                        {total} total enrollment{total !== 1 ? "s" : ""}
                        {submitted > 0 && (
                            <span className="ml-2 inline-flex items-center gap-1 text-amber-700 font-medium">
                                <Clock size={12} />
                                {submitted} pending review
                            </span>
                        )}
                    </p>
                </div>
                <button
                    onClick={load}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 border border-charcoal/20 rounded-sm text-charcoal-lighter hover:border-espresso/30 hover:text-espresso transition-colors"
                >
                    <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                {/* Status tabs */}
                <div className="flex flex-wrap gap-1">
                    {STATUS_FILTERS.map((f) => (
                        <button
                            key={f.value}
                            onClick={() => { setStatusFilter(f.value); setPage(1); }}
                            className={`text-xs px-3 py-1.5 rounded-sm border transition-colors font-medium ${
                                statusFilter === f.value
                                    ? "bg-espresso text-cream border-espresso"
                                    : "border-charcoal/20 text-charcoal-lighter hover:border-espresso/30 hover:text-espresso"
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative ml-auto">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Search by name or email..."
                        className="text-sm pl-8 pr-3 py-1.5 border border-charcoal/20 rounded-sm bg-white text-espresso placeholder:text-charcoal/30 focus:outline-none focus:ring-1 focus:ring-gold/50 w-56"
                    />
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center py-20 text-charcoal-lighter">
                    <Loader2 size={20} className="animate-spin mr-2" />
                    Loading enrollments...
                </div>
            ) : enrollments.length === 0 ? (
                <div className="text-center py-20 text-charcoal-lighter">
                    <GraduationCap size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No enrollments found</p>
                    <p className="text-sm mt-1 opacity-70">
                        {statusFilter ? `No ${statusFilter.toLowerCase()} enrollments` : "No enrollment requests yet"}
                    </p>
                </div>
            ) : (
                <div>
                    {enrollments.map((enrollment) => (
                        <EnrollmentRow
                            key={enrollment.id}
                            enrollment={enrollment}
                            onConfirmed={handleConfirmed}
                            onPaid={handlePaid}
                            onCancelled={handleCancelled}
                        />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-charcoal-lighter pt-2">
                    <span>{total} total</span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                            className="px-3 py-1.5 border border-charcoal/20 rounded-sm disabled:opacity-40 hover:border-espresso/30 transition-colors text-xs"
                        >
                            Previous
                        </button>
                        <span className="text-xs">{page} / {totalPages}</span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || loading}
                            className="px-3 py-1.5 border border-charcoal/20 rounded-sm disabled:opacity-40 hover:border-espresso/30 transition-colors text-xs"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
