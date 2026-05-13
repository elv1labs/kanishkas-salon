"use client";
import { extractApiError } from "@/lib/extract-error";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Calendar, Clock, CheckCircle, XCircle, AlertCircle,
  RefreshCw, Phone, IndianRupee, CreditCard,
  Smartphone, Banknote, X, TrendingUp,
  CalendarClock, UserRoundCog, Loader2, ArrowUp, ArrowDown, ChevronsUpDown,
} from "lucide-react";
import AppointmentsFilterBar from "@/components/appointments/FilterBar";

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

type Appointment = {
  id: string;
  bookingRef: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  totalAmount: string;
  notes: string | null;
  client: { id: string; name: string; email: string; phone: string | null };
  staff: { id: string; name: string } | null;
  service: { id: string; name: string; duration: number; price: string };
  payment: Payment | null;
};

// ── Static config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  PENDING:     { color: "text-amber-700",  bg: "bg-amber-50 border-amber-200",   label: "Pending" },
  CONFIRMED:   { color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",     label: "Confirmed" },
  IN_PROGRESS: { color: "text-purple-700", bg: "bg-purple-50 border-purple-200", label: "In Progress" },
  COMPLETED:   { color: "text-green-700",  bg: "bg-green-50 border-green-200",   label: "Completed" },
  CANCELLED:   { color: "text-red-600",    bg: "bg-red-50 border-red-200",       label: "Cancelled" },
  NO_SHOW:     { color: "text-gray-600",   bg: "bg-gray-50 border-gray-200",     label: "No Show" },
};

const STATUS_ACTIONS: Record<string, string[]> = {
  PENDING:     ["CONFIRMED", "CANCELLED"],
  CONFIRMED:   ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "NO_SHOW"],
  COMPLETED:   [],
  CANCELLED:   [],
  NO_SHOW:     [],
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
  appointment,
  onClose,
  onSuccess,
}: {
  appointment: Appointment;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [amount, setAmount] = useState(String(Number(appointment.totalAmount)));
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
      const res = await fetch("/api/appointments/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: appointment.id,
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-darker/30">
          <div>
            <h2 className="font-display text-lg text-espresso font-bold">Mark as Paid</h2>
            <p className="text-xs text-charcoal-lighter mt-0.5">
              {appointment.client.name} · {appointment.service.name}
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
// payment is the Payment | null from the DB.
// aptStatus is the AppointmentStatus string — used to suppress misleading PENDING badges.

function PaymentBadge({ payment, aptStatus }: { payment: Payment | null; aptStatus: string }) {
  const isTerminal = aptStatus === "CANCELLED" || aptStatus === "NO_SHOW";

  if (!payment) {
    // No payment record — differentiate terminal vs active appointments
    if (isTerminal) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded border bg-gray-50 border-gray-200 text-gray-500 whitespace-nowrap">
          Not Charged
        </span>
      );
    }
    // Active appointment with no payment — show PENDING (action still available)
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border bg-red-50 border-red-200 text-red-600 whitespace-nowrap">
        <XCircle size={10} /> PENDING
      </span>
    );
  }

  if (payment.status === "PENDING") {
    // Payment record exists but not yet settled — terminal appointments should not show misleading PENDING
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

  // PAID (or any other settled status)
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

// ── Reschedule Modal ──────────────────────────────────────────────────────────

function RescheduleModal({
  appointment, onClose, onSuccess,
}: {
  appointment: Appointment;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [date, setDate] = useState(appointment.date.slice(0, 10));
  const [time, setTime] = useState(appointment.startTime);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = async () => {
    if (!date || !time) { setError("Date and time are required."); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, startTime: time }),
      });
      const data = await res.json();
      if (!res.ok) { setError(extractApiError(data, "Failed to reschedule.")); return; }
      onSuccess();
      onClose();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-darker/30">
          <div>
            <h2 className="font-display text-lg text-espresso font-bold">Reschedule</h2>
            <p className="text-xs text-charcoal-lighter mt-0.5">
              {appointment.client.name} · {appointment.service.name}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-cream/60 text-charcoal-lighter transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-2">New Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className="w-full bg-white border border-cream-darker/50 rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-2">New Time</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
              className="w-full bg-white border border-cream-darker/50 rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20" />
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
            {loading ? (<><Loader2 size={14} className="animate-spin" /> Saving...</>) : (<><CalendarClock size={14} /> Reschedule</>)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Staff Reassign Dropdown ───────────────────────────────────────────────────

function StaffReassignDropdown({
  appointment, onSuccess,
}: {
  appointment: Appointment;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [staffList, setStaffList] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = async () => {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (staffList.length === 0) {
      try {
        const res = await fetch("/api/staff");
        const data = await res.json();
        const list = (data.staff ?? []).filter((s: any) => s.isActive !== false)
          .map((s: any) => ({ id: s.id, name: s.name }));
        setStaffList(list);
      } catch { /* ignore */ }
    }
  };

  const handleSelect = async (staffId: string) => {
    setLoading(true);
    setOpen(false);
    try {
      await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId }),
      });
      onSuccess();
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div ref={dropRef} className="relative inline-block">
      <button onClick={handleOpen} disabled={loading}
        className="text-[10px] px-2 py-1 rounded border font-semibold border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-all disabled:opacity-50 whitespace-nowrap flex items-center gap-1">
        {loading ? "…" : <><UserRoundCog size={9} /> Reassign</>}
      </button>
      {open && (
        <div className="absolute z-30 right-0 mt-1 w-44 bg-white border border-cream-darker/50 rounded-md shadow-lg py-1 max-h-48 overflow-y-auto">
          {staffList.length === 0 ? (
            <p className="text-xs text-charcoal-lighter px-3 py-2">Loading...</p>
          ) : staffList.map((s) => (
            <button key={s.id} onClick={() => handleSelect(s.id)}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-cream/40 transition-colors ${
                appointment.staff?.id === s.id ? "font-bold text-gold" : "text-espresso"
              }`}>
              {s.name} {appointment.staff?.id === s.id && "✓"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type SortField = "date" | "amount" | "client" | "status";

export default function AdminAppointmentsPage() {
  return (
    <Suspense fallback={<AppointmentsPageSkeleton />}>
      <AdminAppointmentsContent />
    </Suspense>
  );
}

function AdminAppointmentsContent() {
  const searchParams = useSearchParams();

  const [appointments,   setAppointments]   = useState<Appointment[]>([]);
  const [counts,         setCounts]         = useState<Record<string, number>>({});
  const [paymentCounts,  setPaymentCounts]  = useState<{ PAID: number; PENDING: number }>({ PAID: 0, PENDING: 0 });
  const [loading,        setLoading]        = useState(true);
  const [statusFilter,   setStatusFilter]  = useState("All");
  const [updating,       setUpdating]      = useState<string | null>(null);
  const [page,           setPage]          = useState(1);
  const [total,          setTotal]         = useState(0);
  const [markPaidTarget, setMarkPaidTarget] = useState<Appointment | null>(null);
  const [rescheduleTarget,setRescheduleTarget] = useState<Appointment | null>(null);
  const [services,       setServices]      = useState<{ id: string; name: string }[]>([]);
  const [staff,          setStaff]          = useState<{ id: string; name: string }[]>([]);

  const sortBy  = (searchParams.get("sortBy") as SortField)  ?? "date";
  const sortDir = searchParams.get("sortOrder") ?? "desc";

  // Load services + staff once
  useEffect(() => {
    Promise.all([
      fetch("/api/services?limit=200").then(r => r.json()),
      fetch("/api/staff?limit=100").then(r  => r.json()),
    ]).then(([svcData, staffData]) => {
      setServices((svcData.services ?? []).map((s: any) => ({ id: s.id, name: s.name })));
      setStaff((staffData.staff   ?? []).map((s: any) => ({ id: s.id, name: s.name })));
    }).catch(console.error);
  }, []);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      // Forward all URL search params to the API (server-side filtering)
      searchParams.forEach((val, key) => {
        if (!params.has(key)) params.set(key, val);
      });
      if (statusFilter !== "All" && !params.has("status")) params.set("status", statusFilter);
      const res = await fetch(`/api/appointments?${params}`);
      const data = await res.json();
      setAppointments(data.appointments || []);
      setTotal(data.pagination?.total || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, statusFilter, searchParams]);

  const fetchCounts = useCallback(async () => {
    const statuses = ["PENDING","CONFIRMED","IN_PROGRESS","COMPLETED","CANCELLED","NO_SHOW"];
    const results = await Promise.all(
      statuses.map((s) => fetch(`/api/appointments?status=${s}&limit=1`).then((r) => r.json()))
    );
    const c: Record<string, number> = {};
    statuses.forEach((s, i) => { c[s] = results[i].pagination?.total || 0; });
    setCounts(c);

    const [paidRes, pendingRes] = await Promise.all([
      fetch("/api/appointments?paymentStatus=PAID&status=COMPLETED&limit=1").then((r) => r.json()),
      fetch("/api/appointments?paymentStatus=PENDING&limit=1&status=CONFIRMED,IN_PROGRESS,PENDING").then((r) => r.json()),
    ]);
    setPaymentCounts({
      PAID:    paidRes.pagination?.total    ?? 0,
      PENDING: pendingRes.pagination?.total ?? 0,
    });
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);
  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  // Reset page 1 on status filter change
  useEffect(() => { setPage(1); }, [statusFilter]);

  // ── Status update ───────────────────────────────────────────────────────────
  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await fetch("/api/appointments", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id, status }),
      });
      await fetchAppointments();
      await fetchCounts();
    } catch (e) { console.error(e); }
    finally { setUpdating(null); }
  };

  // ── Revenue summary ────────────────────────────────────────────────────────
  const todayStr     = new Date().toDateString();
  const todayPaid    = appointments.filter(a => new Date(a.date).toDateString() === todayStr && a.payment?.status === "PAID");
  const todayRevenue = todayPaid.reduce((sum, a) => sum + Number(a.payment?.amount ?? 0), 0);
  const pendingCount = paymentCounts.PENDING;

  // ── Sort helper for column headers ──────────────────────────────────────────
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return <ChevronsUpDown size={11} className="ml-1 text-charcoal-lighter/40 inline" />;
    return sortDir === "asc"
      ? <ArrowUp   size={11} className="ml-1 text-gold inline" />
      : <ArrowDown size={11} className="ml-1 text-gold inline" />;
  };

  const handleSort = (field: SortField) => {
    const newDir = sortBy === field && sortDir === "desc" ? "asc" : "desc";
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy",    field);
    params.set("sortOrder", newDir);
    window.location.href = `?${params.toString()}`;
  };

  const thSortable = (field: SortField, label: string, align: string = "text-left") => (
    <th
      className={`${align} py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider cursor-pointer select-none hover:text-espresso transition-colors`}
      onClick={() => handleSort(field)}
    >
      <span className="inline-flex items-center">
        {label}<SortIcon field={field} />
      </span>
    </th>
  );

  const displayAppts = loading
    ? []
    : appointments;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-xl text-espresso">All Appointments</h1>
        <button
          onClick={() => { fetchAppointments(); fetchCounts(); }}
          className="btn-outline text-xs py-2 px-4 flex items-center gap-1.5"
        >
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
            <p className="text-xs text-charcoal-lighter uppercase tracking-wider">Today's Revenue</p>
            <p className="font-display text-xl font-bold text-espresso">
              ₹{todayRevenue.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-sm border border-cream-darker/50 px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
            <CheckCircle size={18} className="text-green-600" />
          </div>
          <div>
            <p className="text-xs text-charcoal-lighter uppercase tracking-wider">Paid Today</p>
            <p className="font-display text-xl font-bold text-espresso">{todayPaid.length}</p>
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

      {/* ── Appointment Status Count Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => { setStatusFilter(key); setPage(1); }}
            className={`rounded-sm border p-3 text-center transition-all ${
              statusFilter === key
                ? cfg.bg + " " + cfg.color + " border-current"
                : "bg-white border-cream-darker/50 hover:border-gold/30"
            }`}
          >
            <p className={`font-display text-lg font-bold ${statusFilter === key ? cfg.color : "text-espresso"}`}>
              {counts[key] ?? 0}
            </p>
            <p className="text-[9px] text-charcoal-lighter uppercase tracking-wider">{cfg.label}</p>
          </button>
        ))}
      </div>

      {/* ── Filter Bar ── */}
      <Suspense fallback={<div className="h-24 bg-white rounded-sm border border-cream-darker/30 animate-pulse" />}>
        <AppointmentsFilterBar
          total={total}
          loading={loading}
          services={services}
          staff={staff}
          onFilterChange={() => { setPage(1); fetchAppointments(); }}
        />
      </Suspense>

      {/* ── Table ── */}
      <div className="bg-white rounded-sm border border-cream-darker/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream/50 border-b border-cream-darker/30">
                <th className="text-left py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Ref</th>
                {thSortable("client", "Client")}
                <th className="text-left py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Service</th>
                <th className="text-left py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Staff</th>
                {thSortable("date", "Schedule")}
                {thSortable("status", "Status", "text-center")}
                {thSortable("amount", "Amount", "text-right")}
                <th className="text-center py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Payment</th>
                <th className="text-center py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-cream-darker/10">
                    {[90,150,130,90,105,80,90,75,95].map((w, j) => (
                      <td key={j} className="py-3 px-4"><div className="h-3 bg-cream-darker/20 rounded animate-pulse" style={{ width: w }} /></td>
                    ))}
                  </tr>
                ))
              ) : displayAppts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-charcoal-lighter">
                    No appointments found
                  </td>
                </tr>
              ) : displayAppts.map((apt) => {
                const cfg = STATUS_CONFIG[apt.status] ?? STATUS_CONFIG.PENDING;
                const aptDate = new Date(apt.date);
                const isToday = aptDate.toDateString() === todayStr;
                const actions = STATUS_ACTIONS[apt.status] || [];
                const isPaid = apt.payment?.status === "PAID";

                return (
                  <tr
                    key={apt.id}
                    className={`border-b border-cream-darker/10 hover:bg-cream/20 transition-colors ${
                      isToday ? "bg-gold/5" : ""
                    }`}
                  >
                    {/* Ref */}
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs text-charcoal-lighter">{apt.bookingRef.slice(-8).toUpperCase()}</span>
                      {isToday && (
                        <span className="ml-1 text-[9px] bg-gold/20 text-gold px-1 py-0.5 rounded font-semibold">TODAY</span>
                      )}
                    </td>

                    {/* Client */}
                    <td className="py-3 px-4">
                      <p className="font-medium text-espresso">{apt.client.name}</p>
                      {apt.client.phone && (
                        <a
                          href={`tel:${apt.client.phone}`}
                          className="flex items-center gap-1 text-xs text-charcoal-lighter hover:text-gold mt-0.5"
                        >
                          <Phone size={10} /> {apt.client.phone}
                        </a>
                      )}
                    </td>

                    {/* Service */}
                    <td className="py-3 px-4">
                      <p className="text-charcoal">{apt.service.name}</p>
                      <p className="text-xs text-charcoal-lighter">{apt.service.duration} min</p>
                    </td>

                    {/* Staff */}
                    <td className="py-3 px-4 text-charcoal-lighter text-sm">
                      {apt.staff?.name ?? <span className="text-xs italic">Unassigned</span>}
                    </td>

                    {/* Schedule */}
                    <td className="py-3 px-4 text-xs text-charcoal-lighter">
                      <p>{aptDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                      <p>{apt.startTime} – {apt.endTime}</p>
                    </td>

                    {/* Appointment Status */}
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 text-right">
                      <span className="font-bold text-espresso">
                        ₹{Number(apt.totalAmount).toLocaleString("en-IN")}
                      </span>
                      {isPaid && apt.payment?.amount && (
                        <p className="text-[10px] text-green-600 mt-0.5">
                          Paid ₹{Number(apt.payment.amount).toLocaleString("en-IN")}
                        </p>
                      )}
                    </td>

                    {/* Payment Badge */}
                    <td className="py-3 px-4 text-center">
                      <PaymentBadge payment={apt.payment} aptStatus={apt.status} />
                      {isPaid && apt.payment?.transactionRef && (
                        <p className="text-[9px] text-charcoal-lighter mt-0.5 font-mono">
                          {apt.payment.transactionRef}
                        </p>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col items-center gap-1.5">
                        {/* Appointment status buttons */}
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          {actions.map((action) => (
                            <button
                              key={action}
                              disabled={updating === apt.id}
                              onClick={() => updateStatus(apt.id, action)}
                              className={`text-[10px] px-2 py-1 rounded border font-semibold transition-all disabled:opacity-50 whitespace-nowrap
                                ${action === "CONFIRMED"   ? "border-blue-200 text-blue-700 hover:bg-blue-50" :
                                  action === "COMPLETED"   ? "border-green-200 text-green-700 hover:bg-green-50" :
                                  action === "IN_PROGRESS" ? "border-purple-200 text-purple-700 hover:bg-purple-50" :
                                  action === "CANCELLED"   ? "border-red-200 text-red-600 hover:bg-red-50" :
                                  "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                            >
                              {updating === apt.id ? "…" : STATUS_CONFIG[action]?.label}
                            </button>
                          ))}
                        </div>

                        {/* Reschedule + Reassign — only for active statuses */}
                        {!["COMPLETED", "CANCELLED", "NO_SHOW"].includes(apt.status) && (
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            <button
                              onClick={() => setRescheduleTarget(apt)}
                              className="text-[10px] px-2 py-1 rounded border font-semibold border-teal-200 text-teal-600 hover:bg-teal-50 transition-all whitespace-nowrap flex items-center gap-1"
                            >
                              <CalendarClock size={9} /> Reschedule
                            </button>
                            <StaffReassignDropdown
                              appointment={apt}
                              onSuccess={() => { fetchAppointments(); fetchCounts(); }}
                            />
                          </div>
                        )}

                        {/* Mark as Paid button — only if not yet paid */}
                        {!isPaid && apt.status !== "CANCELLED" && apt.status !== "NO_SHOW" && (
                          <button
                            onClick={() => setMarkPaidTarget(apt)}
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

        {/* Pagination */}
        <div className="px-4 py-3 bg-cream/30 border-t border-cream-darker/20 flex items-center justify-between">
          <p className="text-xs text-charcoal-lighter">
            Showing {displayAppts.length} of {total} appointments
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="text-xs px-3 py-1.5 border border-cream-darker/50 rounded-sm disabled:opacity-40 hover:border-gold/30"
            >
              Prev
            </button>
            <button
              disabled={displayAppts.length < 20}
              onClick={() => setPage((p) => p + 1)}
              className="text-xs px-3 py-1.5 border border-cream-darker/50 rounded-sm disabled:opacity-40 hover:border-gold/30"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ── Reschedule Modal ── */}
      {rescheduleTarget && (
        <RescheduleModal
          appointment={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onSuccess={() => { fetchAppointments(); fetchCounts(); }}
        />
      )}

      {/* ── Mark as Paid Modal ── */}
      {markPaidTarget && (
        <MarkPaidModal
          appointment={markPaidTarget}
          onClose={() => setMarkPaidTarget(null)}
          onSuccess={() => { fetchAppointments(); fetchCounts(); }}
        />
      )}
    </div>
  );
}

function AppointmentsPageSkeleton() {
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
