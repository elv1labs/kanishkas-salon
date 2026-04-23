"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
    Minus, Plus, Trash2, ShoppingBag, ArrowRight,
    Tag, Loader2, MapPin, Phone, User, X, Copy, CheckCircle, IndianRupee
} from "lucide-react";
import { useTranslations } from "next-intl";
import MotionWrapper from "@/components/ui/MotionWrapper";
import { useCart } from "@/contexts/CartContext";

// ─── Types ───────────────────────────────────────────────────────────────────

type CartItem = {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string | null;
    slug: string;
};

type ShippingForm = {
    shippingName: string;
    shippingPhone: string;
    shippingAddress: string;
    shippingCity: string;
    shippingPincode: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function CartPage() {
    const sessionResult = useSession();
    const session = sessionResult?.data ?? null;
    const router = useRouter();
    const { items, removeItem, updateQuantity, clearCart } = useCart();
    const t = useTranslations();

    const [voucherCode, setVoucherCode]               = useState("");
    const [voucherApplied, setVoucherApplied]           = useState(false);
    const [voucherDiscount, setVoucherDiscount]         = useState(0);
    const [voucherError, setVoucherError]               = useState<string | null>(null);
    const [voucherLoading, setVoucherLoading]           = useState(false);
    const [showShipping, setShowShipping]               = useState(false);
    const [submitting, setSubmitting]                   = useState(false);
    const [checkoutError, setCheckoutError]             = useState<string | null>(null);

    // UPI payment state
    const [showUpiModal, setShowUpiModal]               = useState(false);
    const [upiSettings, setUpiSettings]                 = useState<{ upiId: string | null; upiQrImageUrl: string | null }>({ upiId: null, upiQrImageUrl: null });
    const [utrInput, setUtrInput]                       = useState("");
    const [upiSubmitting, setUpiSubmitting]             = useState(false);
    const [upiSuccess, setUpiSuccess]                   = useState(false);
    const [upiError, setUpiError]                       = useState<string | null>(null);
    const [placedOrderId, setPlacedOrderId]             = useState<string | null>(null);
    const [placedOrderTotal, setPlacedOrderTotal]       = useState(0);
    const [copiedUpi, setCopiedUpi]                     = useState(false);

    const [shipping, setShipping] = useState<ShippingForm>({
        shippingName: session?.user?.name ?? "",
        shippingPhone: "",
        shippingAddress: "",
        shippingCity: "Indore",
        shippingPincode: "",
    });

    // Fetch UPI settings on mount
    useEffect(() => {
        fetch("/api/settings/public")
            .then(r => r.json())
            .then(data => {
                if (data.settings) {
                    setUpiSettings({ upiId: data.settings.upiId, upiQrImageUrl: data.settings.upiQrImageUrl });
                }
            })
            .catch(() => {});
    }, []);

    // ── Cart calculations ────────────────────────────────────────────────────

    const subtotal     = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount     = voucherApplied ? voucherDiscount : 0;
    const shippingCost = subtotal >= 500 ? 0 : 50;
    const tax          = Math.round((subtotal - discount) * 0.18 * 100) / 100;
    const total        = subtotal - discount + shippingCost + tax;

    // ── Voucher apply ─────────────────────────────────────────────────────────

    const handleApplyVoucher = async () => {
        if (!voucherCode.trim()) return;
        setVoucherLoading(true);
        setVoucherError(null);
        try {
            const res = await fetch("/api/vouchers/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: voucherCode, subtotal }),
            });
            const data = await res.json();
            if (!data.valid) {
                setVoucherError(data.error ?? "Invalid voucher");
                setVoucherApplied(false);
                setVoucherDiscount(0);
            } else {
                setVoucherApplied(true);
                setVoucherDiscount(data.discountAmount);
            }
        } catch {
            setVoucherError("Could not validate voucher. Please try again.");
        } finally {
            setVoucherLoading(false);
        }
    };

    // ── Cart actions ─────────────────────────────────────────────────────────
    // (delegated to CartContext)

    // ── Checkout ─────────────────────────────────────────────────────────────

    const handleCheckout = async () => {
        if (!session) {
            router.push(`/login?callbackUrl=/cart`);
            return;
        }

        // Validate shipping fields
        const missing = Object.entries(shipping).find(([, v]) => !v.trim());
        if (missing) {
            setCheckoutError("Please fill in all shipping details.");
            return;
        }
        if (!/^\d{6}$/.test(shipping.shippingPincode)) {
            setCheckoutError("Please enter a valid 6-digit pincode.");
            return;
        }
        if (!/^\+?\d{10,13}$/.test(shipping.shippingPhone.replace(/\s/g, ""))) {
            setCheckoutError("Please enter a valid phone number.");
            return;
        }

        setSubmitting(true);
        setCheckoutError(null);

        try {
            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: items.map(i => ({ productId: i.id, quantity: i.quantity })),
                    voucherCode: voucherApplied ? voucherCode.trim().toUpperCase() : undefined,
                    loyaltyPointsToRedeem: 0,
                    ...shipping,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setCheckoutError(data.error ?? "Checkout failed. Please try again.");
                return;
            }

            if (data.orderId) {
                setPlacedOrderId(data.orderId);
                setPlacedOrderTotal(total);
                clearCart();

                // If UPI is configured, show UPI modal; otherwise go to success
                if (upiSettings.upiId || upiSettings.upiQrImageUrl) {
                    setShowUpiModal(true);
                } else {
                    router.push(`/orders/${data.orderId}/success`);
                }
            } else {
                setCheckoutError("Order could not be created. Please try again.");
            }
        } catch {
            setCheckoutError("Network error. Please check your connection and try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpiSubmit = async () => {
        if (!utrInput.trim() || !placedOrderId) return;
        setUpiSubmitting(true);
        setUpiError(null);
        try {
            const res = await fetch("/api/payments/confirm-upi", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: placedOrderId, transactionRef: utrInput.trim() }),
            });
            const data = await res.json();
            if (!res.ok) {
                setUpiError(data.error ?? "Failed to submit payment.");
            } else {
                setUpiSuccess(true);
            }
        } catch {
            setUpiError("Network error. Please try again.");
        } finally {
            setUpiSubmitting(false);
        }
    };

    const copyUpiId = () => {
        if (upiSettings.upiId) {
            navigator.clipboard.writeText(upiSettings.upiId).catch(() => {});
            setCopiedUpi(true);
            setTimeout(() => setCopiedUpi(false), 2000);
        }
    };

    // ── UPI Payment Modal ──────────────────────────────────────────────────────

    if (showUpiModal) {
        return (
            <section className="bg-espresso py-16 sm:py-20 min-h-[70vh]">
                <div className="container-salon max-w-lg px-4">
                    <MotionWrapper>
                        <div className="bg-white rounded-sm p-6 sm:p-8">
                            {upiSuccess ? (
                                <div className="text-center py-6">
                                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                    <h2 className="font-display text-2xl text-espresso mb-2">Payment Submitted!</h2>
                                    <p className="text-sm text-charcoal-lighter mb-6">Our team will verify your payment and confirm shortly. You&apos;ll receive a notification once verified.</p>
                                    <button onClick={() => router.push(`/orders/${placedOrderId}/success`)} className="btn-gold px-8">
                                        View Order
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="text-center mb-6">
                                        <IndianRupee className="w-10 h-10 text-gold mx-auto mb-2" />
                                        <h2 className="font-display text-2xl text-espresso">Pay via UPI</h2>
                                        <p className="text-sm text-charcoal-lighter mt-1">Scan QR or use UPI ID to pay</p>
                                    </div>

                                    <div className="bg-gold/5 border border-gold/20 rounded-sm p-4 text-center mb-4">
                                        <p className="text-xs text-charcoal-lighter">Amount to pay</p>
                                        <p className="font-display text-3xl text-espresso mt-1">₹{placedOrderTotal.toLocaleString("en-IN")}</p>
                                    </div>

                                    {upiSettings.upiQrImageUrl && (
                                        <div className="flex justify-center mb-4">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={upiSettings.upiQrImageUrl} alt="UPI QR Code" className="w-48 h-48 object-contain border border-cream-darker/50 rounded-sm p-2" />
                                        </div>
                                    )}

                                    {upiSettings.upiId && (
                                        <div className="flex items-center justify-center gap-2 bg-cream rounded-sm p-3 mb-4">
                                            <span className="text-sm font-mono text-espresso">{upiSettings.upiId}</span>
                                            <button onClick={copyUpiId} className="text-gold hover:text-gold-dark transition-colors" title="Copy UPI ID">
                                                {copiedUpi ? <CheckCircle size={16} /> : <Copy size={16} />}
                                            </button>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs text-charcoal-lighter mb-1">UTR / Transaction Reference</label>
                                            <input
                                                type="text"
                                                value={utrInput}
                                                onChange={e => setUtrInput(e.target.value.replace(/[^A-Za-z0-9]/g, ""))}
                                                placeholder="Enter 12-digit UTR number"
                                                maxLength={30}
                                                className="w-full border border-cream-darker rounded-sm py-2.5 px-3 text-sm font-mono focus:outline-none focus:border-gold/40 bg-cream text-center tracking-wider"
                                            />
                                        </div>

                                        {upiError && (
                                            <p className="text-red-500 text-xs text-center">{upiError}</p>
                                        )}

                                        <button
                                            onClick={handleUpiSubmit}
                                            disabled={upiSubmitting || utrInput.length < 6}
                                            className="btn-gold w-full py-3 disabled:opacity-50"
                                        >
                                            {upiSubmitting ? <Loader2 size={18} className="animate-spin mx-auto" /> : "I've Paid — Submit UTR"}
                                        </button>

                                        <button
                                            onClick={() => router.push(`/orders/${placedOrderId}/success`)}
                                            className="w-full text-sm text-charcoal-lighter hover:text-espresso text-center transition-colors py-2"
                                        >
                                            Pay at Store Instead →
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </MotionWrapper>
                </div>
            </section>
        );
    }

    // ── Empty cart ────────────────────────────────────────────────────────────

    if (items.length === 0) {
        return (
            <section className="bg-espresso py-16 sm:py-20">
                <div className="container-salon text-center px-4">
                    <MotionWrapper>
                        <ShoppingBag className="w-12 h-12 text-gold/30 mx-auto mb-4" />
                        <h1 className="font-display text-3xl text-cream mb-4">{t('cart.empty')}</h1>
                        <p className="text-cream/60 mb-6">{t('cart.emptyDesc')}</p>
                        <Link href="/products" className="btn-gold">{t('cart.shopProducts')}</Link>
                    </MotionWrapper>
                </div>
            </section>
        );
    }

    // ── Main render ───────────────────────────────────────────────────────────

    return (
        <>
            {/* Hero */}
            <section className="bg-espresso py-12 sm:py-16">
                <div className="container-salon text-center px-4">
                    <MotionWrapper>
                        <h1 className="font-display text-3xl sm:text-4xl font-bold text-cream mb-2">
                            {t('cart.title')}
                        </h1>
                        <p className="text-cream/60 text-sm">
                            {items.length} item{items.length !== 1 ? "s" : ""} in your cart
                        </p>
                    </MotionWrapper>
                </div>
            </section>

            <section className="section-padding bg-cream">
                <div className="container-salon">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* ── Cart Items ──────────────────────────────────────── */}
                        <div className="lg:col-span-2 space-y-3">
                            {items.map(item => (
                                <div
                                    key={item.id}
                                    className="bg-white rounded-sm border border-cream-darker/50 p-4 flex items-center gap-4"
                                >
                                    <div className="w-20 h-20 bg-cream-dark rounded-sm flex-shrink-0 flex items-center justify-center overflow-hidden">
                                        {item.image ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <ShoppingBag className="text-gold/20" size={24} />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-display text-base font-semibold text-espresso truncate">
                                            {item.name}
                                        </h3>
                                        <p className="text-sm text-gold font-semibold mt-1">
                                            ₹{item.price.toLocaleString("en-IN")}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => updateQuantity(item.id, -1)}
                                            className="w-8 h-8 rounded-sm border border-cream-darker flex items-center justify-center text-charcoal-lighter hover:border-gold hover:text-gold transition-colors"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="w-8 text-center text-sm font-medium text-espresso">
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => updateQuantity(item.id, 1)}
                                            className="w-8 h-8 rounded-sm border border-cream-darker flex items-center justify-center text-charcoal-lighter hover:border-gold hover:text-gold transition-colors"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>

                                    <div className="text-right">
                                        <p className="font-display font-bold text-espresso">
                                            ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                                        </p>
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="text-red-400 hover:text-red-500 mt-1 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <Link href="/products" className="inline-flex items-center gap-2 text-sm text-gold hover:text-gold-dark transition-colors mt-2">
                                ← {t('cart.continueShopping')}
                            </Link>
                        </div>

                        {/* ── Order Summary + Shipping ────────────────────────── */}
                        <div>
                            <div className="bg-white rounded-sm border border-cream-darker/50 p-6 sticky top-20">
                                <h2 className="font-display text-lg text-espresso mb-4">{t('cart.orderSummary')}</h2>

                                {/* Voucher */}
                                <div className="mb-4">
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-lighter" />
                                            <input
                                                id="voucher-code-input"
                                                type="text"
                                                value={voucherCode}
                                                disabled={voucherApplied}
                                                onChange={e => {
                                                    setVoucherCode(e.target.value.toUpperCase());
                                                    setVoucherError(null);
                                                }}
                                                onKeyDown={e => { if (e.key === "Enter") handleApplyVoucher(); }}
                                                placeholder="Voucher code"
                                                className="w-full bg-cream border border-cream-darker rounded-sm py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:border-gold/40 transition-all disabled:opacity-60"
                                            />
                                        </div>
                                        {voucherApplied ? (
                                            <button
                                                id="remove-voucher-btn"
                                                onClick={() => { setVoucherApplied(false); setVoucherCode(""); setVoucherDiscount(0); setVoucherError(null); }}
                                                className="px-3 border border-red-300 text-red-500 text-xs font-semibold rounded-sm hover:bg-red-50 transition-colors flex items-center gap-1"
                                            >
                                                <X size={12} /> Remove
                                            </button>
                                        ) : (
                                            <button
                                                id="apply-voucher-btn"
                                                onClick={handleApplyVoucher}
                                                disabled={!voucherCode.trim() || voucherLoading}
                                                className="px-4 bg-espresso text-cream text-xs font-semibold uppercase tracking-wider rounded-sm hover:bg-espresso-50 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                            >
                                                {voucherLoading ? <Loader2 size={12} className="animate-spin" /> : null}
                                                Apply
                                            </button>
                                        )}
                                    </div>
                                    {voucherApplied && (
                                        <p className="text-green-600 text-xs mt-1.5">
                                            ✓ Voucher applied — <strong>₹{voucherDiscount.toLocaleString("en-IN")}</strong> off
                                        </p>
                                    )}
                                    {voucherError && (
                                        <p className="text-red-500 text-xs mt-1.5">{voucherError}</p>
                                    )}
                                </div>

                                {/* Price Breakdown */}
                                <div className="space-y-2.5 text-sm border-t border-cream-darker/50 pt-4">
                                    <div className="flex justify-between">
                                        <span className="text-charcoal-lighter">Subtotal</span>
                                        <span className="text-espresso">₹{subtotal.toLocaleString("en-IN")}</span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Voucher discount</span>
                                            <span>−₹{discount}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-charcoal-lighter">Shipping</span>
                                        <span className={shippingCost === 0 ? "text-green-600" : "text-espresso"}>
                                            {shippingCost === 0 ? "Free" : `₹${shippingCost}`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-charcoal-lighter">GST (18%)</span>
                                        <span className="text-espresso">₹{tax.toLocaleString("en-IN")}</span>
                                    </div>
                                    <div className="flex justify-between border-t border-cream-darker/50 pt-3 font-bold">
                                        <span className="text-espresso">Total</span>
                                        <span className="font-display text-xl text-espresso">
                                            ₹{total.toLocaleString("en-IN")}
                                        </span>
                                    </div>
                                </div>

                                {/* Shipping Form Toggle */}
                                {!showShipping ? (
                                    <button
                                        onClick={() => setShowShipping(true)}
                                        className="btn-gold w-full mt-6 py-3.5"
                                    >
                                        {t('cart.proceedToCheckout')} <ArrowRight size={16} className="ml-2 inline" />
                                    </button>
                                ) : (
                                    <div className="mt-6 space-y-3">
                                        <h3 className="font-display text-sm text-espresso border-t border-cream-darker/50 pt-4">
                                            {t('cart.shippingDetails')}
                                        </h3>

                                        {/* Name */}
                                        <div className="relative">
                                            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-lighter" />
                                            <input
                                                type="text"
                                                placeholder="Full name"
                                                value={shipping.shippingName}
                                                onChange={e => setShipping(s => ({ ...s, shippingName: e.target.value }))}
                                                className="w-full border border-cream-darker rounded-sm py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:border-gold/40 bg-cream"
                                            />
                                        </div>

                                        {/* Phone */}
                                        <div className="relative">
                                            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-lighter" />
                                            <input
                                                type="tel"
                                                placeholder="Phone number"
                                                value={shipping.shippingPhone}
                                                onChange={e => setShipping(s => ({ ...s, shippingPhone: e.target.value }))}
                                                className="w-full border border-cream-darker rounded-sm py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:border-gold/40 bg-cream"
                                            />
                                        </div>

                                        {/* Address */}
                                        <div className="relative">
                                            <MapPin size={14} className="absolute left-3 top-3 text-charcoal-lighter" />
                                            <textarea
                                                placeholder="Full address"
                                                rows={2}
                                                value={shipping.shippingAddress}
                                                onChange={e => setShipping(s => ({ ...s, shippingAddress: e.target.value }))}
                                                className="w-full border border-cream-darker rounded-sm py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:border-gold/40 bg-cream resize-none"
                                            />
                                        </div>

                                        {/* City + Pincode */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="text"
                                                placeholder="City"
                                                value={shipping.shippingCity}
                                                onChange={e => setShipping(s => ({ ...s, shippingCity: e.target.value }))}
                                                className="border border-cream-darker rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40 bg-cream"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Pincode"
                                                maxLength={6}
                                                value={shipping.shippingPincode}
                                                onChange={e => setShipping(s => ({ ...s, shippingPincode: e.target.value.replace(/\D/g, "") }))}
                                                className="border border-cream-darker rounded-sm py-2.5 px-3 text-sm focus:outline-none focus:border-gold/40 bg-cream"
                                            />
                                        </div>

                                        {/* Auth notice */}
                                        {!session && (
                                            <div className="bg-gold/5 border border-gold/20 rounded-sm p-3">
                                                <p className="text-xs text-charcoal">
                                                    <Link href="/login?callbackUrl=/cart" className="text-gold font-semibold">Sign in</Link>
                                                    {" "}to complete your purchase and earn loyalty points.
                                                </p>
                                            </div>
                                        )}

                                        {/* Error */}
                                        {checkoutError && (
                                            <div className="bg-red-50 border border-red-200 rounded-sm p-3">
                                                <p className="text-xs text-red-600">{checkoutError}</p>
                                            </div>
                                        )}

                                        {/* Submit */}
                                        <button
                                            onClick={handleCheckout}
                                            disabled={submitting}
                                            className="btn-gold w-full py-3.5 disabled:opacity-50"
                                        >
                                            {submitting ? (
                                                <Loader2 size={18} className="animate-spin mx-auto" />
                                            ) : (
                                                <>{t('cart.placeOrder')} ₹{total.toLocaleString("en-IN")} <ArrowRight size={16} className="ml-2 inline" /></>
                                            )}
                                        </button>

                                        <button
                                            onClick={() => setShowShipping(false)}
                                            className="w-full text-xs text-charcoal-lighter hover:text-espresso text-center transition-colors"
                                        >
                                            {t('cart.backToCart')}
                                        </button>
                                    </div>
                                )}

                                <p className="text-[10px] text-charcoal-lighter text-center mt-3 leading-relaxed">
                                    Free shipping on orders above ₹500 · Payment on delivery or in-store
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </section>
        </>
    );
}
