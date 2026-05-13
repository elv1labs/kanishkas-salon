"use client";
import { extractApiError } from "@/lib/extract-error";

import { useState, useEffect, useCallback } from "react";
import { UserCheck, Search, RefreshCw, Phone, Mail, Loader2, Briefcase, Plus, Edit2 } from "lucide-react";
import StaffModal, { type StaffData } from "@/components/admin/StaffModal";

// ── Types ──────────────────────────────────────────────────────────────────────

type StaffMember = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role?: string;
  specialization?: string | null;
  isActive?: boolean;
  createdAt?: string;
  _count?: { appointments: number };
  // Raw API data for modal
  _raw?: any;
};

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AdminStaffPage() {
  const [staff, setStaff]     = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [error, setError]     = useState<string | null>(null);
  const [modalTarget, setModalTarget] = useState<StaffData | null | "create">(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/staff");
      const data = await res.json();
      if (!res.ok) throw new Error(extractApiError(data, "Failed to fetch staff."));
      const rawStaff = Array.isArray(data) ? data : (data.staff ?? []);
      const mapped: StaffMember[] = rawStaff.map((s: any) => ({
        id: s.id,
        name: s.name ?? "Unknown",
        email: s.email ?? null,
        phone: s.phone ?? null,
        role: s.role ?? "STAFF",
        specialization: s.staffProfile?.specializations?.[0] ?? s.staffProfile?.designation ?? null,
        isActive: s.staffProfile?.isAvailable !== false,
        createdAt: s.createdAt ?? undefined,
        _count: s._count ? { appointments: s._count.staffAppointments ?? 0 } : undefined,
        _raw: s,
      }));
      setStaff(mapped);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load staff.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = staff.filter(s =>
    search === "" ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (s.specialization ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (member: StaffMember) => {
    const raw = member._raw;
    setModalTarget({
      id: member.id,
      name: member.name,
      email: member.email,
      phone: member.phone,
      role: member.role,
      isActive: member.isActive,
      staffProfile: raw?.staffProfile ?? null,
    });
  };

  return (
    <div className="space-y-6">
      {/* Modal */}
      {modalTarget !== null && (
        <StaffModal
          initial={modalTarget === "create" ? null : modalTarget}
          onClose={() => setModalTarget(null)}
          onSave={() => { load(); }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-xl text-espresso flex items-center gap-2">
            <UserCheck size={20} className="text-gold" /> Staff
          </h1>
          <p className="text-xs text-charcoal-lighter mt-0.5">{staff.length} team member{staff.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setModalTarget("create")}
            className="btn-gold text-xs py-2 px-4 flex items-center gap-1.5">
            <Plus size={13} /> Add Staff
          </button>
          <button onClick={load} className="btn-outline text-xs py-2 px-3 flex items-center gap-1.5">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-lighter" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search staff by name or specialization..."
          className="w-full bg-white border border-cream-darker/50 rounded-sm py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-gold/40" />
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-sm px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={load} className="text-xs text-red-500 underline hover:no-underline">Try again</button>
        </div>
      )}

      {/* Staff grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-gold" size={28} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-sm border border-cream-darker/50 py-16 text-center text-charcoal-lighter">
          {search ? "No staff matched your search." : "No staff members found."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(member => {
            const initial = member.name.charAt(0).toUpperCase();
            const active  = member.isActive !== false;
            return (
              <div key={member.id} className="bg-white rounded-sm border border-cream-darker/50 p-5 hover:shadow-md transition-all group relative">
                {/* Edit button */}
                <button
                  onClick={() => openEdit(member)}
                  className="absolute top-3 right-3 w-7 h-7 rounded-sm hover:bg-gold/10 flex items-center justify-center text-charcoal-lighter hover:text-gold transition-all opacity-0 group-hover:opacity-100"
                  title="Edit staff member"
                >
                  <Edit2 size={13} />
                </button>

                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0 font-display text-xl text-gold">
                    {initial}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-espresso">{member.name}</p>
                      <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${active ? "bg-green-50 border-green-200 text-green-700" : "bg-gray-50 border-gray-200 text-gray-500"}`}>
                        {active ? "Active" : "Inactive"}
                      </span>
                      {member.role && (
                        <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border bg-blue-50 border-blue-200 text-blue-600">
                          {member.role}
                        </span>
                      )}
                    </div>

                    {member.specialization && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-gold">
                        <Briefcase size={11} /> {member.specialization}
                      </div>
                    )}

                    <div className="mt-2 space-y-1">
                      {member.email && (
                        <a href={`mailto:${member.email}`} className="flex items-center gap-1.5 text-xs text-charcoal-lighter hover:text-gold transition-colors">
                          <Mail size={11} /> {member.email}
                        </a>
                      )}
                      {member.phone && (
                        <a href={`tel:${member.phone}`} className="flex items-center gap-1.5 text-xs text-charcoal-lighter hover:text-gold transition-colors">
                          <Phone size={11} /> {member.phone}
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Appointment count */}
                {member._count?.appointments !== undefined && (
                  <div className="mt-4 pt-3 border-t border-cream-darker/20 text-xs text-charcoal-lighter">
                    {member._count.appointments} appointment{member._count.appointments !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
