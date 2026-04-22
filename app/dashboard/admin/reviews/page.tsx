"use client";
// Admin Reviews Moderation — approve or reject pending reviews

import { useState, useEffect, useCallback } from "react";
import { Star, CheckCircle, XCircle, Loader2, AlertCircle, MessageSquare, Package, Scissors } from "lucide-react";

type Review = {
    id: string;
    rating: number;
    title: string | null;
    comment: string | null;
    isPublished: boolean;
    isApproved: boolean;
    createdAt: string;
    client: { id: string; name: string };
    product: { id: string; name: string; slug: string } | null;
    service: { id: string; name: string; slug: string } | null;
};

type StatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

export default function AdminReviewsPage() {
    const [reviews, setReviews]         = useState<Review[]>([]);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING");
    const [moderating, setModerating]   = useState<string | null>(null);
    const [toast, setToast]             = useState<{ message: string; type: "success" | "error" } | null>(null);

    const showToast = (message: string, type: "success" | "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadReviews = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/admin-reviews?status=${statusFilter}&limit=50`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || `HTTP ${res.status}`);
            }
            const data = await res.json();
            setReviews(data.reviews ?? []);
        } catch (err: any) {
            setError(err.message || "Failed to load reviews");
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => { loadReviews(); }, [loadReviews]);

    const moderate = async (id: string, action: "approve" | "reject") => {
        setModerating(id);
        try {
            const res = await fetch("/api/reviews", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, action }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to moderate review");
            showToast(action === "approve" ? "Review approved and published ✓" : "Review rejected", "success");
            // Remove from list since filter status changed
            setReviews(prev => prev.filter(r => r.id !== id));
        } catch (err: any) {
            showToast(err.message || "Action failed", "error");
        } finally {
            setModerating(null);
        }
    };

    const statusTabs: { key: StatusFilter; label: string }[] = [
        { key: "PENDING", label: "Pending" },
        { key: "APPROVED", label: "Approved" },
        { key: "REJECTED", label: "Rejected" },
        { key: "ALL", label: "All Reviews" },
    ];

    return (
        <div className="space-y-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-sm shadow-lg text-sm font-medium ${toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                    {toast.message}
                </div>
            )}

            <div className="flex items-center justify-between">
                <h1 className="font-display text-xl text-espresso">Customer Reviews</h1>
                <p className="text-sm text-charcoal-lighter">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
            </div>

            {/* Status filter tabs */}
            <div className="flex gap-1 bg-cream rounded-sm p-1 overflow-x-auto w-fit">
                {statusTabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setStatusFilter(tab.key)}
                        className={`px-4 py-1.5 text-xs font-semibold rounded-sm whitespace-nowrap transition-all ${statusFilter === tab.key ? "bg-white text-espresso shadow-sm" : "text-charcoal-lighter hover:bg-white/50"}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="animate-spin text-gold" size={28} />
                </div>
            ) : error ? (
                <div className="bg-white rounded-sm border border-red-200 p-8 text-center">
                    <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                    <p className="text-red-500 text-sm">{error}</p>
                    <button onClick={loadReviews} className="mt-3 btn-gold text-xs py-2 px-4">Retry</button>
                </div>
            ) : reviews.length === 0 ? (
                <div className="bg-white rounded-sm border border-cream-darker/50 p-12 text-center">
                    <MessageSquare className="w-10 h-10 text-cream-darker mx-auto mb-3" />
                    <p className="text-charcoal-lighter text-sm">No reviews in this category.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {reviews.map(review => (
                        <div key={review.id} className="bg-white rounded-sm border border-cream-darker/50 p-5">
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div className="flex-1 min-w-0">
                                    {/* Subject */}
                                    <div className="flex items-center gap-2 mb-2">
                                        {review.product ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-semibold uppercase">
                                                <Package size={10} /> {review.product.name}
                                            </span>
                                        ) : review.service ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-semibold uppercase">
                                                <Scissors size={10} /> {review.service.name}
                                            </span>
                                        ) : null}

                                        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${review.isPublished ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                                            {review.isPublished ? "Published" : "Pending"}
                                        </span>
                                    </div>

                                    {/* Stars */}
                                    <div className="flex items-center gap-1 mb-1.5">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <Star key={s} size={14} className={s <= review.rating ? "text-gold fill-gold" : "text-cream-darker"} />
                                        ))}
                                        <span className="text-xs text-charcoal-lighter ml-1">by <strong>{review.client.name}</strong></span>
                                        <span className="text-xs text-charcoal-lighter">·</span>
                                        <span className="text-xs text-charcoal-lighter">{new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                                    </div>

                                    {review.title && (
                                        <p className="font-semibold text-sm text-espresso mb-0.5">{review.title}</p>
                                    )}
                                    {review.comment && (
                                        <p className="text-sm text-charcoal-lighter">{review.comment}</p>
                                    )}
                                </div>

                                {/* Actions */}
                                {!review.isPublished && (
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => moderate(review.id, "approve")}
                                            disabled={moderating === review.id}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-xs font-semibold rounded-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                                        >
                                            {moderating === review.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => moderate(review.id, "reject")}
                                            disabled={moderating === review.id}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-100 text-red-700 text-xs font-semibold rounded-sm hover:bg-red-200 transition-colors disabled:opacity-50"
                                        >
                                            {moderating === review.id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                                            Reject
                                        </button>
                                    </div>
                                )}
                                {review.isPublished && (
                                    <button
                                        onClick={() => moderate(review.id, "reject")}
                                        disabled={moderating === review.id}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-600 text-xs font-semibold rounded-sm hover:bg-red-100 hover:text-red-700 transition-colors disabled:opacity-50"
                                    >
                                        <XCircle size={12} /> Unpublish
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
