"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Image as ImageIcon,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Star,
  StarOff,
  RefreshCw,
  X,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Archive,
  Save,
  Download,
  BookOpen,
  Map,
  Users,
  Zap,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────

type BlogStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  status: BlogStatus;
  coverImage: string | null;
  category: string | null;
  tags: string[];
  isFeatured: boolean;
  readTime: number;
  viewCount: number;
  createdAt: string;
  publishedAt: string | null;
  author: { id: string; name: string };
};

type GalleryCategory =
  | "HAIR"
  | "MAKEUP"
  | "NAILS"
  | "SKIN"
  | "BRIDAL"
  | "ACADEMY"
  | "SALON_INTERIOR"
  | "BEFORE_AFTER";

type GalleryItem = {
  id: string;
  title: string | null;
  description: string | null;
  imageUrl: string;
  category: GalleryCategory;
  tags: string[];
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  uploadedBy: { id: string; name: string } | null;
};

// ─── Status config ──────────────────────────────────────────────────────────

const blogStatusConfig: Record<BlogStatus, { color: string; bg: string; label: string; Icon: React.ElementType }> = {
  DRAFT:     { color: "text-amber-700",  bg: "bg-amber-50 border-amber-200",  label: "Draft",     Icon: Clock },
  PUBLISHED: { color: "text-green-700",  bg: "bg-green-50 border-green-200",  label: "Published", Icon: CheckCircle },
  ARCHIVED:  { color: "text-gray-500",   bg: "bg-gray-50 border-gray-200",    label: "Archived",  Icon: Archive },
};

const GALLERY_CATEGORIES: { value: GalleryCategory; label: string }[] = [
  { value: "HAIR",           label: "Hair" },
  { value: "MAKEUP",         label: "Makeup" },
  { value: "NAILS",          label: "Nails" },
  { value: "SKIN",           label: "Skin" },
  { value: "BRIDAL",         label: "Bridal" },
  { value: "ACADEMY",        label: "Academy" },
  { value: "SALON_INTERIOR", label: "Salon Interior" },
  { value: "BEFORE_AFTER",   label: "Before & After" },
];

// ─── Blog Editor Modal ──────────────────────────────────────────────────────

type BlogEditorProps = {
  post: Partial<BlogPost> | null;
  onClose: () => void;
  onSaved: () => void;
};

function BlogEditorModal({ post, onClose, onSaved }: BlogEditorProps) {
  const isNew = !post?.id;
  const [form, setForm] = useState({
    title:      post?.title      ?? "",
    excerpt:    post?.excerpt    ?? "",
    content:    post?.content    ?? "",
    category:   post?.category   ?? "",
    status:     (post?.status    ?? "DRAFT") as BlogStatus,
    coverImage: post?.coverImage ?? "",
    isFeatured: post?.isFeatured ?? false,
    tags:       (post?.tags ?? []).join(", "),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload: any = {
        title:      form.title,
        content:    form.content,
        status:     form.status,
        isFeatured: form.isFeatured,
        tags:       form.tags.split(",").map(t => t.trim()).filter(Boolean),
      };
      if (form.excerpt)    payload.excerpt    = form.excerpt;
      if (form.category)   payload.category   = form.category;
      if (form.coverImage) payload.coverImage = form.coverImage;
      if (!isNew)          payload.id         = post!.id;

      const res = await fetch("/api/blog", {
        method:  isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-sm border border-cream-darker/50 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-darker/30">
          <h2 className="font-display text-lg text-espresso">
            {isNew ? "New Blog Post" : "Edit Blog Post"}
          </h2>
          <button onClick={onClose} className="text-charcoal-lighter hover:text-espresso p-1">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-sm p-3 text-sm text-red-700">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">Title *</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Blog post title (min. 5 chars)"
              className="w-full border border-cream-darker/50 rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-gold/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as BlogStatus }))}
                className="w-full border border-cream-darker/50 rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-gold/40 bg-white"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">Category</label>
              <input
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                placeholder="e.g. Hair Care, Bridal Tips"
                className="w-full border border-cream-darker/50 rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-gold/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">Excerpt</label>
            <textarea
              value={form.excerpt}
              onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
              rows={2}
              placeholder="Short summary (shown in cards)"
              className="w-full border border-cream-darker/50 rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-gold/40 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">Content * (min. 100 chars)</label>
            <textarea
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              rows={8}
              placeholder="Full post content…"
              className="w-full border border-cream-darker/50 rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-gold/40 resize-y font-mono"
            />
            <p className="text-[10px] text-charcoal-lighter mt-1">{form.content.length} chars</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">Cover Image URL</label>
            <input
              value={form.coverImage}
              onChange={e => setForm(f => ({ ...f, coverImage: e.target.value }))}
              placeholder="https://..."
              className="w-full border border-cream-darker/50 rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-gold/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">Tags (comma-separated)</label>
            <input
              value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="hair, bridal, tips"
              className="w-full border border-cream-darker/50 rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-gold/40"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))}
              className="accent-gold w-4 h-4"
            />
            <span className="text-sm text-espresso">Mark as Featured</span>
          </label>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-cream-darker/30 flex items-center justify-end gap-3">
          <button onClick={onClose} className="btn-outline text-sm py-2 px-4">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-gold text-sm py-2 px-5 flex items-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isNew ? "Create Post" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Gallery Editor Modal ───────────────────────────────────────────────────

type GalleryEditorProps = {
  item: Partial<GalleryItem> | null;
  onClose: () => void;
  onSaved: () => void;
};

function GalleryEditorModal({ item, onClose, onSaved }: GalleryEditorProps) {
  const isNew = !item?.id;
  const [form, setForm] = useState({
    title:       item?.title       ?? "",
    description: item?.description ?? "",
    imageUrl:    item?.imageUrl    ?? "",
    category:    (item?.category   ?? "HAIR") as GalleryCategory,
    isFeatured:  item?.isFeatured  ?? false,
    isPublished: item?.isPublished ?? true,
    tags:        (item?.tags ?? []).join(", "),
    sortOrder:   item?.sortOrder   ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload: any = {
        imageUrl:    form.imageUrl,
        category:    form.category,
        isFeatured:  form.isFeatured,
        isPublished: form.isPublished,
        sortOrder:   Number(form.sortOrder),
        tags:        form.tags.split(",").map(t => t.trim()).filter(Boolean),
      };
      if (form.title)       payload.title       = form.title;
      if (form.description) payload.description = form.description;
      if (!isNew)           payload.id          = item!.id;

      const res = await fetch("/api/gallery", {
        method:  isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-sm border border-cream-darker/50 w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-darker/30">
          <h2 className="font-display text-lg text-espresso">
            {isNew ? "Add Gallery Item" : "Edit Gallery Item"}
          </h2>
          <button onClick={onClose} className="text-charcoal-lighter hover:text-espresso p-1">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-sm p-3 text-sm text-red-700">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">Image URL *</label>
            <input
              value={form.imageUrl}
              onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
              placeholder="https://..."
              className="w-full border border-cream-darker/50 rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-gold/40"
            />
          </div>

          {form.imageUrl && (
            <div className="rounded-sm overflow-hidden border border-cream-darker/30 h-40 bg-cream/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.imageUrl} alt="preview" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">Title</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Optional caption"
              className="w-full border border-cream-darker/50 rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-gold/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">Category *</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as GalleryCategory }))}
                className="w-full border border-cream-darker/50 rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-gold/40 bg-white"
              >
                {GALLERY_CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">Sort Order</label>
              <input
                type="number"
                min={0}
                max={9999}
                value={form.sortOrder}
                onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
                className="w-full border border-cream-darker/50 rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-gold/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1.5">Tags (comma-separated)</label>
            <input
              value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="bridal, hair, transformation"
              className="w-full border border-cream-darker/50 rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-gold/40"
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} className="accent-gold w-4 h-4" />
              <span className="text-sm text-espresso">Featured</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isPublished} onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} className="accent-gold w-4 h-4" />
              <span className="text-sm text-espresso">Published</span>
            </label>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-cream-darker/30 flex items-center justify-end gap-3">
          <button onClick={onClose} className="btn-outline text-sm py-2 px-4">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-gold text-sm py-2 px-5 flex items-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isNew ? "Add Item" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm ─────────────────────────────────────────────────────────

function ConfirmDeleteModal({ label, onConfirm, onClose }: { label: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-sm border border-cream-darker/50 w-full max-w-sm p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
            <Trash2 size={18} className="text-red-500" />
          </div>
          <div>
            <h3 className="font-display text-base text-espresso">Confirm Delete</h3>
            <p className="text-sm text-charcoal-lighter mt-0.5">Are you sure you want to delete <strong>"{label}"</strong>? This cannot be undone.</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-outline text-sm py-2 px-4">Cancel</button>
          <button onClick={onConfirm} className="bg-red-500 text-white text-sm py-2 px-4 rounded-sm hover:bg-red-600 transition-colors font-semibold">Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Blog Tab ───────────────────────────────────────────────────────────────

function BlogTab() {
  const [posts, setPosts]       = useState<BlogPost[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState<BlogStatus | "ALL">("ALL");
  const [page, setPage]         = useState(1);
  const [editing, setEditing]   = useState<Partial<BlogPost> | null | false>(false); // false = closed
  const [deleting, setDeleting] = useState<BlogPost | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const LIMIT = 15;

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res  = await fetch(`/api/blog?${params}`);
      const data = await res.json();
      setPosts(data.posts || []);
      setTotal(data.pagination?.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const quickStatus = async (id: string, status: BlogStatus) => {
    setActionId(id);
    try {
      await fetch("/api/blog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      fetchPosts();
    } finally {
      setActionId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setActionId(deleting.id);
    await fetch(`/api/blog?id=${deleting.id}`, { method: "DELETE" });
    setDeleting(null);
    setActionId(null);
    fetchPosts();
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <>
      {/* Modals */}
      {editing !== false && (
        <BlogEditorModal post={editing} onClose={() => setEditing(false)} onSaved={fetchPosts} />
      )}
      {deleting && (
        <ConfirmDeleteModal
          label={deleting.title}
          onConfirm={confirmDelete}
          onClose={() => setDeleting(null)}
        />
      )}

      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          {(["ALL", "DRAFT", "PUBLISHED", "ARCHIVED"] as const).map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`text-xs px-3 py-1.5 rounded-sm border font-semibold transition-all ${
                statusFilter === s
                  ? s === "ALL" ? "bg-espresso text-cream border-espresso"
                    : s === "PUBLISHED" ? "bg-green-50 text-green-700 border-green-300"
                    : s === "DRAFT"     ? "bg-amber-50 text-amber-700 border-amber-300"
                    : "bg-gray-50 text-gray-600 border-gray-300"
                  : "bg-white text-charcoal-lighter border-cream-darker/50 hover:border-gold/30"
              }`}
            >
              {s === "ALL" ? "All Posts" : blogStatusConfig[s].label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-lighter" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search posts…"
              className="pl-9 pr-3 py-2 text-xs border border-cream-darker/50 rounded-sm focus:outline-none focus:border-gold/40 w-48"
            />
          </div>
          <button onClick={() => setEditing(null)} className="btn-gold text-xs py-2 px-4 flex items-center gap-1.5">
            <Plus size={14} /> New Post
          </button>
          <button onClick={fetchPosts} className="btn-outline text-xs py-2 px-3">
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-sm border border-cream-darker/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream/50 border-b border-cream-darker/30">
                <th className="text-left py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Title</th>
                <th className="text-left py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Author</th>
                <th className="text-left py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Category</th>
                <th className="text-center py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Status</th>
                <th className="text-center py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Views</th>
                <th className="text-right py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12">
                  <Loader2 className="animate-spin text-gold mx-auto" size={24} />
                </td></tr>
              ) : posts.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-charcoal-lighter text-sm">No posts found.</td></tr>
              ) : posts.map(post => {
                const cfg = blogStatusConfig[post.status];
                const Icon = cfg.Icon;
                return (
                  <tr key={post.id} className="border-b border-cream-darker/10 hover:bg-cream/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {post.isFeatured && <Star size={12} className="text-gold flex-shrink-0" />}
                        <div>
                          <p className="font-medium text-espresso line-clamp-1">{post.title}</p>
                          <p className="text-[10px] text-charcoal-lighter font-mono">{post.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-charcoal-lighter">{post.author?.name ?? "—"}</td>
                    <td className="py-3 px-4">
                      {post.category
                        ? <span className="text-[10px] bg-cream px-2 py-0.5 rounded font-semibold text-charcoal uppercase tracking-wide">{post.category}</span>
                        : <span className="text-xs text-charcoal-lighter/50 italic">—</span>
                      }
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border ${cfg.bg} ${cfg.color}`}>
                        <Icon size={10} /> {cfg.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-xs text-charcoal-lighter">{post.viewCount}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick status toggle */}
                        {post.status === "DRAFT" && (
                          <button onClick={() => quickStatus(post.id, "PUBLISHED")} disabled={actionId === post.id}
                            title="Publish"
                            className="p-1.5 rounded-sm text-green-600 hover:bg-green-50 border border-transparent hover:border-green-200 transition-all disabled:opacity-40">
                            <Eye size={14} />
                          </button>
                        )}
                        {post.status === "PUBLISHED" && (
                          <button onClick={() => quickStatus(post.id, "DRAFT")} disabled={actionId === post.id}
                            title="Unpublish → Draft"
                            className="p-1.5 rounded-sm text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all disabled:opacity-40">
                            <EyeOff size={14} />
                          </button>
                        )}
                        {post.status !== "ARCHIVED" && (
                          <button onClick={() => quickStatus(post.id, "ARCHIVED")} disabled={actionId === post.id}
                            title="Archive"
                            className="p-1.5 rounded-sm text-gray-500 hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all disabled:opacity-40">
                            <Archive size={14} />
                          </button>
                        )}
                        <button onClick={() => setEditing(post)}
                          className="p-1.5 rounded-sm text-gold hover:bg-gold/10 border border-transparent hover:border-gold/20 transition-all">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleting(post)}
                          className="p-1.5 rounded-sm text-red-400 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 bg-cream/30 border-t border-cream-darker/20 flex items-center justify-between">
          <p className="text-xs text-charcoal-lighter">
            Showing {posts.length} of {total} posts
          </p>
          {pages > 1 && (
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="text-xs px-3 py-1.5 border border-cream-darker/50 rounded-sm disabled:opacity-40 hover:border-gold/30">Prev</button>
              <span className="text-xs px-3 py-1.5 text-charcoal-lighter">{page} / {pages}</span>
              <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
                className="text-xs px-3 py-1.5 border border-cream-darker/50 rounded-sm disabled:opacity-40 hover:border-gold/30">Next</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Gallery Tab ────────────────────────────────────────────────────────────

function GalleryTab() {
  const [items, setItems]       = useState<GalleryItem[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [catFilter, setCatFilter] = useState<GalleryCategory | "ALL">("ALL");
  const [page, setPage]         = useState(1);
  const [editing, setEditing]   = useState<Partial<GalleryItem> | null | false>(false);
  const [deleting, setDeleting] = useState<GalleryItem | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const LIMIT = 24;

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (catFilter !== "ALL") params.set("category", catFilter);
      const res  = await fetch(`/api/gallery?${params}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.pagination?.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, catFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const toggleFeatured = async (item: GalleryItem) => {
    setActionId(item.id);
    await fetch("/api/gallery", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, isFeatured: !item.isFeatured }),
    });
    setActionId(null);
    fetchItems();
  };

  const togglePublished = async (item: GalleryItem) => {
    setActionId(item.id);
    await fetch("/api/gallery", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, isPublished: !item.isPublished }),
    });
    setActionId(null);
    fetchItems();
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    await fetch(`/api/gallery?id=${deleting.id}`, { method: "DELETE" });
    setDeleting(null);
    fetchItems();
  };

  const pages = Math.ceil(total / LIMIT);
  const catLabel = (c: GalleryCategory) => GALLERY_CATEGORIES.find(x => x.value === c)?.label ?? c;

  return (
    <>
      {editing !== false && (
        <GalleryEditorModal item={editing} onClose={() => setEditing(false)} onSaved={fetchItems} />
      )}
      {deleting && (
        <ConfirmDeleteModal
          label={deleting.title ?? deleting.category}
          onConfirm={confirmDelete}
          onClose={() => setDeleting(null)}
        />
      )}

      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => { setCatFilter("ALL"); setPage(1); }}
            className={`text-xs px-3 py-1.5 rounded-sm border font-semibold transition-all ${catFilter === "ALL" ? "bg-espresso text-cream border-espresso" : "bg-white text-charcoal-lighter border-cream-darker/50 hover:border-gold/30"}`}>
            All
          </button>
          {GALLERY_CATEGORIES.map(c => (
            <button key={c.value} onClick={() => { setCatFilter(c.value); setPage(1); }}
              className={`text-xs px-3 py-1.5 rounded-sm border font-semibold transition-all ${catFilter === c.value ? "bg-gold/10 text-gold border-gold/30" : "bg-white text-charcoal-lighter border-cream-darker/50 hover:border-gold/30"}`}>
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setEditing(null)} className="btn-gold text-xs py-2 px-4 flex items-center gap-1.5">
            <Plus size={14} /> Add Item
          </button>
          <button onClick={fetchItems} className="btn-outline text-xs py-2 px-3">
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gold" size={28} /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-charcoal-lighter text-sm">No gallery items found.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {items.map(item => (
            <div key={item.id} className="group relative bg-white rounded-sm border border-cream-darker/30 overflow-hidden hover:shadow-lg hover:border-gold/30 transition-all">
              {/* Image */}
              <div className="aspect-square bg-cream/50 relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl}
                  alt={item.title ?? item.category}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={e => { (e.target as HTMLImageElement).src = "https://placehold.co/400x400/FDFAF5/C9A84C?text=Image"; }}
                />
                {/* Badges */}
                <div className="absolute top-1.5 left-1.5 flex gap-1">
                  {item.isFeatured && (
                    <span className="bg-gold text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">Featured</span>
                  )}
                  {!item.isPublished && (
                    <span className="bg-gray-700 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">Hidden</span>
                  )}
                </div>
                {/* Overlay actions */}
                <div className="absolute inset-0 bg-espresso/0 group-hover:bg-espresso/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleFeatured(item)}
                      disabled={actionId === item.id}
                      title={item.isFeatured ? "Unfeature" : "Feature"}
                      className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-gold/20 transition-colors disabled:opacity-40"
                    >
                      {item.isFeatured
                        ? <StarOff size={14} className="text-gold" />
                        : <Star size={14} className="text-gold" />
                      }
                    </button>
                    <button
                      onClick={() => togglePublished(item)}
                      disabled={actionId === item.id}
                      title={item.isPublished ? "Hide" : "Show"}
                      className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-blue-50 transition-colors disabled:opacity-40"
                    >
                      {item.isPublished
                        ? <EyeOff size={14} className="text-blue-600" />
                        : <Eye size={14} className="text-blue-600" />
                      }
                    </button>
                    <button
                      onClick={() => setEditing(item)}
                      className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-gold/10 transition-colors"
                    >
                      <Pencil size={14} className="text-gold" />
                    </button>
                    <button
                      onClick={() => setDeleting(item)}
                      className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
              {/* Info */}
              <div className="p-2.5">
                <p className="text-xs font-semibold text-espresso truncate">{item.title || "—"}</p>
                <p className="text-[10px] text-charcoal-lighter uppercase tracking-wide mt-0.5">{catLabel(item.category)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-charcoal-lighter">Showing {items.length} of {total} items</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="text-xs px-3 py-1.5 border border-cream-darker/50 rounded-sm disabled:opacity-40 hover:border-gold/30">Prev</button>
            <span className="text-xs px-3 py-1.5 text-charcoal-lighter">{page} / {pages}</span>
            <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
              className="text-xs px-3 py-1.5 border border-cream-darker/50 rounded-sm disabled:opacity-40 hover:border-gold/30">Next</button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Documents Tab ──────────────────────────────────────────────────────────

type DocEntry = {
  id: string;
  title: string;
  description: string;
  filename: string;
  audience: string;
  size: string;
  Icon: React.ElementType;
  accentColor: string;
  bgColor: string;
};

const DOCUMENTS: DocEntry[] = [
  {
    id: "project-map",
    title: "Project Map",
    description:
      "Complete architecture reference — all routes, API endpoints, database models, component library, design tokens, and live completion status for every dashboard page.",
    filename: "PROJECT_MAP.md",
    audience: "Developers · Project Managers",
    size: "~12 KB",
    Icon: Map,
    accentColor: "text-indigo-600",
    bgColor: "bg-indigo-50 border-indigo-100",
  },
  {
    id: "about-project",
    title: "About the Project",
    description:
      "Business overview, technology decision rationale, full service catalogue, loyalty tier structure, e-commerce setup, SEO strategy, and security model.",
    filename: "ABOUT_PROJECT.md",
    audience: "Stakeholders · New Team Members",
    size: "~8.5 KB",
    Icon: BookOpen,
    accentColor: "text-emerald-600",
    bgColor: "bg-emerald-50 border-emerald-100",
  },
  {
    id: "user-manual",
    title: "User & Client Manual",
    description:
      "Step-by-step guide for clients — account creation, appointment booking, product shopping, loyalty programme, gift vouchers, profile management, and FAQs.",
    filename: "USER_MANUAL.md",
    audience: "Clients · End Users",
    size: "~8.5 KB",
    Icon: Users,
    accentColor: "text-rose-600",
    bgColor: "bg-rose-50 border-rose-100",
  },
  {
    id: "productivity-guide",
    title: "Developer Productivity Guide",
    description:
      "Developer handbook covering environment setup, API patterns, database operations, component standards, auth guards, debugging tips, git conventions, deployment, and the full priority backlog.",
    filename: "PRODUCTIVITY_GUIDE.md",
    audience: "Developers",
    size: "~19 KB",
    Icon: Zap,
    accentColor: "text-amber-600",
    bgColor: "bg-amber-50 border-amber-100",
  },
];

function DocumentsTab() {
  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="flex items-start gap-3 bg-cream/60 border border-cream-darker/30 rounded-sm px-4 py-3">
        <FileText size={16} className="text-gold mt-0.5 flex-shrink-0" />
        <p className="text-sm text-charcoal-lighter leading-relaxed">
          These documents are generated from the live codebase and cover all aspects of the platform.
          Click <strong className="text-espresso">Download</strong> on any card to save the file locally.
          Files are served as plain Markdown (<code className="text-xs bg-cream px-1 py-0.5 rounded">.md</code>) and can be
          opened in any text editor, VS Code, or Markdown viewer.
        </p>
      </div>

      {/* Document cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DOCUMENTS.map((doc) => {
          const Icon = doc.Icon;
          return (
            <div
              key={doc.id}
              className="bg-white rounded-sm border border-cream-darker/40 overflow-hidden hover:shadow-md hover:border-gold/30 transition-all group"
            >
              {/* Card header */}
              <div className={`px-5 py-4 border-b border-cream-darker/20 flex items-center gap-3 ${doc.bgColor}`}>
                <div className={`w-9 h-9 rounded-sm flex items-center justify-center bg-white/70 border border-white/50`}>
                  <Icon size={18} className={doc.accentColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-base font-semibold text-espresso leading-tight">
                    {doc.title}
                  </h3>
                  <p className={`text-[10px] font-semibold uppercase tracking-wider mt-0.5 ${doc.accentColor}`}>
                    {doc.audience}
                  </p>
                </div>
                <span className="text-[10px] text-charcoal-lighter bg-white/70 border border-white/50 px-2 py-0.5 rounded font-mono flex-shrink-0">
                  {doc.size}
                </span>
              </div>

              {/* Card body */}
              <div className="px-5 py-4 flex flex-col gap-4">
                <p className="text-sm text-charcoal-lighter leading-relaxed">
                  {doc.description}
                </p>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] text-charcoal-lighter font-mono bg-cream/70 border border-cream-darker/20 px-2 py-1 rounded">
                    /docs/{doc.filename}
                  </span>
                  <a
                    href={`/docs/${doc.filename}`}
                    download={doc.filename}
                    className="inline-flex items-center gap-2 btn-gold text-xs py-2 px-4 group-hover:shadow-sm transition-shadow"
                  >
                    <Download size={13} />
                    Download
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="text-[11px] text-charcoal-lighter/60 text-center pt-2">
        Documents are located at{" "}
        <code className="text-[11px] bg-cream px-1 py-0.5 rounded">docs/</code> in the project root
        and mirrored to{" "}
        <code className="text-[11px] bg-cream px-1 py-0.5 rounded">public/docs/</code> for static serving.
        Re-run the copy command after editing source files to keep them in sync.
      </p>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

type Tab = "blog" | "gallery" | "documents";

export default function AdminContentPage() {
  const [tab, setTab] = useState<Tab>("blog");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl text-espresso">Content Management</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-cream/60 rounded-sm p-1 w-fit border border-cream-darker/30">
        <button
          onClick={() => setTab("blog")}
          className={`flex items-center gap-2 px-5 py-2 rounded-sm text-sm font-semibold transition-all ${
            tab === "blog" ? "bg-white text-espresso shadow-sm" : "text-charcoal-lighter hover:text-espresso"
          }`}
        >
          <FileText size={15} /> Blog Posts
        </button>
        <button
          onClick={() => setTab("gallery")}
          className={`flex items-center gap-2 px-5 py-2 rounded-sm text-sm font-semibold transition-all ${
            tab === "gallery" ? "bg-white text-espresso shadow-sm" : "text-charcoal-lighter hover:text-espresso"
          }`}
        >
          <ImageIcon size={15} /> Gallery
        </button>
        <button
          onClick={() => setTab("documents")}
          className={`flex items-center gap-2 px-5 py-2 rounded-sm text-sm font-semibold transition-all ${
            tab === "documents" ? "bg-white text-espresso shadow-sm" : "text-charcoal-lighter hover:text-espresso"
          }`}
        >
          <Download size={15} /> Documents
        </button>
      </div>

      {/* Tab content */}
      {tab === "blog"      && <BlogTab />}
      {tab === "gallery"   && <GalleryTab />}
      {tab === "documents" && <DocumentsTab />}
    </div>
  );
}
