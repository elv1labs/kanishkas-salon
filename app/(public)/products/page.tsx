export const dynamic = 'force-dynamic';
// Products / Shop Page
import Link from "next/link";
import AddToCartBtn from "@/components/ui/AddToCartBtn";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { ShoppingBag, Star, Filter, Truck, Shield, Headphones, RotateCcw } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Shop Premium Beauty Products",
    description:
        "Shop premium hair care, skincare, makeup, tools & accessories from Kanishka's Family Salon & Academy, Indore. Free shipping on orders above ₹500.",
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Playfair+Display:wght@400;500;600;700&display=swap');
  
  @keyframes shopFadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shopFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .shop-hero-section {
    position: relative;
    background: #0A0A0A;
    padding: clamp(60px, 10vw, 100px) clamp(20px, 5vw, 48px);
    min-height: 50vh;
    display: flex;
    align-items: center;
    overflow: hidden;
  }
  .shop-hero-bg {
    position: absolute; inset: 0;
    background: 
      radial-gradient(ellipse at 20% 50%, rgba(201,168,76,0.06) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 80%, rgba(201,168,76,0.04) 0%, transparent 40%);
  }
  .shop-hero-pattern {
    position: absolute; inset: 0;
    background-image: radial-gradient(circle at 1px 1px, rgba(201,168,76,0.08) 1px, transparent 0);
    background-size: 40px 40px;
  }
  .shop-eyebrow { animation: shopFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.1s both; }
  .shop-title { animation: shopFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.25s both; }
  .shop-rule { animation: shopFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.4s both; }
  .shop-subtitle { animation: shopFadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.55s both; }

  .shop-hero-float {
    animation: shopFloat 6s ease-in-out infinite;
  }
  .shop-hero-float:nth-child(2) { animation-delay: -2s; }
  .shop-hero-float:nth-child(3) { animation-delay: -4s; }

  .shop-category-pill {
    transition: all 0.25s ease;
  }
  .shop-category-pill:hover {
    background: rgba(201,168,76,0.1);
    border-color: rgba(201,168,76,0.3);
  }
  .shop-category-pill.active {
    background: #C9A84C;
    color: #0A0A0A;
    border-color: #C9A84C;
  }

  .shop-product-card {
    transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s ease;
  }
  .shop-product-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 48px rgba(201,168,76,0.12), 0 8px 24px rgba(0,0,0,0.3);
  }
  .shop-product-card:hover .shop-product-img {
    transform: scale(1.06);
  }
  .shop-product-img {
    transition: transform 0.6s cubic-bezier(0.22,1,0.36,1);
  }
  .shop-product-badge {
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
  .shop-product-card:hover .shop-product-badge {
    transform: translateY(-4px);
  }

  .shop-benefit-icon {
    animation: shopFloat 4s ease-in-out infinite;
  }
  .shop-benefit-icon:nth-child(2) { animation-delay: -1s; }
  .shop-benefit-icon:nth-child(3) { animation-delay: -2s; }
  .shop-benefit-icon:nth-child(4) { animation-delay: -3s; }

  .shop-add-btn {
    transition: all 0.3s cubic-bezier(0.22,1,0.36,1);
  }
  .shop-add-btn:hover {
    background: #E2C97E;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(201,168,76,0.25);
  }

  @media (max-width: 639px) {
    .shop-hero-section { min-height: 40vh; }
    .shop-products-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important; }
  }

  @media (prefers-reduced-motion: reduce) {
    .shop-eyebrow, .shop-title, .shop-rule, .shop-subtitle,
    .shop-hero-float, .shop-product-card, .shop-product-img,
    .shop-product-badge, .shop-benefit-icon, .shop-add-btn {
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
      transition: none !important;
    }
  }
`;

const categoryLabels: Record<string, string> = {
    HAIR_CARE: "Hair Care", MAKEUP_COSMETICS: "Makeup", SKIN_CARE: "Skincare",
    NAIL_CARE: "Nail Care", TOOLS_ACCESSORIES: "Tools", GIFT_VOUCHER: "Gift Vouchers",
};

const benefits = [
    { icon: Truck, label: "Free Shipping", sub: "Above ₹500" },
    { icon: Shield, label: "Genuine Products", sub: "100% Authentic" },
    { icon: RotateCcw, label: "Easy Returns", sub: "Within 7 days" },
    { icon: Headphones, label: "Expert Support", sub: "Always Ready" },
];

async function getProducts(category?: string, sortBy = "createdAt", page = 1) {
    try {
        const where: any = { isActive: true };
        if (category) where.category = category;

        const validSorts: Record<string, any> = {
            createdAt: { createdAt: "desc" }, price_asc: { price: "asc" },
            price_desc: { price: "desc" }, name: { name: "asc" },
        };

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                orderBy: validSorts[sortBy] ?? { createdAt: "desc" },
                skip: (page - 1) * 12,
                take: 12,
                include: {
                    reviews: { where: { isPublished: true }, select: { rating: true } },
                },
            }),
            prisma.product.count({ where }),
        ]);

        return {
            products: products.map((p) => {
                const avgRating = p.reviews.length > 0
                    ? Math.round((p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length) * 10) / 10
                    : null;
                return { ...p, avgRating, reviewCount: p.reviews.length };
            }),
            total,
            pages: Math.ceil(total / 12),
        };
    } catch {
        return { products: [], total: 0, pages: 0 };
    }
}

export default async function ProductsPage({ searchParams }: { searchParams: { category?: string } }) {
    const [{ products }, t] = await Promise.all([
        getProducts(searchParams?.category),
        getTranslations(),
    ]);

    const displayProducts = products;
    const categories = Object.entries(categoryLabels);

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: CSS }} />

            {/* Hero */}
            <section className="shop-hero-section">
                <div className="shop-hero-bg" />
                <div className="shop-hero-pattern" />
                
                {/* Floating shapes */}
                <div style={{ position: "absolute", top: "15%", left: "8%", pointerEvents: "none" }}>
                    <div className="shop-hero-float" style={{ width: 60, height: 60, border: "1px solid rgba(201,168,76,0.15)", borderRadius: "50%" }} />
                </div>
                <div style={{ position: "absolute", bottom: "20%", right: "12%", pointerEvents: "none" }}>
                    <div className="shop-hero-float" style={{ width: 40, height: 40, border: "1px solid rgba(201,168,76,0.1)", borderRadius: "2px" }} />
                </div>
                <div style={{ position: "absolute", top: "40%", right: "20%", pointerEvents: "none" }}>
                    <div className="shop-hero-float" style={{ width: 24, height: 24, border: "1px solid rgba(201,168,76,0.12)", borderRadius: "50%" }} />
                </div>

                <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 700, margin: "0 auto" }}>
                    <p className="shop-eyebrow" style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 11,
                        fontWeight: 500,
                        letterSpacing: "0.35em",
                        textTransform: "uppercase",
                        color: "#C9A84C",
                        marginBottom: 20,
                    }}>
                        <ShoppingBag className="inline w-4 h-4 mr-2" style={{ verticalAlign: "middle" }} />
                        Premium Beauty
                    </p>
                    <h1 className="shop-title" style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: "clamp(40px, 8vw, 72px)",
                        fontWeight: 500,
                        color: "#FDFAF5",
                        lineHeight: 1.1,
                        letterSpacing: "-0.02em",
                        margin: 0,
                    }}>
                        Shop Products
                    </h1>
                    <div className="shop-rule" style={{
                        height: 1,
                        width: 60,
                        background: "linear-gradient(90deg, transparent, #C9A84C, transparent)",
                        margin: "20px auto 0",
                    }} />
                    <p className="shop-subtitle" style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 15,
                        fontWeight: 300,
                        color: "rgba(253,250,245,0.5)",
                        lineHeight: 1.7,
                        marginTop: 20,
                    }}>
                        Premium hair care, skincare & cosmetics for your beauty routine
                    </p>
                </div>
            </section>

            {/* Benefits Bar */}
            <section style={{ background: "#111111", padding: "clamp(24px, 5vw, 40px) clamp(20px, 5vw, 48px)", borderBottom: "1px solid #1A1A1A" }}>
                <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
                    {benefits.map((benefit, i) => (
                        <div key={benefit.label} style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "center" }}>
                            <div className="shop-benefit-icon" style={{
                                width: 40,
                                height: 40,
                                borderRadius: "50%",
                                border: "1px solid rgba(201,168,76,0.15)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                            }}>
                                <benefit.icon size={16} color="#C9A84C" strokeWidth={1.5} />
                            </div>
                            <div style={{ textAlign: "left" }}>
                                <div style={{
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: 12,
                                    fontWeight: 500,
                                    color: "#FDFAF5",
                                    lineHeight: 1.3,
                                }}>
                                    {benefit.label}
                                </div>
                                <div style={{
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: 10,
                                    color: "rgba(253,250,245,0.4)",
                                }}>
                                    {benefit.sub}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Category Filter */}
            <section style={{ background: "#0A0A0A", borderBottom: "1px solid #1A1A1A" }}>
                <div style={{
                    maxWidth: 1300,
                    margin: "0 auto",
                    padding: "16px clamp(16px, 4vw, 48px)",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    overflowX: "auto",
                    scrollbarWidth: "none",
                    WebkitOverflowScrolling: "touch",
                }}>
                    <Link
                        href="/products"
                        className={`shop-category-pill ${!searchParams?.category ? 'active' : ''}`}
                        style={{
                            display: "inline-block",
                            padding: "10px 20px",
                            borderRadius: 2,
                            border: "1px solid",
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: 11,
                            fontWeight: 500,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            textDecoration: "none",
                            whiteSpace: "nowrap",
                            color: !searchParams?.category ? "#0A0A0A" : "rgba(253,250,245,0.6)",
                            borderColor: !searchParams?.category ? "#C9A84C" : "rgba(201,168,76,0.2)",
                            background: !searchParams?.category ? "#C9A84C" : "transparent",
                        }}
                    >
                        All Products
                    </Link>
                    {categories.map(([key, label]) => (
                        <Link
                            key={key}
                            href={`/products?category=${key}`}
                            className={`shop-category-pill ${searchParams?.category === key ? 'active' : ''}`}
                            style={{
                                display: "inline-block",
                                padding: "10px 20px",
                                borderRadius: 2,
                                border: "1px solid",
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: 11,
                                fontWeight: 500,
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                textDecoration: "none",
                                whiteSpace: "nowrap",
                                color: searchParams?.category === key ? "#0A0A0A" : "rgba(253,250,245,0.6)",
                                borderColor: searchParams?.category === key ? "#C9A84C" : "rgba(201,168,76,0.2)",
                                background: searchParams?.category === key ? "#C9A84C" : "transparent",
                            }}
                        >
                            {label}
                        </Link>
                    ))}
                </div>
            </section>

            {/* Product Grid */}
            <section style={{ background: "#0D0D0D", padding: "clamp(40px, 8vw, 72px) clamp(16px, 4vw, 48px)" }}>
                <div style={{ maxWidth: 1400, margin: "0 auto" }}>
                    {/* Results count */}
                    <div style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 13,
                        color: "rgba(253,250,245,0.4)",
                        marginBottom: 24,
                    }}>
                        {displayProducts.length} product{displayProducts.length !== 1 && 's'} available
                    </div>

                    <div className="shop-products-grid" style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: "clamp(16px, 3vw, 24px)",
                    }}>
                        {displayProducts.length === 0 && (
                            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 20px" }}>
                                <p style={{
                                    fontFamily: "'Playfair Display', serif",
                                    fontSize: 24,
                                    color: "rgba(253,250,245,0.5)",
                                }}>
                                    No products found
                                </p>
                                <a href="/products" style={{
                                    marginTop: 16,
                                    display: "inline-block",
                                    color: "#C9A84C",
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: 13,
                                }}>
                                    Browse all products →
                                </a>
                            </div>
                        )}
                        {displayProducts.map((product: any, i: number) => (
                            <div key={product.id} style={{ position: "relative" }}>
                                <Link href={`/products/${product.slug}`} className="shop-product-card" style={{
                                    display: "block",
                                    background: "#141414",
                                    border: "1px solid #1A1A1A",
                                    borderRadius: 4,
                                    overflow: "hidden",
                                    textDecoration: "none",
                                }}>
                                    {/* Image */}
                                    <div style={{ position: "relative", aspectRatio: "1", overflow: "hidden", background: "#0A0A0A" }}>
                                        {product.thumbnailUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={product.thumbnailUrl}
                                                alt={product.name}
                                                className="shop-product-img"
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                }}
                                            />
                                        ) : (
                                            <div style={{
                                                width: "100%",
                                                height: "100%",
                                                background: "linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(183,110,121,0.08) 100%)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}>
                                                <ShoppingBag style={{ color: "rgba(201,168,76,0.15)" }} size={40} />
                                            </div>
                                        )}
                                        
                                        {/* Badges */}
                                        {(product.comparePrice && Number(product.comparePrice) > Number(product.price)) && (
                                            <div className="shop-product-badge" style={{
                                                position: "absolute",
                                                top: 12,
                                                left: 12,
                                                background: "#DC2626",
                                                color: "#fff",
                                                fontFamily: "'DM Sans', sans-serif",
                                                fontSize: 10,
                                                fontWeight: 600,
                                                padding: "4px 10px",
                                                borderRadius: 2,
                                                letterSpacing: "0.05em",
                                            }}>
                                                {Math.round((1 - Number(product.price) / Number(product.comparePrice)) * 100)}% OFF
                                            </div>
                                        )}
                                        {product.isFeatured && (
                                            <div className="shop-product-badge" style={{
                                                position: "absolute",
                                                top: 12,
                                                right: 12,
                                                background: "#C9A84C",
                                                color: "#0A0A0A",
                                                fontFamily: "'DM Sans', sans-serif",
                                                fontSize: 10,
                                                fontWeight: 600,
                                                padding: "4px 10px",
                                                borderRadius: 2,
                                                letterSpacing: "0.05em",
                                            }}>
                                                ★ Featured
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ padding: "clamp(14px, 2.5vw, 20px)" }}>
                                        {/* Category */}
                                        <span style={{
                                            fontFamily: "'DM Sans', sans-serif",
                                            fontSize: 9,
                                            fontWeight: 500,
                                            letterSpacing: "0.15em",
                                            textTransform: "uppercase",
                                            color: "rgba(253,250,245,0.35)",
                                        }}>
                                            {categoryLabels[product.category] ?? product.category}
                                        </span>

                                        {/* Name */}
                                        <h3 style={{
                                            fontFamily: "'Playfair Display', serif",
                                            fontSize: "clamp(14px, 1.5vw, 16px)",
                                            fontWeight: 500,
                                            color: "#FDFAF5",
                                            lineHeight: 1.4,
                                            marginTop: 8,
                                            marginBottom: 10,
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                        }}>
                                            {product.name}
                                        </h3>

                                        {/* Rating */}
                                        {product.avgRating && (
                                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                                                <Star size={12} style={{ color: "#C9A84C", fill: "#C9A84C" }} />
                                                <span style={{
                                                    fontFamily: "'DM Sans', sans-serif",
                                                    fontSize: 11,
                                                    color: "rgba(253,250,245,0.5)",
                                                }}>
                                                    {product.avgRating} ({product.reviewCount})
                                                </span>
                                            </div>
                                        )}

                                        {/* Price */}
                                        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                                            <span style={{
                                                fontFamily: "'Playfair Display', serif",
                                                fontSize: "clamp(18px, 2vw, 22px)",
                                                fontWeight: 500,
                                                color: "#C9A84C",
                                            }}>
                                                ₹{Number(product.price).toLocaleString("en-IN")}
                                            </span>
                                            {product.comparePrice && Number(product.comparePrice) > Number(product.price) && (
                                                <span style={{
                                                    fontFamily: "'DM Sans', sans-serif",
                                                    fontSize: 12,
                                                    color: "rgba(253,250,245,0.35)",
                                                    textDecoration: "line-through",
                                                }}>
                                                    ₹{Number(product.comparePrice).toLocaleString("en-IN")}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                                <div style={{ padding: "8px 0" }}>
                                    <AddToCartBtn product={product} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}