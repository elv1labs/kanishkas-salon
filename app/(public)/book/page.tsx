"use client"
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Clock, ChevronLeft, Check, Loader2, Tag, X, AlertCircle, CheckCircle } from "lucide-react";
import MotionWrapper from "@/components/ui/MotionWrapper";

type Step = "service" | "datetime" | "confirm";
interface Service { id: string; name: string; duration: number; price: string; }
interface Staff { id: string; name: string; }

export default function BookAppointmentPage() {
    const { data: session, status: sessionStatus } = useSession();
    const [step, setStep] = useState<Step>("service");
    const [services, setServices] = useState<Service[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [bookingRef, setBookingRef] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Dynamic slot availability
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);

    // Voucher state
    type AppliedVoucher = { code: string; voucherName: string; discountApplied: number; finalPrice: number };
    const [voucher, setVoucher] = useState<AppliedVoucher | null>(null);
    const [voucherInput, setVoucherInput] = useState("");
    const [voucherOpen, setVoucherOpen] = useState(false);
    const [voucherLoading, setVoucherLoading] = useState(false);
    const [voucherError, setVoucherError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                const [svcRes, staffRes] = await Promise.all([
                    fetch("/api/services?limit=50"),
                    fetch("/api/staff"),
                ]);
                const svcData = await svcRes.json();
                const staffData = await staffRes.json();
                if (svcData.services) setServices(svcData.services);
                if (staffData.staff) setStaff(staffData.staff);
            } catch (e) {
                console.error("Failed to load data", e);
            } finally {
                setLoadingData(false);
            }
        }
        loadData();
    }, []);

    // Fetch available slots whenever service, date, or staff changes
    useEffect(() => {
        if (!selectedService || !selectedDate) {
            setAvailableSlots([]);
            return;
        }
        const dateStr = selectedDate.toISOString().split("T")[0];
        const params = new URLSearchParams({
            serviceId: selectedService.id,
            date: dateStr,
        });
        if (selectedStaff) params.set("staffId", selectedStaff.id);

        setSlotsLoading(true);
        setSelectedTime(null); // Reset time when date/staff changes
        fetch(`/api/appointments/available-slots?${params}`)
            .then((r) => r.json())
            .then((data) => setAvailableSlots(data.availableSlots ?? []))
            .catch(() => setAvailableSlots([]))
            .finally(() => setSlotsLoading(false));
    }, [selectedService, selectedDate, selectedStaff]);

    const dates = Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d;
    });

    const handleConfirm = async () => {
        if (!selectedService || !selectedDate || !selectedTime) return;
        if (!session) { setError("Please sign in to book."); return; }
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/appointments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    serviceId: selectedService.id,
                    staffId: selectedStaff?.id || undefined,
                    date: selectedDate.toISOString().split("T")[0],
                    startTime: selectedTime,
                    notes: notes || undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || "Booking failed."); return; }

            // If a voucher was validated, redeem it now against the confirmed appointment.
            // Fire-and-forget: if this fails (race), the booking still stands — no discount applied.
            const appointmentId: string | undefined = data.appointment?.id;
            if (voucher && appointmentId) {
                fetch("/api/vouchers/redeem", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code: voucher.code, appointmentId }),
                }).catch(() => { /* non-critical */ });
            }

            setBookingRef(data.appointment?.bookingRef || "CONFIRMED");
        } catch (e) {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleApplyVoucher = async () => {
        if (!selectedService) return;
        const trimmed = voucherInput.trim().toUpperCase();
        if (!trimmed) return;
        setVoucherLoading(true);
        setVoucherError(null);
        try {
            const res = await fetch("/api/vouchers/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: trimmed, serviceId: selectedService.id }),
            });
            const data = await res.json();
            if (!data.valid) {
                setVoucherError(data.error ?? "Invalid or expired code");
                setVoucherInput("");
                return;
            }
            setVoucher({
                code: trimmed,
                voucherName: data.voucherName,
                discountApplied: data.discountApplied,
                finalPrice: data.finalPrice,
            });
            setVoucherInput("");
            setVoucherOpen(false);
        } catch {
            setVoucherError("Could not apply voucher. Please try again.");
        } finally {
            setVoucherLoading(false);
        }
    };

    const handleRemoveVoucher = () => {
        setVoucher(null);
        setVoucherError(null);
        setVoucherInput("");
    };

    if (bookingRef) {
        return (
            <section className="bg-espresso py-16 px-4">
                <MotionWrapper>
                    <div className="max-w-lg mx-auto text-center">
                        {/* Success icon */}
                        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                            <Check className="text-green-400" size={32} />
                        </div>
                        <h1 className="font-display text-3xl font-bold text-cream mb-3">Booking Confirmed!</h1>
                        <p className="text-cream/60 mb-1">
                            Your appointment for <strong className="text-gold">{selectedService?.name}</strong> is requested.
                        </p>
                        <p className="text-gold font-mono text-sm mb-4">Ref: {bookingRef}</p>

                        {/* WhatsApp Confirmation Button */}
                        <a
                            href={`https://wa.me/919171230292?text=${encodeURIComponent(`Hi Kanishka's Salon! I just booked an appointment.

*Service:* ${selectedService?.name}
*Date:* ${selectedDate ? new Date(selectedDate).toLocaleDateString('en-IN', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'}) : ''}
*Time:* ${selectedTime}
*Booking Ref:* ${bookingRef}

Please confirm my appointment. Thank you!`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 10,
                                background: "#25D366",
                                color: "white",
                                padding: "14px 28px",
                                borderRadius: 4,
                                fontWeight: 700,
                                fontSize: 15,
                                letterSpacing: "0.02em",
                                textDecoration: "none",
                                marginBottom: 24,
                                boxShadow: "0 4px 20px rgba(37,211,102,0.3)",
                                width: "100%",
                            }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.855L0 24l6.335-1.508A11.955 11.955 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.65-.52-5.16-1.427l-.37-.22-3.76.896.944-3.668-.241-.378A9.944 9.944 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                            </svg>
                            Confirm via WhatsApp
                        </a>



                        {/* Offline payment notice */}
                        <div className="bg-white/5 border border-gold/25 rounded-lg p-6 mb-6 text-left">
                            <div className="flex items-start gap-3 mb-4">
                                <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg className="w-4 h-4 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-cream font-semibold text-sm">Payment at Salon</p>
                                    <p className="text-cream/60 text-xs mt-0.5">
                                        Payment can be completed at the salon via any of the following methods:
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 mb-5">
                                {[
                                    { icon: "📱", label: "UPI", desc: "Scan & Pay" },
                                    { icon: "💵", label: "Cash", desc: "At reception" },
                                    { icon: "💳", label: "Card", desc: "Debit / Credit" },
                                ].map(({ icon, label, desc }) => (
                                    <div key={label} className="bg-white/5 rounded-md p-3 text-center border border-white/10">
                                        <p className="text-xl mb-1">{icon}</p>
                                        <p className="text-cream text-xs font-semibold">{label}</p>
                                        <p className="text-cream/50 text-[10px]">{desc}</p>
                                    </div>
                                ))}
                            </div>

                            {/* UPI details */}
                            <div className="border-t border-white/10 pt-4">
                                <p className="text-cream/50 text-xs uppercase tracking-wider mb-2">UPI Details</p>
                                <div className="flex items-center justify-between bg-black/20 rounded-md px-3 py-2">
                                    <span className="text-cream font-mono text-sm">kanishkasen100@paytm</span>
                                    <button
                                        onClick={() => navigator.clipboard.writeText("kanishkasen100@paytm")}
                                        className="text-[10px] text-gold/80 hover:text-gold transition-colors ml-2 flex-shrink-0"
                                    >
                                        Copy
                                    </button>
                                </div>
                                <p className="text-cream/40 text-[11px] mt-2">
                                    💡 Please mention your booking ref <span className="text-gold font-mono">{bookingRef}</span> in the UPI note.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Link href="/dashboard/client/appointments" className="btn-gold">View Appointments</Link>
                            <Link href="/" className="btn-outline">Back to Home</Link>
                        </div>
                    </div>
                </MotionWrapper>
            </section>
        );
    }

    return (
        <>
            <section className="bg-espresso py-12 sm:py-16">
                <div className="container-salon text-center px-4">
                    <MotionWrapper>
                        <span className="font-accent text-sm uppercase tracking-widest text-gold mb-4 block">Book Now</span>
                        <h1 className="font-display text-3xl font-bold text-cream mb-4">Book Your Appointment</h1>
                    </MotionWrapper>
                </div>
            </section>

            <section className="section-padding bg-cream min-h-[60vh]">
                <div className="container-salon max-w-4xl">

                    {step === "service" && (
                        <div>
                            <h2 className="font-display text-xl text-espresso mb-6">Choose a Service</h2>
                            {loadingData ? (
                                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gold" size={32} /></div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {services.map((service) => (
                                        <button key={service.id}
                                            onClick={() => { setSelectedService(service); setStep("datetime"); }}
                                            className="text-left p-4 rounded-sm border-2 border-cream-darker/50 bg-white hover:border-gold/30 transition-all">
                                            <p className="font-display text-base font-semibold text-espresso">{service.name}</p>
                                            <div className="flex items-center gap-3 text-xs text-charcoal-lighter mt-1">
                                                <span className="flex items-center gap-1"><Clock size={12} /> {service.duration} min</span>
                                                <span>Rs.{Number(service.price).toLocaleString("en-IN")}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {step === "datetime" && (
                        <div>
                            <button onClick={() => setStep("service")} className="flex items-center gap-1 text-sm text-charcoal-lighter hover:text-gold mb-4">
                                <ChevronLeft size={14} /> Change Service
                            </button>
                            <div className="bg-white rounded-sm border border-cream-darker/50 p-5 mb-4">
                                <p className="text-sm text-charcoal-lighter">Selected:</p>
                                <p className="font-display text-lg text-espresso">{selectedService?.name}</p>
                            </div>
                            <h3 className="font-display text-base text-espresso mb-3">Preferred Staff (optional)</h3>
                            <div className="flex flex-wrap gap-2 mb-6">
                                <button onClick={() => setSelectedStaff(null)}
                                    className={`text-xs px-3 py-1.5 rounded-sm border transition-all ${!selectedStaff ? "border-gold bg-gold/10 text-gold" : "border-cream-darker text-charcoal-lighter"}`}>
                                    Any Available
                                </button>
                                {staff.map((s) => (
                                    <button key={s.id} onClick={() => setSelectedStaff(s)}
                                        className={`text-xs px-3 py-1.5 rounded-sm border transition-all ${selectedStaff?.id === s.id ? "border-gold bg-gold/10 text-gold" : "border-cream-darker text-charcoal-lighter"}`}>
                                        {s.name}
                                    </button>
                                ))}
                            </div>
                            <h3 className="font-display text-base text-espresso mb-3">Select Date</h3>
                            <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
                                {dates.map((date) => {
                                    const isSelected = selectedDate?.toDateString() === date.toDateString();
                                    const isToday = date.toDateString() === new Date().toDateString();
                                    return (
                                        <button key={date.toISOString()} onClick={() => setSelectedDate(date)}
                                            className={`flex-shrink-0 w-16 py-3 rounded-sm text-center border-2 transition-all ${isSelected ? "border-gold bg-gold/10" : "border-cream-darker bg-white hover:border-gold/30"}`}>
                                            <p className={`text-[10px] uppercase ${isSelected ? "text-gold" : "text-charcoal-lighter"}`}>{isToday ? "Today" : date.toLocaleDateString("en", { weekday: "short" })}</p>
                                            <p className={`font-display text-lg ${isSelected ? "text-espresso font-bold" : "text-charcoal"}`}>{date.getDate()}</p>
                                            <p className={`text-[10px] ${isSelected ? "text-gold" : "text-charcoal-lighter"}`}>{date.toLocaleDateString("en", { month: "short" })}</p>
                                        </button>
                                    );
                                })}
                            </div>
                            {selectedDate && (
                                <>
                                    <h3 className="font-display text-base text-espresso mb-3">Select Time</h3>
                                    {slotsLoading ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="animate-spin text-gold" size={24} />
                                        </div>
                                    ) : availableSlots.length === 0 ? (
                                        <div className="bg-amber-50 border border-amber-200 rounded-sm p-4 mb-6">
                                            <p className="text-sm text-amber-700">No available slots for this date{selectedStaff ? ` with ${selectedStaff.name}` : ""}. Please try another date or staff member.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-6">
                                            {availableSlots.map((time: string) => (
                                                <button key={time} onClick={() => { setSelectedTime(time); setStep("confirm"); }}
                                                    className={`py-2.5 rounded-sm text-sm border-2 transition-all ${selectedTime === time ? "border-gold bg-gold/10 text-gold" : "border-cream-darker bg-white text-charcoal hover:border-gold/30"}`}>
                                                    {time}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {step === "confirm" && selectedService && selectedDate && selectedTime && (
                        <div>
                            <button onClick={() => setStep("datetime")} className="flex items-center gap-1 text-sm text-charcoal-lighter hover:text-gold mb-4">
                                <ChevronLeft size={14} /> Back
                            </button>
                            <h2 className="font-display text-xl text-espresso mb-6">Confirm Your Booking</h2>
                            <div className="bg-white rounded-sm border border-cream-darker/50 p-6 mb-6">
                                <p className="font-display text-lg text-espresso">{selectedService.name}</p>
                                <p className="text-sm text-charcoal-lighter mb-4">{selectedService.duration} minutes</p>
                                <div className="grid grid-cols-2 gap-4 border-t border-cream-darker/50 pt-4">
                                    <div>
                                        <p className="text-xs text-charcoal-lighter uppercase mb-1">Date</p>
                                        <p className="font-medium text-espresso">{selectedDate.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-charcoal-lighter uppercase mb-1">Time</p>
                                        <p className="font-medium text-espresso">{selectedTime}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-charcoal-lighter uppercase mb-1">Staff</p>
                                        <p className="font-medium text-espresso">{selectedStaff?.name ?? "Any Available"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-charcoal-lighter uppercase mb-1">Price</p>
                                        <p className="font-display text-lg font-bold text-gold">Rs.{Number(selectedService.price).toLocaleString("en-IN")}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm text-charcoal-lighter mb-2">Special Notes (optional)</label>
                                <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Any special requests..." rows={3}
                                    className="w-full bg-white border border-cream-darker/50 rounded-sm p-3 text-sm focus:outline-none focus:border-gold/40 resize-none" />
                            </div>

                            {/* ── Voucher section ──────────────────────────────── */}
                            <div className="mb-6">
                                {voucher ? (
                                    /* Applied state */
                                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-sm px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle size={15} className="text-green-600 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-green-800">
                                                    ₹{voucher.discountApplied.toLocaleString("en-IN")} off — {voucher.voucherName}
                                                </p>
                                                <p className="text-xs text-green-600 font-mono">{voucher.code}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleRemoveVoucher}
                                            className="text-green-500 hover:text-red-500 transition-colors ml-3 flex-shrink-0"
                                            aria-label="Remove voucher"
                                        >
                                            <X size={15} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {!voucherOpen && (
                                            <button
                                                id="voucher-toggle-btn"
                                                onClick={() => { setVoucherOpen(true); setVoucherError(null); }}
                                                className="text-sm text-gold hover:text-gold/80 underline-offset-2 hover:underline transition-colors flex items-center gap-1"
                                            >
                                                <Tag size={13} />
                                                Have a voucher code?
                                            </button>
                                        )}
                                        {voucherOpen && (
                                            <div className="border border-gold/25 rounded-sm bg-white p-4 space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <Tag size={14} className="text-gold" />
                                                    <span className="text-sm font-medium text-espresso">Gift Voucher</span>
                                                    <button
                                                        onClick={() => { setVoucherOpen(false); setVoucherError(null); }}
                                                        className="ml-auto text-charcoal/40 hover:text-charcoal transition-colors"
                                                        aria-label="Close voucher input"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                                <div className="flex gap-2">
                                                    <input
                                                        id="voucher-code-input"
                                                        type="text"
                                                        value={voucherInput}
                                                        onChange={(e) => { setVoucherInput(e.target.value.toUpperCase()); setVoucherError(null); }}
                                                        onKeyDown={(e) => { if (e.key === "Enter") handleApplyVoucher(); }}
                                                        placeholder="GIFT-XXXX"
                                                        disabled={voucherLoading}
                                                        className="flex-1 text-sm px-3 py-2 border border-charcoal/20 rounded-sm bg-white text-espresso placeholder:text-charcoal/30 focus:outline-none focus:ring-1 focus:ring-gold/40 disabled:opacity-60 tracking-wider font-mono"
                                                    />
                                                    <button
                                                        id="voucher-apply-btn"
                                                        onClick={handleApplyVoucher}
                                                        disabled={voucherLoading || !voucherInput.trim()}
                                                        className="px-4 py-2 bg-espresso text-cream text-sm font-semibold rounded-sm hover:bg-espresso/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                                                    >
                                                        {voucherLoading ? <Loader2 size={14} className="animate-spin" /> : "Apply"}
                                                    </button>
                                                </div>
                                                {voucherError && (
                                                    <div className="flex items-center gap-1.5 text-red-600 text-xs">
                                                        <AlertCircle size={13} className="flex-shrink-0" />
                                                        {voucherError}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* ── Price row — updates when voucher applied ─────── */}
                            <div className="bg-cream rounded-sm border border-cream-darker/50 px-4 py-3 mb-6 flex items-center justify-between">
                                <span className="text-sm text-charcoal-lighter">Total due at salon</span>
                                <div className="text-right">
                                    {voucher ? (
                                        <>
                                            <span className="text-sm text-charcoal-lighter line-through mr-2">
                                                ₹{Number(selectedService.price).toLocaleString("en-IN")}
                                            </span>
                                            <span className="font-display text-lg font-bold text-green-700">
                                                ₹{voucher.finalPrice.toLocaleString("en-IN")}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="font-display text-lg font-bold text-gold">
                                            ₹{Number(selectedService.price).toLocaleString("en-IN")}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {sessionStatus === "unauthenticated" && (
                                <div className="bg-gold/5 border border-gold/20 rounded-sm p-4 mb-6">
                                    <p className="text-sm text-charcoal">
                                        <Link href="/login?callbackUrl=/book" className="text-gold font-semibold">Sign in</Link> or <Link href="/register" className="text-gold font-semibold">create an account</Link> to confirm your booking.
                                    </p>
                                </div>
                            )}
                            {error && <div className="bg-red-50 border border-red-200 rounded-sm p-3 mb-4"><p className="text-sm text-red-600">{error}</p></div>}
                            <button onClick={handleConfirm} disabled={loading || sessionStatus !== "authenticated"} className="btn-gold w-full py-4 text-base disabled:opacity-50">
                                {loading ? <Loader2 size={20} className="animate-spin mx-auto" /> : "Confirm Booking"}
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
