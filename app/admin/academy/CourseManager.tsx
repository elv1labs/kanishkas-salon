"use client";
// app/admin/academy/CourseManager.tsx
// Client-side course list with Add/Edit/Delete via CourseModal

import { useState, useCallback } from "react";
import { Plus, Pencil, GraduationCap, Users, Clock } from "lucide-react";
import CourseModal from "@/components/admin/CourseModal";
import type { CourseData } from "@/components/admin/CourseModal";

interface CourseManagerProps {
  initialCourses: CourseData[];
}

export default function CourseManager({ initialCourses }: CourseManagerProps) {
  const [courses, setCourses] = useState<CourseData[]>(initialCourses);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CourseData | null>(null);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/academy/courses?limit=100");
      const data = await res.json();
      if (res.ok && data.data?.courses) {
        setCourses(data.data.courses);
      }
    } catch {
      // fallback: keep current state
    }
  }, []);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (course: CourseData) => {
    setEditing(course);
    setModalOpen(true);
  };

  const handleSave = () => {
    reload();
  };

  return (
    <>
      {/* Section header with Add button */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-espresso flex items-center gap-2">
          Courses
        </h2>
        <button
          id="add-course-btn"
          onClick={openCreate}
          className="btn-gold text-xs py-2 px-3 flex items-center gap-1.5"
        >
          <Plus size={13} /> Add Course
        </button>
      </div>

      {/* Course grid */}
      {courses.length === 0 ? (
        <div className="bg-white rounded-sm border border-cream-darker/50 py-16 text-center">
          <GraduationCap
            size={40}
            className="text-charcoal-lighter/30 mx-auto mb-3"
          />
          <p className="text-sm text-charcoal-lighter">No courses yet</p>
          <p className="text-xs text-charcoal-lighter/60 mt-1">
            Click &quot;Add Course&quot; to create your first course.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map((course) => (
            <div
              key={course.id}
              className={`bg-white rounded-sm border border-cream-darker/50 overflow-hidden transition-all hover:shadow-md ${
                !course.isActive ? "opacity-70" : ""
              }`}
            >
              {/* Image */}
              {course.imageUrl ? (
                <div className="h-36 bg-cream-dark overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={course.imageUrl}
                    alt={course.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-36 bg-gradient-to-br from-cream-dark to-cream flex items-center justify-center">
                  <GraduationCap
                    size={32}
                    className="text-charcoal-lighter/30"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-display text-sm font-bold text-espresso leading-tight line-clamp-2">
                    {course.name}
                  </h3>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        course.isActive
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {course.isActive ? "Published" : "Draft"}
                    </span>
                  </div>
                </div>

                {course.description && (
                  <p className="text-xs text-charcoal-lighter line-clamp-2 mb-3">
                    {course.description}
                  </p>
                )}

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-charcoal-lighter mb-3">
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> {course.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={11} />{" "}
                    {course._count?.enrollments ?? 0}/{course.maxStudents}
                  </span>
                  <span className="font-semibold text-espresso">
                    ₹{Number(course.price).toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Edit button */}
                <button
                  id={`edit-course-${course.id}`}
                  onClick={() => openEdit(course)}
                  className="w-full text-xs py-2 px-3 border border-cream-darker/50 rounded-md text-charcoal-lighter hover:border-gold/50 hover:text-espresso transition-colors flex items-center justify-center gap-1.5"
                >
                  <Pencil size={11} /> Edit Course
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <CourseModal
          initial={editing}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </>
  );
}
