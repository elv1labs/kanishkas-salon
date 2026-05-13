import type { Metadata } from "next";
import Link from "next/link";
import { Phone, Mail, MapPin, Clock, Send } from "lucide-react";
import { getTranslations } from "next-intl/server";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
    title: "Contact Us",
    description:
        "Get in touch with Kanishka's Family Salon & Academy. Book appointments, send enquiries, or visit us at Anand Bazar, Indore. Open 7 days, 10AM–9PM.",
};

const hours = [
    { day: "Monday",    time: "10:00 AM – 9:00 PM" },
    { day: "Tuesday",   time: "10:00 AM – 9:00 PM" },
    { day: "Wednesday",time: "10:00 AM – 9:00 PM" },
    { day: "Thursday",  time: "10:00 AM – 9:00 PM" },
    { day: "Friday",    time: "10:00 AM – 9:00 PM" },
    { day: "Saturday",  time: "10:00 AM – 9:00 PM" },
    { day: "Sunday",    time: "10:00 AM – 9:00 PM" },
];

export default async function ContactPage() {
    const t = await getTranslations("contact");
    return (
        <>
            {/* ── HERO ── */}
            <section style={{
                position: "relative",
                minHeight: "60dvh",
                display: "flex",
                alignItems: "flex-end",
                background: "#0D0D0D",
                overflow: "hidden",
            }}>
                <div style={{
                    position: "absolute", inset: 0,
                    background: "radial-gradient(ellipse at 40% 30%, rgba(201,168,76,0.05) 0%, transparent 55%), radial-gradient(ellipse at 80% 70%, rgba(201,168,76,0.03) 0%, transparent 50%)",
                }} />
                <div style={{
                    position: "relative",
                    zIndex: 2,
                    padding: "clamp(32px, 6vw, 80px)",
                    width: "100%",
                }}>
                    <div style={{ maxWidth: 700 }}>
                        <p style={{
                            fontFamily: "'Montserrat', sans-serif",
                            fontSize: 11,
                            fontWeight: 500,
                            letterSpacing: "0.3em",
                            textTransform: "uppercase",
                            color: "#C9A84C",
                            marginBottom: 20,
                        }}>
                            {t("heroTag") || "GET IN TOUCH"}
                        </p>
                        <h1 style={{
                            fontFamily: "'Cormorant Garamond', serif",
                            fontSize: "clamp(52px, 8vw, 100px)",
                            fontWeight: 600,
                            color: "#F5F0E8",
                            lineHeight: 1.0,
                            letterSpacing: "-0.025em",
                            margin: 0,
                        }}>
                            {t("heroTitle") || "Contact Us"}
                        </h1>
                        <div style={{
                            height: 1.5,
                            background: "linear-gradient(90deg, #C9A84C, #E2C97E)",
                            marginTop: 20,
                            boxShadow: "0 0 12px rgba(201,168,76,0.4)",
                        }} />
                        <p style={{
                            fontFamily: "'Montserrat', sans-serif",
                            fontSize: 16,
                            fontWeight: 300,
                            color: "rgba(245,240,232,0.6)",
                            lineHeight: 1.65,
                            marginTop: 20,
                            maxWidth: 460,
                        }}>
                            {t("heroDesc") || "We'd love to hear from you. Book an appointment or send us a message."}
                        </p>
                    </div>
                </div>
            </section>

            {/* ── MAP + FORM ── */}
            <section style={{
                background: "#0D0D0D",
                padding: "clamp(48px, 8vw, 96px) clamp(16px, 5vw, 80px)",
                borderTop: "1px solid #2A2A2A",
            }}>
                <div style={{
                    maxWidth: 1320,
                    margin: "0 auto",
                    display: "grid",
                    gridTemplateColumns: "1fr 1.2fr",
                    gap: "clamp(24px, 4vw, 60px)",
                    alignItems: "start",
                }}>
                    {/* Map */}
                    <div style={{
                        borderRadius: 2,
                        overflow: "hidden",
                        border: "1px solid #2A2A2A",
                        position: "sticky",
                        top: 100,
                    }}>
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3680.123456789!2d75.8577!3d22.7196!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sAnand+Bazar%2C+Baikunth+Dham%2C+Indore!5e0!3m2!1sen!2sin!4v1234567890"
                            width="100%"
                            height="480"
                            style={{ border: 0, display: "block", filter: "brightness(0.7) saturate(0.6) hue-rotate(10deg)" }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Kanishka's Family Salon Location"
                        />
                    </div>

                    {/* Contact Form */}
                    <div style={{
                        background: "#1A1A1A",
                        border: "1px solid #2A2A2A",
                        borderRadius: 2,
                        padding: "clamp(24px, 4vw, 48px)",
                    }}>
                        <p style={{
                            fontFamily: "'Montserrat', sans-serif",
                            fontSize: 10,
                            fontWeight: 600,
                            letterSpacing: "0.35em",
                            textTransform: "uppercase",
                            color: "#C9A84C",
                            marginBottom: 12,
                        }}>
                            {t("sendUsMessage") || "Send Us a Message"}
                        </p>
                        <h2 style={{
                            fontFamily: "'Cormorant Garamond', serif",
                            fontSize: "clamp(26px, 3vw, 38px)",
                            fontWeight: 600,
                            color: "#F5F0E8",
                            lineHeight: 1.15,
                            letterSpacing: "-0.01em",
                            marginBottom: 24,
                        }}>
                            {t("sendUsMessage") || "Send Us a Message"}
                        </h2>
                        <div style={{
                            height: 1.5,
                            background: "linear-gradient(90deg, #C9A84C, #E2C97E40)",
                            width: 60,
                            marginBottom: 32,
                        }} />
                        <ContactForm />
                    </div>
                </div>
            </section>

            {/* ── INFO PANELS ── */}
            <section style={{
                background: "#141414",
                padding: "clamp(48px, 8vw, 96px) clamp(16px, 5vw, 80px)",
                borderTop: "1px solid #2A2A2A",
            }}>
                <div style={{
                    maxWidth: 1320,
                    margin: "0 auto",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "clamp(16px, 3vw, 32px)",
                }}>
                    {/* Address / NAP */}
                    <div>
                        <p style={{
                            fontFamily: "'Montserrat', sans-serif",
                            fontSize: 10,
                            fontWeight: 600,
                            letterSpacing: "0.35em",
                            textTransform: "uppercase",
                            color: "#C9A84C",
                            marginBottom: 20,
                        }}>
                            {t("visitUs") || "Visit Us"}
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                            {[
                                { icon: MapPin, label: t("address") || "Address", lines: ["Anand Bazar, Baikunth Dham", "Indore, Madhya Pradesh 452001"] },
                                { icon: Phone, label: t("phone") || "Phone", lines: ["+91 9171230292"], href: "tel:+919171230292" },
                                { icon: Mail, label: t("email") || "Email", lines: ["kanishkasen100@gmail.com"], href: "mailto:kanishkasen100@gmail.com" },
                            ].map(({ icon: Icon, label, lines, href }, i) => (
                                <div key={i}>
                                    <div style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: 16,
                                        paddingBottom: 20,
                                        borderBottom: "1px solid #2A2A2A",
                                    }}>
                                        <div style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: "50%",
                                            border: "1px solid rgba(201,168,76,0.25)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                        }}>
                                            <Icon size={15} color="#C9A84C" strokeWidth={1.5} />
                                        </div>
                                        <div>
                                            <p style={{
                                                fontFamily: "'Montserrat', sans-serif",
                                                fontSize: 10,
                                                fontWeight: 500,
                                                letterSpacing: "0.15em",
                                                textTransform: "uppercase",
                                                color: "rgba(245,240,232,0.4)",
                                                marginBottom: 4,
                                            }}>
                                                {label}
                                            </p>
                                            {href ? (
                                                <Link
                                                    href={href}
                                                    style={{
                                                        fontFamily: "'Montserrat', sans-serif",
                                                        fontSize: 13,
                                                        fontWeight: 300,
                                                        color: "#F5F0E8",
                                                        textDecoration: "none",
                                                        lineHeight: 1.6,
                                                        transition: "color 0.25s ease",
                                                    }}
                                                >
                                                    {lines[0]}
                                                </Link>
                                            ) : (
                                                <p style={{
                                                    fontFamily: "'Montserrat', sans-serif",
                                                    fontSize: 13,
                                                    fontWeight: 300,
                                                    color: "#F5F0E8",
                                                    lineHeight: 1.6,
                                                }}>
                                                    {lines.join(", ")}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Business Hours */}
                    <div>
                        <p style={{
                            fontFamily: "'Montserrat', sans-serif",
                            fontSize: 10,
                            fontWeight: 600,
                            letterSpacing: "0.35em",
                            textTransform: "uppercase",
                            color: "#C9A84C",
                            marginBottom: 20,
                        }}>
                            {t("businessHours") || "Business Hours"}
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                            {hours.map((h, i) => (
                                <div key={h.day} style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "12px 0",
                                    borderBottom: i < hours.length - 1 ? "1px solid #2A2A2A" : "none",
                                }}>
                                    <span style={{
                                        fontFamily: "'Montserrat', sans-serif",
                                        fontSize: 13,
                                        fontWeight: 400,
                                        color: "#F5F0E8",
                                    }}>
                                        {h.day}
                                    </span>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <Clock size={11} color="rgba(201,168,76,0.6)" strokeWidth={1.5} />
                                        <span style={{
                                            fontFamily: "'Montserrat', sans-serif",
                                            fontSize: 12,
                                            fontWeight: 300,
                                            color: "rgba(245,240,232,0.5)",
                                        }}>
                                            {h.time}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div>
                        <p style={{
                            fontFamily: "'Montserrat', sans-serif",
                            fontSize: 10,
                            fontWeight: 600,
                            letterSpacing: "0.35em",
                            textTransform: "uppercase",
                            color: "#C9A84C",
                            marginBottom: 20,
                        }}>
                            {t("quickConnect") || "Quick Connect"}
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <Link
                                href="https://wa.me/919171230292?text=Hi%2C%20I'd%20like%20to%20book%20an%20appointment"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 14,
                                    padding: "14px 16px",
                                    background: "rgba(37,211,102,0.06)",
                                    border: "1px solid rgba(37,211,102,0.15)",
                                    borderRadius: 2,
                                    textDecoration: "none",
                                    transition: "background 0.25s ease, border-color 0.25s ease",
                                }}
                            >
                                <div style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: "50%",
                                    background: "#25D366",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.296-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                    </svg>
                                </div>
                                <div>
                                    <p style={{
                                        fontFamily: "'Montserrat', sans-serif",
                                        fontSize: 12,
                                        fontWeight: 500,
                                        color: "#F5F0E8",
                                        marginBottom: 2,
                                    }}>
                                        WhatsApp
                                    </p>
                                    <p style={{
                                        fontFamily: "'Montserrat', sans-serif",
                                        fontSize: 11,
                                        color: "rgba(245,240,232,0.5)",
                                    }}>
                                        {t("chatWithUs") || "Chat with us directly"}
                                    </p>
                                </div>
                            </Link>

                            <Link
                                href="tel:+919171230292"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 14,
                                    padding: "14px 16px",
                                    background: "rgba(201,168,76,0.06)",
                                    border: "1px solid rgba(201,168,76,0.2)",
                                    borderRadius: 2,
                                    textDecoration: "none",
                                    transition: "background 0.25s ease, border-color 0.25s ease",
                                }}
                            >
                                <div style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: "50%",
                                    background: "#C9A84C",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}>
                                    <Phone size={15} color="#0D0D0D" strokeWidth={1.5} />
                                </div>
                                <div>
                                    <p style={{
                                        fontFamily: "'Montserrat', sans-serif",
                                        fontSize: 12,
                                        fontWeight: 500,
                                        color: "#F5F0E8",
                                        marginBottom: 2,
                                    }}>
                                        {t("callUs") || "Call Us"}
                                    </p>
                                    <p style={{
                                        fontFamily: "'Montserrat', sans-serif",
                                        fontSize: 11,
                                        color: "rgba(245,240,232,0.5)",
                                    }}>
                                        +91 9171230292
                                    </p>
                                </div>
                            </Link>

                            <Link
                                href="mailto:kanishkasen100@gmail.com"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 14,
                                    padding: "14px 16px",
                                    background: "rgba(183,110,121,0.06)",
                                    border: "1px solid rgba(183,110,121,0.2)",
                                    borderRadius: 2,
                                    textDecoration: "none",
                                    transition: "background 0.25s ease, border-color 0.25s ease",
                                }}
                            >
                                <div style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: "50%",
                                    background: "#B76E79",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}>
                                    <Mail size={15} color="white" strokeWidth={1.5} />
                                </div>
                                <div>
                                    <p style={{
                                        fontFamily: "'Montserrat', sans-serif",
                                        fontSize: 12,
                                        fontWeight: 500,
                                        color: "#F5F0E8",
                                        marginBottom: 2,
                                    }}>
                                        {t("emailUs") || "Email Us"}
                                    </p>
                                    <p style={{
                                        fontFamily: "'Montserrat', sans-serif",
                                        fontSize: 11,
                                        color: "rgba(245,240,232,0.5)",
                                    }}>
                                        kanishkasen100@gmail.com
                                    </p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
