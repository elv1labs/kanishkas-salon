"use client";
import { extractApiError } from "@/lib/extract-error";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Star, Send, Loader2, CheckCircle2 } from "lucide-react";

interface ReviewFormProps {
    serviceId?: string;
    productId?: string;
    /** Label shown in placeholder and heading e.g. "Gold Facial" */
    subjectName: string;
}

type Status = "idle" | "loading" | "success" | "error" | "duplicate";

export default function ReviewForm({ serviceId, productId, subjectName }: ReviewFormProps) {
    const { data: session, status: authStatus } = useSession();

    const [rating, setRating] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [title, setTitle] = useState("");
    const [comment, setComment] = useState("");
    const [status, setStatus] = useState<Status>("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const isLoading = authStatus === "loading";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rating) { setErrorMsg("Please select a star rating."); setStatus("error"); return; }
        if (!comment.trim()) { setErrorMsg("Please write a short comment."); setStatus("error"); return; }

        setStatus("loading");
        setErrorMsg("");

        try {
            const res = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...(serviceId ? { serviceId } : {}),
                    ...(productId ? { productId } : {}),
                    rating,
                    title: title.trim() || undefined,
                    comment: comment.trim(),
                }),
            });

            const data = await res.json();

            if (res.status === 409) {
                setStatus("duplicate");
                return;
            }
            if (!res.ok) {
                setErrorMsg(extractApiError(data, "Something went wrong. Please try again."));
                setStatus("error");
                return;
            }

            setStatus("success");
        } catch {
            setErrorMsg("Network error. Please check your connection.");
            setStatus("error");
        }
    };

    // ── States ────────────────────────────────────────────────────────────────

    if (isLoading) return null;

    if (!session) {
        return (
            <div className="rounded-sm border border-gold/20 bg-gold/5 p-6 text-center">
                <p className="text-sm text-charcoal mb-3">
                    <Link href={`/login?callbackUrl=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/")}`}
                        className="text-gold font-semibold hover:underline">Sign in</Link>
                    {" "}to leave a review for <strong>{subjectName}</strong>.
                </p>
            </div>
        );
    }

    if (status === "success") {
        return (
            <div className="rounded-sm border border-green-200 bg-green-50 p-6 text-center">
                <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-3" />
                <p className="font-display text-base text-espresso font-semibold">Thank you for your review!</p>
                <p className="text-sm text-charcoal-lighter mt-1">
                    It will appear here once approved by our team (usually within 24 hours).
                </p>
            </div>
        );
    }

    if (status === "duplicate") {
        return (
            <div className="rounded-sm border border-amber-200 bg-amber-50 p-6 text-center">
                <p className="text-sm text-amber-800 font-medium">You&apos;ve already submitted a review for {subjectName}. Thank you! 💛</p>
            </div>
        );
    }

    const activeRating = hovered || rating;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Star rating */}
            <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-lighter mb-2">
                    Your Rating <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-1" role="group" aria-label="Star rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHovered(star)}
                            onMouseLeave={() => setHovered(0)}
                            aria-label={`${star} star${star !== 1 ? "s" : ""}`}
                            className="transition-transform hover:scale-110 focus:outline-none"
                        >
                            <Star
                                size={28}
                                className={`transition-colors ${
                                    star <= activeRating
                                        ? "text-gold fill-gold"
                                        : "text-cream-darker fill-cream-darker"
                                }`}
                            />
                        </button>
                    ))}
                </div>
            </div>

            {/* Optional title */}
            <div>
                <label htmlFor="review-title" className="block text-xs font-semibold uppercase tracking-wider text-charcoal-lighter mb-1.5">
                    Title <span className="text-charcoal-lighter font-normal">(optional)</span>
                </label>
                <input
                    id="review-title"
                    type="text"
                    value={title}
                    maxLength={100}
                    onChange={e => setTitle(e.target.value)}
                    placeholder={`e.g. "Loved the ${subjectName}!"`}
                    className="w-full border border-cream-darker rounded-sm px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-gold/50 transition-colors"
                />
            </div>

            {/* Comment */}
            <div>
                <label htmlFor="review-comment" className="block text-xs font-semibold uppercase tracking-wider text-charcoal-lighter mb-1.5">
                    Your Review <span className="text-red-400">*</span>
                </label>
                <textarea
                    id="review-comment"
                    value={comment}
                    maxLength={500}
                    rows={4}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Tell others what you liked or what could be better..."
                    className="w-full border border-cream-darker rounded-sm px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-gold/50 transition-colors resize-none"
                />
                <p className="text-right text-xs text-charcoal-lighter mt-1">{comment.length}/500</p>
            </div>

            {/* Error */}
            {status === "error" && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-sm px-3 py-2">{errorMsg}</p>
            )}

            {/* Submit */}
            <button
                type="submit"
                disabled={status === "loading" || !rating}
                className="btn-gold w-full sm:w-auto py-3 px-8 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {status === "loading" ? (
                    <><Loader2 size={16} className="animate-spin" /> Submitting…</>
                ) : (
                    <><Send size={15} /> Submit Review</>
                )}
            </button>
        </form>
    );
}
