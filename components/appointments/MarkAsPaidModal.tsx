"use client";
import { extractApiError } from "@/lib/extract-error";
// components/appointments/MarkAsPaidModal.tsx
// Reusable modal for recording a cash / UPI / card payment against an appointment.
// Calls POST /api/appointments/mark-paid.
// Extracted from owner/appointments/page.tsx so receptionist pages can share it.

import { useState, useEffect, useRef } from "react";
import {
  CheckCircle, X, IndianRupee,
  CreditCard, Smartphone, Banknote,
} from "lucide-react";

type PaymentMethod = "UPI" | "CASH" | "CARD";

export type MarkAsPaidAppointment = {
  id: string;
  clientName: string;   // display in modal header
  serviceName: string;  // display in modal header
  totalAmount: number;  // pre-filled amount (₹)
};

const METHOD_ICONS: Record<PaymentMethod, React.ReactNode> = {
  UPI:  <Smartphone size={12} />,
  CASH: <Banknote   size={12} />,
  CARD: <CreditCard size={12} />,
};

export function MarkAsPaidModal({
  appointment,
  onClose,
  onSuccess,
}: {
  appointment: MarkAsPaidAppointment;
  onClose:     () => void;
  onSuccess:   () => void;
}) {
  const [method,  setMethod]  = useState<PaymentMethod>("CASH");
  const [amount,  setAmount]  = useState(String(appointment.totalAmount));
  const [ref,     setRef]     = useState("");
  const [note,    setNote]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/appointments/mark-paid", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          appointmentId:  appointment.id,
          paymentMethod:  method,
          paymentAmount:  parsedAmount,
          transactionRef: ref.trim()  || undefined,
          paymentNote:    note.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(extractApiError(data, "Failed to mark as paid.")); return; }
      onSuccess();
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-darker/30">
          <div>
            <h2 className="font-display text-lg text-espresso font-bold">Mark as Paid</h2>
            <p className="text-xs text-charcoal-lighter mt-0.5">
              {appointment.clientName} · {appointment.serviceName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-cream/60 text-charcoal-lighter transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Payment method */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["CASH", "UPI", "CARD"] as PaymentMethod[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-md border-2 text-xs font-semibold transition-all ${
                    method === m
                      ? "border-gold bg-gold/10 text-espresso"
                      : "border-cream-darker/50 text-charcoal-lighter hover:border-gold/30"
                  }`}
                >
                  <span className={method === m ? "text-gold" : ""}>{METHOD_ICONS[m]}</span>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-2">
              Amount (₹)
            </label>
            <div className="relative">
              <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-lighter" />
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white border border-cream-darker/50 rounded-md py-2.5 pl-9 pr-4 text-sm font-medium text-espresso focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
              />
            </div>
          </div>

          {/* Transaction reference */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-2">
              {method === "UPI"  ? "UPI Reference / UTR No."  :
               method === "CARD" ? "Card Last 4 Digits"       :
               "Receipt No. (optional)"}
            </label>
            <input
              type="text"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder={
                method === "UPI"  ? "e.g. 123456789012" :
                method === "CARD" ? "e.g. 4242"         :
                "e.g. RC-001"
              }
              className="w-full bg-white border border-cream-darker/50 rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-2">
              Note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Any additional payment notes..."
              className="w-full bg-white border border-cream-darker/50 rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md px-4 py-2.5">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-cream-darker/30 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm border border-cream-darker/50 rounded-md text-charcoal-lighter hover:border-gold/30 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 text-sm bg-espresso text-cream rounded-md font-semibold hover:bg-espresso/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <><span className="inline-block w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin" /> Saving...</>
            ) : (
              <><CheckCircle size={15} /> Confirm Payment</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
