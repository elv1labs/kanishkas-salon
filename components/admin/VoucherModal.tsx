"use client";
import { extractApiError } from "@/lib/extract-error";

import { useState, useEffect, useRef } from "react";
import { X, Check, Loader2, Trash2, AlertTriangle, Calendar } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

export type VoucherData = {
  id: string;
  code: string;
  value: number;
  remainingValue: number;
  status: string;
  recipientName: string | null;
  recipientEmail: string | null;
  message: string | null;
  expiresAt: string;
  redeemedAt: string | null;
  purchasedBy?: { id: string; name: string; email: string } | null;
};

type VoucherForm = {
  value: string;
  recipientName: string;
  recipientEmail: string;
  message: string;
  expiresInMonths: string;
  // Edit-only fields
  expiresAt: string;
  remainingValue: string;
};

const EMPTY_FORM: VoucherForm = {
  value: "",
  recipientName: "",
  recipientEmail: "",
  message: "",
  expiresInMonths: "12",
  expiresAt: "",
  remainingValue: "",
};

// ── Component ────────────────────────────────────────────────────────────────

export default function VoucherModal({
  initial,
  onClose,
  onSave,
}: {
  initial: VoucherData | null; // null = CREATE mode
  onClose: () => void;
  onSave: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<VoucherForm>(
    initial
      ? {
          value: String(initial.value),
          recipientName: initial.recipientName ?? "",
          recipientEmail: initial.recipientEmail ?? "",
          message: initial.message ?? "",
          expiresInMonths: "12",
          expiresAt: initial.expiresAt
            ? new Date(initial.expiresAt).toISOString().split("T")[0]
            : "",
          remainingValue: String(initial.remainingValue),
        }
      : EMPTY_FORM
  );
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRedeemed = initial?.status === "REDEEMED";
  const isCancelled = initial?.status === "CANCELLED";
  const isReadOnly = isRedeemed || isCancelled;

  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!initial) {
      // CREATE validation
      const value = parseFloat(form.value);
      if (isNaN(value) || value < 100) {
        setError("Minimum voucher value is ₹100.");
        return;
      }
      if (!form.recipientName.trim()) {
        setError("Recipient name is required.");
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      if (initial) {
        // PATCH
        const payload: Record<string, unknown> = {};
        if (form.recipientName.trim() !== (initial.recipientName ?? ""))
          payload.recipientName = form.recipientName.trim();
        if (form.recipientEmail.trim() !== (initial.recipientEmail ?? ""))
          payload.recipientEmail = form.recipientEmail.trim();
        if (form.message.trim() !== (initial.message ?? ""))
          payload.message = form.message.trim();
        if (form.expiresAt) {
          const newExpiry = new Date(form.expiresAt).toISOString();
          if (newExpiry !== new Date(initial.expiresAt).toISOString())
            payload.expiresAt = newExpiry;
        }
        if (!isRedeemed && form.remainingValue !== String(initial.remainingValue)) {
          const rv = parseFloat(form.remainingValue);
          if (!isNaN(rv) && rv >= 0) payload.remainingValue = rv;
        }

        if (Object.keys(payload).length === 0) {
          onClose();
          return;
        }

        const res = await fetch(`/api/vouchers/${initial.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(extractApiError(data, "Failed to update voucher."));
          return;
        }
      } else {
        // POST (admin issue)
        const res = await fetch("/api/vouchers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            value: parseInt(form.value),
            recipientName: form.recipientName.trim(),
            recipientEmail: form.recipientEmail.trim() || undefined,
            message: form.message.trim() || undefined,
            expiresInMonths: parseInt(form.expiresInMonths) || 12,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(extractApiError(data, "Failed to issue voucher."));
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

  // ── Cancel voucher ────────────────────────────────────────────────────────

  const handleCancel = async () => {
    if (!initial) return;
    setCancelling(true);
    setError(null);
    try {
      const res = await fetch(`/api/vouchers/${initial.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(extractApiError(data, "Failed to cancel voucher."));
        return;
      }
      onSave();
      onClose();
    } catch {
      setError("Network error.");
    } finally {
      setCancelling(false);
      setConfirmCancel(false);
    }
  };

  const update = (key: keyof VoucherForm, val: string) =>
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
          <div>
            <h2 className="font-display text-lg text-espresso font-bold">
              {initial ? "Voucher Details" : "Issue Gift Voucher"}
            </h2>
            {initial && (
              <p className="text-xs font-mono text-gold mt-0.5">{initial.code}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-cream/60 text-charcoal-lighter transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Status banner (edit mode) */}
          {initial && (
            <div
              className={`px-3 py-2 rounded-md text-xs font-medium border ${
                initial.status === "ACTIVE"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : initial.status === "REDEEMED"
                  ? "bg-purple-50 text-purple-700 border-purple-200"
                  : initial.status === "CANCELLED"
                  ? "bg-red-50 text-red-600 border-red-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              Status: {initial.status}
              {initial.redeemedAt &&
                ` — Redeemed ${new Date(initial.redeemedAt).toLocaleDateString("en-IN")}`}
              {initial.purchasedBy &&
                ` — Issued by ${initial.purchasedBy.name}`}
            </div>
          )}

          {/* Value */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">
              Value (₹) {!initial && "*"}
            </label>
            <input
              type="number"
              min="100"
              max="50000"
              step="100"
              value={form.value}
              onChange={(e) => update("value", e.target.value)}
              disabled={!!initial}
              placeholder="e.g. 2000"
              className={`w-full bg-white border border-cream-darker/50 rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 ${
                initial ? "opacity-60 cursor-not-allowed bg-cream/30" : ""
              }`}
            />
            {initial && (
              <p className="text-[10px] text-charcoal-lighter mt-1">
                Original value cannot be changed after creation.
              </p>
            )}
          </div>

          {/* Remaining Value (edit mode only, not redeemed) */}
          {initial && !isRedeemed && (
            <div>
              <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">
                Remaining Value (₹)
              </label>
              <input
                type="number"
                min="0"
                max="50000"
                value={form.remainingValue}
                onChange={(e) => update("remainingValue", e.target.value)}
                disabled={isReadOnly}
                className={`w-full bg-white border border-cream-darker/50 rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 ${
                  isReadOnly ? "opacity-60 cursor-not-allowed" : ""
                }`}
              />
            </div>
          )}

          {/* Recipient Name + Email */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">
                Recipient Name {!initial && "*"}
              </label>
              <input
                type="text"
                value={form.recipientName}
                onChange={(e) => update("recipientName", e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. Priya Sharma"
                className={`w-full bg-white border border-cream-darker/50 rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 ${
                  isReadOnly ? "opacity-60 cursor-not-allowed" : ""
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">
                Recipient Email
              </label>
              <input
                type="email"
                value={form.recipientEmail}
                onChange={(e) => update("recipientEmail", e.target.value)}
                disabled={isReadOnly}
                placeholder="recipient@email.com"
                className={`w-full bg-white border border-cream-darker/50 rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 ${
                  isReadOnly ? "opacity-60 cursor-not-allowed" : ""
                }`}
              />
            </div>
          </div>

          {/* Expiry */}
          {initial ? (
            <div>
              <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">
                <Calendar size={11} className="inline mr-1" />
                Expires On
              </label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => update("expiresAt", e.target.value)}
                disabled={isReadOnly}
                className={`w-full bg-white border border-cream-darker/50 rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 ${
                  isReadOnly ? "opacity-60 cursor-not-allowed" : ""
                }`}
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">
                Valid For
              </label>
              <select
                value={form.expiresInMonths}
                onChange={(e) => update("expiresInMonths", e.target.value)}
                className="w-full bg-white border border-cream-darker/50 rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
              >
                <option value="3">3 Months</option>
                <option value="6">6 Months</option>
                <option value="12">12 Months</option>
                <option value="18">18 Months</option>
                <option value="24">24 Months</option>
              </select>
            </div>
          )}

          {/* Message */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">
              Message
            </label>
            <textarea
              rows={2}
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              disabled={isReadOnly}
              placeholder="Personal message for the recipient..."
              className={`w-full bg-white border border-cream-darker/50 rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 resize-none ${
                isReadOnly ? "opacity-60 cursor-not-allowed" : ""
              }`}
            />
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
          {/* Cancel voucher (edit mode, only if ACTIVE) */}
          {initial && initial.status === "ACTIVE" && !confirmCancel && (
            <button
              onClick={() => setConfirmCancel(true)}
              className="text-xs px-3 py-2 rounded-md border border-red-200 text-red-500 hover:bg-red-50 transition-colors flex items-center gap-1"
            >
              <Trash2 size={12} /> Cancel Voucher
            </button>
          )}
          {initial && confirmCancel && (
            <div className="flex items-center gap-2 flex-1">
              <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
              <span className="text-xs text-red-600">Cancel this voucher?</span>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="text-xs px-3 py-1.5 rounded-md bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
              >
                {cancelling ? "..." : "Yes, cancel"}
              </button>
              <button
                onClick={() => setConfirmCancel(false)}
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
            {isReadOnly ? "Close" : "Cancel"}
          </button>
          {!isReadOnly && (
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
                  <Check size={14} /> {initial ? "Save Changes" : "Issue Voucher"}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
