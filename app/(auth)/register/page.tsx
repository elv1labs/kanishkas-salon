"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, User, Phone, Loader2, CheckCircle2 } from "lucide-react";


export default function RegisterPage() {
    const router = useRouter();

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const passwordChecks = {
        length: form.password.length >= 8,
        uppercase: /[A-Z]/.test(form.password),
        number: /[0-9]/.test(form.password),
        match: form.password === form.confirmPassword && form.confirmPassword.length > 0,
    };

    const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        setError("");
    };

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
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name.trim(),
                    email: form.email.toLowerCase().trim(),
                    phone: form.phone || undefined,
                    password: form.password,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Registration failed.");
                return;
            }

            // Auto sign-in after registration
            const signInResult = await signIn("credentials", {
                email: form.email.toLowerCase().trim(),
                password: form.password,
                redirect: false,
            });

            if (signInResult?.ok) {
                router.push("/dashboard");
                router.refresh();
            } else {
                router.push("/login?registered=true");
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
                Create Account
            </h2>
            <p className="text-cream/40 text-sm text-center mb-8 font-accent tracking-wide">
                Join our salon family
            </p>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-sm px-4 py-3 mb-6">
                    <p className="text-red-300 text-sm">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                    <label className="block text-cream/60 text-xs uppercase tracking-wider mb-2 font-body">
                        Full Name
                    </label>
                    <div className="relative">
                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream/30" />
                        <input
                            type="text"
                            value={form.name}
                            onChange={update("name")}
                            placeholder="Your full name"
                            required
                            minLength={2}
                            className="w-full bg-espresso/60 border border-gold/10 rounded-sm py-3 pl-10 pr-4 text-cream placeholder:text-cream/20 text-sm focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-all"
                        />
                    </div>
                </div>

                {/* Email */}
                <div>
                    <label className="block text-cream/60 text-xs uppercase tracking-wider mb-2 font-body">
                        Email Address
                    </label>
                    <div className="relative">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream/30" />
                        <input
                            type="email"
                            value={form.email}
                            onChange={update("email")}
                            placeholder="you@example.com"
                            required
                            className="w-full bg-espresso/60 border border-gold/10 rounded-sm py-3 pl-10 pr-4 text-cream placeholder:text-cream/20 text-sm focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-all"
                        />
                    </div>
                </div>

                {/* Phone */}
                <div>
                    <label className="block text-cream/60 text-xs uppercase tracking-wider mb-2 font-body">
                        Mobile Number <span className="text-cream/20">(optional)</span>
                    </label>
                    <div className="relative">
                        <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream/30" />
                        <input
                            type="tel"
                            value={form.phone}
                            onChange={update("phone")}
                            placeholder="9876543210"
                            pattern="[6-9]\d{9}"
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
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream/30" />
                        <input
                            type={showPassword ? "text" : "password"}
                            value={form.password}
                            onChange={update("password")}
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
                    {form.password.length > 0 && (
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
                            value={form.confirmPassword}
                            onChange={update("confirmPassword")}
                            placeholder="Re-enter password"
                            required
                            className="w-full bg-espresso/60 border border-gold/10 rounded-sm py-3 pl-10 pr-4 text-cream placeholder:text-cream/20 text-sm focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-all"
                        />
                    </div>
                    {form.confirmPassword.length > 0 && !passwordChecks.match && (
                        <p className="text-red-400/70 text-xs mt-1">Passwords don&apos;t match</p>
                    )}
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-gold py-3.5 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                    {loading ? (
                        <Loader2 size={18} className="animate-spin mx-auto" />
                    ) : (
                        "Create Account"
                    )}
                </button>
            </form>



            {/* Login link */}
            <p className="text-center text-cream/40 text-sm mt-8">
                Already have an account?{" "}
                <Link href="/login" className="text-gold hover:text-gold-light transition-colors font-semibold">
                    Sign In
                </Link>
            </p>
        </div>
    );
}
