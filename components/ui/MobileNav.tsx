"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Image, Phone, ShoppingBag, Scissors, User } from "lucide-react";

const nav = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/services", icon: Scissors, label: "Services" },
  { href: "/book", icon: Calendar, label: "Book", cta: true },
  { href: "/products", icon: ShoppingBag, label: "Shop" },
  { href: "/dashboard/client", icon: User, label: "Account" },
];

export default function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "rgba(26,26,26,0.97)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(201,168,76,0.15)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}>
      <div className="flex items-center justify-around h-16">
        {nav.map(({ href, icon: Icon, label, cta }) => {
          const active = pathname === href;
          if (cta) {
            return (
              <Link key={href} href={href}
                className="flex flex-col items-center justify-center -mt-5">
                <div style={{
                  background: "linear-gradient(135deg, #C9A84C, #a8873d)",
                  width: 52, height: 52, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 4px 20px rgba(201,168,76,0.4)",
                  border: "3px solid #1a1a1a",
                }}>
                  <Icon size={20} color="white" strokeWidth={1.5} />
                </div>
                <span style={{
                  fontSize: 9, letterSpacing: "0.12em",
                  color: "#C9A84C", marginTop: 3, fontWeight: 600,
                  textTransform: "uppercase",
                }}>{label}</span>
              </Link>
            );
          }
          return (
            <Link key={href} href={href}
              className="flex flex-col items-center justify-center flex-1 py-2 gap-1">
              <Icon size={20} strokeWidth={active ? 2 : 1.5}
                color={active ? "#C9A84C" : "rgba(255,255,255,0.35)"} />
              <span style={{
                fontSize: 9, letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontWeight: active ? 600 : 400,
                color: active ? "#C9A84C" : "rgba(255,255,255,0.35)",
              }}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
