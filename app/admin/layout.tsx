import SessionProvider from "@/components/providers/SessionProvider";
import AdminSidebarLayout from "@/components/admin/AdminSidebar";

export const metadata = {
    title: {
        template: "%s | Admin — Kanishka's Salon",
        default: "Admin Panel — Kanishka's Family Salon & Academy",
    },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <AdminSidebarLayout>{children}</AdminSidebarLayout>
        </SessionProvider>
    );
}
