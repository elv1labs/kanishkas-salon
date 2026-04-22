"use client";
// app/dashboard/receptionist/clients/page.tsx
// DROP-IN REPLACEMENT — wired to /api/users?role=CLIENT

import { useState, useEffect, useCallback } from "react";
import { Search, Users, Phone, Mail, Calendar, ChevronDown, ChevronUp, Heart, Clock, Loader2 } from "lucide-react";

type Client = {
    id: string;
    name: string;
    phone: string | null;
    email: string;
    isActive: boolean;
    createdAt: string;
    profile: {
        totalVisits: number;
        lastVisitAt: string | null;
        city: string | null;
        skinType: string | null;
        hairType: string | null;
    } | null;
    loyaltyAccount: {
        totalPoints: number;
        tier: string;
    } | null;
    _count: { appointments: number; orders: number };
};

const tierColors: Record<string, string> = {
    BRONZE:   "bg-amber-700/15 text-amber-700",
    SILVER:   "bg-gray-200 text-gray-600",
    GOLD:     "bg-gold/15 text-gold-dark",
    PLATINUM: "bg-purple-100 text-purple-700",
};

function ClientRow({ client }: { client: Client }) {
    const [expanded, setExpanded] = useState(false);
    const tier = client.loyaltyAccount?.tier ?? "BRONZE";
    const tierDisplay = tier.charAt(0) + tier.slice(1).toLowerCase();

    return (
        <div className="bg-white rounded-sm border border-cream-darker/50 overflow-hidden hover:shadow-md transition-all">
            <button onClick={() => setExpanded(!expanded)} className="w-full p-4 text-left">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gold/15 flex items-center justify-center text-gold font-display text-sm font-bold flex-shrink-0">
                        {client.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-display text-sm font-semibold text-espresso">{client.name}</p>
                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${tierColors[tier]}`}>
                                {tierDisplay}
                            </span>
                            {!client.isActive && (
                                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-50 text-red-600">Inactive</span>
                            )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-[11px] text-charcoal-lighter">
                            {client.phone && <span className="flex items-center gap-1"><Phone size={10} /> {client.phone}</span>}
                            <span className="hidden sm:flex items-center gap-1"><Mail size={10} /> {client.email}</span>
                        </div>
                    </div>
                    <div className="hidden sm:block text-right flex-shrink-0">
                        <p className="text-xs text-charcoal-lighter">{client._count.appointments} appointments</p>
                        <p className="text-[10px] text-charcoal-lighter/60">
                            {client.loyaltyAccount ? `${client.loyaltyAccount.totalPoints} pts` : "No loyalty account"}
                        </p>
                    </div>
                    {expanded ? <ChevronUp size={16} className="text-charcoal-lighter flex-shrink-0" /> : <ChevronDown size={16} className="text-charcoal-lighter flex-shrink-0" />}
                </div>
            </button>

            {expanded && (
                <div className="border-t border-cream-darker/20 px-4 pb-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                        <div className="bg-cream/40 rounded-sm p-3 text-center">
                            <Calendar size={14} className="text-gold mx-auto mb-1" />
                            <p className="font-display text-sm font-bold text-espresso">{client._count.appointments}</p>
                            <p className="text-[9px] text-charcoal-lighter">Appointments</p>
                        </div>
                        <div className="bg-cream/40 rounded-sm p-3 text-center">
                            <Clock size={14} className="text-gold mx-auto mb-1" />
                            <p className="text-xs font-semibold text-espresso">
                                {client.profile?.lastVisitAt
                                    ? new Date(client.profile.lastVisitAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                                    : "No visits"}
                            </p>
                            <p className="text-[9px] text-charcoal-lighter">Last Visit</p>
                        </div>
                        <div className="bg-cream/40 rounded-sm p-3 text-center">
                            <Heart size={14} className="text-gold mx-auto mb-1" />
                            <p className="text-xs font-semibold text-espresso">{client.profile?.skinType ?? "—"}</p>
                            <p className="text-[9px] text-charcoal-lighter">Skin Type</p>
                        </div>
                        <div className="bg-cream/40 rounded-sm p-3 text-center">
                            <Users size={14} className="text-gold mx-auto mb-1" />
                            <p className="text-xs font-semibold text-espresso">{client.profile?.hairType ?? "—"}</p>
                            <p className="text-[9px] text-charcoal-lighter">Hair Type</p>
                        </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                        <a href={`/book`} className="btn-gold text-xs py-2 px-3">
                            <Calendar size={12} className="mr-1 inline" /> Book Appointment
                        </a>
                        {client.phone && (
                            <a href={`tel:${client.phone.replace(/\s/g, "")}`} className="btn-outline text-xs py-2 px-3">
                                <Phone size={12} className="mr-1 inline" /> Call
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ReceptionistClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(t);
    }, [search]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ role: "CLIENT", limit: "50" });
            if (debouncedSearch) params.set("search", debouncedSearch);
            const res = await fetch(`/api/users?${params}`);
            const data = await res.json();
            setClients(data.users ?? []);
        } catch (e) {
            console.error("Failed to load clients", e);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch]);

    useEffect(() => { load(); }, [load]);

    const gold = clients.filter(c => c.loyaltyAccount?.tier === "GOLD" || c.loyaltyAccount?.tier === "PLATINUM").length;
    const active = clients.filter(c => c.isActive).length;

    return (
        <div className="space-y-6">
            <h1 className="font-display text-xl text-espresso">Client Directory</h1>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Total Clients", value: loading ? "—" : clients.length },
                    { label: "Active",         value: loading ? "—" : active },
                    { label: "Gold+",          value: loading ? "—" : gold },
                    { label: "Showing",        value: loading ? "—" : clients.length },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-sm border border-cream-darker/50 p-3 text-center">
                        <p className="font-display text-xl font-bold text-espresso">{s.value}</p>
                        <p className="text-[10px] text-charcoal-lighter">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="relative max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-lighter" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name, phone, or email..."
                    className="w-full bg-white border border-cream-darker/50 rounded-sm py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-gold/40 transition-all" />
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gold" size={28} /></div>
            ) : clients.length === 0 ? (
                <div className="bg-white rounded-sm border border-cream-darker/50 p-10 text-center">
                    <Users className="w-10 h-10 text-cream-darker mx-auto mb-3" />
                    <p className="text-charcoal-lighter text-sm">No clients found{debouncedSearch ? ` for "${debouncedSearch}"` : ""}.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {clients.map(c => <ClientRow key={c.id} client={c} />)}
                </div>
            )}
        </div>
    );
}
