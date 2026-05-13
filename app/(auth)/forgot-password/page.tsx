"use client";
import { extractApiError } from "@/lib/extract-error";

import { useState } from "react";
import Link from "next/link";
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.toLowerCase().trim() }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(extractApiError(data, "Something went wrong."));
                return;
            }

            setSent(true);
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <div className="bg-espresso-50/80 backdrop-blur-sm rounded-sm p-8 border border-gold/10 shadow-2xl">
                <div className="text-center">
                    <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={28} className="text-green-400" />
                    </div>
                    <h2 className="font-display text-2xl text-cream mb-2">Check Your Email</h2>
                    <p className="text-cream/50 text-sm mb-6 leading-relaxed">
                        If an account exists for <strong className="text-cream/70">{email}</strong>,
                        we&apos;ve sent a password reset link. It expires in 1 hour.
                    </p>
                    <p className="text-cream/30 text-xs mb-6">
                        Don&apos;t see it? Check your spam folder.
                    </p>
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 text-gold hover:text-gold-light text-sm transition-colors"
                    >
                        <ArrowLeft size={14} />
                        Back to Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-espresso-50/80 backdrop-blur-sm rounded-sm p-8 border border-gold/10 shadow-2xl">
            <h2 className="font-display text-2xl text-cream text-center mb-1">
                Forgot Password
            </h2>
            <p className="text-cream/40 text-sm text-center mb-8 font-accent tracking-wide">
                Enter your email to receive a reset link
            </p>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-sm px-4 py-3 mb-6">
                    <p className="text-red-300 text-sm">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-cream/60 text-xs uppercase tracking-wider mb-2 font-body">
                        Email Address
                    </label>
                    <div className="relative">
                        <Mail
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-cream/30"
                        />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setError("");
                            }}
                            placeholder="you@example.com"
                            required
                            className="w-full bg-espresso/60 border border-gold/10 rounded-sm py-3 pl-10 pr-4 text-cream placeholder:text-cream/20 text-sm focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-all"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-gold py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <Loader2 size={18} className="animate-spin mx-auto" />
                    ) : (
                        "Send Reset Link"
                    )}
                </button>
            </form>

            <p className="text-center text-cream/40 text-sm mt-8">
                Remember your password?{" "}
                <Link
                    href="/login"
                    className="text-gold hover:text-gold-light transition-colors font-semibold"
                >
                    Sign In
                </Link>
            </p>
        </div>
    );
}
