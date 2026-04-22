"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, Calendar, ShoppingBag, Package, Users,
  FileText, BarChart3, Settings, ClipboardList, LogOut,
  Menu, X, Sparkles, ChevronRight, Bell, Scissors, UserCheck, GraduationCap, Gift, Shield, Image, Star,
} from "lucide-react";

/* ─────────────────────────────────────────────
   NAV STRUCTURE
───────────────────────────────────────────── */
type NavItem = { label: string; href: string; icon: React.ReactNode };
type NavGroup = { group: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    group: "OVERVIEW",
    items: [
      { label: "Dashboard",    href: "/admin",            icon: <LayoutDashboard size={15} /> },
      { label: "Analytics",    href: "/admin/analytics",  icon: <BarChart3        size={15} /> },
    ],
  },
  {
    group: "MANAGEMENT",
    items: [
      { label: "Appointments", href: "/admin/appointments", icon: <Calendar     size={15} /> },
      { label: "Orders",       href: "/admin/orders",       icon: <ShoppingBag  size={15} /> },
      { label: "Services",     href: "/admin/services",     icon: <Scissors     size={15} /> },
      { label: "Products",     href: "/admin/products",     icon: <Package      size={15} /> },
      { label: "Academy",      href: "/admin/academy",      icon: <GraduationCap size={15} /> },
      { label: "Staff",        href: "/admin/staff",        icon: <UserCheck    size={15} /> },
      { label: "Reviews",      href: "/admin/reviews",      icon: <Star         size={15} /> },
      { label: "Gift Vouchers",href: "/admin/vouchers",     icon: <Gift         size={15} /> },
      { label: "Media",        href: "/admin/media",        icon: <Image        size={15} /> },
    ],
  },
  {
    group: "USERS & SYSTEM",
    items: [
      { label: "Users",            href: "/admin/users",             icon: <Users         size={15} /> },
      { label: "Permissions",       href: "/admin/permissions",       icon: <Shield        size={15} /> },
      { label: "Loyalty Approvals",href: "/admin/loyalty-approvals", icon: <Gift          size={15} /> },
      { label: "Content",          href: "/admin/content",           icon: <FileText      size={15} /> },
      { label: "Settings",         href: "/admin/settings",          icon: <Settings      size={15} /> },
      { label: "Audit Logs",       href: "/admin/logs",              icon: <ClipboardList size={15} /> },
    ],
  },
];

/* ─────────────────────────────────────────────
   GLOBAL CSS (injected once)
───────────────────────────────────────────── */
const SIDEBAR_CSS = `
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
    --admin-accent: #A78BFA;
    --admin-bg:     rgba(167,139,250,0.12);
    --font-display: 'Cormorant Garamond', Georgia, serif;
    --font-body:    'DM Sans', system-ui, sans-serif;
  }

  .admin-sidebar-scroll::-webkit-scrollbar        { width: 3px; }
  .admin-sidebar-scroll::-webkit-scrollbar-track  { background: transparent; }
  .admin-sidebar-scroll::-webkit-scrollbar-thumb  { background: rgba(255,255,255,0.08); border-radius: 99px; }

  .admin-nav-link { position: relative; overflow: hidden; }
  .admin-nav-link::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent);
    transform: translateX(-100%);
    transition: transform 0.5s ease;
  }
  .admin-nav-link:hover::before { transform: translateX(100%); }

  @keyframes admin-sidebar-in {
    from { opacity: 0; transform: translateX(-8px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .admin-sidebar-animate { animation: admin-sidebar-in 0.35s cubic-bezier(0.22,1,0.36,1) both; }

  @keyframes admin-page-fade {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .admin-page-fade { animation: admin-page-fade 0.4s cubic-bezier(0.22,1,0.36,1) both; }

  @keyframes admin-notif-pop {
    0%   { transform: scale(0.6); opacity: 0; }
    80%  { transform: scale(1.15); }
    100% { transform: scale(1);   opacity: 1; }
  }
  .admin-notif-badge { animation: admin-notif-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }

  @keyframes admin-grain-overlay {
    0%, 100% { opacity: 0.025; }
  }
  .admin-grain::after {
    content: '';
    position: fixed; inset: 0; z-index: 9999; pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    opacity: 0.025;
  }

  @keyframes admin-spin { to { transform: rotate(360deg); } }
`;

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5)  return "Late night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/* ─────────────────────────────────────────────
   SIDEBAR COMPONENT
───────────────────────────────────────────── */
interface AdminSidebarProps {
  sidebarOpen: boolean;
  onClose: () => void;
  loyaltyPendingCount: number;
}

export function AdminSidebar({ sidebarOpen, onClose, loyaltyPendingCount }: AdminSidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [signingOut, setSigningOut] = useState(false);

  const isActive = (href: string) =>
    pathname === href ||
    (href !== "/admin" && pathname.startsWith(href));

  const firstName = session?.user?.name?.split(" ")[0] ?? "Admin";
  const initial   = session?.user?.name?.charAt(0)?.toUpperCase() ?? "A";

  return (
    <aside
      className={`admin-sidebar-animate ${sidebarOpen ? "admin-sidebar-open" : "admin-sidebar-closed"}`}
      style={{
        position: "fixed",
        top: 0, left: 0, bottom: 0,
        width: 240,
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        // transform is controlled purely via CSS classes (not inline) so !important can beat the animation fill-mode
        transition: "transform 0.3s cubic-bezier(0.22,1,0.36,1)",
        background: "linear-gradient(170deg, #171717 0%, #0E0E0E 60%, #0A0A0A 100%)",
        borderRight: "1px solid var(--border)",
        boxShadow: "inset -1px 0 0 rgba(255,255,255,0.02), 4px 0 40px rgba(0,0,0,0.4)",
      } as React.CSSProperties}
    >
      {/* Gold top accent line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: 2,
        background: "linear-gradient(90deg, transparent, var(--admin-accent), transparent)",
        opacity: 0.7,
      }} />

      {/* Logo */}
      <div style={{ padding: "28px 22px 22px", borderBottom: "1px solid var(--border)" }}>
        <Link href="/admin" onClick={onClose} style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
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
              Admin Panel
            </p>
          </div>
        </Link>

        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="admin-sidebar-close-btn"
          style={{
            display: "none",
            position: "absolute", top: 20, right: 16,
            background: "transparent", border: "none",
            color: "var(--text-mid)", cursor: "pointer", padding: 4,
          } as React.CSSProperties}
        >
          <X size={16} />
        </button>
      </div>

      {/* User identity card */}
      <div style={{ margin: "14px 12px 6px", borderRadius: 8, padding: "12px 14px", background: "var(--surface-3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "var(--admin-bg)",
            border: "1px solid rgba(167,139,250,0.22)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            fontFamily: "var(--font-display)",
            fontSize: 17, fontWeight: 600,
            color: "var(--admin-accent)",
          }}>
            {initial}
          </div>
          <div style={{ overflow: "hidden", flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-hi)", fontWeight: 500, lineHeight: 1.35, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {session?.user?.name ?? firstName}
            </p>
            <span style={{
              display: "inline-block",
              marginTop: 3,
              fontSize: 8.5,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontWeight: 600,
              color: "var(--admin-accent)",
              background: "var(--admin-bg)",
              padding: "1.5px 7px",
              borderRadius: 99,
            }}>
              Admin
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="admin-sidebar-scroll" style={{ flex: 1, overflowY: "auto", padding: "8px 10px 0" }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.group} style={{ marginBottom: 20 }}>
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
                  onClick={onClose}
                  className="admin-nav-link"
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
                  {/* Active left accent bar */}
                  {active && (
                    <span style={{
                      position: "absolute",
                      left: 0, top: "20%", bottom: "20%",
                      width: 2.5,
                      borderRadius: 99,
                      background: "var(--admin-accent)",
                      boxShadow: "0 0 8px rgba(167,139,250,0.55)",
                    }} />
                  )}

                  <span style={{ color: active ? "var(--admin-accent)" : "var(--text-lo)", flexShrink: 0 }}>
                    {item.icon}
                  </span>

                  {item.label}

                  {/* Loyalty Approvals badge */}
                  {item.href === "/admin/loyalty-approvals" && loyaltyPendingCount > 0 && (
                    <span style={{
                      marginLeft: "auto",
                      minWidth: 18,
                      height: 18,
                      borderRadius: 99,
                      background: "#EF4444",
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 5px",
                      flexShrink: 0,
                    }}>
                      {loyaltyPendingCount > 99 ? "99+" : loyaltyPendingCount}
                    </span>
                  )}

                  {active && item.href !== "/admin/loyalty-approvals" && (
                    <ChevronRight size={11} style={{ marginLeft: "auto", color: "var(--text-lo)" }} />
                  )}
                  {active && item.href === "/admin/loyalty-approvals" && loyaltyPendingCount === 0 && (
                    <ChevronRight size={11} style={{ marginLeft: "auto", color: "var(--text-lo)" }} />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Sign out */}
      <div style={{ padding: "10px 12px 22px", borderTop: "1px solid var(--border)" }}>
        <Link
          href="/"
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 10px", borderRadius: 7,
            color: "var(--text-lo)", fontSize: 12,
            textDecoration: "none", transition: "color 0.2s",
            marginBottom: 4,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-mid)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-lo)"; }}
        >
          <ChevronRight size={13} style={{ transform: "rotate(180deg)" }} />
          View Site
        </Link>
        <button
          onClick={async () => {
            setSigningOut(true);
            await signOut({ callbackUrl: "/login" });
          }}
          disabled={signingOut}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 10px", borderRadius: 7,
            background: "transparent", border: "none",
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
                style={{ animation: "admin-spin 0.8s linear infinite", flexShrink: 0 }}>
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
  );
}

/* ─────────────────────────────────────────────
   FULL LAYOUT SHELL (sidebar + header + main)
───────────────────────────────────────────── */
export default function AdminSidebarLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router   = useRouter();
  const [sidebarOpen, setSidebarOpen]         = useState(false);
  const [notifCount, setNotifCount]           = useState(0);
  const [loyaltyPendingCount, setLoyaltyPendingCount] = useState(0);
  const [currentTime, setCurrentTime]         = useState(new Date());
  const styleInjected = useRef(false);

  // Inject CSS once
  useEffect(() => {
    if (styleInjected.current) return;
    styleInjected.current = true;
    const el = document.createElement("style");
    el.textContent = SIDEBAR_CSS;
    document.head.appendChild(el);
  }, []);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Notification count
  useEffect(() => {
    fetch("/api/notifications?unreadOnly=true&limit=1")
      .then(r => r.json())
      .then(d => setNotifCount(d.pagination?.total ?? 0))
      .catch(() => {});
  }, []);

  // Loyalty pending count (for sidebar badge)
  useEffect(() => {
    fetch("/api/loyalty/pending?countOnly=true")
      .then(r => r.json())
      .then(d => setLoyaltyPendingCount(d.data?.count ?? 0))
      .catch(() => {});
  }, [pathname]); // re-fetch after navigation so badge stays fresh

  // Loading state
  if (status === "loading") return (
    <div style={{ minHeight: "100vh", background: "#0D0D0D", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          border: "1.5px solid rgba(167,139,250,0.15)",
          borderTopColor: "var(--admin-accent, #A78BFA)",
          animation: "admin-spin 0.9s linear infinite",
          margin: "0 auto 16px",
        }} />
        <p style={{ fontFamily: "Georgia, serif", color: "rgba(255,255,255,0.3)", fontSize: 14, fontStyle: "italic", letterSpacing: "0.05em" }}>
          Preparing admin panel…
        </p>
      </div>
    </div>
  );

  if (!session?.user) {
    router.push("/login");
    return null;
  }

  // Derive current page label from pathname
  const allItems = NAV_GROUPS.flatMap(g => g.items);
  const currentPage = allItems.find(item =>
    pathname === item.href ||
    (item.href !== "/admin" && pathname.startsWith(item.href))
  )?.label ?? "Dashboard";

  return (
    <div className="admin-grain" style={{ minHeight: "100vh", display: "flex", fontFamily: "var(--font-body)", background: "var(--page-bg)" }}>

      {/* Mobile overlay */}
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

      {/* Sidebar */}
      <AdminSidebar sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} loyaltyPendingCount={loyaltyPendingCount} />

      {/* Main content wrapper */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", marginLeft: 240 }} className="admin-main-wrapper admin-grain">

        {/* Top header */}
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
          {/* Left: hamburger + page title */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              onClick={() => setSidebarOpen(true)}
              className="admin-mobile-menu-btn"
              style={{
                display: "none",
                width: 36, height: 36,
                alignItems: "center", justifyContent: "center",
                borderRadius: 7,
                border: "1px solid rgba(0,0,0,0.1)",
                background: "transparent",
                cursor: "pointer",
                color: "#444",
              } as React.CSSProperties}
            >
              <Menu size={17} />
            </button>

            <div>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(60,50,40,0.5)", fontWeight: 400 }}>
                {getGreeting()},&nbsp;
                <span style={{ fontWeight: 600, color: "rgba(30,25,20,0.75)" }}>
                  {session.user.name?.split(" ")[0] ?? "Admin"}
                </span>
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

          {/* Right: date + bell */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ textAlign: "right" }} className="admin-hide-mobile">
              <p style={{ margin: 0, fontSize: 11, color: "rgba(60,50,40,0.4)", lineHeight: 1.4 }}>
                {currentTime.toLocaleDateString("en-IN", { weekday: "long" })}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(60,50,40,0.6)", fontWeight: 500, lineHeight: 1.4 }}>
                {currentTime.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>

            <div style={{ width: 1, height: 28, background: "rgba(0,0,0,0.08)" }} className="admin-hide-mobile" />

            {/* Notification bell */}
            <button
              onClick={() => router.push("/admin/logs")}
              title={`${notifCount} notification${notifCount !== 1 ? "s" : ""}`}
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
                el.style.borderColor = "rgba(167,139,250,0.4)";
                el.style.color = "#A78BFA";
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "rgba(0,0,0,0.08)";
                el.style.color = "rgba(30,25,20,0.5)";
              }}
            >
              <Bell size={15} />
              {notifCount > 0 && (
                <span className="admin-notif-badge" style={{
                  position: "absolute", top: -4, right: -4,
                  width: 16, height: 16,
                  background: "#A78BFA",
                  color: "#fff",
                  fontSize: 8.5,
                  fontWeight: 700,
                  borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 0 2px var(--page-bg), 0 2px 6px rgba(167,139,250,0.6)",
                }}>
                  {notifCount > 9 ? "9+" : notifCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="admin-page-fade admin-main-content" style={{ flex: 1, padding: "28px 28px 80px", overflow: "auto" }}>
          {children}
        </main>

        {/* Footer */}
        <footer style={{
          padding: "12px 28px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderTop: "1px solid rgba(0,0,0,0.06)",
        }}>
          <p style={{ margin: 0, fontSize: 10.5, color: "rgba(60,50,40,0.35)", letterSpacing: "0.02em" }}>
            © 2026 Kanishka's Family Salon & Academy — Admin Panel
          </p>
          <p style={{ margin: 0, fontSize: 10.5, color: "rgba(60,50,40,0.35)", fontVariantNumeric: "tabular-nums" }}>
            {currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </footer>
      </div>

      {/* Mobile bottom nav */}
      <AdminMobileBottomNav pathname={pathname} />

      {/* Responsive styles */}
      <style>{`
        /* Desktop: sidebar always visible — !important beats animation fill-mode */
        @media (min-width: 1024px) {
          .admin-sidebar-closed { transform: translateX(0) !important; }
          .admin-sidebar-open   { transform: translateX(0) !important; }
        }
        /* Mobile: sidebar is a full-height drawer */
        @media (max-width: 1023px) {
          .admin-sidebar-closed    { transform: translateX(-100%) !important; }
          .admin-sidebar-open      { transform: translateX(0)     !important; }
          .admin-main-wrapper      { margin-left: 0 !important; }
          .admin-sidebar-close-btn { display: flex !important; }
          .admin-mobile-menu-btn   { display: flex !important; }
          .admin-hide-mobile       { display: none !important; }
          .admin-main-content      { padding-bottom: calc(80px + env(safe-area-inset-bottom)) !important; }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MOBILE BOTTOM NAV
───────────────────────────────────────────── */
function AdminMobileBottomNav({ pathname }: { pathname: string }) {
  const items = [
    { href: "/admin",              icon: <LayoutDashboard size={19} strokeWidth={1.5} />, label: "Home" },
    { href: "/admin/appointments", icon: <Calendar        size={19} strokeWidth={1.5} />, label: "Bookings" },
    { href: "/admin/orders",       icon: <ShoppingBag     size={19} strokeWidth={1.5} />, label: "Orders" },
    { href: "/admin/users",        icon: <Users           size={19} strokeWidth={1.5} />, label: "Users" },
    { href: "/admin/settings",     icon: <Settings        size={19} strokeWidth={1.5} />, label: "Settings" },
  ];

  const isActive = (href: string) =>
    pathname === href || (href !== "/admin" && pathname.startsWith(href));

  return (
    <>
      <style>{`
        .admin-mobile-nav { display: none; }
        @media (max-width: 1023px) { .admin-mobile-nav { display: flex; } }
      `}</style>
      <nav
        className="admin-mobile-nav"
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
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                textDecoration: "none",
                color: active ? "#A78BFA" : "rgba(255,255,255,0.3)",
                fontSize: 9,
                fontWeight: active ? 600 : 400,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                transition: "color 0.2s",
                paddingTop: 8,
              }}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
