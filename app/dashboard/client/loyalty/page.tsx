"use client";

import { useState, useEffect } from "react";
import { Heart, Star, Gift, TrendingUp, Sparkles, Copy, Check, Calendar, ShoppingBag, Users, Loader2 } from "lucide-react";
import { LOYALTY_TIERS, LOYALTY_APPOINTMENT_EARN_RATE, LOYALTY_PRODUCT_EARN_RATE, LOYALTY_REVIEW_BONUS, LOYALTY_REFERRAL_BONUS } from "@/lib/constants";

type LoyaltyAccount = {
    totalPoints: number;
    lifetimeEarned: number;
    lifetimeRedeemed: number;
    tier: string;
};

type Transaction = {
    id: string;
    type: string;
    description: string;
    points: number;
    createdAt: string;
    appointment?: { service: { name: string } } | null;
    order?: { orderRef: string } | null;
};

const tiers = LOYALTY_TIERS;

const typeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
    EARN_APPOINTMENT: { icon: <Calendar size={13} />,    color: "text-green-600" },
    EARN_PURCHASE:    { icon: <ShoppingBag size={13} />, color: "text-green-600" },
    EARN_REFERRAL:    { icon: <Users size={13} />,       color: "text-blue-600" },
    EARN_REVIEW:      { icon: <Star size={13} />,        color: "text-gold" },
    REDEEM:           { icon: <Gift size={13} />,        color: "text-red-500" },
    EXPIRE:           { icon: <Gift size={13} />,        color: "text-gray-500" },
    ADJUST:           { icon: <TrendingUp size={13} />,  color: "text-charcoal-lighter" },
};

export default function ClientLoyaltyPage() {
    const [account, setAccount] = useState<LoyaltyAccount | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch("/api/loyalty?limit=20");
                if (!res.ok) return;
                const data = await res.json();
                setAccount(data.account);
                setTransactions(data.transactions ?? []);
            } catch (e) {
                console.error("Failed to load loyalty data", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <Loader2 className="animate-spin text-gold" size={32} />
            </div>
        );
    }

    if (!account) {
        return (
            <div className="text-center py-24 text-charcoal-lighter">
                <p>Loyalty account not found.</p>
            </div>
        );
    }

    const currentTier = tiers.find(t => t.name === account.tier) ?? tiers[0];
    const nextTier = tiers[tiers.indexOf(currentTier) + 1] ?? null;
    const progressToNext = nextTier
        ? ((account.totalPoints - currentTier.min) / (nextTier.min - currentTier.min)) * 100
        : 100;

    return (
        <div className="space-y-6">
            <h1 className="font-display text-xl text-espresso">Loyalty & Rewards</h1>

            {/* Points hero */}
            <div className="bg-gradient-to-r from-espresso to-espresso-50 rounded-sm p-6 text-cream">
                <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="text-gold" size={24} />
                    <span className="text-xs uppercase tracking-wider text-gold font-semibold">Your Points</span>
                </div>
                <p className="font-display text-4xl font-bold text-cream mb-1">
                    {account.totalPoints.toLocaleString("en-IN")}
                </p>
                <p className="text-cream/50 text-sm">Points Available · {currentTier.icon} {currentTier.display} Tier</p>

                {nextTier && (
                    <div className="mt-4 pt-4 border-t border-gold/10">
                        <div className="flex items-center justify-between text-xs mb-2">
                            <span className="text-cream/60">{currentTier.display}</span>
                            <span className="text-gold font-semibold">
                                {nextTier.display} — {(nextTier.min - account.totalPoints).toLocaleString()} pts away
                            </span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-gold to-yellow-300 rounded-full transition-all"
                                style={{ width: `${Math.min(Math.max(progressToNext, 0), 100)}%` }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { icon: <TrendingUp size={18} />, value: account.lifetimeEarned.toLocaleString("en-IN"), label: "Lifetime Earned" },
                    { icon: <Gift size={18} />,       value: account.lifetimeRedeemed.toLocaleString("en-IN"), label: "Redeemed" },
                    { icon: <Star size={18} />,       value: `${Math.round(account.totalPoints * 0.25).toLocaleString("en-IN")}`, label: "Points Value" },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-sm border border-cream-darker/50 p-4 text-center">
                        <div className="text-gold mx-auto mb-1 flex justify-center">{s.icon}</div>
                        <p className="font-display text-lg font-bold text-espresso">{s.value}</p>
                        <p className="text-[10px] text-charcoal-lighter">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Tiers */}
            <div className="bg-white rounded-sm border border-cream-darker/50 p-6">
                <h2 className="font-display text-base text-espresso mb-4">Loyalty Tiers</h2>
                <div className="space-y-3">
                    {tiers.map(tier => {
                        const isCurrent = tier.name === account.tier;
                        return (
                            <div key={tier.name} className={`flex items-center gap-3 p-3 rounded-sm ${isCurrent ? "bg-gold/5 border border-gold/20" : "bg-cream"}`}>
                                <span className="text-xl">{tier.icon}</span>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm text-espresso">{tier.display}</p>
                                    <p className="text-xs text-charcoal-lighter">{tier.min.toLocaleString()}+ pts · {tier.perks}</p>
                                </div>
                                {isCurrent && (
                                    <span className="text-[10px] bg-gold text-espresso px-2 py-0.5 rounded-sm font-bold uppercase">
                                        Current
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-sm border border-cream-darker/50 p-6">
                <h2 className="font-display text-base text-espresso mb-4">Points History</h2>
                {transactions.length === 0 ? (
                    <p className="text-sm text-charcoal-lighter text-center py-6">No transactions yet.</p>
                ) : (
                    <div className="space-y-1">
                        {transactions.map(tx => {
                            const cfg = typeConfig[tx.type] ?? typeConfig.EARN_APPOINTMENT;
                            const isEarn = tx.points > 0;
                            return (
                                <div key={tx.id} className="flex items-center gap-3 py-3 px-3 hover:bg-cream/30 rounded-sm transition-colors">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isEarn ? "bg-green-50" : "bg-red-50"}`}>
                                        <span className={cfg.color}>{cfg.icon}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-espresso truncate">{tx.description}</p>
                                        <p className="text-[10px] text-charcoal-lighter">
                                            {new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                        </p>
                                    </div>
                                    <span className={`text-sm font-bold font-display ${isEarn ? "text-green-600" : "text-red-500"}`}>
                                        {isEarn ? "+" : ""}{tx.points}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* How to earn */}
            <div className="bg-white rounded-sm border border-cream-darker/50 p-6">
                <h2 className="font-display text-base text-espresso mb-3">How to Earn Points</h2>
                <ul className="space-y-2 text-sm text-charcoal-lighter">
                    <li className="flex items-center gap-2"><Heart size={14} className="text-gold flex-shrink-0" /> <strong className="text-espresso">{(LOYALTY_APPOINTMENT_EARN_RATE * 100).toFixed(0)}%</strong> of every appointment as points</li>
                    <li className="flex items-center gap-2"><Gift size={14} className="text-gold flex-shrink-0" /> <strong className="text-espresso">{(LOYALTY_PRODUCT_EARN_RATE * 100).toFixed(0)}%</strong> of product purchases as points</li>
                    <li className="flex items-center gap-2"><Star size={14} className="text-gold flex-shrink-0" /> <strong className="text-espresso">{LOYALTY_REVIEW_BONUS} pts</strong> for every approved review</li>
                    <li className="flex items-center gap-2"><TrendingUp size={14} className="text-gold flex-shrink-0" /> <strong className="text-espresso">{LOYALTY_REFERRAL_BONUS} pts</strong> for every successful referral</li>
                </ul>
            </div>
        </div>
    );
}
