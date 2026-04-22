"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Users, Copy, CheckCircle, Gift, TrendingUp,
    Loader2, Share2, Heart, Star, Clock
} from "lucide-react";

interface ReferralData {
    referralCode: string;
    totalReferred: number;
    totalConverted: number;
    totalPointsEarned: number;
    referrals: {
        id: string;
        isConverted: boolean;
        convertedAt: string | null;
        rewardPoints: number;
        createdAt: string;
        referred: { name: string; createdAt: string };
    }[];
}

export default function ReferralPage() {
    const [data, setData] = useState<ReferralData | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState<"code" | "link" | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/referral");
            const json = await res.json();
            if (res.ok) setData(json.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const referralLink = data?.referralCode
        ? `${typeof window !== "undefined" ? window.location.origin : ""}/register?ref=${data.referralCode}`
        : "";

    const handleCopy = async (type: "code" | "link") => {
        const text = type === "code" ? data?.referralCode ?? "" : referralLink;
        await navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleShare = async () => {
        if (!referralLink) return;
        const shareText = `✨ I've been loving Kanishka's Family Salon & Academy in Indore! Use my referral link to sign up and get a special welcome. 💛\n\n${referralLink}`;
        if (navigator.share) {
            navigator.share({ title: "Join Kanishka's Salon", text: shareText, url: referralLink }).catch(() => {});
        } else {
            await navigator.clipboard.writeText(shareText);
            setCopied("link");
            setTimeout(() => setCopied(null), 2000);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-gold" size={28} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-espresso to-espresso/80 rounded-sm p-6 text-cream">
                <div className="flex items-center gap-3 mb-1">
                    <Gift className="text-gold" size={22} />
                    <h1 className="font-display text-2xl">Refer & Earn</h1>
                </div>
                <p className="text-cream/60 text-sm">
                    Invite friends to Kanishka's Salon. When they join and book, you earn loyalty points.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { icon: <Users size={20} className="text-blue-500" />, value: data?.totalReferred ?? 0, label: "Friends Referred" },
                    { icon: <CheckCircle size={20} className="text-green-500" />, value: data?.totalConverted ?? 0, label: "Converted" },
                    { icon: <Star size={20} className="text-gold" />, value: data?.totalPointsEarned ?? 0, label: "Points Earned" },
                ].map(stat => (
                    <div key={stat.label} className="bg-white border border-cream-darker/50 rounded-sm p-5">
                        <div className="flex items-center gap-2 mb-3">{stat.icon}</div>
                        <p className="font-display text-3xl text-espresso">{stat.value}</p>
                        <p className="text-xs text-charcoal-lighter mt-0.5">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Share card */}
            <div className="bg-white border border-cream-darker/50 rounded-sm p-6">
                <h2 className="font-display text-lg text-espresso mb-1">Your Referral Code</h2>
                <div className="gold-line mb-5" />

                {/* Code display */}
                <div className="bg-cream rounded-sm border border-cream-darker/50 px-5 py-4 mb-4">
                    <p className="text-xs text-charcoal-lighter uppercase tracking-widest mb-1">Unique Code</p>
                    <div className="flex items-center justify-between">
                        <p className="font-mono text-2xl font-bold tracking-[0.15em] text-espresso">{data?.referralCode ?? "—"}</p>
                        <button
                            onClick={() => handleCopy("code")}
                            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-sm transition-all ${
                                copied === "code" ? "bg-green-100 text-green-700" : "bg-espresso/5 text-espresso hover:bg-gold/10"
                            }`}
                        >
                            {copied === "code" ? <CheckCircle size={13} /> : <Copy size={13} />}
                            {copied === "code" ? "Copied!" : "Copy"}
                        </button>
                    </div>
                </div>

                {/* Referral link */}
                <div className="flex gap-2 mb-5">
                    <div className="flex-1 bg-cream border border-cream-darker/50 rounded-sm px-3 py-2.5 text-xs text-charcoal-lighter font-mono truncate">
                        {referralLink || "Loading…"}
                    </div>
                    <button
                        onClick={() => handleCopy("link")}
                        className={`px-3 py-2.5 rounded-sm text-xs font-semibold transition-all flex items-center gap-1.5 ${
                            copied === "link" ? "bg-green-100 text-green-700" : "bg-espresso text-cream hover:bg-espresso/90"
                        }`}
                    >
                        {copied === "link" ? <CheckCircle size={13} /> : <Copy size={13} />}
                        {copied === "link" ? "Copied!" : "Copy Link"}
                    </button>
                </div>

                <button
                    onClick={handleShare}
                    className="w-full btn-gold py-3 flex items-center justify-center gap-2 text-sm"
                >
                    <Share2 size={16} /> Share with a Friend
                </button>

                {/* How it works */}
                <div className="mt-6 pt-5 border-t border-cream-darker/30">
                    <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-lighter mb-3">How It Works</p>
                    <div className="space-y-2.5">
                        {[
                            { step: "1", text: "Share your unique code or link with friends & family" },
                            { step: "2", text: "They sign up at Kanishka's using your referral link" },
                            { step: "3", text: "When they complete their first booking, you earn loyalty points" },
                        ].map(s => (
                            <div key={s.step} className="flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-gold/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-[10px] font-bold text-gold">{s.step}</span>
                                </div>
                                <p className="text-sm text-charcoal-lighter">{s.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* History */}
            <div className="bg-white border border-cream-darker/50 rounded-sm p-6">
                <h2 className="font-display text-lg text-espresso mb-1">Referral History</h2>
                <div className="gold-line mb-5" />

                {!data?.referrals.length ? (
                    <div className="text-center py-10">
                        <Heart className="w-10 h-10 text-cream-darker mx-auto mb-3" />
                        <p className="text-charcoal-lighter text-sm">No referrals yet — share your code to get started!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {data.referrals.map(r => (
                            <div key={r.id} className="flex items-center justify-between py-3 border-b border-cream-darker/30 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${r.isConverted ? "bg-green-100" : "bg-cream"}`}>
                                        {r.isConverted
                                            ? <CheckCircle size={14} className="text-green-600" />
                                            : <Clock size={14} className="text-charcoal-lighter" />
                                        }
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-espresso">{r.referred.name}</p>
                                        <p className="text-xs text-charcoal-lighter">
                                            Joined {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                                        r.isConverted
                                            ? "bg-green-50 border-green-200 text-green-700"
                                            : "bg-amber-50 border-amber-200 text-amber-700"
                                    }`}>
                                        {r.isConverted ? "Converted" : "Pending"}
                                    </span>
                                    {r.rewardPoints > 0 && (
                                        <p className="text-xs text-gold font-semibold mt-1">+{r.rewardPoints} pts</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
