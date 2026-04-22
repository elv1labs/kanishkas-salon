"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
    const errorParam = searchParams.get("error");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const [error, setError] = useState(
        errorParam === "AccountDeactivated"
            ? "Your account has been deactivated. Please contact support."
            : errorParam === "CredentialsSignin"
                ? "Invalid email or password."
                : errorParam
                    ? "An error occurred. Please try again."
                    : ""
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await signIn("credentials", {
                email: email.toLowerCase().trim(),
                password,
                redirect: false,
            });

            if (result?.error) {
                setError(result.error);
            } else {
                router.push(callbackUrl);
                router.refresh();
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="bg-espresso-50/80 backdrop-blur-sm rounded-sm p-8 border border-gold/10 shadow-2xl">
            <h2 className="font-display text-2xl text-cream text-center mb-1">
                Welcome Back
            </h2>
            <p className="text-cream/40 text-sm text-center mb-8 font-accent tracking-wide">
                Sign in to your account
            </p>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-sm px-4 py-3 mb-6">
                    <p className="text-red-300 text-sm">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
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
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            className="w-full bg-espresso/60 border border-gold/10 rounded-sm py-3 pl-10 pr-4 text-cream placeholder:text-cream/20 text-sm focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-all"
                        />
                    </div>
                </div>

                {/* Password */}
                <div>
                    <label className="block text-cream/60 text-xs uppercase tracking-wider mb-2 font-body">
                        Password
                    </label>
                    <div className="relative">
                        <Lock
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-cream/30"
                        />
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            minLength={8}
                            className="w-full bg-espresso/60 border border-gold/10 rounded-sm py-3 pl-10 pr-12 text-cream placeholder:text-cream/20 text-sm focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-all"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/30 hover:text-cream/60 transition-colors"
                        >
                            {showPassword ? (
                                <EyeOff size={16} />
                            ) : (
                                <Eye size={16} />
                            )}
                        </button>
                    </div>
                </div>

                {/* Forgot password link */}
                <div className="flex justify-end -mt-1">
                    <Link
                        href="/forgot-password"
                        className="text-gold/70 hover:text-gold text-xs transition-colors"
                    >
                        Forgot Password?
                    </Link>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-gold py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <Loader2 size={18} className="animate-spin mx-auto" />
                    ) : (
                        "Sign In"
                    )}
                </button>
            </form>


            {/* Register link */}
            <p className="text-center text-cream/40 text-sm mt-8">
                Don&apos;t have an account?{" "}
                <Link
                    href="/register"
                    className="text-gold hover:text-gold-light transition-colors font-semibold"
                >
                    Create Account
                </Link>
            </p>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center py-20">
                <Loader2 size={32} className="animate-spin text-gold" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
