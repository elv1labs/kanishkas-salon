"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, Loader2, Check, X, MessageSquare, RefreshCw } from "lucide-react";

interface Review {
    id: string;
    rating: number;
    comment: string | null;
    isApproved: boolean;
    isPublished: boolean;
    ownerResponse: string | null;
    createdAt: string;
    client: { id: string; name: string } | null;
    service: { id: string; name: string } | null;
    product: { id: string; name: string } | null;
}

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"pending" | "approved" | "all">("pending");
    const [respondingTo, setRespondingTo] = useState<string | null>(null);
    const [responseText, setResponseText] = useState("");
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchReviews = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: "100" });
            if (filter === "pending") params.set("approved", "false");
            else if (filter === "approved") params.set("approved", "true");
            const res = await fetch(`/api/reviews?${params}`);
            const data = await res.json();
            setReviews(data.reviews ?? []);
        } catch (e) {
            console.error("Failed to load reviews", e);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => { fetchReviews(); }, [fetchReviews]);

    const handleAction = async (id: string, action: "approve" | "reject") => {
        setActionLoading(id);
        try {
            await fetch("/api/reviews", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, action }),
            });
            fetchReviews();
        } catch (e) { console.error(e); }
        finally { setActionLoading(null); }
    };

    const handleRespond = async (id: string) => {
        if (!responseText.trim()) return;
        setActionLoading(id);
        try {
            await fetch("/api/reviews", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, action: "respond", ownerResponse: responseText }),
            });
            setRespondingTo(null);
            setResponseText("");
            fetchReviews();
        } catch (e) { console.error(e); }
        finally { setActionLoading(null); }
    };

    const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-2xl text-espresso flex items-center gap-2">
                        <Star className="text-gold" size={22} /> Review Moderation
                    </h1>
                    <p className="text-sm text-charcoal-lighter mt-1">Approve, reject, and respond to customer reviews.</p>
                </div>
                <button onClick={fetchReviews} className="text-gold hover:text-gold-dark transition-colors">
                    <RefreshCw size={18} />
                </button>
            </div>

            <div className="flex gap-2">
                {(["pending", "approved", "all"] as const).map((f) => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`px-4 py-2 text-sm rounded-sm border transition-all capitalize ${filter === f ? "border-gold bg-gold/10 text-gold font-medium" : "border-cream-darker text-charcoal-lighter hover:border-gold/30"}`}>
                        {f}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gold" size={28} /></div>
            ) : reviews.length === 0 ? (
                <div className="text-center py-12 text-charcoal-lighter">
                    <Star size={40} className="mx-auto mb-3 opacity-30" />
                    <p>No {filter !== "all" ? filter : ""} reviews found.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {reviews.map((review) => (
                        <div key={review.id} className="bg-white rounded-sm border border-cream-darker/50 p-5">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <span className="text-gold text-sm tracking-wider">{stars(review.rating)}</span>
                                    <p className="text-xs text-charcoal-lighter mt-0.5">
                                        by <strong className="text-espresso">{review.client?.name ?? "Unknown"}</strong>
                                        {review.service && <> · {review.service.name}</>}
                                        {review.product && <> · {review.product.name}</>}
                                        <span className="ml-2">{new Date(review.createdAt).toLocaleDateString("en-IN")}</span>
                                    </p>
                                </div>
                                <div className="flex gap-1.5">
                                    {!review.isApproved && (
                                        <>
                                            <button onClick={() => handleAction(review.id, "approve")}
                                                disabled={actionLoading === review.id}
                                                className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors" title="Approve">
                                                <Check size={14} />
                                            </button>
                                            <button onClick={() => handleAction(review.id, "reject")}
                                                disabled={actionLoading === review.id}
                                                className="p-1.5 bg-red-50 text-red-500 rounded hover:bg-red-100 transition-colors" title="Reject">
                                                <X size={14} />
                                            </button>
                                        </>
                                    )}
                                    <button onClick={() => { setRespondingTo(respondingTo === review.id ? null : review.id); setResponseText(review.ownerResponse ?? ""); }}
                                        className="p-1.5 bg-blue-50 text-blue-500 rounded hover:bg-blue-100 transition-colors" title="Respond">
                                        <MessageSquare size={14} />
                                    </button>
                                </div>
                            </div>
                            {review.comment && <p className="text-sm text-charcoal leading-relaxed">{review.comment}</p>}
                            {review.ownerResponse && respondingTo !== review.id && (
                                <div className="mt-3 bg-gold/5 border-l-2 border-gold/30 pl-3 py-2">
                                    <p className="text-xs text-charcoal-lighter font-medium mb-1">Owner Response:</p>
                                    <p className="text-sm text-charcoal">{review.ownerResponse}</p>
                                </div>
                            )}
                            {respondingTo === review.id && (
                                <div className="mt-3 space-y-2">
                                    <textarea value={responseText} onChange={(e) => setResponseText(e.target.value)}
                                        placeholder="Write your response..."
                                        rows={3}
                                        className="w-full bg-cream border border-cream-darker/50 rounded-sm p-3 text-sm focus:outline-none focus:border-gold/40 resize-none" />
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={() => setRespondingTo(null)}
                                            className="px-3 py-1.5 text-xs text-charcoal-lighter hover:text-charcoal">Cancel</button>
                                        <button onClick={() => handleRespond(review.id)}
                                            disabled={actionLoading === review.id || !responseText.trim()}
                                            className="px-4 py-1.5 bg-gold text-white text-xs rounded-sm hover:bg-gold-dark disabled:opacity-50 transition-colors">
                                            {actionLoading === review.id ? <Loader2 size={12} className="animate-spin" /> : "Save Response"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
