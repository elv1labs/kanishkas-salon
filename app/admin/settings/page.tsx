"use client";
import { extractApiError } from "@/lib/extract-error";
import { DEFAULT_OPEN_TIME, DEFAULT_CLOSE_TIME } from "@/lib/constants";

import { useState, useEffect, useCallback } from "react";
import {
  Settings, Globe, Bell, Save, Check, Loader2, AlertCircle,
  Calendar, Plus, Trash2, MapPin, CreditCard,
} from "lucide-react";

const DAYS_OF_WEEK = [
  { key: "MONDAY", label: "Mon" },
  { key: "TUESDAY", label: "Tue" },
  { key: "WEDNESDAY", label: "Wed" },
  { key: "THURSDAY", label: "Thu" },
  { key: "FRIDAY", label: "Fri" },
  { key: "SATURDAY", label: "Sat" },
  { key: "SUNDAY", label: "Sun" },
];

type HolidayBlock = {
  id: string;
  startDate: string;
  endDate: string;
  reason: string | null;
};

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Business info
  const [businessName, setBusinessName] = useState("");
  const [tagline, setTagline] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [googleMapsEmbed, setGoogleMapsEmbed] = useState("");

  // Hours & schedule
  const [openTime, setOpenTime] = useState(DEFAULT_OPEN_TIME);
  const [closeTime, setCloseTime] = useState(DEFAULT_CLOSE_TIME);
  const [closedDays, setClosedDays] = useState<string[]>([]);
  const [appointmentBuffer, setAppointmentBuffer] = useState(15);

  // Social
  const [instagramUrl, setInstagramUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  // Payments
  const [upiId, setUpiId] = useState("");
  const [upiQrImageUrl, setUpiQrImageUrl] = useState("");
  const [taxRate, setTaxRate] = useState(0.18);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(500);
  const [shippingCost, setShippingCost] = useState(50);

  // Notifications
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);

  // Policies
  const [cancellationPolicy, setCancellationPolicy] = useState("");

  // Holidays
  const [holidays, setHolidays] = useState<HolidayBlock[]>([]);
  const [holidayStart, setHolidayStart] = useState("");
  const [holidayEnd, setHolidayEnd] = useState("");
  const [holidayReason, setHolidayReason] = useState("");
  const [addingHoliday, setAddingHoliday] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [settingsRes, holidaysRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/settings/holidays"),
      ]);
      if (!settingsRes.ok) throw new Error(`HTTP ${settingsRes.status}`);
      const sd = await settingsRes.json();
      const s = sd.settings;
      if (s) {
        setBusinessName(s.salonName ?? "");
        setTagline(s.tagline ?? "");
        setBusinessEmail(s.email ?? "");
        setBusinessPhone(s.phone ?? "");
        setBusinessAddress(s.address ?? "");
        setGoogleMapsUrl(s.googleMapsUrl ?? "");
        setGoogleMapsEmbed(s.googleMapsEmbed ?? "");
        setOpenTime(s.openTime ?? "10:00");
        setCloseTime(s.closeTime ?? "21:00");
        setClosedDays(s.closedDays ?? []);
        setInstagramUrl(s.instagramUrl ?? "");
        setFacebookUrl(s.facebookUrl ?? "");
        setWhatsappNumber(s.whatsappNumber ?? "");
        setUpiId(s.upiId ?? "");
        setUpiQrImageUrl(s.upiQrImageUrl ?? "");
        setAppointmentBuffer(s.appointmentBuffer ?? 15);
        setTaxRate(Number(s.taxRate ?? 0.18));
        setFreeShippingThreshold(Number(s.freeShippingThreshold ?? 500));
        setShippingCost(Number(s.shippingCost ?? 50));
        setSmsEnabled(s.smsEnabled ?? true);
        setEmailEnabled(s.emailEnabled ?? true);
        setWhatsappEnabled(s.whatsappEnabled ?? false);
        setCancellationPolicy(s.cancellationPolicy ?? "");
      }
      if (holidaysRes.ok) {
        const hd = await holidaysRes.json();
        setHolidays(hd.holidays ?? []);
      }
    } catch (err: any) {
      console.error("Failed to load settings", err);
      setError(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salonName: businessName,
          tagline: tagline || null,
          email: businessEmail,
          phone: businessPhone,
          address: businessAddress,
          googleMapsUrl: googleMapsUrl || null,
          googleMapsEmbed: googleMapsEmbed || null,
          openTime,
          closeTime,
          closedDays,
          instagramUrl: instagramUrl || null,
          facebookUrl: facebookUrl || null,
          whatsappNumber: whatsappNumber || null,
          upiId: upiId || null,
          upiQrImageUrl: upiQrImageUrl || null,
          appointmentBuffer,
          taxRate,
          freeShippingThreshold,
          shippingCost,
          smsEnabled,
          emailEnabled,
          whatsappEnabled,
          cancellationPolicy: cancellationPolicy || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(extractApiError(data, `HTTP ${res.status}`));
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setSaveError(err.message || "Failed to save settings");
      setTimeout(() => setSaveError(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleAddHoliday = async () => {
    if (!holidayStart || !holidayEnd) return;
    if (new Date(holidayEnd) < new Date(holidayStart)) {
      alert("End date must be on or after start date.");
      return;
    }
    setAddingHoliday(true);
    try {
      const res = await fetch("/api/settings/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: holidayStart,
          endDate: holidayEnd,
          reason: holidayReason || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(extractApiError(d, "Failed to add holiday"));
      }
      const d = await res.json();
      setHolidays((prev) => [...prev, d.holiday].sort((a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      ));
      setHolidayStart("");
      setHolidayEnd("");
      setHolidayReason("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAddingHoliday(false);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    if (!confirm("Remove this holiday block?")) return;
    try {
      await fetch(`/api/settings/holidays/${id}`, { method: "DELETE" });
      setHolidays((prev) => prev.filter((h) => h.id !== id));
    } catch {
      alert("Failed to delete");
    }
  };

  const toggleClosedDay = (day: string) => {
    setClosedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-gold" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-24">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-red-500 font-medium">{error}</p>
        <button onClick={loadSettings} className="mt-4 btn-gold text-xs py-2 px-4">Retry</button>
      </div>
    );
  }

  const inputCls = "w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40 transition-all";

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl text-espresso">Site Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`text-xs py-2 px-4 inline-flex items-center gap-1.5 rounded-sm font-semibold uppercase tracking-wide transition-all ${saved ? "bg-green-500 text-white" : saveError ? "bg-red-500 text-white" : "btn-gold"} disabled:opacity-60`}
        >
          {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
           : saved ? <><Check size={14} /> Saved!</>
           : saveError ? <><AlertCircle size={14} /> Error</>
           : <><Save size={14} /> Save All Changes</>}
        </button>
      </div>

      {saveError && (
        <div className="bg-red-50 border border-red-200 rounded-sm p-3 text-sm text-red-600">{saveError}</div>
      )}

      {/* Business Information */}
      <div className="bg-white rounded-sm border border-cream-darker/50 p-6 space-y-4">
        <h2 className="font-display text-base text-espresso flex items-center gap-2">
          <Globe size={16} className="text-gold" /> Business Information
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Business Name</label>
            <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputCls} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Tagline</label>
            <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Your salon tagline…" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Email</label>
            <input type="email" value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Phone</label>
            <input type="tel" value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} className={inputCls} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Address</label>
            <input type="text" value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>

      {/* Opening Hours & Schedule */}
      <div className="bg-white rounded-sm border border-cream-darker/50 p-6 space-y-4">
        <h2 className="font-display text-base text-espresso flex items-center gap-2">
          <Calendar size={16} className="text-gold" /> Opening Hours & Schedule
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Opening Time</label>
            <input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Closing Time</label>
            <input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Booking Buffer (min)</label>
            <input type="number" value={appointmentBuffer} onChange={(e) => setAppointmentBuffer(parseInt(e.target.value) || 0)} min={0} max={120} className={inputCls} />
          </div>
        </div>
        <div className="pt-3 border-t border-cream-darker/20">
          <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-2">Weekly Closed Days</label>
          <p className="text-[11px] text-charcoal-lighter/70 mb-3">Selected days will show no available slots for booking.</p>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => toggleClosedDay(d.key)}
                className={`text-xs px-3.5 py-2 rounded-sm border font-medium transition-colors ${
                  closedDays.includes(d.key)
                    ? "bg-red-50 text-red-700 border-red-300"
                    : "border-cream-darker/40 text-charcoal-lighter hover:border-espresso/30"
                }`}
              >
                {d.label}
                {closedDays.includes(d.key) && " ✕"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Holiday Blocks */}
      <div className="bg-white rounded-sm border border-cream-darker/50 p-6 space-y-4">
        <h2 className="font-display text-base text-espresso flex items-center gap-2">
          <Calendar size={16} className="text-gold" /> Holiday Closures
        </h2>
        <p className="text-[11px] text-charcoal-lighter/70">Block specific dates (e.g. Diwali, Holi). Bookings will be unavailable during these periods.</p>

        {holidays.length > 0 && (
          <div className="space-y-2">
            {holidays.map((h) => (
              <div key={h.id} className="flex items-center justify-between p-3 bg-cream/30 rounded-sm">
                <div>
                  <p className="text-sm text-espresso font-medium">
                    {new Date(h.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    {h.startDate !== h.endDate && (
                      <> — {new Date(h.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</>
                    )}
                  </p>
                  {h.reason && <p className="text-[11px] text-charcoal-lighter">{h.reason}</p>}
                </div>
                <button onClick={() => handleDeleteHoliday(h.id)} className="text-red-400 hover:text-red-600 p-1 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-3 items-end pt-2 border-t border-cream-darker/20">
          <div>
            <label className="block text-[10px] text-charcoal-lighter uppercase tracking-wider mb-1">From</label>
            <input type="date" value={holidayStart} onChange={(e) => setHolidayStart(e.target.value)}
              className="bg-cream border border-cream-darker/50 rounded-sm py-2 px-3 text-sm focus:outline-none focus:border-gold/40" />
          </div>
          <div>
            <label className="block text-[10px] text-charcoal-lighter uppercase tracking-wider mb-1">To</label>
            <input type="date" value={holidayEnd} onChange={(e) => setHolidayEnd(e.target.value)}
              className="bg-cream border border-cream-darker/50 rounded-sm py-2 px-3 text-sm focus:outline-none focus:border-gold/40" />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="block text-[10px] text-charcoal-lighter uppercase tracking-wider mb-1">Reason (optional)</label>
            <input type="text" value={holidayReason} onChange={(e) => setHolidayReason(e.target.value)} placeholder="e.g. Diwali"
              className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2 px-3 text-sm focus:outline-none focus:border-gold/40" />
          </div>
          <button
            onClick={handleAddHoliday}
            disabled={!holidayStart || !holidayEnd || addingHoliday}
            className="btn-gold text-xs py-2 px-3 flex items-center gap-1 disabled:opacity-50"
          >
            {addingHoliday ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Add
          </button>
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-white rounded-sm border border-cream-darker/50 p-6 space-y-4">
        <h2 className="font-display text-base text-espresso flex items-center gap-2">
          <Globe size={16} className="text-gold" /> Social Media Links
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Instagram URL</label>
            <input type="url" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/..." className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Facebook URL</label>
            <input type="url" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/..." className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">WhatsApp Number</label>
            <input type="tel" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="+91..." className={inputCls} />
          </div>
        </div>
      </div>

      {/* Maps & Location */}
      <div className="bg-white rounded-sm border border-cream-darker/50 p-6 space-y-4">
        <h2 className="font-display text-base text-espresso flex items-center gap-2">
          <MapPin size={16} className="text-gold" /> Maps & Location
        </h2>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Google Maps URL</label>
            <input type="url" value={googleMapsUrl} onChange={(e) => setGoogleMapsUrl(e.target.value)} placeholder="https://maps.google.com/..." className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Google Maps Embed Code</label>
            <textarea value={googleMapsEmbed} onChange={(e) => setGoogleMapsEmbed(e.target.value)} rows={3} placeholder='<iframe src="https://www.google.com/maps/embed?..." ...' className={`${inputCls} resize-none`} />
          </div>
        </div>
      </div>

      {/* Payment Settings */}
      <div className="bg-white rounded-sm border border-cream-darker/50 p-6 space-y-4">
        <h2 className="font-display text-base text-espresso flex items-center gap-2">
          <CreditCard size={16} className="text-gold" /> Payment Settings
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">UPI ID</label>
            <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="kanishkasalon@ybl" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">UPI QR Image Path</label>
            <input type="text" value={upiQrImageUrl} onChange={(e) => setUpiQrImageUrl(e.target.value)} placeholder="/uploads/qr-code.webp" className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-3 border-t border-cream-darker/20">
          <div>
            <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Tax Rate (%)</label>
            <input type="number" step="0.001" min="0" max="1" value={taxRate}
              onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
              className={inputCls}
              title="Enter as decimal: 0.18 = 18% GST"
            />
            <p className="text-[10px] text-charcoal-lighter/60 mt-0.5">Decimal: 0.18 = 18% GST</p>
          </div>
          <div>
            <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Free Shipping Above (₹)</label>
            <input type="number" step="1" min="0" value={freeShippingThreshold}
              onChange={(e) => setFreeShippingThreshold(parseFloat(e.target.value) || 0)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Shipping Cost (₹)</label>
            <input type="number" step="1" min="0" value={shippingCost}
              onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* Policies */}
      <div className="bg-white rounded-sm border border-cream-darker/50 p-6 space-y-4">
        <h2 className="font-display text-base text-espresso flex items-center gap-2">
          <Settings size={16} className="text-gold" /> Policies
        </h2>
        <div>
          <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Cancellation Policy</label>
          <textarea value={cancellationPolicy} onChange={(e) => setCancellationPolicy(e.target.value)} rows={4} placeholder="Enter your cancellation policy..." className={`${inputCls} resize-none`} />
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-sm border border-cream-darker/50 p-6">
        <h2 className="font-display text-base text-espresso mb-4 flex items-center gap-2">
          <Bell size={16} className="text-gold" /> Notification Channels
        </h2>
        <p className="text-[11px] text-charcoal-lighter/70 mb-3">Toggle channels globally. Changes are saved with "Save All Changes".</p>
        <div className="space-y-3">
          {[
            { key: "sms", label: "SMS Notifications", desc: "Send booking confirmations & reminders via SMS", enabled: smsEnabled, toggle: setSmsEnabled },
            { key: "email", label: "Email Notifications", desc: "Send receipts, confirmations, and marketing emails", enabled: emailEnabled, toggle: setEmailEnabled },
            { key: "whatsapp", label: "WhatsApp Notifications", desc: "Send booking updates via WhatsApp Business", enabled: whatsappEnabled, toggle: setWhatsappEnabled },
          ].map((channel) => (
            <label key={channel.key} className="flex items-center justify-between p-3 rounded-sm hover:bg-cream/30 transition-colors cursor-pointer">
              <div>
                <p className="text-sm text-espresso font-medium">{channel.label}</p>
                <p className="text-[11px] text-charcoal-lighter">{channel.desc}</p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); channel.toggle(!channel.enabled); }}
                className={`w-11 h-6 rounded-full transition-all relative ${channel.enabled ? "bg-gold" : "bg-gray-300"}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-all ${channel.enabled ? "right-0.5" : "left-0.5"}`} />
              </button>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
