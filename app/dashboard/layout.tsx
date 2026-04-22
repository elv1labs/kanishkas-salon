import SessionProvider from "@/components/providers/SessionProvider";
import DashboardLayout from "@/components/layout/DashboardLayout";

export const metadata = {
    title: {
        template: "%s | Dashboard — Kanishka's Salon",
        default: "Dashboard — Kanishka's Family Salon & Academy",
    },
};

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <DashboardLayout>{children}</DashboardLayout>
        </SessionProvider>
    );
}
