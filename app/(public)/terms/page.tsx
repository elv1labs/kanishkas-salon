import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Terms of Service | Kanishka's Family Salon & Academy",
    description: "Terms and conditions for services at Kanishka's Family Salon & Academy, Indore.",
};

export default function TermsPage() {
    return (
        <section className="section-padding bg-cream min-h-screen">
            <div className="container-salon max-w-3xl px-4">
                <div className="mb-10">
                    <span className="section-tag">Legal</span>
                    <h1 className="font-display text-3xl sm:text-4xl font-bold text-espresso mt-2">Terms of Service</h1>
                    <p className="text-charcoal-lighter text-sm mt-3">Last updated: April 2025</p>
                </div>

                <div className="prose prose-sm max-w-none text-charcoal space-y-8">
                    <div>
                        <h2 className="font-display text-xl font-semibold text-espresso mb-3">1. Appointments & Bookings</h2>
                        <p className="text-charcoal-lighter leading-relaxed">All appointments are subject to availability. We request at least 4 hours notice for cancellations. Late arrivals beyond 15 minutes may result in a shortened service or rescheduling at our discretion. No-shows may be subject to a cancellation fee.</p>
                    </div>

                    <div>
                        <h2 className="font-display text-xl font-semibold text-espresso mb-3">2. Services & Pricing</h2>
                        <p className="text-charcoal-lighter leading-relaxed">All service prices are inclusive of applicable taxes. Prices are subject to change without prior notice. Final pricing may vary depending on hair length, texture, and additional requirements discussed during consultation.</p>
                    </div>

                    <div>
                        <h2 className="font-display text-xl font-semibold text-espresso mb-3">3. Products & Orders</h2>
                        <p className="text-charcoal-lighter leading-relaxed">All product sales are final unless the product is received in damaged condition. Shipping timelines are estimates and may vary. For queries, contact us within 48 hours of receiving your order.</p>
                    </div>

                    <div>
                        <h2 className="font-display text-xl font-semibold text-espresso mb-3">4. Gift Vouchers</h2>
                        <p className="text-charcoal-lighter leading-relaxed">Gift vouchers are non-refundable and non-transferable. They are valid for 12 months from the date of issue and must be redeemed at our salon. Lost or stolen vouchers will not be replaced.</p>
                    </div>

                    <div>
                        <h2 className="font-display text-xl font-semibold text-espresso mb-3">5. Academy Courses</h2>
                        <p className="text-charcoal-lighter leading-relaxed">Course fees are non-refundable once the course has commenced. Course schedules are subject to change. All enrolled students must adhere to our code of conduct throughout the course duration.</p>
                    </div>

                    <div>
                        <h2 className="font-display text-xl font-semibold text-espresso mb-3">6. Liability</h2>
                        <p className="text-charcoal-lighter leading-relaxed">Kanishka's Family Salon & Academy is not liable for any allergic reactions arising from treatments where a pre-treatment patch test was offered but declined by the client. Please inform our staff of any known allergies before your appointment.</p>
                    </div>

                    <div>
                        <h2 className="font-display text-xl font-semibold text-espresso mb-3">7. Contact</h2>
                        <p className="text-charcoal-lighter leading-relaxed">For any questions regarding these terms, contact us at <a href="mailto:kanishkasen100@gmail.com" className="text-gold hover:underline">kanishkasen100@gmail.com</a> or call <a href="tel:+919171230292" className="text-gold hover:underline">+91 91712 30292</a>.</p>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-cream-darker/50 flex gap-6 text-sm">
                    <Link href="/privacy" className="text-gold hover:underline">Privacy Policy</Link>
                    <Link href="/" className="text-charcoal-lighter hover:text-gold">← Back to Home</Link>
                </div>
            </div>
        </section>
    );
}
