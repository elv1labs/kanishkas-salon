import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CheckCircle, Package, ArrowRight, Smartphone, Banknote, CreditCard, Clock } from "lucide-react";

interface Props { params: { id: string } }

export default async function OrderSuccessPage({ params }: Props) {
    let order = null;
    try {
        order = await prisma.order.findUnique({
            where: { id: params.id },
            include: {
                items: {
                    include: {
                        product: { select: { name: true, slug: true } }
                    }
                },
                payment: { select: { status: true, method: true, paidAt: true } },
            },
        });
    } catch {
        // DB not ready
    }

    const isPaid = order?.payment?.status === "PAID";

    return (
        <section className="section-padding bg-cream min-h-screen">
            <div className="container-salon max-w-lg mx-auto text-center px-4">

                {/* Success icon */}
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="text-green-600" size={36} />
                </div>

                <h1 className="font-display text-3xl text-espresso mb-3">Order Confirmed!</h1>
                <p className="text-charcoal-lighter mb-1">
                    Thank you for your order. We&apos;ll get it ready for you.
                </p>

                {order && (
                    <p className="text-sm text-charcoal-lighter mb-8">
                        Order #{order.orderRef?.slice(-8).toUpperCase() ?? order.id.slice(-8).toUpperCase()}
                        &nbsp;&middot;&nbsp;
                        ₹{Number(order.total).toLocaleString("en-IN")}
                    </p>
                )}

                {/* Items */}
                {order?.items && order.items.length > 0 && (
                    <div className="bg-white border border-cream-darker/50 rounded-sm p-5 mb-6 text-left">
                        <h2 className="font-display text-sm text-espresso mb-3 uppercase tracking-wider">Items Ordered</h2>
                        {order.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between py-2 border-b border-cream-darker/30 last:border-0">
                                <div className="flex items-center gap-2">
                                    <Package size={14} className="text-gold flex-shrink-0" />
                                    <span className="text-sm text-charcoal">{item.product.name}</span>
                                    <span className="text-xs text-charcoal-lighter">x{item.quantity}</span>
                                </div>
                                <span className="text-sm font-medium text-espresso">
                                    ₹{(Number(item.unitPrice) * item.quantity).toLocaleString("en-IN")}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Payment status */}
                {isPaid ? (
                    <div className="bg-green-50 border border-green-200 rounded-sm p-4 mb-6 text-left flex items-start gap-3">
                        <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-green-700">Payment Confirmed ✓</p>
                            <p className="text-xs text-green-600 mt-0.5">
                                Paid via {order?.payment?.method} on{" "}
                                {order?.payment?.paidAt
                                    ? new Date(order.payment.paidAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                                    : "—"}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-sm p-5 mb-6 text-left">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                <Clock size={16} className="text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-amber-800">Payment Pending</p>
                                <p className="text-xs text-amber-700 mt-0.5">
                                    Pay at the salon when you collect your order, or on delivery.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { icon: <Smartphone size={16} className="text-amber-600" />, label: "UPI", desc: "Scan & Pay" },
                                { icon: <Banknote size={16} className="text-amber-600" />, label: "Cash", desc: "At Counter" },
                                { icon: <CreditCard size={16} className="text-amber-600" />, label: "Card", desc: "Debit / Credit" },
                            ].map(m => (
                                <div key={m.label} className="bg-white rounded-sm border border-amber-200 p-2.5 text-center">
                                    <div className="flex justify-center mb-1">{m.icon}</div>
                                    <p className="text-xs font-semibold text-amber-800">{m.label}</p>
                                    <p className="text-[10px] text-amber-600">{m.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/products" className="btn-outline">
                        Continue Shopping
                    </Link>
                    <Link href="/dashboard/client/orders" className="btn-gold inline-flex items-center gap-2">
                        Track My Order <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </section>
    );
}
