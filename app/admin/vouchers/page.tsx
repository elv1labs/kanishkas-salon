"use client";

import { useState, useEffect, useCallback } from "react";
import { Gift, Loader2, Search, RefreshCw } from "lucide-react";

interface Voucher {
    id: string;
    code: string;
    name: string;
    type: string;
    value: number;
    isPercentage: boolean;
    isActive: boolean;
    maxRedemptions: number;
    timesRedeemed: number;
    expiresAt: string | null;
    createdAt: string;
    purchasedBy?: { name: string; email: string } | null;
}

export default function AdminVouchersPage() {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchVouchers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: "100" });
            if (search) params.set("search", search);
            const res = await fetch(`/api/vouchers/purchase?${params}`);
            const data = await res.json();
            setVouchers(data.vouchers ?? []);
        } catch (e) {
            console.error("Failed to load vouchers", e);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => { fetchVouchers(); }, [fetchVouchers]);

    const expired = (v: Voucher) => v.expiresAt && new Date(v.expiresAt) < new Date();
    const fullyRedeemed = (v: Voucher) => v.maxRedemptions > 0 && v.timesRedeemed >= v.maxRedemptions;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-2xl text-espresso flex items-center gap-2">
                        <Gift className="text-gold" size={22} /> Gift Vouchers
                    </h1>
                    <p className="text-sm text-charcoal-lighter mt-1">All purchased gift vouchers across the platform.</p>
                </div>
                <button onClick={fetchVouchers} className="text-gold hover:text-gold-dark transition-colors">
                    <RefreshCw size={18} />
                </button>
            </div>

            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-lighter" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by code or name..."
                    className="w-full bg-white border border-cream-darker/50 rounded-sm py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-gold/40"
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gold" size={28} /></div>
            ) : vouchers.length === 0 ? (
                <div className="text-center py-12 text-charcoal-lighter">
                    <Gift size={40} className="mx-auto mb-3 opacity-30" />
                    <p>No vouchers found.</p>
                </div>
            ) : (
                <div className="bg-white rounded-sm border border-cream-darker/50 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-cream text-left">
                                    <th className="px-4 py-3 font-medium text-charcoal">Code</th>
                                    <th className="px-4 py-3 font-medium text-charcoal">Name</th>
                                    <th className="px-4 py-3 font-medium text-charcoal">Value</th>
                                    <th className="px-4 py-3 font-medium text-charcoal">Used</th>
                                    <th className="px-4 py-3 font-medium text-charcoal">Status</th>
                                    <th className="px-4 py-3 font-medium text-charcoal">Expires</th>
                                    <th className="px-4 py-3 font-medium text-charcoal">Buyer</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-cream-darker/30">
                                {vouchers.map((v) => (
                                    <tr key={v.id} className="hover:bg-cream/30 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs text-gold">{v.code}</td>
                                        <td className="px-4 py-3 text-espresso">{v.name}</td>
                                        <td className="px-4 py-3">{v.isPercentage ? `${v.value}%` : `₹${v.value}`}</td>
                                        <td className="px-4 py-3">{v.timesRedeemed}/{v.maxRedemptions || "∞"}</td>
                                        <td className="px-4 py-3">
                                            {expired(v) ? (
                                                <span className="text-red-500 text-xs font-medium">Expired</span>
                                            ) : fullyRedeemed(v) ? (
                                                <span className="text-amber-600 text-xs font-medium">Fully Used</span>
                                            ) : v.isActive ? (
                                                <span className="text-green-600 text-xs font-medium">Active</span>
                                            ) : (
                                                <span className="text-charcoal-lighter text-xs">Inactive</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-charcoal-lighter">
                                            {v.expiresAt ? new Date(v.expiresAt).toLocaleDateString("en-IN") : "—"}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-charcoal-lighter">
                                            {v.purchasedBy?.name ?? "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
