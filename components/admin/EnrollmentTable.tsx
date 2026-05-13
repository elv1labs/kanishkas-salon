"use client";
import { extractApiError } from "@/lib/extract-error";
// components/admin/EnrollmentTable.tsx
// Academy student enrollment manager — ADMIN & OWNER only
// Features: per-course tabs, progress bar, status badge, enrol/unenrol, CSV export

import { useState, useEffect, useCallback } from "react";
import {
  GraduationCap, Plus, UserMinus, Download, Loader2,
  ChevronDown, CheckCircle2, Clock, XCircle, AlertCircle, BookOpen,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type EnrollmentStatus = "ENQUIRY" | "ENROLLED" | "ACTIVE" | "COMPLETED" | "DROPPED";

interface Course {
  id: string;
  name: string;
  slug: string;
  duration: string;
  price: number;
  maxStudents: number;
  enrollments: Enrollment[];
}

interface Enrollment {
  id: string;
  courseId: string;
  studentName: string;
  phone: string;
  email: string;
  status: EnrollmentStatus;
  notes: string | null;
  startDate: string | null;
  createdAt: string;
  course?: { id: string; name: string };
}

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_META: Record<EnrollmentStatus, {
  label: string;
  progress: number;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}> = {
  ENQUIRY:   { label: "Enquiry",     progress: 0,   color: "text-amber-600",  bgColor: "bg-amber-50 border-amber-200",  icon: <AlertCircle    size={13} /> },
  ENROLLED:  { label: "Enrolled",    progress: 25,  color: "text-blue-600",   bgColor: "bg-blue-50 border-blue-200",    icon: <BookOpen       size={13} /> },
  ACTIVE:    { label: "In Progress", progress: 60,  color: "text-purple-600", bgColor: "bg-purple-50 border-purple-200",icon: <Clock          size={13} /> },
  COMPLETED: { label: "Completed",   progress: 100, color: "text-green-600",  bgColor: "bg-green-50 border-green-200",  icon: <CheckCircle2   size={13} /> },
  DROPPED:   { label: "Dropped",     progress: 0,   color: "text-red-600",    bgColor: "bg-red-50 border-red-200",      icon: <XCircle        size={13} /> },
};

function StatusBadge({ status }: { status: EnrollmentStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${meta.bgColor} ${meta.color}`}>
      {meta.icon} {meta.label}
    </span>
  );
}

function ProgressBar({ status }: { status: EnrollmentStatus }) {
  const progress = STATUS_META[status].progress;
  const color = status === "COMPLETED" ? "bg-green-500"
              : status === "DROPPED"   ? "bg-red-400"
              : status === "ACTIVE"    ? "bg-purple-500"
              : status === "ENROLLED"  ? "bg-blue-500"
              : "bg-amber-400";
  return (
    <div className="w-full h-1.5 bg-cream-darker/20 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ── CSV Export ────────────────────────────────────────────────────────────────

function exportCSV(enrollments: Enrollment[], courseName: string) {
  const headers = ["Name", "Phone", "Email", "Status", "Start Date", "Enrolled On", "Notes"];
  const rows = enrollments.map(e => [
    e.studentName,
    e.phone,
    e.email,
    STATUS_META[e.status].label,
    e.startDate ? new Date(e.startDate).toLocaleDateString("en-IN") : "",
    new Date(e.createdAt).toLocaleDateString("en-IN"),
    e.notes ?? "",
  ]);

  const csvContent = [headers, ...rows]
    .map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${courseName.replace(/\s+/g, "-")}-students.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Enrol Modal ───────────────────────────────────────────────────────────────

interface EnrolModalProps {
  courseId: string;
  courseName: string;
  onClose: () => void;
  onSuccess: () => void;
}

function EnrolModal({ courseId, courseName, onClose, onSuccess }: EnrolModalProps) {
  const [form, setForm] = useState({ studentName: "", phone: "", email: "", notes: "", startDate: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/academy/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          studentName: form.studentName,
          phone: form.phone,
          email: form.email,
          notes: form.notes || undefined,
          startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(extractApiError(data, "Failed to enrol student"));
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to enrol");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-sm border border-cream-darker/50 shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-cream-darker/20 flex items-center justify-between">
          <div>
            <h3 className="font-display text-base text-espresso">Enrol Student</h3>
            <p className="text-xs text-charcoal-lighter mt-0.5">{courseName}</p>
          </div>
          <button onClick={onClose} className="text-charcoal-lighter hover:text-espresso text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-sm p-3 text-sm text-red-600">{error}</div>
          )}
          <div>
            <label className="block text-xs text-charcoal-lighter mb-1.5 font-medium">Student Name *</label>
            <input
              id="enrol-student-name"
              type="text"
              required
              value={form.studentName}
              onChange={e => setForm(f => ({ ...f, studentName: e.target.value }))}
              className="w-full border border-cream-darker/50 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-gold/50"
              placeholder="Full name"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-charcoal-lighter mb-1.5 font-medium">Phone *</label>
              <input
                id="enrol-phone"
                type="tel"
                required
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full border border-cream-darker/50 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-gold/50"
                placeholder="+91xxxxxxxxxx"
              />
            </div>
            <div>
              <label className="block text-xs text-charcoal-lighter mb-1.5 font-medium">Email *</label>
              <input
                id="enrol-email"
                type="email"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full border border-cream-darker/50 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-gold/50"
                placeholder="student@example.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-charcoal-lighter mb-1.5 font-medium">Start Date</label>
            <input
              id="enrol-start-date"
              type="date"
              value={form.startDate}
              onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
              className="w-full border border-cream-darker/50 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-gold/50"
            />
          </div>
          <div>
            <label className="block text-xs text-charcoal-lighter mb-1.5 font-medium">Notes</label>
            <textarea
              id="enrol-notes"
              rows={2}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full border border-cream-darker/50 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-gold/50 resize-none"
              placeholder="Any additional notes..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-outline text-sm py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              id="enrol-submit-btn"
              className="flex-1 btn-gold text-sm py-2 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              Enrol Student
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Status Update Dropdown ────────────────────────────────────────────────────

const NEXT_STATUSES: Partial<Record<EnrollmentStatus, EnrollmentStatus[]>> = {
  ENQUIRY:  ["ENROLLED", "DROPPED"],
  ENROLLED: ["ACTIVE", "DROPPED"],
  ACTIVE:   ["COMPLETED", "DROPPED"],
};

function StatusDropdown({
  enrollment,
  onUpdate,
}: {
  enrollment: Enrollment;
  onUpdate: (id: string, status: EnrollmentStatus) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const nextStatuses = NEXT_STATUSES[enrollment.status] ?? [];
  if (!nextStatuses.length) return null;

  const handleSelect = async (status: EnrollmentStatus) => {
    setOpen(false);
    setLoading(true);
    await onUpdate(enrollment.id, status);
    setLoading(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={loading}
        className="flex items-center gap-1 text-xs text-charcoal-lighter hover:text-espresso border border-cream-darker/50 px-2 py-1 rounded-sm transition-all"
      >
        {loading ? <Loader2 size={11} className="animate-spin" /> : <ChevronDown size={11} />}
        Update
      </button>
      {open && (
        <div className="absolute right-0 top-7 bg-white border border-cream-darker/50 rounded-sm shadow-lg z-10 min-w-[120px]">
          {nextStatuses.map(s => (
            <button
              key={s}
              onClick={() => handleSelect(s)}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-cream/50 transition-colors ${STATUS_META[s].color}`}
            >
              {STATUS_META[s].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface EnrollmentTableProps {
  courses: Course[];
}

export default function EnrollmentTable({ courses }: EnrollmentTableProps) {
  const [activeTab, setActiveTab]     = useState(courses[0]?.id ?? "");
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading]         = useState(false);
  const [showModal, setShowModal]     = useState(false);
  const [unenrolling, setUnenrolling] = useState<string | null>(null);
  const [error, setError]             = useState<string | null>(null);

  const activeCourse = courses.find(c => c.id === activeTab);

  const loadEnrollments = useCallback(async () => {
    if (!activeTab) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/academy/enrollments?courseId=${activeTab}`);
      const data = await res.json();
      if (!res.ok) throw new Error(extractApiError(data, "Failed to load enrollments"));
      setEnrollments(data.enrollments ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { loadEnrollments(); }, [loadEnrollments]);

  const handleUnenrol = async (enrollmentId: string) => {
    if (!confirm("Unenrol this student? Their status will be set to Dropped.")) return;
    setUnenrolling(enrollmentId);
    try {
      const res = await fetch(`/api/academy/enrollments?enrollmentId=${enrollmentId}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error ?? "Failed to unenrol");
      } else {
        await loadEnrollments();
      }
    } finally {
      setUnenrolling(null);
    }
  };

  const handleStatusUpdate = async (enrollmentId: string, status: EnrollmentStatus) => {
    const res = await fetch("/api/academy/enrollments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enrollmentId, status }),
    });
    if (res.ok) await loadEnrollments();
    else {
      const d = await res.json();
      alert(d.error ?? "Failed to update status");
    }
  };

  const activeEnrollments = enrollments.filter(e => e.status !== "DROPPED");
  const capacity = activeCourse?.maxStudents ?? 0;
  const occupancy = activeEnrollments.filter(e => ["ENROLLED", "ACTIVE"].includes(e.status)).length;

  return (
    <div className="space-y-4">
      {/* Course Tabs */}
      <div className="flex gap-1 flex-wrap border-b border-cream-darker/20 pb-0">
        {courses.map(course => {
          const activeCount = course.enrollments?.filter(
            e => ["ENROLLED", "ACTIVE"].includes(e.status)
          ).length ?? 0;
          return (
            <button
              key={course.id}
              id={`course-tab-${course.slug}`}
              onClick={() => setActiveTab(course.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
                activeTab === course.id
                  ? "border-gold text-espresso font-semibold"
                  : "border-transparent text-charcoal-lighter hover:text-espresso"
              }`}
            >
              {course.name}
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === course.id ? "bg-gold/20 text-gold" : "bg-cream-darker/30 text-charcoal-lighter"
              }`}>
                {activeCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Course Header */}
      {activeCourse && (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-charcoal-lighter">Duration: <span className="text-espresso font-medium">{activeCourse.duration}</span></p>
              <p className="text-xs text-charcoal-lighter mt-0.5">
                Capacity: <span className="text-espresso font-medium">{occupancy}/{capacity}</span>
                {occupancy >= capacity && (
                  <span className="ml-2 text-red-500 font-semibold">(Full)</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="export-csv-btn"
              onClick={() => exportCSV(enrollments, activeCourse.name)}
              disabled={enrollments.length === 0}
              className="btn-outline text-xs py-2 px-3 flex items-center gap-1.5 disabled:opacity-40"
            >
              <Download size={13} /> Export CSV
            </button>
            <button
              id="enrol-student-btn"
              onClick={() => setShowModal(true)}
              disabled={occupancy >= capacity}
              className="btn-gold text-xs py-2 px-3 flex items-center gap-1.5 disabled:opacity-40"
            >
              <Plus size={13} /> Enrol Student
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-sm p-3 text-sm text-red-600">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white rounded-sm border border-cream-darker/50 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-gold" size={28} />
          </div>
        ) : enrollments.length === 0 ? (
          <div className="text-center py-16">
            <GraduationCap size={36} className="text-charcoal-lighter/40 mx-auto mb-3" />
            <p className="text-sm text-charcoal-lighter">No students enrolled yet</p>
            <p className="text-xs text-charcoal-lighter/60 mt-1">Click "Enrol Student" to add the first student</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-cream/50 border-b border-cream-darker/20">
                  <th className="text-left py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Student</th>
                  <th className="text-left py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Contact</th>
                  <th className="text-left py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Progress</th>
                  <th className="text-left py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Enrolled</th>
                  <th className="py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map(enrollment => (
                  <tr
                    key={enrollment.id}
                    className={`border-b border-cream-darker/10 hover:bg-cream/20 transition-colors ${
                      enrollment.status === "DROPPED" ? "opacity-50" : ""
                    }`}
                  >
                    <td className="py-3 px-4">
                      <p className="font-medium text-espresso">{enrollment.studentName}</p>
                      {enrollment.notes && (
                        <p className="text-xs text-charcoal-lighter/70 mt-0.5 truncate max-w-[180px]">{enrollment.notes}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-charcoal-lighter">{enrollment.phone}</p>
                      <p className="text-xs text-charcoal-lighter/70">{enrollment.email}</p>
                    </td>
                    <td className="py-3 px-4 min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <ProgressBar status={enrollment.status} />
                        <span className="text-xs text-charcoal-lighter w-8 text-right">{STATUS_META[enrollment.status].progress}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={enrollment.status} />
                    </td>
                    <td className="py-3 px-4 text-xs text-charcoal-lighter">
                      {new Date(enrollment.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        {enrollment.status !== "DROPPED" && enrollment.status !== "COMPLETED" && (
                          <StatusDropdown enrollment={enrollment} onUpdate={handleStatusUpdate} />
                        )}
                        {enrollment.status !== "DROPPED" && (
                          <button
                            id={`unenrol-btn-${enrollment.id}`}
                            onClick={() => handleUnenrol(enrollment.id)}
                            disabled={unenrolling === enrollment.id}
                            title="Unenrol student"
                            className="text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                          >
                            {unenrolling === enrollment.id
                              ? <Loader2 size={15} className="animate-spin" />
                              : <UserMinus size={15} />
                            }
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Enrol Modal */}
      {showModal && activeCourse && (
        <EnrolModal
          courseId={activeCourse.id}
          courseName={activeCourse.name}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); loadEnrollments(); }}
        />
      )}
    </div>
  );
}
