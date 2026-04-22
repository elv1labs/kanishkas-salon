import type { Metadata } from "next";
import Link from "next/link";
import { Phone, Mail, MapPin, Clock, Send } from "lucide-react";
import MotionWrapper from "@/components/ui/MotionWrapper";
import SectionHeading from "@/components/ui/SectionHeading";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
    title: "Contact Us",
    description:
        "Get in touch with Kanishka's Family Salon & Academy. Book appointments, send enquiries, or visit us at Anand Bazar, Indore. Open 7 days, 10AM–9PM.",
};

const hours = [
    { day: "Monday", time: "10:00 AM – 9:00 PM" },
    { day: "Tuesday", time: "10:00 AM – 9:00 PM" },
    { day: "Wednesday", time: "10:00 AM – 9:00 PM" },
    { day: "Thursday", time: "10:00 AM – 9:00 PM" },
    { day: "Friday", time: "10:00 AM – 9:00 PM" },
    { day: "Saturday", time: "10:00 AM – 9:00 PM" },
    { day: "Sunday", time: "10:00 AM – 9:00 PM" },
];

export default function ContactPage() {
    return (
        <>
            {/* Hero */}
            <section className="relative py-32 sm:py-40 bg-espresso overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-espresso/80 to-espresso" />
                <div className="absolute bottom-10 right-10 w-72 h-72 rounded-full bg-gold/5 blur-3xl" />
                <div className="relative z-10 container-salon text-center px-4">
                    <MotionWrapper>
                        <span className="font-accent text-sm uppercase tracking-[0.3em] text-gold mb-4 block">
                            Get In Touch
                        </span>
                        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-cream mb-4">
                            Contact Us
                        </h1>
                        <p className="font-body text-cream/60 max-w-xl mx-auto">
                            We&apos;d love to hear from you. Book an appointment or send us a message.
                        </p>
                    </MotionWrapper>
                </div>
            </section>

            {/* Map + Form */}
            <section className="section-padding bg-cream">
                <div className="container-salon">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Google Maps */}
                        <MotionWrapper>
                            <div className="rounded-sm overflow-hidden shadow-md h-full min-h-[400px]">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3680.123456789!2d75.8577!3d22.7196!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sAnand+Bazar%2C+Baikunth+Dham%2C+Indore!5e0!3m2!1sen!2sin!4v1234567890"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0, minHeight: "400px" }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="Kanishka's Family Salon Location - Anand Bazar, Indore"
                                />
                            </div>
                        </MotionWrapper>

                        {/* Contact Form */}
                        <MotionWrapper delay={0.2}>
                            <div className="card-luxury p-8">
                                <h2 className="font-display text-2xl font-bold text-espresso mb-2">
                                    Send Us a Message
                                </h2>
                                <div className="gold-line mb-6" />
                                <ContactForm />
                            </div>
                        </MotionWrapper>
                    </div>
                </div>
            </section>

            {/* Contact Info + Hours */}
            <section className="section-padding bg-white">
                <div className="container-salon">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* NAP */}
                        <MotionWrapper>
                            <div className="card-luxury p-8 h-full">
                                <h3 className="font-display text-xl font-semibold text-espresso mb-4">
                                    Visit Us
                                </h3>
                                <div className="gold-line mb-6" />
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3">
                                        <MapPin size={18} className="text-gold mt-0.5 shrink-0" />
                                        <div>
                                            <p className="font-semibold text-espresso text-sm">Address</p>
                                            <p className="text-sm text-charcoal-lighter">
                                                Anand Bazar, Baikunth Dham,
                                                <br />
                                                Indore, Madhya Pradesh 452001
                                            </p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Phone size={18} className="text-gold mt-0.5 shrink-0" />
                                        <div>
                                            <p className="font-semibold text-espresso text-sm">Phone</p>
                                            <Link
                                                href="tel:+919171230292"
                                                className="text-sm text-charcoal-lighter hover:text-gold transition-colors"
                                            >
                                                +91 9171230292
                                            </Link>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Mail size={18} className="text-gold mt-0.5 shrink-0" />
                                        <div>
                                            <p className="font-semibold text-espresso text-sm">Email</p>
                                            <Link
                                                href="mailto:kanishkasen100@gmail.com"
                                                className="text-sm text-charcoal-lighter hover:text-gold transition-colors"
                                            >
                                                kanishkasen100@gmail.com
                                            </Link>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </MotionWrapper>

                        {/* Business Hours */}
                        <MotionWrapper delay={0.1}>
                            <div className="card-luxury p-8 h-full">
                                <h3 className="font-display text-xl font-semibold text-espresso mb-4">
                                    Business Hours
                                </h3>
                                <div className="gold-line mb-6" />
                                <table className="w-full text-sm">
                                    <tbody>
                                        {hours.map((h) => (
                                            <tr key={h.day} className="border-b border-cream-darker/30 last:border-0">
                                                <td className="py-2.5 font-medium text-espresso">{h.day}</td>
                                                <td className="py-2.5 text-right text-charcoal-lighter">
                                                    <Clock size={12} className="inline mr-1.5 text-gold" />
                                                    {h.time}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </MotionWrapper>

                        {/* Quick Actions */}
                        <MotionWrapper delay={0.2}>
                            <div className="card-luxury p-8 h-full flex flex-col">
                                <h3 className="font-display text-xl font-semibold text-espresso mb-4">
                                    Quick Connect
                                </h3>
                                <div className="gold-line mb-6" />
                                <div className="space-y-4 flex-1">
                                    <Link
                                        href="https://wa.me/919171230292?text=Hi%2C%20I'd%20like%20to%20book%20an%20appointment"
                                        target="_blank"
                                        className="flex items-center gap-3 p-4 bg-[#25D366]/10 rounded-sm hover:bg-[#25D366]/20 transition-colors"
                                    >
                                        <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center">
                                            <Send size={16} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-espresso text-sm">WhatsApp</p>
                                            <p className="text-xs text-charcoal-lighter">Chat with us directly</p>
                                        </div>
                                    </Link>

                                    <Link
                                        href="tel:+919171230292"
                                        className="flex items-center gap-3 p-4 bg-gold/5 rounded-sm hover:bg-gold/10 transition-colors"
                                    >
                                        <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center">
                                            <Phone size={16} className="text-espresso" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-espresso text-sm">Call Us</p>
                                            <p className="text-xs text-charcoal-lighter">+91 9171230292</p>
                                        </div>
                                    </Link>

                                    <Link
                                        href="mailto:kanishkasen100@gmail.com"
                                        className="flex items-center gap-3 p-4 bg-rose-gold/5 rounded-sm hover:bg-rose-gold/10 transition-colors"
                                    >
                                        <div className="w-10 h-10 bg-rose-gold rounded-full flex items-center justify-center">
                                            <Mail size={16} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-espresso text-sm">Email Us</p>
                                            <p className="text-xs text-charcoal-lighter">kanishkasen100@gmail.com</p>
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        </MotionWrapper>
                    </div>
                </div>
            </section>
        </>
    );
}
