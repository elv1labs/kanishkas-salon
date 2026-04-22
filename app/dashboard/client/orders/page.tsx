"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, Package, Clock, Truck, CheckCircle, ChevronDown, ChevronUp, RotateCcw, Loader2 } from "lucide-react";
import Link from "next/link";

type OrderItem = {
    id: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    product: { name: string; slug: string; thumbnailUrl: string | null };
};

type Order = {
    id: string;
    orderRef: string;
    createdAt: string;
    status: string;
    total: string;
    subtotal: string;
    shippingAddress: string | null;
    shippingCity: string | null;
    items: OrderItem[];
    payment: { status: string; method: string | null } | null;
};

const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string; step: number }> = {
    PENDING:    { color: "text-amber-700",  bg: "bg-amber-50 border-amber-200",  icon: <Clock size={13} />,        label: "Pending",    step: 0 },
    PROCESSING: { color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",    icon: <Package size={13} />,      label: "Processing", step: 1 },
    SHIPPED:    { color: "text-purple-700", bg: "bg-purple-50 border-purple-200",icon: <Truck size={13} />,        label: "Shipped",    step: 2 },
    DELIVERED:  { color: "text-green-700",  bg: "bg-green-50 border-green-200",  icon: <CheckCircle size={13} />,  label: "Delivered",  step: 3 },
    CANCELLED:  { color: "text-red-600",    bg: "bg-red-50 border-red-200",      icon: <Clock size={13} />,        label: "Cancelled",  step: -1 },
    REFUNDED:   { color: "text-gray-600",   bg: "bg-gray-50 border-gray-200",    icon: <RotateCcw size={13} />,    label: "Refunded",   step: -1 },
};

const STATUS_STEPS = ["Pending", "Processing", "Shipped", "Delivered"];

function StatusPipeline({ status }: { status: string }) {
    const cfg = statusConfig[status];
    if (!cfg || cfg.step === -1) return null;
    return (
        <div className="flex items-center gap-1 mt-3">
            {STATUS_STEPS.map((_, i) => (
                <div key={i} className="flex-1">
                    <div className={`w-full h-1.5 rounded-full ${i <= cfg.step ? "bg-gold" : "bg-cream-darker/30"}`} />
                </div>
            ))}
        </div>
    );
}

function OrderCard({ order }: { order: Order }) {
    const [expanded, setExpanded] = useState(false);
    const cfg = statusConfig[order.status] ?? statusConfig.PENDING;

    return (
        <div className="bg-white rounded-sm border border-cream-darker/50 overflow-hidden hover:shadow-md transition-all">
            <button onClick={() => setExpanded(!expanded)} className="w-full p-5 text-left">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                            <ShoppingBag className="text-gold" size={16} />
                        </div>
                        <div>
                            <p className="font-display text-sm font-semibold text-espresso">{order.orderRef}</p>
                            <p className="text-[11px] text-charcoal-lighter">
                                {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                {" · "}{order.items.length} item{order.items.length !== 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${cfg.bg} ${cfg.color}`}>
                            {cfg.icon} {cfg.label}
                        </span>
                        <span className="font-display text-sm font-bold text-espresso">
                            ₹{Number(order.total).toLocaleString("en-IN")}
                        </span>
                        {expanded ? <ChevronUp size={16} className="text-charcoal-lighter" /> : <ChevronDown size={16} className="text-charcoal-lighter" />}
                    </div>
                </div>
                <StatusPipeline status={order.status} />
            </button>

            {expanded && (
                <div className="border-t border-cream-darker/30 px-5 pb-5">
                    <div className="pt-4 space-y-2">
                        {order.items.map(item => (
                            <div key={item.id} className="flex items-center justify-between py-2 px-3 bg-cream/40 rounded-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-gold/10 flex items-center justify-center text-gold">
                                        <Package size={14} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-espresso">{item.product.name}</p>
                                        <p className="text-[10px] text-charcoal-lighter">Qty: {item.quantity} · ₹{Number(item.unitPrice).toLocaleString("en-IN")} each</p>
                                    </div>
                                </div>
                                <span className="text-sm font-semibold text-espresso">
                                    ₹{Number(item.totalPrice).toLocaleString("en-IN")}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-3 border-t border-cream-darker/20 flex items-center justify-between">
                        <p className="text-xs text-charcoal-lighter">
                            {order.shippingAddress && `📍 ${order.shippingAddress}${order.shippingCity ? `, ${order.shippingCity}` : ""}`}
                        </p>
                        {order.status === "DELIVERED" && (
                            <Link href="/products"
                                className="text-xs text-gold hover:text-gold-dark transition-colors flex items-center gap-1 px-3 py-1.5 rounded-sm border border-gold/20">
                                <RotateCcw size={12} /> Reorder
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ClientOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch("/api/orders?limit=20");
                const data = await res.json();
                setOrders(data.orders ?? []);
            } catch (e) {
                console.error("Failed to load orders", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const totalSpent = orders
        .filter(o => o.status !== "CANCELLED" && o.status !== "REFUNDED")
        .reduce((sum, o) => sum + Number(o.total), 0);
    const inTransit = orders.filter(o => o.status === "PROCESSING" || o.status === "SHIPPED").length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="font-display text-xl text-espresso">My Orders</h1>
                <Link href="/products" className="btn-outline text-xs py-2 px-4">Shop Products</Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: "Total Orders", value: loading ? "—" : String(orders.length) },
                    { label: "Total Spent",  value: loading ? "—" : `₹${totalSpent.toLocaleString("en-IN")}`, className: "text-green-600" },
                    { label: "In Transit",   value: loading ? "—" : String(inTransit) },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-sm border border-cream-darker/50 p-4 text-center">
                        <p className={`font-display text-2xl font-bold ${s.className ?? "text-espresso"}`}>{s.value}</p>
                        <p className="text-[10px] text-charcoal-lighter uppercase tracking-wider">{s.label}</p>
                    </div>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gold" size={28} /></div>
            ) : orders.length === 0 ? (
                <div className="bg-white rounded-sm border border-cream-darker/50 p-12 text-center">
                    <ShoppingBag className="w-10 h-10 text-cream-darker mx-auto mb-3" />
                    <p className="text-charcoal-lighter text-sm">No orders yet.</p>
                    <Link href="/products" className="inline-block mt-3 text-sm text-gold font-semibold">Shop Now →</Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {orders.map(o => <OrderCard key={o.id} order={o} />)}
                </div>
            )}
        </div>
    );
}
