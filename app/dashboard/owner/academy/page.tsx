"use client";

import { useState, useEffect, useCallback } from "react";
import {
    GraduationCap, Clock, CheckCircle, XCircle,
    Loader2, RefreshCw, MessageSquare, Phone, Mail,
    IndianRupee, X, AlertCircle,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type EnrollmentStatus = "ENQUIRY" | "ENROLLED" | "ACTIVE" | "COMPLETED" | "DROPPED";


type Enrollment = {
    id: string;
    studentName: string;
    email: string;
    phone: string;
    status: EnrollmentStatus;
    paymentStatus: string;
    note: string | null;
    createdAt: string;
    course: { id: string; name: string; price: string };
    user: { id: string; name: string; email: string; phone: string | null } | null;
};

// ── Status config ──────────────────────────────────────────────────────────────

const statusConfig: Record<EnrollmentStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    ENQUIRY:    { label: "Enquiry",    color: "text-amber-700",  bg: "bg-amber-50 border-amber-200",   icon: <Clock size={11} /> },
    ENROLLED:   { label: "Enrolled",   color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",     icon: <GraduationCap size={11} /> },
    ACTIVE:     { label: "Active",     color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200", icon: <GraduationCap size={11} /> },
    COMPLETED:  { label: "Completed",  color: "text-teal-700",   bg: "bg-teal-50 border-teal-200",     icon: <CheckCircle size={11} /> },
    DROPPED:    { label: "Dropped",    color: "text-red-600",    bg: "bg-red-50 border-red-200",       icon: <XCircle size={11} /> },
};

const FILTERS = ["All", "ENQUIRY", "ENROLLED", "ACTIVE", "COMPLETED", "DROPPED"];

// ── Cancel Modal ──────────────────────────────────────────────────────────────

function CancelModal({
    enrollment,
    onClose,
    onSuccess,
}: {
    enrollment: Enrollment;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    const handleConfirm = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`/api/academy/enrollments/${enrollment.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "cancel", note: note.trim() || undefined }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error ?? "Failed to cancel."); return; }
            onSuccess();
            onClose();
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-cream-darker/30">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={18} className="text-red-500" />
                        <h2 className="font-display text-lg text-espresso font-bold">Cancel Enrollment</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-cream/60 text-charcoal-lighter transition-colors">
                        <X size={16} />
                    </button>
                </div>
                <div className="px-6 py-5 space-y-4">
                    <p className="text-sm text-charcoal">
                        Cancel <strong>{enrollment.studentName}</strong>'s enrollment in{" "}
                        <strong>{enrollment.course.name}</strong>?
                    </p>
                    <div>
                        <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">
                            Reason / Note (optional)
                        </label>
                        <textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            rows={3}
                            maxLength={300}
                            placeholder="e.g. Student requested cancellation, course full..."
                            className="w-full border border-cream-darker rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-gold/50 resize-none"
                        />
                    </div>
                    {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}
                </div>
                <div className="px-6 py-4 border-t border-cream-darker/30 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 text-sm border border-cream-darker/50 rounded-md text-charcoal-lighter hover:border-gold/30 transition-colors">
                        Keep Enrollment
                    </button>
                    <button onClick={handleConfirm} disabled={loading}
                        className="flex-1 py-2.5 text-sm bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                        {loading ? <><Loader2 size={14} className="animate-spin" /> Cancelling…</> : <><XCircle size={14} /> Confirm Cancel</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AcademyEnrollmentsPage() {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("All");
    const [confirming, setConfirming] = useState<string | null>(null);
    const [cancelTarget, setCancelTarget] = useState<Enrollment | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: "100" });
            if (filter !== "All") params.set("status", filter);
            const res = await fetch(`/api/academy/enrollments?${params}`);
            const data = await res.json();
            setEnrollments(data.enrollments ?? []);
        } catch (e) {
            console.error("Failed to load enrollments", e);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => { load(); }, [load]);

    const handleConfirm = async (enrollment: Enrollment) => {
        setConfirming(enrollment.id);
        try {
            const res = await fetch(`/api/academy/enrollments/${enrollment.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "confirm" }),
            });
            if (res.ok) load();
        } catch (e) {
            console.error("Failed to confirm enrollment", e);
        } finally {
            setConfirming(null);
        }
    };

    // ── Counts ────────────────────────────────────────────────────────────────

    const counts = {
        pending:   enrollments.filter(e => e.status === "ENQUIRY").length,
        enrolled:  enrollments.filter(e => e.status === "ENROLLED" || e.status === "ACTIVE").length,
        completed: enrollments.filter(e => e.status === "COMPLETED").length,
        dropped:   enrollments.filter(e => e.status === "DROPPED").length,
    };

    const displayed = filter === "All" ? enrollments : enrollments.filter(e => e.status === filter);

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-xl text-espresso">Academy Enrollment Requests</h1>
                    <p className="text-xs text-charcoal-lighter mt-0.5">Review and confirm student enrollment applications</p>
                </div>
                <button onClick={load} className="flex items-center gap-1.5 text-xs text-charcoal-lighter hover:text-gold transition-colors">
                    <RefreshCw size={13} /> Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Pending Review", value: counts.pending,   icon: <Clock size={18} className="text-amber-500" /> },
                    { label: "Enrolled",       value: counts.enrolled,  icon: <CheckCircle size={18} className="text-green-500" /> },
                    { label: "Completed",      value: counts.completed, icon: <GraduationCap size={18} className="text-blue-500" /> },
                    { label: "Dropped",        value: counts.dropped,   icon: <XCircle size={18} className="text-red-400" /> },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-sm border border-cream-darker/50 p-4 text-center">
                        <div className="flex justify-center mb-1">{s.icon}</div>
                        <p className="font-display text-2xl font-bold text-espresso">{loading ? "—" : s.value}</p>
                        <p className="text-[10px] text-charcoal-lighter">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 bg-cream rounded-sm p-1 overflow-x-auto">
                {FILTERS.map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`px-3 py-2 text-xs font-semibold rounded-sm whitespace-nowrap transition-all ${
                            filter === f ? "bg-white text-espresso shadow-sm" : "text-charcoal-lighter hover:bg-white/50"
                        }`}>
                        {f === "All" ? "All" : (statusConfig[f as EnrollmentStatus]?.label ?? f)}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-sm border border-cream-darker/50 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="animate-spin text-gold" size={28} />
                    </div>
                ) : displayed.length === 0 ? (
                    <div className="text-center py-16">
                        <GraduationCap className="w-10 h-10 text-charcoal-lighter/30 mx-auto mb-3" />
                        <p className="text-charcoal-lighter text-sm">
                            No {filter !== "All" ? filter.toLowerCase() : ""} enrollment requests found.
                        </p>
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
                                {displayed.map(enrollment => {
                                    const cfg = statusConfig[enrollment.status] ?? statusConfig.ENQUIRY;
                                    const isActionable = enrollment.status === "ENQUIRY";
                                    return (
                                        <tr key={enrollment.id} className="border-b border-cream-darker/10 hover:bg-cream/20 transition-colors">

                                            {/* Student */}
                                            <td className="py-3 px-4">
                                                <p className="font-medium text-espresso">{enrollment.studentName}</p>
                                                <a href={`mailto:${enrollment.email}`}
                                                    className="flex items-center gap-1 text-xs text-charcoal-lighter hover:text-gold mt-0.5">
                                                    <Mail size={10} /> {enrollment.email}
                                                </a>
                                                {enrollment.phone && (
                                                    <a href={`tel:${enrollment.phone}`}
                                                        className="flex items-center gap-1 text-xs text-charcoal-lighter hover:text-gold mt-0.5">
                                                        <Phone size={10} /> {enrollment.phone}
                                                    </a>
                                                )}
                                            </td>

                                            {/* Course */}
                                            <td className="py-3 px-4">
                                                <p className="font-medium text-espresso text-sm">{enrollment.course.name}</p>
                                                <p className="flex items-center gap-0.5 text-xs text-gold mt-0.5">
                                                    <IndianRupee size={10} />
                                                    {Number(enrollment.course.price).toLocaleString("en-IN")}
                                                </p>
                                            </td>

                                            {/* Date */}
                                            <td className="py-3 px-4 text-xs text-charcoal-lighter whitespace-nowrap">
                                                {new Date(enrollment.createdAt).toLocaleDateString("en-IN", {
                                                    day: "numeric", month: "short", year: "numeric"
                                                })}
                                                <p className="text-[10px] mt-0.5">
                                                    {new Date(enrollment.createdAt).toLocaleTimeString("en-IN", {
                                                        hour: "2-digit", minute: "2-digit"
                                                    })}
                                                </p>
                                            </td>

                                            {/* Status */}
                                            <td className="py-3 px-4 text-center">
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border ${cfg.bg} ${cfg.color}`}>
                                                    {cfg.icon} {cfg.label}
                                                </span>
                                            </td>

                                            {/* Payment */}
                                            <td className="py-3 px-4 text-center">
                                                {enrollment.paymentStatus === "PAID" ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border bg-green-50 border-green-200 text-green-700">
                                                        <CheckCircle size={10} /> Paid
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border bg-amber-50 border-amber-200 text-amber-700">
                                                        <Clock size={10} /> Pending
                                                    </span>
                                                )}
                                            </td>

                                            {/* Note */}
                                            <td className="py-3 px-4 max-w-[180px]">
                                                {enrollment.note ? (
                                                    <div className="flex items-start gap-1.5">
                                                        <MessageSquare size={11} className="text-charcoal-lighter flex-shrink-0 mt-0.5" />
                                                        <p className="text-xs text-charcoal-lighter line-clamp-2">{enrollment.note}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-charcoal-lighter/40">—</span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3 px-4 text-right">
                                                {isActionable ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleConfirm(enrollment)}
                                                            disabled={confirming === enrollment.id}
                                                            className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                                                        >
                                                            {confirming === enrollment.id
                                                                ? <Loader2 size={10} className="animate-spin" />
                                                                : <CheckCircle size={10} />}
                                                            Confirm
                                                        </button>
                                                        <button
                                                            onClick={() => setCancelTarget(enrollment)}
                                                            className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors whitespace-nowrap"
                                                        >
                                                            <XCircle size={10} /> Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-charcoal-lighter/40">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="px-4 py-3 bg-cream/30 border-t border-cream-darker/20 text-xs text-charcoal-lighter">
                    {displayed.length} enrollment{displayed.length !== 1 ? "s" : ""} shown
                </div>
            </div>

            {/* Cancel Modal */}
            {cancelTarget && (
                <CancelModal
                    enrollment={cancelTarget}
                    onClose={() => setCancelTarget(null)}
                    onSuccess={load}
                />
            )}
        </div>
    );
}
