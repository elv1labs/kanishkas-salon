"use client";

// app/admin/loyalty-approvals/page.tsx
// Admin page for reviewing and approving/rejecting pending loyalty point awards.
// Reject action is inline (no modal) — requires minimum 10-char reason before submitting.

import { useState, useEffect, useCallback } from "react";
import {
  Gift, CheckCircle, XCircle, Clock, User,
  Calendar, Scissors, Star, RefreshCw, ChevronDown, ChevronUp,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type PendingTransaction = {
  id:          string;
  points:      number;
  description: string;
  createdAt:   string;
  client: {
    id:    string;
    name:  string;
    email: string;
    phone: string | null;
  };
  appointment: {
    id:          string;
    date:        string;
    startTime:   string;
    serviceName: string;
    amount:      number;
  } | null;
};

// ── Row component ──────────────────────────────────────────────────────────────

function ApprovalRow({
  tx,
  onApproved,
  onRejected,
}: {
  tx:         PendingTransaction;
  onApproved: (id: string) => void;
  onRejected: (id: string) => void;
}) {
  const [approving,    setApproving]    = useState(false);
  const [rejecting,    setRejecting]    = useState(false);
  const [rejectOpen,   setRejectOpen]   = useState(false);
  const [rejectNote,   setRejectNote]   = useState("");
  const [error,        setError]        = useState<string | null>(null);

  const handleApprove = async () => {
    setApproving(true);
    setError(null);
    try {
      const res  = await fetch("/api/loyalty/approve", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ transactionId: tx.id }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error ?? "Approval failed"); return; }
      onApproved(tx.id);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (rejectNote.trim().length < 10) return; // guard (also disabled in UI)
    setRejecting(true);
    setError(null);
    try {
      const res  = await fetch("/api/loyalty/reject", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ transactionId: tx.id, note: rejectNote.trim() }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error ?? "Rejection failed"); return; }
      onRejected(tx.id);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setRejecting(false);
    }
  };

  const aptDate = tx.appointment
    ? new Date(tx.appointment.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null;

  return (
    <div className="bg-white rounded-sm border border-cream-darker/50 overflow-hidden">
      {/* Main row */}
      <div className="flex flex-wrap items-start gap-4 px-5 py-4">

        {/* Points pill */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-full bg-gold/10 border border-gold/30">
          <Star size={14} className="text-gold mb-0.5" />
          <span className="font-display text-lg font-bold text-espresso leading-none">{tx.points}</span>
          <span className="text-[9px] text-charcoal-lighter uppercase tracking-wider">pts</span>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded border bg-amber-50 border-amber-200 text-amber-700">
              <Clock size={10} /> Pending Approval
            </span>
            <span className="text-xs text-charcoal-lighter">
              Requested {new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <span className="flex items-center gap-1.5 font-medium text-espresso">
              <User size={13} className="text-charcoal-lighter" />
              {tx.client.name}
            </span>
            {tx.client.phone && (
              <span className="text-charcoal-lighter text-xs">{tx.client.phone}</span>
            )}
          </div>

          {tx.appointment && (
            <div className="flex flex-wrap gap-x-5 gap-y-0.5 text-xs text-charcoal-lighter">
              <span className="flex items-center gap-1">
                <Scissors size={11} /> {tx.appointment.serviceName}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={11} /> {aptDate} at {tx.appointment.startTime}
              </span>
              <span className="font-medium text-espresso">
                ₹{tx.appointment.amount.toLocaleString("en-IN")}
              </span>
            </div>
          )}

          <p className="text-xs text-charcoal-lighter italic">{tx.description}</p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleApprove}
            disabled={approving || rejecting}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50 transition-colors"
          >
            {approving ? (
              <span className="inline-block w-3 h-3 border border-green-600/30 border-t-green-600 rounded-full animate-spin" />
            ) : (
              <CheckCircle size={13} />
            )}
            Approve
          </button>

          <button
            onClick={() => { setRejectOpen((o) => !o); setError(null); }}
            disabled={approving || rejecting}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded border transition-colors disabled:opacity-50 ${
              rejectOpen
                ? "border-red-300 text-red-700 bg-red-50"
                : "border-cream-darker/50 text-charcoal-lighter hover:border-red-200 hover:text-red-600"
            }`}
          >
            <XCircle size={13} />
            Reject
            {rejectOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        </div>
      </div>

      {/* Inline reject form */}
      {rejectOpen && (
        <div className="px-5 pb-4 pt-1 border-t border-red-100 bg-red-50/50">
          <label className="block text-xs font-semibold text-red-700 uppercase tracking-wider mb-2">
            Rejection Reason <span className="text-red-500">*</span>
            <span className="ml-1 font-normal text-charcoal-lighter normal-case tracking-normal">
              (minimum 10 characters)
            </span>
          </label>
          <textarea
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="e.g. Points were already awarded for this visit under a different record..."
            className="w-full bg-white border border-red-200 rounded py-2.5 px-3 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200 resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <span className={`text-xs ${rejectNote.length < 10 ? "text-red-400" : "text-green-600"}`}>
              {rejectNote.length}/500 {rejectNote.length < 10 ? `— ${10 - rejectNote.length} more needed` : "✓"}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => { setRejectOpen(false); setRejectNote(""); setError(null); }}
                className="text-xs px-3 py-1.5 border border-cream-darker/50 rounded text-charcoal-lighter hover:border-gold/30 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={rejectNote.trim().length < 10 || rejecting}
                className="text-xs px-3 py-1.5 bg-red-600 text-white rounded font-semibold hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
              >
                {rejecting ? (
                  <span className="inline-block w-3 h-3 border border-red-200/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <XCircle size={12} />
                )}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline error */}
      {error && (
        <div className="px-5 pb-3 pt-1">
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function LoyaltyApprovalsPage() {
  const [transactions, setTransactions] = useState<PendingTransaction[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/loyalty/pending");
      const data = await res.json();
      if (!data.success) { setError(data.error ?? "Failed to load"); return; }
      setTransactions(data.data.transactions);
    } catch {
      setError("Network error — could not load loyalty approvals.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handleApproved = (id: string) =>
    setTransactions((prev) => prev.filter((t) => t.id !== id));

  const handleRejected = (id: string) =>
    setTransactions((prev) => prev.filter((t) => t.id !== id));

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-xl text-espresso">Loyalty Approvals</h1>
          <p className="text-xs text-charcoal-lighter mt-0.5">
            Review and approve pending loyalty point awards for completed appointments
          </p>
        </div>
        <button
          onClick={fetchPending}
          className="btn-outline text-xs py-2 px-4 flex items-center gap-1.5"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Summary strip */}
      <div className="bg-white rounded-sm border border-cream-darker/50 px-5 py-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
          <Gift size={18} className="text-amber-600" />
        </div>
        <div>
          <p className="text-xs text-charcoal-lighter uppercase tracking-wider">Awaiting Approval</p>
          <p className="font-display text-2xl font-bold text-espresso">
            {loading ? "—" : transactions.length}
            <span className="text-sm font-normal text-charcoal-lighter ml-2">
              {transactions.length === 1 ? "transaction" : "transactions"}
            </span>
          </p>
        </div>
        {!loading && transactions.length > 0 && (
          <div className="ml-auto text-right">
            <p className="text-xs text-charcoal-lighter">Total points pending</p>
            <p className="font-display text-lg font-bold text-gold">
              {transactions.reduce((s, t) => s + t.points, 0).toLocaleString("en-IN")} pts
            </p>
          </div>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <span className="inline-block w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-sm px-5 py-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="bg-white rounded-sm border border-cream-darker/50 px-5 py-16 text-center">
          <CheckCircle size={32} className="text-green-400 mx-auto mb-3" />
          <p className="font-display text-lg text-espresso">All caught up</p>
          <p className="text-sm text-charcoal-lighter mt-1">No loyalty approvals are currently pending.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <ApprovalRow
              key={tx.id}
              tx={tx}
              onApproved={handleApproved}
              onRejected={handleRejected}
            />
          ))}
        </div>
      )}
    </div>
  );
}
