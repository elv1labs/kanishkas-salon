"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  Calendar, ShoppingBag, Heart, User, LayoutDashboard, Users,
  FileText, Image as ImageIcon, Package, BarChart3, Settings,
  ClipboardList, Search, LogOut, Menu, X, Bell, Sparkles,
  ChevronRight, Plus, TrendingUp, GraduationCap, Star, Gift,
  Scissors, UserCheck, Shield,
} from "lucide-react";

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
type NavItem   = { label: string; href: string; icon: React.ReactNode };
type NavGroup  = { group: string; items: NavItem[] };

/* ─────────────────────────────────────────────
   NAV STRUCTURE
───────────────────────────────────────────── */
const navByRole: Record<string, NavGroup[]> = {
  CLIENT: [{
    group: "MY ACCOUNT",
    items: [
      { label: "Dashboard",       href: "/dashboard/client",               icon: <LayoutDashboard size={15} /> },
      { label: "Appointments",    href: "/dashboard/client/appointments",  icon: <Calendar        size={15} /> },
      { label: "Orders",          href: "/dashboard/client/orders",        icon: <ShoppingBag     size={15} /> },
      { label: "Gift Vouchers",   href: "/dashboard/client/vouchers",      icon: <Gift            size={15} /> },
      { label: "Enrollments",     href: "/dashboard/client/enrollments",   icon: <GraduationCap   size={15} /> },
      { label: "Loyalty & Rewards", href: "/dashboard/client/loyalty",    icon: <Heart           size={15} /> },
      { label: "Refer & Earn",    href: "/dashboard/client/referral",      icon: <Gift            size={15} /> },
      { label: "My Profile",      href: "/dashboard/client/profile",       icon: <User            size={15} /> },
    ],
  }],
  RECEPTIONIST: [
    {
      group: "DAILY OPS",
      items: [
        { label: "Dashboard",    href: "/dashboard/receptionist",              icon: <LayoutDashboard size={15} /> },
        { label: "Appointments", href: "/dashboard/receptionist/appointments", icon: <Calendar        size={15} /> },
        { label: "Clients",      href: "/dashboard/receptionist/clients",      icon: <Search          size={15} /> },
      ],
    },
    {
      group: "CONTENT",
      items: [
        { label: "Blog Drafts", href: "/dashboard/receptionist/blog",    icon: <FileText  size={15} /> },
        { label: "Gallery",     href: "/dashboard/receptionist/gallery", icon: <ImageIcon size={15} /> },
      ],
    },
  ],
  OWNER: [
    {
      group: "OVERVIEW",
      items: [
        { label: "Dashboard", href: "/dashboard/owner",         icon: <LayoutDashboard size={15} /> },
        { label: "Revenue",   href: "/dashboard/owner/revenue", icon: <BarChart3       size={15} /> },
      ],
    },
    {
      group: "MANAGEMENT",
      items: [
        { label: "Appointments", href: "/dashboard/owner/appointments", icon: <Calendar    size={15} /> },
        { label: "Orders",       href: "/dashboard/owner/orders",       icon: <ClipboardList size={15} /> },
        { label: "Products",     href: "/dashboard/owner/products",     icon: <Package     size={15} /> },
      ],
    },
    {
      group: "CONTENT",
      items: [
        { label: "Content Manager", href: "/dashboard/owner/content", icon: <FileText size={15} /> },
      ],
    },
  ],
  ADMIN: [
    {
      group: "OVERVIEW",
      items: [
        { label: "Dashboard", href: "/admin",           icon: <LayoutDashboard size={15} /> },
        { label: "Analytics", href: "/admin/analytics", icon: <BarChart3       size={15} /> },
      ],
    },
    {
      group: "MANAGEMENT",
      items: [
        { label: "Appointments",  href: "/admin/appointments", icon: <Calendar      size={15} /> },
        { label: "Orders",        href: "/admin/orders",       icon: <ClipboardList size={15} /> },
        { label: "Services",      href: "/admin/services",     icon: <Scissors      size={15} /> },
        { label: "Products",      href: "/admin/products",     icon: <Package       size={15} /> },
        { label: "Academy",       href: "/admin/academy",      icon: <GraduationCap size={15} /> },
        { label: "Staff",         href: "/admin/staff",        icon: <UserCheck     size={15} /> },
        { label: "Media",         href: "/admin/media",        icon: <ImageIcon     size={15} /> },
        { label: "Reviews",       href: "/dashboard/admin/reviews", icon: <Star     size={15} /> },
      ],
    },
    {
      group: "USERS & SYSTEM",
      items: [
        { label: "Users & Roles",    href: "/admin/users",             icon: <Users         size={15} /> },
        { label: "Permissions",      href: "/admin/permissions",       icon: <Shield        size={15} /> },
        { label: "Loyalty Approvals",href: "/admin/loyalty-approvals", icon: <Gift          size={15} /> },
        { label: "Content",          href: "/admin/content",           icon: <FileText      size={15} /> },
        { label: "Settings",         href: "/admin/settings",          icon: <Settings      size={15} /> },
        { label: "Audit Logs",       href: "/admin/logs",              icon: <ClipboardList size={15} /> },
      ],
    },
  ],
};

const quickActions: Record<string, { label: string; href: string; icon: React.ReactNode }> = {
  CLIENT:       { label: "Book Appointment", href: "/book",                        icon: <Plus      size={13} /> },
  RECEPTIONIST: { label: "New Appointment",  href: "/book",                        icon: <Plus      size={13} /> },
  OWNER:        { label: "View Revenue",     href: "/dashboard/owner/revenue",     icon: <TrendingUp size={13} /> },
  ADMIN:        { label: "Add User",         href: "/dashboard/admin/users",       icon: <Plus      size={13} /> },
};

/* role palette: accent color + glyph background */
const rolePalette: Record<string, { text: string; bg: string; dot: string }> = {
  CLIENT:       { text: "#C9956A", bg: "rgba(201,149,106,0.12)", dot: "#C9956A" },
  RECEPTIONIST: { text: "#7BA7BC", bg: "rgba(123,167,188,0.12)", dot: "#7BA7BC" },
  OWNER:        { text: "#C9A84C", bg: "rgba(201,168,76,0.12)",  dot: "#C9A84C" },
  ADMIN:        { text: "#A78BFA", bg: "rgba(167,139,250,0.12)", dot: "#A78BFA" },
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5)  return "Late night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/* ─────────────────────────────────────────────
   GLOBAL STYLES  (injected once via a <style> tag)
───────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

  :root {
    --gold:       #C9A84C;
    --gold-light: #E2C97E;
    --gold-dim:   rgba(201,168,76,0.18);
    --surface-0:  #0D0D0D;
    --surface-1:  #141414;
    --surface-2:  #1C1C1C;
    --surface-3:  rgba(255,255,255,0.04);
    --border:     rgba(255,255,255,0.06);
    --text-hi:    rgba(255,255,255,0.92);
    --text-mid:   rgba(255,255,255,0.45);
    --text-lo:    rgba(255,255,255,0.18);
    --page-bg:    #F5F1EC;
    --page-border: rgba(0,0,0,0.07);
    --font-display: 'Cormorant Garamond', Georgia, serif;
    --font-body:    'DM Sans', system-ui, sans-serif;
  }

  /* ── Sidebar scrollbar ── */
  .sidebar-scroll::-webkit-scrollbar        { width: 3px; }
  .sidebar-scroll::-webkit-scrollbar-track  { background: transparent; }
  .sidebar-scroll::-webkit-scrollbar-thumb  { background: rgba(255,255,255,0.08); border-radius: 99px; }

  /* ── Nav link hover shine ── */
  .nav-link { position: relative; overflow: hidden; }
  .nav-link::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent);
    transform: translateX(-100%);
    transition: transform 0.5s ease;
  }
  .nav-link:hover::before { transform: translateX(100%); }

  /* ── Active indicator pulse ── */
  @keyframes indicator-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.5; }
  }

  /* ── Sidebar entrance ── */
  @keyframes sidebar-in {
    from { opacity: 0; transform: translateX(-8px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .sidebar-animate { animation: sidebar-in 0.35s cubic-bezier(0.22,1,0.36,1) both; }

  /* ── Notification badge pulse ── */
  @keyframes notif-pop {
    0%   { transform: scale(0.6); opacity: 0; }
    80%  { transform: scale(1.15); }
    100% { transform: scale(1);   opacity: 1; }
  }
  .notif-badge { animation: notif-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }

  /* ── Page fade ── */
  @keyframes page-fade {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .page-fade { animation: page-fade 0.4s cubic-bezier(0.22,1,0.36,1) both; }

  /* ── Gold shimmer on CTA ── */
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  .cta-shimmer {
    background: linear-gradient(
      110deg,
      var(--gold) 0%,
      var(--gold-light) 40%,
      var(--gold) 60%,
      var(--gold-light) 100%
    );
    background-size: 200% auto;
    animation: shimmer 3s linear infinite;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* ── Grain overlay ── */
  .grain::after {
    content: '';
    position: fixed; inset: 0; z-index: 9999; pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    opacity: 0.025;
  }
`;

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname   = usePathname();
  const router     = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifCount, setNotifCount]   = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [signingOut, setSigningOut]   = useState(false);
  const styleInjected = useRef(false);

  /* inject global CSS once */
  useEffect(() => {
    if (styleInjected.current) return;
    styleInjected.current = true;
    const el = document.createElement("style");
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
  }, []);

  /* clock */
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  /* notification count */
  useEffect(() => {
    fetch("/api/notifications?unreadOnly=true&limit=1")
      .then(r => r.json())
      .then(d => setNotifCount(d.pagination?.total ?? 0))
      .catch(() => {});
  }, []);

  /* ── Loading ── */
  if (status === "loading") return (
    <div style={{ minHeight: "100vh", background: "#0D0D0D", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          border: "1.5px solid rgba(201,168,76,0.15)",
          borderTopColor: "#C9A84C",
          animation: "spin 0.9s linear infinite",
          margin: "0 auto 16px",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", color: "rgba(255,255,255,0.3)", fontSize: 14, fontStyle: "italic", letterSpacing: "0.05em" }}>
          Preparing your space…
        </p>
      </div>
    </div>
  );

  if (!session?.user) { router.push("/login"); return null; }

  const role        = (session.user.role ?? "CLIENT") as string;
  const navGroups   = navByRole[role] ?? navByRole.CLIENT;
  const allItems    = navGroups.flatMap(g => g.items);
  const quickAction = quickActions[role];
  const palette     = rolePalette[role] ?? rolePalette.OWNER;
  const firstName   = session.user.name?.split(" ")[0] ?? "there";
  const initial     = session.user.name?.charAt(0)?.toUpperCase() ?? "U";

  const rootHref = role === "ADMIN" ? "/admin" : `/dashboard/${role.toLowerCase()}`;

  const currentPage = allItems.find(item =>
    pathname === item.href ||
    (item.href !== rootHref && pathname.startsWith(item.href))
  )?.label ?? "Dashboard";

  const isActive = (href: string) =>
    pathname === href ||
    (href !== rootHref && pathname.startsWith(href));

  /* ───────────────── RENDER ───────────────── */
  return (
    <div className="grain" style={{ minHeight: "100vh", display: "flex", fontFamily: "var(--font-body)", background: "var(--page-bg)" }}>

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 40,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(6px)",
          }}
        />
      )}

      {/* ══════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════ */}
      <aside
        className={`sidebar-animate ${sidebarOpen ? "sidebar-is-open" : "sidebar-is-closed"}`}
        style={{
          position: "fixed",
          top: 0, left: 0, bottom: 0,
          width: 240,
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          // transform controlled via CSS classes only — inline style would lose to animation fill-mode
          transition: "transform 0.3s cubic-bezier(0.22,1,0.36,1)",
          /* lacquered dark surface */
          background: "linear-gradient(170deg, #171717 0%, #0E0E0E 60%, #0A0A0A 100%)",
          borderRight: "1px solid var(--border)",
          /* subtle inner glow */
          boxShadow: "inset -1px 0 0 rgba(255,255,255,0.02), 4px 0 40px rgba(0,0,0,0.4)",
        } as React.CSSProperties}
      >
        {/* ── Decorative gold top-line ── */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${palette.dot}, transparent)`,
          opacity: 0.7,
        }} />

        {/* ── Logo ── */}
        <div style={{ padding: "28px 22px 22px", borderBottom: "1px solid var(--border)" }}>
          <Link href="/" onClick={() => setSidebarOpen(false)} style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <div style={{
              width: 34, height: 34, borderRadius: 6,
              background: "var(--gold-dim)",
              border: "1px solid rgba(201,168,76,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Sparkles size={14} color="var(--gold)" />
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "var(--text-hi)", lineHeight: 1.2, letterSpacing: "0.01em", margin: 0 }}>
                Kanishka's
              </p>
              <p style={{ fontSize: 8.5, letterSpacing: "0.22em", color: "var(--text-lo)", textTransform: "uppercase", margin: 0 }}>
                Salon & Academy
              </p>
            </div>
          </Link>

          <button
            onClick={() => setSidebarOpen(false)}
            style={{
              display: "none", // shown via media query override below
              position: "absolute", top: 20, right: 16,
              background: "transparent", border: "none",
              color: "var(--text-mid)", cursor: "pointer", padding: 4,
            }}
            className="sidebar-close-btn"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── User identity card ── */}
        <div style={{ margin: "14px 12px 6px", borderRadius: 8, padding: "12px 14px", background: "var(--surface-3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            {/* Avatar */}
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: palette.bg,
              border: `1px solid ${palette.dot}22`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              fontFamily: "var(--font-display)",
              fontSize: 17, fontWeight: 600,
              color: palette.text,
            }}>
              {initial}
            </div>
            <div style={{ overflow: "hidden", flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, color: "var(--text-hi)", fontWeight: 500, lineHeight: 1.35, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {session.user.name}
              </p>
              {/* role pill */}
              <span style={{
                display: "inline-block",
                marginTop: 3,
                fontSize: 8.5,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontWeight: 600,
                color: palette.text,
                background: palette.bg,
                padding: "1.5px 7px",
                borderRadius: 99,
              }}>
                {role.charAt(0) + role.slice(1).toLowerCase()}
              </span>
            </div>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="sidebar-scroll" style={{ flex: 1, overflowY: "auto", padding: "8px 10px 0" }}>
          {navGroups.map((group, gi) => (
            <div key={group.group} style={{ marginBottom: 20 }}>
              {/* section label */}
              <p style={{
                margin: "0 0 6px",
                padding: "0 10px",
                fontSize: 8.5,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                fontWeight: 700,
                color: "var(--text-lo)",
              }}>
                {group.group}
              </p>

              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className="nav-link"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 10px",
                      borderRadius: 7,
                      marginBottom: 1,
                      fontSize: 13,
                      fontWeight: active ? 500 : 400,
                      textDecoration: "none",
                      color: active ? "var(--text-hi)" : "var(--text-mid)",
                      background: active ? "rgba(255,255,255,0.05)" : "transparent",
                      transition: "all 0.2s ease",
                      position: "relative",
                    }}
                  >
                    {/* active left accent */}
                    {active && (
                      <span style={{
                        position: "absolute",
                        left: 0, top: "20%", bottom: "20%",
                        width: 2.5,
                        borderRadius: 99,
                        background: palette.dot,
                        boxShadow: `0 0 8px ${palette.dot}88`,
                      }} />
                    )}

                    {/* icon */}
                    <span style={{ color: active ? palette.text : "var(--text-lo)", flexShrink: 0 }}>
                      {item.icon}
                    </span>

                    {item.label}

                    {active && (
                      <ChevronRight size={11} style={{ marginLeft: "auto", color: "var(--text-lo)" }} />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* ── CTA quick action ── */}
        {quickAction && (
          <div style={{ padding: "0 12px 12px" }}>
            <Link
              href={quickAction.href}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                padding: "11px 0",
                borderRadius: 8,
                background: `linear-gradient(135deg, ${palette.dot}, ${palette.text}cc)`,
                color: "#fff",
                fontSize: 11.5,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                textDecoration: "none",
                boxShadow: `0 4px 20px ${palette.dot}44`,
                transition: "opacity 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              {quickAction.icon}
              {quickAction.label}
            </Link>
          </div>
        )}

        <div style={{ padding: "10px 12px 22px", borderTop: "1px solid var(--border)" }}>
          <button
            onClick={async () => {
              setSigningOut(true);
              await signOut({ callbackUrl: "/login" });
            }}
            disabled={signingOut}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 10px",
              borderRadius: 7,
              background: "transparent",
              border: "none",
              color: signingOut ? "var(--text-mid)" : "var(--text-lo)",
              fontSize: 12,
              cursor: signingOut ? "not-allowed" : "pointer",
              width: "100%",
              transition: "color 0.2s",
              fontFamily: "var(--font-body)",
              opacity: signingOut ? 0.7 : 1,
            }}
            onMouseEnter={e => { if (!signingOut) (e.currentTarget as HTMLElement).style.color = "#f87171"; }}
            onMouseLeave={e => { if (!signingOut) (e.currentTarget as HTMLElement).style.color = "var(--text-lo)"; }}
          >
            {signingOut ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ animation: "spin 0.8s linear infinite", flexShrink: 0 }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Signing out…
              </>
            ) : (
              <>
                <LogOut size={13} />
                Sign out
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", marginLeft: 240 }} className="main-wrapper">

        {/* ── Top header ── */}
        <header style={{
          position: "sticky", top: 0, zIndex: 30,
          padding: "0 28px",
          height: 60,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "rgba(245,241,236,0.88)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--page-border)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset",
        }}>

          {/* Left: hamburger (mobile) + greeting */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              onClick={() => setSidebarOpen(true)}
              className="mobile-menu-btn"
              style={{
                display: "none",
                width: 36, height: 36,
                alignItems: "center", justifyContent: "center",
                borderRadius: 7,
                border: "1px solid rgba(0,0,0,0.1)",
                background: "transparent",
                cursor: "pointer",
                color: "#444",
              }}
            >
              <Menu size={17} />
            </button>

            <div>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(60,50,40,0.5)", fontWeight: 400 }}>
                {getGreeting()},&nbsp;
                <span style={{ fontWeight: 600, color: "rgba(30,25,20,0.75)" }}>{firstName}</span>
              </p>
              <h2 style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontSize: 20,
                fontWeight: 500,
                color: "#1A1510",
                lineHeight: 1.25,
                letterSpacing: "0.01em",
              }}>
                {currentPage}
              </h2>
            </div>
          </div>

          {/* Right: date + divider + bell + view site */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Date */}
            <div style={{ textAlign: "right" }} className="hide-mobile">
              <p style={{ margin: 0, fontSize: 11, color: "rgba(60,50,40,0.4)", lineHeight: 1.4 }}>
                {currentTime.toLocaleDateString("en-IN", { weekday: "long" })}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(60,50,40,0.6)", fontWeight: 500, lineHeight: 1.4 }}>
                {currentTime.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>

            <div style={{ width: 1, height: 28, background: "rgba(0,0,0,0.08)" }} className="hide-mobile" />

            {/* Bell */}
            <button
              onClick={() => {
                const dest =
                  role === "ADMIN"  ? "/admin/logs" :
                  role === "OWNER"  ? "/dashboard/owner/appointments" :
                  role === "RECEPTIONIST" ? "/dashboard/receptionist/appointments" :
                  "/dashboard/client/appointments";
                router.push(dest);
              }}
              title={`You have ${notifCount} notification${notifCount !== 1 ? "s" : ""}`}
              style={{
              position: "relative",
              width: 36, height: 36,
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 8,
              border: "1px solid rgba(0,0,0,0.08)",
              background: "rgba(255,255,255,0.6)",
              cursor: "pointer",
              color: "rgba(30,25,20,0.5)",
              transition: "all 0.2s",
            }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = palette.dot + "55";
                el.style.color = palette.text;
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "rgba(0,0,0,0.08)";
                el.style.color = "rgba(30,25,20,0.5)";
              }}
            >
              <Bell size={15} />
              {notifCount > 0 && (
                <span className="notif-badge" style={{
                  position: "absolute", top: -4, right: -4,
                  width: 16, height: 16,
                  background: palette.dot,
                  color: "#fff",
                  fontSize: 8.5,
                  fontWeight: 700,
                  borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 0 0 2px var(--page-bg), 0 2px 6px ${palette.dot}66`,
                }}>
                  {notifCount > 9 ? "9+" : notifCount}
                </span>
              )}
            </button>

            {/* View site pill */}
            <Link
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 14px",
                borderRadius: 8,
                border: "1px solid rgba(0,0,0,0.08)",
                background: "rgba(255,255,255,0.6)",
                fontSize: 11.5,
                color: "rgba(30,25,20,0.55)",
                fontWeight: 500,
                textDecoration: "none",
                letterSpacing: "0.01em",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
              className="hide-mobile"
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.color = palette.text;
                el.style.borderColor = palette.dot + "44";
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.color = "rgba(30,25,20,0.55)";
                el.style.borderColor = "rgba(0,0,0,0.08)";
              }}
            >
              View site
              <ChevronRight size={11} />
            </Link>
          </div>
        </header>

        {/* ── Page content ── */}
        <main className="page-fade main-content" style={{ flex: 1, padding: "28px 28px 80px", overflow: "auto" }}>
          {children}
        </main>

        {/* ── Footer ── */}
        <footer style={{
          padding: "12px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "1px solid rgba(0,0,0,0.06)",
        }}>
          <p style={{ margin: 0, fontSize: 10.5, color: "rgba(60,50,40,0.35)", letterSpacing: "0.02em" }}>
            © 2026 Kanishka's Family Salon &amp; Academy
          </p>
          <p style={{ margin: 0, fontSize: 10.5, color: "rgba(60,50,40,0.35)", fontVariantNumeric: "tabular-nums" }}>
            {currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </footer>
      </div>

      {/* ── Mobile bottom nav ── */}
      <MobileBottomNav role={role} pathname={pathname} palette={palette} />

      {/* ── Responsive tweaks (inline) ── */}
      <style>{`
        /* Desktop: sidebar always visible — !important beats animation fill-mode */
        @media (min-width: 1024px) {
          .sidebar-is-closed { transform: translateX(0) !important; }
          .sidebar-is-open   { transform: translateX(0) !important; }
        }
        /* Mobile: sidebar is a full-height drawer */
        @media (max-width: 1023px) {
          .sidebar-is-closed { transform: translateX(-100%) !important; }
          .sidebar-is-open   { transform: translateX(0)     !important; }
          .main-wrapper      { margin-left: 0 !important; }
          .sidebar-close-btn { display: flex !important; }
          .mobile-menu-btn   { display: flex !important; }
          .hide-mobile       { display: none !important; }
          .main-content      { padding-bottom: calc(80px + env(safe-area-inset-bottom)) !important; }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MOBILE BOTTOM NAV
───────────────────────────────────────────── */
function MobileBottomNav({
  role, pathname, palette,
}: {
  role: string;
  pathname: string;
  palette: { text: string; bg: string; dot: string };
}) {
  const items: Record<string, { href: string; icon: React.ReactNode; label: string }[]> = {
    CLIENT: [
      { href: "/dashboard/client",              icon: <LayoutDashboard size={19} strokeWidth={1.5} />, label: "Home"    },
      { href: "/dashboard/client/appointments", icon: <Calendar        size={19} strokeWidth={1.5} />, label: "Bookings" },
      { href: "/book",                          icon: <Plus            size={19} strokeWidth={1.5} />, label: "Book"    },
      { href: "/dashboard/client/orders",       icon: <ShoppingBag     size={19} strokeWidth={1.5} />, label: "Orders"  },
      { href: "/dashboard/client/profile",      icon: <User            size={19} strokeWidth={1.5} />, label: "Profile" },
    ],
    ADMIN: [
      { href: "/admin",              icon: <LayoutDashboard size={19} strokeWidth={1.5} />, label: "Home"    },
      { href: "/admin/appointments", icon: <Calendar        size={19} strokeWidth={1.5} />, label: "Bookings" },
      { href: "/admin/users",        icon: <Users           size={19} strokeWidth={1.5} />, label: "Users"   },
      { href: "/admin/products",     icon: <Package         size={19} strokeWidth={1.5} />, label: "Products" },
      { href: "/admin/orders",       icon: <ClipboardList   size={19} strokeWidth={1.5} />, label: "Orders"  },
    ],
    OWNER: [
      { href: "/dashboard/owner",             icon: <LayoutDashboard size={19} strokeWidth={1.5} />, label: "Home"    },
      { href: "/dashboard/owner/appointments",icon: <Calendar        size={19} strokeWidth={1.5} />, label: "Bookings" },
      { href: "/dashboard/owner/revenue",     icon: <BarChart3       size={19} strokeWidth={1.5} />, label: "Revenue" },
      { href: "/dashboard/owner/products",    icon: <Package         size={19} strokeWidth={1.5} />, label: "Products" },
      { href: "/dashboard/owner/orders",      icon: <ClipboardList   size={19} strokeWidth={1.5} />, label: "Orders"  },
    ],
    RECEPTIONIST: [
      { href: "/dashboard/receptionist",              icon: <LayoutDashboard size={19} strokeWidth={1.5} />, label: "Home"    },
      { href: "/dashboard/receptionist/appointments", icon: <Calendar        size={19} strokeWidth={1.5} />, label: "Bookings" },
      { href: "/dashboard/receptionist/clients",      icon: <Search          size={19} strokeWidth={1.5} />, label: "Clients" },
      { href: "/dashboard/receptionist/gallery",      icon: <ImageIcon       size={19} strokeWidth={1.5} />, label: "Gallery" },
      { href: "/dashboard/receptionist/blog",         icon: <FileText        size={19} strokeWidth={1.5} />, label: "Blog"    },
    ],
  };

  const navItems = items[role] ?? items.CLIENT;

  return (
    <>
      <style>{`
        .mobile-nav { display: none; }
        @media (max-width: 1023px) { .mobile-nav { display: flex; } }
      `}</style>
      <nav
        className="mobile-nav"
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          zIndex: 50,
          alignItems: "stretch",
          height: "calc(60px + env(safe-area-inset-bottom))",
          paddingBottom: "env(safe-area-inset-bottom)",
          background: "rgba(10,10,10,0.97)",
          backdropFilter: "blur(24px)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* top gold line */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent 0%, ${palette.dot}88 50%, transparent 100%)`,
        }} />

        {navItems.map(({ href, icon, label }) => {
          const active = pathname === href ||
            (href !== `/dashboard/${role.toLowerCase()}` && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                textDecoration: "none",
                padding: "8px 4px",
                position: "relative",
              }}
            >
              {active && (
                <span style={{
                  position: "absolute",
                  top: 0, left: "25%", right: "25%",
                  height: 2,
                  borderRadius: "0 0 4px 4px",
                  background: palette.dot,
                  boxShadow: `0 2px 10px ${palette.dot}99`,
                }} />
              )}
              <span style={{ color: active ? palette.text : "rgba(255,255,255,0.25)", transition: "color 0.2s" }}>
                {icon}
              </span>
              <span style={{
                fontSize: 9,
                letterSpacing: "0.09em",
                textTransform: "uppercase",
                fontWeight: active ? 600 : 400,
                color: active ? palette.text : "rgba(255,255,255,0.25)",
                transition: "color 0.2s",
              }}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}