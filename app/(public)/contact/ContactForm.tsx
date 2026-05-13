"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Send, CheckCircle, AlertCircle } from "lucide-react";
import { extractApiError } from "@/lib/extract-error";

const CSS = `
    .cf-field-group {
        position: relative;
        margin-bottom: 24px;
    }
    .cf-input, .cf-textarea {
        width: 100%;
        background: #141414;
        border: none;
        border-bottom: 1px solid #2A2A2A;
        color: #F5F0E8;
        font-family: 'Montserrat', sans-serif;
        font-size: 14px;
        font-weight: 300;
        padding: 14px 0 10px;
        outline: none;
        transition: border-color 0.3s ease;
        -webkit-appearance: none;
    }
    .cf-textarea {
        resize: none;
        min-height: 100px;
    }
    .cf-input:focus, .cf-textarea:focus {
        border-bottom-color: #C9A84C;
    }
    .cf-input::placeholder, .cf-textarea::placeholder {
        color: rgba(245,240,232,0.25);
        font-weight: 300;
    }
    .cf-label {
        position: absolute;
        top: 14px;
        left: 0;
        font-family: 'Montserrat', sans-serif;
        font-size: 13px;
        font-weight: 300;
        color: rgba(245,240,232,0.35);
        pointer-events: none;
        transition: all 0.25s cubic-bezier(0.22,1,0.36,1);
    }
    .cf-input:focus + .cf-label,
    .cf-input:not(:placeholder-shown) + .cf-label,
    .cf-textarea:focus + .cf-label,
    .cf-textarea:not(:placeholder-shown) + .cf-label {
        top: -6px;
        font-size: 10px;
        font-weight: 500;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #C9A84C;
    }
    .cf-bottom-border {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 0;
        height: 1.5px;
        background: linear-gradient(90deg, #C9A84C, #E2C97E);
        transition: width 0.35s cubic-bezier(0.22,1,0.36,1);
    }
    .cf-field-group:focus-within .cf-bottom-border {
        width: 100%;
    }
    .cf-field-group:focus-within .cf-label {
        color: #C9A84C;
    }

    .cf-submit-btn {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 15px 32px;
        background: transparent;
        border: 1.5px solid #C9A84C;
        color: #C9A84C;
        font-family: 'Montserrat', sans-serif;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        cursor: pointer;
        transition: all 0.35s ease;
        position: relative;
        overflow: hidden;
    }
    .cf-submit-btn::before {
        content: '';
        position: absolute;
        inset: 0;
        background: #C9A84C;
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 0.35s ease;
        z-index: -1;
    }
    .cf-submit-btn:hover::before {
        transform: scaleX(1);
    }
    .cf-submit-btn:hover {
        color: #0D0D0D;
        border-color: #C9A84C;
    }
    .cf-submit-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    .cf-submit-btn:disabled::before {
        display: none;
    }

    .cf-error-msg {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        background: rgba(220,38,38,0.08);
        border: 1px solid rgba(220,38,38,0.25);
        border-radius: 2px;
        margin-bottom: 16px;
        font-family: 'Montserrat', sans-serif;
        font-size: 12px;
        color: #FCA5A5;
    }

    .cf-success {
        text-align: center;
        padding: 32px 16px;
    }
    .cf-success-icon {
        margin: 0 auto 20px;
        width: 52px;
        height: 52px;
        border-radius: 50%;
        border: 1.5px solid rgba(74,222,128,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .cf-success h3 {
        font-family: 'Cormorant Garamond', serif;
        font-size: 28px;
        font-weight: 600;
        color: #F5F0E8;
        margin-bottom: 10px;
    }
    .cf-success p {
        font-family: 'Montserrat', sans-serif;
        font-size: 13px;
        font-weight: 300;
        color: rgba(245,240,232,0.5);
        margin-bottom: 24px;
        line-height: 1.6;
    }
    .cf-success button {
        font-family: 'Montserrat', sans-serif;
        font-size: 10px;
        font-weight: 500;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: #C9A84C;
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        text-decoration: underline;
        text-underline-offset: 4px;
    }

    .cf-spinner {
        width: 14px;
        height: 14px;
        border: 2px solid rgba(201,168,76,0.25);
        border-top-color: #C9A84C;
        border-radius: 50%;
        animation: cfSpin 0.6s linear infinite;
        flex-shrink: 0;
    }
    @keyframes cfSpin {
        to { transform: rotate(360deg); }
    }

    @media (prefers-reduced-motion: reduce) {
        .cf-input, .cf-textarea, .cf-bottom-border, .cf-submit-btn::before {
            transition: none !important;
            animation: none !important;
        }
        .cf-spinner { animation: none !important; }
    }
`;

export default function ContactForm() {
    const [formData, setFormData] = useState({ name: "", phone: "", email: "", message: "" });
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const t = useTranslations("contact");

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
                throw new Error(extractApiError(data, "Something went wrong. Please try again."));
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
            <>
                <style dangerouslySetInnerHTML={{ __html: CSS }} />
                <div className="cf-success">
                    <div className="cf-success-icon">
                        <CheckCircle size={24} color="#4ADE80" strokeWidth={1.5} />
                    </div>
                    <h3>{t("messageSent")}</h3>
                    <p>{t("messageSentDesc")}</p>
                    <button onClick={() => setStatus("idle")}>{t("sendAnother")}</button>
                </div>
            </>
        );
    }

    const field = (
        id: string,
        label: string,
        type: string,
        placeholder: string,
        value: string,
        onChange: (v: string) => void,
        required = false
    ) => (
        <div className="cf-field-group">
            <input
                id={id}
                type={type}
                required={required}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder=" "
                className="cf-input"
                style={{ paddingRight: 0 }}
            />
            <label htmlFor={id} className="cf-label">{label}{required ? " *" : ""}</label>
            <div className="cf-bottom-border" />
        </div>
    );

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <form onSubmit={handleSubmit}>
                {field("contact-name", t("name") || "Name", "text", " ", formData.name, v => setFormData(d => ({ ...d, name: v })), true)}
                {field("contact-phone", t("phone") || "Phone", "tel", " ", formData.phone, v => setFormData(d => ({ ...d, phone: v })), true)}
                {field("contact-email", t("email") || "Email", "email", " ", formData.email, v => setFormData(d => ({ ...d, email: v })))}

                <div className="cf-field-group">
                    <textarea
                        id="contact-message"
                        required
                        rows={4}
                        value={formData.message}
                        onChange={e => setFormData(d => ({ ...d, message: e.target.value }))}
                        placeholder=" "
                        className="cf-textarea"
                    />
                    <label htmlFor="contact-message" className="cf-label">
                        {t("message") || "Message"} *
                    </label>
                    <div className="cf-bottom-border" />
                </div>

                {status === "error" && (
                    <div className="cf-error-msg">
                        <AlertCircle size={14} color="#FCA5A5" strokeWidth={1.5} />
                        {errorMsg}
                    </div>
                )}

                <button type="submit" disabled={status === "loading"} className="cf-submit-btn">
                    {status === "loading" ? (
                        <>
                            <div className="cf-spinner" />
                            {t("sending") || "Sending..."}
                        </>
                    ) : (
                        <>
                            <Send size={14} strokeWidth={1.5} />
                            {t("send") || "Send Message"}
                        </>
                    )}
                </button>
            </form>
        </>
    );
}
