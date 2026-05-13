"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Menu, X, ChevronDown, Scissors, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const navLinks = [
  { label: "Home",    href: "/",        i18nKey: "nav.home" },
  { label: "About",   href: "/about",   i18nKey: "nav.about" },
  {
    label: "Services",
    href: "/services",
    i18nKey: "nav.services",
    dropdown: [
      { label: "Hair Styling",   href: "/services?cat=HAIR_STYLING", i18nKey: "services_menu.hairStyling" },
      { label: "Skin Care",      href: "/services?cat=SKIN_CARE",    i18nKey: "services_menu.skinCare" },
      { label: "Bridal Makeup",  href: "/services?cat=BRIDAL",       i18nKey: "services_menu.bridalMakeup" },
      { label: "Nail Art",       href: "/services?cat=NAIL_CARE",    i18nKey: "services_menu.nailArt" },
      { label: "Academy",       href: "/services?cat=ACADEMY",      i18nKey: "services_menu.academy" },
    ],
  },
  { label: "Gallery", href: "/gallery",  i18nKey: "nav.gallery" },
  { label: "Blog",    href: "/blog",     i18nKey: "nav.blog" },
  { label: "Contact", href: "/contact",  i18nKey: "nav.contact" },
  { label: "Shop",    href: "/products", i18nKey: "nav.shop" },
];

const GOLD      = "#C9A84C";
const GOLD_LT   = "#E2C97E";
const OBSIDIAN  = "#0D0D0D";
const IVORY     = "#F5F0E8";
const BORDER    = "#2A2A2A";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Montserrat:wght@300;400;500;600&family=Playfair+Display:wght@400;500;600;700&display=swap');

  @keyframes ticker {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  .ticker-track {
    display: flex;
    width: max-content;
    animation: ticker 32s linear infinite;
  }
  .ticker-track:hover { animation-play-state: paused; }

  @keyframes dd-in {
    from { opacity: 0; transform: translateY(-6px) translateX(-50%); }
    to   { opacity: 1; transform: translateY(0)    translateX(-50%); }
  }
  .dd-panel { animation: dd-in 0.22s cubic-bezier(0.22,1,0.36,1) both; }

  @keyframes drawer-in  { from { transform: translateX(100%); } to { transform: translateX(0); } }
  @keyframes drawer-out { from { transform: translateX(0); }    to { transform: translateX(100%); } }
  .drawer-open  { animation: drawer-in  0.32s cubic-bezier(0.22,1,0.36,1) both; }
  .drawer-close { animation: drawer-out 0.28s cubic-bezier(0.55,0,1,0.45) both; }

  .nav-lnk { position: relative; }
  .nav-lnk::after {
    content: '';
    position: absolute; bottom: -2px; left: 50%; right: 50%;
    height: 1px;
    background: ${GOLD};
    transition: left 0.25s ease, right 0.25s ease;
  }
  .nav-lnk:hover::after { left: 8px; right: 8px; }

  @media (max-width: 1023px) {
    .desktop-nav  { display: none !important; }
    .mobile-tog   { display: flex !important; }
    .book-desktop { display: none !important; }
    .ticker-left  { display: none !important; }
  }
  @media (max-width: 600px) {
    .ticker-right { display: none !important; }
  }
`;

export default function Header() {
  const { data: session } = useSession();
  const { itemCount: cartCount } = useCart();
  const t = useTranslations();
  const [scrolled,     setScrolled]      = useState(false);
  const [mobileOpen,   setMobileOpen]    = useState(false);
  const [drawerClass,   setDrawerClass]   = useState("");
  const [dropdownOpen,  setDropdownOpen]  = useState(false);
  const [mobileExpSvc,  setMobileExpSvc]  = useState(false);
  const ddRef    = useRef<HTMLDivElement>(null);
  const styleRef = useRef(false);

  useEffect(() => {
    if (styleRef.current) return;
    styleRef.current = true;
    const el = document.createElement("style");
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ddRef.current && !ddRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const openDrawer = () => { setDrawerClass("drawer-open"); setMobileOpen(true); };
  const closeDrawer = () => {
    setDrawerClass("drawer-close");
    setTimeout(() => { setMobileOpen(false); setDrawerClass(""); }, 280);
  };

  const tickerItems = [
    t('ticker.book'), t('ticker.bridal'), t('ticker.academy'),
    t('ticker.hours'), t('ticker.tagline'),
    t('ticker.book'), t('ticker.bridal'), t('ticker.academy'),
    t('ticker.hours'), t('ticker.tagline'),
  ];

  return (
    <>
      {/* ── TICKER BAR (luxury dark) ── */}
      <div style={{
        background: OBSIDIAN,
        height: 34,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: `1px solid ${BORDER}`,
      }}>
        <div className="ticker-left" style={{
          flexShrink: 0, padding: "0 20px",
          display: "flex", gap: 20, alignItems: "center",
          borderRight: `1px solid ${BORDER}`,
          whiteSpace: "nowrap",
        }}>
          <a href="tel:+919171230292" style={{ color: "rgba(245,240,232,0.4)", fontSize: 11, textDecoration: "none", letterSpacing: "0.04em", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.18 6.18l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
            +91 91712 30292
          </a>
          <span style={{ color: "rgba(245,240,232,0.12)" }}>|</span>
          <span style={{ color: "rgba(245,240,232,0.35)", fontSize: 11, letterSpacing: "0.04em", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Anand Bazar, Indore
          </span>
        </div>

        <div style={{ flex: 1, overflow: "hidden", maskImage: "linear-gradient(90deg, transparent, black 5%, black 95%, transparent)" }}>
          <div className="ticker-track">
            {tickerItems.map((t, i) => (
              <span key={i} style={{
                padding: "0 32px",
                fontSize: 10.5,
                color: "rgba(245,240,232,0.35)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}>
                <span style={{ color: GOLD, marginRight: 8, fontSize: 9 }}>◆</span>{t}
              </span>
            ))}
          </div>
        </div>

        <div className="ticker-right" style={{
          flexShrink: 0, padding: "0 20px",
          display: "flex", gap: 14, alignItems: "center",
          borderLeft: `1px solid ${BORDER}`,
        }}>
          {[
            { label: "IG", href: "https://instagram.com/kanishkas_family_salon" },
            { label: "FB", href: "https://www.facebook.com/kanishkasfamilysalon" },
          ].map(s => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
              style={{
                color: "rgba(245,240,232,0.3)", fontSize: 10, fontWeight: 600,
                letterSpacing: "0.08em", textDecoration: "none",
                fontFamily: "'DM Sans', sans-serif",
                transition: "color 0.2s",
                cursor: "pointer",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(245,240,232,0.3)")}
            >{s.label}</a>
          ))}
        </div>
      </div>

      {/* ── MAIN NAVBAR (dark glass) ── */}
      <nav style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        height: scrolled ? 60 : 70,
        display: "flex",
        alignItems: "center",
        background: scrolled ? "rgba(13,13,13,0.95)" : "rgba(13,13,13,0.88)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: `1px solid ${scrolled ? BORDER : "transparent"}`,
        boxShadow: scrolled ? "0 1px 30px rgba(201,175,76,0.06)" : "none",
        transition: "height 0.3s ease, background 0.3s ease, border-color 0.3s ease",
      }}>
        <div style={{
          maxWidth: 1320, margin: "0 auto",
          padding: "0 clamp(16px, 4vw, 32px)",
          display: "flex", alignItems: "center",
          justifyContent: "space-between", width: "100%", position: "relative",
        }}>
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0, zIndex: 1 }}>
            <div style={{ height: scrolled ? 34 : 40, width: "auto", position: "relative", display: "block", transition: "height 0.3s" }}>
              <Image src="/logo.svg" alt="Kanishka's Family Salon" fill />
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="desktop-nav"
            style={{
              position: "absolute", left: "50%", transform: "translateX(-50%)",
              display: "flex", alignItems: "center", gap: 2,
            }}
          >
            {navLinks.map((link) => {
              const navLabel = link.i18nKey ? t(link.i18nKey) : link.label;
              return link.dropdown ? (
                <div key={link.href} ref={ddRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => setDropdownOpen(v => !v)}
                    onMouseEnter={() => setDropdownOpen(true)}
                    style={{
                      display: "flex", alignItems: "center", gap: 4,
                      padding: "8px 14px", background: "none", border: "none",
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 13.5, fontWeight: 400,
                      color: dropdownOpen ? GOLD : IVORY,
                      letterSpacing: "0.02em",
                      transition: "color 0.2s",
                    }}
                  >
                    {navLabel}
                    <ChevronDown size={11} style={{ transition: "transform 0.22s", transform: dropdownOpen ? "rotate(180deg)" : "rotate(0)", color: dropdownOpen ? GOLD : IVORY }} />
                  </button>

                  {dropdownOpen && (
                    <div className="dd-panel" onMouseLeave={() => setDropdownOpen(false)}
                      style={{
                        position: "absolute", top: "calc(100% + 14px)", left: "50%",
                        transform: "translateX(-50%)",
                        background: "rgba(13,13,13,0.98)",
                        backdropFilter: "blur(24px)",
                        border: `1px solid ${BORDER}`,
                        boxShadow: "0 12px 48px rgba(0,0,0,0.5)",
                        minWidth: 220, padding: "8px 0",
                        borderRadius: 2, overflow: "hidden",
                      }}
                    >
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1.5, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />
                      {link.dropdown!.map((sub: any, i: number) => (
                        <Link key={sub.href} href={sub.href}
                          onClick={() => setDropdownOpen(false)}
                          style={{
                            display: "flex", flexDirection: "column",
                            padding: "10px 22px", textDecoration: "none",
                            borderLeft: "2px solid transparent",
                            transition: "all 0.18s ease",
                          }}
                          onMouseEnter={e => {
                            const el = e.currentTarget as HTMLElement;
                            el.style.background = "rgba(201,168,76,0.06)";
                            el.style.borderLeftColor = GOLD;
                            el.style.paddingLeft = "26px";
                          }}
                          onMouseLeave={e => {
                            const el = e.currentTarget as HTMLElement;
                            el.style.background = "transparent";
                            el.style.borderLeftColor = "transparent";
                            el.style.paddingLeft = "22px";
                          }}
                        >
                          <span style={{ fontSize: 13.5, fontWeight: 400, color: IVORY, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.02em" }}>
                            {sub.i18nKey ? t(sub.i18nKey) : sub.label}
                          </span>
                        </Link>
                      ))}
                      <div style={{ margin: "8px 16px 4px", paddingTop: 8, borderTop: `1px solid ${BORDER}` }}>
                        <Link href="/services" onClick={() => setDropdownOpen(false)}
                          style={{
                            display: "block", textAlign: "center", padding: "7px",
                            background: "rgba(201,168,76,0.06)",
                            border: `1px solid rgba(201,168,76,0.2)`,
                            borderRadius: 2,
                            fontSize: 11, fontWeight: 600, letterSpacing: "0.1em",
                            textTransform: "uppercase", color: GOLD,
                            textDecoration: "none", fontFamily: "'DM Sans', sans-serif",
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(201,168,76,0.12)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "rgba(201,168,76,0.06)")}
                        >
                          {t('services_menu.viewAll')}
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link key={link.href} href={link.href} className="nav-lnk"
                  style={{
                    padding: "8px 14px",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13.5, fontWeight: 400,
                    color: IVORY, textDecoration: "none",
                    letterSpacing: "0.02em",
                    transition: "color 0.2s",
                    display: "inline-flex", alignItems: "center", gap: 5,
                    cursor: "pointer",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
                  onMouseLeave={e => (e.currentTarget.style.color = IVORY)}
                >
                  {navLabel}
                  {link.label === "Shop" && cartCount > 0 && (
                    <span style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      background: GOLD, color: "#0D0D0D",
                      fontSize: 8.5, fontWeight: 700,
                      width: 17, height: 17, borderRadius: "50%",
                    }}>
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right: Lang + Cart + Login + Book */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, zIndex: 1 }}>
            <div className="book-desktop"><LanguageSwitcher /></div>

            <Link href="/cart" aria-label={`View cart (${cartCount} items)`}
              style={{
                position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
                width: 38, height: 38, borderRadius: 2,
                border: cartCount > 0 ? `1.5px solid ${GOLD}` : `1.5px solid ${BORDER}`,
                background: cartCount > 0 ? "rgba(201,168,76,0.08)" : "transparent",
                color: cartCount > 0 ? GOLD : IVORY,
                textDecoration: "none", transition: "all 0.22s", flexShrink: 0, cursor: "pointer",
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "rgba(201,168,76,0.12)";
                el.style.borderColor = GOLD;
                el.style.color = GOLD;
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = cartCount > 0 ? "rgba(201,168,76,0.08)" : "transparent";
                el.style.borderColor = cartCount > 0 ? GOLD : BORDER;
                el.style.color = cartCount > 0 ? GOLD : IVORY;
              }}
            >
              <ShoppingBag size={15} />
              {cartCount > 0 && (
                <span style={{
                  position: "absolute", top: -6, right: -6,
                  background: GOLD, color: "#0D0D0D",
                  fontSize: 8.5, fontWeight: 700,
                  minWidth: 17, height: 17, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: `2px solid ${OBSIDIAN}`,
                  fontFamily: "'DM Sans', sans-serif", lineHeight: 1,
                }}>
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            <Link href={session?.user ? `/dashboard/${(session.user as any).role?.toLowerCase?.() ?? "client"}` : "/login"}
              className="book-desktop"
              style={{
                padding: "6px 14px",
                background: "transparent", color: GOLD,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 10, fontWeight: 600,
                letterSpacing: "0.12em", textTransform: "uppercase",
                textDecoration: "none", borderRadius: 2,
                border: `1px solid rgba(201,168,76,0.4)`,
                transition: "background 0.22s, border-color 0.22s",
                whiteSpace: "nowrap", cursor: "pointer",
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "rgba(201,168,76,0.08)";
                el.style.borderColor = GOLD;
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "transparent";
                el.style.borderColor = "rgba(201,168,76,0.4)";
              }}
            >
              {session?.user ? t('nav.dashboard') : t('nav.login')}
            </Link>

            <Link href="/book"
              style={{
                padding: "8px 20px",
                background: GOLD, color: "#0D0D0D",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 10, fontWeight: 700,
                letterSpacing: "0.14em", textTransform: "uppercase",
                textDecoration: "none", borderRadius: 2,
                border: `1px solid ${GOLD}`,
                transition: "background 0.25s, color 0.25s",
                whiteSpace: "nowrap", cursor: "pointer",
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = GOLD_LT;
                el.style.borderColor = GOLD_LT;
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = GOLD;
                el.style.borderColor = GOLD;
              }}
            >
              {t('nav.bookNow')}
            </Link>

            <button className="mobile-tog" onClick={openDrawer}
              style={{
                display: "none", alignItems: "center", justifyContent: "center",
                width: 38, height: 38,
                background: "transparent",
                border: `1px solid ${BORDER}`,
                borderRadius: 2,
                cursor: "pointer", color: IVORY,
              }}
            >
              <Menu size={16} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── MOBILE DRAWER ── */}
      {mobileOpen && (
        <>
          <div onClick={closeDrawer}
            style={{
              position: "fixed", inset: 0, zIndex: 60,
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(5px)",
            }}
          />
          <div className={drawerClass}
            style={{
              position: "fixed", top: 0, right: 0, bottom: 0,
              width: 300, zIndex: 70,
              background: "linear-gradient(160deg, #141414 0%, #0D0D0D 100%)",
              display: "flex", flexDirection: "column", overflowY: "auto",
              borderLeft: `1px solid ${BORDER}`,
            }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1.5, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Scissors size={14} color={GOLD} />
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, color: IVORY, letterSpacing: "0.01em" }}>
                  Kanishka&apos;s
                </span>
              </div>
              <button onClick={closeDrawer}
                style={{ background: "none", border: `1px solid ${BORDER}`, borderRadius: 2, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(245,240,232,0.4)" }}>
                <X size={13} />
              </button>
            </div>

            <div style={{ height: 1, background: BORDER, margin: "0 20px 8px" }} />

            <nav style={{ flex: 1, padding: "8px 0" }}>
              {navLinks.map((link) => {
                const mobileLabel = link.i18nKey ? t(link.i18nKey) : link.label;
                return (
                  <div key={link.href}>
                    {link.dropdown ? (
                      <>
                        <button onClick={() => setMobileExpSvc(v => !v)}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            width: "100%", padding: "12px 20px",
                            background: "none", border: "none",
                            borderBottom: `1px solid ${BORDER}`,
                            cursor: "pointer",
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: 14, fontWeight: 400,
                            color: mobileExpSvc ? GOLD : "rgba(245,240,232,0.6)",
                            letterSpacing: "0.02em", transition: "color 0.2s",
                          }}
                        >
                          {mobileLabel}
                          <ChevronDown size={13} style={{ transition: "transform 0.22s", transform: mobileExpSvc ? "rotate(180deg)" : "rotate(0)", color: GOLD }} />
                        </button>
                        {mobileExpSvc && (
                          <div style={{ background: "rgba(201,168,76,0.03)", borderLeft: `2px solid ${GOLD}` }}>
                            {link.dropdown.map((sub: any) => (
                              <Link key={sub.href} href={sub.href} onClick={closeDrawer}
                                style={{
                                  display: "block", padding: "10px 20px 10px 26px",
                                  fontFamily: "'DM Sans', sans-serif",
                                  fontSize: 13, color: "rgba(245,240,232,0.4)",
                                  textDecoration: "none",
                                  borderBottom: `1px solid rgba(255,255,255,0.03)`,
                                  letterSpacing: "0.02em", transition: "color 0.2s", cursor: "pointer",
                                }}
                                onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
                                onMouseLeave={e => (e.currentTarget.style.color = "rgba(245,240,232,0.4)")}
                              >
                                {sub.i18nKey ? t(sub.i18nKey) : sub.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <Link href={link.href} onClick={closeDrawer}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "12px 20px",
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 14, color: "rgba(245,240,232,0.6)",
                          textDecoration: "none",
                          borderBottom: `1px solid ${BORDER}`,
                          letterSpacing: "0.02em", transition: "color 0.2s", cursor: "pointer",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = IVORY)}
                        onMouseLeave={e => (e.currentTarget.style.color = "rgba(245,240,232,0.6)")}
                      >
                        {mobileLabel}
                        {link.label === "Shop" && cartCount > 0 && (
                          <span style={{ background: GOLD, color: "#0D0D0D", fontSize: 9, fontWeight: 700, borderRadius: 99, padding: "1px 6px" }}>
                            {cartCount}
                          </span>
                        )}
                      </Link>
                    )}
                  </div>
                );
              })}
            </nav>

            <div style={{ padding: "16px 20px" }}>
              <Link href="/book" onClick={closeDrawer}
                style={{
                  display: "block", textAlign: "center", padding: "14px",
                  background: GOLD, color: "#0D0D0D",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11, fontWeight: 700,
                  letterSpacing: "0.14em", textTransform: "uppercase",
                  textDecoration: "none", borderRadius: 2,
                }}
              >
                {t('nav.bookAppointment')}
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}