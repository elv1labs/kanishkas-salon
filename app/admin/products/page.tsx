"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Package, Plus, Search, Edit3, Trash2, AlertTriangle, ToggleRight, ToggleLeft, Loader2, RefreshCw, X, Save, Check } from "lucide-react";
import ImageUploader from "@/components/admin/ImageUploader";
import { PRODUCT_CATEGORIES } from "@/lib/constants";

type Product = {
    id: string;
    name: string;
    category: string;
    price: string;
    comparePrice: string | null;
    stock: number;
    isActive: boolean;
    isFeatured: boolean;
    sku: string | null;
    thumbnailUrl: string | null;
    brand: string | null;
    description?: string | null;
};
const catFilters: string[] = ["All", ...Object.values(PRODUCT_CATEGORIES)];

const emptyForm = () => ({
    name: "", category: "HAIR_CARE", price: "", comparePrice: "",
    stock: 0, sku: "", brand: "", description: "", isFeatured: false,
    thumbnailUrl: "",
});

type FormState = ReturnType<typeof emptyForm>;

function ProductModal({
    product, onClose, onSaved,
}: {
    product: Product | null;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [form, setForm] = useState<FormState>(
        product
            ? {
                name: product.name,
                category: product.category,
                price: product.price,
                comparePrice: product.comparePrice ?? "",
                stock: product.stock,
                sku: product.sku ?? "",
                brand: product.brand ?? "",
                description: product.description ?? "",
                isFeatured: product.isFeatured,
                thumbnailUrl: product.thumbnailUrl ?? "",
            }
            : emptyForm()
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const set = (k: keyof FormState, v: string | number | boolean) =>
        setForm(prev => ({ ...prev, [k]: v }));

    const handleSave = async () => {
        if (!form.name.trim() || !form.price) {
            setError("Name and price are required.");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const body: Record<string, unknown> = {
                name: form.name.trim(),
                category: form.category,
                price: parseFloat(form.price),
                comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : null,
                stock: Number(form.stock),
                sku: form.sku.trim() || null,
                brand: form.brand.trim() || null,
                description: form.description.trim() || null,
                isFeatured: form.isFeatured,
                thumbnailUrl: form.thumbnailUrl.trim() || null,
            };
            if (product) body.id = product.id;

            const res = await fetch("/api/products", {
                method: product ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || `HTTP ${res.status}`);
            }
            onSaved();
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to save product");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-espresso/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-sm w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-5 border-b border-cream-darker/30">
                    <h2 className="font-display text-lg text-espresso">
                        {product ? "Edit Product" : "New Product"}
                    </h2>
                    <button onClick={onClose} className="text-charcoal-lighter hover:text-espresso transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-sm px-3 py-2 text-sm text-red-600">{error}</div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Product Name *</label>
                            <input value={form.name} onChange={e => set("name", e.target.value)}
                                placeholder="e.g. Argan Oil Serum"
                                className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40" />
                        </div>
                        <div>
                            <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Category *</label>
                            <select value={form.category} onChange={e => set("category", e.target.value)}
                                className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40">
                                {Object.entries(PRODUCT_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Brand</label>
                            <input value={form.brand} onChange={e => set("brand", e.target.value)}
                                placeholder="e.g. L'Oréal"
                                className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40" />
                        </div>
                        <div>
                            <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Price (₹) *</label>
                            <input type="number" min="0" step="0.01" value={form.price} onChange={e => set("price", e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40" />
                        </div>
                        <div>
                            <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Compare Price (₹)</label>
                            <input type="number" min="0" step="0.01" value={form.comparePrice} onChange={e => set("comparePrice", e.target.value)}
                                placeholder="0.00 (optional)"
                                className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40" />
                        </div>
                        <div>
                            <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Initial Stock</label>
                            <input type="number" min="0" value={form.stock} onChange={e => set("stock", parseInt(e.target.value) || 0)}
                                className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40" />
                        </div>
                        <div>
                            <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">SKU</label>
                            <input value={form.sku} onChange={e => set("sku", e.target.value)}
                                placeholder="e.g. HAIR-001"
                                className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Description</label>
                            <textarea value={form.description} onChange={e => set("description", e.target.value)}
                                rows={3} placeholder="Product description..."
                                className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40 resize-none" />
                        </div>
                        <div className="col-span-2">
                            <ImageUploader
                                label="Product Image"
                                folder="products"
                                currentImageUrl={form.thumbnailUrl || undefined}
                                onUploadSuccess={(url) => set("thumbnailUrl", url)}
                            />
                        </div>
                        <div className="col-span-2 flex items-center gap-3">
                            <input type="checkbox" id="featured" checked={form.isFeatured}
                                onChange={e => set("isFeatured", e.target.checked)}
                                className="w-4 h-4 accent-gold" />
                            <label htmlFor="featured" className="text-sm text-charcoal cursor-pointer">Mark as Featured Product</label>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 p-5 border-t border-cream-darker/30">
                    <button onClick={onClose} className="btn-outline flex-1 py-2.5 text-xs">Cancel</button>
                    <button onClick={handleSave} disabled={saving}
                        className="btn-gold flex-1 py-2.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {saving ? "Saving..." : product ? "Update Product" : "Create Product"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("All");
    const [search, setSearch] = useState("");
    const [toggling, setToggling] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [editProduct, setEditProduct] = useState<Product | "new" | null>(null);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

    const showToast = (msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3000);
    };

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/products?limit=100&includeInactive=true");
            const data = await res.json();
            setProducts(data.products ?? []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const toggleActive = async (product: Product) => {
        setToggling(product.id);
        try {
            const res = await fetch("/api/products", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: product.id, isActive: !product.isActive }),
            });
            if (res.ok) {
                showToast(product.isActive ? "Product deactivated" : "Product activated");
                await load();
            }
        } finally {
            setToggling(null);
        }
    };

    const handleDelete = async (product: Product) => {
        if (!confirm(`Delete "${product.name}"? This action cannot be undone.`)) return;
        setDeleting(product.id);
        try {
            const res = await fetch(`/api/products?id=${product.id}`, { method: "DELETE" });
            if (res.ok) {
                showToast("Product deleted");
                // Optimistically remove from state — re-fetch returns soft-deleted items to admins
                setProducts(prev => prev.filter(p => p.id !== product.id));
            } else {
                const d = await res.json();
                showToast(d.error || "Failed to delete", false);
            }
        } catch {
            showToast("Failed to delete product", false);
        } finally {
            setDeleting(null);
        }
    };

    const filtered = products
        .filter(p => filter === "All" || PRODUCT_CATEGORIES[p.category] === filter)
        .filter(p => search === "" ||
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            (p.sku?.toLowerCase().includes(search.toLowerCase()) ?? false)
        );

    const lowStock = products.filter(p => p.stock <= 5 && p.isActive).length;
    const outOfStock = products.filter(p => p.stock === 0).length;
    const activeCount = products.filter(p => p.isActive).length;

    return (
        <div className="space-y-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-sm shadow-lg text-sm font-medium ${toast.ok ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                    {toast.msg}
                </div>
            )}

            {/* Product Modal */}
            {editProduct !== null && (
                <ProductModal
                    product={editProduct === "new" ? null : editProduct}
                    onClose={() => setEditProduct(null)}
                    onSaved={() => { load(); showToast(editProduct === "new" ? "Product created!" : "Product updated!"); }}
                />
            )}

            <div className="flex items-center justify-between flex-wrap gap-3">
                <h1 className="font-display text-xl text-espresso">Products</h1>
                <div className="flex gap-2">
                    <button onClick={load} className="btn-outline text-xs py-2 px-3 flex items-center gap-1.5">
                        <RefreshCw size={13} /> Refresh
                    </button>
                    <button onClick={() => setEditProduct("new")} className="btn-gold text-xs py-2 px-4 flex items-center gap-1.5">
                        <Plus size={14} /> Add Product
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Total Products", value: products.length, color: "text-espresso" },
                    { label: "Active", value: activeCount, color: "text-green-600" },
                    { label: "Low Stock (≤5)", value: lowStock, color: "text-amber-600" },
                    { label: "Out of Stock", value: outOfStock, color: "text-red-500" },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-sm border border-cream-darker/50 p-4 text-center">
                        <p className={`font-display text-2xl font-bold ${s.color}`}>{loading ? "—" : s.value}</p>
                        <p className="text-[10px] text-charcoal-lighter uppercase tracking-wider mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Low stock warning */}
            {!loading && lowStock > 0 && (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-sm px-4 py-3">
                    <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
                    <p className="text-sm text-amber-700">
                        <strong>{lowStock} product{lowStock > 1 ? "s" : ""}</strong> running low on stock. Restock soon.
                    </p>
                </div>
            )}

            {/* Search & Filter */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-lighter" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search products or SKU..."
                        className="w-full bg-white border border-cream-darker/50 rounded-sm py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-gold/40" />
                </div>
                <div className="flex gap-1 flex-wrap">
                    {catFilters.map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-sm transition-all ${
                                filter === f ? "bg-espresso text-cream" : "bg-white border border-cream-darker/50 text-charcoal-lighter hover:border-gold/30"
                            }`}>
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Products table */}
            <div className="bg-white rounded-sm border border-cream-darker/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-cream/50 border-b border-cream-darker/30">
                                <th className="text-left py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Product</th>
                                <th className="text-left py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Category</th>
                                <th className="text-left py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">SKU</th>
                                <th className="text-right py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Price</th>
                                <th className="text-center py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Stock</th>
                                <th className="text-center py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Status</th>
                                <th className="text-center py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="text-center py-12">
                                    <Loader2 className="animate-spin text-gold mx-auto" size={24} />
                                </td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-12 text-charcoal-lighter">No products found</td></tr>
                            ) : filtered.map(p => (
                                <tr key={p.id} className={`border-b border-cream-darker/10 hover:bg-cream/20 transition-colors ${!p.isActive ? "opacity-50" : ""}`}>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-sm bg-cream-dark flex items-center justify-center flex-shrink-0 relative">
                                                {p.thumbnailUrl ? (
                                                    <Image src={p.thumbnailUrl} alt={p.name} fill className="object-cover rounded-sm" unoptimized />
                                                ) : (
                                                    <Package size={16} className="text-charcoal-lighter" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-espresso text-sm">{p.name}</p>
                                                {p.brand && <p className="text-xs text-charcoal-lighter">{p.brand}</p>}
                                                {p.isFeatured && <span className="text-[9px] bg-gold/20 text-gold-dark px-1.5 py-0.5 rounded font-semibold">Featured</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-charcoal-lighter text-xs">{PRODUCT_CATEGORIES[p.category] ?? p.category}</td>
                                    <td className="py-3 px-4 font-mono text-xs text-charcoal-lighter">{p.sku ?? "—"}</td>
                                    <td className="py-3 px-4 text-right">
                                        <p className="font-semibold text-espresso">₹{Number(p.price).toLocaleString("en-IN")}</p>
                                        {p.comparePrice && <p className="text-xs text-charcoal-lighter line-through">₹{Number(p.comparePrice).toLocaleString("en-IN")}</p>}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                            p.stock === 0 ? "bg-red-50 text-red-600" :
                                            p.stock <= 5 ? "bg-amber-50 text-amber-600" :
                                            "bg-green-50 text-green-700"
                                        }`}>{p.stock === 0 ? "Out of Stock" : `${p.stock} left`}</span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <button onClick={() => toggleActive(p)} disabled={toggling === p.id}
                                            className="text-charcoal-lighter hover:text-espresso transition-colors disabled:opacity-50">
                                            {toggling === p.id ? <Loader2 size={18} className="animate-spin" /> :
                                                p.isActive ? <ToggleRight size={20} className="text-green-500" /> : <ToggleLeft size={20} />}
                                        </button>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => setEditProduct(p)}
                                                className="w-7 h-7 rounded-sm hover:bg-gold/10 inline-flex items-center justify-center text-charcoal-lighter hover:text-gold transition-all"
                                                title="Edit product">
                                                <Edit3 size={15} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(p)}
                                                disabled={deleting === p.id}
                                                className="w-7 h-7 rounded-sm hover:bg-red-50 inline-flex items-center justify-center text-charcoal-lighter hover:text-red-500 transition-all disabled:opacity-40"
                                                title="Delete product">
                                                {deleting === p.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-4 py-3 bg-cream/30 border-t border-cream-darker/20 text-xs text-charcoal-lighter">
                    Showing {filtered.length} of {products.length} products
                </div>
            </div>
        </div>
    );
}
