"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Calendar, ShoppingBag, Heart, Star, ArrowRight, Clock, Users, Copy, CheckCircle, Gift, GraduationCap } from "lucide-react";

import Link from "next/link";

export default function ClientDashboard() {
    const { data: session } = useSession();
    const [stats, setStats] = useState({ appointments: 0, orders: 0, points: 0, tier: "BRONZE", enrollments: 0 });
    const [upcoming, setUpcoming] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [referralCode, setReferralCode] = useState<string | null>(null);
    const [referralCount, setReferralCount] = useState(0);
    const [codeCopied, setCodeCopied] = useState(false);

    useEffect(() => {
        async function loadStats() {
            try {
                const [apptRes, orderRes, loyaltyRes, referralRes, enrollRes] = await Promise.all([
                    fetch("/api/appointments?status=CONFIRMED&limit=3"),
                    fetch("/api/orders?limit=1"),
                    fetch("/api/loyalty"),
                    fetch("/api/referral"),
                    fetch("/api/client/enrollments?limit=1"),
                ]);
                const apptData = await apptRes.json();
                const orderData = await orderRes.json();
                const loyaltyData = loyaltyRes.ok ? await loyaltyRes.json() : null;
                const referralData = referralRes.ok ? await referralRes.json() : null;
                const enrollData = enrollRes.ok ? await enrollRes.json() : null;

                setUpcoming(apptData.appointments?.slice(0, 3) || []);
                setStats({
                    appointments: apptData.pagination?.total || 0,
                    orders: orderData.pagination?.total || 0,
                    points: loyaltyData?.account?.totalPoints || 0,
                    tier: loyaltyData?.account?.tier || "BRONZE",
                    enrollments: enrollData?.pagination?.total ?? enrollData?.enrollments?.length ?? 0,
                });
                if (referralData?.data) {
                    setReferralCode(referralData.data.referralCode);
                    setReferralCount(referralData.data.totalReferred);
                }
            } catch (e) {
                console.error("Failed to load dashboard stats", e);
            } finally {
                setLoading(false);
            }
        }
        loadStats();
    }, []);

    const tierColors: Record<string, string> = {
        BRONZE: "text-amber-600",
        SILVER: "text-slate-400",
        GOLD: "text-gold",
        PLATINUM: "text-blue-400",
    };

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-espresso to-espresso-50 rounded-sm p-6 text-cream">
                <h1 className="font-display text-2xl mb-1">
                    Welcome Back{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}!✨
                </h1>
                <p className="text-cream/60 text-sm">
                    Your one-stop beauty destination. Book appointments, shop products, and earn rewards.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { icon: <Calendar className="text-gold" size={22} />, value: loading ? "..." : String(stats.appointments), sub: "Appointments", href: "/dashboard/client/appointments" },
                    { icon: <ShoppingBag className="text-rose-gold" size={22} />, value: loading ? "..." : String(stats.orders), sub: "Total Orders", href: "/dashboard/client/orders" },
                    { icon: <GraduationCap className="text-purple-500" size={22} />, value: loading ? "..." : String(stats.enrollments), sub: "Enrollments", href: "/dashboard/client/enrollments" },
                    { icon: <Heart className="text-red-400" size={22} />, value: loading ? "..." : String(stats.points), sub: "Loyalty Points", href: "/dashboard/client/loyalty" },
                    { icon: <Star className="text-gold" size={22} />, value: loading ? "..." : stats.tier, sub: "Loyalty Tier", href: "/dashboard/client/loyalty" },
                    { icon: <Users className="text-blue-400" size={22} />, value: loading ? "..." : String(referralCount), sub: "Referrals Made", href: "/dashboard/client/referral" },
                ].map((stat) => (
                    <Link key={stat.sub} href={stat.href}
                        className="bg-white rounded-sm border border-cream-darker/50 p-5 hover:shadow-lg hover:border-gold/20 transition-all group">
                        <div className="flex items-center justify-between mb-3">
                            {stat.icon}
                            <ArrowRight size={14} className="text-charcoal-lighter opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className={`font-display text-2xl text-espresso ${stat.sub === "Loyalty Tier" ? tierColors[stats.tier] || "" : ""}`}>
                            {stat.value}
                        </p>
                        <p className="text-xs text-charcoal-lighter mt-0.5">{stat.sub}</p>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/book" className="bg-gold/10 border border-gold/20 rounded-sm p-6 hover:bg-gold/15 transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                            <Calendar className="text-gold" size={22} />
                        </div>
                        <div>
                            <h3 className="font-display text-lg text-espresso group-hover:text-gold-dark transition-colors">Book Appointment</h3>
                            <p className="text-sm text-charcoal-lighter">Schedule your next beauty session</p>
                        </div>
                    </div>
                </Link>
                <Link href="/products" className="bg-rose-gold/5 border border-rose-gold/10 rounded-sm p-6 hover:bg-rose-gold/10 transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-rose-gold/15 flex items-center justify-center">
                            <ShoppingBag className="text-rose-gold" size={22} />
                        </div>
                        <div>
                            <h3 className="font-display text-lg text-espresso group-hover:text-rose-gold-dark transition-colors">Shop Products</h3>
                            <p className="text-sm text-charcoal-lighter">Browse premium salon products</p>
                        </div>
                    </div>
                </Link>
                <Link href="/academy" className="bg-purple-50 border border-purple-100 rounded-sm p-6 hover:bg-purple-100/50 transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                            <GraduationCap className="text-purple-500" size={22} />
                        </div>
                        <div>
                            <h3 className="font-display text-lg text-espresso group-hover:text-purple-700 transition-colors">Academy Courses</h3>
                            <p className="text-sm text-charcoal-lighter">Professional beauty training</p>
                        </div>
                    </div>
                </Link>
            </div>

            <div className="bg-white rounded-sm border border-cream-darker/50 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-lg text-espresso">Upcoming Appointments</h2>
                    <Link href="/dashboard/client/appointments" className="text-xs text-gold hover:text-gold-dark transition-colors font-semibold uppercase tracking-wider">
                        View All →
                    </Link>
                </div>
                {loading ? (
                    <div className="text-center py-10"><p className="text-charcoal-lighter text-sm">Loading...</p></div>
                ) : upcoming.length > 0 ? (
                    <div className="space-y-3">
                        {upcoming.map((appt: any) => (
                            <div key={appt.id} className="flex items-center justify-between p-3 bg-cream rounded-sm">
                                <div>
                                    <p className="font-medium text-espresso text-sm">{appt.service?.name || "Appointment"}</p>
                                    <p className="text-xs text-charcoal-lighter mt-0.5">
                                        {new Date(appt.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} at {appt.startTime}
                                    </p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                    appt.status === "CONFIRMED" ? "bg-green-100 text-green-700" :
                                    appt.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                                    "bg-gray-100 text-gray-600"
                                }`}>{appt.status}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10">
                        <Clock className="w-10 h-10 text-cream-darker mx-auto mb-3" />
                        <p className="text-charcoal-lighter text-sm">No upcoming appointments</p>
                        <Link href="/book" className="inline-block mt-3 text-sm text-gold font-semibold hover:text-gold-dark transition-colors">
                            Book Now →
                        </Link>
                    </div>
                )}
            </div>

            {/* Referral widget */}
            <div className="bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/20 rounded-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Gift className="text-gold" size={18} />
                        <h2 className="font-display text-lg text-espresso">Refer &amp; Earn</h2>
                    </div>
                    <Link href="/dashboard/client/referral" className="text-xs text-gold font-semibold hover:text-gold-dark uppercase tracking-wider">View All →</Link>
                </div>
                <p className="text-xs text-charcoal-lighter mb-4">
                    Share your code with friends. When they join and book, you earn <strong>loyalty points</strong>.
                </p>
                {referralCode ? (
                    <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white border border-cream-darker/50 rounded-sm px-4 py-2.5">
                            <p className="text-[10px] text-charcoal-lighter uppercase tracking-widest mb-0.5">Your Code</p>
                            <p className="font-mono font-bold tracking-[0.12em] text-espresso text-sm">{referralCode}</p>
                        </div>
                        <button
                            onClick={async () => {
                                await navigator.clipboard.writeText(referralCode);
                                setCodeCopied(true);
                                setTimeout(() => setCodeCopied(false), 2000);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-sm text-xs font-semibold transition-all h-full ${
                                codeCopied ? "bg-green-100 text-green-700" : "bg-espresso text-cream hover:bg-espresso/90"
                            }`}
                        >
                            {codeCopied ? <CheckCircle size={13} /> : <Copy size={13} />}
                            {codeCopied ? "Copied!" : "Copy"}
                        </button>
                    </div>
                ) : (
                    <Link href="/dashboard/client/referral" className="btn-gold py-2.5 text-sm text-center block">
                        Get My Referral Code
                    </Link>
                )}
            </div>
        </div>
    );
}
