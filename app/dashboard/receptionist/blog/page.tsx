"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Plus, Clock, Edit3, Eye, Trash2, X, Save, Loader2, AlertCircle } from "lucide-react";

type BlogPost = {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    content?: string;
    category: string | null;
    status: string;
    tags: string[];
    readTime: number | null;
    viewCount: number;
    isFeatured: boolean;
    createdAt: string;
    updatedAt?: string;
    publishedAt: string | null;
    author: { id: string; name: string; image: string | null };
    _count?: { comments: number };
};

const categories = ["Hair Care", "Skin Care", "Makeup", "Hair Treatments", "Nail Art", "Bridal", "Academy", "Tips & Tricks"];

export default function ReceptionistBlogPage() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showEditor, setShowEditor] = useState(false);
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    // Form state
    const [newTitle, setNewTitle] = useState("");
    const [newCategory, setNewCategory] = useState("Hair Care");
    const [newContent, setNewContent] = useState("");
    const [newExcerpt, setNewExcerpt] = useState("");
    const [newTags, setNewTags] = useState("");

    const showToast = (message: string, type: "success" | "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadPosts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/blog?status=DRAFT&limit=50");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setPosts(data.posts ?? []);
        } catch (err: any) {
            console.error("Failed to load blog posts", err);
            setError(err.message || "Failed to load blog posts");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadPosts(); }, [loadPosts]);

    const resetForm = () => {
        setNewTitle("");
        setNewCategory("Hair Care");
        setNewContent("");
        setNewExcerpt("");
        setNewTags("");
        setEditingPost(null);
    };

    const openEditor = (post?: BlogPost) => {
        if (post) {
            setEditingPost(post);
            setNewTitle(post.title);
            setNewCategory(post.category ?? "Hair Care");
            setNewContent(""); // Content needs to be fetched separately for edit
            setNewExcerpt(post.excerpt ?? "");
            setNewTags(post.tags?.join(", ") ?? "");
        } else {
            resetForm();
        }
        setShowEditor(true);
    };

    const handleSave = async () => {
        if (!newTitle.trim() || !newContent.trim()) {
            showToast("Title and content are required", "error");
            return;
        }
        if (newContent.trim().length < 100) {
            showToast("Content must be at least 100 characters", "error");
            return;
        }

        setSaving(true);
        try {
            const body: any = {
                title: newTitle.trim(),
                content: newContent.trim(),
                category: newCategory,
                excerpt: newExcerpt.trim() || undefined,
                tags: newTags.split(",").map(t => t.trim()).filter(Boolean),
                status: "DRAFT",
            };

            let res: Response;
            if (editingPost) {
                body.id = editingPost.id;
                res = await fetch("/api/blog", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
            } else {
                res = await fetch("/api/blog", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
            }

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || `HTTP ${res.status}`);
            }

            showToast(editingPost ? "Draft updated successfully!" : "Draft created successfully!", "success");
            setShowEditor(false);
            resetForm();
            loadPosts();
        } catch (err: any) {
            showToast(err.message || "Failed to save draft", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to archive this draft?")) return;

        setDeleting(id);
        try {
            const res = await fetch(`/api/blog?id=${id}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || `HTTP ${res.status}`);
            }
            showToast("Draft archived", "success");
            loadPosts();
        } catch (err: any) {
            showToast(err.message || "Failed to delete draft", "error");
        } finally {
            setDeleting(null);
        }
    };

    const wordCount = newContent.split(/\s+/).filter(Boolean).length;
    const totalWords = posts.reduce((sum, p) => sum + (p.readTime ?? 0) * 200, 0);
    const avgWordCount = posts.length > 0 ? Math.round(totalWords / posts.length) : 0;

    return (
        <div className="space-y-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-sm shadow-lg text-sm font-medium animate-in slide-in-from-right ${toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                    {toast.message}
                </div>
            )}

            <div className="flex items-center justify-between">
                <h1 className="font-display text-xl text-espresso">Blog Drafts</h1>
                <button onClick={() => openEditor()} className="btn-gold text-xs py-2 px-4">
                    <Plus size={14} className="mr-1.5" /> New Draft
                </button>
            </div>

            <div className="bg-gold/5 border border-gold/20 rounded-sm p-4">
                <p className="text-sm text-charcoal">
                    <strong>Note:</strong> As a receptionist, you can create blog drafts. An Owner or Admin must review and publish them.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: "Total Drafts", value: loading ? "—" : posts.length.toString() },
                    { label: "Pending Review", value: loading ? "—" : posts.filter(p => p.status === "DRAFT").length.toString() },
                    { label: "Avg. Word Count", value: loading ? "—" : avgWordCount.toLocaleString() },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-sm border border-cream-darker/50 p-3 text-center">
                        <p className="font-display text-xl font-bold text-espresso">{stat.value}</p>
                        <p className="text-[10px] text-charcoal-lighter">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Loading / Error / Empty */}
            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gold" size={28} /></div>
            ) : error ? (
                <div className="bg-white rounded-sm border border-red-200 p-10 text-center">
                    <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                    <p className="text-red-500 text-sm font-medium">{error}</p>
                    <button onClick={loadPosts} className="mt-3 btn-gold text-xs py-2 px-4">Retry</button>
                </div>
            ) : posts.length === 0 ? (
                <div className="bg-white rounded-sm border border-cream-darker/50 p-10 text-center">
                    <FileText className="w-10 h-10 text-cream-darker mx-auto mb-3" />
                    <p className="text-charcoal-lighter text-sm">No drafts yet. Click "New Draft" to start writing!</p>
                </div>
            ) : (
                /* Drafts List */
                <div className="space-y-3">
                    {posts.map((draft) => (
                        <div key={draft.id} className="bg-white rounded-sm border border-cream-darker/50 p-5 hover:shadow-md transition-all">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        {draft.category && (
                                            <span className="text-[10px] bg-gold/15 text-gold-dark px-2 py-0.5 rounded-sm font-semibold uppercase">
                                                {draft.category}
                                            </span>
                                        )}
                                        <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-sm font-semibold uppercase">
                                            {draft.status}
                                        </span>
                                    </div>
                                    <h3 className="font-display text-base font-semibold text-espresso mb-1">{draft.title}</h3>
                                    <p className="text-xs text-charcoal-lighter line-clamp-2">{draft.excerpt || "No excerpt"}</p>
                                    <div className="flex items-center gap-4 mt-3 text-[10px] text-charcoal-lighter">
                                        <span className="flex items-center gap-1">
                                            <Clock size={10} /> Created: {new Date(draft.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Edit3 size={10} /> {draft.author?.name ?? "Unknown"}
                                        </span>
                                        {draft.readTime && <span>{draft.readTime} min read</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <button onClick={() => openEditor(draft)} className="w-8 h-8 rounded-sm bg-cream hover:bg-gold/10 flex items-center justify-center text-charcoal-lighter hover:text-gold transition-all" title="Edit">
                                        <Edit3 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(draft.id)}
                                        disabled={deleting === draft.id}
                                        className="w-8 h-8 rounded-sm bg-cream hover:bg-red-50 flex items-center justify-center text-charcoal-lighter hover:text-red-500 transition-all disabled:opacity-40"
                                        title="Delete"
                                    >
                                        {deleting === draft.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* New/Edit Draft Editor Modal */}
            {showEditor && (
                <div className="fixed inset-0 bg-espresso/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-sm w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-cream-darker/30">
                            <h2 className="font-display text-lg text-espresso">
                                {editingPost ? "Edit Draft" : "New Blog Draft"}
                            </h2>
                            <button onClick={() => { setShowEditor(false); resetForm(); }} className="text-charcoal-lighter hover:text-espresso">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Title *</label>
                                <input
                                    type="text"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder="Enter blog post title..."
                                    className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm font-display focus:outline-none focus:border-gold/40 transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Category</label>
                                    <select
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40 transition-all"
                                    >
                                        {categories.map((cat) => (
                                            <option key={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Tags (comma-separated)</label>
                                    <input
                                        type="text"
                                        value={newTags}
                                        onChange={(e) => setNewTags(e.target.value)}
                                        placeholder="hair, summer, tips"
                                        className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40 transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Excerpt</label>
                                <textarea
                                    value={newExcerpt}
                                    onChange={(e) => setNewExcerpt(e.target.value)}
                                    rows={2}
                                    placeholder="Short summary of the blog post..."
                                    className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40 transition-all resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Content *</label>
                                <textarea
                                    value={newContent}
                                    onChange={(e) => setNewContent(e.target.value)}
                                    rows={12}
                                    placeholder="Start writing your blog post... (minimum 100 characters)"
                                    className="w-full bg-cream border border-cream-darker/50 rounded-sm py-3 px-3 text-sm focus:outline-none focus:border-gold/40 transition-all resize-none"
                                />
                                <div className="flex justify-between mt-1">
                                    <p className="text-[10px] text-charcoal-lighter">{wordCount} words · {newContent.length} characters</p>
                                    {newContent.length > 0 && newContent.length < 100 && (
                                        <p className="text-[10px] text-red-400">{100 - newContent.length} more characters needed</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 p-5 border-t border-cream-darker/30">
                            <button onClick={() => { setShowEditor(false); resetForm(); }} className="btn-outline flex-1 py-2.5 text-xs">
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !newTitle.trim() || newContent.length < 100}
                                className="btn-gold flex-1 py-2.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Save size={14} className="mr-1" />}
                                {saving ? "Saving..." : editingPost ? "Update Draft" : "Save Draft"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
