"use client";
import { extractApiError } from "@/lib/extract-error";

import { useState, useEffect, useCallback } from "react";
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Scissors, RotateCcw, Loader2, MessageCircle, Star, Send } from "lucide-react";
import Link from "next/link";
import { usePublicSettings } from "@/hooks/usePublicSettings";

type Appointment = {
    id: string;
    bookingRef: string;
    service: { name: string; duration: number; price: string; id: string };
    staff: { name: string } | null;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    totalAmount: string;
    notes: string | null;
    hasReviewed: boolean;
};

const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
    PENDING:     { color: "text-amber-700",  bg: "bg-amber-50 border-amber-200",   icon: <AlertCircle size={13} />, label: "Pending Confirmation" },
    CONFIRMED:   { color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",     icon: <CheckCircle size={13} />, label: "Confirmed" },
    IN_PROGRESS: { color: "text-purple-700", bg: "bg-purple-50 border-purple-200", icon: <Clock size={13} />,       label: "In Progress" },
    COMPLETED:   { color: "text-green-700",  bg: "bg-green-50 border-green-200",   icon: <CheckCircle size={13} />, label: "Completed" },
    CANCELLED:   { color: "text-red-600",    bg: "bg-red-50 border-red-200",       icon: <XCircle size={13} />,     label: "Cancelled" },
    NO_SHOW:     { color: "text-gray-600",   bg: "bg-gray-50 border-gray-200",     icon: <XCircle size={13} />,     label: "No Show" },
};

const UPCOMING = ["PENDING", "CONFIRMED", "IN_PROGRESS"];
const PAST = ["COMPLETED", "CANCELLED", "NO_SHOW"];

// ── ReviewForm ────────────────────────────────────────────────────────────────
// Inline component: no modal, no navigation. Expands below the appointment card.

const MAX_COMMENT = 500;

function StarRating({
    value,
    onChange,
    disabled,
}: {
    value: number;
    onChange: (n: number) => void;
    disabled: boolean;
}) {
    const [hovered, setHovered] = useState(0);
    return (
        <div className="flex items-center gap-1" role="group" aria-label="Star rating">
            {[1, 2, 3, 4, 5].map((n) => {
                const filled = n <= (hovered || value);
                return (
                    <button
                        key={n}
                        type="button"
                        disabled={disabled}
                        onClick={() => onChange(n)}
                        onMouseEnter={() => setHovered(n)}
                        onMouseLeave={() => setHovered(0)}
                        aria-label={`${n} star${n !== 1 ? "s" : ""}`}
                        className="p-0.5 focus:outline-none disabled:cursor-not-allowed transition-transform hover:scale-110"
                    >
                        <Star
                            size={22}
                            className={`transition-colors ${
                                filled ? "text-gold fill-gold" : "text-cream-darker/70"
                            }`}
                            style={{ fill: filled ? "currentColor" : "none" }}
                        />
                    </button>
                );
            })}
        </div>
    );
}

function ReviewForm({
    appointmentId,
    serviceId,
    onClose,
    onSuccess,
}: {
    appointmentId: string;
    serviceId: string;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [rating, setRating]     = useState(0);
    const [comment, setComment]   = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError]       = useState<string | null>(null);

    const handleSubmit = async () => {
        if (rating === 0) return;
        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    appointmentId,
                    serviceId,
                    rating,
                    comment: comment.trim() || undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(extractApiError(data, "Submission failed. Please try again."));
                return;
            }
            onSuccess();
        } catch {
            setError("Network error — please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="border-t border-cream-darker/20 bg-cream/40 px-5 py-4 space-y-4">
            {/* Star row */}
            <div>
                <p className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-2">
                    Your Rating <span className="text-red-400">*</span>
                </p>
                <StarRating value={rating} onChange={setRating} disabled={submitting} />
            </div>

            {/* Comment */}
            <div>
                <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">
                    Comments <span className="font-normal normal-case tracking-normal">(optional)</span>
                </label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT))}
                    rows={3}
                    placeholder="How was your experience?"
                    disabled={submitting}
                    className="w-full bg-white border border-cream-darker/50 rounded py-2.5 px-3 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 resize-none disabled:opacity-60"
                />
                <p className={`text-[11px] mt-1 text-right ${
                    comment.length >= MAX_COMMENT ? "text-red-400" : "text-charcoal-lighter"
                }`}>
                    {comment.length}/{MAX_COMMENT}
                </p>
            </div>

            {/* Error */}
            {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 justify-end">
                <button
                    onClick={onClose}
                    disabled={submitting}
                    className="text-xs px-4 py-2 border border-cream-darker/50 rounded text-charcoal-lighter hover:border-gold/30 transition-colors disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={rating === 0 || submitting}
                    className="text-xs px-4 py-2 bg-espresso text-cream rounded font-semibold flex items-center gap-1.5 hover:bg-espresso/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    {submitting ? (
                        <Loader2 size={12} className="animate-spin" />
                    ) : (
                        <Send size={12} />
                    )}
                    {submitting ? "Submitting…" : "Submit Review"}
                </button>
            </div>
        </div>
    );
}

function getCountdown(date: string, startTime: string): string {
    const [h, m] = startTime.split(":").map(Number);
    const apptDate = new Date(date);
    apptDate.setHours(h, m, 0, 0);
    const diff = apptDate.getTime() - Date.now();
    if (diff < 0) return "Now";
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (days > 0) return `${days}d ${hours}h away`;
    if (hours > 0) return `${hours}h ${mins}m away`;
    return `${mins}m away`;
}

function isToday(dateStr: string): boolean {
    return new Date(dateStr).toDateString() === new Date().toDateString();
}

function isTomorrow(dateStr: string): boolean {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return new Date(dateStr).toDateString() === tomorrow.toDateString();
}

function DateLabel({ dateStr }: { dateStr: string }) {
    if (isToday(dateStr)) return <span className="text-gold font-semibold text-xs uppercase tracking-wider">Today</span>;
    if (isTomorrow(dateStr)) return <span className="text-blue-600 font-semibold text-xs uppercase tracking-wider">Tomorrow</span>;
    return <span className="text-charcoal-lighter text-xs">{new Date(dateStr).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</span>;
}

function AppointmentCard({ apt, onCancel, cancelling, onReviewed }: {
    apt: Appointment;
    onCancel: (id: string) => void;
    cancelling: string | null;
    onReviewed: (id: string) => void;
}) {
    const { settings } = usePublicSettings();
    const whatsappNumber = settings.whatsappNumber || "919171230292";
    const [reviewOpen, setReviewOpen] = useState(false);
    const cfg = statusConfig[apt.status] ?? statusConfig.PENDING;
    const upcoming = UPCOMING.includes(apt.status);
    const today = isToday(apt.date);

    return (
        <div className={`bg-white rounded-sm border transition-all duration-200 overflow-hidden ${
            today && upcoming ? "border-gold/40 shadow-md shadow-gold/5" : "border-cream-darker/50 hover:shadow-md"
        }`}>
            {/* Top accent bar for today */}
            {today && upcoming && (
                <div className="h-1 bg-gradient-to-r from-gold to-gold-light" />
            )}

            <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            today && upcoming ? "bg-gold/20" : "bg-cream-dark"
                        }`}>
                            <Scissors className={today && upcoming ? "text-gold" : "text-charcoal-lighter"} size={17} />
                        </div>
                        <div>
                            <h3 className="font-display text-base font-semibold text-espresso">{apt.service?.name}</h3>
                            <p className="text-xs text-charcoal-lighter font-mono mt-0.5">{apt.bookingRef}</p>
                        </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
                        {cfg.icon} {cfg.label}
                    </span>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 px-4 bg-cream/50 rounded-sm mb-4">
                    <div>
                        <p className="text-[10px] text-charcoal-lighter uppercase tracking-wider mb-1">Date</p>
                        <DateLabel dateStr={apt.date} />
                    </div>
                    <div>
                        <p className="text-[10px] text-charcoal-lighter uppercase tracking-wider mb-1">Time</p>
                        <p className="text-xs font-medium text-charcoal">{apt.startTime} – {apt.endTime}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-charcoal-lighter uppercase tracking-wider mb-1">Stylist</p>
                        <p className="text-xs font-medium text-charcoal">{apt.staff?.name ?? "Any Available"}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-charcoal-lighter uppercase tracking-wider mb-1">Amount</p>
                        <p className="text-xs font-semibold text-gold">₹{Number(apt.totalAmount).toLocaleString("en-IN")}</p>
                    </div>
                </div>

                {/* Countdown for upcoming */}
                {upcoming && (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-charcoal-lighter">
                            <Clock size={12} className="text-gold" />
                            <span>{getCountdown(apt.date, apt.startTime)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* WhatsApp reminder */}
                            <a href={`https://wa.me/${whatsappNumber}?text=Hi, I have an appointment (${apt.bookingRef}) for ${apt.service?.name} on ${new Date(apt.date).toLocaleDateString("en-IN")} at ${apt.startTime}`}
                                target="_blank" rel="noopener noreferrer"
                                className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-sm border border-green-200 text-green-700 hover:bg-green-50 transition-colors">
                                <MessageCircle size={12} /> WhatsApp
                            </a>
                            {(apt.status === "CONFIRMED" || apt.status === "PENDING") && (
                                <button
                                    onClick={() => onCancel(apt.id)}
                                    disabled={cancelling === apt.id}
                                    className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-sm border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
                                    {cancelling === apt.id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Actions for past completed */}
                {!upcoming && apt.status === "COMPLETED" && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <Link href="/book"
                            className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-sm border border-gold/30 text-gold hover:bg-gold/5 transition-colors">
                            <RotateCcw size={12} /> Book Again
                        </Link>

                        {apt.hasReviewed ? (
                            <span className="text-xs flex items-center gap-1 px-3 py-1.5 rounded-sm border border-green-200 text-green-700 bg-green-50">
                                <CheckCircle size={12} /> Review submitted ✓
                            </span>
                        ) : (
                            <button
                                onClick={() => setReviewOpen((o) => !o)}
                                className={`text-xs flex items-center gap-1 px-3 py-1.5 rounded-sm border transition-colors ${
                                    reviewOpen
                                        ? "border-espresso/30 text-espresso bg-cream"
                                        : "border-charcoal/20 text-charcoal-lighter hover:border-espresso/20 hover:text-espresso"
                                }`}
                            >
                                <Star size={12} className={reviewOpen ? "text-gold" : ""} />
                                {reviewOpen ? "Close Review" : "Leave a Review"}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Inline review form — only for completed, unreviewed appointments */}
            {!upcoming && apt.status === "COMPLETED" && !apt.hasReviewed && reviewOpen && (
                <ReviewForm
                    appointmentId={apt.id}
                    serviceId={apt.service.id}
                    onClose={() => setReviewOpen(false)}
                    onSuccess={() => {
                        setReviewOpen(false);
                        onReviewed(apt.id);
                    }}
                />
            )}
        </div>
    );
}

export default function ClientAppointmentsPage() {
    const { settings } = usePublicSettings();
    const whatsappNumber = settings.whatsappNumber || "919171230292";
    const [all, setAll] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
    const [cancelling, setCancelling] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/appointments?limit=100");
            const data = await res.json();
            setAll(data.appointments ?? []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleReviewed = (id: string) => {
        setAll((prev) =>
            prev.map((a) => (a.id === id ? { ...a, hasReviewed: true } : a))
        );
    };

    const handleCancel = async (id: string) => {
        if (!confirm("Are you sure you want to cancel this appointment?")) return;
        setCancelling(id);
        try {
            await fetch("/api/appointments", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status: "CANCELLED", cancelReason: "Cancelled by client" }),
            });
            await load();
        } finally {
            setCancelling(null);
        }
    };

    const upcoming = all.filter(a => UPCOMING.includes(a.status))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const past = all.filter(a => PAST.includes(a.status))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const todayAppts = upcoming.filter(a => isToday(a.date));
    const shown = tab === "upcoming" ? upcoming : past;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="font-display text-xl text-espresso">My Appointments</h1>
                <Link href="/book" className="btn-gold text-xs py-2 px-5">
                    + Book New
                </Link>
            </div>

            {/* Today's highlight */}
            {!loading && todayAppts.length > 0 && (
                <div className="bg-gradient-to-r from-espresso to-espresso/80 rounded-sm p-5 text-cream">
                    <p className="text-gold text-xs uppercase tracking-widest font-semibold mb-2">Today's Appointments</p>
                    <div className="space-y-2">
                        {todayAppts.map(apt => (
                            <div key={apt.id} className="flex items-center justify-between">
                                <div>
                                    <p className="font-display text-base">{apt.service?.name}</p>
                                    <p className="text-cream/50 text-xs">{apt.startTime} · {apt.staff?.name ?? "Any Available"}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-gold text-sm font-semibold">{getCountdown(apt.date, apt.startTime)}</p>
                                    <p className="text-cream/40 text-xs font-mono">{apt.bookingRef}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: "Upcoming", value: upcoming.length, color: "text-gold" },
                    { label: "Completed", value: all.filter(a => a.status === "COMPLETED").length, color: "text-green-600" },
                    { label: "Cancelled", value: all.filter(a => a.status === "CANCELLED").length, color: "text-red-400" },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-sm border border-cream-darker/50 p-4 text-center">
                        <p className={`font-display text-2xl font-bold ${loading ? "text-cream-darker" : s.color}`}>
                            {loading ? "—" : s.value}
                        </p>
                        <p className="text-[10px] text-charcoal-lighter uppercase tracking-wider mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-cream rounded-sm p-1">
                {(["upcoming", "past"] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-sm transition-all capitalize ${
                            tab === t ? "bg-white text-espresso shadow-sm" : "text-charcoal-lighter hover:bg-white/50"
                        }`}>
                        {t} ({t === "upcoming" ? upcoming.length : past.length})
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="animate-spin text-gold" size={28} />
                </div>
            ) : shown.length === 0 ? (
                <div className="bg-white rounded-sm border border-cream-darker/50 p-14 text-center">
                    <div className="w-14 h-14 rounded-full bg-cream-dark flex items-center justify-center mx-auto mb-4">
                        <Calendar className="text-charcoal-lighter" size={24} />
                    </div>
                    <p className="font-display text-lg text-espresso mb-1">No {tab} appointments</p>
                    <p className="text-charcoal-lighter text-sm mb-4">
                        {tab === "upcoming" ? "Ready for your next beauty session?" : "Your appointment history will appear here."}
                    </p>
                    {tab === "upcoming" && (
                        <Link href="/book" className="btn-gold text-xs py-2.5 px-6">
                            Book Appointment
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {shown.map(apt => (
                        <AppointmentCard key={apt.id} apt={apt} onCancel={handleCancel} cancelling={cancelling} onReviewed={handleReviewed} />
                    ))}
                </div>
            )}

            {/* WhatsApp booking hint */}
            <div className="bg-green-50 border border-green-100 rounded-sm p-4 flex items-center gap-4">
                <MessageCircle className="text-green-600 flex-shrink-0" size={20} />
                <div>
                    <p className="text-sm font-semibold text-green-800">Book via WhatsApp</p>
                    <p className="text-xs text-green-600 mt-0.5">Send us a message on WhatsApp to book or reschedule your appointment instantly.</p>
                </div>
                <a href={`https://wa.me/${whatsappNumber}?text=Hi, I'd like to book an appointment`}
                    target="_blank" rel="noopener noreferrer"
                    className="ml-auto flex-shrink-0 bg-green-600 text-white text-xs font-semibold px-4 py-2 rounded-sm hover:bg-green-700 transition-colors">
                    Chat Now
                </a>
            </div>
        </div>
    );
}
