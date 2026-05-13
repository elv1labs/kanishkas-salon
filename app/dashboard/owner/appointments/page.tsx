"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar, Clock, CheckCircle, XCircle, AlertCircle,
  Loader2, RefreshCw, IndianRupee, Phone, Search,
  Smartphone, Banknote, CreditCard, ChevronLeft, ChevronRight,
} from "lucide-react";
import { MarkAsPaidModal, type MarkAsPaidAppointment } from "@/components/appointments/MarkAsPaidModal";

type PaymentStatus = "PENDING" | "PAID";
type PaymentMethod = "UPI" | "CASH" | "CARD";

type Payment = { status: PaymentStatus; amount: string; method: PaymentMethod | null };

type Appointment = {
  id: string; bookingRef: string;
  client: { name: string; phone: string; email: string };
  service: { name: string; duration: number; price: string };
  staff: { name: string } | null;
  date: string; startTime: string; endTime: string;
  status: string; totalAmount: string; payment: Payment | null;
};

const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  PENDING:     { color: "text-amber-700",  bg: "bg-amber-50 border-amber-200",   icon: <AlertCircle size={11} />, label: "Pending" },
  CONFIRMED:   { color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",     icon: <CheckCircle size={11} />, label: "Confirmed" },
  IN_PROGRESS: { color: "text-purple-700", bg: "bg-purple-50 border-purple-200", icon: <Clock size={11} />,       label: "In Progress" },
  COMPLETED:   { color: "text-green-700",  bg: "bg-green-50 border-green-200",   icon: <CheckCircle size={11} />, label: "Completed" },
  CANCELLED:   { color: "text-red-600",    bg: "bg-red-50 border-red-200",       icon: <XCircle size={11} />,     label: "Cancelled" },
  NO_SHOW:     { color: "text-gray-600",   bg: "bg-gray-50 border-gray-200",     icon: <XCircle size={11} />,     label: "No Show" },
};

const METHOD_ICONS: Record<PaymentMethod, React.ReactNode> = {
  UPI:  <Smartphone size={12} />,
  CASH: <Banknote   size={12} />,
  CARD: <CreditCard size={12} />,
};

const FILTERS = ["All", "PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"];

const PAGE_SIZE = 20;

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

export default function OwnerAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [markPaidTarget, setMarkPaidTarget] = useState<MarkAsPaidAppointment | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (filter !== "All") params.set("status", filter);
      if (search.trim()) params.set("search", search.trim());

      const [apptsRes, statsRes] = await Promise.all([
        fetch(`/api/appointments?${params}`),
        fetch("/api/appointments/stats"),
      ]);

      const apptsData = await apptsRes.json();
      const statsData = await statsRes.json();

      setAppointments(apptsData.appointments ?? []);
      setTotal(apptsData.total ?? 0);
      setCounts(statsData.counts ?? {});
    } catch (e) {
      console.error("Failed to load appointments", e);
    } finally {
      setLoading(false);
    }
  }, [filter, search, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      load();
    } catch (e) {
      console.error("Failed to update status", e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl text-espresso">Appointments Overview</h1>
        <button onClick={load} className="flex items-center gap-1.5 text-xs text-charcoal-lighter hover:text-gold transition-colors">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { key: "ALL",     label: "All",     color: "text-charcoal" },
          { key: "PENDING", label: "Pending", color: "text-amber-600" },
          { key: "CONFIRMED", label: "Confirmed", color: "text-blue-600" },
          { key: "IN_PROGRESS", label: "In Progress", color: "text-purple-600" },
          { key: "COMPLETED", label: "Completed", color: "text-green-600" },
          { key: "CANCELLED", label: "Cancelled", color: "text-red-600" },
        ].map(s => {
          const cnt = s.key === "ALL" ? Object.values(counts).reduce((a, b) => a + b, 0) : (counts[s.key] ?? 0);
          return (
            <button key={s.key} onClick={() => { setFilter(s.key); setPage(1); }}
              className={`bg-white rounded-sm border p-3 text-center hover:border-gold/30 transition-all ${
                filter === s.key ? "border-gold shadow-sm" : "border-cream-darker/30"
              }`}>
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
          placeholder="Search by client name, phone or booking ref..."
          className="w-full bg-white border border-cream-darker/50 rounded-sm py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-gold/40" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-sm border border-cream-darker/50 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-gold" size={28} />
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-16 text-charcoal-lighter text-sm">No appointments found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-cream/50 border-b border-cream-darker/30">
                  {["Ref", "Client", "Service", "Staff", "Date / Time", "Status", "Amount", "Payment", "Actions"].map(h => (
                    <th key={h} className={`py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider font-semibold ${
                      h === "Amount" || h === "Payment" || h === "Status" || h === "Actions" ? "text-center" : "text-left"
                    }`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {appointments.map(apt => {
                  const cfg = statusConfig[apt.status] ?? statusConfig.PENDING;
                  const isPaid = apt.payment?.status === "PAID";
                  return (
                    <tr key={apt.id} className="border-b border-cream-darker/10 hover:bg-cream/20 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-charcoal-lighter">{apt.bookingRef.slice(-8).toUpperCase()}</td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-espresso">{apt.client?.name}</p>
                        {apt.client?.phone && (
                          <a href={`tel:${apt.client.phone}`} className="flex items-center gap-1 text-xs text-charcoal-lighter hover:text-gold mt-0.5">
                            <Phone size={10} /> {apt.client.phone}
                          </a>
                        )}
                      </td>
                      <td className="py-3 px-4 text-charcoal-lighter text-xs">{apt.service?.name}</td>
                      <td className="py-3 px-4 text-charcoal-lighter text-xs">{apt.staff?.name ?? "—"}</td>
                      <td className="py-3 px-4 text-charcoal-lighter text-xs">
                        {new Date(apt.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {apt.startTime}–{apt.endTime}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border ${cfg.bg} ${cfg.color}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-espresso">₹{Number(apt.totalAmount).toLocaleString("en-IN")}</span>
                        {isPaid && apt.payment?.amount && (
                          <p className="text-[10px] text-green-600 mt-0.5">Paid ₹{Number(apt.payment.amount).toLocaleString("en-IN")}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center"><PaymentBadge payment={apt.payment} /></td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            {apt.status === "PENDING" && (
                              <button onClick={() => updateStatus(apt.id, "CONFIRMED")}
                                className="text-[10px] px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 transition-colors">Confirm</button>
                            )}
                            {apt.status === "CONFIRMED" && (
                              <button onClick={() => updateStatus(apt.id, "IN_PROGRESS")}
                                className="text-[10px] px-2 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded hover:bg-purple-100 transition-colors">Start</button>
                            )}
                            {apt.status === "IN_PROGRESS" && (
                              <button onClick={() => updateStatus(apt.id, "COMPLETED")}
                                className="text-[10px] px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 transition-colors">Complete</button>
                            )}
                            {["PENDING", "CONFIRMED"].includes(apt.status) && (
                              <button onClick={() => updateStatus(apt.id, "CANCELLED")}
                                className="text-[10px] px-2 py-1 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 transition-colors">Cancel</button>
                            )}
                          </div>
                          {!isPaid && apt.status !== "CANCELLED" && apt.status !== "NO_SHOW" && (
                            <button onClick={() => setMarkPaidTarget({
                              id: apt.id, clientName: apt.client?.name ?? "Client",
                              serviceName: apt.service?.name ?? "Service", totalAmount: Number(apt.totalAmount),
                            })}
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
            <p className="text-xs text-charcoal-lighter">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded border border-cream-darker/30 text-charcoal-lighter hover:border-gold/40 disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs px-2">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded border border-cream-darker/30 text-charcoal-lighter hover:border-gold/40 disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {markPaidTarget && (
        <MarkAsPaidModal appointment={markPaidTarget} onClose={() => setMarkPaidTarget(null)} onSuccess={load} />
      )}
    </div>
  );
}