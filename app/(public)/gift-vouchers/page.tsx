"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
    Gift, Copy, CheckCircle, Loader2, Heart,
    IndianRupee, User, Mail, MessageSquare,
    Sparkles, ArrowRight, Tag
} from "lucide-react";
import MotionWrapper from "@/components/ui/MotionWrapper";

// ── Preset amounts ────────────────────────────────────────────────────────────

const PRESETS = [500, 1000, 2000, 5000];

// ── Success Screen ────────────────────────────────────────────────────────────

function SuccessScreen({
    code,
    value,
    recipientName,
    expiresAt,
    onReset,
}: {
    code: string;
    value: number;
    recipientName: string;
    expiresAt: string;
    onReset: () => void;
}) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <section className="section-padding bg-cream min-h-[60vh]">
            <div className="container-salon max-w-lg mx-auto">
                <MotionWrapper>
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-5">
                            <Gift className="text-gold" size={36} />
                        </div>
                        <h1 className="font-display text-3xl text-espresso mb-2">Your Voucher is Ready! 💛</h1>
                        <p className="text-charcoal-lighter text-sm">
                            Share this code with <strong>{recipientName}</strong> — they can use it at their next appointment.
                        </p>
                    </div>

                    {/* Voucher card */}
                    <div className="bg-gradient-to-br from-espresso to-espresso/90 rounded-lg p-8 mb-6 relative overflow-hidden shadow-xl">
                        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-gold/5 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-rose-gold/5 blur-3xl" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-5">
                                <Sparkles size={14} className="text-gold" />
                                <span className="text-gold text-xs font-accent uppercase tracking-widest">Kanishka's Family Salon & Academy</span>
                            </div>
                            <p className="font-display text-4xl font-bold text-gold mb-1">
                                ₹{value.toLocaleString("en-IN")}
                            </p>
                            <p className="text-cream/50 text-xs mb-6">Gift Voucher</p>
                            <div className="bg-white/10 rounded-md px-5 py-3 mb-4">
                                <p className="text-xs text-cream/40 uppercase tracking-widest mb-1">Voucher Code</p>
                                <p className="font-mono text-xl font-bold text-cream tracking-[0.12em]">{code}</p>
                            </div>
                            <div className="flex justify-between text-xs text-cream/40">
                                <span>For: <span className="text-cream/70">{recipientName}</span></span>
                                <span>Valid until: <span className="text-cream/70">{new Date(expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span></span>
                            </div>
                        </div>
                    </div>

                    {/* Copy button */}
                    <button
                        onClick={handleCopy}
                        className={`w-full py-3.5 rounded-sm font-semibold text-sm flex items-center justify-center gap-2 transition-all mb-4 ${
                            copied
                                ? "bg-green-600 text-white"
                                : "bg-espresso text-cream hover:bg-espresso/90"
                        }`}
                    >
                        {copied ? <><CheckCircle size={16} /> Copied!</> : <><Copy size={16} /> Copy Voucher Code</>}
                    </button>

                    {/* Payment notice */}
                    <div className="bg-gold/5 border border-gold/20 rounded-sm p-5 mb-6">
                        <div className="flex items-start gap-3">
                            <IndianRupee size={16} className="text-gold mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                                <p className="font-semibold text-espresso mb-1">Payment Arrangement</p>
                                <p className="text-charcoal-lighter text-xs leading-relaxed">
                                    Please visit the salon or{" "}
                                    <a href="https://wa.me/919171230292" target="_blank" rel="noopener noreferrer" className="text-green-600 font-medium hover:underline">
                                        contact us on WhatsApp
                                    </a>
                                    {" "}to complete payment for this voucher. Our team will activate it for use once payment is confirmed.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={onReset} className="flex-1 btn-outline py-3 text-sm">
                            Buy Another Voucher
                        </button>
                        <Link href="/dashboard/client" className="flex-1 btn-gold py-3 text-sm text-center">
                            Go to Dashboard
                        </Link>
                    </div>
                </MotionWrapper>
            </div>
        </section>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function GiftVouchersPage() {
    const { data: session, status: authStatus } = useSession();

    const [amount, setAmount] = useState<number | null>(null);
    const [customAmount, setCustomAmount] = useState("");
    const [useCustom, setUseCustom] = useState(false);
    const [recipientName, setRecipientName] = useState("");
    const [recipientEmail, setRecipientEmail] = useState("");
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{
        code: string; value: number; recipientName: string; expiresAt: string;
    } | null>(null);

    const selectedAmount = useCustom
        ? (parseInt(customAmount.replace(/\D/g, "")) || null)
        : amount;

    const isValid = !!selectedAmount && selectedAmount >= 100 && recipientName.trim().length >= 2;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid || !session) return;
        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch("/api/vouchers/purchase", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    value: selectedAmount,
                    recipientName: recipientName.trim(),
                    recipientEmail: recipientEmail.trim() || undefined,
                    message: message.trim() || undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                const msg = data.error ?? data.details?.fieldErrors
                    ? Object.values(data.details?.fieldErrors ?? {}).flat().join(", ")
                    : "Something went wrong. Please try again.";
                setError(typeof msg === "string" ? msg : String(msg));
                return;
            }
            setResult({ code: data.data.code, value: data.data.value, recipientName: data.data.recipientName, expiresAt: data.data.expiresAt });
        } catch {
            setError("Network error. Please check your connection.");
        } finally {
            setSubmitting(false);
        }
    };

    if (result) {
        return (
            <SuccessScreen
                code={result.code}
                value={result.value}
                recipientName={result.recipientName}
                expiresAt={result.expiresAt}
                onReset={() => {
                    setResult(null);
                    setAmount(null);
                    setCustomAmount("");
                    setUseCustom(false);
                    setRecipientName("");
                    setRecipientEmail("");
                    setMessage("");
                }}
            />
        );
    }

    return (
        <>
            {/* Hero */}
            <section className="relative py-24 bg-espresso overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-espresso via-espresso to-espresso/90" />
                <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-gold/5 blur-3xl" />
                <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-rose-gold/5 blur-3xl" />

                <div className="relative z-10 container-salon px-4 text-center">
                    <MotionWrapper>
                        <div className="inline-flex items-center gap-2 mb-4">
                            <Gift size={16} className="text-gold" />
                            <span className="font-accent text-xs uppercase tracking-widest text-gold">Gift Cards</span>
                        </div>
                        <h1 className="font-display text-4xl sm:text-5xl font-bold text-cream mb-4 leading-tight">
                            Give the Gift of <span className="text-gold italic">Beauty</span>
                        </h1>
                        <p className="text-cream/60 text-lg max-w-xl mx-auto mb-8">
                            Treat someone special to a luxurious salon experience. Choose an amount, personalise the note, and we'll take care of the rest.
                        </p>

                        {/* Trust badges */}
                        <div className="flex flex-wrap justify-center gap-6">
                            {[
                                { icon: "✦", label: "Valid for 12 months" },
                                { icon: "✦", label: "All services covered" },
                                { icon: "✦", label: "Never expires early" },
                            ].map(b => (
                                <div key={b.label} className="flex items-center gap-2 text-cream/50 text-sm">
                                    <span className="text-gold text-xs">{b.icon}</span>
                                    {b.label}
                                </div>
                            ))}
                        </div>
                    </MotionWrapper>
                </div>
            </section>

            {/* Builder */}
            <section className="section-padding bg-cream">
                <div className="container-salon max-w-2xl mx-auto">
                    <MotionWrapper>
                        {!session && authStatus !== "loading" && (
                            <div className="bg-gold/5 border border-gold/20 rounded-sm p-5 mb-8 text-center">
                                <Gift size={24} className="text-gold mx-auto mb-2" />
                                <p className="text-sm text-charcoal mb-3">
                                    Please{" "}
                                    <Link href="/login?callbackUrl=/gift-vouchers" className="text-gold font-semibold hover:underline">
                                        sign in
                                    </Link>
                                    {" "}to purchase a gift voucher.
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Amount Selector */}
                            <div className="bg-white border border-cream-darker/50 rounded-sm p-6">
                                <h2 className="font-display text-lg text-espresso mb-1">Choose an Amount</h2>
                                <div className="gold-line mb-5" />

                                {/* Preset grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                    {PRESETS.map(p => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => { setAmount(p); setUseCustom(false); }}
                                            className={`py-4 rounded-sm border-2 text-center transition-all ${
                                                !useCustom && amount === p
                                                    ? "border-gold bg-gold/10 text-espresso"
                                                    : "border-cream-darker/50 bg-white text-charcoal hover:border-gold/40"
                                            }`}
                                        >
                                            <p className="font-display text-xl font-bold">₹{p.toLocaleString("en-IN")}</p>
                                        </button>
                                    ))}
                                </div>

                                {/* Custom amount */}
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => setUseCustom(v => !v)}
                                        className={`text-sm flex items-center gap-1.5 transition-colors ${useCustom ? "text-gold" : "text-charcoal-lighter hover:text-gold"}`}
                                    >
                                        <Tag size={13} />
                                        {useCustom ? "Custom amount selected" : "Enter a custom amount"}
                                    </button>
                                    {useCustom && (
                                        <div className="mt-3 relative">
                                            <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-lighter" />
                                            <input
                                                type="number"
                                                min="100"
                                                max="50000"
                                                value={customAmount}
                                                onChange={e => setCustomAmount(e.target.value)}
                                                placeholder="e.g. 1500"
                                                autoFocus
                                                className="w-full border border-cream-darker rounded-sm py-3 pl-9 pr-4 text-sm focus:outline-none focus:border-gold/50 bg-cream"
                                            />
                                            <p className="text-xs text-charcoal-lighter mt-1">Min ₹100 · Max ₹50,000</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Recipient Details */}
                            <div className="bg-white border border-cream-darker/50 rounded-sm p-6">
                                <h2 className="font-display text-lg text-espresso mb-1">
                                    <Heart size={15} className="inline text-rose-400 mr-1.5" />
                                    Recipient Details
                                </h2>
                                <div className="gold-line mb-5" />

                                <div className="space-y-4">
                                    {/* Name */}
                                    <div>
                                        <label htmlFor="recipient-name" className="block text-xs font-semibold uppercase tracking-wider text-charcoal-lighter mb-1.5">
                                            Recipient Name <span className="text-red-400">*</span>
                                        </label>
                                        <div className="relative">
                                            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-lighter" />
                                            <input
                                                id="recipient-name"
                                                type="text"
                                                value={recipientName}
                                                onChange={e => setRecipientName(e.target.value)}
                                                placeholder="e.g. Priya Sharma"
                                                maxLength={100}
                                                className="w-full border border-cream-darker rounded-sm py-3 pl-9 pr-4 text-sm focus:outline-none focus:border-gold/50"
                                            />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label htmlFor="recipient-email" className="block text-xs font-semibold uppercase tracking-wider text-charcoal-lighter mb-1.5">
                                            Recipient Email <span className="font-normal">(optional)</span>
                                        </label>
                                        <div className="relative">
                                            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-lighter" />
                                            <input
                                                id="recipient-email"
                                                type="email"
                                                value={recipientEmail}
                                                onChange={e => setRecipientEmail(e.target.value)}
                                                placeholder="priya@email.com"
                                                className="w-full border border-cream-darker rounded-sm py-3 pl-9 pr-4 text-sm focus:outline-none focus:border-gold/50"
                                            />
                                        </div>
                                    </div>

                                    {/* Message */}
                                    <div>
                                        <label htmlFor="voucher-message" className="block text-xs font-semibold uppercase tracking-wider text-charcoal-lighter mb-1.5">
                                            Personal Message <span className="font-normal">(optional)</span>
                                        </label>
                                        <div className="relative">
                                            <MessageSquare size={14} className="absolute left-3 top-4 text-charcoal-lighter" />
                                            <textarea
                                                id="voucher-message"
                                                value={message}
                                                onChange={e => setMessage(e.target.value)}
                                                maxLength={200}
                                                rows={3}
                                                placeholder="e.g. Wishing you a wonderful day of pampering! 💛"
                                                className="w-full border border-cream-darker rounded-sm py-3 pl-9 pr-4 text-sm focus:outline-none focus:border-gold/50 resize-none"
                                            />
                                        </div>
                                        <p className="text-right text-xs text-charcoal-lighter mt-1">{message.length}/200</p>
                                    </div>
                                </div>
                            </div>

                            {/* Summary */}
                            {selectedAmount && selectedAmount >= 100 && (
                                <div className="bg-espresso rounded-sm p-5 text-cream">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-cream/60 text-sm">Voucher Value</span>
                                        <span className="font-display text-2xl font-bold text-gold">
                                            ₹{selectedAmount.toLocaleString("en-IN")}
                                        </span>
                                    </div>
                                    <p className="text-xs text-cream/40 border-t border-white/10 pt-3">
                                        Payment arranged at the salon (UPI / Cash / Card). Voucher code is generated immediately and valid for 12 months.
                                    </p>
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-sm px-4 py-3">{error}</p>
                            )}

                            {/* CTA */}
                            {!session ? (
                                <Link
                                    href="/login?callbackUrl=/gift-vouchers"
                                    className="btn-gold w-full py-4 text-base text-center flex items-center justify-center gap-2"
                                >
                                    <Gift size={18} /> Sign In to Purchase
                                </Link>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={!isValid || submitting}
                                    className="btn-gold w-full py-4 text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? (
                                        <><Loader2 size={18} className="animate-spin" /> Generating Voucher…</>
                                    ) : (
                                        <><Gift size={18} /> Get Voucher Code <ArrowRight size={16} /></>
                                    )}
                                </button>
                            )}
                        </form>
                    </MotionWrapper>
                </div>
            </section>

            {/* How it works */}
            <section className="section-padding bg-white">
                <div className="container-salon max-w-3xl mx-auto text-center">
                    <MotionWrapper>
                        <h2 className="font-display text-2xl text-espresso mb-2">How It Works</h2>
                        <div className="gold-line mx-auto mb-10" />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                            {[
                                { step: "01", icon: <Gift className="text-gold" size={24} />, title: "Choose & Customise", desc: "Pick an amount, add the recipient's name and a heartfelt message." },
                                { step: "02", icon: <Tag className="text-gold" size={24} />, title: "Get Your Code", desc: "A unique voucher code is generated instantly for you to share." },
                                { step: "03", icon: <Sparkles className="text-gold" size={24} />, title: "Redeem at the Salon", desc: "The recipient enters the code when booking any service — the discount applies automatically." },
                            ].map(s => (
                                <div key={s.step} className="text-center">
                                    <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                                        {s.icon}
                                    </div>
                                    <p className="font-accent text-xs uppercase tracking-widest text-gold mb-2">{s.step}</p>
                                    <h3 className="font-display text-base text-espresso mb-2">{s.title}</h3>
                                    <p className="text-charcoal-lighter text-sm leading-relaxed">{s.desc}</p>
                                </div>
                            ))}
                        </div>
                    </MotionWrapper>
                </div>
            </section>
        </>
    );
}
