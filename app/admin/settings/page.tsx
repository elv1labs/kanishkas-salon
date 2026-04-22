"use client";

import { useState, useEffect, useCallback } from "react";
import { Settings, Globe, Palette, Search as SearchIcon, Bell, Key, Save, Check, Loader2, AlertCircle } from "lucide-react";

type BusinessSettings = {
    id: string;
    salonName: string;
    tagline: string | null;
    phone: string;
    email: string;
    address: string;
    googleMapsUrl: string | null;
    instagramUrl: string | null;
    facebookUrl: string | null;
    whatsappNumber: string | null;
    openTime: string;
    closeTime: string;
    currency: string;
    timezone: string;
    loyaltyPointsValue: number;
    appointmentBuffer: number;
    cancellationPolicy: string | null;
};

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Form state
    const [businessName, setBusinessName] = useState("");
    const [businessEmail, setBusinessEmail] = useState("");
    const [businessPhone, setBusinessPhone] = useState("");
    const [businessAddress, setBusinessAddress] = useState("");
    const [openTime, setOpenTime] = useState("10:00");
    const [closeTime, setCloseTime] = useState("20:30");
    const [closedDay, setClosedDay] = useState("Monday");
    const [primaryColor, setPrimaryColor] = useState("#C9A84C");
    const [metaTitle, setMetaTitle] = useState("");
    const [metaDesc, setMetaDesc] = useState("");
    const [smsEnabled, setSmsEnabled] = useState(true);
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [whatsappEnabled, setWhatsappEnabled] = useState(false);
    const [instagramUrl, setInstagramUrl] = useState("");
    const [facebookUrl, setFacebookUrl] = useState("");
    const [whatsappNumber, setWhatsappNumber] = useState("");
    const [appointmentBuffer, setAppointmentBuffer] = useState(15);
    const [cancellationPolicy, setCancellationPolicy] = useState("");

    const loadSettings = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/settings");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const s = data.settings;
            if (s) {
                setBusinessName(s.salonName ?? "");
                setBusinessEmail(s.email ?? "");
                setBusinessPhone(s.phone ?? "");
                setBusinessAddress(s.address ?? "");
                setOpenTime(s.openTime ?? "10:00");
                setCloseTime(s.closeTime ?? "20:30");
                setInstagramUrl(s.instagramUrl ?? "");
                setFacebookUrl(s.facebookUrl ?? "");
                setWhatsappNumber(s.whatsappNumber ?? "");
                setAppointmentBuffer(s.appointmentBuffer ?? 15);
                setCancellationPolicy(s.cancellationPolicy ?? "");
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
                    email: businessEmail,
                    phone: businessPhone,
                    address: businessAddress,
                    openTime,
                    closeTime,
                    instagramUrl: instagramUrl || null,
                    facebookUrl: facebookUrl || null,
                    whatsappNumber: whatsappNumber || null,
                    appointmentBuffer,
                    cancellationPolicy: cancellationPolicy || null,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || `HTTP ${res.status}`);
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
                        <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)}
                            className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40 transition-all" />
                    </div>
                    <div>
                        <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Email</label>
                        <input type="email" value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)}
                            className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40 transition-all" />
                    </div>
                    <div>
                        <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Phone</label>
                        <input type="tel" value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)}
                            className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40 transition-all" />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Address</label>
                        <input type="text" value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)}
                            className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40 transition-all" />
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-2 border-t border-cream-darker/20">
                    <div>
                        <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Opening Time</label>
                        <input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)}
                            className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40 transition-all" />
                    </div>
                    <div>
                        <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Closing Time</label>
                        <input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)}
                            className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40 transition-all" />
                    </div>
                    <div>
                        <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Appointment Buffer (min)</label>
                        <input type="number" value={appointmentBuffer} onChange={(e) => setAppointmentBuffer(parseInt(e.target.value) || 0)} min={0} max={120}
                            className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40 transition-all" />
                    </div>
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
                        <input type="url" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/..."
                            className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40 transition-all" />
                    </div>
                    <div>
                        <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Facebook URL</label>
                        <input type="url" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/..."
                            className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40 transition-all" />
                    </div>
                    <div>
                        <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">WhatsApp Number</label>
                        <input type="tel" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="+91..."
                            className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40 transition-all" />
                    </div>
                </div>
            </div>

            {/* Appearance */}
            <div className="bg-white rounded-sm border border-cream-darker/50 p-6 space-y-4">
                <h2 className="font-display text-base text-espresso flex items-center gap-2">
                    <Palette size={16} className="text-gold" /> Appearance
                </h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Primary Brand Color</label>
                        <div className="flex items-center gap-3">
                            <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)}
                                className="w-10 h-10 rounded border border-cream-darker/50 cursor-pointer" />
                            <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)}
                                className="flex-1 bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm font-mono focus:outline-none focus:border-gold/40 transition-all" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Logo</label>
                        <div className="border-2 border-dashed border-cream-darker/50 rounded-sm py-4 text-center hover:border-gold/40 transition-all cursor-pointer">
                            <p className="text-xs text-charcoal-lighter">Click to upload logo</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* SEO Settings */}
            <div className="bg-white rounded-sm border border-cream-darker/50 p-6 space-y-4">
                <h2 className="font-display text-base text-espresso flex items-center gap-2">
                    <SearchIcon size={16} className="text-gold" /> SEO Settings
                </h2>
                <div>
                    <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Meta Title</label>
                    <input type="text" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="Page title for search engines"
                        className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40 transition-all" />
                    <p className="text-[10px] text-charcoal-lighter/60 mt-1">{metaTitle.length}/60 characters</p>
                </div>
                <div>
                    <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Meta Description</label>
                    <textarea value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} rows={3} placeholder="Page description for search engines"
                        className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40 transition-all resize-none" />
                    <p className="text-[10px] text-charcoal-lighter/60 mt-1">{metaDesc.length}/160 characters</p>
                </div>
            </div>

            {/* Cancellation Policy */}
            <div className="bg-white rounded-sm border border-cream-darker/50 p-6 space-y-4">
                <h2 className="font-display text-base text-espresso flex items-center gap-2">
                    <Settings size={16} className="text-gold" /> Policies
                </h2>
                <div>
                    <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Cancellation Policy</label>
                    <textarea value={cancellationPolicy} onChange={(e) => setCancellationPolicy(e.target.value)} rows={4} placeholder="Enter your cancellation policy..."
                        className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40 transition-all resize-none" />
                </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-white rounded-sm border border-cream-darker/50 p-6">
                <h2 className="font-display text-base text-espresso mb-4 flex items-center gap-2">
                    <Bell size={16} className="text-gold" /> Notification Channels
                </h2>
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
                                onClick={(e) => { e.preventDefault(); channel.toggle(!channel.enabled); }}
                                className={`w-11 h-6 rounded-full transition-all relative ${channel.enabled ? "bg-gold" : "bg-gray-300"}`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-all ${channel.enabled ? "right-0.5" : "left-0.5"}`} />
                            </button>
                        </label>
                    ))}
                </div>
            </div>

            {/* API Keys */}
            <div className="bg-white rounded-sm border border-cream-darker/50 p-6 space-y-4">
                <h2 className="font-display text-base text-espresso flex items-center gap-2">
                    <Key size={16} className="text-gold" /> API & Integration Keys
                </h2>
                <p className="text-xs text-charcoal-lighter">API keys are managed via environment variables on the server. Contact your developer to update these.</p>
                {[
                    { label: "Offline Payments", hint: "Cash / UPI / Card — confirmed by staff", status: "Active" },
                    { label: "VPS Media Storage", hint: "Files saved to /uploads on the server", status: "Active" },
                    { label: "Resend", hint: "Email service", status: "Configured" },
                    { label: "Twilio", hint: "SMS service", status: "Configured" },
                ].map((api) => (
                    <div key={api.label} className="flex items-center justify-between p-3 bg-cream/30 rounded-sm">
                        <div>
                            <p className="text-sm text-espresso font-medium">{api.label}</p>
                            <p className="text-[10px] text-charcoal-lighter">{api.hint}</p>
                        </div>
                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-semibold uppercase">{api.status}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
