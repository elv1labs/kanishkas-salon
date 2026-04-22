"use client";

import { useState, useEffect, useCallback } from "react";
import { Package, Plus, Search, AlertTriangle, Edit3, Loader2, RefreshCw, X, Check, Save, Trash2, ToggleRight, ToggleLeft } from "lucide-react";

type Product = {
    id: string;
    name: string;
    slug: string;
    category: string;
    price: string;
    comparePrice: string | null;
    stock: number;
    lowStockAlert: number;
    isActive: boolean;
    isFeatured: boolean;
    brand: string | null;
    sku: string | null;
};

function stockStatus(stock: number, lowAlert: number) {
    if (stock === 0) return { label: "Out of Stock", cls: "bg-red-50 text-red-600 border-red-200" };
    if (stock <= lowAlert) return { label: "Low Stock", cls: "bg-amber-50 text-amber-700 border-amber-200" };
    return { label: "In Stock", cls: "bg-green-50 text-green-700 border-green-200" };
}

const CATEGORIES: Record<string, string> = {
    HAIR_CARE: "Hair Care",
    MAKEUP_COSMETICS: "Makeup",
    SKIN_CARE: "Skin Care",
    NAIL_CARE: "Nail Care",
    TOOLS_ACCESSORIES: "Tools",
    GIFT_VOUCHER: "Gift Voucher",
    ACADEMY_ENROLLMENT: "Academy",
};

function EditStockModal({ product, onSave, onClose }: {
    product: Product;
    onSave: (id: string, stock: number) => Promise<void>;
    onClose: () => void;
}) {
    const [stock, setStock] = useState(product.stock);
    const [saving, setSaving] = useState(false);

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-sm border border-cream-darker/50 p-6 w-full max-w-sm shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-base text-espresso">Update Stock</h3>
                    <button onClick={onClose}><X size={16} className="text-charcoal-lighter" /></button>
                </div>
                <p className="text-sm text-charcoal mb-4">{product.name}</p>
                <div className="mb-4">
                    <label className="text-xs text-charcoal-lighter uppercase tracking-wider mb-2 block">Stock Quantity</label>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setStock(s => Math.max(0, s - 1))}
                            className="w-9 h-9 rounded-sm border border-cream-darker flex items-center justify-center text-charcoal hover:border-gold transition-colors font-bold">
                            −
                        </button>
                        <input type="number" value={stock} min={0}
                            onChange={e => setStock(Math.max(0, parseInt(e.target.value) || 0))}
                            className="flex-1 text-center border border-cream-darker/50 rounded-sm py-2 text-sm focus:outline-none focus:border-gold/40" />
                        <button onClick={() => setStock(s => s + 1)}
                            className="w-9 h-9 rounded-sm border border-cream-darker flex items-center justify-center text-charcoal hover:border-gold transition-colors font-bold">
                            +
                        </button>
                    </div>
                    <p className="text-[10px] text-charcoal-lighter mt-1">Low stock alert at {product.lowStockAlert} units</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 btn-outline text-xs py-2">Cancel</button>
                    <button disabled={saving}
                        onClick={async () => { setSaving(true); await onSave(product.id, stock); onClose(); }}
                        className="flex-1 btn-gold text-xs py-2 disabled:opacity-50">
                        {saving ? <Loader2 size={14} className="animate-spin mx-auto" /> : <><Save size={12} className="mr-1 inline" /> Save</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

function AddProductModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
    const [form, setForm] = useState({
        name: "", category: "HAIR_CARE", price: "", comparePrice: "",
        stock: 0, sku: "", brand: "", description: "", isFeatured: false,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const set = (k: string, v: string | number | boolean) =>
        setForm(prev => ({ ...prev, [k]: v }));

    const handleSave = async () => {
        if (!form.name.trim() || !form.price) { setError("Name and price are required."); return; }
        setSaving(true); setError(null);
        try {
            const res = await fetch("/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name.trim(), category: form.category,
                    price: parseFloat(form.price),
                    comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : undefined,
                    stock: Number(form.stock), sku: form.sku.trim() || undefined,
                    brand: form.brand.trim() || undefined, description: form.description.trim() || undefined,
                    isFeatured: form.isFeatured,
                }),
            });
            if (!res.ok) { const d = await res.json(); throw new Error(d.error || `HTTP ${res.status}`); }
            onSaved(); onClose();
        } catch (err: any) { setError(err.message || "Failed to create product"); }
        finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 bg-espresso/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-sm w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-5 border-b border-cream-darker/30">
                    <h2 className="font-display text-lg text-espresso">New Product</h2>
                    <button onClick={onClose} className="text-charcoal-lighter hover:text-espresso"><X size={20} /></button>
                </div>
                <div className="p-5 space-y-4">
                    {error && <div className="bg-red-50 border border-red-200 rounded-sm px-3 py-2 text-sm text-red-600">{error}</div>}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Product Name *</label>
                            <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Argan Oil Serum"
                                className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40" />
                        </div>
                        <div>
                            <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Category</label>
                            <select value={form.category} onChange={e => set("category", e.target.value)}
                                className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40">
                                {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Brand</label>
                            <input value={form.brand} onChange={e => set("brand", e.target.value)} placeholder="e.g. L'Oréal"
                                className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40" />
                        </div>
                        <div>
                            <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Price (₹) *</label>
                            <input type="number" min="0" step="0.01" value={form.price} onChange={e => set("price", e.target.value)} placeholder="0.00"
                                className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40" />
                        </div>
                        <div>
                            <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Stock</label>
                            <input type="number" min="0" value={form.stock} onChange={e => set("stock", parseInt(e.target.value) || 0)}
                                className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs text-charcoal-lighter uppercase tracking-wider mb-1.5">Description</label>
                            <textarea value={form.description} onChange={e => set("description", e.target.value)}
                                rows={3} placeholder="Product description..."
                                className="w-full bg-cream border border-cream-darker/50 rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40 resize-none" />
                        </div>
                        <div className="col-span-2 flex items-center gap-3">
                            <input type="checkbox" id="featured" checked={form.isFeatured}
                                onChange={e => set("isFeatured", e.target.checked)} className="w-4 h-4 accent-gold" />
                            <label htmlFor="featured" className="text-sm text-charcoal cursor-pointer">Mark as Featured</label>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 p-5 border-t border-cream-darker/30">
                    <button onClick={onClose} className="btn-outline flex-1 py-2.5 text-xs">Cancel</button>
                    <button onClick={handleSave} disabled={saving}
                        className="btn-gold flex-1 py-2.5 text-xs disabled:opacity-50 flex items-center justify-center gap-2">
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {saving ? "Creating..." : "Create Product"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function OwnerProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [editProduct, setEditProduct] = useState<Product | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [total, setTotal] = useState(0);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/products?limit=50&includeInactive=true");
            const data = await res.json();
            setProducts(data.products ?? []);
            setTotal(data.pagination?.total ?? 0);
        } catch (e) {
            console.error("Failed to load products", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const updateStock = async (id: string, stock: number) => {
        await fetch("/api/products", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, stock }),
        });
        load();
    };

    const toggleActive = async (product: Product) => {
        await fetch("/api/products", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: product.id, isActive: !product.isActive }),
        });
        load();
    };

    const filtered = products.filter(p =>
        search === "" ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.brand ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (p.sku ?? "").toLowerCase().includes(search.toLowerCase())
    );

    const outOfStock = products.filter(p => p.stock === 0).length;
    const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.lowStockAlert).length;
    const active = products.filter(p => p.isActive).length;

    return (
        <div className="space-y-6">
            {/* Toast */}
            {toast && (
                <div className="fixed top-4 right-4 z-[60] px-4 py-3 rounded-sm shadow-lg text-sm font-medium bg-green-500 text-white">
                    {toast}
                </div>
            )}

            {showAddModal && (
                <AddProductModal
                    onClose={() => setShowAddModal(false)}
                    onSaved={() => { load(); showToast("Product created successfully!"); }}
                />
            )}

            {editProduct && (
                <EditStockModal product={editProduct} onSave={updateStock} onClose={() => setEditProduct(null)} />
            )}

            <div className="flex items-center justify-between flex-wrap gap-3">
                <h1 className="font-display text-xl text-espresso">Product Management</h1>
                <div className="flex gap-2">
                    <button onClick={load} className="flex items-center gap-1.5 text-xs text-charcoal-lighter hover:text-gold transition-colors">
                        <RefreshCw size={13} />
                    </button>
                    <button onClick={() => setShowAddModal(true)} className="btn-gold text-xs py-2 px-4">
                        <Plus size={14} className="mr-1.5 inline" /> Add Product
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: "Total Products", value: total,       icon: <Package size={20} className="text-gold" /> },
                    { label: "Active",          value: active,      icon: <Check size={20} className="text-green-500" /> },
                    { label: "Low Stock",        value: lowStock,    icon: <AlertTriangle size={20} className="text-amber-500" /> },
                    { label: "Out of Stock",     value: outOfStock,  icon: <Package size={20} className="text-red-500" /> },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-sm border border-cream-darker/50 p-5">
                        <div className="mb-2">{s.icon}</div>
                        <p className="font-display text-2xl font-bold text-espresso">{loading ? "—" : s.value}</p>
                        <p className="text-xs text-charcoal-lighter">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-lighter" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name, brand, or SKU..."
                    className="w-full bg-white border border-cream-darker/50 rounded-sm py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-gold/40 transition-all" />
            </div>

            {/* Table */}
            <div className="bg-white rounded-sm border border-cream-darker/50 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gold" size={28} /></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-cream/50 border-b border-cream-darker/30">
                                    {["Product", "Category", "Price", "Stock", "Status", "Active", "Actions"].map(h => (
                                        <th key={h} className={`py-3 px-4 text-xs text-charcoal-lighter uppercase tracking-wider font-semibold ${
                                            h === "Price" || h === "Actions" ? "text-right" : h === "Stock" || h === "Status" || h === "Active" ? "text-center" : "text-left"
                                        }`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(prod => {
                                    const { label, cls } = stockStatus(prod.stock, prod.lowStockAlert);
                                    return (
                                        <tr key={prod.id} className={`border-b border-cream-darker/10 hover:bg-cream/20 transition-colors ${!prod.isActive ? "opacity-50" : ""}`}>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded bg-gold/10 flex items-center justify-center text-gold flex-shrink-0">
                                                        <Package size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-espresso">{prod.name}</p>
                                                        {prod.brand && <p className="text-[10px] text-charcoal-lighter">{prod.brand}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-charcoal-lighter text-xs">
                                                {prod.category.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <p className="font-bold text-espresso">₹{Number(prod.price).toLocaleString("en-IN")}</p>
                                                {prod.comparePrice && (
                                                    <p className="text-[10px] text-charcoal-lighter line-through">₹{Number(prod.comparePrice).toLocaleString("en-IN")}</p>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <button onClick={() => setEditProduct(prod)}
                                                    className="font-bold text-espresso hover:text-gold transition-colors underline decoration-dotted">
                                                    {prod.stock}
                                                </button>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${cls}`}>
                                                    {label}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <button onClick={() => toggleActive(prod)}
                                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border transition-colors ${
                                                        prod.isActive ? "bg-green-50 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200" : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                                                    }`}>
                                                    {prod.isActive ? "Active" : "Inactive"}
                                                </button>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <button onClick={() => setEditProduct(prod)}
                                                    className="w-7 h-7 rounded-sm hover:bg-gold/10 inline-flex items-center justify-center text-charcoal-lighter hover:text-gold transition-all"
                                                    title="Edit stock">
                                                    <Edit3 size={13} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="px-4 py-3 bg-cream/30 border-t border-cream-darker/20 text-xs text-charcoal-lighter">
                    {filtered.length} of {total} products
                </div>
            </div>
        </div>
    );
}
