import { Users, Shield, Settings, ClipboardList, Calendar, Package, ArrowRight, Globe, Scissors, UserCheck, BarChart3, GraduationCap, Gift, Star } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

async function getStats() {
    try {
        const [users, appointments, products, logs, orders, services, pendingEnrollments, pendingReviews] = await Promise.all([
            prisma.user.count(),
            prisma.appointment.count(),
            prisma.product.count({ where: { isActive: true } }),
            prisma.activityLog.count(),
            prisma.order.count(),
            prisma.service.count({ where: { isActive: true } }),
            prisma.courseEnrollment.count({ where: { status: "SUBMITTED" } }),
            prisma.review.count({ where: { isApproved: false, isPublished: false } }),
        ]);
        return { users, appointments, products, logs, orders, services, pendingEnrollments, pendingReviews };
    } catch {
        return { users: 0, appointments: 0, products: 0, logs: 0, orders: 0, services: 0, pendingEnrollments: 0, pendingReviews: 0 };
    }
}

export default async function AdminDashboard() {
    const stats = await getStats();
    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-espresso to-espresso-50 rounded-sm p-6 text-cream">
                <div className="flex items-center gap-3 mb-1">
                    <Shield className="text-gold" size={24} />
                    <h1 className="font-display text-2xl">Admin Control Panel</h1>
                </div>
                <p className="text-cream/60 text-sm">Full system access — manage users, configuration, and monitor everything.</p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                    { icon: <Users className="text-blue-500" size={20} />,        value: stats.users,        label: "Total Users",      href: "/admin/users" },
                    { icon: <Calendar className="text-gold" size={20} />,          value: stats.appointments, label: "Appointments",      href: "/admin/appointments" },
                    { icon: <Package className="text-green-500" size={20} />,      value: stats.products,     label: "Active Products",   href: "/admin/products" },
                    { icon: <ClipboardList className="text-rose-500" size={20} />, value: stats.logs,         label: "Activity Logs",     href: "/admin/logs" },
                    { icon: <BarChart3 className="text-purple-500" size={20} />,   value: stats.orders,       label: "Total Orders",      href: "/admin/orders" },
                    { icon: <Scissors className="text-amber-500" size={20} />,     value: stats.services,     label: "Active Services",   href: "/admin/services" },
                ].map((stat) => (
                    <Link key={stat.label} href={stat.href}
                        className="bg-white rounded-sm border border-cream-darker/50 p-4 hover:shadow-lg hover:border-gold/20 transition-all group">
                        <div className="flex items-center justify-between mb-3">
                            {stat.icon}
                            <ArrowRight size={13} className="text-charcoal-lighter opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="font-display text-2xl text-espresso">{stat.value}</p>
                        <p className="text-xs text-charcoal-lighter mt-0.5">{stat.label}</p>
                    </Link>
                ))}
            </div>

            {/* Module cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                    { icon: <Users size={20} />,        title: "User Management",        desc: "Create, edit roles, activate/deactivate accounts",      href: "/admin/users" },
                    { icon: <Calendar size={20} />,      title: "Appointments",           desc: "View and manage all appointments & payments",           href: "/admin/appointments" },
                    { icon: <Package size={20} />,       title: "Products",               desc: "Manage product listings and inventory",                 href: "/admin/products" },
                    { icon: <Scissors size={20} />,      title: "Services",               desc: "Add, edit, and configure salon services",               href: "/admin/services" },
                    { icon: <UserCheck size={20} />,     title: "Staff",                  desc: "Staff profiles, roles, and assignments",                href: "/admin/staff" },
                    { icon: <BarChart3 size={20} />,     title: "Analytics",              desc: "Revenue, trends, and business insights",                href: "/admin/analytics" },
                    { icon: <Globe size={20} />,         title: "Content Manager",        desc: "Blog posts, gallery, site content",                    href: "/admin/content" },
                    { icon: <Settings size={20} />,      title: "Site Settings",          desc: "Business info, SEO, logo, theme configuration",        href: "/admin/settings" },
                    { icon: <ClipboardList size={20} />, title: "Audit Logs",             desc: "View all system activity and user actions",             href: "/admin/logs" },
                    { icon: <GraduationCap size={20} />, title: "Academy Enrollments",    desc: `${stats.pendingEnrollments} pending · confirm, cancel, mark paid`, href: "/admin/academy/enrollments" },
                    { icon: <Gift size={20} />,          title: "Gift Vouchers",          desc: "View all purchased gift vouchers",                     href: "/admin/vouchers" },
                    { icon: <Star size={20} />,          title: "Review Moderation",      desc: `${stats.pendingReviews} pending · approve, reject, respond`,  href: "/admin/reviews" },
                    { icon: <Shield size={20} />,        title: "Permissions",            desc: "Manage role & per-user permission overrides",           href: "/admin/permissions" },
                ].map((item) => (
                    <Link key={item.title} href={item.href}
                        className="bg-white rounded-sm border border-cream-darker/50 p-5 hover:shadow-lg hover:border-gold/20 transition-all group">
                        <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold mb-3">{item.icon}</div>
                        <h3 className="font-display text-base text-espresso mb-1">{item.title}</h3>
                        <p className="text-xs text-charcoal-lighter">{item.desc}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
