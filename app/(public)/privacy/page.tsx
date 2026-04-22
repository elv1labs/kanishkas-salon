import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Privacy Policy | Kanishka's Family Salon & Academy",
    description: "Privacy Policy for Kanishka's Family Salon & Academy, Indore.",
};

export default function PrivacyPage() {
    return (
        <section className="section-padding bg-cream min-h-screen">
            <div className="container-salon max-w-3xl px-4">
                <div className="mb-10">
                    <span className="section-tag">Legal</span>
                    <h1 className="font-display text-3xl sm:text-4xl font-bold text-espresso mt-2">Privacy Policy</h1>
                    <p className="text-charcoal-lighter text-sm mt-3">Last updated: April 2025</p>
                </div>

                <div className="prose prose-sm max-w-none text-charcoal space-y-8">
                    <div>
                        <h2 className="font-display text-xl font-semibold text-espresso mb-3">1. Information We Collect</h2>
                        <p className="text-charcoal-lighter leading-relaxed">When you book an appointment, create an account, or contact us, we may collect your name, phone number, email address, and appointment details. We do not collect payment card information — all payments are processed via UPI or cash at our salon.</p>
                    </div>

                    <div>
                        <h2 className="font-display text-xl font-semibold text-espresso mb-3">2. How We Use Your Information</h2>
                        <p className="text-charcoal-lighter leading-relaxed">We use the information collected to confirm and manage your appointments, send appointment reminders, respond to enquiries, and occasionally send beauty tips or promotional offers (only if you have subscribed). We do not sell or share your personal information with third parties.</p>
                    </div>

                    <div>
                        <h2 className="font-display text-xl font-semibold text-espresso mb-3">3. Data Storage & Security</h2>
                        <p className="text-charcoal-lighter leading-relaxed">Your data is stored securely on our servers. We implement industry-standard security measures to protect your personal information from unauthorised access, disclosure, or misuse.</p>
                    </div>

                    <div>
                        <h2 className="font-display text-xl font-semibold text-espresso mb-3">4. Cookies</h2>
                        <p className="text-charcoal-lighter leading-relaxed">Our website uses essential cookies to maintain your session and shopping cart. We do not use third-party advertising cookies.</p>
                    </div>

                    <div>
                        <h2 className="font-display text-xl font-semibold text-espresso mb-3">5. Your Rights</h2>
                        <p className="text-charcoal-lighter leading-relaxed">You may request access to, correction of, or deletion of your personal data at any time by contacting us at <a href="mailto:kanishkasen100@gmail.com" className="text-gold hover:underline">kanishkasen100@gmail.com</a>.</p>
                    </div>

                    <div>
                        <h2 className="font-display text-xl font-semibold text-espresso mb-3">6. Contact</h2>
                        <p className="text-charcoal-lighter leading-relaxed">For any privacy-related questions, please contact us at <strong>Kanishka's Family Salon & Academy</strong>, Anand Bazar, Baikunth Dham, Indore, Madhya Pradesh 452001, or call <a href="tel:+919171230292" className="text-gold hover:underline">+91 91712 30292</a>.</p>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-cream-darker/50 flex gap-6 text-sm">
                    <Link href="/terms" className="text-gold hover:underline">Terms of Service</Link>
                    <Link href="/" className="text-charcoal-lighter hover:text-gold">← Back to Home</Link>
                </div>
            </div>
        </section>
    );
}
