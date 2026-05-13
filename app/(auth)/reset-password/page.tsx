"use client";
import { extractApiError } from "@/lib/extract-error";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token") ?? "";
    const email = searchParams.get("email") ?? "";

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const passwordChecks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        match: password === confirmPassword && confirmPassword.length > 0,
    };

    if (!token || !email) {
        return (
            <div className="bg-espresso-50/80 backdrop-blur-sm rounded-sm p-8 border border-gold/10 shadow-2xl text-center">
                <h2 className="font-display text-2xl text-cream mb-4">Invalid Reset Link</h2>
                <p className="text-cream/50 text-sm mb-6">
                    This password reset link is invalid or has expired.
                </p>
                <Link
                    href="/forgot-password"
                    className="inline-flex items-center gap-2 text-gold hover:text-gold-light text-sm transition-colors"
                >
                    Request a new reset link
                </Link>
            </div>
        );
    }

    if (success) {
        return (
            <div className="bg-espresso-50/80 backdrop-blur-sm rounded-sm p-8 border border-gold/10 shadow-2xl text-center">
                <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={28} className="text-green-400" />
                </div>
                <h2 className="font-display text-2xl text-cream mb-2">Password Updated</h2>
                <p className="text-cream/50 text-sm mb-6">
                    Your password has been reset successfully. You can now sign in with your new password.
                </p>
                <button
                    onClick={() => router.push("/login")}
                    className="btn-gold px-8 py-3"
                >
                    Sign In
                </button>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!passwordChecks.length || !passwordChecks.uppercase || !passwordChecks.number) {
            setError("Password doesn't meet the requirements.");
            return;
        }
        if (!passwordChecks.match) {
            setError("Passwords don't match.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(extractApiError(data, "Something went wrong."));
                return;
            }

            setSuccess(true);
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-espresso-50/80 backdrop-blur-sm rounded-sm p-8 border border-gold/10 shadow-2xl">
            <h2 className="font-display text-2xl text-cream text-center mb-1">
                Set New Password
            </h2>
            <p className="text-cream/40 text-sm text-center mb-8 font-accent tracking-wide">
                Choose a strong, unique password
            </p>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-sm px-4 py-3 mb-6">
                    <p className="text-red-300 text-sm">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div>
                    <label className="block text-cream/60 text-xs uppercase tracking-wider mb-2 font-body">
                        New Password
                    </label>
                    <div className="relative">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream/30" />
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError("");
                            }}
                            placeholder="Min 8 characters"
                            required
                            className="w-full bg-espresso/60 border border-gold/10 rounded-sm py-3 pl-10 pr-12 text-cream placeholder:text-cream/20 text-sm focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-all"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/30 hover:text-cream/60 transition-colors"
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>

                    {/* Password requirements */}
                    {password.length > 0 && (
                        <div className="mt-2 space-y-1">
                            {[
                                { check: passwordChecks.length, label: "8+ characters" },
                                { check: passwordChecks.uppercase, label: "One uppercase letter" },
                                { check: passwordChecks.number, label: "One number" },
                            ].map((req, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <CheckCircle2
                                        size={12}
                                        className={req.check ? "text-green-400" : "text-cream/20"}
                                    />
                                    <span className={`text-xs ${req.check ? "text-green-400" : "text-cream/30"}`}>
                                        {req.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Confirm Password */}
                <div>
                    <label className="block text-cream/60 text-xs uppercase tracking-wider mb-2 font-body">
                        Confirm Password
                    </label>
                    <div className="relative">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream/30" />
                        <input
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                setError("");
                            }}
                            placeholder="Re-enter password"
                            required
                            className="w-full bg-espresso/60 border border-gold/10 rounded-sm py-3 pl-10 pr-4 text-cream placeholder:text-cream/20 text-sm focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-all"
                        />
                    </div>
                    {confirmPassword.length > 0 && !passwordChecks.match && (
                        <p className="text-red-400/70 text-xs mt-1">Passwords don&apos;t match</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-gold py-3.5 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                    {loading ? (
                        <Loader2 size={18} className="animate-spin mx-auto" />
                    ) : (
                        "Reset Password"
                    )}
                </button>
            </form>

            <p className="text-center text-cream/40 text-sm mt-8">
                <Link
                    href="/login"
                    className="inline-flex items-center gap-1 text-gold hover:text-gold-light transition-colors"
                >
                    <ArrowLeft size={14} />
                    Back to Sign In
                </Link>
            </p>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense
            fallback={
                <div className="flex justify-center items-center py-20">
                    <Loader2 size={32} className="animate-spin text-gold" />
                </div>
            }
        >
            <ResetPasswordContent />
        </Suspense>
    );
}
