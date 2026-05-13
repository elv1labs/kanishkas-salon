"use client";
import { extractApiError } from "@/lib/extract-error";
// app/dashboard/admin/users/page.tsx
// DROP-IN REPLACEMENT — wired to /api/users with real PATCH for role/status

import { useState, useEffect, useCallback } from "react";
import { Users, Search, Shield, UserPlus, Edit3, ToggleLeft, ToggleRight, Mail, Phone, Clock, Check, X, Loader2 } from "lucide-react";

type UserRow = {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    loyaltyAccount: { tier: string; totalPoints: number } | null;
    _count: { appointments: number; orders: number };
};

const roleColors: Record<string, string> = {
    ADMIN:        "bg-purple-100 text-purple-700 border-purple-200",
    OWNER:        "bg-gold/15 text-gold-dark border-gold/30",
    RECEPTIONIST: "bg-blue-100 text-blue-700 border-blue-200",
    CLIENT:       "bg-green-100 text-green-700 border-green-200",
};

const ROLES = ["ADMIN", "OWNER", "RECEPTIONIST", "CLIENT"];
const FILTERS = ["All", ...ROLES];

function EditRoleModal({ user, onSave, onClose }: {
    user: UserRow;
    onSave: (id: string, updates: Record<string, any>) => Promise<void>;
    onClose: () => void;
}) {
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [phone, setPhone] = useState(user.phone ?? "");
    const [role, setRole] = useState(user.role);
    const [isActive, setIsActive] = useState(user.isActive);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        if (!name.trim()) { setError("Name is required."); return; }
        if (!email.trim()) { setError("Email is required."); return; }
        setSaving(true);
        setError(null);
        try {
            await onSave(user.id, { name, email, phone: phone || null, role, isActive });
        } catch (e: any) {
            setError(e?.message ?? "Failed to save.");
            setSaving(false);
            return;
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
             onClick={(e) => { if (e.currentTarget === e.target) onClose(); }}>
            <div className="bg-white rounded-sm border border-cream-darker/50 p-6 w-full max-w-sm shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-base text-espresso">Edit User</h3>
                    <button onClick={onClose} className="text-charcoal-lighter hover:text-espresso"><X size={16} /></button>
                </div>

                {/* Name */}
                <div className="mb-3">
                    <label className="text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5 block">Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)}
                        className="w-full bg-white border border-cream-darker/50 rounded-sm py-2 px-3 text-sm focus:outline-none focus:border-gold/40" />
                </div>

                {/* Email */}
                <div className="mb-3">
                    <label className="text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5 block">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        className="w-full bg-white border border-cream-darker/50 rounded-sm py-2 px-3 text-sm focus:outline-none focus:border-gold/40" />
                </div>

                {/* Phone */}
                <div className="mb-4">
                    <label className="text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5 block">Phone</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="w-full bg-white border border-cream-darker/50 rounded-sm py-2 px-3 text-sm focus:outline-none focus:border-gold/40" />
                </div>

                {/* Role */}
                <div className="mb-4">
                    <label className="text-xs text-charcoal-lighter uppercase tracking-wider mb-2 block">Role</label>
                    <div className="grid grid-cols-2 gap-2">
                        {ROLES.map(r => (
                            <button key={r} onClick={() => setRole(r)}
                                className={`py-2 px-3 text-xs font-semibold rounded-sm border transition-all ${
                                    role === r ? "border-gold bg-gold/10 text-espresso" : "border-cream-darker text-charcoal-lighter hover:border-gold/30"
                                }`}>
                                {r}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Status */}
                <div className="mb-6">
                    <label className="text-xs text-charcoal-lighter uppercase tracking-wider mb-2 block">Status</label>
                    <button onClick={() => setIsActive(!isActive)}
                        className={`flex items-center gap-2 py-2 px-3 text-xs font-semibold rounded-sm border transition-all ${
                            isActive ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-600"
                        }`}>
                        {isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        {isActive ? "Active" : "Inactive"}
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-sm px-3 py-2">
                        <p className="text-xs text-red-600">{error}</p>
                    </div>
                )}

                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 btn-outline text-xs py-2">Cancel</button>
                    <button disabled={saving}
                        onClick={handleSave}
                        className="flex-1 btn-gold text-xs py-2 disabled:opacity-50">
                        {saving ? <Loader2 size={14} className="animate-spin mx-auto" /> : <><Check size={12} className="mr-1 inline" /> Save</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("All");
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [editUser, setEditUser] = useState<UserRow | null>(null);
    const [total, setTotal] = useState(0);
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [page, setPage] = useState(1);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(t);
    }, [search]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: "50", page: String(page) });
            if (filter !== "All") params.set("role", filter);
            if (debouncedSearch) params.set("search", debouncedSearch);
            const res = await fetch(`/api/users?${params}`);
            const data = await res.json();
            setUsers(data.users ?? []);
            setTotal(data.pagination?.total ?? 0);
            if (data.counts) setCounts(data.counts);
        } catch (e) {
            console.error("Failed to load users", e);
        } finally {
            setLoading(false);
        }
    }, [filter, debouncedSearch, page]);

    useEffect(() => { load(); }, [load]);

    const handleSave = async (id: string, updates: Record<string, any>) => {
        const res = await fetch(`/api/users/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
        });
        const data = await res.json();
        if (!res.ok) {
            throw new Error(extractApiError(data, "Failed to update user"));
        }
        load();
    };

    const quickToggle = async (user: UserRow) => {
        if (user.role === "ADMIN") { alert("Cannot deactivate admin account."); return; }
        await fetch("/api/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: user.id, isActive: !user.isActive }),
        });
        load();
    };

    return (
        <div className="space-y-6">
            {editUser && (
                <EditRoleModal user={editUser} onSave={handleSave} onClose={() => setEditUser(null)} />
            )}

            <div className="flex items-center justify-between flex-wrap gap-3">
                <h1 className="font-display text-xl text-espresso">User Management</h1>
                <div className="text-xs text-charcoal-lighter">{total} total users</div>
            </div>

            {/* Role breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {ROLES.map(role => (
                    <div key={role} className="bg-white rounded-sm border border-cream-darker/50 p-4 text-center">
                        <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${roleColors[role]} mb-2`}>
                            <Shield size={10} /> {role}
                        </span>
                        <p className="font-display text-xl font-bold text-espresso">
                            {loading ? "—" : (counts[role] ?? 0)}
                        </p>
                    </div>
                ))}
            </div>

            {/* Search + Filter */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-lighter" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search users..."
                        className="w-full bg-white border border-cream-darker/50 rounded-sm py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-gold/40 transition-all" />
                </div>
                <div className="flex gap-1 bg-cream rounded-sm p-1">
                    {FILTERS.map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-sm transition-all ${
                                filter === f ? "bg-white text-espresso shadow-sm" : "text-charcoal-lighter hover:bg-white/50"
                            }`}>
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-sm border border-cream-darker/50 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gold" size={28} /></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-cream/50 border-b border-cream-darker/30">
                                    {["User", "Contact", "Role", "Status", "Activity", "Actions"].map(h => (
                                        <th key={h} className={`py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider font-semibold ${h === "Actions" ? "text-right" : "text-left"}`}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id} className="border-b border-cream-darker/10 hover:bg-cream/20 transition-colors">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gold/15 flex items-center justify-center text-gold font-display text-xs font-bold flex-shrink-0">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-espresso">{user.name}</p>
                                                    <p className="text-[10px] text-charcoal-lighter">
                                                        Since {new Date(user.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <p className="text-xs text-charcoal-lighter flex items-center gap-1"><Mail size={10} /> {user.email}</p>
                                            {user.phone && (
                                                <p className="text-xs text-charcoal-lighter flex items-center gap-1 mt-0.5"><Phone size={10} /> {user.phone}</p>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${roleColors[user.role]}`}>
                                                <Shield size={9} /> {user.role}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {user.isActive ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-600">
                                                    <ToggleRight size={14} /> Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-500">
                                                    <ToggleLeft size={14} /> Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <p className="text-xs text-charcoal-lighter flex items-center gap-1">
                                                <Clock size={10} /> {user._count.appointments} appts
                                            </p>
                                            {user.loyaltyAccount && (
                                                <p className="text-[10px] text-charcoal-lighter mt-0.5">
                                                    {user.loyaltyAccount.totalPoints} pts · {user.loyaltyAccount.tier}
                                                </p>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => setEditUser(user)}
                                                    className="w-7 h-7 rounded-sm hover:bg-gold/10 flex items-center justify-center text-charcoal-lighter hover:text-gold transition-all"
                                                    title="Edit role/status">
                                                    <Edit3 size={13} />
                                                </button>
                                                <button onClick={() => quickToggle(user)}
                                                    className={`w-7 h-7 rounded-sm flex items-center justify-center transition-all ${
                                                        user.isActive
                                                            ? "hover:bg-red-50 text-charcoal-lighter hover:text-red-500"
                                                            : "hover:bg-green-50 text-charcoal-lighter hover:text-green-600"
                                                    }`}
                                                    title={user.isActive ? "Deactivate" : "Activate"}>
                                                    {user.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="px-4 py-3 bg-cream/30 border-t border-cream-darker/20 flex items-center justify-between">
                    <span className="text-xs text-charcoal-lighter">Showing {users.length} of {total} users</span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading}
                            className="px-3 py-1.5 border border-charcoal/20 rounded-sm disabled:opacity-40 hover:border-espresso/30 transition-colors text-xs">
                            Previous
                        </button>
                        <span className="text-xs text-charcoal-lighter">Page {page}</span>
                        <button onClick={() => setPage(p => p + 1)} disabled={users.length < 50 || loading}
                            className="px-3 py-1.5 border border-charcoal/20 rounded-sm disabled:opacity-40 hover:border-espresso/30 transition-colors text-xs">
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
