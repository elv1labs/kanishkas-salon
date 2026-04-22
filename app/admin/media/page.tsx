"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Image as ImageIcon, Upload, Trash2, Edit3, Plus, Check, X,
  ChevronUp, ChevronDown, Eye, Loader2, AlertCircle, Star, Users,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────
type HeroSlide = {
  id: string; imageUrl: string; eyebrow: string | null; title: string;
  titleItalic: string | null; subtitle: string | null;
  ctaLabel: string; ctaHref: string; sortOrder: number; isActive: boolean;
};

type SiteImage = {
  id: string; key: string; label: string; imageUrl: string; altText: string | null;
};

type StaffMember = {
  id: string; name: string; designation: string | null; avatarUrl: string | null;
};

type Tab = "hero" | "site" | "gallery" | "staff";

// ─── Toast ─────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const show = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };
  return { toast, show };
}

// ─── Upload helper (file or URL) ───────────────────────
async function uploadImageFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    // Server returned non-JSON (e.g. HTML 413 from reverse proxy)
    throw new Error(
      res.status === 413
        ? "File is too large. Please use a smaller image (max 10 MB)."
        : `Upload failed (HTTP ${res.status})`
    );
  }
  if (!res.ok) {
    throw new Error(data.error ?? "Upload failed");
  }
  return data.url;
}

// ─── Image Picker Modal ────────────────────────────────
function ImagePickerModal({
  title, onDone, onClose,
}: {
  title: string;
  onDone: (url: string) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"url" | "file">("file");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setErr("");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleConfirm = async () => {
    setErr("");
    try {
      setUploading(true);
      let finalUrl = "";
      if (mode === "file" && file) {
        finalUrl = await uploadImageFile(file);
      } else if (mode === "url") {
        if (!url.trim()) { setErr("Please enter an image URL"); return; }
        finalUrl = url.trim();
      } else {
        setErr("Please select a file or paste a URL");
        return;
      }
      onDone(finalUrl);
    } catch (e: any) {
      setErr(e.message ?? "Failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-espresso/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-sm w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-cream-darker/30">
          <h3 className="font-display text-base text-espresso">{title}</h3>
          <button onClick={onClose}><X size={18} className="text-charcoal-lighter hover:text-espresso" /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Mode Toggle */}
          <div className="flex gap-1 bg-cream rounded-sm p-1">
            {(["file", "url"] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setErr(""); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-sm transition-all ${mode === m ? "bg-white text-espresso shadow-sm" : "text-charcoal-lighter hover:bg-white/50"}`}>
                {m === "file" ? "📁 Upload File" : "🔗 Paste URL"}
              </button>
            ))}
          </div>

          {mode === "file" ? (
            <div
              onDrop={handleDrop} onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-cream-darker rounded-sm p-8 text-center cursor-pointer hover:border-gold/50 transition-colors"
            >
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              {preview ? (
                <img src={preview} alt="preview" className="max-h-40 mx-auto object-contain rounded-sm" />
              ) : (
                <>
                  <Upload size={28} className="mx-auto text-cream-darker mb-2" />
                  <p className="text-sm text-charcoal-lighter">Drag & drop or <span className="text-gold font-semibold">browse</span></p>
                  <p className="text-xs text-charcoal-lighter/60 mt-1">JPG, PNG, WebP, GIF, AVIF · max 10 MB</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <input type="url" value={url} onChange={e => { setUrl(e.target.value); setErr(""); }}
                placeholder="https://example.com/photo.jpg"
                className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40" />
              {url && url.includes("drive.google.com") && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle size={12} />
                  Google Drive share links don&apos;t display as images. Use a direct image URL or switch to &quot;Upload File&quot;.
                </p>
              )}
              {url && url.startsWith("/uploads/") && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle size={12} />
                  Old-style /uploads/ paths may not resolve. Use the &quot;Upload File&quot; tab instead.
                </p>
              )}
              {url && <img src={url} alt="preview" className="max-h-36 w-full object-contain rounded-sm border border-cream-darker/30" onError={() => setErr("Could not load image from that URL — check it's a direct image link")} />}
            </div>
          )}

          {err && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{err}</p>}
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="btn-outline flex-1 py-2.5 text-xs">Cancel</button>
          <button onClick={handleConfirm} disabled={uploading}
            className="btn-gold flex-1 py-2.5 text-xs disabled:opacity-50 flex items-center justify-center gap-1.5">
            {uploading ? <><Loader2 size={12} className="animate-spin" />Uploading…</> : <><Check size={12} />Set Image</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Hero Slides Tab ────────────────────────────────────
function HeroSlidesTab({ toast }: { toast: ReturnType<typeof useToast> }) {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<HeroSlide | null>(null);
  const [editForm, setEditForm] = useState<Partial<HeroSlide>>({});
  const [picker, setPicker] = useState<"new" | "edit" | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/hero-slides");
    const d = await res.json();
    setSlides(d.slides ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const moveSlide = async (id: string, direction: "up" | "down") => {
    const idx = slides.findIndex(s => s.id === id);
    const newSlides = [...slides];
    const swap = direction === "up" ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= newSlides.length) return;
    [newSlides[idx], newSlides[swap]] = [newSlides[swap], newSlides[idx]];
    // patch sortOrders
    await Promise.all(newSlides.map((s, i) =>
      fetch("/api/admin/hero-slides", { method: "PATCH", body: JSON.stringify({ id: s.id, sortOrder: i }), headers: { "Content-Type": "application/json" } })
    ));
    setSlides(newSlides.map((s, i) => ({ ...s, sortOrder: i })));
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/hero-slides", {
        method: editing.id.startsWith("__new") ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing.id.startsWith("__new") ? editForm : { ...editForm, id: editing.id }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.show("Slide saved!");
      setEditing(null);
      setEditForm({});
      load();
    } catch (e: any) {
      toast.show(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteSlide = async (id: string) => {
    if (!confirm("Delete this slide?")) return;
    setDeleting(id);
    await fetch(`/api/admin/hero-slides?id=${id}`, { method: "DELETE" });
    toast.show("Deleted");
    setDeleting(null);
    load();
  };

  const startNew = () => {
    const newSlide: HeroSlide = {
      id: "__new", imageUrl: "", eyebrow: "Indore's Premier Salon", title: "Kanishka's Family",
      titleItalic: "Salon & Academy", subtitle: "Step into a world of beauty & luxury", 
      ctaLabel: "Book Appointment", ctaHref: "/book", sortOrder: slides.length, isActive: true,
    };
    setEditing(newSlide);
    setEditForm(newSlide);
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gold" size={28} /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-charcoal-lighter">{slides.length} slide{slides.length !== 1 ? "s" : ""} · changes go live immediately</p>
        <button onClick={startNew} className="btn-gold text-xs py-2 px-4 flex items-center gap-1.5"><Plus size={13} />Add Slide</button>
      </div>

      {slides.length === 0 && (
        <div className="bg-white rounded-sm border border-cream-darker/50 p-10 text-center">
          <ImageIcon size={36} className="mx-auto text-cream-darker mb-3" />
          <p className="text-sm text-charcoal-lighter">No hero slides yet. Add one to replace the default hero.</p>
        </div>
      )}

      <div className="space-y-3">
        {slides.map((s, i) => (
          <div key={s.id} className="bg-white rounded-sm border border-cream-darker/50 flex items-center gap-3 p-3 hover:shadow-sm transition-all">
            <div className="w-20 h-14 rounded-sm overflow-hidden flex-shrink-0 bg-cream">
              {s.imageUrl && <img src={s.imageUrl} alt={s.title} className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-espresso text-sm truncate">{s.title}{s.titleItalic ? ` — ${s.titleItalic}` : ""}</p>
              <p className="text-xs text-charcoal-lighter truncate">{s.eyebrow ?? ""} · {s.subtitle ?? ""}</p>
              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded mt-1 inline-block ${s.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {s.isActive ? "Active" : "Hidden"}
              </span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => moveSlide(s.id, "up")} disabled={i === 0} className="w-7 h-7 rounded flex items-center justify-center hover:bg-cream disabled:opacity-30"><ChevronUp size={14} /></button>
              <button onClick={() => moveSlide(s.id, "down")} disabled={i === slides.length - 1} className="w-7 h-7 rounded flex items-center justify-center hover:bg-cream disabled:opacity-30"><ChevronDown size={14} /></button>
              <button onClick={() => { setEditing(s); setEditForm(s); }} className="w-7 h-7 rounded flex items-center justify-center hover:bg-cream text-charcoal-lighter hover:text-espresso"><Edit3 size={13} /></button>
              <a href={s.imageUrl} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded flex items-center justify-center hover:bg-cream text-charcoal-lighter hover:text-espresso"><Eye size={13} /></a>
              <button onClick={() => deleteSlide(s.id)} disabled={deleting === s.id} className="w-7 h-7 rounded flex items-center justify-center hover:bg-red-50 text-charcoal-lighter hover:text-red-500">
                {deleting === s.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-espresso/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-sm w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-cream-darker/30">
              <h3 className="font-display text-base text-espresso">{editing.id.startsWith("__new") ? "New Slide" : "Edit Slide"}</h3>
              <button onClick={() => { setEditing(null); setEditForm({}); }}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              {/* Image */}
              <div>
                <label className="label-sm">Hero Image *</label>
                {editForm.imageUrl && <img src={editForm.imageUrl} alt="preview" className="w-full h-28 object-cover rounded-sm mb-2" />}
                <button onClick={() => setPicker("edit")} className="btn-outline text-xs py-2 px-3 w-full flex items-center justify-center gap-1.5">
                  <Upload size={12} />{editForm.imageUrl ? "Change Image" : "Choose Image"}
                </button>
              </div>
              {[
                { label: "Eyebrow Text", key: "eyebrow", placeholder: "Indore's Premier Salon" },
                { label: "Title *", key: "title", placeholder: "Kanishka's Family" },
                { label: "Title Italic", key: "titleItalic", placeholder: "Salon & Academy" },
                { label: "Subtitle", key: "subtitle", placeholder: "Step into a world of beauty..." },
                { label: "CTA Button Label", key: "ctaLabel", placeholder: "Book Appointment" },
                { label: "CTA Link", key: "ctaHref", placeholder: "/book" },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="label-sm">{label}</label>
                  <input type="text" value={(editForm as any)[key] ?? ""}
                    onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2 px-3 text-sm focus:outline-none focus:border-gold/40" />
                </div>
              ))}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editForm.isActive ?? true}
                  onChange={e => setEditForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="rounded text-gold" />
                <span className="text-sm text-espresso">Active (visible on homepage)</span>
              </label>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => { setEditing(null); setEditForm({}); }} className="btn-outline flex-1 py-2.5 text-xs">Cancel</button>
              <button onClick={saveEdit} disabled={saving || !editForm.imageUrl || !editForm.title}
                className="btn-gold flex-1 py-2.5 text-xs disabled:opacity-50 flex items-center justify-center gap-1.5">
                {saving ? <><Loader2 size={12} className="animate-spin" />Saving…</> : <><Check size={12} />Save Slide</>}
              </button>
            </div>
          </div>
          {picker === "edit" && (
            <ImagePickerModal title="Choose Hero Image" onClose={() => setPicker(null)}
              onDone={url => { setEditForm(f => ({ ...f, imageUrl: url })); setPicker(null); }} />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Site Images Tab ────────────────────────────────────
function SiteImagesTab({ toast }: { toast: ReturnType<typeof useToast> }) {
  const [images, setImages] = useState<SiteImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [picker, setPicker] = useState<string | null>(null); // key of image being edited
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/site-images");
    const d = await res.json();
    setImages(d.images ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleChange = async (key: string, imageUrl: string) => {
    setSaving(key);
    try {
      const res = await fetch("/api/admin/site-images", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, imageUrl }),
      });
      const text = await res.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          res.status === 413
            ? "Request too large"
            : `Server error (HTTP ${res.status}). Please try again.`
        );
      }
      if (!res.ok) {
        throw new Error(data?.error ?? "Save failed");
      }
      toast.show("Image updated!");
      load();
    } catch (e: any) {
      toast.show(e.message, "error");
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gold" size={28} /></div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {images.map(img => (
        <div key={img.key} className="bg-white rounded-sm border border-cream-darker/50 overflow-hidden hover:shadow-md transition-all">
          <div className="aspect-video bg-cream relative overflow-hidden">
            <img src={img.imageUrl} alt={img.label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-espresso/0 hover:bg-espresso/30 transition-all flex items-center justify-center opacity-0 hover:opacity-100 gap-2">
              <a href={img.imageUrl} target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 bg-white/80 rounded-full flex items-center justify-center text-espresso hover:bg-white"><Eye size={13} /></a>
            </div>
          </div>
          <div className="p-3">
            <p className="text-xs font-semibold text-espresso">{img.label}</p>
            <p className="text-[10px] text-charcoal-lighter font-mono mt-0.5">{img.key}</p>
            <button
              onClick={() => setPicker(img.key)}
              disabled={saving === img.key}
              className="mt-2 btn-outline text-xs py-1.5 px-3 w-full flex items-center justify-center gap-1.5"
            >
              {saving === img.key ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
              Change Image
            </button>
          </div>
          {picker === img.key && (
            <ImagePickerModal title={`Change: ${img.label}`} onClose={() => setPicker(null)}
              onDone={url => { setPicker(null); handleChange(img.key, url); }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Staff Portraits Tab ────────────────────────────────
function StaffPortraitsTab({ toast }: { toast: ReturnType<typeof useToast> }) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [picker, setPicker] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const FALLBACK_AVATARS = [
    "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=300&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=300&h=300&fit=crop&q=80",
    "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=300&h=300&fit=crop&q=80",
  ];

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/staff");
    const d = await res.json();
    const raw = Array.isArray(d) ? d : (d.staff ?? []);
    setStaff(raw.map((s: any) => ({
      id: s.id,
      name: s.name ?? "Staff Member",
      designation: s.staffProfile?.designation ?? null,
      avatarUrl: s.staffProfile?.avatarUrl ?? null,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSetPortrait = async (userId: string, imageUrl: string) => {
    setSaving(userId);
    try {
      const res = await fetch(`/api/staff/${userId}/avatar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: imageUrl }),
      });
      if (!res.ok) throw new Error("Failed to update portrait");
      toast.show("Portrait updated!");
      load();
    } catch (e: any) {
      toast.show(e.message, "error");
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gold" size={28} /></div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {staff.map((member, i) => {
        const avatar = member.avatarUrl ?? FALLBACK_AVATARS[i % FALLBACK_AVATARS.length];
        return (
          <div key={member.id} className="bg-white rounded-sm border border-cream-darker/50 p-4 text-center hover:shadow-md transition-all">
            <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-3 border-2 border-cream-darker">
              <img src={avatar} alt={member.name} className="w-full h-full object-cover" />
            </div>
            <p className="font-semibold text-espresso text-sm">{member.name}</p>
            {member.designation && <p className="text-xs text-gold mt-0.5">{member.designation}</p>}
            {!member.avatarUrl && (
              <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded mt-1 inline-block">Using fallback</span>
            )}
            <button
              onClick={() => setPicker(member.id)}
              disabled={saving === member.id}
              className="mt-3 btn-outline text-xs py-1.5 px-3 w-full flex items-center justify-center gap-1.5"
            >
              {saving === member.id ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
              {member.avatarUrl ? "Change Portrait" : "Set Portrait"}
            </button>
            {picker === member.id && (
              <ImagePickerModal title={`Portrait: ${member.name}`} onClose={() => setPicker(null)}
                onDone={url => { setPicker(null); handleSetPortrait(member.id, url); }} />
            )}
          </div>
        );
      })}
      {staff.length === 0 && (
        <div className="col-span-full bg-white rounded-sm border border-cream-darker/50 p-10 text-center">
          <Users size={36} className="mx-auto text-cream-darker mb-3" />
          <p className="text-sm text-charcoal-lighter">No staff members found. Add staff via the Staff Management page.</p>
        </div>
      )}
    </div>
  );
}

// ─── Gallery Tab ────────────────────────────────────────
function GalleryTab() {
  return (
    <div className="bg-white rounded-sm border border-cream-darker/50 p-8 text-center space-y-4">
      <Star size={36} className="mx-auto text-gold" />
      <h3 className="font-display text-lg text-espresso">Gallery Management</h3>
      <p className="text-sm text-charcoal-lighter max-w-sm mx-auto">
        Full gallery management (upload, feature, categorise, delete) is available in the Gallery Manager.
        Featured items appear on the homepage gallery preview.
      </p>
      <a href="/dashboard/receptionist/gallery" className="btn-gold inline-flex items-center gap-2 text-xs">
        <ImageIcon size={13} /> Open Gallery Manager
      </a>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────
export default function AdminMediaPage() {
  const [tab, setTab] = useState<Tab>("hero");
  const toastHook = useToast();

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "hero",    label: "Hero Slides",     icon: <ImageIcon size={14} /> },
    { key: "site",    label: "Site Images",     icon: <ImageIcon size={14} /> },
    { key: "gallery", label: "Gallery",         icon: <Star size={14} /> },
    { key: "staff",   label: "Staff Portraits", icon: <Users size={14} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastHook.toast && (
        <div className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-sm shadow-lg text-sm font-medium flex items-center gap-2 ${toastHook.toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
          {toastHook.toast.type === "success" ? <Check size={14} /> : <AlertCircle size={14} />}
          {toastHook.toast.msg}
        </div>
      )}

      <div>
        <h1 className="font-display text-xl text-espresso flex items-center gap-2">
          <ImageIcon size={20} className="text-gold" /> Media Manager
        </h1>
        <p className="text-xs text-charcoal-lighter mt-0.5">
          Manage every image visible on the public website — no code changes needed.
        </p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-cream rounded-sm p-1 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-sm whitespace-nowrap transition-all ${tab === t.key ? "bg-white text-espresso shadow-sm" : "text-charcoal-lighter hover:bg-white/50"}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "hero"    && <HeroSlidesTab toast={toastHook} />}
      {tab === "site"    && <SiteImagesTab toast={toastHook} />}
      {tab === "gallery" && <GalleryTab />}
      {tab === "staff"   && <StaffPortraitsTab toast={toastHook} />}
    </div>
  );
}
