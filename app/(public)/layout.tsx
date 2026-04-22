import Header from "@/components/layout/Header";
import SessionProvider from "@/components/providers/SessionProvider";
import ScrollAnimator from "@/components/ui/ScrollAnimator";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import { CartProvider } from "@/contexts/CartContext";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
        <CartProvider>
        <>
            <Header />

            <main className="min-h-screen">{children}</main>

            <Footer />

            <WhatsAppButton />

            <ScrollAnimator />
        </>
        </CartProvider>
        </SessionProvider>
    );
}
