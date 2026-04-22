export const dynamic = "force-dynamic";
// Client Dashboard — My Enrollments
// Shows academy course enrollments for the currently logged-in client

import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GraduationCap, Clock, IndianRupee, Calendar, CheckCircle, XCircle, AlertCircle, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "My Enrollments | Dashboard",
};

// Fetches enrollments server-side directly via Prisma (SSR page)
async function getEnrollments(userId: string) {
    try {
        return await prisma.courseEnrollment.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                status: true,
                notes: true,
                paymentStatus: true,
                paymentMethod: true,
                paymentAmount: true,
                paidAt: true,
                createdAt: true,
                course: {
                    select: {
                        id: true,
                        name: true,
                        duration: true,
                        price: true,
                        certificate: true,
                    },
                },
            },
        });
    } catch {
        return [];
    }
}


const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    ENQUIRY: {
        label: "Enquiry Received",
        color: "bg-gray-100 text-gray-600",
        icon: <AlertCircle size={14} />,
    },
    ENROLLED: {
        label: "Enrolled",
        color: "bg-blue-100 text-blue-700",
        icon: <CheckCircle size={14} />,
    },
    ACTIVE: {
        label: "Active",
        color: "bg-green-100 text-green-700",
        icon: <CheckCircle size={14} />,
    },
    COMPLETED: {
        label: "Completed ✓",
        color: "bg-purple-100 text-purple-700",
        icon: <CheckCircle size={14} />,
    },
    DROPPED: {
        label: "Dropped",
        color: "bg-red-100 text-red-700",
        icon: <XCircle size={14} />,
    },
};

export default async function ClientEnrollmentsPage() {
    const session = await getAuthSession();
    if (!session?.user) redirect("/login?callbackUrl=/dashboard/client/enrollments");

    const enrollments = await getEnrollments(session.user.id);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="font-display text-xl text-espresso">My Enrollments</h1>
                    <p className="text-sm text-charcoal-lighter mt-0.5">Your academy course registrations</p>
                </div>
                <Link href="/academy" className="btn-gold text-xs py-2 px-4 inline-flex items-center gap-1.5">
                    <GraduationCap size={14} /> Browse Courses
                </Link>
            </div>

            {enrollments.length === 0 ? (
                <div className="bg-white rounded-sm border border-cream-darker/50 p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                        <GraduationCap className="text-gold" size={28} />
                    </div>
                    <h2 className="font-display text-lg text-espresso mb-2">No Enrollments Yet</h2>
                    <p className="text-charcoal-lighter text-sm mb-6">
                        Explore our professional beauty courses and enrol to begin your journey.
                    </p>
                    <Link href="/academy" className="btn-gold py-3 px-6 text-sm inline-flex items-center gap-2">
                        Explore Academy Courses <ArrowRight size={16} />
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {enrollments.map((enrollment) => {
                        const cfg = statusConfig[enrollment.status] ?? {
                            label: enrollment.status,
                            color: "bg-gray-100 text-gray-600",
                            icon: <AlertCircle size={14} />,
                        };
                        const paymentPaid = enrollment.paymentStatus === "PAID";

                        return (
                            <div key={enrollment.id} className="bg-white rounded-sm border border-cream-darker/50 p-5">
                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                    <div className="flex-1 min-w-0">
                                        {/* Course name */}
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <GraduationCap size={16} className="text-gold flex-shrink-0" />
                                            <h2 className="font-display text-base font-semibold text-espresso">
                                                {enrollment.course.name}
                                            </h2>
                                        </div>

                                        {/* Course meta */}
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-charcoal-lighter mb-3">
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} />
                                                {enrollment.course.duration}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <IndianRupee size={12} />
                                                ₹{Number(enrollment.course.price).toLocaleString("en-IN")}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                Enrolled {new Date(enrollment.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                            </span>
                                        </div>

                                        {/* Status badges */}
                                        <div className="flex gap-2 flex-wrap">
                                            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded ${cfg.color}`}>
                                                {cfg.icon} {cfg.label}
                                            </span>
                                            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded ${paymentPaid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                                                <IndianRupee size={10} />
                                                {paymentPaid
                                                    ? `Paid${enrollment.paymentMethod ? ` via ${enrollment.paymentMethod.toUpperCase()}` : ""}`
                                                    : enrollment.paymentStatus === "PARTIAL"
                                                        ? "Partially Paid"
                                                        : "Payment Pending"}
                                            </span>
                                        </div>

                                        {/* Payment pending instruction */}
                                        {!paymentPaid && (
                                            <p className="text-xs text-charcoal-lighter mt-2.5 bg-amber-50 border border-amber-100 rounded-sm px-3 py-2">
                                                💡 To confirm your seat, please visit the salon or{" "}
                                                <a href="https://wa.me/919171230292" target="_blank" rel="noopener noreferrer" className="text-green-600 font-medium hover:underline">
                                                    contact us on WhatsApp
                                                </a>{" "}
                                                and complete payment (Cash / UPI / Card).
                                            </p>
                                        )}

                                        {enrollment.notes && (
                                            <p className="text-xs text-charcoal-lighter mt-2 italic border-t border-cream-darker/30 pt-2">
                                                Staff note: "{enrollment.notes}"
                                            </p>
                                        )}
                                    </div>

                                    <Link
                                        href={`/academy/${enrollment.course.id}`}
                                        className="flex-shrink-0 text-xs text-gold hover:underline inline-flex items-center gap-1 whitespace-nowrap"
                                    >
                                        View Course <ArrowRight size={12} />
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
