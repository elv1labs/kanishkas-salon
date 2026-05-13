"use client"
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { extractApiError } from "@/lib/extract-error";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Clock, ChevronLeft, ChevronRight, Check, Loader2, Tag, X, AlertCircle, CheckCircle, User, Phone, Calendar, Sun, Sunset, Moon } from "lucide-react";
import MotionWrapper from "@/components/ui/MotionWrapper";

type Step = "service" | "datetime" | "confirm";
interface Service { id: string; name: string; duration: number; price: string; }
interface Staff { id: string; name: string; }

export default function BookAppointmentPage() {
    const { data: session, status: sessionStatus } = useSession();
    const t = useTranslations();
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

    // Guest booking state
    const [guestName, setGuestName] = useState("");
    const [guestPhone, setGuestPhone] = useState("");
    const [guestEmail, setGuestEmail] = useState("");

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

    // Calendar state
    const [calendarMonth, setCalendarMonth] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });

    const dates = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d;
    });

    // Build calendar grid for current month view
    const getCalendarDays = () => {
        const year = calendarMonth.getFullYear();
        const month = calendarMonth.getMonth();
        const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 29);
        maxDate.setHours(23, 59, 59, 999);

        const cells: Array<{ date: Date | null; isBookable: boolean; isToday: boolean }> = [];
        // Padding for first row
        for (let i = 0; i < firstDay; i++) cells.push({ date: null, isBookable: false, isToday: false });
        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            date.setHours(0, 0, 0, 0);
            const isBookable = date >= today && date <= maxDate;
            const isToday = date.getTime() === today.getTime();
            cells.push({ date, isBookable, isToday });
        }
        return cells;
    };

    // Categorize time slots
    const categorizeSlots = (slots: string[]) => {
        const morning: string[] = [];
        const afternoon: string[] = [];
        const evening: string[] = [];
        for (const slot of slots) {
            const hour = parseInt(slot.split(":")[0]);
            if (hour < 12) morning.push(slot);
            else if (hour < 17) afternoon.push(slot);
            else evening.push(slot);
        }
        return { morning, afternoon, evening };
    };

    const handleConfirm = async () => {
        if (!selectedService || !selectedDate || !selectedTime) return;
        const isGuest = sessionStatus !== "authenticated";

        // Guest validation
        if (isGuest) {
            if (!guestName.trim() || guestName.trim().length < 2) {
                setError("Please enter your name (at least 2 characters).");
                return;
            }
            if (!/^[6-9]\d{9}$/.test(guestPhone)) {
                setError("Please enter a valid 10-digit Indian mobile number.");
                return;
            }
        }

        setLoading(true);
        setError(null);
        try {
            const endpoint = isGuest ? "/api/appointments/guest-book" : "/api/appointments";
            const payload = isGuest
                ? {
                    name: guestName.trim(),
                    phone: guestPhone.trim(),
                    email: guestEmail.trim() || undefined,
                    serviceId: selectedService.id,
                    staffId: selectedStaff?.id || undefined,
                    date: selectedDate.toISOString().split("T")[0],
                    startTime: selectedTime,
                    notes: notes || undefined,
                }
                : {
                    serviceId: selectedService.id,
                    staffId: selectedStaff?.id || undefined,
                    date: selectedDate.toISOString().split("T")[0],
                    startTime: selectedTime,
                    notes: notes || undefined,
                };

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) { setError(extractApiError(data, "Booking failed.")); return; }

            // If a voucher was validated, redeem it now against the confirmed appointment.
            const appointmentId: string | undefined = data.appointment?.id;
            if (voucher && appointmentId && !isGuest) {
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
                setVoucherError(extractApiError(data, "Invalid or expired code"));
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
                        <span className="font-accent text-sm uppercase tracking-widest text-gold mb-4 block">{t('booking.bookNowTag')}</span>
                        <h1 className="font-display text-3xl font-bold text-cream mb-6">{t('booking.bookYourAppointment')}</h1>
                        {/* Step Progress Indicator */}
                        <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
                            {[t('booking.service'), t('booking.dateAndTime'), t('booking.confirm')].map((label, i) => {
                                const stepIndex = i === 0 ? "service" : i === 1 ? "datetime" : "confirm";
                                const currentIndex = step === "service" ? 0 : step === "datetime" ? 1 : 2;
                                const isActive = i === currentIndex;
                                const isCompleted = i < currentIndex;
                                return (
                                    <div key={label} className="flex items-center gap-2">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                                            ${isCompleted ? "bg-gold text-espresso" : isActive ? "bg-gold/20 text-gold border-2 border-gold" : "bg-white/10 text-cream/40"}`}>
                                            {isCompleted ? <Check size={14} /> : i + 1}
                                        </div>
                                        <span className={`text-xs hidden sm:inline ${isActive ? "text-gold font-semibold" : "text-cream/40"}`}>{label}</span>
                                        {i < 2 && <div className={`w-8 h-0.5 ${i < currentIndex ? "bg-gold" : "bg-white/10"}`} />}
                                    </div>
                                );
                            })}
                        </div>
                    </MotionWrapper>
                </div>
            </section>

            <section className="section-padding bg-cream min-h-[60vh]">
                <div className="container-salon max-w-4xl">

                    {step === "service" && (
                        <div>
                            <h2 className="font-display text-xl text-espresso mb-6">{t('booking.chooseService')}</h2>
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
                                <ChevronLeft size={14} /> {t('booking.changeService')}
                            </button>
                            {/* Selected Service Card */}
                            <div className="bg-white rounded-sm border border-cream-darker/50 p-5 mb-6 flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-charcoal-lighter uppercase tracking-wider">{t('booking.selectedService')}</p>
                                    <p className="font-display text-lg text-espresso">{selectedService?.name}</p>
                                    <div className="flex items-center gap-3 text-xs text-charcoal-lighter mt-1">
                                        <span className="flex items-center gap-1"><Clock size={12} /> {selectedService?.duration} min</span>
                                        <span className="font-semibold text-gold">₹{Number(selectedService?.price ?? 0).toLocaleString("en-IN")}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Staff Selection */}
                            <h3 className="font-display text-base text-espresso mb-3">{t('booking.preferredStaff')} <span className="text-xs text-charcoal-lighter font-normal">({t('booking.optional')})</span></h3>
                            <div className="flex flex-wrap gap-2 mb-6">
                                <button onClick={() => setSelectedStaff(null)}
                                    className={`text-xs px-4 py-2 rounded-full border-2 transition-all font-medium ${!selectedStaff ? "border-gold bg-gold/10 text-gold" : "border-cream-darker text-charcoal-lighter hover:border-gold/30"}`}>
                                    {t('booking.anyAvailable')}
                                </button>
                                {staff.map((s) => (
                                    <button key={s.id} onClick={() => setSelectedStaff(s)}
                                        className={`text-xs px-4 py-2 rounded-full border-2 transition-all font-medium ${selectedStaff?.id === s.id ? "border-gold bg-gold/10 text-gold" : "border-cream-darker text-charcoal-lighter hover:border-gold/30"}`}>
                                        {s.name}
                                    </button>
                                ))}
                            </div>

                            {/* Visual Calendar */}
                            <div className="bg-white rounded-sm border border-cream-darker/50 p-5 mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <button
                                        onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                                        disabled={calendarMonth.getMonth() === new Date().getMonth() && calendarMonth.getFullYear() === new Date().getFullYear()}
                                        className="p-1.5 rounded-sm hover:bg-cream transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                                        <ChevronLeft size={18} className="text-charcoal" />
                                    </button>
                                    <h3 className="font-display text-base text-espresso flex items-center gap-2">
                                        <Calendar size={16} className="text-gold" />
                                        {calendarMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                                    </h3>
                                    <button
                                        onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                                        className="p-1.5 rounded-sm hover:bg-cream transition-colors">
                                        <ChevronRight size={18} className="text-charcoal" />
                                    </button>
                                </div>
                                {/* Day headers */}
                                <div className="grid grid-cols-7 gap-1 mb-1">
                                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                                        <div key={d} className="text-center text-[10px] font-semibold text-charcoal-lighter uppercase py-1">{d}</div>
                                    ))}
                                </div>
                                {/* Calendar grid */}
                                <div className="grid grid-cols-7 gap-1">
                                    {getCalendarDays().map((cell, idx) => {
                                        if (!cell.date) return <div key={`empty-${idx}`} />;
                                        const isSelected = selectedDate?.toDateString() === cell.date.toDateString();
                                        return (
                                            <button
                                                key={cell.date.toISOString()}
                                                onClick={() => cell.isBookable ? setSelectedDate(cell.date) : null}
                                                disabled={!cell.isBookable}
                                                className={`relative py-2.5 rounded-sm text-center transition-all text-sm
                                                    ${isSelected
                                                        ? "bg-gold text-espresso font-bold shadow-md ring-2 ring-gold/30"
                                                        : cell.isBookable
                                                            ? "bg-cream/50 text-charcoal hover:bg-gold/10 hover:text-espresso cursor-pointer"
                                                            : "text-charcoal-lighter/30 cursor-not-allowed"
                                                    }
                                                    ${cell.isToday && !isSelected ? "ring-1 ring-gold/40" : ""}
                                                `}>
                                                {cell.date.getDate()}
                                                {cell.isToday && (
                                                    <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isSelected ? "bg-espresso" : "bg-gold"}`} />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Time Slot Grid — categorized */}
                            {selectedDate && (
                                <>
                                    <h3 className="font-display text-base text-espresso mb-3 flex items-center gap-2">
                                        <Clock size={16} className="text-gold" />
                                        {t('booking.availableTimes')} — {selectedDate.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                                    </h3>
                                    {slotsLoading ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="animate-spin text-gold" size={24} />
                                        </div>
                                    ) : availableSlots.length === 0 ? (
                                        <div className="bg-amber-50 border border-amber-200 rounded-sm p-4 mb-6">
                                            <p className="text-sm text-amber-700">No available slots for this date{selectedStaff ? ` with ${selectedStaff.name}` : ""}. Please try another date or staff member.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 mb-6">
                                            {(() => {
                                                const { morning, afternoon, evening } = categorizeSlots(availableSlots);
                                                const sections = [
                                                    { label: t('booking.morning'), icon: <Sun size={14} />, slots: morning, color: "text-amber-600" },
                                                    { label: t('booking.afternoon'), icon: <Sunset size={14} />, slots: afternoon, color: "text-orange-600" },
                                                    { label: t('booking.evening'), icon: <Moon size={14} />, slots: evening, color: "text-indigo-600" },
                                                ];
                                                return sections.filter(s => s.slots.length > 0).map(section => (
                                                    <div key={section.label}>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className={section.color}>{section.icon}</span>
                                                            <span className="text-xs font-semibold text-charcoal uppercase tracking-wider">{section.label}</span>
                                                            <span className="text-[10px] bg-cream-darker/50 text-charcoal-lighter px-1.5 py-0.5 rounded-full">{section.slots.length} {t('booking.slots')}</span>
                                                        </div>
                                                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                                            {section.slots.map((time: string) => (
                                                                <button key={time} onClick={() => { setSelectedTime(time); setStep("confirm"); }}
                                                                    className={`py-2.5 rounded-sm text-sm border-2 transition-all font-medium
                                                                        ${selectedTime === time
                                                                            ? "border-gold bg-gold/10 text-gold shadow-sm"
                                                                            : "border-cream-darker bg-white text-charcoal hover:border-gold/30 hover:bg-gold/5"}`}>
                                                                    {time}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {step === "confirm" && selectedService && selectedDate && selectedTime && (
                        <div>
                            <button onClick={() => setStep("datetime")} className="flex items-center gap-1 text-sm text-charcoal-lighter hover:text-gold mb-4">
                                <ChevronLeft size={14} /> {t('booking.back')}
                            </button>
                            <h2 className="font-display text-xl text-espresso mb-6">{t('booking.confirmYourBooking')}</h2>
                            <div className="bg-white rounded-sm border border-cream-darker/50 p-6 mb-6">
                                <p className="font-display text-lg text-espresso">{selectedService.name}</p>
                                <p className="text-sm text-charcoal-lighter mb-4">{selectedService.duration} {t('booking.minutes')}</p>
                                <div className="grid grid-cols-2 gap-4 border-t border-cream-darker/50 pt-4">
                                    <div>
                                        <p className="text-xs text-charcoal-lighter uppercase mb-1">{t('booking.date')}</p>
                                        <p className="font-medium text-espresso">{selectedDate.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-charcoal-lighter uppercase mb-1">{t('booking.time')}</p>
                                        <p className="font-medium text-espresso">{selectedTime}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-charcoal-lighter uppercase mb-1">{t('booking.staff')}</p>
                                        <p className="font-medium text-espresso">{selectedStaff?.name ?? t('booking.anyAvailable')}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-charcoal-lighter uppercase mb-1">{t('booking.price')}</p>
                                        <p className="font-display text-lg font-bold text-gold">Rs.{Number(selectedService.price).toLocaleString("en-IN")}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm text-charcoal-lighter mb-2">{t('booking.specialNotes')}</label>
                                <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                                    placeholder={t('booking.anySpecialRequests')} rows={3}
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
                                                {t('booking.haveVoucher')}
                                            </button>
                                        )}
                                        {voucherOpen && (
                                            <div className="border border-gold/25 rounded-sm bg-white p-4 space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <Tag size={14} className="text-gold" />
                                                    <span className="text-sm font-medium text-espresso">{t('booking.giftVoucher')}</span>
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
                                                        {voucherLoading ? <Loader2 size={14} className="animate-spin" /> : t('booking.apply')}
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
                                <span className="text-sm text-charcoal-lighter">{t('booking.totalDueAtSalon')}</span>
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
                                <div className="bg-white rounded-sm border border-cream-darker/50 p-6 mb-6">
                                    <h3 className="font-display text-base text-espresso mb-1">{t('booking.yourDetails')}</h3>
                                    <p className="text-xs text-charcoal-lighter mb-4">{t('booking.noAccountNeeded')}</p>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs text-charcoal-lighter mb-1">{t('booking.name')} *</label>
                                            <div className="relative">
                                                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-lighter/50" />
                                                <input
                                                    id="guest-name"
                                                    type="text"
                                                    value={guestName}
                                                    onChange={(e) => setGuestName(e.target.value)}
                                                    placeholder={t('booking.yourFullName')}
                                                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-cream-darker/50 rounded-sm text-sm focus:outline-none focus:border-gold/40"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-charcoal-lighter mb-1">{t('booking.phone')} *</label>
                                            <div className="relative">
                                                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-lighter/50" />
                                                <input
                                                    id="guest-phone"
                                                    type="tel"
                                                    value={guestPhone}
                                                    onChange={(e) => setGuestPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                                    placeholder={t('booking.tenDigitMobile')}
                                                    maxLength={10}
                                                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-cream-darker/50 rounded-sm text-sm focus:outline-none focus:border-gold/40 font-mono"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-charcoal-lighter mb-1">{t('booking.email')}</label>
                                            <input
                                                id="guest-email"
                                                type="email"
                                                value={guestEmail}
                                                onChange={(e) => setGuestEmail(e.target.value)}
                                                placeholder="your@email.com"
                                                className="w-full px-3 py-2.5 bg-white border border-cream-darker/50 rounded-sm text-sm focus:outline-none focus:border-gold/40"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-charcoal-lighter/60 mt-3">
                                        {t('booking.alreadyHaveAccount')} <a href="/login?callbackUrl=/book" className="text-gold hover:underline">{t('auth.signIn')}</a> {t('booking.signInToTrack')}
                                    </p>
                                </div>
                            )}
                            {error && <div className="bg-red-50 border border-red-200 rounded-sm p-3 mb-4"><p className="text-sm text-red-600">{error}</p></div>}
                            <button onClick={handleConfirm} disabled={loading || (sessionStatus === "unauthenticated" && (!guestName.trim() || !guestPhone.trim()))} className="btn-gold w-full py-4 text-base disabled:opacity-50">
                                {loading ? <Loader2 size={20} className="animate-spin mx-auto" /> : t('booking.confirmBooking')}
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
