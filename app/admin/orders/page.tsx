"use client";
import { extractApiError } from "@/lib/extract-error";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ClipboardList, CheckCircle, XCircle,
  RefreshCw, Phone, IndianRupee, CreditCard,
  Smartphone, Banknote, X, TrendingUp, Eye, RotateCcw,
  ArrowUp, ArrowDown, ChevronsUpDown, Loader2,
} from "lucide-react";
import OrdersFilterBar from "@/components/orders/FilterBar";

// ── Types ─────────────────────────────────────────────────────────────────────

type PaymentStatus = "PENDING" | "PAID" | "REFUNDED" | "FAILED" | "PENDING_VERIFICATION" | "PARTIAL";
type PaymentMethod = "UPI" | "CASH" | "CARD" | "ONLINE";

type Payment = {
  status: PaymentStatus;
  amount: string;
  method: PaymentMethod | null;
  transactionRef: string | null;
  paymentNote: string | null;
  paidAt: string | null;
};

type OrderItem = { id: string; quantity: number; product: { name: string } };

type Order = {
  id: string;
  orderRef: string;
  createdAt: string;
  status: string;
  total: string;
  subtotal: string;
  shippingAmount: string;
  client: { id: string; name: string; email: string; phone: string | null };
  items: OrderItem[];
  payment: Payment | null;
};

// ── Static config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-darker/30">
          <div>
            <h2 className="font-display text-lg text-espresso font-bold">Mark Order Paid</h2>
            <p className="text-xs text-charcoal-lighter mt-0.5">
              {order.client.name} · #{order.orderRef.slice(-6).toUpperCase()}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-cream/60 text-charcoal-lighter transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-2">Payment Method</label>
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
          <div>
            <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-2">Amount (₹)</label>
            <div className="relative">
              <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-lighter" />
              <input
                type="number" min="1" step="0.01" value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white border border-cream-darker/50 rounded-md py-2.5 pl-9 pr-4 text-sm font-medium text-espresso focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-2">
              {method === "UPI" ? "UPI Reference / UTR No." : method === "CARD" ? "Card Last 4 Digits" : "Receipt No. (optional)"}
            </label>
            <input type="text" value={ref} onChange={(e) => setRef(e.target.value)}
              placeholder={method === "UPI" ? "e.g. 123456789012" : method === "CARD" ? "e.g. 4242" : "e.g. RC-001"}
              className="w-full bg-white border border-cream-darker/50 rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-2">Note (optional)</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
              placeholder="Any additional payment notes..."
              className="w-full bg-white border border-cream-darker/50 rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 resize-none" />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md px-4 py-2.5">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-cream-darker/30 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 text-sm border border-cream-darker/50 rounded-md text-charcoal-lighter hover:border-gold/30 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 text-sm bg-espresso text-cream rounded-md font-semibold hover:bg-espresso/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
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

function PaymentBadge({ payment, ordStatus }: { payment: Payment | null; ordStatus: string }) {
  const isTerminal = ordStatus === "CANCELLED" || ordStatus === "REFUNDED";

  if (!payment) {
    if (isTerminal) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded border bg-gray-50 border-gray-200 text-gray-500 whitespace-nowrap">
          Not Charged
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border bg-red-50 border-red-200 text-red-600 whitespace-nowrap">
        <XCircle size={10} /> PENDING
      </span>
    );
  }

  if (payment.status === "PENDING") {
    if (isTerminal) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded border bg-gray-50 border-gray-200 text-gray-500 whitespace-nowrap">
          Not Charged
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border bg-red-50 border-red-200 text-red-600 whitespace-nowrap">
        <XCircle size={10} /> PENDING
      </span>
    );
  }

  if (payment.status === "REFUNDED") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border bg-amber-50 border-amber-200 text-amber-700 whitespace-nowrap">
        <RefreshCw size={10} /> REFUNDED
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

type SortField = "date" | "amount" | "client" | "status";

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<OrdersPageSkeleton />}>
      <AdminOrdersContent />
    </Suspense>
  );
}

function AdminOrdersContent() {
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState<Order[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [paymentCounts, setPaymentCounts] = useState<{ PAID: number; PENDING: number }>({ PAID: 0, PENDING: 0 });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [markPaidTarget, setMarkPaidTarget] = useState<Order | null>(null);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);

  const sortBy  = (searchParams.get("sortBy") as SortField)  ?? "date";
  const sortDir = searchParams.get("sortOrder") ?? "desc";

  useEffect(() => {
    fetch("/api/products?limit=200").then(r => r.json()).then(data => {
      setProducts((data.products ?? []).map((p: any) => ({ id: p.id, name: p.name })));
    }).catch(console.error);
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      searchParams.forEach((val, key) => {
        if (!params.has(key)) params.set(key, val);
      });
      const res = await fetch(`/api/orders?${params}`);
      const data = await res.json();
      setOrders(data.orders ?? []);
      setTotal(data.pagination?.total || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, searchParams]);

  const fetchCounts = useCallback(async () => {
    const statuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];
    const results = await Promise.all(
      statuses.map(s => fetch(`/api/orders?status=${s}&limit=1`).then(r => r.json()))
    );
    const c: Record<string, number> = {};
    statuses.forEach((s, i) => { c[s] = results[i].pagination?.total || 0; });
    setCounts(c);

    const [paidRes, pendingRes] = await Promise.all([
      fetch("/api/orders?paymentStatus=PAID&limit=1").then(r => r.json()),
      fetch("/api/orders?paymentStatus=PENDING&limit=1").then(r => r.json()),
    ]);
    setPaymentCounts({
      PAID:    paidRes.pagination?.total    ?? 0,
      PENDING: pendingRes.pagination?.total ?? 0,
    });
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  useEffect(() => { setPage(1); }, [searchParams]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      if (status === "REFUNDED") {
        await fetch(`/api/orders/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
      } else {
        await fetch("/api/orders", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status }),
        });
      }
      await fetchOrders();
      await fetchCounts();
    } catch (e) { console.error(e); }
    finally { setUpdating(null); }
  };

  const handleRefund = (order: Order) => {
    if (!confirm("Mark this order as refunded? Stock will be restored.")) return;
    updateStatus(order.id, "REFUNDED");
  };

  const paidOrders = orders.filter(o => o.payment?.status === "PAID");
  const paidRevenue = paidOrders.reduce((sum, o) => sum + Number(o.payment?.amount ?? o.total), 0);
  const pendingCount = paymentCounts.PENDING;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return <ChevronsUpDown size={11} className="ml-1 text-charcoal-lighter/40 inline" />;
    return sortDir === "asc"
      ? <ArrowUp   size={11} className="ml-1 text-gold inline" />
      : <ArrowDown size={11} className="ml-1 text-gold inline" />;
  };

  const handleSort = (field: SortField) => {
    const newDir = sortBy === field && sortDir === "desc" ? "asc" : "desc";
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", field);
    params.set("sortOrder", newDir);
    window.location.href = `?${params.toString()}`;
  };

  const thSortable = (field: SortField, label: string, align: string = "text-left") => (
    <th
      className={`${align} py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider cursor-pointer select-none hover:text-espresso transition-colors`}
      onClick={() => handleSort(field)}
    >
      <span className="inline-flex items-center">{label}<SortIcon field={field} /></span>
    </th>
  );

  const todayStr = new Date().toDateString();
  const displayOrders = loading ? [] : orders;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-xl text-espresso">All Orders</h1>
        <button onClick={() => { fetchOrders(); fetchCounts(); }}
          className="btn-outline text-xs py-2 px-4 flex items-center gap-1.5">
          <RefreshCw size={14} /> Refresh
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
            <p className="font-display text-xl font-bold text-espresso">₹{paidRevenue.toLocaleString("en-IN")}</p>
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
            <p className="font-display text-xl font-bold text-espresso">{pendingCount}</p>
          </div>
        </div>
      </div>

      {/* ── Status Count Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              if (searchParams.get("status") === key) {
                params.delete("status");
              } else {
                params.set("status", key);
              }
              params.delete("page");
              window.location.href = `?${params.toString()}`;
            }}
            className={`rounded-sm border p-3 text-center transition-all ${
              searchParams.get("status") === key
                ? `${cfg.bg} ${cfg.color} border-current`
                : "bg-white border-cream-darker/50 hover:border-gold/30"
            }`}
          >
            <p className={`font-display text-lg font-bold ${searchParams.get("status") === key ? cfg.color : "text-espresso"}`}>
              {counts[key] ?? 0}
            </p>
            <p className="text-[9px] text-charcoal-lighter uppercase tracking-wider">{cfg.label}</p>
          </button>
        ))}
      </div>

      {/* ── Filter Bar ── */}
      <Suspense fallback={<div className="h-24 bg-white rounded-sm border border-cream-darker/30 animate-pulse" />}>
        <OrdersFilterBar
          total={total}
          loading={loading}
          products={products}
          onFilterChange={() => { setPage(1); fetchOrders(); }}
        />
      </Suspense>

      {/* ── Table ── */}
      <div className="bg-white rounded-sm border border-cream-darker/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream/50 border-b border-cream-darker/30">
                {thSortable("client", "Client")}
                <th className="text-left py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Order</th>
                <th className="text-left py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Items</th>
                {thSortable("date", "Date")}
                {thSortable("status", "Status", "text-center")}
                {thSortable("amount", "Total", "text-right")}
                <th className="text-center py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Payment</th>
                <th className="text-center py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-cream-darker/10">
                    {[150,90,130,105,80,90,75,95].map((w, j) => (
                      <td key={j} className="py-3 px-4"><div className="h-3 bg-cream-darker/20 rounded animate-pulse" style={{ width: w }} /></td>
                    ))}
                  </tr>
                ))
              ) : displayOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-charcoal-lighter">No orders found</td>
                </tr>
              ) : displayOrders.map(order => {
                const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING;
                const actions = STATUS_ACTIONS[order.status] || [];
                const isPaid = order.payment?.status === "PAID";
                const orderDate = new Date(order.createdAt);
                const isToday = orderDate.toDateString() === todayStr;

                return (
                  <tr
                    key={order.id}
                    className={`border-b border-cream-darker/10 hover:bg-cream/20 transition-colors ${
                      isToday ? "bg-gold/5" : ""
                    }`}
                  >
                    {/* Client */}
                    <td className="py-3 px-4">
                      <p className="font-medium text-espresso">{order.client.name}</p>
                      {order.client.phone && (
                        <a href={`tel:${order.client.phone}`}
                          className="flex items-center gap-1 text-xs text-charcoal-lighter hover:text-gold mt-0.5">
                          <Phone size={10} /> {order.client.phone}
                        </a>
                      )}
                    </td>

                    {/* Order ref */}
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs text-charcoal-lighter">{order.orderRef.slice(-8).toUpperCase()}</span>
                      {isToday && (
                        <span className="ml-1 text-[9px] bg-gold/20 text-gold px-1 py-0.5 rounded font-semibold">TODAY</span>
                      )}
                    </td>

                    {/* Items */}
                    <td className="py-3 px-4 text-charcoal-lighter text-xs">
                      {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                      <p className="text-[11px] text-charcoal-lighter/70 truncate max-w-[120px]">
                        {order.items.map(i => i.product.name).join(", ")}
                      </p>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-xs text-charcoal-lighter">
                      <p>{orderDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                      <p>{orderDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </td>

                    {/* Total */}
                    <td className="py-3 px-4 text-right">
                      <span className="font-bold text-espresso">₹{Number(order.total).toLocaleString("en-IN")}</span>
                      {isPaid && order.payment?.amount && (
                        <p className="text-[10px] text-green-600 mt-0.5">Paid ₹{Number(order.payment.amount).toLocaleString("en-IN")}</p>
                      )}
                    </td>

                    {/* Payment Badge */}
                    <td className="py-3 px-4 text-center">
                      <PaymentBadge payment={order.payment} ordStatus={order.status} />
                      {isPaid && order.payment?.transactionRef && (
                        <p className="text-[9px] text-charcoal-lighter mt-0.5 font-mono">{order.payment.transactionRef}</p>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col items-center gap-1.5">
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
                              {updating === order.id ? "…" : STATUS_CONFIG[action]?.label}
                            </button>
                          ))}
                        </div>

                        {!isPaid && order.status !== "CANCELLED" && order.status !== "REFUNDED" && (
                          <button
                            onClick={() => setMarkPaidTarget(order)}
                            className="text-[10px] px-2.5 py-1 rounded border font-semibold border-gold/40 text-gold bg-gold/5 hover:bg-gold/15 transition-all flex items-center gap-1 whitespace-nowrap"
                          >
                            <IndianRupee size={9} /> Mark Paid
                          </button>
                        )}

                        {order.status === "DELIVERED" && (
                          <button
                            disabled={updating === order.id}
                            onClick={() => handleRefund(order)}
                            className="text-[10px] px-2.5 py-1 rounded border font-semibold border-orange-200 text-orange-600 bg-orange-50/50 hover:bg-orange-50 transition-all disabled:opacity-50 flex items-center gap-1 whitespace-nowrap"
                          >
                            <RotateCcw size={9} /> Refund
                          </button>
                        )}

                        <a
                          href={`/admin/orders/${order.id}`}
                          className="text-[10px] text-charcoal-lighter hover:text-gold border border-cream-darker/50 hover:border-gold/30 rounded-sm px-2 py-1 transition-all flex items-center gap-1"
                        >
                          <Eye size={10} /> View
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 bg-cream/30 border-t border-cream-darker/20 flex items-center justify-between">
          <p className="text-xs text-charcoal-lighter">
            Showing {displayOrders.length} of {total} orders
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="text-xs px-3 py-1.5 border border-cream-darker/50 rounded-sm disabled:opacity-40 hover:border-gold/30"
            >
              Prev
            </button>
            <button
              disabled={displayOrders.length < 20}
              onClick={() => setPage(p => p + 1)}
              className="text-xs px-3 py-1.5 border border-cream-darker/50 rounded-sm disabled:opacity-40 hover:border-gold/30"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {markPaidTarget && (
        <MarkPaidModal
          order={markPaidTarget}
          onClose={() => setMarkPaidTarget(null)}
          onSuccess={() => { fetchOrders(); fetchCounts(); }}
        />
      )}
    </div>
  );
}

function OrdersPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-espresso/80 rounded-sm p-6 h-[88px] animate-pulse opacity-60" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[1,2,3].map(i => (
          <div key={i} className="bg-white rounded-sm border border-cream-darker/50 p-5 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-cream-darker/20" />
              <div className="space-y-2">
                <div className="h-3 w-24 bg-cream-darker/20 rounded" />
                <div className="h-6 w-16 bg-cream-darker/20 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="h-24 bg-white rounded-sm border border-cream-darker/30 animate-pulse" />
    </div>
  );
}
