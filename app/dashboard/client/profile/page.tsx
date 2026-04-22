"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { User, Mail, Phone, MapPin, Save, Check, Loader2, Heart, Scissors } from "lucide-react";

const skinTypes = ["Normal", "Oily", "Dry", "Combination", "Sensitive"];
const hairTypes = ["Straight", "Wavy", "Curly", "Coily", "Fine", "Thick"];

export default function ClientProfilePage() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        address: "",
        city: "",
        pincode: "",
        skinType: "",
        hairType: "",
        allergies: "",
    });

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch("/api/users/me");
                if (res.ok) {
                    const data = await res.json();
                    setFormData({
                        name: data.user?.name ?? session?.user?.name ?? "",
                        phone: data.user?.phone ?? "",
                        address: data.user?.profile?.address ?? "",
                        city: data.user?.profile?.city ?? "",
                        pincode: data.user?.profile?.pincode ?? "",
                        skinType: data.user?.profile?.skinType ?? "",
                        hairType: data.user?.profile?.hairType ?? "",
                        allergies: data.user?.profile?.allergies ?? "",
                    });
                } else {
                    setFormData(f => ({ ...f, name: session?.user?.name ?? "" }));
                }
            } catch (e) {
                setFormData(f => ({ ...f, name: session?.user?.name ?? "" }));
            } finally {
                setLoading(false);
            }
        }
        if (session) load();
    }, [session]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch("/api/users/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const update = (field: string, value: string | boolean) =>
        setFormData(prev => ({ ...prev, [field]: value }));

    if (loading) {
        return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-gold" size={28} /></div>;
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="flex items-center justify-between">
                <h1 className="font-display text-xl text-espresso">My Profile</h1>
                <button onClick={handleSave} disabled={saving}
                    className="btn-gold text-xs py-2 px-5 flex items-center gap-2 disabled:opacity-50">
                    {saving ? <Loader2 size={14} className="animate-spin" /> :
                     saved ? <Check size={14} /> : <Save size={14} />}
                    {saved ? "Saved!" : "Save Changes"}
                </button>
            </div>

            {/* Avatar */}
            <div className="bg-white rounded-sm border border-cream-darker/50 p-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center">
                        <span className="font-display text-2xl font-bold text-gold">
                            {formData.name?.charAt(0)?.toUpperCase() ?? "U"}
                        </span>
                    </div>
                    <div>
                        <h2 className="font-display text-lg text-espresso">{formData.name}</h2>
                        <p className="text-sm text-charcoal-lighter">{session?.user?.email}</p>
                        <span className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded-sm font-semibold uppercase tracking-wider">
                            Client
                        </span>
                    </div>
                </div>
            </div>

            {/* Personal Info */}
            <div className="bg-white rounded-sm border border-cream-darker/50 p-6">
                <h2 className="font-display text-base text-espresso mb-4 flex items-center gap-2">
                    <User size={16} className="text-gold" /> Personal Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Full Name</label>
                        <input value={formData.name} onChange={e => update("name", e.target.value)}
                            className="w-full bg-cream/50 border border-cream-darker/50 rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-gold/40" />
                    </div>
                    <div>
                        <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Phone</label>
                        <input value={formData.phone} onChange={e => update("phone", e.target.value)}
                            placeholder="+91 98765 43210"
                            className="w-full bg-cream/50 border border-cream-darker/50 rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-gold/40" />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Address</label>
                        <input value={formData.address} onChange={e => update("address", e.target.value)}
                            placeholder="Street address"
                            className="w-full bg-cream/50 border border-cream-darker/50 rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-gold/40" />
                    </div>
                    <div>
                        <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">City</label>
                        <input value={formData.city} onChange={e => update("city", e.target.value)}
                            placeholder="Indore"
                            className="w-full bg-cream/50 border border-cream-darker/50 rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-gold/40" />
                    </div>
                    <div>
                        <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Pincode</label>
                        <input value={formData.pincode} onChange={e => update("pincode", e.target.value)}
                            placeholder="452001"
                            className="w-full bg-cream/50 border border-cream-darker/50 rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-gold/40" />
                    </div>
                </div>
            </div>

            {/* Beauty Profile */}
            <div className="bg-white rounded-sm border border-cream-darker/50 p-6">
                <h2 className="font-display text-base text-espresso mb-4 flex items-center gap-2">
                    <Scissors size={16} className="text-gold" /> Beauty Profile
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Skin Type</label>
                        <select value={formData.skinType} onChange={e => update("skinType", e.target.value)}
                            className="w-full bg-cream/50 border border-cream-darker/50 rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-gold/40">
                            <option value="">Select skin type</option>
                            {skinTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Hair Type</label>
                        <select value={formData.hairType} onChange={e => update("hairType", e.target.value)}
                            className="w-full bg-cream/50 border border-cream-darker/50 rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-gold/40">
                            <option value="">Select hair type</option>
                            {hairTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Allergies / Notes</label>
                        <textarea value={formData.allergies} onChange={e => update("allergies", e.target.value)}
                            placeholder="Any allergies or special notes for our staff..."
                            rows={3}
                            className="w-full bg-cream/50 border border-cream-darker/50 rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-gold/40 resize-none" />
                    </div>
                </div>
            </div>
        </div>
    );
}
