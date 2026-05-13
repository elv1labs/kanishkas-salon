import { BarChart3, Calendar, GraduationCap, Package, ShoppingBag, TrendingUp, Users, FileText, Scissors } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import MetricsPanel from "@/components/dashboard/MetricsPanel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Owner Dashboard" };

async function getStats() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [todayAppts, pendingOrders, totalClients, todayRevenue, pendingEnrollments, totalServices, activeProducts, totalStaff] = await Promise.all([
            prisma.appointment.count({ where: { date: { gte: today, lt: tomorrow } } }),
            prisma.order.count({ where: { status: "PENDING" } }),
            prisma.user.count({ where: { role: "CLIENT", isActive: true } }),
            prisma.appointment.aggregate({
                where: { date: { gte: today, lt: tomorrow }, status: "COMPLETED" },
                _sum: { totalAmount: true },
            }),
            prisma.courseEnrollment.count({ where: { status: "SUBMITTED" } }),
            prisma.service.count(),
            prisma.product.count({ where: { isActive: true } }),
            prisma.user.count({ where: { role: { in: ["RECEPTIONIST"] }, isActive: true } }),
        ]);
        return {
            todayAppts,
            pendingOrders,
            totalClients,
            todayRevenue: todayRevenue._sum.totalAmount || 0,
            pendingEnrollments,
            totalServices,
            activeProducts,
            totalStaff,
            error: false,
        };
    } catch (e) {
        console.error("[OwnerDashboard] getStats failed:", e);
        return { todayAppts: 0, pendingOrders: 0, totalClients: 0, todayRevenue: 0, pendingEnrollments: 0, totalServices: 0, activeProducts: 0, totalStaff: 0, error: true };
    }
}

export default async function OwnerDashboard() {
    const stats = await getStats();
    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-espresso to-espresso-50 rounded-sm p-6 text-cream">
                <h1 className="font-display text-2xl mb-1">Business Overview</h1>
                <p className="text-cream/60 text-sm">Monitor revenue, manage content, and track salon performance.</p>
            </div>

            {/* Metric cards — client component owns refresh + error/empty UX */}
            <MetricsPanel stats={{
                todayRevenue: Number(stats.todayRevenue),
                todayAppts: stats.todayAppts,
                pendingOrders: stats.pendingOrders,
                totalClients: stats.totalClients,
                totalServices: stats.totalServices,
                activeProducts: stats.activeProducts,
                totalStaff: stats.totalStaff,
                error: stats.error,
            }} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { icon: <BarChart3 size={22} />, title: "Revenue Analytics", desc: "View sales reports and trends", href: "/dashboard/owner/revenue" },
                    { icon: <FileText size={22} />, title: "Content Manager", desc: "Blog, gallery and site content", href: "/dashboard/owner/content" },
                    { icon: <Package size={22} />, title: "Product Inventory", desc: "Manage products and stock", href: "/dashboard/owner/products" },
                    { icon: <Calendar size={22} />, title: "Appointments", desc: "View all bookings", href: "/dashboard/owner/appointments" },
                    { icon: <ShoppingBag size={22} />, title: "Orders", desc: "Manage customer orders", href: "/dashboard/owner/orders" },
                    { icon: <Users size={22} />, title: "Clients", desc: "View client profiles", href: "/dashboard/receptionist/clients" },
                    { icon: <Scissors size={22} />, title: "Staff Analytics", desc: "Performance, revenue & ratings", href: "/dashboard/owner/staff-analytics" },
                    { icon: <GraduationCap size={22} />, title: "Academy Enrollments", desc: `${stats.pendingEnrollments} pending request${stats.pendingEnrollments !== 1 ? "s" : ""}`, href: "/dashboard/owner/academy" },
                ].map((item) => (
                    <Link key={item.title} href={item.href}
                        className="bg-white rounded-sm border border-cream-darker/50 p-5 hover:shadow-lg hover:border-gold/20 transition-all">
                        <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold mb-3">{item.icon}</div>
                        <h3 className="font-display text-base text-espresso mb-1">{item.title}</h3>
                        <p className="text-xs text-charcoal-lighter">{item.desc}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
