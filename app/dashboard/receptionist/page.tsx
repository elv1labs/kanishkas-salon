import { Calendar, Users, FileText, Clock, Package, TrendingUp, IndianRupee } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Receptionist Dashboard" };

async function getStats() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [todayAppts, totalClients, blogDrafts, pendingOrders, todayRevenueData] = await Promise.all([
            prisma.appointment.count({ where: { date: { gte: today, lt: tomorrow } } }),
            prisma.user.count({ where: { role: "CLIENT" } }),
            prisma.blogPost.count({ where: { status: "DRAFT" } }),
            prisma.order.count({ where: { status: "PENDING" } }),
            prisma.payment.aggregate({ where: { status: "PAID", paidAt: { gte: today } }, _sum: { amount: true } }),
        ]);
        return {
            todayAppts,
            totalClients,
            blogDrafts,
            pendingOrders,
            todayRevenue: todayRevenueData._sum.amount || 0,
        };
    } catch { return { todayAppts: 0, totalClients: 0, blogDrafts: 0, pendingOrders: 0, todayRevenue: 0 }; }
}

export default async function ReceptionistDashboard() {
    const stats = await getStats();
    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-espresso to-espresso-50 rounded-sm p-6 text-cream">
                <h1 className="font-display text-2xl mb-1">Receptionist Panel</h1>
                <p className="text-cream/60 text-sm">Manage appointments, assist clients, and update content.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                {[
                    { icon: <Calendar className="text-gold" size={20} />, value: stats.todayAppts, label: "Today's Appts", href: "/dashboard/receptionist/appointments" },
                    { icon: <TrendingUp className="text-green-500" size={20} />, value: `₹${Number(stats.todayRevenue).toLocaleString("en-IN")}`, label: "Today's Revenue", href: "/dashboard/receptionist/appointments" },
                    { icon: <Users className="text-blue-500" size={20} />, value: stats.totalClients, label: "Clients", href: "/dashboard/receptionist/clients" },
                    { icon: <FileText className="text-rose-gold" size={20} />, value: stats.blogDrafts, label: "Blog Drafts", href: "/dashboard/receptionist/blog" },
                    { icon: <Package className="text-green-500" size={20} />, value: stats.pendingOrders, label: "Pending Orders", href: "/dashboard/owner/orders" },
                ].map((stat) => (
                    <Link key={stat.label} href={stat.href}
                        className="bg-white rounded-sm border border-cream-darker/50 p-4 hover:shadow-lg hover:border-gold/20 transition-all">
                        <div className="mb-2">{stat.icon}</div>
                        <p className="font-display text-xl sm:text-2xl text-espresso">{stat.value}</p>
                        <p className="text-[10px] sm:text-xs text-charcoal-lighter mt-0.5">{stat.label}</p>
                    </Link>
                ))}
            </div>

            {/* Walk-In Booking Widget */}
            <div className="bg-gold/5 border border-gold/20 rounded-sm p-5 sm:p-6">
                <h2 className="font-display text-lg text-espresso mb-3 flex items-center gap-2">
                    <Calendar size={18} className="text-gold" /> Quick Walk-In Booking
                </h2>
                <p className="text-xs text-charcoal-lighter mb-3">For walk-in customers without an account — create a booking directly.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Link href="/book"
                        className="btn-gold text-center py-3 text-sm">
                        Book New Appointment
                    </Link>
                    <Link href="/dashboard/receptionist/appointments"
                        className="bg-white border border-cream-darker text-espresso text-center py-3 text-sm rounded-sm hover:border-gold/30 transition-colors">
                        View Today&apos;s Schedule
                    </Link>
                    <Link href="/dashboard/receptionist/clients"
                        className="bg-white border border-cream-darker text-espresso text-center py-3 text-sm rounded-sm hover:border-gold/30 transition-colors">
                        Search Client
                    </Link>
                </div>
            </div>

            {/* Module Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/dashboard/receptionist/appointments"
                    className="bg-gold/10 border border-gold/20 rounded-sm p-5 sm:p-6 hover:bg-gold/15 transition-all">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                            <Calendar className="text-gold" size={20} />
                        </div>
                        <div>
                            <h3 className="font-display text-base sm:text-lg text-espresso">View Calendar</h3>
                            <p className="text-xs sm:text-sm text-charcoal-lighter">See today&apos;s schedule</p>
                        </div>
                    </div>
                </Link>
                <Link href="/dashboard/receptionist/clients"
                    className="bg-blue-50 border border-blue-100 rounded-sm p-5 sm:p-6 hover:bg-blue-100/50 transition-all">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <Users className="text-blue-500" size={20} />
                        </div>
                        <div>
                            <h3 className="font-display text-base sm:text-lg text-espresso">Client List</h3>
                            <p className="text-xs sm:text-sm text-charcoal-lighter">Search and view clients</p>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-sm border border-cream-darker/50 p-5 sm:p-6">
                <h2 className="font-display text-lg text-espresso mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: "New Appointment", href: "/book", icon: <Calendar size={16} /> },
                        { label: "Add Blog Post", href: "/dashboard/receptionist/blog", icon: <FileText size={16} /> },
                        { label: "Upload Gallery", href: "/dashboard/receptionist/gallery", icon: <Clock size={16} /> },
                        { label: "Manage Orders", href: "/dashboard/owner/orders", icon: <Package size={16} /> },
                    ].map((action) => (
                        <Link key={action.label} href={action.href}
                            className="flex flex-col items-center gap-2 p-3 bg-cream rounded-sm hover:bg-cream-darker/30 transition-all text-center min-h-[60px] justify-center">
                            <span className="text-gold">{action.icon}</span>
                            <span className="text-xs text-charcoal font-medium">{action.label}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
