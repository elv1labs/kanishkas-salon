"use client";
import { extractApiError } from "@/lib/extract-error";

import { useState, useEffect, useRef } from "react";
import { X, Check, Loader2, Trash2, AlertTriangle } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

export type StaffData = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role?: string;
  isActive?: boolean;
  staffProfile?: {
    designation?: string | null;
    specializations?: string[];
    bio?: string | null;
    experience?: number;
  } | null;
};

type StaffForm = {
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  designation: string;
  specializations: string;
  bio: string;
  experience: number;
};

const EMPTY_FORM: StaffForm = {
  name: "",
  email: "",
  phone: "",
  role: "RECEPTIONIST",
  isActive: true,
  designation: "",
  specializations: "",
  bio: "",
  experience: 0,
};

const STAFF_ROLES = ["OWNER", "RECEPTIONIST"] as const;

// ── Component ────────────────────────────────────────────────────────────────

export default function StaffModal({
  initial,
  onClose,
  onSave,
}: {
  initial: StaffData | null; // null = CREATE mode
  onClose: () => void;
  onSave: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<StaffForm>(
    initial
      ? {
          name: initial.name,
          email: initial.email ?? "",
          phone: initial.phone ?? "",
          role: initial.role ?? "RECEPTIONIST",
          isActive: initial.isActive !== false,
          designation: initial.staffProfile?.designation ?? "",
          specializations: (initial.staffProfile?.specializations ?? []).join(", "),
          bio: initial.staffProfile?.bio ?? "",
          experience: initial.staffProfile?.experience ?? 0,
        }
      : EMPTY_FORM
  );
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!initial && !form.email.trim()) {
      setError("Email is required for new staff.");
      return;
    }
    if (!form.designation.trim()) {
      setError("Designation is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (initial) {
        // PATCH /api/staff/[id]
        const res = await fetch(`/api/staff/${initial.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            phone: form.phone || null,
            role: form.role,
            isActive: form.isActive,
            designation: form.designation,
            specializations: form.specializations
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            bio: form.bio || null,
            experience: Number(form.experience),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(extractApiError(data, "Failed to update staff."));
          return;
        }
      } else {
        // POST /api/staff
        const res = await fetch("/api/staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            phone: form.phone || undefined,
            role: form.role,
            designation: form.designation,
            specializations: form.specializations
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            bio: form.bio || undefined,
            experience: Number(form.experience),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(extractApiError(data, "Failed to create staff member."));
          return;
        }
      }
      onSave();
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initial) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/staff/${initial.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(extractApiError(data, "Failed to deactivate staff member."));
        return;
      }
      onSave();
      onClose();
    } catch {
      setError("Network error.");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const update = (key: keyof StaffForm, val: string | boolean | number) =>
    setForm((f) => ({ ...f, [key]: val }));

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-darker/30 sticky top-0 bg-white z-10">
          <h2 className="font-display text-lg text-espresso font-bold">
            {initial ? "Edit Staff Member" : "Add Staff Member"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-cream/60 text-charcoal-lighter transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Priya Sharma"
              className="w-full bg-white border border-cream-darker/50 rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
            />
          </div>

          {/* Email — only editable on create */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">
              Email {!initial && "*"}
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              disabled={!!initial}
              placeholder="e.g. priya@kanishkas.in"
              className={`w-full bg-white border border-cream-darker/50 rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 ${
                initial ? "opacity-60 cursor-not-allowed bg-cream/30" : ""
              }`}
            />
            {initial && (
              <p className="text-[10px] text-charcoal-lighter mt-1">
                Email cannot be changed after creation.
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">
              Phone
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full bg-white border border-cream-darker/50 rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
            />
          </div>

          {/* Role + Active row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">
                Role
              </label>
              <select
                value={form.role}
                onChange={(e) => update("role", e.target.value)}
                className="w-full bg-white border border-cream-darker/50 rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
              >
                {STAFF_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">
                Status
              </label>
              <button
                onClick={() => update("isActive", !form.isActive)}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-semibold rounded-md border transition-all ${
                  form.isActive
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-red-200 bg-red-50 text-red-600"
                }`}
              >
                {form.isActive ? "Active" : "Inactive"}
              </button>
            </div>
          </div>

          {/* Designation */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">
              Designation *
            </label>
            <input
              type="text"
              value={form.designation}
              onChange={(e) => update("designation", e.target.value)}
              placeholder="e.g. Senior Stylist"
              className="w-full bg-white border border-cream-darker/50 rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
            />
          </div>

          {/* Specializations */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">
              Specializations
            </label>
            <input
              type="text"
              value={form.specializations}
              onChange={(e) => update("specializations", e.target.value)}
              placeholder="Hair Styling, Bridal Makeup, Skin Care"
              className="w-full bg-white border border-cream-darker/50 rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
            />
            <p className="text-[10px] text-charcoal-lighter mt-1">
              Comma-separated list
            </p>
          </div>

          {/* Experience + Bio row */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">
                Experience (yrs)
              </label>
              <input
                type="number"
                min="0"
                value={form.experience}
                onChange={(e) => update("experience", parseInt(e.target.value) || 0)}
                className="w-full bg-white border border-cream-darker/50 rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">
                Bio
              </label>
              <input
                type="text"
                value={form.bio}
                onChange={(e) => update("bio", e.target.value)}
                placeholder="Short bio..."
                className="w-full bg-white border border-cream-darker/50 rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md px-4 py-2.5">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-cream-darker/30 flex items-center gap-3">
          {/* Delete (edit mode only) */}
          {initial && !confirmDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs px-3 py-2 rounded-md border border-red-200 text-red-500 hover:bg-red-50 transition-colors flex items-center gap-1"
            >
              <Trash2 size={12} /> Deactivate
            </button>
          )}
          {initial && confirmDelete && (
            <div className="flex items-center gap-2 flex-1">
              <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
              <span className="text-xs text-red-600">Confirm deactivation?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs px-3 py-1.5 rounded-md bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? "..." : "Yes, deactivate"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs px-2 py-1.5 text-charcoal-lighter hover:text-espresso"
              >
                No
              </button>
            </div>
          )}

          <div className="flex-1" />

          <button
            onClick={onClose}
            className="text-sm px-4 py-2.5 border border-cream-darker/50 rounded-md text-charcoal-lighter hover:border-gold/30 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="text-sm px-5 py-2.5 bg-espresso text-cream rounded-md font-semibold hover:bg-espresso/90 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Check size={14} /> {initial ? "Save Changes" : "Add Staff"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
