"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Gift, Loader2, Search, RefreshCw, Plus, Eye,
  Clock, CheckCircle, XCircle, AlertCircle, X, ArrowUpDown, ArrowUp, ArrowDown,
} from "lucide-react";
import VoucherModal from "@/components/admin/VoucherModal";
import type { VoucherData } from "@/components/admin/VoucherModal";

const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  ACTIVE:    { label: "Active",    color: "bg-green-50 text-green-700 border-green-200",  icon: <CheckCircle size={12} /> },
  REDEEMED:  { label: "Redeemed",  color: "bg-purple-50 text-purple-700 border-purple-200", icon: <Gift size={12} /> },
  EXPIRED:   { label: "Expired",   color: "bg-amber-50 text-amber-700 border-amber-200",  icon: <Clock size={12} /> },
  CANCELLED: { label: "Cancelled", color: "bg-red-50 text-red-600 border-red-200",        icon: <XCircle size={12} /> },
};

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, color: "bg-gray-50 text-gray-600 border-gray-200", icon: <AlertCircle size={12} /> };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${meta.color}`}>
      {meta.icon} {meta.label}
    </span>
  );
}

const STATUS_FILTERS = [
  { label: "All",         value: "" },
  { label: "Active",      value: "ACTIVE" },
  { label: "Redeemed",    value: "REDEEMED" },
  { label: "Expired",     value: "EXPIRED" },
  { label: "Cancelled",   value: "CANCELLED" },
];

const STATUS_COUNT_CARDS = [
  { key: "ACTIVE",    label: "Active",      cls: "bg-green-50 border-green-200" },
  { key: "REDEEMED",  label: "Redeemed",    cls: "bg-purple-50 border-purple-200" },
  { key: "EXPIRED",   label: "Expired",    cls: "bg-amber-50 border-amber-200" },
  { key: "CANCELLED", label: "Cancelled",   cls: "bg-red-50 border-red-200" },
];

type SortField = "createdAt" | "expiresAt" | "value";

export default function AdminVouchersPage() {
  const [vouchers,   setVouchers]   = useState<VoucherData[]>([]);
  const [total,       setTotal]       = useState(0);
  const [counts,      setCounts]      = useState<Record<string, number>>({});
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom,    setDateFrom]   = useState("");
  const [dateTo,      setDateTo]     = useState("");
  const [amountMin,   setAmountMin]  = useState("");
  const [amountMax,   setAmountMax]  = useState("");
  const [page,        setPage]       = useState(1);
  const [sortBy,      setSortBy]     = useState<SortField>("createdAt");
  const [sortOrder,   setSortOrder]  = useState<"asc" | "desc">("desc");
  const LIMIT = 30;

  const [modalOpen, setModalOpen] = useState(false);
  const [editing,   setEditing]   = useState<VoucherData | null>(null);

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit:     String(LIMIT),
        page:      String(page),
        sortBy:    sortBy,
        sortOrder: sortOrder,
      });
      if (search.trim())          params.set("search",     search.trim());
      if (statusFilter)           params.set("status",     statusFilter);
      if (dateFrom)               params.set("dateFrom",   dateFrom);
      if (dateTo)                 params.set("dateTo",     dateTo);
      if (amountMin)              params.set("amountMin",  amountMin);
      if (amountMax)              params.set("amountMax",  amountMax);

      const res  = await fetch(`/api/vouchers?${params}`);
      const data = await res.json();
      if (res.ok) {
        setVouchers(data.vouchers ?? []);
        setTotal(data.pagination?.total ?? 0);
        if (data.counts)          setCounts(data.counts);
      }
    } catch (e) {
      console.error("Failed to load vouchers", e);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, dateFrom, dateTo, amountMin, amountMax, page, sortBy, sortOrder]);

  useEffect(() => { fetchVouchers(); }, [fetchVouchers]);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit   = (v: VoucherData) => { setEditing(v); setModalOpen(true); };
  const handleSave = () => { fetchVouchers(); };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return <ArrowUpDown size={11} className="text-charcoal/20" />;
    return sortOrder === "asc"
      ? <ArrowUp   size={11} className="text-gold" />
      : <ArrowDown  size={11} className="text-gold" />;
  };

  const isExpired = (v: VoucherData) => new Date(v.expiresAt) < new Date();
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl text-espresso flex items-center gap-2">
            <Gift className="text-gold" size={22} /> Gift Vouchers
          </h1>
          <p className="text-sm text-charcoal-lighter mt-1">
            {total} total voucher{total !== 1 ? "s" : ""}
            {(counts.ACTIVE ?? 0) > 0 && (
              <span className="ml-2 text-green-600 font-medium">{counts.ACTIVE} active</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchVouchers}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 border border-charcoal/20 rounded-sm text-charcoal-lighter hover:border-espresso/30 hover:text-espresso transition-colors"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            id="issue-voucher-btn"
            onClick={openCreate}
            className="btn-gold text-xs py-2 px-3 flex items-center gap-1.5"
          >
            <Plus size={13} /> Issue Voucher
          </button>
        </div>
      </div>

      {/* Status count cards */}
      {!loading && Object.values(counts).some((n) => n > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STATUS_COUNT_CARDS.map((card) => (
            <button
              key={card.key}
              onClick={() => { setStatusFilter(statusFilter === card.key ? "" : card.key); setPage(1); }}
              className={`px-4 py-3 rounded-sm border text-center transition-all ${
                statusFilter === card.key
                  ? `${card.cls} ring-1 ring-gold/50`
                  : `${card.cls} opacity-70 hover:opacity-100 hover:shadow-sm`
              }`}
            >
              <p className="font-display text-2xl font-bold text-espresso">{counts[card.key] ?? 0}</p>
              <p className="text-xs text-charcoal-lighter mt-0.5">{card.label}</p>
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatusFilter(f.value); setPage(1); }}
              className={`text-xs px-3 py-1.5 rounded-sm border transition-colors font-medium ${
                statusFilter === f.value
                  ? "bg-espresso text-cream border-espresso"
                  : "border-charcoal/20 text-charcoal-lighter hover:border-espresso/30 hover:text-espresso"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by code or name..."
            className="text-sm pl-8 pr-3 py-1.5 border border-charcoal/20 rounded-sm bg-white text-espresso placeholder:text-charcoal/30 focus:outline-none focus:ring-1 focus:ring-gold/50 w-56"
          />
        </div>
      </div>

      {/* Date range + Amount filter row */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="border border-charcoal/20 rounded-sm bg-white text-sm text-espresso px-3 py-2 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30"
            placeholder="From"
          />
          <span className="text-charcoal/30 text-xs">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="border border-charcoal/20 rounded-sm bg-white text-sm text-espresso px-3 py-2 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30"
            placeholder="To"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs text-charcoal-lighter">
          <span>₹</span>
          <input
            type="number"
            value={amountMin}
            onChange={(e) => { setAmountMin(e.target.value); setPage(1); }}
            placeholder="Min"
            min="0"
            className="w-20 border border-charcoal/20 rounded-sm bg-white text-sm text-espresso px-2 py-1.5 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 placeholder:text-charcoal/30"
          />
          <span className="text-charcoal/30">—</span>
          <input
            type="number"
            value={amountMax}
            onChange={(e) => { setAmountMax(e.target.value); setPage(1); }}
            placeholder="Max"
            min="0"
            className="w-20 border border-charcoal/20 rounded-sm bg-white text-sm text-espresso px-2 py-1.5 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 placeholder:text-charcoal/30"
          />
        </div>

        {(search || statusFilter || dateFrom || dateTo || amountMin || amountMax) && (
          <button
            onClick={() => {
              setSearch(""); setStatusFilter(""); setDateFrom(""); setDateTo("");
              setAmountMin(""); setAmountMax(""); setPage(1);
            }}
            className="text-xs px-3 py-1.5 border border-red-200 text-red-500 rounded-sm hover:bg-red-50 transition-colors flex items-center gap-1"
          >
            <X size={12} /> Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-gold" size={28} />
        </div>
      ) : vouchers.length === 0 ? (
        <div className="text-center py-16 text-charcoal-lighter">
          <Gift size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No vouchers found</p>
          <p className="text-sm mt-1 opacity-70">
            {statusFilter ? `No ${statusFilter.toLowerCase()} vouchers` : "Issue your first voucher to get started"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-sm border border-cream-darker/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-cream/50 border-b border-cream-darker/20">
                  <th className="text-left py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Code</th>
                  <th className="text-left py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Recipient</th>
                  <th
                    className="text-left py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider cursor-pointer hover:text-espresso select-none"
                    onClick={() => handleSort("value")}
                  >
                    <span className="flex items-center gap-1">Value <SortIcon field="value" /></span>
                  </th>
                  <th className="text-left py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Remaining</th>
                  <th className="text-left py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Status</th>
                  <th
                    className="text-left py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider cursor-pointer hover:text-espresso select-none"
                    onClick={() => handleSort("expiresAt")}
                  >
                    <span className="flex items-center gap-1">Expires <SortIcon field="expiresAt" /></span>
                  </th>
                  <th className="text-left py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Issued By</th>
                  <th className="py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map((v) => (
                  <tr
                    key={v.id}
                    className={`border-b border-cream-darker/10 hover:bg-cream/20 transition-colors ${v.status === "CANCELLED" ? "opacity-50" : ""}`}
                  >
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs text-gold font-semibold">{v.code}</span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-espresso text-sm">{v.recipientName ?? "—"}</p>
                      {v.recipientEmail && <p className="text-xs text-charcoal-lighter/70">{v.recipientEmail}</p>}
                    </td>
                    <td className="py-3 px-4 font-semibold text-espresso">
                      ₹{Number(v.value).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-medium ${
                        Number(v.remainingValue) <= 0
                          ? "text-charcoal-lighter"
                          : Number(v.remainingValue) < Number(v.value)
                          ? "text-amber-600"
                          : "text-green-600"
                      }`}>
                        ₹{Number(v.remainingValue).toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={v.status === "ACTIVE" && isExpired(v) ? "EXPIRED" : v.status} />
                    </td>
                    <td className="py-3 px-4 text-xs text-charcoal-lighter">
                      {new Date(v.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      {isExpired(v) && v.status === "ACTIVE" && <span className="text-red-500 ml-1">(overdue)</span>}
                    </td>
                    <td className="py-3 px-4 text-xs text-charcoal-lighter">{v.purchasedBy?.name ?? "—"}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openEdit(v)}
                        className="inline-flex items-center gap-1 text-xs text-charcoal-lighter hover:text-espresso border border-cream-darker/50 px-2 py-1 rounded-sm transition-all"
                      >
                        <Eye size={11} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-charcoal-lighter pt-2">
          <span className="text-xs">{total} total</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="px-3 py-1.5 border border-charcoal/20 rounded-sm disabled:opacity-40 hover:border-espresso/30 transition-colors text-xs"
            >
              Previous
            </button>
            <span className="text-xs">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="px-3 py-1.5 border border-charcoal/20 rounded-sm disabled:opacity-40 hover:border-espresso/30 transition-colors text-xs"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <VoucherModal
          initial={editing}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}