"use client";
import { extractApiError } from "@/lib/extract-error";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Clock, Package, Truck, CheckCircle, XCircle,
  Loader2, RefreshCw, IndianRupee, CreditCard,
  Smartphone, Banknote, X, Phone, Search, ChevronLeft, ChevronRight,
} from "lucide-react";

type PaymentStatus = "PENDING" | "PAID";
type PaymentMethod = "UPI" | "CASH" | "CARD";

type Payment = { status: PaymentStatus; amount: string; method: PaymentMethod | null; paidAt: string | null };

type OrderItem = { id: string; quantity: number; unitPrice: string; product: { name: string } };

type Order = {
  id: string; orderRef: string; createdAt: string; status: string; total: string; subtotal: string; shippingAmount: string | null;
  items: OrderItem[];
  client: { name: string; phone: string | null; email: string };
  payment: Payment | null;
};

const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string; next: string | null; nextLabel: string | null }> = {
  PENDING:    { color: "text-amber-700",  bg: "bg-amber-50 border-amber-200",  icon: <Clock size={11} />,       label: "Pending",    next: "PROCESSING", nextLabel: "Process" },
  PROCESSING: { color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",    icon: <Package size={11} />,     label: "Processing", next: "SHIPPED",    nextLabel: "Ship" },
  SHIPPED:    { color: "text-purple-700", bg: "bg-purple-50 border-purple-200",icon: <Truck size={11} />,       label: "Shipped",    next: "DELIVERED",  nextLabel: "Deliver" },
  DELIVERED:  { color: "text-green-700",  bg: "bg-green-50 border-green-200",  icon: <CheckCircle size={11} />, label: "Delivered",  next: null,         nextLabel: null },
  CANCELLED:  { color: "text-red-600",    bg: "bg-red-50 border-red-200",      icon: <XCircle size={11} />,     label: "Cancelled",  next: null,         nextLabel: null },
  REFUNDED:   { color: "text-gray-600",   bg: "bg-gray-50 border-gray-200",    icon: <XCircle size={11} />,     label: "Refunded",   next: null,         nextLabel: null },
};

const METHOD_ICONS: Record<PaymentMethod, React.ReactNode> = { UPI: <Smartphone size={12} />, CASH: <Banknote size={12} />, CARD: <CreditCard size={12} /> };
const FILTERS = ["All", "PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
const PAGE_SIZE = 20;

function MarkPaidModal({ order, onClose, onSuccess }: { order: Order; onClose: () => void; onSuccess: () => void }) {
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
    if (isNaN(parsedAmount) || parsedAmount <= 0) { setError("Please enter a valid amount."); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/orders/mark-paid", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, paymentMethod: method, paymentAmount: parsedAmount, transactionRef: ref.trim() || undefined, paymentNote: note.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(extractApiError(data, "Failed to mark as paid.")); return; }
      onSuccess(); onClose();
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-darker/30">
          <div>
            <h2 className="font-display text-lg text-espresso font-bold">Mark Order Paid</h2>
            <p className="text-xs text-charcoal-lighter mt-0.5">{order.client.name} · #{order.orderRef.slice(-6).toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-cream/60 text-charcoal-lighter transition-colors"><X size={16} /></button>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-2">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {(["CASH", "UPI", "CARD"] as PaymentMethod[]).map((m) => (
                <button key={m} onClick={() => setMethod(m)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-md border-2 text-xs font-semibold transition-all ${
                    method === m ? "border-gold bg-gold/10 text-espresso" : "border-cream-darker/50 text-charcoal-lighter hover:border-gold/30"
                  }`}>
                  <span className={method === m ? "text-gold" : ""}>{METHOD_ICONS[m]}</span>{m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-2">Amount (₹)</label>
            <div className="relative">
              <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-lighter" />
              <input type="number" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white border border-cream-darker/50 rounded-md py-2.5 pl-9 pr-4 text-sm font-medium text-espresso focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20" />
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
          {error && <div className="bg-red-50 border border-red-200 rounded-md px-4 py-2.5"><p className="text-sm text-red-600">{error}</p></div>}
        </div>
        <div className="px-6 py-4 border-t border-cream-darker/30 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm border border-cream-darker/50 rounded-md text-charcoal-lighter hover:border-gold/30 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 text-sm bg-espresso text-cream rounded-md font-semibold hover:bg-espresso/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {loading ? (<><span className="inline-block w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin" /> Saving...</>) : (<><CheckCircle size={15} /> Confirm Payment</>)}
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentBadge({ payment }: { payment: Payment | null }) {
  if (!payment || payment.status === "PENDING") {
    return <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border bg-red-50 border-red-200 text-red-600 whitespace-nowrap"><XCircle size={10} /> PENDING</span>;
  }
  return (
    <div className="space-y-0.5">
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border bg-green-50 border-green-200 text-green-700 whitespace-nowrap"><CheckCircle size={10} /> PAID</span>
      {payment.method && <div className="flex items-center gap-1 text-[10px] text-charcoal-lighter">{METHOD_ICONS[payment.method]} {payment.method}</div>}
    </div>
  );
}

export default function OwnerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [updating, setUpdating] = useState<string | null>(null);
  const [markPaidTarget, setMarkPaidTarget] = useState<Order | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (filter !== "All") params.set("status", filter);
      if (search.trim()) params.set("search", search.trim());

      const [ordersRes, statsRes] = await Promise.all([
        fetch(`/api/orders?${params}`),
        fetch("/api/orders/stats"),
      ]);

      const ordersData = await ordersRes.json();
      const statsData = await statsRes.json();

      setOrders(ordersData.orders ?? []);
      setTotal(ordersData.total ?? 0);
      setCounts(statsData.counts ?? {});
    } catch (e) { console.error("Failed to load orders", e); }
    finally { setLoading(false); }
  }, [filter, search, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await fetch("/api/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
      load();
    } catch (e) { console.error("Failed to update order", e); }
    finally { setUpdating(null); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl text-espresso">Order Management</h1>
        <button onClick={load} className="flex items-center gap-1.5 text-xs text-charcoal-lighter hover:text-gold transition-colors"><RefreshCw size={13} /> Refresh</button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { key: "ALL", label: "All", color: "text-charcoal" },
          { key: "PENDING", label: "Pending", color: "text-amber-600" },
          { key: "PROCESSING", label: "Processing", color: "text-blue-600" },
          { key: "SHIPPED", label: "Shipped", color: "text-purple-600" },
          { key: "DELIVERED", label: "Delivered", color: "text-green-600" },
          { key: "CANCELLED", label: "Cancelled", color: "text-red-600" },
        ].map(s => {
          const cnt = s.key === "ALL" ? Object.values(counts).reduce((a, b) => a + b, 0) : (counts[s.key] ?? 0);
          return (
            <button key={s.key} onClick={() => { setFilter(s.key); setPage(1); }}
              className={`bg-white rounded-sm border p-3 text-center hover:border-gold/30 transition-all ${filter === s.key ? "border-gold shadow-sm" : "border-cream-darker/30"}`}>
              <p className={`font-display text-xl font-bold ${s.color}`}>{cnt}</p>
              <p className="text-[10px] text-charcoal-lighter mt-0.5">{s.label}</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-lighter" />
        <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          onKeyDown={e => e.key === "Enter" && setPage(1)}
          placeholder="Search by order ref, client name or email..."
          className="w-full bg-white border border-cream-darker/50 rounded-sm py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-gold/40" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-sm border border-cream-darker/50 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gold" size={28} /></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-charcoal-lighter text-sm">No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-cream/50 border-b border-cream-darker/30">
                  {["Order", "Client", "Items", "Date", "Status", "Total", "Payment", "Action"].map(h => (
                    <th key={h} className={`py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider font-semibold ${
                      h === "Total" || h === "Action" ? "text-right" : h === "Status" || h === "Payment" ? "text-center" : "text-left"
                    }`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(order => {
                  const cfg = statusConfig[order.status] ?? statusConfig.PENDING;
                  const isPaid = order.payment?.status === "PAID";
                  return (
                    <tr key={order.id} className="border-b border-cream-darker/10 hover:bg-cream/20 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-charcoal-lighter">{order.orderRef.slice(-8).toUpperCase()}</td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-espresso">{order.client.name}</p>
                        {order.client.phone && (
                          <a href={`tel:${order.client.phone}`} className="flex items-center gap-1 text-xs text-charcoal-lighter hover:text-gold mt-0.5"><Phone size={10} /> {order.client.phone}</a>
                        )}
                      </td>
                      <td className="py-3 px-4 text-charcoal-lighter text-xs">
                        {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                        <p className="text-[10px] truncate max-w-[120px]">{order.items[0]?.product.name}</p>
                      </td>
                      <td className="py-3 px-4 text-charcoal-lighter text-xs">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border ${cfg.bg} ${cfg.color}`}>{cfg.icon} {cfg.label}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-espresso">₹{Number(order.total).toLocaleString("en-IN")}</span>
                        {order.shippingAmount && Number(order.shippingAmount) > 0 && (
                          <p className="text-[10px] text-charcoal-lighter mt-0.5">+₹{Number(order.shippingAmount).toLocaleString("en-IN")} shipping</p>
                        )}
                        {isPaid && order.payment?.amount && (
                          <p className="text-[10px] text-green-600 mt-0.5">Paid ₹{Number(order.payment.amount).toLocaleString("en-IN")}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center"><PaymentBadge payment={order.payment} /></td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1">
                            {cfg.next && (
                              <button onClick={() => updateStatus(order.id, cfg.next!)} disabled={updating === order.id}
                                className="text-[10px] btn-gold py-1 px-2.5 disabled:opacity-50">
                                {updating === order.id ? <Loader2 size={10} className="animate-spin inline" /> : cfg.nextLabel}
                              </button>
                            )}
                            {order.status === "PROCESSING" && (
                              <button onClick={() => updateStatus(order.id, "CANCELLED")} disabled={updating === order.id}
                                className="text-[10px] ml-1 px-2 py-1 text-red-500 hover:bg-red-50 rounded transition-colors">Cancel</button>
                            )}
                          </div>
                          {!isPaid && order.status !== "CANCELLED" && order.status !== "REFUNDED" && (
                            <button onClick={() => setMarkPaidTarget(order)}
                              className="text-[10px] px-2.5 py-1 rounded border font-semibold border-gold/40 text-gold bg-gold/5 hover:bg-gold/15 transition-all flex items-center gap-1 whitespace-nowrap">
                              <IndianRupee size={9} /> Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="px-4 py-3 bg-cream/30 border-t border-cream-darker/20 flex items-center justify-between">
            <p className="text-xs text-charcoal-lighter">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}</p>
            <div className="flex items-center gap-1">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded border border-cream-darker/30 text-charcoal-lighter hover:border-gold/40 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft size={14} /></button>
              <span className="text-xs px-2">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded border border-cream-darker/30 text-charcoal-lighter hover:border-gold/40 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {markPaidTarget && <MarkPaidModal order={markPaidTarget} onClose={() => setMarkPaidTarget(null)} onSuccess={load} />}
    </div>
  );
}