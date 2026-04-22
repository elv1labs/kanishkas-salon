import { BarChart3, Calendar, GraduationCap, Package, ShoppingBag, TrendingUp, Users, FileText, ArrowUpRight, Scissors } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Owner Dashboard" };

async function getStats() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [todayAppts, pendingOrders, totalClients, revenueData, pendingEnrollments] = await Promise.all([
            prisma.appointment.count({ where: { date: { gte: today, lt: tomorrow } } }),
            prisma.order.count({ where: { status: "PENDING" } }),
            prisma.user.count({ where: { role: "CLIENT" } }),
            prisma.payment.aggregate({ where: { status: "PAID", paidAt: { gte: today } }, _sum: { amount: true } }),
            prisma.courseEnrollment.count({ where: { status: "SUBMITTED" } }),
        ]);
        return {
            todayAppts,
            pendingOrders,
            totalClients,
            todayRevenue: revenueData._sum.amount || 0,
            pendingEnrollments,
        };
    } catch { return { todayAppts: 0, pendingOrders: 0, totalClients: 0, todayRevenue: 0, pendingEnrollments: 0 }; }
}

export default async function OwnerDashboard() {
    const stats = await getStats();
    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-espresso to-espresso-50 rounded-sm p-6 text-cream">
                <h1 className="font-display text-2xl mb-1">Business Overview</h1>
                <p className="text-cream/60 text-sm">Monitor revenue, manage content, and track salon performance.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { icon: <TrendingUp className="text-green-500" size={22} />, value: `Rs.${Number(stats.todayRevenue).toLocaleString("en-IN")}`, label: "Today's Revenue" },
                    { icon: <Calendar className="text-gold" size={22} />, value: stats.todayAppts, label: "Today's Appointments" },
                    { icon: <ShoppingBag className="text-blue-500" size={22} />, value: stats.pendingOrders, label: "Pending Orders" },
                    { icon: <Users className="text-rose-gold" size={22} />, value: stats.totalClients, label: "Total Clients" },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-sm border border-cream-darker/50 p-5">
                        <div className="flex items-center justify-between mb-3">
                            {stat.icon}
                            <ArrowUpRight size={14} className="text-charcoal-lighter" />
                        </div>
                        <p className="font-display text-2xl text-espresso">{stat.value}</p>
                        <p className="text-xs text-charcoal-lighter mt-0.5">{stat.label}</p>
                    </div>
                ))}
            </div>
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
