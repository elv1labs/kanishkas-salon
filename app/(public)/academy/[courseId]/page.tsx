// app/(public)/academy/[courseId]/page.tsx
// Course detail page with inline enrollment

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import EnrollForm from "@/components/academy/EnrollForm";
import { GraduationCap, Clock, Users, Award, ArrowLeft, CheckCircle } from "lucide-react";

interface Props {
    params: { courseId: string };
}

async function getCourse(courseId: string) {
    try {
        return await prisma.course.findUnique({
            where: { id: courseId, isActive: true },
            include: {
                _count: { select: { enrollments: { where: { status: { in: ["CONFIRMED", "ENROLLED", "ACTIVE"] } } } } },
            },
        });
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const course = await getCourse(params.courseId);
    if (!course) return { title: "Course Not Found" };
    return {
        title: course.seoTitle ?? `${course.name} | Kanishka's Academy`,
        description: course.seoDescription ?? course.description ?? undefined,
    };
}

export default async function CourseDetailPage({ params }: Props) {
    const course = await getCourse(params.courseId);
    if (!course) notFound();

    const enrolled = course._count.enrollments;
    const spotsLeft = Math.max(0, course.maxStudents - enrolled);
    const curriculum = course.curriculum as Record<string, string[]> | null;

    return (
        <>
            {/* Hero */}
            <section className="relative py-24 bg-espresso overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-espresso via-espresso/95 to-espresso" />
                <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-gold/5 blur-3xl" />
                <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-rose-gold/5 blur-3xl" />

                <div className="relative z-10 container-salon px-4">
                    <Link
                        href="/academy"
                        className="inline-flex items-center gap-1.5 text-cream/50 hover:text-cream text-sm mb-8 transition-colors"
                    >
                        <ArrowLeft size={14} />
                        Back to Academy
                    </Link>

                    <div className="max-w-4xl">
                        <span className="inline-flex items-center gap-2 text-gold text-xs font-accent uppercase tracking-widest mb-4">
                            <GraduationCap size={14} />
                            Kanishka&apos;s Academy
                        </span>
                        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-cream mb-4 leading-tight">
                            {course.name}
                        </h1>
                        {course.description && (
                            <p className="text-cream/60 text-lg max-w-2xl">{course.description}</p>
                        )}

                        {/* Quick stats */}
                        <div className="flex flex-wrap gap-6 mt-8 pt-8 border-t border-white/10">
                            {[
                                { icon: Clock, label: "Duration", value: course.duration },
                                { icon: Users, label: "Class Size", value: `Max ${course.maxStudents} students` },
                                { icon: Award, label: "Certificate", value: course.certificate ? "Included" : "Not included" },
                                {
                                    icon: Users,
                                    label: "Spots Left",
                                    value: spotsLeft > 0 ? `${spotsLeft} available` : "Waitlist only",
                                    highlight: spotsLeft <= 3
                                },
                            ].map(({ icon: Icon, label, value, highlight }) => (
                                <div key={label}>
                                    <p className="text-cream/40 text-xs uppercase tracking-wider mb-1">{label}</p>
                                    <div className="flex items-center gap-1.5">
                                        <Icon size={14} className={highlight ? "text-amber-400" : "text-gold"} />
                                        <p className={`font-semibold text-sm ${highlight ? "text-amber-400" : "text-cream"}`}>{value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Content */}
            <section className="section-padding bg-cream">
                <div className="container-salon px-4">
                    <div className="grid lg:grid-cols-3 gap-10">

                        {/* Left: Details */}
                        <div className="lg:col-span-2 space-y-8">

                            {/* Prerequisites */}
                            {course.prerequisites && (
                                <div>
                                    <h2 className="font-display text-xl font-bold text-espresso mb-3">Prerequisites</h2>
                                    <p className="text-charcoal-lighter text-sm leading-relaxed">{course.prerequisites}</p>
                                </div>
                            )}

                            {/* Schedule */}
                            {course.schedule && (
                                <div>
                                    <h2 className="font-display text-xl font-bold text-espresso mb-3">Schedule</h2>
                                    <p className="text-charcoal-lighter text-sm leading-relaxed">{course.schedule}</p>
                                </div>
                            )}

                            {/* Curriculum */}
                            {curriculum && (
                                <div>
                                    <h2 className="font-display text-xl font-bold text-espresso mb-4">What You&apos;ll Learn</h2>
                                    <div className="space-y-4">
                                        {Object.entries(curriculum).map(([module, topics]) => (
                                            <div key={module} className="border border-charcoal/10 rounded-sm overflow-hidden">
                                                <div className="px-4 py-3 bg-espresso/5 border-b border-charcoal/10">
                                                    <h3 className="font-semibold text-espresso text-sm">{module}</h3>
                                                </div>
                                                <ul className="px-4 py-3 space-y-1.5">
                                                    {Array.isArray(topics) && topics.map((topic, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-charcoal-lighter text-sm">
                                                            <CheckCircle size={14} className="text-gold flex-shrink-0 mt-0.5" />
                                                            {topic}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Certificate */}
                            {course.certificate && (
                                <div className="flex items-start gap-3 bg-gold/5 border border-gold/20 rounded-sm p-4">
                                    <Award size={20} className="text-gold flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-espresso text-sm mb-1">Certificate of Completion</p>
                                        <p className="text-charcoal-lighter text-xs">
                                            Receive an industry-recognised certificate from Kanishka&apos;s Academy upon successful completion.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right: Enrollment card */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-24 space-y-4">
                                {/* Pricing card */}
                                <div className="border border-charcoal/10 rounded-sm overflow-hidden shadow-sm bg-white">
                                    <div className="px-6 py-5 bg-espresso text-cream">
                                        <p className="text-cream/60 text-xs uppercase tracking-wider mb-1">Course Fee</p>
                                        <p className="font-display text-3xl font-bold text-gold">
                                            ₹{Number(course.price).toLocaleString("en-IN")}
                                        </p>
                                        <p className="text-cream/50 text-xs mt-1">Payment arranged upon confirmation</p>
                                    </div>

                                    <div className="px-6 py-5 space-y-4">
                                        <ul className="space-y-2">
                                            {[
                                                `${course.duration} duration`,
                                                `Max ${course.maxStudents} students per batch`,
                                                course.certificate ? "Certificate included" : null,
                                                "Expert instructors",
                                                "Hands-on practical training",
                                            ].filter(Boolean).map((item) => (
                                                <li key={item} className="flex items-center gap-2 text-charcoal-lighter text-sm">
                                                    <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>

                                        {/* The enroll form / button is client-side only */}
                                        <EnrollForm
                                            courseId={course.id}
                                            courseName={course.name}
                                            coursePrice={Number(course.price)}
                                        />

                                        <p className="text-center text-xs text-charcoal/40">
                                            Questions?{" "}
                                            <a href="https://wa.me/919171230292" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                                                Chat on WhatsApp
                                            </a>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
