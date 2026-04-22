// app/admin/academy/page.tsx
// Academy enrollment management — server component shell

import { GraduationCap } from "lucide-react";
import { prisma } from "@/lib/prisma";
import EnrollmentTable from "@/components/admin/EnrollmentTable";

export const metadata = { title: "Academy Enrollments" };
export const dynamic = "force-dynamic";

async function getCourses() {
  try {
    const courses = await prisma.course.findMany({
      where: { isActive: true },
      include: {
        enrollments: {
          select: {
            id: true,
            courseId: true,
            studentName: true,
            phone: true,
            email: true,
            status: true,
            notes: true,
            startDate: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    return courses;
  } catch (err) {
    console.error("[academy/page] getCourses", err);
    return [];
  }
}

export default async function AcademyEnrollmentsPage() {
  const courses = await getCourses();

  // Summary stats
  const totalEnrolled  = courses.reduce((sum, c) =>
    sum + c.enrollments.filter(e => ["ENROLLED", "ACTIVE"].includes(e.status)).length, 0);
  const totalCompleted = courses.reduce((sum, c) =>
    sum + c.enrollments.filter(e => e.status === "COMPLETED").length, 0);
  const totalDropped   = courses.reduce((sum, c) =>
    sum + c.enrollments.filter(e => e.status === "DROPPED").length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-xl text-espresso flex items-center gap-2">
            <GraduationCap size={20} className="text-gold" />
            Academy Enrollments
          </h1>
          <p className="text-xs text-charcoal-lighter mt-0.5">
            Manage course enrollments, track student progress, and export records.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Courses",     value: courses.length,   color: "text-gold" },
          { label: "Active Students",   value: totalEnrolled,    color: "text-blue-600" },
          { label: "Completed",         value: totalCompleted,   color: "text-green-600" },
          { label: "Dropped",           value: totalDropped,     color: "text-red-500" },
        ].map(stat => (
          <div
            key={stat.label}
            className="bg-white rounded-sm border border-cream-darker/50 p-4"
          >
            <p className={`font-display text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-charcoal-lighter mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Enrollment table */}
      {courses.length === 0 ? (
        <div className="bg-white rounded-sm border border-cream-darker/50 py-16 text-center">
          <GraduationCap size={40} className="text-charcoal-lighter/30 mx-auto mb-3" />
          <p className="text-sm text-charcoal-lighter">No active courses found</p>
          <p className="text-xs text-charcoal-lighter/60 mt-1">
            Add courses first via the database or contact your developer.
          </p>
        </div>
      ) : (
        // @ts-expect-error serialization mismatch (Decimal → number handled by JSON)
        <EnrollmentTable courses={courses} />
      )}
    </div>
  );
}
