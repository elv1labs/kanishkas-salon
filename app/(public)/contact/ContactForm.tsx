"use client";

import { useState } from "react";
import { Send, CheckCircle, AlertCircle } from "lucide-react";

export default function ContactForm() {
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        message: "",
    });
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        setErrorMsg("");

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Something went wrong. Please try again.");
            }

            setStatus("success");
            setFormData({ name: "", phone: "", email: "", message: "" });
        } catch (err: any) {
            setStatus("error");
            setErrorMsg(err.message || "Failed to send message.");
        }
    };

    if (status === "success") {
        return (
            <div className="text-center py-8">
                <CheckCircle size={48} className="text-green-600 mx-auto mb-4" />
                <h3 className="font-display text-xl font-semibold text-espresso mb-2">
                    Message Sent!
                </h3>
                <p className="text-sm text-charcoal-lighter mb-4">
                    Thank you for reaching out. We&apos;ll get back to you shortly.
                </p>
                <button
                    onClick={() => setStatus("idle")}
                    className="text-sm text-gold hover:text-gold-dark transition-colors font-semibold"
                >
                    Send another message
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="contact-name" className="block text-sm font-medium text-espresso mb-1">
                    Name *
                </label>
                <input
                    id="contact-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 bg-cream border border-cream-darker rounded-sm text-charcoal placeholder:text-charcoal-lighter/50 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 transition-colors text-sm"
                />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="contact-phone" className="block text-sm font-medium text-espresso mb-1">
                        Phone *
                    </label>
                    <input
                        id="contact-phone"
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 9876543210"
                        className="w-full px-4 py-3 bg-cream border border-cream-darker rounded-sm text-charcoal placeholder:text-charcoal-lighter/50 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 transition-colors text-sm"
                    />
                </div>
                <div>
                    <label htmlFor="contact-email" className="block text-sm font-medium text-espresso mb-1">
                        Email
                    </label>
                    <input
                        id="contact-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="you@example.com"
                        className="w-full px-4 py-3 bg-cream border border-cream-darker rounded-sm text-charcoal placeholder:text-charcoal-lighter/50 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 transition-colors text-sm"
                    />
                </div>
            </div>
            <div>
                <label htmlFor="contact-message" className="block text-sm font-medium text-espresso mb-1">
                    Message *
                </label>
                <textarea
                    id="contact-message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us about the service you're interested in or any questions..."
                    className="w-full px-4 py-3 bg-cream border border-cream-darker rounded-sm text-charcoal placeholder:text-charcoal-lighter/50 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/20 transition-colors text-sm resize-none"
                />
            </div>

            {status === "error" && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle size={16} />
                    {errorMsg}
                </div>
            )}

            <button
                type="submit"
                disabled={status === "loading"}
                className="btn-gold w-full disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {status === "loading" ? (
                    <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-espresso/30 border-t-espresso rounded-full animate-spin" />
                        Sending...
                    </span>
                ) : (
                    <span className="flex items-center gap-2">
                        <Send size={16} />
                        Send Message
                    </span>
                )}
            </button>
        </form>
    );
}
