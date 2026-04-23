"use client";
 
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Menu, X, ChevronDown, Scissors, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
 
/* ─── NAV DATA ─── */
const navLinks = [
  { label: "Home",    href: "/",        i18nKey: "nav.home" },
  { label: "About",   href: "/about",   i18nKey: "nav.about" },
  {
    label: "Services",
    href: "/services",
    i18nKey: "nav.services",
    dropdown: [
      { label: "Hair Styling",   href: "/services?cat=HAIR_STYLING", desc: "Cuts, colour & treatments", i18nKey: "services_menu.hairStyling", i18nDesc: "services_menu.hairStylingDesc" },
      { label: "Skin Care",      href: "/services?cat=SKIN_CARE",    desc: "Facials & glow rituals",    i18nKey: "services_menu.skinCare",    i18nDesc: "services_menu.skinCareDesc" },
      { label: "Bridal Makeup",  href: "/services?cat=BRIDAL",       desc: "Your perfect day",          i18nKey: "services_menu.bridalMakeup", i18nDesc: "services_menu.bridalMakeupDesc" },
      { label: "Nail Art",       href: "/services?cat=NAIL_CARE",    desc: "Nail extensions & art",     i18nKey: "services_menu.nailArt",     i18nDesc: "services_menu.nailArtDesc" },
      { label: "Academy",        href: "/services?cat=ACADEMY",      desc: "Professional courses",      i18nKey: "services_menu.academy",     i18nDesc: "services_menu.academyDesc" },
    ],
  },
  { label: "Gallery", href: "/gallery",  i18nKey: "nav.gallery" },
  { label: "Blog",    href: "/blog",     i18nKey: "nav.blog" },
  { label: "Contact", href: "/contact",  i18nKey: "nav.contact" },
  { label: "Shop",    href: "/products", i18nKey: "nav.shop" },
];
 
const GOLD    = "#C9A84C";
const GOLD_LT = "#E2C97E";
const INK     = "#1A1510";
 
/* ─── INJECTED CSS ─── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
 
  :root {
    --gold:      #C9A84C;
    --gold-lt:   #E2C97E;
    --ink:       #1A1510;
    --ink-2:     rgba(26,21,16,0.6);
    --ink-3:     rgba(26,21,16,0.35);
    --ff-display: 'Cormorant Garamond', Georgia, serif;
    --ff-body:    'DM Sans', system-ui, sans-serif;
  }
 
  /* Ticker marquee */
  @keyframes ticker {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  .ticker-track {
    display: flex;
    width: max-content;
    animation: ticker 28s linear infinite;
  }
  .ticker-track:hover { animation-play-state: paused; }
 
  /* Dropdown fade+slide */
  @keyframes dd-in {
    from { opacity: 0; transform: translateY(-6px) translateX(-50%); }
    to   { opacity: 1; transform: translateY(0)    translateX(-50%); }
  }
  .dd-panel { animation: dd-in 0.22s cubic-bezier(0.22,1,0.36,1) both; }
 
  /* Mobile drawer */
  @keyframes drawer-in  { from { transform: translateX(100%); } to { transform: translateX(0); } }
  @keyframes drawer-out { from { transform: translateX(0); }    to { transform: translateX(100%); } }
  .drawer-open  { animation: drawer-in  0.32s cubic-bezier(0.22,1,0.36,1) both; }
  .drawer-close { animation: drawer-out 0.28s cubic-bezier(0.55,0,1,0.45) both; }
 
  /* Nav underline */
  .nav-lnk { position: relative; }
  .nav-lnk::after {
    content: '';
    position: absolute; bottom: -2px; left: 50%; right: 50%;
    height: 1px;
    background: var(--gold);
    transition: left 0.25s ease, right 0.25s ease;
  }
  .nav-lnk:hover::after { left: 8px; right: 8px; }
 
  /* Book Now pulse ring */
  @keyframes ring-pulse {
    0%   { box-shadow: 0 0 0 0 rgba(201,168,76,0.45); }
    70%  { box-shadow: 0 0 0 6px rgba(201,168,76,0); }
    100% { box-shadow: 0 0 0 0 rgba(201,168,76,0); }
  }
  .book-btn:hover { animation: ring-pulse 1s ease-out infinite; }
 
  /* Responsive */
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
 
/* ─── COMPONENT ─── */
export default function Header() {
  const { data: session } = useSession();
  const { itemCount: cartCount } = useCart();
  const t = useTranslations();
  const [scrolled,      setScrolled]      = useState(false);
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [drawerClass,   setDrawerClass]   = useState("");
  const [dropdownOpen,  setDropdownOpen]  = useState(false);
  const [mobileExpSvc,  setMobileExpSvc]  = useState(false);
  const ddRef   = useRef<HTMLDivElement>(null);
  const styleRef = useRef(false);
 
  /* inject CSS */
  useEffect(() => {
    if (styleRef.current) return;
    styleRef.current = true;
    const el = document.createElement("style");
    el.textContent = CSS;
    document.head.appendChild(el);
  }, []);
 
  /* scroll */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
 

  /* body lock */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);
 
  /* close dropdown on outside click */
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
 
  /* ── Ticker content ── */
  const tickerItems = [
    t('ticker.book'),
    t('ticker.bridal'),
    t('ticker.academy'),
    t('ticker.hours'),
    t('ticker.tagline'),
    t('ticker.book'),
    t('ticker.bridal'),
    t('ticker.academy'),
    t('ticker.hours'),
    t('ticker.tagline'),
  ];
 
  return (
    <>
      {/* ══════════════════════════════════
          TICKER BAR
      ══════════════════════════════════ */}
      <div style={{
        background: INK,
        height: 34,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "relative",
      }}>
        {/* Left contact — desktop only */}
        <div className="ticker-left" style={{
          flexShrink: 0,
          padding: "0 20px",
          display: "flex",
          gap: 20,
          alignItems: "center",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          whiteSpace: "nowrap",
        }}>
          <a href="tel:+919171230292" style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, textDecoration: "none", letterSpacing: "0.04em", fontFamily: "var(--ff-body)" }}>
            <span style={{ color: GOLD, marginRight: 5 }}>☎</span>+91 91712 30292
          </a>
          <span style={{ color: "rgba(255,255,255,0.12)" }}>|</span>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, letterSpacing: "0.04em", fontFamily: "var(--ff-body)" }}>
            <span style={{ color: GOLD, marginRight: 5 }}>⊙</span>Anand Bazar, Indore
          </span>
        </div>
 
        {/* Marquee */}
        <div style={{ flex: 1, overflow: "hidden", maskImage: "linear-gradient(90deg, transparent, black 5%, black 95%, transparent)" }}>
          <div className="ticker-track">
            {tickerItems.map((t, i) => (
              <span key={i} style={{
                padding: "0 32px",
                fontSize: 10.5,
                color: "rgba(255,255,255,0.38)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontFamily: "var(--ff-body)",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}>
                <span style={{ color: GOLD, marginRight: 8, fontSize: 9 }}>◆</span>{t}
              </span>
            ))}
          </div>
        </div>
 
        {/* Right socials — hidden on mobile */}
        <div className="ticker-right" style={{
          flexShrink: 0,
          padding: "0 20px",
          display: "flex",
          gap: 14,
          alignItems: "center",
          borderLeft: "1px solid rgba(255,255,255,0.07)",
        }}>
          {[
            { label: "IG", href: "https://instagram.com/kanishkas_family_salon" },
            { label: "FB", href: "https://www.facebook.com/kanishkasfamilysalon" },
          ].map(s => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textDecoration: "none",
              fontFamily: "var(--ff-body)",
              transition: "color 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
            >{s.label}</a>
          ))}
        </div>
      </div>
 
      {/* ══════════════════════════════════
          MAIN NAVBAR
      ══════════════════════════════════ */}
      <nav style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        height: scrolled ? 62 : 72,
        display: "flex",
        alignItems: "center",
        background: scrolled
          ? "rgba(253,250,245,0.92)"
          : "rgba(253,250,245,0.98)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: scrolled
          ? `1px solid rgba(201,168,76,0.2)`
          : "1px solid rgba(0,0,0,0.05)",
        boxShadow: scrolled
          ? "0 2px 32px rgba(0,0,0,0.07), 0 1px 0 rgba(255,255,255,0.8) inset"
          : "none",
        transition: "height 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease",
      }}>
        <div style={{
          maxWidth: 1320,
          margin: "0 auto",
          padding: "0 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          position: "relative",
        }}>
 
          {/* ── Logo ── */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0, zIndex: 1 }}>
            <img
              src="/logo.svg"
              alt="Kanishka's Family Salon"
              style={{ height: scrolled ? 38 : 44, width: "auto", display: "block", transition: "height 0.3s" }}
            />
          </Link>
 
          {/* ── Desktop nav — centred absolutely ── */}
          <div
            className="desktop-nav"
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            {navLinks.map((link) => {
              const navLabel = link.i18nKey ? t(link.i18nKey) : link.label;
              return link.dropdown ? (
                /* Services dropdown */
                <div key={link.href} ref={ddRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => setDropdownOpen(v => !v)}
                    onMouseEnter={() => setDropdownOpen(true)}
                    style={{
                      display: "flex", alignItems: "center", gap: 4,
                      padding: "8px 14px",
                      background: "none", border: "none", cursor: "pointer",
                      fontFamily: "var(--ff-body)",
                      fontSize: 13.5, fontWeight: 500,
                      color: dropdownOpen ? GOLD : INK,
                      letterSpacing: "0.025em",
                      transition: "color 0.2s",
                    }}
                  >
                    {navLabel}
                    <ChevronDown size={11} style={{ transition: "transform 0.22s", transform: dropdownOpen ? "rotate(180deg)" : "rotate(0)" }} />
                  </button>
 
                  {dropdownOpen && (
                    <div
                      className="dd-panel"
                      onMouseLeave={() => setDropdownOpen(false)}
                      style={{
                        position: "absolute",
                        top: "calc(100% + 14px)",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "rgba(253,250,245,0.98)",
                        backdropFilter: "blur(24px)",
                        border: "1px solid rgba(201,168,76,0.14)",
                        boxShadow: "0 12px 48px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.04)",
                        minWidth: 240,
                        padding: "10px 0",
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      {/* top gold accent line */}
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />
 
                      {link.dropdown!.map((sub, i) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => setDropdownOpen(false)}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            padding: "10px 22px",
                            textDecoration: "none",
                            borderLeft: "2px solid transparent",
                            transition: "all 0.18s ease",
                          }}
                          onMouseEnter={e => {
                            const el = e.currentTarget;
                            el.style.background = "rgba(201,168,76,0.05)";
                            el.style.borderLeftColor = GOLD;
                            el.style.paddingLeft = "26px";
                          }}
                          onMouseLeave={e => {
                            const el = e.currentTarget;
                            el.style.background = "transparent";
                            el.style.borderLeftColor = "transparent";
                            el.style.paddingLeft = "22px";
                          }}
                        >
                          <span style={{ fontSize: 13.5, fontWeight: 500, color: INK, fontFamily: "var(--ff-body)", letterSpacing: "0.02em" }}>
                            {(sub as any).i18nKey ? t((sub as any).i18nKey) : sub.label}
                          </span>
                          <span style={{ fontSize: 11, color: "rgba(26,21,16,0.4)", fontFamily: "var(--ff-body)", marginTop: 1 }}>
                            {(sub as any).i18nDesc ? t((sub as any).i18nDesc) : (sub as any).desc}
                          </span>
                        </Link>
                      ))}
 
                      {/* View all link */}
                      <div style={{ margin: "8px 16px 4px", paddingTop: 8, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                        <Link href="/services" onClick={() => setDropdownOpen(false)}
                          style={{
                            display: "block", textAlign: "center",
                            padding: "7px",
                            background: "rgba(201,168,76,0.08)",
                            border: "1px solid rgba(201,168,76,0.2)",
                            borderRadius: 2,
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: GOLD,
                            textDecoration: "none",
                            fontFamily: "var(--ff-body)",
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(201,168,76,0.15)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "rgba(201,168,76,0.08)")}
                        >
                          {t('services_menu.viewAll')}
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="nav-lnk"
                  style={{
                    padding: "8px 14px",
                    fontFamily: "var(--ff-body)",
                    fontSize: 13.5, fontWeight: 500,
                    color: INK, textDecoration: "none",
                    letterSpacing: "0.025em",
                    transition: "color 0.2s",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
                  onMouseLeave={e => (e.currentTarget.style.color = INK)}
                >
                  {navLabel}
                  {link.label === "Shop" && cartCount > 0 && (
                    <span style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      background: GOLD, color: "#fff",
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
 
          {/* ── Right: Lang + Cart + Login + Book Now + mobile toggle ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, zIndex: 1 }}>

            {/* Language switcher */}
            <div className="book-desktop">
              <LanguageSwitcher />
            </div>

            {/* Cart icon — always visible, links directly to /cart */}
            <Link
              href="/cart"
              aria-label={`View cart (${cartCount} items)`}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 40, height: 40,
                borderRadius: 3,
                border: cartCount > 0 ? `1.5px solid ${GOLD}` : `1.5px solid rgba(201,168,76,0.3)`,
                background: cartCount > 0 ? `rgba(201,168,76,0.08)` : "transparent",
                color: cartCount > 0 ? GOLD : INK,
                textDecoration: "none",
                transition: "all 0.22s",
                flexShrink: 0,
              }}
              onMouseEnter={e => {
                const el = e.currentTarget;
                el.style.background = `rgba(201,168,76,0.12)`;
                el.style.borderColor = GOLD;
                el.style.color = GOLD;
              }}
              onMouseLeave={e => {
                const el = e.currentTarget;
                el.style.background = cartCount > 0 ? `rgba(201,168,76,0.08)` : "transparent";
                el.style.borderColor = cartCount > 0 ? GOLD : `rgba(201,168,76,0.3)`;
                el.style.color = cartCount > 0 ? GOLD : INK;
              }}
            >
              <ShoppingBag size={16} />
              {cartCount > 0 && (
                <span style={{
                  position: "absolute",
                  top: -6, right: -6,
                  background: GOLD,
                  color: "#fff",
                  fontSize: 8.5, fontWeight: 700,
                  minWidth: 17, height: 17,
                  borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "2px solid rgba(253,250,245,0.95)",
                  padding: "0 2px",
                  fontFamily: "var(--ff-body)",
                  lineHeight: 1,
                }}>
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            {/* Login / Dashboard — desktop only */}
            <Link
              href={
                session?.user
                  ? `/dashboard/${(session.user as any).role?.toLowerCase?.() ?? "client"}`
                  : "/login"
              }
              className="book-desktop"
              style={{
                padding: "7px 16px",
                background: "transparent",
                color: GOLD,
                fontFamily: "var(--ff-body)",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                textDecoration: "none",
                borderRadius: 2,
                border: `1.5px solid rgba(201,168,76,0.5)`,
                transition: "background 0.22s, color 0.22s, border-color 0.22s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.background = "rgba(201,168,76,0.08)";
                (e.currentTarget as HTMLAnchorElement).style.borderColor = GOLD;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(201,168,76,0.5)";
              }}
            >
              {session?.user ? t('nav.dashboard') : t('nav.login')}
            </Link>
            <Link
              href="/book"
              className="book-btn book-desktop"
              style={{
                padding: "9px 24px",
                background: INK,
                color: GOLD,
                fontFamily: "var(--ff-body)",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                textDecoration: "none",
                borderRadius: 2,
                border: `1.5px solid ${GOLD}33`,
                transition: "background 0.25s, color 0.25s, border-color 0.25s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={e => {
                const el = e.currentTarget;
                el.style.background = GOLD;
                el.style.color = "#fff";
                el.style.borderColor = GOLD;
              }}
              onMouseLeave={e => {
                const el = e.currentTarget;
                el.style.background = INK;
                el.style.color = GOLD;
                el.style.borderColor = `${GOLD}33`;
              }}
            >
              {t('nav.bookNow')}
            </Link>
 
            <button
              className="mobile-tog"
              onClick={openDrawer}
              style={{
                display: "none",
                alignItems: "center", justifyContent: "center",
                width: 40, height: 40,
                background: "transparent",
                border: `1.5px solid rgba(201,168,76,0.3)`,
                borderRadius: 3,
                cursor: "pointer",
                color: INK,
              }}
            >
              <Menu size={17} />
            </button>
          </div>
        </div>
      </nav>
 
      {/* ══════════════════════════════════
          MOBILE DRAWER
      ══════════════════════════════════ */}
      {mobileOpen && (
        <>
          {/* overlay */}
          <div
            onClick={closeDrawer}
            style={{
              position: "fixed", inset: 0, zIndex: 60,
              background: "rgba(10,8,5,0.65)",
              backdropFilter: "blur(5px)",
            }}
          />
 
          {/* panel */}
          <div
            className={drawerClass}
            style={{
              position: "fixed", top: 0, right: 0, bottom: 0,
              width: 300, zIndex: 70,
              background: "linear-gradient(160deg, #1C1812 0%, #110F0C 100%)",
              display: "flex", flexDirection: "column",
              overflowY: "auto",
            }}
          >
            {/* gold top accent */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />
 
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 24px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Scissors size={14} color={GOLD} />
                <span style={{ fontFamily: "var(--ff-display)", fontSize: 17, color: "rgba(255,255,255,0.85)", letterSpacing: "0.01em" }}>
                  Kanishka's
                </span>
              </div>
              <button onClick={closeDrawer} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 3, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.5)" }}>
                <X size={14} />
              </button>
            </div>
 
            {/* thin gold separator */}
            <div style={{ height: 1, background: "rgba(201,168,76,0.15)", margin: "0 24px 8px" }} />
 
            {/* Nav items */}
            <nav style={{ flex: 1, padding: "8px 0" }}>
              {navLinks.map((link) => {
                const mobileLabel = link.i18nKey ? t(link.i18nKey) : link.label;
                return (
                <div key={link.href}>
                  {link.dropdown ? (
                    <>
                      <button
                        onClick={() => setMobileExpSvc(v => !v)}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          width: "100%", padding: "13px 24px",
                          background: "none", border: "none",
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                          cursor: "pointer",
                          fontFamily: "var(--ff-body)",
                          fontSize: 14, fontWeight: 400,
                          color: mobileExpSvc ? GOLD : "rgba(255,255,255,0.65)",
                          letterSpacing: "0.02em",
                          transition: "color 0.2s",
                        }}
                      >
                        {mobileLabel}
                        <ChevronDown size={13} style={{ transition: "transform 0.22s", transform: mobileExpSvc ? "rotate(180deg)" : "rotate(0)", color: GOLD }} />
                      </button>
                      {mobileExpSvc && (
                        <div style={{ background: "rgba(201,168,76,0.03)", borderLeft: `2px solid ${GOLD}` }}>
                          {link.dropdown.map(sub => (
                            <Link key={sub.href} href={sub.href} onClick={closeDrawer}
                              style={{
                                display: "block", padding: "11px 24px 11px 28px",
                                fontFamily: "var(--ff-body)",
                                fontSize: 13, color: "rgba(255,255,255,0.45)",
                                textDecoration: "none",
                                borderBottom: "1px solid rgba(255,255,255,0.03)",
                                letterSpacing: "0.02em",
                                transition: "color 0.2s",
                              }}
                              onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
                              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
                            >
                              {(sub as any).i18nKey ? t((sub as any).i18nKey) : sub.label}
                              <span style={{ display: "block", fontSize: 10.5, color: "rgba(255,255,255,0.22)", marginTop: 1 }}>{(sub as any).i18nDesc ? t((sub as any).i18nDesc) : (sub as any).desc}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link href={link.href} onClick={closeDrawer}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "13px 24px",
                        fontFamily: "var(--ff-body)",
                        fontSize: 14, color: "rgba(255,255,255,0.65)",
                        textDecoration: "none",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        letterSpacing: "0.02em",
                        transition: "color 0.2s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.95)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.65)")}
                    >
                      {mobileLabel}
                      {link.label === "Shop" && cartCount > 0 && (
                        <span style={{ background: GOLD, color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: 99, padding: "1px 6px" }}>
                          {cartCount}
                        </span>
                      )}
                    </Link>
                  )}
                </div>
                );
              })}
            </nav>
 
            {/* CTA */}
            <div style={{ padding: "20px 24px" }}>
              {/* Cart button — always visible in mobile drawer */}
              <Link
                href="/cart"
                onClick={closeDrawer}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "13px 18px",
                  background: cartCount > 0 ? `rgba(201,168,76,0.12)` : "rgba(255,255,255,0.04)",
                  color: cartCount > 0 ? GOLD : "rgba(255,255,255,0.5)",
                  fontFamily: "var(--ff-body)",
                  fontSize: 13, fontWeight: 500,
                  letterSpacing: "0.03em",
                  textDecoration: "none",
                  borderRadius: 3,
                  border: cartCount > 0 ? `1.5px solid ${GOLD}55` : "1.5px solid rgba(255,255,255,0.07)",
                  marginBottom: 10,
                  transition: "all 0.2s",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <ShoppingBag size={15} />
                  {t('nav.viewCart')}
                </span>
                {cartCount > 0 ? (
                  <span style={{
                    background: GOLD, color: "#fff",
                    fontSize: 9.5, fontWeight: 700,
                    borderRadius: 99, padding: "2px 8px",
                    fontFamily: "var(--ff-body)",
                  }}>
                    {cartCount} {cartCount === 1 ? t('common.item') : t('common.items')}
                  </span>
                ) : (
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.05em" }}>{t('nav.empty')}</span>
                )}
              </Link>
              <Link
                href={
                  session?.user
                    ? `/dashboard/${(session.user as any).role?.toLowerCase?.() ?? "client"}`
                    : "/login"
                }
                onClick={closeDrawer}
                style={{
                  display: "block", textAlign: "center",
                  padding: "12px",
                  background: "transparent",
                  color: GOLD,
                  fontFamily: "var(--ff-body)",
                  fontSize: 11, fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  borderRadius: 3,
                  border: `1.5px solid rgba(201,168,76,0.35)`,
                  marginBottom: 10,
                }}
              >
                {session?.user ? t('nav.myDashboard') : t('nav.login')}
              </Link>
              <Link href="/book" onClick={closeDrawer}
                style={{
                  display: "block", textAlign: "center",
                  padding: "14px",
                  background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LT})`,
                  color: "#fff",
                  fontFamily: "var(--ff-body)",
                  fontSize: 11, fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  borderRadius: 3,
                  boxShadow: `0 6px 24px ${GOLD}44`,
                }}
              >
                {t('nav.bookAppointment')}
              </Link>
 
              {/* contact info */}
              <div style={{ marginTop: 20, padding: "14px", background: "rgba(255,255,255,0.03)", borderRadius: 3, border: "1px solid rgba(255,255,255,0.06)" }}>
                {[
                  { icon: "☎", text: "+91 91712 30292", href: "tel:+919171230292" },
                  { icon: "⊙", text: "Anand Bazar, Indore" },
                  { icon: "◷", text: "Mon–Sun · 10 AM – 9 PM" },
                ].map(({ icon, text, href }) => (
                  <div key={text} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                    <span style={{ color: GOLD, fontSize: 11, width: 14, textAlign: "center" }}>{icon}</span>
                    {href
                      ? <a href={href} style={{ color: "rgba(255,255,255,0.35)", fontSize: 11.5, textDecoration: "none", fontFamily: "var(--ff-body)" }}>{text}</a>
                      : <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11.5, fontFamily: "var(--ff-body)" }}>{text}</span>
                    }
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}