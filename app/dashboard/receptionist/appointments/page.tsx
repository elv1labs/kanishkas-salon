"use client";
import { extractApiError } from "@/lib/extract-error";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar, Clock, UserPlus, ChevronLeft, ChevronRight,
  User, X, Loader2, Check, IndianRupee, Star, CheckCircle, XCircle,
  Smartphone, Banknote, CreditCard,
} from "lucide-react";
import { MarkAsPaidModal, type MarkAsPaidAppointment } from "@/components/appointments/MarkAsPaidModal";
import { LOYALTY_POINT_VALUE_INR, LOYALTY_MIN_REDEEM_POINTS, DEFAULT_OPEN_TIME, DEFAULT_CLOSE_TIME, generateTimeSlots } from "@/lib/constants";

// ── Types ─────────────────────────────────────────────────────────────────────

type BookedSlot = {
  id:         string;
  clientName: string;
  service:    string;
  startTime:  string;
  duration:   number;
  status:     string;
  phone:      string;
  paymentStatus: "PENDING" | "PAID" | null;
  paymentMethod: string | null;
};

type ServiceOption = { id: string; name: string; duration: number; price: string };
type StaffOption   = { id: string; name: string };

// Returned from the walk-in booking API once confirmed
type ConfirmedBooking = {
  appointmentId: string;
  clientId:      string | null;   // null for true walk-ins with no account
  clientName:    string;
  serviceName:   string;
  totalAmount:   number;
};

const statusColors: Record<string, string> = {
  CONFIRMED:   "bg-blue-500/90 border-blue-600",
  PENDING:     "bg-amber-500/90 border-amber-600",
  IN_PROGRESS: "bg-purple-500/90 border-purple-600",
  COMPLETED:   "bg-green-500/90 border-green-600",
};

const METHOD_ICONS: Record<string, React.ReactNode> = {
  CASH: <Banknote size={12} />,
  UPI:  <Smartphone size={12} />,
  CARD: <CreditCard size={12} />,
};

const PAYMENT_FILTERS = ["All", "PENDING", "PAID"] as const;
type PaymentFilter = typeof PAYMENT_FILTERS[number];

// Time slots generated dynamically from business hours (loaded from settings)
function getSlotIndex(time: string, slots: string[]): number { return slots.indexOf(time); }
function formatDate(d: Date): string { return d.toISOString().split("T")[0]; }
function displayDate(d: Date): string {
  return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
function calcEndTime(startTime: string, duration: number): string {
  const [h, m] = startTime.split(":").map(Number);
  const total  = h * 60 + m + duration;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

// ── Loyalty Redemption Widget ──────────────────────────────────────────────────

function LoyaltyRedemptionWidget({
  clientId,
  appointmentId,
  servicePrice,
}: {
  clientId:      string;
  appointmentId: string;
  servicePrice:  number;
}) {
  const [balance,       setBalance]       = useState<{ totalPoints: number; worthRupees: number } | null>(null);
  const [loadingBal,    setLoadingBal]    = useState(true);
  const [pointsInput,   setPointsInput]   = useState("");
  const [redeeming,     setRedeeming]     = useState(false);
  const [redeemError,   setRedeemError]   = useState<string | null>(null);
  const [redeemResult,  setRedeemResult]  = useState<{
    pointsRedeemed: number;
    discountAmount: number;
    newBalance:     number;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/loyalty/balance?userId=${clientId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setBalance(d.data);
      })
      .catch(console.error)
      .finally(() => setLoadingBal(false));
  }, [clientId]);

  const maxRedeemable = balance
    ? Math.min(balance.totalPoints, Math.floor(servicePrice / LOYALTY_POINT_VALUE_INR))
    : 0;

  const handleRedeem = async () => {
    const pts = parseInt(pointsInput, 10);
    if (isNaN(pts) || pts < LOYALTY_MIN_REDEEM_POINTS) {
      setRedeemError(`Minimum ${LOYALTY_MIN_REDEEM_POINTS} points`);
      return;
    }
    if (pts > (balance?.totalPoints ?? 0)) {
      setRedeemError("Exceeds available balance");
      return;
    }
    setRedeeming(true);
    setRedeemError(null);
    try {
      const res  = await fetch("/api/loyalty/redeem", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId: clientId, appointmentId, pointsToRedeem: pts }),
      });
      const data = await res.json();
      if (!data.success) { setRedeemError(extractApiError(data, "Redemption failed")); return; }
      setRedeemResult(data.data);
      setBalance(prev => prev ? { ...prev, totalPoints: data.data.newBalance, worthRupees: data.data.newBalance * LOYALTY_POINT_VALUE_INR } : prev);
    } catch {
      setRedeemError("Network error — please try again.");
    } finally {
      setRedeeming(false);
    }
  };

  if (loadingBal) {
    return (
      <div className="flex items-center gap-2 text-xs text-charcoal-lighter py-2">
        <Loader2 size={13} className="animate-spin" /> Checking loyalty balance...
      </div>
    );
  }

  if (!balance || balance.totalPoints === 0) return null; // no points — hide widget

  if (redeemResult) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-sm px-4 py-3 flex items-start gap-2">
        <CheckCircle size={15} className="text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs">
          <p className="font-semibold text-amber-800">
            ₹{redeemResult.discountAmount.toFixed(2)} discount applied
          </p>
          <p className="text-amber-700 mt-0.5">
            {redeemResult.pointsRedeemed} pts redeemed · New balance: {redeemResult.newBalance} pts
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-amber-200 rounded-sm bg-amber-50/50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Star size={14} className="text-gold" />
        <span className="text-sm font-semibold text-espresso">Redeem Loyalty Points</span>
      </div>
      <p className="text-xs text-charcoal-lighter">
        Available: <span className="font-semibold text-espresso">{balance.totalPoints} pts</span>
        {" "}(worth <span className="font-semibold">₹{balance.worthRupees.toFixed(2)}</span>)
        {" "}· Max redeemable: <span className="font-semibold">{maxRedeemable} pts</span>
      </p>
      <div className="flex gap-2">
        <input
          type="number"
          min={LOYALTY_MIN_REDEEM_POINTS}
          max={maxRedeemable}
          value={pointsInput}
          onChange={e => { setPointsInput(e.target.value); setRedeemError(null); }}
          placeholder={`10 – ${maxRedeemable} pts`}
          className="flex-1 bg-white border border-amber-200 rounded-sm py-2 px-3 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
        />
        <button
          onClick={handleRedeem}
          disabled={redeeming || !pointsInput || parseInt(pointsInput) < LOYALTY_MIN_REDEEM_POINTS}
          className="px-4 py-2 bg-espresso text-cream text-xs font-semibold rounded-sm hover:bg-espresso/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
        >
          {redeeming ? <Loader2 size={12} className="animate-spin" /> : <Star size={12} />}
          Apply
        </button>
      </div>
      {pointsInput && !isNaN(parseInt(pointsInput)) && parseInt(pointsInput) > 0 && (
        <p className="text-xs text-charcoal-lighter">
          = ₹{(parseInt(pointsInput) * LOYALTY_POINT_VALUE_INR).toFixed(2)} off
        </p>
      )}
      {redeemError && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <XCircle size={12} /> {redeemError}
        </p>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ReceptionistAppointmentsPage() {
  const [view,        setView]        = useState<"daily" | "weekly">("daily");
  const [showWalkin,  setShowWalkin]  = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings,    setBookings]    = useState<BookedSlot[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("All");

  // Dynamic time slots derived from business hours
  const [openTime,  setOpenTime]  = useState(DEFAULT_OPEN_TIME);
  const [closeTime, setCloseTime] = useState(DEFAULT_CLOSE_TIME);
  const timeSlots = generateTimeSlots(openTime, closeTime);

  // Walk-in form state
  const [walkinName,      setWalkinName]      = useState("");
  const [walkinPhone,     setWalkinPhone]     = useState("");
  const [walkinServiceId, setWalkinServiceId] = useState("");
  const [walkinStaffId,   setWalkinStaffId]   = useState("");
  const [walkinTime,      setWalkinTime]      = useState(timeSlots[0]);
  const [walkinSubmitting,setWalkinSubmitting]= useState(false);
  const [walkinError,     setWalkinError]     = useState<string | null>(null);

  // Confirmed booking state (drives post-booking UX inside walk-in modal)
  const [confirmedBooking, setConfirmedBooking] = useState<ConfirmedBooking | null>(null);
  const [markPaidTarget,   setMarkPaidTarget]   = useState<MarkAsPaidAppointment | null>(null);

  // Dropdown options loaded from API
  const [services,  setServices]  = useState<ServiceOption[]>([]);
  const [staffList, setStaffList] = useState<StaffOption[]>([]);

  // Load services, staff, and business hours once on mount
  useEffect(() => {
    Promise.all([
      fetch("/api/services?limit=100").then(r => r.json()),
      fetch("/api/staff?limit=50").then(r  => r.json()),
      fetch("/api/settings").then(r => r.json()).catch(() => null),
    ]).then(([svcData, staffData, settingsData]) => {
      setServices(svcData.services   ?? []);
      setStaffList(staffData.staff   ?? []);
      if (settingsData?.settings) {
        if (settingsData.settings.openTime)  setOpenTime(settingsData.settings.openTime);
        if (settingsData.settings.closeTime) setCloseTime(settingsData.settings.closeTime);
      }
    }).catch(console.error);
  }, []);

  const fetchAppointments = useCallback(async (date: Date) => {
    setLoading(true);
    try {
      const d   = formatDate(date);
      const res = await fetch(`/api/appointments?dateFrom=${d}&dateTo=${d}&limit=50`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const mapped: BookedSlot[] = (data.appointments ?? []).map((a: any) => ({
        id:            a.id,
        clientName:    a.client?.name ?? "Walk-in",
        service:       a.service?.name ?? "Service",
        startTime:     a.startTime,
        duration:      Math.max(1, Math.round((a.service?.duration ?? 30) / 30)),
        status:        a.status,
        phone:         a.client?.phone ?? "",
        paymentStatus: a.payment?.status ?? null,
        paymentMethod: a.payment?.method ?? null,
      }));
      setBookings(mapped);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAppointments(currentDate); }, [currentDate, fetchAppointments]);

  const changeDate = (delta: number) => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + delta);
      return d;
    });
  };

  const resetWalkin = () => {
    setWalkinName(""); setWalkinPhone(""); setWalkinServiceId("");
    setWalkinStaffId(""); setWalkinTime(timeSlots[0]);
    setWalkinError(null); setConfirmedBooking(null);
  };

  const handleWalkinSubmit = async () => {
    if (!walkinName.trim() || !walkinServiceId) {
      setWalkinError("Client name and service are required.");
      return;
    }
    setWalkinSubmitting(true);
    setWalkinError(null);
    try {
      const selectedService = services.find(s => s.id === walkinServiceId);
      const end = calcEndTime(walkinTime, selectedService?.duration ?? 30);
      const res = await fetch("/api/appointments", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          serviceId:   walkinServiceId,
          staffId:     walkinStaffId || null,
          date:        formatDate(currentDate),
          startTime:   walkinTime,
          endTime:     end,
          notes:       `Walk-in${walkinPhone ? ` — Phone: ${walkinPhone}` : ""}`,
          totalAmount: Number(selectedService?.price ?? 0),
          isWalkin:    true,
          walkinName:  walkinName.trim(),
          walkinPhone: walkinPhone.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(extractApiError(data, `Error ${res.status}`));
      }
      const data = await res.json();
      setConfirmedBooking({
        appointmentId: data.appointment?.id,
        clientId:      data.appointment?.clientId ?? null,
        clientName:    walkinName.trim(),
        serviceName:   selectedService?.name ?? "Service",
        totalAmount:   Number(selectedService?.price ?? 0),
      });
      fetchAppointments(currentDate); // refresh calendar in background
    } catch (err: any) {
      setWalkinError(err.message || "Failed to create booking.");
    } finally {
      setWalkinSubmitting(false);
    }
  };

  // ── Payment filter (client-side only) ──────────────────────────────────────
  const filteredBookings = bookings.filter(b => {
    if (paymentFilter === "All")     return true;
    if (paymentFilter === "PAID")    return b.paymentStatus === "PAID";
    if (paymentFilter === "PENDING") return b.paymentStatus !== "PAID";
    return true;
  });

  const counts = {
    total:      bookings.length,
    confirmed:  bookings.filter(b => b.status === "CONFIRMED").length,
    pending:    bookings.filter(b => b.status === "PENDING").length,
    inProgress: bookings.filter(b => b.status === "IN_PROGRESS").length,
  };

  const paymentCounts = {
    paid:    bookings.filter(b => b.paymentStatus === "PAID").length,
    pending: bookings.filter(b => b.paymentStatus !== "PAID").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-xl text-espresso">Appointment Calendar</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowWalkin(true)} className="btn-outline text-xs py-2 px-3">
            <UserPlus size={14} className="mr-1.5" /> Walk-in
          </button>
          <a href="/book" className="btn-gold text-xs py-2 px-3 inline-flex items-center">
            <Calendar size={14} className="mr-1.5" /> New Booking
          </a>
        </div>
      </div>

      {/* Date Navigator */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => changeDate(-1)}
            className="w-8 h-8 rounded-full bg-white border border-cream-darker/50 flex items-center justify-center text-charcoal-lighter hover:text-espresso hover:border-gold/30 transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="text-center">
            <p className="font-display text-sm text-espresso">{displayDate(currentDate)}</p>
            <p className="text-[10px] text-charcoal-lighter">
              {loading ? "Loading..." : `${counts.total} appointments`}
            </p>
          </div>
          <button
            onClick={() => changeDate(1)}
            className="w-8 h-8 rounded-full bg-white border border-cream-darker/50 flex items-center justify-center text-charcoal-lighter hover:text-espresso hover:border-gold/30 transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="flex gap-1 bg-cream rounded-sm p-1">
          {(["daily", "weekly"] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 text-xs font-semibold rounded-sm transition-all ${view === v ? "bg-white text-espresso shadow-sm" : "text-charcoal-lighter hover:bg-white/50"}`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total",       value: counts.total,      color: "text-espresso" },
          { label: "Confirmed",   value: counts.confirmed,   color: "text-blue-600" },
          { label: "Pending",     value: counts.pending,     color: "text-amber-600" },
          { label: "In Progress", value: counts.inProgress,  color: "text-purple-600" },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-sm border border-cream-darker/50 p-3 text-center">
            <p className={`font-display text-xl font-bold ${stat.color}`}>
              {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : stat.value}
            </p>
            <p className="text-[10px] text-charcoal-lighter">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Payment Filter Tabs (Gap 3) ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-charcoal-lighter font-medium">Payment:</span>
        <div className="flex items-center gap-1 bg-cream/60 rounded-sm border border-cream-darker/30 p-1">
          {PAYMENT_FILTERS.map(opt => (
            <button
              key={opt}
              onClick={() => setPaymentFilter(opt)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-[3px] transition-all ${
                paymentFilter === opt
                  ? opt === "PAID"    ? "bg-green-600 text-white"
                  : opt === "PENDING" ? "bg-red-500 text-white"
                  :                    "bg-espresso text-cream"
                  : "text-charcoal-lighter hover:text-espresso"
              }`}
            >
              {opt === "All"     ? `All (${bookings.length})`       :
               opt === "PAID"   ? `✓ Paid (${paymentCounts.paid})`  :
               `⏳ Pending (${paymentCounts.pending})`}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-sm border border-cream-darker/50 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-charcoal-lighter gap-2">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Loading appointments...</span>
          </div>
        ) : (
          <div className="divide-y divide-cream-darker/20">
            {timeSlots.map((time, i) => {
              const booking    = filteredBookings.find(b => b.startTime === time);
              const isOccupied = filteredBookings.some(b => {
                const start = getSlotIndex(b.startTime, timeSlots);
                return i > start && i < start + b.duration;
              });
              return (
                <div key={time} className="flex">
                  <div className="w-16 sm:w-20 flex-shrink-0 py-3 px-3 text-xs text-charcoal-lighter font-medium border-r border-cream-darker/20 bg-cream/30">
                    {time}
                  </div>
                  <div className={`flex-1 py-1 px-2 min-h-[44px] transition-colors ${!booking && !isOccupied ? "hover:bg-gold/5 cursor-pointer" : ""}`}>
                    {booking && (
                      <div
                        className={`rounded-sm px-3 py-2 text-white border-l-4 ${statusColors[booking.status] ?? "bg-gray-400"}`}
                        style={{ minHeight: `${booking.duration * 44 - 8}px` }}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold">{booking.clientName}</p>
                          <div className="flex items-center gap-1.5">
                            {/* Payment indicator */}
                            {booking.paymentStatus === "PAID" ? (
                              <span className="text-[9px] bg-green-500/90 text-white px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <Check size={8} /> PAID
                                {booking.paymentMethod && <span className="ml-0.5">{METHOD_ICONS[booking.paymentMethod]}</span>}
                              </span>
                            ) : (
                              <span className="text-[9px] bg-red-500/80 text-white px-1.5 py-0.5 rounded">
                                UNPAID
                              </span>
                            )}
                            <span className="text-[9px] uppercase tracking-wider bg-white/20 px-1.5 py-0.5 rounded">
                              {booking.status.replace("_", " ")}
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] opacity-90 mt-0.5">{booking.service}</p>
                        <p className="text-[10px] opacity-70 mt-0.5 flex items-center gap-1">
                          <Clock size={10} /> {booking.startTime} · {booking.duration * 30}min
                        </p>
                        {booking.phone && (
                          <p className="text-[10px] opacity-60 mt-0.5">{booking.phone}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {!loading && bookings.length === 0 && (
          <div className="text-center py-16 text-charcoal-lighter">
            <Calendar size={32} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">No appointments for this day</p>
          </div>
        )}
        {!loading && bookings.length > 0 && filteredBookings.length === 0 && (
          <div className="text-center py-8 text-charcoal-lighter text-sm border-t border-cream-darker/20">
            No appointments match the selected payment filter.
          </div>
        )}
      </div>

      {/* ── Walk-in Modal ───────────────────────────────────────────────────────── */}
      {showWalkin && (
        <div className="fixed inset-0 bg-espresso/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-sm w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">

            {/* ── Post-booking confirmation state ── */}
            {confirmedBooking ? (
              <>
                <div className="flex items-center justify-between p-5 border-b border-cream-darker/30">
                  <h2 className="font-display text-lg text-espresso">Booking Confirmed</h2>
                  <button
                    onClick={() => { setShowWalkin(false); resetWalkin(); }}
                    className="text-charcoal-lighter hover:text-espresso transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  {/* Confirmation pill */}
                  <div className="bg-green-50 border border-green-200 rounded-sm px-4 py-3 flex items-center gap-2">
                    <Check size={16} className="text-green-600 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-semibold text-green-800">{confirmedBooking.clientName}</p>
                      <p className="text-green-700 text-xs mt-0.5">
                        {confirmedBooking.serviceName} · ₹{confirmedBooking.totalAmount.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  {/* Loyalty redemption — only if client has an account (clientId present) */}
                  {confirmedBooking.clientId && (
                    <LoyaltyRedemptionWidget
                      clientId={confirmedBooking.clientId}
                      appointmentId={confirmedBooking.appointmentId}
                      servicePrice={confirmedBooking.totalAmount}
                    />
                  )}

                  {/* Mark as Paid */}
                  <button
                    onClick={() => setMarkPaidTarget({
                      id:          confirmedBooking.appointmentId,
                      clientName:  confirmedBooking.clientName,
                      serviceName: confirmedBooking.serviceName,
                      totalAmount: confirmedBooking.totalAmount,
                    })}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-sm border-2 border-gold/50 text-gold hover:bg-gold/10 transition-all"
                  >
                    <IndianRupee size={14} /> Mark as Paid
                  </button>
                </div>

                <div className="flex gap-3 p-5 border-t border-cream-darker/30">
                  <button
                    onClick={() => { setShowWalkin(false); resetWalkin(); }}
                    className="btn-outline flex-1 py-2.5 text-xs"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => resetWalkin()}
                    className="btn-gold flex-1 py-2.5 text-xs"
                  >
                    + New Walk-in
                  </button>
                </div>
              </>
            ) : (
              /* ── Normal booking form state ── */
              <>
                <div className="flex items-center justify-between p-5 border-b border-cream-darker/30">
                  <h2 className="font-display text-lg text-espresso">Walk-in Booking</h2>
                  <button
                    onClick={() => { setShowWalkin(false); resetWalkin(); }}
                    className="text-charcoal-lighter hover:text-espresso transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="p-5 space-y-4">
                  {walkinError && (
                    <div className="bg-red-50 border border-red-200 rounded-sm px-3 py-2 text-sm text-red-600">
                      {walkinError}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Client Name *</label>
                    <div className="relative">
                      <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-lighter" />
                      <input
                        type="text"
                        value={walkinName}
                        onChange={e => setWalkinName(e.target.value)}
                        placeholder="Walk-in client name..."
                        className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:border-gold/40 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Phone</label>
                    <input
                      type="tel"
                      value={walkinPhone}
                      onChange={e => setWalkinPhone(e.target.value)}
                      placeholder="+91..."
                      className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Service *</label>
                    <select
                      value={walkinServiceId}
                      onChange={e => setWalkinServiceId(e.target.value)}
                      className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40 transition-all"
                    >
                      <option value="">Select service...</option>
                      {services.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} · {s.duration}min · ₹{Number(s.price).toLocaleString("en-IN")}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Start Time</label>
                      <select
                        value={walkinTime}
                        onChange={e => setWalkinTime(e.target.value)}
                        className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40 transition-all"
                      >
                        {timeSlots.slice(0, -2).map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Assign Staff</label>
                      <select
                        value={walkinStaffId}
                        onChange={e => setWalkinStaffId(e.target.value)}
                        className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40 transition-all"
                      >
                        <option value="">Any Available</option>
                        {staffList.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 p-5 border-t border-cream-darker/30">
                  <button
                    onClick={() => { setShowWalkin(false); resetWalkin(); }}
                    className="btn-outline flex-1 py-2.5 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleWalkinSubmit}
                    disabled={walkinSubmitting || !walkinName.trim() || !walkinServiceId}
                    className="btn-gold flex-1 py-2.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    {walkinSubmitting && <Loader2 size={14} className="animate-spin" />}
                    {walkinSubmitting ? "Booking..." : "Book Walk-in"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MarkAsPaidModal — rendered outside the walk-in modal so z-index stacks correctly */}
      {markPaidTarget && (
        <MarkAsPaidModal
          appointment={markPaidTarget}
          onClose={() => setMarkPaidTarget(null)}
          onSuccess={() => {
            setMarkPaidTarget(null);
            fetchAppointments(currentDate);
          }}
        />
      )}
    </div>
  );
}
