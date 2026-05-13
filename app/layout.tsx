import type { Metadata } from "next";
import PWARegister from "@/components/ui/PWARegister";
import { Playfair_Display, DM_Sans, Cormorant_Garamond, Montserrat } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";

const playfair = Playfair_Display({
    subsets: ["latin"],
    variable: "--font-playfair",
    display: "swap",
});

const dmSans = DM_Sans({
    subsets: ["latin"],
    variable: "--font-dm-sans",
    display: "swap",
});

const cormorant = Cormorant_Garamond({
    subsets: ["latin"],
    variable: "--font-cormorant",
    weight: ["300", "400", "500", "600", "700"],
    style: ["normal", "italic"],
    display: "swap",
});

const montserrat = Montserrat({
    subsets: ["latin"],
    variable: "--font-montserrat",
    weight: ["300", "400", "500", "600", "700"],
    display: "swap",
});


export const viewport = {
  viewportFit: 'cover',
  themeColor: '#1A1A1A',
};
export const metadata: Metadata = {
    metadataBase: new URL("https://www.kanishkasacademy.com"),
    manifest: "/manifest.json",
    title: {
        default: "Kanishka's Family Salon & Academy | Premium Salon in Indore",
        template: "%s | Kanishka's Family Salon & Academy",
    },
    description:
        "Step into a world of beauty & luxury at Kanishka's Family Salon & Academy, Anand Bazar, Indore. Expert hair, skin, makeup, nails, bridal services & professional beauty courses. Book now!",
    keywords: [
        "salon in Indore",
        "beauty salon Indore",
        "hair salon Indore",
        "bridal makeup Indore",
        "Kanishka salon",
        "beauty academy Indore",
        "nail art Indore",
        "skin care Indore",
    ],
    authors: [{ name: "Kanishka Sen" }],
    creator: "Kanishka's Family Salon & Academy",
    // ── iOS PWA (Add to Home Screen) ─────────────────────────────────────
    appleWebApp: {
        capable: true,
        title: "KFS Salon",
        statusBarStyle: "black-translucent",
        startupImage: [
            // iPhone 14 Pro Max (430 × 932)
            { url: "/icons/splash-430x932.png", media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" },
            // iPhone 14 / 13 / 12 (390 × 844)
            { url: "/icons/splash-390x844.png", media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" },
            // iPhone SE / 8 (375 × 667)
            { url: "/icons/splash-375x667.png", media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" },
        ],
    },
    // ── Open Graph ────────────────────────────────────────────────────────
    openGraph: {
        type: "website",
        locale: "en_IN",
        url: "https://www.kanishkasacademy.com",
        siteName: "Kanishka's Family Salon & Academy",
        title: "Kanishka's Family Salon & Academy | Premium Salon in Indore",
        description:
            "Step into a world of beauty & luxury. Expert hair, skin, makeup, nails, bridal services & professional beauty courses in Indore.",
        images: [{ url: "/icons/icon-512.png", width: 512, height: 512, alt: "Kanishka's Salon" }],
    },
    // ── Twitter ───────────────────────────────────────────────────────────
    twitter: {
        card: "summary",
        title: "Kanishka's Family Salon & Academy",
        description: "Premium salon & beauty academy in Indore. Book appointments online.",
    },
    robots: {
        index: true,
        follow: true,
    },
    // ── Icons ─────────────────────────────────────────────────────────────
    icons: {
        icon: [
            { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
            { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
        apple: [
            { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
        ],
        shortcut: "/icons/icon-192.png",
    },
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const locale = await getLocale();
    const messages = await getMessages();

    return (
        <html
            lang={locale}
            className={`${playfair.variable} ${dmSans.variable} ${cormorant.variable} ${montserrat.variable}`}
        >
            <head>
                {/* ── Performance: Preconnect & DNS Prefetch ─────────────────── */}
                <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
                <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
                <link rel="dns-prefetch" href="https://images.unsplash.com" />
                <link rel="dns-prefetch" href="https://www.google.com" />
                <link rel="dns-prefetch" href="https://maps.googleapis.com" />
            </head>
            <body>
                <NextIntlClientProvider messages={messages}>
                    {children}
                </NextIntlClientProvider>
                <PWARegister />
            </body>
        </html>
    );
}
