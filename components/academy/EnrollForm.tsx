"use client";
// components/academy/EnrollForm.tsx
// Inline enrollment form — same pattern as ReviewForm (no modal, no navigation)

import { useState } from "react";
import { useSession } from "next-auth/react";
import { GraduationCap, Loader2, CheckCircle, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";

interface EnrollFormProps {
    courseId: string;
    courseName: string;
    coursePrice: number;
}

type EnrollStatus = "idle" | "open" | "submitting" | "success" | "error";

export default function EnrollForm({ courseId, courseName, coursePrice }: EnrollFormProps) {
    const { data: session, status } = useSession();
    const [enrollStatus, setEnrollStatus] = useState<EnrollStatus>("idle");
    const [note, setNote] = useState("");
    const [error, setError] = useState("");
    const MAX_NOTE = 300;

    const isLoggedIn = status === "authenticated" && session?.user;

    // If not logged in — show Login to Enroll
    if (status === "loading") {
        return <div className="h-10 w-40 bg-charcoal/10 animate-pulse rounded-sm" />;
    }

    if (!isLoggedIn) {
        return (
            <a
                href={`/login?callbackUrl=/academy/${courseId}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-espresso text-cream text-sm font-semibold rounded-sm hover:bg-espresso/90 transition-colors"
            >
                <GraduationCap size={16} />
                Login to Enroll
            </a>
        );
    }

    // Success state — permanent
    if (enrollStatus === "success") {
        return (
            <div className="bg-green-50 border border-green-200 rounded-sm p-5">
                <div className="flex items-start gap-3">
                    <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-green-800 mb-1">Enrollment Request Submitted!</p>
                        <p className="text-sm text-green-700">
                            Our team will contact you within 24 hours to confirm your spot and arrange payment.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const handleSubmit = async () => {
        setEnrollStatus("submitting");
        setError("");

        try {
            const res = await fetch("/api/academy/enroll", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ courseId, note: note.trim() || undefined }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error ?? "Something went wrong. Please try again.");
                setEnrollStatus("open");
                return;
            }

            setEnrollStatus("success");
        } catch {
            setError("Network error. Please try again.");
            setEnrollStatus("open");
        }
    };

    const isOpen = enrollStatus === "open" || enrollStatus === "error";
    const isSubmitting = enrollStatus === "submitting";

    return (
        <div className="space-y-0">
            {/* Toggle button */}
            {enrollStatus === "idle" && (
                <button
                    id="enroll-now-btn"
                    onClick={() => setEnrollStatus("open")}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-espresso text-sm font-bold rounded-sm hover:bg-gold/90 transition-colors shadow-sm"
                >
                    <GraduationCap size={16} />
                    Enroll Now
                </button>
            )}

            {/* Inline form */}
            {(isOpen || isSubmitting) && (
                <div className="border border-gold/30 rounded-sm bg-cream-light overflow-hidden">
                    {/* Form header */}
                    <div className="flex items-center justify-between px-5 py-4 bg-cream border-b border-charcoal/10">
                        <div className="flex items-center gap-2">
                            <GraduationCap size={16} className="text-gold" />
                            <span className="font-semibold text-espresso text-sm">Enroll in {courseName}</span>
                        </div>
                        <button
                            onClick={() => setEnrollStatus("idle")}
                            disabled={isSubmitting}
                            className="text-charcoal-lighter hover:text-espresso transition-colors"
                            aria-label="Close"
                        >
                            <ChevronUp size={16} />
                        </button>
                    </div>

                    <div className="p-5 space-y-4">
                        {/* Price info */}
                        <div className="text-sm text-charcoal-lighter bg-white border border-charcoal/10 rounded-sm px-4 py-3">
                            <span className="font-medium text-espresso">Course fee: </span>
                            ₹{coursePrice.toLocaleString("en-IN")}
                            <span className="ml-2 text-xs">(payment arranged upon confirmation)</span>
                        </div>

                        {/* Note textarea */}
                        <div>
                            <label className="block text-xs font-medium text-charcoal-lighter mb-1.5 uppercase tracking-wider">
                                Message / Query <span className="normal-case font-normal">(optional)</span>
                            </label>
                            <textarea
                                id="enroll-note"
                                rows={3}
                                maxLength={MAX_NOTE}
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                disabled={isSubmitting}
                                placeholder="Any questions about the course, preferred timings, or prior experience..."
                                className="w-full text-sm px-3 py-2.5 border border-charcoal/20 rounded-sm resize-none focus:outline-none focus:ring-1 focus:ring-gold/50 focus:border-gold/50 bg-white text-espresso placeholder:text-charcoal/30 disabled:opacity-60"
                            />
                            <p className={`text-right text-xs mt-1 ${note.length >= MAX_NOTE ? "text-red-500" : "text-charcoal-lighter"}`}>
                                {note.length}/{MAX_NOTE}
                            </p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-sm px-3 py-2">
                                <AlertCircle size={14} className="flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            id="submit-enrollment-btn"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-gold text-espresso font-bold text-sm rounded-sm hover:bg-gold/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <GraduationCap size={16} />
                                    Submit Enrollment Request
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
