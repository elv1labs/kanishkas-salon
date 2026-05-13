// app/admin/academy/page.tsx
// Academy management — courses + enrollment overview
// Server component shell with client-side CourseManager for CRUD

import { GraduationCap } from "lucide-react";
import { prisma } from "@/lib/prisma";
import EnrollmentTable from "@/components/admin/EnrollmentTable";
import CourseManager from "./CourseManager";

export const metadata = { title: "Academy Management" };
export const dynamic = "force-dynamic";

async function getCourses() {
  try {
    const courses = await prisma.course.findMany({
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
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    return courses;
  } catch (err) {
    console.error("[academy/page] getCourses", err);
    return [];
  }
}

export default async function AcademyPage() {
  const courses = await getCourses();

  // Summary stats
  const activeCourses = courses.filter((c) => c.isActive).length;
  const totalEnrolled = courses.reduce(
    (sum, c) =>
      sum +
      c.enrollments.filter((e) =>
        ["ENROLLED", "ACTIVE"].includes(e.status)
      ).length,
    0
  );
  const totalCompleted = courses.reduce(
    (sum, c) =>
      sum + c.enrollments.filter((e) => e.status === "COMPLETED").length,
    0
  );
  const totalDropped = courses.reduce(
    (sum, c) =>
      sum + c.enrollments.filter((e) => e.status === "DROPPED").length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-xl text-espresso flex items-center gap-2">
            <GraduationCap size={20} className="text-gold" />
            Academy Management
          </h1>
          <p className="text-xs text-charcoal-lighter mt-0.5">
            Manage courses, enrollments, and track student progress.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Total Courses", value: courses.length, color: "text-espresso" },
          { label: "Published", value: activeCourses, color: "text-green-600" },
          { label: "Active Students", value: totalEnrolled, color: "text-blue-600" },
          { label: "Completed", value: totalCompleted, color: "text-purple-600" },
          { label: "Dropped", value: totalDropped, color: "text-red-500" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-sm border border-cream-darker/50 p-4"
          >
            <p className={`font-display text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </p>
            <p className="text-xs text-charcoal-lighter mt-0.5">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Course Manager (client component — handles CRUD modal) */}
      <CourseManager
        initialCourses={courses.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          duration: c.duration,
          price: Number(c.price),
          maxStudents: c.maxStudents,
          schedule: c.schedule,
          prerequisites: c.prerequisites,
          certificate: c.certificate,
          imageUrl: c.imageUrl,
          isActive: c.isActive,
          isFeatured: c.isFeatured,
          _count: { enrollments: c._count.enrollments },
        }))}
      />

      {/* Enrollment table (only show if there are active courses) */}
      {courses.filter((c) => c.isActive).length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-lg text-espresso mb-4 flex items-center gap-2">
            <GraduationCap size={16} className="text-gold" />
            Enrollment Overview
          </h2>
          <EnrollmentTable
            courses={courses.filter((c) => c.isActive).map((c) => ({
              ...c,
              price: Number(c.price),
              enrollments: c.enrollments.map((e) => ({
                ...e,
                status: e.status as "ENQUIRY" | "ENROLLED" | "ACTIVE" | "COMPLETED" | "DROPPED",
                startDate: e.startDate ? e.startDate.toISOString() : null,
                createdAt: e.createdAt.toISOString(),
              })),
            }))}
          />
        </div>
      )}
    </div>
  );
}
