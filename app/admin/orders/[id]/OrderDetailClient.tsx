"use client";
// app/admin/orders/[id]/OrderDetailClient.tsx
// Full order detail with "Confirm Payment Received" action + confirmation provenance

import { useState } from "react";
import {
  CheckCircle2, Clock, Package, IndianRupee, User, Phone, MapPin,
  CreditCard, Smartphone, Banknote, Loader2, ShieldCheck, X,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type PaymentMethod = "CASH" | "UPI" | "CARD" | "ONLINE";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  product: { id: string; name: string; slug: string; thumbnailUrl: string | null; price: string };
}

interface Payment {
  id: string;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "PARTIAL";
  method: PaymentMethod | null;
  amount: string;
  transactionRef: string | null;
  paymentNote: string | null;
  paidAt: string | null;
}

interface Order {
  id: string;
  orderRef: string;
  status: string;
  createdAt: string;
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  shippingAmount: string;
  total: string;
  voucherCode: string | null;
  notes: string | null;
  shippingName: string | null;
  shippingPhone: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingPincode: string | null;
  client: { id: string; name: string; email: string; phone: string | null };
  items: OrderItem[];
  payment: Payment | null;
}

interface ConfirmLog {
  id: string;
  createdAt: string;
  user: { id: string; name: string; role: string } | null;
}

// ── Helper ────────────────────────────────────────────────────────────────────

const METHOD_ICONS: Record<PaymentMethod, React.ReactNode> = {
  CASH:   <Banknote   size={14} />,
  UPI:    <Smartphone size={14} />,
  CARD:   <CreditCard size={14} />,
  ONLINE: <CreditCard size={14} />,
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING:    "bg-amber-50 text-amber-700 border-amber-200",
  PROCESSING: "bg-blue-50 text-blue-700 border-blue-200",
  SHIPPED:    "bg-purple-50 text-purple-700 border-purple-200",
  DELIVERED:  "bg-green-50 text-green-700 border-green-200",
  CANCELLED:  "bg-red-50 text-red-600 border-red-200",
  REFUNDED:   "bg-gray-50 text-gray-600 border-gray-200",
};

// ── Confirm Payment Modal ─────────────────────────────────────────────────────

function ConfirmPaymentModal({
  order,
  onClose,
  onSuccess,
}: {
  order: Order;
  onClose: () => void;
  onSuccess: (payment: Payment) => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [amount, setAmount] = useState(String(Number(order.total)));
  const [txRef, setTxRef] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/orders/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId:       order.id,
          paymentMethod: method,
          paymentAmount: amt,
          transactionRef: txRef.trim() || undefined,
          paymentNote:    note.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to confirm payment.");
        return;
      }
      onSuccess(data.payment);
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-sm border border-cream-darker/50 shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-darker/20">
          <div>
            <h3 className="font-display text-lg text-espresso">Confirm Payment Received</h3>
            <p className="text-xs text-charcoal-lighter mt-0.5">
              Order #{order.orderRef.slice(-8).toUpperCase()} · {order.client.name}
            </p>
          </div>
          <button
            id="close-confirm-payment-modal"
            onClick={onClose}
            className="text-charcoal-lighter hover:text-espresso transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-sm px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          {/* Method */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["CASH", "UPI", "CARD"] as PaymentMethod[]).map(m => (
                <button
                  key={m}
                  id={`payment-method-${m.toLowerCase()}`}
                  onClick={() => setMethod(m)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-sm border-2 text-xs font-semibold transition-all ${
                    method === m
                      ? "border-gold bg-gold/10 text-espresso"
                      : "border-cream-darker/50 text-charcoal-lighter hover:border-gold/30"
                  }`}
                >
                  <span className={method === m ? "text-gold" : "text-charcoal-lighter"}>
                    {METHOD_ICONS[m]}
                  </span>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-2">
              Amount Received (₹)
            </label>
            <div className="relative">
              <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-lighter" />
              <input
                id="payment-amount-input"
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full border border-cream-darker/50 rounded-sm py-2.5 pl-9 pr-4 text-sm font-medium text-espresso focus:outline-none focus:border-gold/50"
              />
            </div>
            <p className="text-xs text-charcoal-lighter/60 mt-1">
              Order total: ₹{Number(order.total).toLocaleString("en-IN")}
            </p>
          </div>

          {/* Transaction Reference */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-2">
              {method === "UPI" ? "UPI Reference / UTR No." : method === "CARD" ? "Card Last 4 Digits" : "Receipt No. (optional)"}
            </label>
            <input
              id="transaction-ref-input"
              type="text"
              value={txRef}
              onChange={e => setTxRef(e.target.value)}
              placeholder={
                method === "UPI"  ? "e.g. 123456789012" :
                method === "CARD" ? "e.g. 4242" :
                "e.g. RC-001"
              }
              className="w-full border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/50"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-2">
              Internal Note (optional)
            </label>
            <textarea
              id="payment-note-input"
              rows={2}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Any additional notes about this payment..."
              className="w-full border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/50 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-cream-darker/20 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm border border-cream-darker/50 rounded-sm text-charcoal-lighter hover:border-gold/30 transition-colors"
          >
            Cancel
          </button>
          <button
            id="confirm-payment-btn"
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-2.5 text-sm bg-espresso text-cream rounded-sm font-semibold hover:bg-espresso/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> Saving...</>
              : <><CheckCircle2 size={15} /> Confirm Payment Received</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Client Component ─────────────────────────────────────────────────────

export default function OrderDetailClient({
  order: initialOrder,
  confirmLog: initialLog,
}: {
  order: Order;
  confirmLog: ConfirmLog | null;
}) {
  const [order, setOrder]       = useState<Order>(initialOrder);
  const [confirmLog, setConfirmLog] = useState<ConfirmLog | null>(initialLog);
  const [showModal, setShowModal] = useState(false);

  const isPaid = order.payment?.status === "PAID";
  const isCancelled = ["CANCELLED", "REFUNDED"].includes(order.status);

  const handlePaymentSuccess = (payment: Payment) => {
    setOrder(o => ({ ...o, payment }));
    // Refetch to get the confirm log (server-side, use a quick reload trick)
    window.location.reload();
  };

  const fmt = (n: string | number) => `₹${Number(n).toLocaleString("en-IN")}`;

  return (
    <>
      {/* Order Header */}
      <div className="bg-white rounded-sm border border-cream-darker/50 p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-xl text-espresso flex items-center gap-2">
              <Package size={20} className="text-gold" />
              Order #{order.orderRef.slice(-8).toUpperCase()}
            </h1>
            <p className="text-xs text-charcoal-lighter mt-1 flex items-center gap-1">
              <Clock size={12} />
              {new Date(order.createdAt).toLocaleString("en-IN", {
                weekday: "short", day: "numeric", month: "short", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${ORDER_STATUS_COLORS[order.status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
              {order.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: items + payment */}
        <div className="lg:col-span-2 space-y-4">
          {/* Line items */}
          <div className="bg-white rounded-sm border border-cream-darker/50 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-cream-darker/20">
              <h2 className="font-display text-sm text-espresso">Order Items</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-cream/40 border-b border-cream-darker/20">
                  <th className="text-left py-2.5 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Product</th>
                  <th className="text-center py-2.5 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Qty</th>
                  <th className="text-right py-2.5 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Unit</th>
                  <th className="text-right py-2.5 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map(item => (
                  <tr key={item.id} className="border-b border-cream-darker/10 hover:bg-cream/20">
                    <td className="py-3 px-4">
                      <p className="font-medium text-espresso">{item.product.name}</p>
                    </td>
                    <td className="py-3 px-4 text-center text-charcoal-lighter">{item.quantity}</td>
                    <td className="py-3 px-4 text-right text-charcoal-lighter">{fmt(item.unitPrice)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-espresso">{fmt(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Order totals */}
            <div className="px-4 py-3 border-t border-cream-darker/20 space-y-1.5 text-sm">
              <div className="flex justify-between text-charcoal-lighter">
                <span>Subtotal</span><span>{fmt(order.subtotal)}</span>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount {order.voucherCode && `(${order.voucherCode})`}</span>
                  <span>−{fmt(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-charcoal-lighter">
                <span>GST (18%)</span><span>{fmt(order.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-charcoal-lighter">
                <span>Shipping</span>
                <span>{Number(order.shippingAmount) === 0 ? "Free" : fmt(order.shippingAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-espresso border-t border-cream-darker/20 pt-2 mt-2">
                <span className="font-display text-base">Total</span>
                <span className="font-display text-xl">{fmt(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Payment Panel */}
          <div className="bg-white rounded-sm border border-cream-darker/50 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-cream-darker/20 flex items-center justify-between">
              <h2 className="font-display text-sm text-espresso flex items-center gap-2">
                <IndianRupee size={15} className="text-gold" /> Payment
              </h2>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                isPaid
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}>
                {isPaid ? "✓ PAID" : "⏳ PENDING"}
              </span>
            </div>

            <div className="p-5">
              {isPaid && order.payment ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-charcoal-lighter uppercase tracking-wider mb-0.5">Method</p>
                      <p className="font-medium text-espresso flex items-center gap-1.5">
                        {order.payment.method && METHOD_ICONS[order.payment.method]}
                        {order.payment.method ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-charcoal-lighter uppercase tracking-wider mb-0.5">Amount Paid</p>
                      <p className="font-medium text-green-700">{fmt(order.payment.amount)}</p>
                    </div>
                    {order.payment.transactionRef && (
                      <div>
                        <p className="text-xs text-charcoal-lighter uppercase tracking-wider mb-0.5">Reference</p>
                        <p className="font-mono text-sm text-espresso">{order.payment.transactionRef}</p>
                      </div>
                    )}
                    {order.payment.paidAt && (
                      <div>
                        <p className="text-xs text-charcoal-lighter uppercase tracking-wider mb-0.5">Paid At</p>
                        <p className="text-sm text-espresso">
                          {new Date(order.payment.paidAt).toLocaleString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Provenance: who confirmed */}
                  {confirmLog && (
                    <div className="mt-3 bg-green-50 border border-green-200 rounded-sm px-4 py-3 flex items-start gap-2.5">
                      <ShieldCheck size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-green-800">Payment Confirmed by Staff</p>
                        <p className="text-xs text-green-700 mt-0.5">
                          <span className="font-medium">{confirmLog.user?.name ?? "Staff"}</span>
                          {" "}({confirmLog.user?.role ?? "STAFF"}) on{" "}
                          {new Date(confirmLog.createdAt).toLocaleString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  {order.payment.paymentNote && (
                    <p className="text-xs text-charcoal-lighter italic border-t border-cream-darker/20 pt-2">
                      Note: {order.payment.paymentNote}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center py-4 text-center">
                  <p className="text-sm text-charcoal-lighter mb-4">
                    This order has not been paid yet. Once you receive cash, UPI, or card payment, confirm it below.
                  </p>
                  {!isCancelled && (
                    <button
                      id="open-confirm-payment-modal"
                      onClick={() => setShowModal(true)}
                      className="btn-gold flex items-center gap-2 px-6 py-3"
                    >
                      <CheckCircle2 size={16} />
                      Confirm Payment Received
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: client + shipping */}
        <div className="space-y-4">
          {/* Client info */}
          <div className="bg-white rounded-sm border border-cream-darker/50 p-5">
            <h2 className="font-display text-sm text-espresso mb-3 flex items-center gap-2">
              <User size={14} className="text-gold" /> Customer
            </h2>
            <p className="font-medium text-espresso">{order.client.name}</p>
            <p className="text-xs text-charcoal-lighter mt-0.5">{order.client.email}</p>
            {order.client.phone && (
              <a href={`tel:${order.client.phone}`} className="flex items-center gap-1 text-xs text-gold hover:text-gold/80 mt-1 transition-colors">
                <Phone size={11} /> {order.client.phone}
              </a>
            )}
          </div>

          {/* Shipping */}
          {order.shippingName && (
            <div className="bg-white rounded-sm border border-cream-darker/50 p-5">
              <h2 className="font-display text-sm text-espresso mb-3 flex items-center gap-2">
                <MapPin size={14} className="text-gold" /> Shipping Address
              </h2>
              <p className="font-medium text-espresso">{order.shippingName}</p>
              {order.shippingPhone && <p className="text-xs text-charcoal-lighter mt-0.5">{order.shippingPhone}</p>}
              {order.shippingAddress && <p className="text-sm text-charcoal-lighter mt-1">{order.shippingAddress}</p>}
              {(order.shippingCity || order.shippingPincode) && (
                <p className="text-sm text-charcoal-lighter">
                  {[order.shippingCity, order.shippingPincode].filter(Boolean).join(" – ")}
                </p>
              )}
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="bg-white rounded-sm border border-cream-darker/50 p-5">
              <h2 className="font-display text-sm text-espresso mb-2">Order Notes</h2>
              <p className="text-sm text-charcoal-lighter italic">{order.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment confirmation modal */}
      {showModal && (
        <ConfirmPaymentModal
          order={order}
          onClose={() => setShowModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
}
