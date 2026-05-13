"use client";
import { extractApiError } from "@/lib/extract-error";

import { useState, useEffect, useCallback } from "react";
import {
  Scissors, Plus, Search, RefreshCw, Edit2, Trash2, X,
  CheckCircle, Clock, IndianRupee, Loader2,
} from "lucide-react";
import { SERVICE_CATEGORIES } from "@/lib/constants";

// ── Types ──────────────────────────────────────────────────────────────────────

type Service = {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: string;
  category: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: { appointments: number };
};

type ServiceForm = {
  name: string;
  description: string;
  duration: number;
  price: string;
  category: string;
  isActive: boolean;
};

const EMPTY_FORM: ServiceForm = {
  name: "", description: "", duration: 30, price: "", category: "HAIR_STYLING", isActive: true,
};

// ── Service Modal ──────────────────────────────────────────────────────────────

function ServiceModal({
  initial, onClose, onSave,
}: {
  initial: Service | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState<ServiceForm>(
    initial
      ? { name: initial.name, description: initial.description ?? "", duration: initial.duration, price: String(Number(initial.price)), category: initial.category ?? "", isActive: initial.isActive }
      : EMPTY_FORM
  );
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.price || form.duration < 1) {
      setError("Name, duration, and price are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Always PATCH for edits (API uses PATCH, not PUT)
      // For new: POST; for edit: PATCH with id
      const method = initial ? "PATCH" : "POST";
      const payload: Record<string, unknown> = {
        ...form,
        price: parseFloat(form.price),
        duration: Number(form.duration),
      };
      if (initial) payload.id = initial.id;
      const res = await fetch("/api/services", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(extractApiError(data, "Failed to save service.")); return; }
      onSave();
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.currentTarget === e.target) onClose(); }}
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-darker/30">
          <h2 className="font-display text-lg text-espresso font-bold">
            {initial ? "Edit Service" : "Add New Service"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-cream/60 text-charcoal-lighter transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">Service Name *</label>
            <input
              type="text" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Hair Cut & Blow Dry"
              className="w-full bg-white border border-cream-darker/50 rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              placeholder="Brief description of the service..."
              className="w-full bg-white border border-cream-darker/50 rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Duration */}
            <div>
              <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">Duration (min) *</label>
              <div className="relative">
                <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-lighter" />
                <input
                  type="number" min="5" step="5" value={form.duration}
                  onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
                  className="w-full bg-white border border-cream-darker/50 rounded-md py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
                />
              </div>
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">Price (₹) *</label>
              <div className="relative">
                <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-lighter" />
                <input
                  type="number" min="0" step="0.01" value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  className="w-full bg-white border border-cream-darker/50 rounded-md py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
                />
              </div>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">Category</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full bg-white border border-cream-darker/50 rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
            >
              {Object.entries(SERVICE_CATEGORIES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
              className={`relative w-10 h-5.5 rounded-full border-2 transition-all ${form.isActive ? "bg-green-500 border-green-500" : "bg-gray-200 border-gray-300"}`}
              style={{ height: 22 }}
            >
              <span className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-transform ${form.isActive ? "translate-x-5" : "translate-x-0.5"}`} style={{ transitionProperty: "transform" }} />
            </button>
            <span className="text-sm text-charcoal-lighter">
              {form.isActive ? "Active — visible to clients" : "Inactive — hidden from booking"}
            </span>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md px-4 py-2.5">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-cream-darker/30 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm border border-cream-darker/50 rounded-md text-charcoal-lighter hover:border-gold/30 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-2.5 text-sm bg-espresso text-cream rounded-md font-semibold hover:bg-espresso/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><span className="inline-block w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin" /> Saving...</> : <><CheckCircle size={15} /> {initial ? "Save Changes" : "Add Service"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [editTarget, setEditTarget] = useState<Service | null | "new">(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/services?limit=100");
      const data = await res.json();
      setServices(data.services ?? data ?? []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this service? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/services?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(extractApiError(d, "Failed to delete service."));
        return;
      }
      // Optimistically remove from state — re-fetch returns soft-deleted items to admins
      setServices(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      console.error(e);
      alert("Network error. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  // Derived categories
  const categories = ["All", ...Array.from(new Set(services.map(s => s.category ?? "Uncategorized")))];

  const filtered = services.filter(s => {
    const matchSearch = search === "" || s.name.toLowerCase().includes(search.toLowerCase()) || (s.category ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat    = catFilter === "All" || (s.category ?? "Uncategorized") === catFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-xl text-espresso flex items-center gap-2">
            <Scissors size={20} className="text-gold" /> Services
          </h1>
          <p className="text-xs text-charcoal-lighter mt-0.5">{services.length} services · {services.filter(s => s.isActive).length} active</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-outline text-xs py-2 px-3 flex items-center gap-1.5">
            <RefreshCw size={13} /> Refresh
          </button>
          <button
            onClick={() => setEditTarget("new")}
            className="py-2 px-4 bg-espresso text-cream text-xs font-semibold rounded-sm flex items-center gap-1.5 hover:bg-espresso/90 transition-colors"
          >
            <Plus size={14} /> Add Service
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-lighter" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search services..."
            className="w-full bg-white border border-cream-darker/50 rounded-sm py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-gold/40" />
        </div>

        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button key={cat} onClick={() => setCatFilter(cat)}
              className={`text-xs px-3 py-1.5 rounded-sm border font-medium transition-all ${catFilter === cat ? "bg-espresso text-cream border-espresso" : "bg-white text-charcoal-lighter border-cream-darker/50 hover:border-gold/30"}`}>
              {cat === "All" ? "All" : SERVICE_CATEGORIES[cat] ?? cat}
            </button>
          ))}
        </div>
      </div>

      {/* Services table */}
      <div className="bg-white rounded-sm border border-cream-darker/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream/50 border-b border-cream-darker/30">
                <th className="text-left py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Service</th>
                <th className="text-left py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Category</th>
                <th className="text-center py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Duration</th>
                <th className="text-right py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Price</th>
                <th className="text-center py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Status</th>
                <th className="text-center py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12">
                  <Loader2 className="animate-spin text-gold mx-auto" size={22} />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-charcoal-lighter">No services found</td></tr>
              ) : filtered.map(service => (
                <tr key={service.id} className="border-b border-cream-darker/10 hover:bg-cream/20 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-medium text-espresso">{service.name}</p>
                    {service.description && <p className="text-xs text-charcoal-lighter mt-0.5 truncate max-w-[200px]">{service.description}</p>}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs bg-cream/60 border border-cream-darker/30 px-2 py-0.5 rounded text-charcoal-lighter">
                      {SERVICE_CATEGORIES[service.category ?? ""] ?? service.category ?? "—"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-xs text-charcoal-lighter">
                      <Clock size={11} /> {service.duration} min
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-espresso">
                    ₹{Number(service.price).toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {service.isActive ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border bg-green-50 border-green-200 text-green-700">
                        <CheckCircle size={10} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border bg-gray-50 border-gray-200 text-gray-500">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setEditTarget(service)}
                        className="p-1.5 rounded border border-cream-darker/40 text-charcoal-lighter hover:border-gold/40 hover:text-gold transition-all"
                        title="Edit"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        disabled={deleting === service.id}
                        className="p-1.5 rounded border border-cream-darker/40 text-charcoal-lighter hover:border-red-300 hover:text-red-500 transition-all disabled:opacity-40"
                        title="Delete"
                      >
                        {deleting === service.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-cream/30 border-t border-cream-darker/20 text-xs text-charcoal-lighter">
          Showing {filtered.length} of {services.length} services
        </div>
      </div>

      {/* Modal */}
      {editTarget !== null && (
        <ServiceModal
          initial={editTarget === "new" ? null : editTarget}
          onClose={() => setEditTarget(null)}
          onSave={load}
        />
      )}
    </div>
  );
}
