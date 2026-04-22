"use client";

import Link from "next/link";
import { Instagram, Facebook, Youtube, Phone, Mail, MapPin, ArrowUpRight } from "lucide-react";

/* ─── DATA ─── */
const quickLinks   = [
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
  { label: "Nail Art",      href: "/services?cat=NAIL_CARE" },
  { label: "Academy",       href: "/services?cat=ACADEMY" },
];

/* ─── CONSTANTS ─── */
const GOLD  = "#C9A84C";
const INK   = "#0E0C09";

/* ─── INJECTED CSS ─── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

  .footer-link {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    color: rgba(255,255,255,0.4);
    text-decoration: none;
    transition: color 0.22s, padding-left 0.22s;
    padding-left: 0;
  }
  .footer-link:hover {
    color: #C9A84C;
    padding-left: 5px;
  }
  .footer-link .arrow { opacity: 0; transition: opacity 0.2s; }
  .footer-link:hover .arrow { opacity: 1; }

  .social-btn {
    width: 38px; height: 38px;
    display: flex; align-items: center; justify-content: center;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 3px;
    color: rgba(255,255,255,0.45);
    text-decoration: none;
    transition: all 0.25s;
    background: rgba(255,255,255,0.03);
  }
  .social-btn:hover {
    background: #C9A84C;
    border-color: #C9A84C;
    color: #111;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(201,168,76,0.35);
  }

  .contact-row {
    display: flex;
    align-items: flex-start;
    gap: 11px;
    color: rgba(255,255,255,0.4);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    line-height: 1.55;
    margin-bottom: 13px;
  }
  .contact-row a {
    color: rgba(255,255,255,0.4);
    text-decoration: none;
    transition: color 0.2s;
  }
  .contact-row a:hover { color: #C9A84C; }

  @keyframes float-ornament {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-5px); }
  }
  .ornament {
    animation: float-ornament 6s ease-in-out infinite;
  }

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

/* ─── SECTION HEADING ─── */
function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h3 style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: 20, fontWeight: 500,
        color: "rgba(255,255,255,0.9)",
        letterSpacing: "0.01em",
        margin: "0 0 10px",
        lineHeight: 1.2,
      }}>
        {children}
      </h3>
      {/* ornamental rule: short gold line + diamond */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 28, height: 1, background: GOLD }} />
        <div style={{ width: 4, height: 4, background: GOLD, transform: "rotate(45deg)", flexShrink: 0 }} />
        <div style={{ width: 14, height: 1, background: `${GOLD}55` }} />
      </div>
    </div>
  );
}

/* ─── COMPONENT ─── */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <footer style={{ background: INK, color: "rgba(255,255,255,0.7)", position: "relative", overflow: "hidden" }}>

        {/* ── Background ornament (subtle large letterform) ── */}
        <div style={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "clamp(180px, 30vw, 380px)",
          fontStyle: "italic",
          color: "rgba(201,168,76,0.025)",
          userSelect: "none",
          pointerEvents: "none",
          whiteSpace: "nowrap",
          lineHeight: 1,
          letterSpacing: "-0.04em",
        }}>
          K
        </div>

        {/* ── Top decorative border ── */}
        <div style={{
          height: 1,
          background: `linear-gradient(90deg, transparent 0%, ${GOLD}66 30%, ${GOLD} 50%, ${GOLD}66 70%, transparent 100%)`,
        }} />

        {/* ── PRE-FOOTER: large CTA strip ── */}
        <div style={{
          maxWidth: 1320, margin: "0 auto",
          padding: "52px 32px 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
          flexWrap: "wrap",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          position: "relative",
        }}>
          <div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, margin: "0 0 6px", fontWeight: 500 }}>
              Ready for your transformation?
            </p>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(26px, 4vw, 40px)",
              fontWeight: 400, fontStyle: "italic",
              color: "rgba(255,255,255,0.88)",
              margin: 0, lineHeight: 1.2,
              letterSpacing: "0.01em",
            }}>
              Book your appointment today
            </h2>
          </div>
          <Link href="/book" style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            padding: "14px 32px",
            background: `linear-gradient(135deg, ${GOLD} 0%, #E2C97E 100%)`,
            color: "#fff",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11, fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            textDecoration: "none",
            borderRadius: 3,
            boxShadow: `0 8px 32px ${GOLD}55`,
            transition: "opacity 0.2s, transform 0.2s",
            flexShrink: 0,
          }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1";    e.currentTarget.style.transform = "translateY(0)"; }}
          >
            Book Now
            <ArrowUpRight size={14} />
          </Link>
        </div>

        {/* ── MAIN FOOTER GRID ── */}
        <div
          className="footer-grid"
          style={{
            maxWidth: 1320, margin: "0 auto",
            padding: "52px 32px 48px",
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "40px 48px",
            position: "relative",
          }}
        >
          {/* ── Column 1: Brand ── */}
          <div>
            <Link href="/" style={{ display: "inline-block", marginBottom: 18 }}>
              <img
                src="/logo.svg"
                alt="Kanishka's Family Salon"
                style={{ height: 48, width: "auto", opacity: 0.9 }}
              />
            </Link>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              fontSize: 16,
              color: `${GOLD}99`,
              marginBottom: 14,
              lineHeight: 1.5,
              letterSpacing: "0.02em",
            }}>
              Step into a world of beauty &amp; luxury
            </p>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13, lineHeight: 1.75,
              color: "rgba(255,255,255,0.35)",
              maxWidth: 300,
              marginBottom: 24,
            }}>
              With over 15 years of expertise, Kanishka's Family Salon brings world-class beauty services to Indore — from bridal transformations to professional courses, blending artistry with care.
            </p>

            {/* Socials */}
            <div style={{ display: "flex", gap: 9 }}>
              {[
                { icon: <Instagram size={15} />, href: "https://instagram.com/kanishkas_family_salon", label: "Instagram" },
                { icon: <Facebook  size={15} />, href: "https://www.facebook.com/kanishkasfamilysalon",  label: "Facebook"  },
              ].map(({ icon, href, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  className="social-btn" aria-label={label}>
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* ── Column 2: Quick Links ── */}
          <div>
            <FooterHeading>Quick Links</FooterHeading>
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

          {/* ── Column 3: Services ── */}
          <div>
            <FooterHeading>Our Services</FooterHeading>
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

          {/* ── Column 4: Contact ── */}
          <div>
            <FooterHeading>Visit Us</FooterHeading>

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

            {/* Hours card */}
            <div style={{
              marginTop: 20,
              padding: "16px 18px",
              background: "rgba(201,168,76,0.05)",
              border: "1px solid rgba(201,168,76,0.12)",
              borderRadius: 3,
              position: "relative",
              overflow: "hidden",
            }}>
              {/* left glow bar */}
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: `linear-gradient(180deg, ${GOLD}, ${GOLD}55)` }} />
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, marginBottom: 7 }}>
                Open 7 days a week
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, color: "rgba(255,255,255,0.45)", lineHeight: 1.65, margin: 0 }}>
                Monday – Sunday<br />
                <span style={{ color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>10:00 AM – 9:00 PM</span>
              </p>
            </div>
          </div>
        </div>

        {/* ── ORNAMENTAL DIVIDER ── */}
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
            {/* center diamond cluster */}
            <div className="ornament" style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 20px" }}>
              <div style={{ width: 3, height: 3, background: `${GOLD}44`, transform: "rotate(45deg)" }} />
              <div style={{ width: 5, height: 5, background: `${GOLD}88`, transform: "rotate(45deg)" }} />
              <div style={{ width: 4, height: 4, background: GOLD,        transform: "rotate(45deg)" }} />
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: GOLD, lineHeight: 1, padding: "0 4px" }}>❧</div>
              <div style={{ width: 4, height: 4, background: GOLD,        transform: "rotate(45deg)" }} />
              <div style={{ width: 5, height: 5, background: `${GOLD}88`, transform: "rotate(45deg)" }} />
              <div style={{ width: 3, height: 3, background: `${GOLD}44`, transform: "rotate(45deg)" }} />
            </div>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
          </div>
        </div>

        {/* ── BOTTOM BAR ── */}
        <div style={{ maxWidth: 1320, margin: "0 auto", padding: "20px 32px 28px" }}>
          <div
            className="footer-bottom-row"
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}
          >
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11.5, color: "rgba(255,255,255,0.22)", margin: 0, letterSpacing: "0.02em" }}>
              © {year} Kanishka's Family Salon &amp; Academy. All rights reserved.
            </p>
            <div className="footer-legal" style={{ display: "flex", gap: 20 }}>
              {[
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms",          href: "/terms"   },
                { label: "Sitemap",        href: "/sitemap" },
              ].map(({ label, href }) => (
                <Link key={href} href={href} style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11.5,
                  color: "rgba(255,255,255,0.2)",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
                  onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}
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