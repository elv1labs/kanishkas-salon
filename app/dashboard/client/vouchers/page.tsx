"use client";
export const dynamic = "force-dynamic";
import { extractApiError } from "@/lib/extract-error";

import { useState, useEffect, useCallback } from "react";
import {
    Gift, Copy, CheckCircle, Loader2, AlertCircle,
    Clock, Tag, Sparkles, IndianRupee, RefreshCw
} from "lucide-react";
import Link from "next/link";
import { usePublicSettings } from "@/hooks/usePublicSettings";

// ── Types ─────────────────────────────────────────────────────────────────────

type VoucherStatus = "ACTIVE" | "REDEEMED" | "EXPIRED" | "PENDING_PAYMENT";

interface Voucher {
    id: string;
    code: string;
    value: number;
    remainingValue: number;
    status: VoucherStatus;
    recipientName: string | null;
    recipientEmail: string | null;
    message: string | null;
    expiresAt: string;
    redeemedAt: string | null;
    createdAt: string;
    purchasedBy?: { name: string };
}

// ── Status badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: VoucherStatus }) {
    const map: Record<VoucherStatus, { label: string; cls: string }> = {
        ACTIVE:          { label: "Active",         cls: "bg-green-50 border-green-200 text-green-700" },
        REDEEMED:        { label: "Redeemed",        cls: "bg-gray-50 border-gray-200 text-gray-500" },
        EXPIRED:         { label: "Expired",         cls: "bg-red-50 border-red-200 text-red-600" },
        PENDING_PAYMENT: { label: "Pending Payment", cls: "bg-amber-50 border-amber-200 text-amber-700" },
    };
    const { label, cls } = map[status] ?? { label: status, cls: "bg-gray-50 border-gray-200 text-gray-500" };
    return (
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${cls}`}>
            {label}
        </span>
    );
}

// ── Voucher Card ───────────────────────────────────────────────────────────────

function VoucherCard({ voucher, type }: { voucher: Voucher; type: "purchased" | "received" }) {
    const { settings } = usePublicSettings();
    const whatsappNumber = settings.whatsappNumber || "919171230292";
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(voucher.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isActive = voucher.status === "ACTIVE";
    const isPending = voucher.status === "PENDING_PAYMENT";
    const remainingVal = Number(voucher.remainingValue);
    const totalVal = Number(voucher.value);
    const usedPct = totalVal > 0 ? ((totalVal - remainingVal) / totalVal) * 100 : 0;
    const expDate = new Date(voucher.expiresAt).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric"
    });

    return (
        <div className={`bg-white border rounded-sm overflow-hidden transition-all ${
            isActive ? "border-gold/30 shadow-sm" : "border-cream-darker/50"
        }`}>
            {/* Card header */}
            <div className={`px-5 py-4 flex items-start justify-between gap-3 ${
                isActive ? "bg-gradient-to-r from-espresso to-espresso/90" : "bg-espresso/40"
            }`}>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles size={12} className="text-gold" />
                        <span className="text-gold text-[10px] font-accent uppercase tracking-widest">
                            {type === "purchased" ? "Gift Voucher — Purchased" : "Gift Voucher — Received"}
                        </span>
                    </div>
                    <p className="font-display text-2xl font-bold text-gold">
                        ₹{totalVal.toLocaleString("en-IN")}
                    </p>
                    {remainingVal < totalVal && isActive && (
                        <p className="text-cream/60 text-xs mt-0.5">
                            ₹{remainingVal.toLocaleString("en-IN")} remaining
                        </p>
                    )}
                </div>
                <StatusBadge status={voucher.status} />
            </div>

            <div className="px-5 py-4 space-y-3">
                {/* Code */}
                <div className="flex items-center justify-between gap-3">
                    <div className="bg-cream rounded-sm border border-cream-darker/50 px-3 py-2 flex-1 min-w-0">
                        <p className="text-[10px] text-charcoal-lighter uppercase tracking-widest mb-0.5">Code</p>
                        <p className="font-mono text-sm font-bold tracking-[0.12em] text-espresso truncate">
                            {voucher.code}
                        </p>
                    </div>
                    {isActive && (
                        <button
                            onClick={handleCopy}
                            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-sm transition-all whitespace-nowrap ${
                                copied ? "bg-green-100 text-green-700" : "bg-espresso text-cream hover:bg-espresso/90"
                            }`}
                        >
                            {copied ? <><CheckCircle size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
                        </button>
                    )}
                </div>

                {/* Value progress bar (if partially used) */}
                {usedPct > 0 && usedPct < 100 && (
                    <div>
                        <div className="flex justify-between text-[10px] text-charcoal-lighter mb-1">
                            <span>Used: ₹{(totalVal - remainingVal).toLocaleString("en-IN")}</span>
                            <span>Remaining: ₹{remainingVal.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="h-1 bg-cream-darker/50 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gold rounded-full transition-all"
                                style={{ width: `${usedPct}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Recipient / Sender */}
                <div className="text-xs text-charcoal-lighter space-y-1">
                    {type === "purchased" && voucher.recipientName && (
                        <p>For: <span className="text-espresso font-medium">{voucher.recipientName}</span>
                            {voucher.recipientEmail && <span className="ml-1 text-charcoal-lighter/70">({voucher.recipientEmail})</span>}
                        </p>
                    )}
                    {type === "received" && voucher.purchasedBy && (
                        <p>From: <span className="text-espresso font-medium">{voucher.purchasedBy.name}</span></p>
                    )}
                    {voucher.message && (
                        <p className="italic text-charcoal-lighter/80">&ldquo;{voucher.message}&rdquo;</p>
                    )}
                </div>

                {/* Dates row */}
                <div className="flex items-center justify-between text-[10px] text-charcoal-lighter pt-1 border-t border-cream-darker/30">
                    <div className="flex items-center gap-1">
                        <Clock size={10} />
                        <span>Expires: {expDate}</span>
                    </div>
                    {voucher.redeemedAt && (
                        <span>Redeemed: {new Date(voucher.redeemedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    )}
                </div>

                {/* Pending payment notice */}
                {isPending && (
                    <div className="bg-amber-50 border border-amber-200 rounded-sm px-3 py-2 flex items-start gap-2">
                        <IndianRupee size={13} className="text-amber-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-amber-700">
                            Payment pending. Please visit the salon or{" "}
                            <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
                                contact us on WhatsApp
                            </a>{" "}to activate this voucher.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function MyVouchersPage() {
    const { settings } = usePublicSettings();
    const [purchased, setPurchased] = useState<Voucher[]>([]);
    const [received, setReceived] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<"purchased" | "received">("purchased");

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/client/vouchers");
            const data = await res.json();
            if (!res.ok) throw new Error(extractApiError(data, "Failed to load vouchers"));
            setPurchased(data.purchased ?? []);
            setReceived(data.received ?? []);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const activeTab = tab === "purchased" ? purchased : received;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-espresso to-espresso/80 rounded-sm p-6 text-cream">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Gift className="text-gold" size={22} />
                        <div>
                            <h1 className="font-display text-2xl">My Vouchers</h1>
                            <p className="text-cream/60 text-sm">Gift vouchers you&apos;ve bought or received</p>
                        </div>
                    </div>
                    <button
                        onClick={load}
                        disabled={loading}
                        className="p-2 rounded-sm bg-white/10 hover:bg-white/20 transition-all text-cream disabled:opacity-50"
                        aria-label="Refresh"
                    >
                        <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-cream border border-cream-darker/50 rounded-sm p-1">
                {[
                    { key: "purchased" as const, label: "Purchased", count: purchased.length },
                    { key: "received"  as const, label: "Received",  count: received.length },
                ].map(({ key, label, count }) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`flex-1 py-2 text-sm font-medium rounded-sm transition-all flex items-center justify-center gap-2 ${
                            tab === key
                                ? "bg-white text-espresso shadow-sm"
                                : "text-charcoal-lighter hover:text-espresso"
                        }`}
                    >
                        {label}
                        {count > 0 && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                tab === key ? "bg-gold/15 text-gold" : "bg-cream-darker/60 text-charcoal-lighter"
                            }`}>
                                {count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="animate-spin text-gold" size={28} />
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-sm p-5 flex items-start gap-3">
                    <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-red-700">Could not load vouchers</p>
                        <p className="text-xs text-red-500 mt-1">{error}</p>
                    </div>
                </div>
            ) : activeTab.length === 0 ? (
                <div className="bg-white border border-cream-darker/50 rounded-sm p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                        <Gift className="text-gold" size={28} />
                    </div>
                    <h3 className="font-display text-lg text-espresso mb-2">
                        {tab === "purchased" ? "No vouchers purchased yet" : "No vouchers received yet"}
                    </h3>
                    <p className="text-charcoal-lighter text-sm mb-6">
                        {tab === "purchased"
                            ? "Give the gift of beauty — purchase a gift voucher for someone special."
                            : "Vouchers gifted to your email address will appear here."}
                    </p>
                    {tab === "purchased" && (
                        <Link href="/gift-vouchers" className="btn-gold py-3 px-6 text-sm">
                            <Tag size={14} className="mr-2 inline" />
                            Get a Gift Voucher
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {activeTab.map((v) => (
                        <VoucherCard key={v.id} voucher={v} type={tab} />
                    ))}
                </div>
            )}

            {/* Buy more CTA (when on purchased tab and has vouchers) */}
            {tab === "purchased" && !loading && purchased.length > 0 && (
                <div className="text-center pt-2">
                    <Link
                        href="/gift-vouchers"
                        className="inline-flex items-center gap-2 text-sm text-gold hover:text-gold-dark font-medium transition-colors"
                    >
                        <Tag size={14} />
                        Purchase another voucher
                    </Link>
                </div>
            )}
        </div>
    );
}
