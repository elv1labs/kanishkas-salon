"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ClipboardList, Clock, Package, Truck, CheckCircle, XCircle,
  Search, RefreshCw, Loader2, Phone, IndianRupee,
  CreditCard, Smartphone, Banknote, X, TrendingUp, Eye,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type PaymentStatus = "PENDING" | "PAID";
type PaymentMethod = "UPI" | "CASH" | "CARD" | "ONLINE";

type Payment = {
  status: PaymentStatus;
  amount: string;
  method: PaymentMethod | null;
  paidAt: string | null;
};

type Order = {
  id: string;
  orderRef: string;
  createdAt: string;
  status: string;
  total: string;
  subtotal: string;
  shippingAmount: string;
  client: { name: string; email: string; phone: string | null };
  items: { id: string; quantity: number; product: { name: string } }[];
  payment: Payment | null;
};

// ── Static config ─────────────────────────────────────────────────────────────

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  PENDING:    { color: "text-amber-700",  bg: "bg-amber-50 border-amber-200",   label: "Pending" },
  PROCESSING: { color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",     label: "Processing" },
  SHIPPED:    { color: "text-purple-700", bg: "bg-purple-50 border-purple-200", label: "Shipped" },
  DELIVERED:  { color: "text-green-700",  bg: "bg-green-50 border-green-200",   label: "Delivered" },
  CANCELLED:  { color: "text-red-600",    bg: "bg-red-50 border-red-200",       label: "Cancelled" },
  REFUNDED:   { color: "text-gray-600",   bg: "bg-gray-50 border-gray-200",     label: "Refunded" },
};

const STATUS_ACTIONS: Record<string, string[]> = {
  PENDING:    ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED:    ["DELIVERED"],
  DELIVERED:  [],
  CANCELLED:  [],
  REFUNDED:   [],
};

const METHOD_ICONS: Record<PaymentMethod, React.ReactNode> = {
  UPI:    <Smartphone size={12} />,
  CASH:   <Banknote size={12} />,
  CARD:   <CreditCard size={12} />,
  ONLINE: <CreditCard size={12} />,
};

const PAYMENT_FILTER_OPTIONS = ["All", "PENDING", "PAID"] as const;
type PaymentFilter = typeof PAYMENT_FILTER_OPTIONS[number];

// ── Mark-as-Paid Modal ────────────────────────────────────────────────────────

function MarkPaidModal({
  order,
  onClose,
  onSuccess,
}: {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [amount, setAmount] = useState(String(Number(order.total)));
  const [ref, setRef] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      const res = await fetch("/api/orders/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          paymentMethod: method,
          paymentAmount: parsedAmount,
          transactionRef: ref.trim() || undefined,
          paymentNote: note.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to mark as paid."); return; }
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
            <h2 className="font-display text-lg text-espresso font-bold">Mark Order Paid</h2>
            <p className="text-xs text-charcoal-lighter mt-0.5">
              {order.client.name} · #{order.orderRef.slice(-6).toUpperCase()}
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
              {method === "UPI" ? "UPI Reference / UTR No." : method === "CARD" ? "Card Last 4 Digits" : "Receipt No. (optional)"}
            </label>
            <input
              type="text"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder={
                method === "UPI" ? "e.g. 123456789012" :
                method === "CARD" ? "e.g. 4242" :
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

          {/* Error */}
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

// ── Payment Badge ─────────────────────────────────────────────────────────────

function PaymentBadge({ payment }: { payment: Payment | null }) {
  if (!payment || payment.status === "PENDING") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border bg-red-50 border-red-200 text-red-600 whitespace-nowrap">
        <XCircle size={10} /> PENDING
      </span>
    );
  }
  return (
    <div className="space-y-0.5">
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border bg-green-50 border-green-200 text-green-700 whitespace-nowrap">
        <CheckCircle size={10} /> PAID
      </span>
      {payment.method && (
        <div className="flex items-center gap-1 text-[10px] text-charcoal-lighter">
          {METHOD_ICONS[payment.method]} {payment.method}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("All");
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [markPaidTarget, setMarkPaidTarget] = useState<Order | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (filter !== "All") params.set("status", filter);
      const res = await fetch(`/api/orders?${params}`);
      const data = await res.json();
      setOrders(data.orders ?? []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filter]);

  const loadCounts = useCallback(async () => {
    const statuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
    const results = await Promise.all(
      statuses.map(s => fetch(`/api/orders?status=${s}&limit=1`).then(r => r.json()))
    );
    const c: Record<string, number> = {};
    statuses.forEach((s, i) => { c[s] = results[i].pagination?.total || 0; });
    setCounts(c);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadCounts(); }, [loadCounts]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      await load();
      await loadCounts();
    } finally { setUpdating(null); }
  };

  // ── Client-side filters ────────────────────────────────────────────────
  const filtered = orders.filter(o => {
    const matchSearch =
      search === "" ||
      o.client.name.toLowerCase().includes(search.toLowerCase()) ||
      o.orderRef.toLowerCase().includes(search.toLowerCase());

    const matchPayment =
      paymentFilter === "All" ||
      (paymentFilter === "PAID" && o.payment?.status === "PAID") ||
      (paymentFilter === "PENDING" && (!o.payment || o.payment.status === "PENDING"));

    return matchSearch && matchPayment;
  });

  // ── Revenue summary ─────────────────────────────────────────────────────
  const paidOrders = orders.filter(o => o.payment?.status === "PAID");
  const paidRevenue = paidOrders.reduce((sum, o) => sum + Number(o.payment?.amount ?? o.total), 0);
  const pendingPaymentCount = orders.filter(o => !o.payment || o.payment.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-xl text-espresso">Orders</h1>
        <button onClick={() => { load(); loadCounts(); }}
          className="btn-outline text-xs py-2 px-3 flex items-center gap-1.5">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* ── Revenue summary strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-sm border border-cream-darker/50 px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={18} className="text-green-600" />
          </div>
          <div>
            <p className="text-xs text-charcoal-lighter uppercase tracking-wider">Paid Revenue</p>
            <p className="font-display text-xl font-bold text-espresso">
              ₹{paidRevenue.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-sm border border-cream-darker/50 px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
            <CheckCircle size={18} className="text-green-600" />
          </div>
          <div>
            <p className="text-xs text-charcoal-lighter uppercase tracking-wider">Orders Paid</p>
            <p className="font-display text-xl font-bold text-espresso">{paidOrders.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-sm border border-cream-darker/50 px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
            <XCircle size={18} className="text-red-500" />
          </div>
          <div>
            <p className="text-xs text-charcoal-lighter uppercase tracking-wider">Payment Pending</p>
            <p className="font-display text-xl font-bold text-espresso">{pendingPaymentCount}</p>
          </div>
        </div>
      </div>

      {/* Status counts */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(statusConfig).filter(([k]) => k !== "REFUNDED").map(([key, cfg]) => (
          <button key={key} onClick={() => setFilter(filter === key ? "All" : key)}
            className={`rounded-sm border p-3 text-center transition-all ${
              filter === key ? `${cfg.bg} ${cfg.color} border-current` : "bg-white border-cream-darker/50 hover:border-gold/30"
            }`}>
            <p className={`font-display text-xl font-bold ${filter === key ? cfg.color : "text-espresso"}`}>
              {counts[key] ?? 0}
            </p>
            <p className="text-[9px] text-charcoal-lighter uppercase tracking-wider">{cfg.label}</p>
          </button>
        ))}
      </div>

      {/* ── Search & Payment Filter ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-lighter" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by client or order ref..."
            className="w-full bg-white border border-cream-darker/50 rounded-sm py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-gold/40" />
        </div>

        {/* Status: All reset */}
        <button
          onClick={() => { setFilter("All"); }}
          className={`px-3 py-2 text-xs font-semibold rounded-sm border transition-all ${
            filter === "All"
              ? "bg-espresso text-cream border-espresso"
              : "bg-white text-charcoal-lighter border-cream-darker/50 hover:border-gold/30"
          }`}
        >
          All
        </button>

        {/* Payment filter tabs */}
        <div className="flex items-center gap-1 bg-cream/60 rounded-sm border border-cream-darker/30 p-1">
          {PAYMENT_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setPaymentFilter(opt)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-[3px] transition-all ${
                paymentFilter === opt
                  ? opt === "PAID"
                    ? "bg-green-600 text-white"
                    : opt === "PENDING"
                    ? "bg-red-500 text-white"
                    : "bg-espresso text-cream"
                  : "text-charcoal-lighter hover:text-espresso"
              }`}
            >
              {opt === "All" ? "All Payment" : opt === "PAID" ? "✓ Paid" : "⏳ Pending"}
            </button>
          ))}
        </div>
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-sm border border-cream-darker/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream/50 border-b border-cream-darker/30">
                <th className="text-left py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Order</th>
                <th className="text-left py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Client</th>
                <th className="text-left py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Items</th>
                <th className="text-left py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Date</th>
                <th className="text-center py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Status</th>
                <th className="text-right py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Total</th>
                <th className="text-center py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Payment</th>
                <th className="text-center py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Actions</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12">
                  <Loader2 className="animate-spin text-gold mx-auto" size={24} />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-charcoal-lighter">No orders found</td></tr>
              ) : filtered.map(order => {
                const cfg = statusConfig[order.status] ?? statusConfig.PENDING;
                const actions = STATUS_ACTIONS[order.status] ?? [];
                const isPaid = order.payment?.status === "PAID";

                return (
                  <tr key={order.id} className="border-b border-cream-darker/10 hover:bg-cream/20 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-charcoal-lighter">
                      {order.orderRef.slice(-8).toUpperCase()}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-espresso">{order.client.name}</p>
                      {order.client.phone && (
                        <a href={`tel:${order.client.phone}`} className="flex items-center gap-1 text-xs text-charcoal-lighter hover:text-gold mt-0.5">
                          <Phone size={10} /> {order.client.phone}
                        </a>
                      )}
                    </td>
                    <td className="py-3 px-4 text-charcoal-lighter text-xs">
                      {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                      <p className="text-[11px] text-charcoal-lighter/70 truncate max-w-[120px]">
                        {order.items.map(i => i.product.name).join(", ")}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-xs text-charcoal-lighter">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded border ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-bold text-espresso">
                        ₹{Number(order.total).toLocaleString("en-IN")}
                      </span>
                      {isPaid && order.payment?.amount && (
                        <p className="text-[10px] text-green-600 mt-0.5">
                          Paid ₹{Number(order.payment.amount).toLocaleString("en-IN")}
                        </p>
                      )}
                    </td>

                    {/* Payment Badge */}
                    <td className="py-3 px-4 text-center">
                      <PaymentBadge payment={order.payment} />
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col items-center gap-1.5">
                        {/* Order status buttons */}
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          {actions.map(action => (
                            <button key={action}
                              disabled={updating === order.id}
                              onClick={() => updateStatus(order.id, action)}
                              className={`text-[10px] px-2 py-1 rounded border font-semibold transition-all disabled:opacity-50 whitespace-nowrap
                                ${action === "PROCESSING" ? "border-blue-200 text-blue-700 hover:bg-blue-50" :
                                  action === "SHIPPED" ? "border-purple-200 text-purple-700 hover:bg-purple-50" :
                                  action === "DELIVERED" ? "border-green-200 text-green-700 hover:bg-green-50" :
                                  "border-red-200 text-red-600 hover:bg-red-50"}`}
                            >
                              {updating === order.id ? "..." : statusConfig[action]?.label}
                            </button>
                          ))}
                        </div>

                        {/* Mark as Paid button — only if not yet paid and not cancelled/refunded */}
                        {!isPaid && order.status !== "CANCELLED" && order.status !== "REFUNDED" && (
                          <button
                            onClick={() => setMarkPaidTarget(order)}
                            className="text-[10px] px-2.5 py-1 rounded border font-semibold border-gold/40 text-gold bg-gold/5 hover:bg-gold/15 transition-all flex items-center gap-1 whitespace-nowrap"
                          >
                            <IndianRupee size={9} /> Mark Paid
                          </button>
                        )}
                      </div>
                    </td>

                    {/* View detail link */}
                    <td className="py-3 px-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        id={`view-order-${order.id}`}
                        className="inline-flex items-center gap-1 text-[10px] text-charcoal-lighter hover:text-gold border border-cream-darker/50 hover:border-gold/30 rounded-sm px-2 py-1 transition-all"
                      >
                        <Eye size={10} /> View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-cream/30 border-t border-cream-darker/20 text-xs text-charcoal-lighter">
          Showing {filtered.length} of {orders.length} orders
        </div>
      </div>

      {/* ── Mark as Paid Modal ── */}
      {markPaidTarget && (
        <MarkPaidModal
          order={markPaidTarget}
          onClose={() => setMarkPaidTarget(null)}
          onSuccess={() => { load(); loadCounts(); }}
        />
      )}
    </div>
  );
}
