"use client";
import { extractApiError } from "@/lib/extract-error";

import { useState, useEffect, useRef } from "react";
import { X, Check, Loader2, Trash2, AlertTriangle, Upload, ImageIcon } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

export type CourseData = {
  id: string;
  name: string;
  description: string | null;
  duration: string;
  price: number;
  maxStudents: number;
  schedule: string | null;
  prerequisites: string | null;
  certificate: boolean;
  imageUrl: string | null;
  isActive: boolean;
  isFeatured: boolean;
  _count?: { enrollments: number };
};

type CourseForm = {
  name: string;
  description: string;
  duration: string;
  price: string;
  maxStudents: string;
  schedule: string;
  prerequisites: string;
  certificate: boolean;
  imageUrl: string;
  isActive: boolean;
  isFeatured: boolean;
};

const EMPTY_FORM: CourseForm = {
  name: "",
  description: "",
  duration: "",
  price: "",
  maxStudents: "10",
  schedule: "",
  prerequisites: "",
  certificate: true,
  imageUrl: "",
  isActive: false,
  isFeatured: false,
};

// ── Component ────────────────────────────────────────────────────────────────

export default function CourseModal({
  initial,
  onClose,
  onSave,
}: {
  initial: CourseData | null; // null = CREATE mode
  onClose: () => void;
  onSave: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<CourseForm>(
    initial
      ? {
          name: initial.name,
          description: initial.description ?? "",
          duration: initial.duration,
          price: String(initial.price),
          maxStudents: String(initial.maxStudents),
          schedule: initial.schedule ?? "",
          prerequisites: initial.prerequisites ?? "",
          certificate: initial.certificate,
          imageUrl: initial.imageUrl ?? "",
          isActive: initial.isActive,
          isFeatured: initial.isFeatured,
        }
      : EMPTY_FORM
  );
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // ── Image upload ──────────────────────────────────────────────────────────

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "general");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(extractApiError(data, "Image upload failed."));
        return;
      }

      // API returns { data: { imageUrl, thumbnailUrl, ... } }
      const url = data.data?.imageUrl ?? data.data?.url ?? "";
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch {
      setError("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError("Course name is required.");
      return;
    }
    if (!form.duration.trim()) {
      setError("Duration is required.");
      return;
    }
    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) {
      setError("Price must be a positive number.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        duration: form.duration.trim(),
        price,
        maxStudents: parseInt(form.maxStudents) || 10,
        schedule: form.schedule.trim() || null,
        prerequisites: form.prerequisites.trim() || null,
        certificate: form.certificate,
        imageUrl: form.imageUrl.trim() || null,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
      };

      if (initial) {
        // PATCH
        const res = await fetch(`/api/academy/courses/${initial.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(extractApiError(data, "Failed to update course."));
          return;
        }
      } else {
        // POST
        const res = await fetch("/api/academy/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(extractApiError(data, "Failed to create course."));
          return;
        }
      }
      onSave();
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!initial) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/academy/courses/${initial.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(extractApiError(data, "Failed to delete course."));
        return;
      }
      onSave();
      onClose();
    } catch {
      setError("Network error.");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const update = (key: keyof CourseForm, val: string | boolean | number) =>
    setForm((f) => ({ ...f, [key]: val }));

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-darker/30 sticky top-0 bg-white z-10">
          <h2 className="font-display text-lg text-espresso font-bold">
            {initial ? "Edit Course" : "Add Course"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-cream/60 text-charcoal-lighter transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">
              Course Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Professional Hair Styling"
              className="w-full bg-white border border-cream-darker/50 rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Course overview..."
              className="w-full bg-white border border-cream-darker/50 rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 resize-none"
            />
          </div>

          {/* Duration + Price row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">
                Duration *
              </label>
              <input
                type="text"
                value={form.duration}
                onChange={(e) => update("duration", e.target.value)}
                placeholder="e.g. 3 Months"
                className="w-full bg-white border border-cream-darker/50 rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">
                Price (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
                placeholder="e.g. 25000"
                className="w-full bg-white border border-cream-darker/50 rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
              />
            </div>
          </div>

          {/* Max Students + Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">
                Max Students
              </label>
              <input
                type="number"
                min="1"
                value={form.maxStudents}
                onChange={(e) => update("maxStudents", e.target.value)}
                className="w-full bg-white border border-cream-darker/50 rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">
                Schedule
              </label>
              <input
                type="text"
                value={form.schedule}
                onChange={(e) => update("schedule", e.target.value)}
                placeholder="e.g. Mon-Fri, 10AM-1PM"
                className="w-full bg-white border border-cream-darker/50 rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
              />
            </div>
          </div>

          {/* Prerequisites */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">
              Prerequisites
            </label>
            <input
              type="text"
              value={form.prerequisites}
              onChange={(e) => update("prerequisites", e.target.value)}
              placeholder="e.g. 10th pass, basic English"
              className="w-full bg-white border border-cream-darker/50 rounded-md py-2.5 px-3 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20"
            />
          </div>

          {/* Image Upload (P3) */}
          <div>
            <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">
              Course Image
            </label>
            <div className="flex items-start gap-3">
              {form.imageUrl ? (
                <div className="relative w-20 h-20 rounded-md border border-cream-darker/30 overflow-hidden flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.imageUrl}
                    alt="Course thumbnail"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => update("imageUrl", "")}
                    className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                  >
                    <X size={10} />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-md border-2 border-dashed border-cream-darker/30 flex items-center justify-center flex-shrink-0">
                  <ImageIcon size={20} className="text-charcoal-lighter/40" />
                </div>
              )}
              <div className="flex-1">
                <label className="inline-flex items-center gap-2 px-3 py-2 text-xs border border-cream-darker/50 rounded-md cursor-pointer hover:border-gold/50 transition-colors">
                  {uploading ? (
                    <><Loader2 size={12} className="animate-spin" /> Uploading...</>
                  ) : (
                    <><Upload size={12} /> Choose Image</>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                <p className="text-[10px] text-charcoal-lighter mt-1">
                  Max 5MB. JPG, PNG, or WebP.
                </p>
              </div>
            </div>
          </div>

          {/* Toggles: Certificate + Active + Featured */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">
                Certificate
              </label>
              <button
                type="button"
                onClick={() => update("certificate", !form.certificate)}
                className={`w-full flex items-center justify-center gap-1.5 py-2.5 px-3 text-sm font-semibold rounded-md border transition-all ${
                  form.certificate
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-cream-darker/30 bg-cream/20 text-charcoal-lighter"
                }`}
              >
                {form.certificate ? "Yes" : "No"}
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">
                Status
              </label>
              <button
                type="button"
                onClick={() => update("isActive", !form.isActive)}
                className={`w-full flex items-center justify-center gap-1.5 py-2.5 px-3 text-sm font-semibold rounded-md border transition-all ${
                  form.isActive
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                {form.isActive ? "Published" : "Draft"}
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">
                Featured
              </label>
              <button
                type="button"
                onClick={() => update("isFeatured", !form.isFeatured)}
                className={`w-full flex items-center justify-center gap-1.5 py-2.5 px-3 text-sm font-semibold rounded-md border transition-all ${
                  form.isFeatured
                    ? "border-gold/30 bg-gold/10 text-gold-dark"
                    : "border-cream-darker/30 bg-cream/20 text-charcoal-lighter"
                }`}
              >
                {form.isFeatured ? "Yes" : "No"}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md px-4 py-2.5">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-cream-darker/30 flex items-center gap-3">
          {/* Delete (edit mode only) */}
          {initial && !confirmDelete && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs px-3 py-2 rounded-md border border-red-200 text-red-500 hover:bg-red-50 transition-colors flex items-center gap-1"
            >
              <Trash2 size={12} /> Delete
            </button>
          )}
          {initial && confirmDelete && (
            <div className="flex items-center gap-2 flex-1">
              <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
              <span className="text-xs text-red-600">
                {(initial._count?.enrollments ?? 0) > 0
                  ? "Deactivate? (has enrollments)"
                  : "Permanently delete?"}
              </span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs px-3 py-1.5 rounded-md bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? "..." : "Yes"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs px-2 py-1.5 text-charcoal-lighter hover:text-espresso"
              >
                No
              </button>
            </div>
          )}

          <div className="flex-1" />

          <button
            onClick={onClose}
            className="text-sm px-4 py-2.5 border border-cream-darker/50 rounded-md text-charcoal-lighter hover:border-gold/30 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="text-sm px-5 py-2.5 bg-espresso text-cream rounded-md font-semibold hover:bg-espresso/90 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Check size={14} /> {initial ? "Save Changes" : "Add Course"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
