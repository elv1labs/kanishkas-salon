// app/(auth)/layout.tsx
// Centered auth layout — no header/footer, premium background

import { getTranslations } from "next-intl/server";

export const metadata = {
    title: {
        template: "%s | Kanishka's Family Salon & Academy",
        default: "Sign In | Kanishka's Family Salon & Academy",
    },
};

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
    const t = await getTranslations("auth");

    return (
        <div className="min-h-screen bg-espresso flex items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-20 left-20 w-96 h-96 rounded-full bg-gold/5 blur-3xl" />
                <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-rose-gold/5 blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold/3 blur-[100px]" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <a href="/" className="inline-block">
                        <h1 className="font-display text-3xl text-cream">
                            <span className="text-gold">Kanishka&apos;s</span>
                        </h1>
                        <p className="font-accent text-xs uppercase tracking-[0.3em] text-cream/40 mt-1">
                            {t("salonAndAcademy")}
                        </p>
                    </a>
                </div>

                {children}
            </div>
        </div>
    );
}
