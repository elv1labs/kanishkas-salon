import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Sitemap | Kanishka's Family Salon & Academy",
    description: "Full sitemap of Kanishka's Family Salon & Academy website.",
};

const sitemapSections = [
    {
        title: "Main Pages",
        links: [
            { label: "Home", href: "/" },
            { label: "About Us", href: "/about" },
            { label: "Gallery", href: "/gallery" },
            { label: "Blog", href: "/blog" },
            { label: "Contact Us", href: "/contact" },
        ],
    },
    {
        title: "Services",
        links: [
            { label: "All Services", href: "/services" },
            { label: "Hair Styling", href: "/services?cat=HAIR_STYLING" },
            { label: "Skin Care", href: "/services?cat=SKIN_CARE" },
            { label: "Bridal Makeup", href: "/services?cat=BRIDAL" },
            { label: "Nail Art", href: "/services?cat=NAIL_CARE" },
            { label: "Waxing & Threading", href: "/services?cat=WAXING" },
            { label: "Academy", href: "/services?cat=ACADEMY" },
        ],
    },
    {
        title: "Shop",
        links: [
            { label: "All Products", href: "/products" },
            { label: "Hair Care", href: "/products?category=HAIR_CARE" },
            { label: "Makeup & Cosmetics", href: "/products?category=MAKEUP_COSMETICS" },
            { label: "Skin Care", href: "/products?category=SKIN_CARE" },
            { label: "Nail Care", href: "/products?category=NAIL_CARE" },
        ],
    },
    {
        title: "Account",
        links: [
            { label: "Book Appointment", href: "/book" },
            { label: "Login", href: "/login" },
            { label: "Register", href: "/register" },
            { label: "My Appointments", href: "/dashboard/client/appointments" },
        ],
    },
    {
        title: "Legal",
        links: [
            { label: "Privacy Policy", href: "/privacy" },
            { label: "Terms of Service", href: "/terms" },
        ],
    },
];

export default function SitemapPage() {
    return (
        <section className="section-padding bg-cream min-h-screen">
            <div className="container-salon max-w-4xl px-4">
                <div className="mb-12">
                    <span className="section-tag">Navigation</span>
                    <h1 className="font-display text-3xl sm:text-4xl font-bold text-espresso mt-2">Sitemap</h1>
                    <p className="text-charcoal-lighter mt-3">A complete overview of all pages on our website.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {sitemapSections.map((section) => (
                        <div key={section.title}>
                            <h2 className="font-display text-lg font-semibold text-espresso mb-4 pb-2 border-b border-cream-darker/50">
                                {section.title}
                            </h2>
                            <ul className="space-y-2.5">
                                {section.links.map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className="text-charcoal-lighter text-sm hover:text-gold transition-colors flex items-center gap-2"
                                        >
                                            <span className="text-gold text-xs">→</span>
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-12 pt-8 border-t border-cream-darker/50">
                    <Link href="/" className="text-charcoal-lighter text-sm hover:text-gold">← Back to Home</Link>
                </div>
            </div>
        </section>
    );
}
