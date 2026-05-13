"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Instagram, Facebook, Phone, Mail, MapPin, ArrowUpRight } from "lucide-react";

const quickLinks = [
  { label: "Home",          href: "/" },
  { label: "About Us",      href: "/about" },
  { label: "Gallery",       href: "/gallery" },
  { label: "Blog",          href: "/blog" },
  { label: "Contact Us",    href: "/contact" },
  { label: "Shop",          href: "/products" },
  { label: "Gift Vouchers", href: "/gift-vouchers" },
];

const serviceLinks = [
  { label: "Hair Styling",  href: "/services?cat=HAIR_STYLING" },
  { label: "Skin Care",     href: "/services?cat=SKIN_CARE" },
  { label: "Bridal Makeup", href: "/services?cat=BRIDAL" },
  { label: "Nail Art",     href: "/services?cat=NAIL_CARE" },
  { label: "Academy",      href: "/services?cat=ACADEMY" },
];

const GOLD = "#C9A84C";
const INK  = "#0D0D0D";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

  .footer-link {
    display: inline-flex; align-items: center; gap: 5px;
    font-family: 'DM Sans', sans-serif; font-size: 13px;
    color: rgba(245,240,232,0.4); text-decoration: none;
    transition: color 0.22s, padding-left 0.22s; padding-left: 0;
  }
  .footer-link:hover { color: #C9A84C; padding-left: 5px; }
  .footer-link .arrow { opacity: 0; transition: opacity 0.2s; }
  .footer-link:hover .arrow { opacity: 1; }

  .social-btn {
    width: 38px; height: 38px;
    display: flex; align-items: center; justify-content: center;
    border: 1px solid #2A2A2A; border-radius: 2px;
    color: rgba(245,240,232,0.35); text-decoration: none;
    transition: all 0.25s; cursor: pointer;
    background: transparent;
  }
  .social-btn:hover {
    background: #C9A84C; border-color: #C9A84C; color: #0D0D0D;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(201,168,76,0.3);
  }

  .contact-row {
    display: flex; align-items: flex-start; gap: 11px;
    color: rgba(245,240,232,0.4); font-family: 'DM Sans', sans-serif;
    font-size: 13px; line-height: 1.55; margin-bottom: 13px;
  }
  .contact-row a {
    color: rgba(245,240,232,0.4); text-decoration: none; transition: color 0.2s;
  }
  .contact-row a:hover { color: #C9A84C; }

  @keyframes float-ornament {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-5px); }
  }
  .ornament { animation: float-ornament 6s ease-in-out infinite; }

  @media (min-width: 640px) {
    .footer-grid { grid-template-columns: 1fr 1fr !important; }
  }
  @media (min-width: 1024px) {
    .footer-grid { grid-template-columns: 1.6fr 1fr 1fr 1.3fr !important; }
  }
  @media (max-width: 639px) {
    .footer-bottom-row { flex-direction: column !important; text-align: center; }
    .footer-legal { justify-content: center !important; }
  }
`;

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 19, fontWeight: 500, color: "rgba(245,240,232,0.9)",
        letterSpacing: "0.01em", margin: "0 0 10px", lineHeight: 1.2,
      }}>
        {children}
      </h3>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 28, height: 1, background: GOLD }} />
        <div style={{ width: 4, height: 4, background: GOLD, transform: "rotate(45deg)", flexShrink: 0 }} />
        <div style={{ width: 14, height: 1, background: `${GOLD}55` }} />
      </div>
    </div>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();
  const t = useTranslations();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <footer style={{
        background: INK, color: "rgba(245,240,232,0.6)",
        position: "relative", overflow: "hidden",
        borderTop: `1px solid rgba(201,168,76,0.1)`,
      }}>
        {/* Large background letterform */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "clamp(180px, 30vw, 380px)",
          fontStyle: "italic", color: "rgba(201,168,76,0.025)",
          userSelect: "none", pointerEvents: "none",
          whiteSpace: "nowrap", lineHeight: 1, letterSpacing: "-0.04em",
        }}>
          K
        </div>

        {/* Top gold rule */}
        <div style={{
          height: 1,
          background: `linear-gradient(90deg, transparent 0%, ${GOLD}44 30%, ${GOLD} 50%, ${GOLD}44 70%, transparent 100%)`,
        }} />

        {/* Pre-footer CTA */}
        <div style={{
          maxWidth: 1320, margin: "0 auto",
          padding: "48px clamp(16px, 4vw, 48px) 44px",
          display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 24,
          flexWrap: "wrap",
          borderBottom: `1px solid rgba(245,240,232,0.06)`,
          position: "relative",
        }}>
          <div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: GOLD, margin: "0 0 6px", fontWeight: 500 }}>
              {t('footer.readyForTransformation')}
            </p>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(22px, 3.5vw, 36px)",
              fontWeight: 400, fontStyle: "italic",
              color: "rgba(245,240,232,0.85)", margin: 0, lineHeight: 1.2,
              letterSpacing: "0.01em",
            }}>
              {t('footer.bookYourAppointmentToday')}
            </h2>
          </div>
          <Link href="/book"
            style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              padding: "13px 28px",
              background: `linear-gradient(135deg, ${GOLD} 0%, #E2C97E 100%)`,
              color: "#0D0D0D",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 10, fontWeight: 700,
              letterSpacing: "0.14em", textTransform: "uppercase",
              textDecoration: "none", borderRadius: 2,
              boxShadow: `0 8px 32px ${GOLD}44`,
              transition: "opacity 0.2s, transform 0.2s",
              flexShrink: 0, cursor: "pointer",
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            {t('nav.bookNow')}
            <ArrowUpRight size={13} />
          </Link>
        </div>

        {/* Main footer grid */}
        <div className="footer-grid"
          style={{
            maxWidth: 1320, margin: "0 auto",
            padding: "48px clamp(16px, 4vw, 48px) 44px",
            display: "grid",
            gridTemplateColumns: "1fr", gap: "40px 48px",
            position: "relative",
          }}
        >
          {/* Brand */}
          <div>
            <Link href="/" style={{ display: "inline-block", marginBottom: 18 }}>
              <div style={{ height: 44, width: "auto", position: "relative" }}>
                <Image src="/logo.svg" alt="Kanishka's Family Salon" fill style={{ opacity: 0.85 }} />
              </div>
            </Link>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic", fontSize: 15, color: `${GOLD}88`,
              marginBottom: 14, lineHeight: 1.5, letterSpacing: "0.02em",
            }}>
              {t('footer.beautyTagline')}
            </p>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13, lineHeight: 1.75,
              color: "rgba(245,240,232,0.3)",
              maxWidth: 300, marginBottom: 22,
            }}>
              {t('footer.aboutText')}
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { icon: <Instagram size={14} />, href: "https://instagram.com/kanishkas_family_salon", label: "Instagram" },
                { icon: <Facebook  size={14} />, href: "https://www.facebook.com/kanishkasfamilysalon",  label: "Facebook"  },
              ].map(({ icon, href, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  className="social-btn" aria-label={label}>
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <FooterHeading>{t('footer.quickLinks')}</FooterHeading>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 9 }}>
              {quickLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="footer-link">
                    <span className="arrow" style={{ color: GOLD, fontSize: 11 }}>›</span>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <FooterHeading>{t('footer.ourServices')}</FooterHeading>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 9 }}>
              {serviceLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="footer-link">
                    <span className="arrow" style={{ color: GOLD, fontSize: 11 }}>›</span>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <FooterHeading>{t('footer.visitUs')}</FooterHeading>
            <div className="contact-row">
              <MapPin size={14} style={{ color: GOLD, flexShrink: 0, marginTop: 2 }} />
              <span>Anand Bazar, Baikunth Dham,<br />Indore, Madhya Pradesh 452001</span>
            </div>
            <div className="contact-row">
              <Phone size={14} style={{ color: GOLD, flexShrink: 0, marginTop: 2 }} />
              <a href="tel:+919171230292">+91 91712 30292</a>
            </div>
            <div className="contact-row">
              <Mail size={14} style={{ color: GOLD, flexShrink: 0, marginTop: 2 }} />
              <a href="mailto:kanishkasen100@gmail.com">kanishkasen100@gmail.com</a>
            </div>
            <div style={{
              marginTop: 20, padding: "14px 16px",
              background: "rgba(201,168,76,0.04)",
              border: `1px solid rgba(201,168,76,0.1)`,
              borderRadius: 2, position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: `linear-gradient(180deg, ${GOLD}, ${GOLD}55)` }} />
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, marginBottom: 6 }}>
                {t('footer.open7Days')}
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "rgba(245,240,232,0.4)", lineHeight: 1.65, margin: 0 }}>
                {t('footer.mondayToSunday')}<br />
                <span style={{ color: "rgba(245,240,232,0.6)", fontWeight: 500 }}>10:00 AM – 9:00 PM</span>
              </p>
            </div>
          </div>
        </div>

        {/* Ornamental divider */}
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 clamp(16px, 4vw, 48px)" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ flex: 1, height: 1, background: "rgba(245,240,232,0.05)" }} />
            <div className="ornament" style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 20px" }}>
              <div style={{ width: 3, height: 3, background: `${GOLD}44`, transform: "rotate(45deg)" }} />
              <div style={{ width: 5, height: 5, background: `${GOLD}88`, transform: "rotate(45deg)" }} />
              <div style={{ width: 4, height: 4, background: GOLD, transform: "rotate(45deg)" }} />
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: GOLD, lineHeight: 1, padding: "0 3px" }}>❧</div>
              <div style={{ width: 4, height: 4, background: GOLD, transform: "rotate(45deg)" }} />
              <div style={{ width: 5, height: 5, background: `${GOLD}88`, transform: "rotate(45deg)" }} />
              <div style={{ width: 3, height: 3, background: `${GOLD}44`, transform: "rotate(45deg)" }} />
            </div>
            <div style={{ flex: 1, height: 1, background: "rgba(245,240,232,0.05)" }} />
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "18px clamp(16px, 4vw, 48px) 24px" }}>
          <div className="footer-bottom-row"
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}
          >
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "rgba(245,240,232,0.18)", margin: 0, letterSpacing: "0.02em" }}>
              © {year} {t('footer.salonName')}. {t('footer.rights')}.
            </p>
            <div className="footer-legal" style={{ display: "flex", gap: 20 }}>
              {[
                { label: t('footer.privacy'), href: "/privacy" },
                { label: t('footer.terms'),   href: "/terms"   },
                { label: t('footer.sitemap'), href: "/sitemap" },
              ].map(({ label, href }) => (
                <Link key={href} href={href} style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 11,
                  color: "rgba(245,240,232,0.18)", textDecoration: "none",
                  transition: "color 0.2s", cursor: "pointer",
                }}
                  onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(245,240,232,0.18)")}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}