"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar, Clock, CheckCircle, XCircle, AlertCircle,
  Loader2, RefreshCw, IndianRupee, Phone,
  Smartphone, Banknote, CreditCard,
} from "lucide-react";
import { MarkAsPaidModal, type MarkAsPaidAppointment } from "@/components/appointments/MarkAsPaidModal";

// ── Types ─────────────────────────────────────────────────────────────────────

type PaymentStatus = "PENDING" | "PAID";
type PaymentMethod = "UPI" | "CASH" | "CARD";

type Payment = {
  status: PaymentStatus;
  amount: string;
  method: PaymentMethod | null;
};

type Appointment = {
  id: string;
  bookingRef: string;
  client: { name: string; phone: string; email: string };
  service: { name: string; duration: number; price: string };
  staff: { name: string } | null;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  totalAmount: string;
  payment: Payment | null;
};

// ── Config ────────────────────────────────────────────────────────────────────

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

const FILTERS = ["All", "PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

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

export default function OwnerAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [stats, setStats] = useState({ today: 0, pending: 0, confirmed: 0, completed: 0 });
  const [markPaidTarget, setMarkPaidTarget] = useState<MarkAsPaidAppointment | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (filter !== "All") params.set("status", filter);
      const res = await fetch(`/api/appointments?${params}`);
      const data = await res.json();
      const appts: Appointment[] = data.appointments ?? [];
      setAppointments(appts);

      const all = await fetch("/api/appointments?limit=100").then(r => r.json());
      const allAppts: Appointment[] = all.appointments ?? [];
      const today = new Date().toDateString();
      setStats({
        today:     allAppts.filter(a => new Date(a.date).toDateString() === today).length,
        pending:   allAppts.filter(a => a.status === "PENDING").length,
        confirmed: allAppts.filter(a => a.status === "CONFIRMED").length,
        completed: allAppts.filter(a => a.status === "COMPLETED").length,
      });
    } catch (e) {
      console.error("Failed to load appointments", e);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

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

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Today",     value: stats.today,     color: "text-gold" },
          { label: "Pending",   value: stats.pending,   color: "text-amber-600" },
          { label: "Confirmed", value: stats.confirmed, color: "text-blue-600" },
          { label: "Completed", value: stats.completed, color: "text-green-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-sm border border-cream-darker/50 p-5">
            <Calendar className={`${s.color} mb-2`} size={20} />
            <p className="font-display text-2xl font-bold text-espresso">{s.value}</p>
            <p className="text-xs text-charcoal-lighter">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-cream rounded-sm p-1 overflow-x-auto">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-2 text-xs font-semibold rounded-sm whitespace-nowrap transition-all ${
              filter === f ? "bg-white text-espresso shadow-sm" : "text-charcoal-lighter hover:bg-white/50"
            }`}>
            {f === "All" ? "All" : (statusConfig[f]?.label ?? f)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-sm border border-cream-darker/50 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-gold" size={28} />
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-16 text-charcoal-lighter text-sm">
            No appointments found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-cream/50 border-b border-cream-darker/30">
                  {["Ref", "Client", "Service", "Staff", "Date / Time", "Status", "Amount", "Payment", "Actions"].map(h => (
                    <th key={h} className={`py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider font-semibold ${
                      h === "Amount" ? "text-right" : h === "Actions" ? "text-center" : h === "Payment" ? "text-center" : h === "Status" ? "text-center" : "text-left"
                    }`}>
                      {h}
                    </th>
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
                      <td className="py-3 px-4 text-center">
                        <PaymentBadge payment={apt.payment} />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            {apt.status === "PENDING" && (
                              <button onClick={() => updateStatus(apt.id, "CONFIRMED")}
                                className="text-[10px] px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 transition-colors">
                                Confirm
                              </button>
                            )}
                            {apt.status === "CONFIRMED" && (
                              <button onClick={() => updateStatus(apt.id, "IN_PROGRESS")}
                                className="text-[10px] px-2 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded hover:bg-purple-100 transition-colors">
                                Start
                              </button>
                            )}
                            {apt.status === "IN_PROGRESS" && (
                              <button onClick={() => updateStatus(apt.id, "COMPLETED")}
                                className="text-[10px] px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 transition-colors">
                                Complete
                              </button>
                            )}
                            {["PENDING", "CONFIRMED"].includes(apt.status) && (
                              <button onClick={() => updateStatus(apt.id, "CANCELLED")}
                                className="text-[10px] px-2 py-1 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 transition-colors">
                                Cancel
                              </button>
                            )}
                          </div>
                          {/* Mark as Paid */}
                          {!isPaid && apt.status !== "CANCELLED" && apt.status !== "NO_SHOW" && (
                            <button
                              onClick={() => setMarkPaidTarget({
                                id:          apt.id,
                                clientName:  apt.client?.name ?? "Client",
                                serviceName: apt.service?.name ?? "Service",
                                totalAmount: Number(apt.totalAmount),
                              })}
                              className="text-[10px] px-2.5 py-1 rounded border font-semibold border-gold/40 text-gold bg-gold/5 hover:bg-gold/15 transition-all flex items-center gap-1 whitespace-nowrap"
                            >
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
        <div className="px-4 py-3 bg-cream/30 border-t border-cream-darker/20 text-xs text-charcoal-lighter">
          {appointments.length} appointment{appointments.length !== 1 ? "s" : ""} shown
        </div>
      </div>

      {/* Mark as Paid Modal */}
      {markPaidTarget && (
        <MarkAsPaidModal
          appointment={markPaidTarget}
          onClose={() => setMarkPaidTarget(null)}
          onSuccess={load}
        />
      )}
    </div>
  );
}
