"use client";

import { useState, useEffect, useCallback } from "react";
import { Image as ImageIcon, Upload, Star, Trash2, Eye, X, Loader2, AlertCircle, Check } from "lucide-react";

type GalleryItem = {
    id: string;
    title: string | null;
    description: string | null;
    imageUrl: string;
    thumbnailUrl: string | null;
    category: string;
    tags: string[];
    altText: string | null;
    isFeatured: boolean;
    isPublished: boolean;
    sortOrder: number;
    createdAt: string;
    uploadedBy: { id: string; name: string };
};

const catColors: Record<string, string> = {
    HAIR: "bg-purple-100 text-purple-700",
    BRIDAL: "bg-pink-100 text-pink-700",
    NAILS: "bg-rose-100 text-rose-700",
    BEFORE_AFTER: "bg-green-100 text-green-700",
    SALON_INTERIOR: "bg-blue-100 text-blue-700",
    ACADEMY: "bg-amber-100 text-amber-700",
    MAKEUP: "bg-gold/15 text-gold-dark",
    SKIN: "bg-teal-100 text-teal-700",
};

const galleryCategories = ["HAIR", "MAKEUP", "NAILS", "SKIN", "BRIDAL", "ACADEMY", "SALON_INTERIOR", "BEFORE_AFTER"];

export default function ReceptionistGalleryPage() {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showUpload, setShowUpload] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [filterCategory, setFilterCategory] = useState<string>("ALL");

    // Upload form state
    const [uploadTitle, setUploadTitle] = useState("");
    const [uploadCategory, setUploadCategory] = useState("HAIR");
    const [uploadDescription, setUploadDescription] = useState("");
    const [uploadUrl, setUploadUrl] = useState("");
    const [uploadFeatured, setUploadFeatured] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const showToast = (message: string, type: "success" | "error") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadGallery = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ limit: "100" });
            if (filterCategory !== "ALL") params.set("category", filterCategory);
            const res = await fetch(`/api/gallery?${params}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setItems(data.items ?? []);
        } catch (err: any) {
            console.error("Failed to load gallery", err);
            setError(err.message || "Failed to load gallery");
        } finally {
            setLoading(false);
        }
    }, [filterCategory]);

    useEffect(() => { loadGallery(); }, [loadGallery]);

    const resetUploadForm = () => {
        setUploadTitle("");
        setUploadCategory("HAIR");
        setUploadDescription("");
        setUploadUrl("");
        setUploadFeatured(false);
        setSelectedFile(null);
        setPreviewUrl(null);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            if (!uploadTitle) setUploadTitle(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
        }
    };

    const handleUpload = async () => {
        // Support both: direct file upload (VPS) and paste-a-URL fallback
        const pastedUrl = uploadUrl.trim();

        if (!selectedFile && !pastedUrl) {
            showToast("Please select a file to upload or paste an image URL.", "error");
            return;
        }

        setSaving(true);
        try {
            let imageUrl = pastedUrl;
            let uploadedThumbUrl: string | null = null;

            // If a file is selected, upload it to the VPS first
            if (selectedFile) {
                const formData = new FormData();
                formData.append("file", selectedFile);
                formData.append("folder", "gallery"); // route to the gallery upload folder

                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                if (!uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    throw new Error(uploadData.error || "File upload failed");
                }

                const uploadData = await uploadRes.json();
                // uploadData contains both imageUrl (full) and thumbnailUrl (400×400 WebP)
                imageUrl = uploadData.imageUrl ?? uploadData.url;
                uploadedThumbUrl = uploadData.thumbnailUrl ?? null;
            }

            const res = await fetch("/api/gallery", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageUrl,
                    thumbnailUrl: uploadedThumbUrl || undefined,
                    title: uploadTitle.trim() || undefined,
                    description: uploadDescription.trim() || undefined,
                    category: uploadCategory,
                    tags: [],
                    isFeatured: uploadFeatured,
                    isPublished: true,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || `HTTP ${res.status}`);
            }

            showToast("Photo added to gallery!", "success");
            setShowUpload(false);
            resetUploadForm();
            loadGallery();
        } catch (err: any) {
            showToast(err.message || "Failed to upload", "error");
        } finally {
            setSaving(false);
        }
    };

    const toggleFeatured = async (item: GalleryItem) => {
        try {
            const res = await fetch("/api/gallery", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: item.id, isFeatured: !item.isFeatured }),
            });
            if (!res.ok) throw new Error("Failed to update");
            setItems(prev => prev.map(i => i.id === item.id ? { ...i, isFeatured: !i.isFeatured } : i));
            showToast(item.isFeatured ? "Removed from featured" : "Marked as featured!", "success");
        } catch (err: any) {
            showToast(err.message || "Failed to update", "error");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this photo?")) return;
        setDeleting(id);
        try {
            const res = await fetch(`/api/gallery?id=${id}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || `HTTP ${res.status}`);
            }
            showToast("Photo deleted", "success");
            loadGallery();
        } catch (err: any) {
            showToast(err.message || "Failed to delete", "error");
        } finally {
            setDeleting(null);
        }
    };

    const featured = items.filter(i => i.isFeatured).length;
    const uniqueCategories = new Set(items.map(i => i.category));

    return (
        <div className="space-y-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-sm shadow-lg text-sm font-medium ${toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                    {toast.message}
                </div>
            )}

            <div className="flex items-center justify-between">
                <h1 className="font-display text-xl text-espresso">Gallery Management</h1>
                <button onClick={() => setShowUpload(true)} className="btn-gold text-xs py-2 px-4">
                    <Upload size={14} className="mr-1.5" /> Upload Photos
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: "Total Photos", value: loading ? "—" : items.length.toString() },
                    { label: "Featured", value: loading ? "—" : featured.toString() },
                    { label: "Categories", value: loading ? "—" : uniqueCategories.size.toString() },
                ].map((s) => (
                    <div key={s.label} className="bg-white rounded-sm border border-cream-darker/50 p-3 text-center">
                        <p className="font-display text-xl font-bold text-espresso">{s.value}</p>
                        <p className="text-[10px] text-charcoal-lighter">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Category Filter */}
            <div className="flex gap-1 bg-cream rounded-sm p-1 overflow-x-auto">
                <button
                    onClick={() => setFilterCategory("ALL")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-sm whitespace-nowrap transition-all ${filterCategory === "ALL" ? "bg-white text-espresso shadow-sm" : "text-charcoal-lighter hover:bg-white/50"}`}
                >
                    All
                </button>
                {galleryCategories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setFilterCategory(cat)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-sm whitespace-nowrap transition-all ${filterCategory === cat ? "bg-white text-espresso shadow-sm" : "text-charcoal-lighter hover:bg-white/50"}`}
                    >
                        {cat.replace("_", " ")}
                    </button>
                ))}
            </div>

            {/* Loading / Error / Empty */}
            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gold" size={28} /></div>
            ) : error ? (
                <div className="bg-white rounded-sm border border-red-200 p-10 text-center">
                    <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                    <p className="text-red-500 text-sm font-medium">{error}</p>
                    <button onClick={loadGallery} className="mt-3 btn-gold text-xs py-2 px-4">Retry</button>
                </div>
            ) : items.length === 0 ? (
                <div className="bg-white rounded-sm border border-cream-darker/50 p-10 text-center">
                    <ImageIcon className="w-10 h-10 text-cream-darker mx-auto mb-3" />
                    <p className="text-charcoal-lighter text-sm">
                        {filterCategory !== "ALL" ? `No photos in "${filterCategory.replace("_", " ")}" category.` : "No photos yet. Upload some to get started!"}
                    </p>
                </div>
            ) : (
                /* Gallery Grid */
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {items.map((photo) => (
                        <div key={photo.id} className="group relative bg-white rounded-sm border border-cream-darker/50 overflow-hidden hover:shadow-lg transition-all">
                            {/* Real image */}
                            <div className="aspect-square bg-cream relative overflow-hidden">
                                <img
                                    src={photo.thumbnailUrl || photo.imageUrl}
                                    alt={photo.altText || photo.title || "Gallery photo"}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = "none";
                                        (e.target as HTMLImageElement).parentElement!.classList.add("flex", "items-center", "justify-center");
                                        const icon = document.createElement("div");
                                        icon.innerHTML = '<svg class="w-8 h-8 text-cream-darker" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>';
                                        (e.target as HTMLImageElement).parentElement!.appendChild(icon);
                                    }}
                                />
                            </div>

                            {/* Overlay on hover */}
                            <div className="absolute inset-0 bg-espresso/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <a href={photo.imageUrl} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40 transition-all" title="View Full">
                                    <Eye size={14} />
                                </a>
                                <button onClick={() => toggleFeatured(photo)} className={`w-8 h-8 rounded-full backdrop-blur-sm flex items-center justify-center text-white transition-all ${photo.isFeatured ? "bg-gold/80 hover:bg-gold" : "bg-white/20 hover:bg-gold/80"}`} title={photo.isFeatured ? "Remove from Featured" : "Mark as Featured"}>
                                    <Star size={14} className={photo.isFeatured ? "fill-white" : ""} />
                                </button>
                                <button
                                    onClick={() => handleDelete(photo.id)}
                                    disabled={deleting === photo.id}
                                    className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-red-500/80 transition-all disabled:opacity-50"
                                    title="Delete"
                                >
                                    {deleting === photo.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                </button>
                            </div>

                            {/* Featured badge */}
                            {photo.isFeatured && (
                                <div className="absolute top-2 right-2">
                                    <Star size={14} className="text-gold fill-gold" />
                                </div>
                            )}

                            {/* Info */}
                            <div className="p-3">
                                <p className="text-xs font-semibold text-espresso truncate">{photo.title || "Untitled"}</p>
                                <div className="flex items-center justify-between mt-1.5">
                                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${catColors[photo.category] ?? "bg-gray-100 text-gray-600"}`}>
                                        {photo.category.replace("_", " ")}
                                    </span>
                                    <span className="text-[9px] text-charcoal-lighter">
                                        {new Date(photo.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Modal */}
            {showUpload && (
                <div className="fixed inset-0 bg-espresso/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-sm w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-cream-darker/30">
                            <h2 className="font-display text-lg text-espresso">Upload Photo</h2>
                            <button onClick={() => { setShowUpload(false); resetUploadForm(); }} className="text-charcoal-lighter hover:text-espresso">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            {/* File Upload Input (primary) */}
                            <div>
                                <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Upload Photo *</label>
                                <label
                                    htmlFor="gallery-file-input"
                                    className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-cream-darker/50 rounded-sm cursor-pointer hover:border-gold/40 hover:bg-gold/5 transition-all"
                                >
                                    <Upload size={20} className="text-gold mb-1.5" />
                                    <p className="text-xs font-semibold text-espresso">{selectedFile ? selectedFile.name : "Click to choose a photo"}</p>
                                    <p className="text-[10px] text-charcoal-lighter mt-0.5">JPG, PNG, WEBP up to 10 MB</p>
                                    <input
                                        id="gallery-file-input"
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/avif"
                                        className="hidden"
                                        onChange={handleFileSelect}
                                    />
                                </label>
                            </div>

                            {/* Preview of selected file */}
                            {previewUrl && (
                                <div className="border border-cream-darker/30 rounded-sm overflow-hidden">
                                    <img src={previewUrl} alt="Preview" className="w-full max-h-40 object-cover" />
                                </div>
                            )}

                            {/* OR: paste a URL */}
                            <div>
                                <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">— OR paste an image URL</label>
                                <input
                                    type="url"
                                    value={uploadUrl}
                                    onChange={e => {
                                        setUploadUrl(e.target.value);
                                        setSelectedFile(null);
                                        setPreviewUrl(null);
                                    }}
                                    placeholder="https://example.com/photo.jpg"
                                    className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40 transition-all"
                                />
                                <p className="text-[10px] text-charcoal-lighter/60 mt-1">Use any publicly accessible image URL</p>
                            </div>

                            {/* URL preview */}
                            {uploadUrl && !selectedFile && (
                                <div className="border border-cream-darker/30 rounded-sm overflow-hidden">
                                    <img src={uploadUrl} alt="Preview" className="w-full max-h-40 object-cover" onError={(e) => (e.target as HTMLImageElement).style.display = "none"} />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Category *</label>
                                <select
                                    value={uploadCategory}
                                    onChange={e => setUploadCategory(e.target.value)}
                                    className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40 transition-all"
                                >
                                    {galleryCategories.map((c) => (
                                        <option key={c} value={c}>{c.replace("_", " ")}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Title</label>
                                <input
                                    type="text"
                                    value={uploadTitle}
                                    onChange={e => setUploadTitle(e.target.value)}
                                    placeholder="Photo title..."
                                    className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Description</label>
                                <textarea
                                    value={uploadDescription}
                                    onChange={e => setUploadDescription(e.target.value)}
                                    rows={2}
                                    placeholder="Optional description..."
                                    className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40 transition-all resize-none"
                                />
                            </div>

                            {/* Feature on homepage */}
                            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-sm border border-cream-darker/40 hover:border-gold/40 hover:bg-gold/5 transition-all">
                                <input
                                    type="checkbox"
                                    checked={uploadFeatured}
                                    onChange={e => setUploadFeatured(e.target.checked)}
                                    className="mt-0.5 accent-gold"
                                />
                                <div>
                                    <p className="text-sm font-semibold text-espresso flex items-center gap-1.5">
                                        <Star size={13} className={uploadFeatured ? "text-gold fill-gold" : "text-charcoal-lighter"} />
                                        Feature on Homepage
                                    </p>
                                    <p className="text-[10px] text-charcoal-lighter mt-0.5">
                                        Tick this to show the photo in the homepage gallery preview.
                                        You can also toggle this later using the ★ button on any photo.
                                    </p>
                                </div>
                            </label>
                        </div>
                        <div className="flex gap-3 p-5 border-t border-cream-darker/30">
                            <button onClick={() => { setShowUpload(false); resetUploadForm(); }} className="btn-outline flex-1 py-2.5 text-xs">Cancel</button>
                            <button
                                onClick={handleUpload}
                                disabled={saving || (!selectedFile && !uploadUrl.trim())}
                                className="btn-gold flex-1 py-2.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Upload size={14} className="mr-1" />}
                                {saving ? "Uploading..." : "Add to Gallery"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
