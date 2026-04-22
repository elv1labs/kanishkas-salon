# 📖 Kanishka's Family Salon & Academy — About the Project

> *Elegance meets technology — a full-stack PWA platform for Indore's premier family salon*

---

## 🏢 Business Overview

**Kanishka's Family Salon & Academy** is a premium beauty salon and professional training academy located in Anand Bazar, Baikunth Dham, Indore, Madhya Pradesh 452001. The business serves families across all age groups, offering a comprehensive range of beauty, wellness, and grooming services alongside accredited professional training courses.

### Contact Information
| Detail | Value |
|--------|-------|
| **Phone** | +91 9171230292 |
| **Email** | kanishkasen100@gmail.com |
| **Address** | Anand Bazar, Baikunth Dham, Indore, MP 452001 |
| **Hours** | 10:00 AM – 9:00 PM, All Days (365 days/year) |
| **Currency** | INR (Indian Rupee) |
| **Timezone** | Asia/Kolkata (IST, UTC+5:30) |

---

## 💡 Project Purpose

This platform was built to transform Kanishka's Salon from a walk-in-only business into a modern, tech-enabled enterprise. The goals are:

1. **Reduce friction for clients** — Allow 24/7 appointment booking, product ordering, and loyalty point tracking without calling in.
2. **Empower staff operationally** — Give receptionists and owners real-time dashboards to manage appointments, content, and revenue.
3. **Drive repeat business** — Loyalty programme, gift vouchers, and referral incentives keep clients engaged between visits.
4. **Expand online presence** — SEO-optimised blog, gallery, and service pages grow organic traffic and brand visibility.
5. **Professionalise the Academy** — Manage student enrolments, courses, and certifications within the same platform.
6. **Enable mobile-first access** — A full PWA means clients can install the platform as a native-feeling app on both Android and iPhone with no App Store required.

---

## 🏪 Business Adoption — How This Platform Creates Real Value

This section explains **why** each feature of the platform matters in the context of a physical salon business — and the measurable value it generates.

### 1. Online Appointment Booking → Captures Lost Walk-In Revenue
A walk-in-only salon loses bookings every time a client calls at a busy moment, gets no answer, and goes elsewhere. The booking system captures that intent **24/7**, converting would-be lost appointments into confirmed revenue. It also reduces receptionist phone workload by an estimated **30–50%** for high-traffic periods.

**Value generated:** Higher appointment fill-rate, fewer missed calls, receptionist time freed for in-salon service.

### 2. Loyalty Programme → Increases Visit Frequency
The four-tier Bronze → Silver → Gold → Platinum loyalty system gives clients a concrete reason to return. Industry data shows that loyalty programme members visit **20–30% more frequently** than non-members and spend more per visit as they accumulate tier benefits.

- **100 points = ₹1 discount** — transparent and motivating
- **Referral bonuses** turn satisfied clients into brand ambassadors
- **Birthday points** create a predictable re-engagement moment every year

**Value generated:** Increased visit frequency, word-of-mouth acquisition, reduced churn.

### 3. E-Commerce Shop → Revenue Beyond the Chair
Products sold in-salon typically achieve margins of **40–60%**. The integrated online shop allows clients to re-purchase their favourite products between visits — capturing revenue that would otherwise go to Amazon or a competitor. Orders with delivery expand the geographic reach beyond Indore walk-ins.

**Value generated:** Ongoing product revenue between visits, increased basket size per client.

### 4. Gift Vouchers → Upfront Cash + New Client Acquisition
Gift vouchers are a **financially efficient** tool: the salon receives cash upfront (often at full price), and the voucher redeemer is frequently a **new client** introduced by the purchaser. Partial-redemption tracking ensures every rupee of voucher value is accounted for.

**Value generated:** Advance cash flow, new client acquisition at zero marketing cost.

### 5. PWA (Mobile App) → In-Pocket Brand Presence
Once installed on a client's home screen, the app icon is a **daily visual reminder** of the brand — more effective than a bookmark or a business card. Push notifications (a future enhancement) can drive re-engagement without any advertising spend.

- No App Store approval needed — instant distribution via QR code
- Works on both Android and iPhone
- Offline-capable via service worker caching

**Value generated:** Top-of-mind awareness, direct re-engagement channel, zero ongoing distribution cost.

### 6. Blog & Gallery → Organic SEO + Social Proof
Every blog post targeting Indore-specific search queries ("best hair spa in Indore", "bridal makeup Indore") is a permanent, compounding SEO asset. The gallery serves as **visual social proof** for new clients making a booking decision — before/after transformations are among the highest-converting content types in the beauty industry.

**Value generated:** Organic search traffic growth, reduced paid advertising dependency, trust-building for new clients.

### 7. Academy Enrolment → High-Margin Revenue Diversification
Professional beauty courses command premium pricing (₹10,000–₹80,000+ per programme) with relatively low marginal cost. The digital enrolment system reduces administrative overhead and positions the Academy as a distinct, professional brand within the same platform.

**Value generated:** High-margin revenue stream separate from service income, brand authority, talent pipeline.

### 8. Owner & Admin Dashboards → Data-Driven Business Decisions
The revenue analytics, appointment occupancy, and product performance dashboards give the owner insight that most small salons never have. Understanding **which services are most profitable**, **which days have low occupancy**, and **which clients are at risk of churning** allows for targeted, evidence-based business decisions.

**Value generated:** Confidence to act on data rather than intuition, optimised pricing and staffing.

---

## 🛠️ Technology Decisions & Rationale

### Why Next.js 14 with App Router?
- **Full-stack in one repo:** API routes, server components, and client UI live together — fewer moving parts.
- **SEO-first:** Server-side rendering and static generation for public pages maximises search rankings.
- **Type safety:** TypeScript throughout prevents runtime bugs in business-critical flows like booking and payments.
- **PWA-ready:** Built-in support for service workers, web app manifest, and offline caching.

### Why PostgreSQL + Prisma?
- **Relational data fits the domain:** Appointments, orders, and users have rich relationships that SQL handles natively.
- **Prisma ORM:** Type-safe queries, auto-generated migrations, and Prisma Studio for non-technical data inspection.
- **Supabase hosting:** Managed PostgreSQL with connection pooling; no DevOps overhead.

### Why Tailwind CSS?
- Utility-first system with custom design tokens (`espresso`, `gold`, `cream`) that match the salon's brand palette.
- Eliminates unused CSS at build time — fast page loads for mobile clients on slower connections.

### Why a Unified Offline Payment System?
- Stripe suits online card payments, but most Indian salon clients pay **in-person via UPI, CASH, or CARD**.
- The platform implements a single `markAsPaid` function (`lib/payments/markAsPaid.ts`) used by both `POST /api/appointments/mark-paid` and `POST /api/orders/mark-paid`.
- Staff record the method (`CASH`, `UPI`, `CARD`), amount, optional transaction reference, and note — creating a complete audit trail in the `Payment` table.
- Also extended to Academy enrollments via `/api/academy/enrollments/[id]/mark-paid`.
- Prevents duplicate payments (409 if already PAID), always logs to `ActivityLog`.

### Image Storage — Local VPS with sharp Processing
- Images are uploaded via `POST /api/upload` (multipart/form-data) to the local VPS filesystem.
- The `lib/storage.ts` utility runs a `sharp` pipeline on every upload:
  - **Auto-rotates** from EXIF orientation data
  - **Resizes** to max 1600×1600 px and converts to **WebP** (q82) — 30–70% smaller than JPEG/PNG
  - **Generates a 400×400 WebP thumbnail** (q70, smart-crop via `attention` positioning)
  - **Strips EXIF/GPS metadata** by default
  - Writes to category-based paths: `public/uploads/<folder>/` and `public/uploads/<folder>/thumbs/`
- In production (Docker), these files are persisted in a **named volume `uploads_data`** so images survive container rebuilds.
- Uploaded files are served as static assets with `Cache-Control: public, max-age=31536000, immutable` headers — cached by browsers for 1 year.
- No Cloudinary account is configured or required.

### Email (Resend) & SMS (Twilio) — Stub / Not Yet Active
- Both `lib/resend.ts` and `lib/twilio.ts` are **no-op stubs** — they log to console and return `false` but never send real messages.
- The infrastructure is fully built: `lib/notifications.ts` provides a unified `sendBookingNotification()` facade covering `created`, `rescheduled`, `cancelled`, `completed`, and `reminder` events.
- SMS and email templates are written and ready for all events.
- **To activate:** install the `resend` and `twilio` npm packages, set the relevant environment variables, and replace the stub implementations — no call-site changes needed.
- **Currently active notification channel:** In-app notifications via `prisma.notification.create()` — these ARE fired on appointment creation, cancellation, order placement, and payment confirmation.

---

## 🎯 Service Offerings

### Beauty & Grooming Services
| Category | Examples |
|----------|---------|
| **Hair Styling** | Blowdry, straightening, curls, updos |
| **Hair Treatments** | Keratin, hair spa, scalp treatments |
| **Hair Colouring** | Global colour, highlights, balayage, ombre |
| **Skin Care** | Facials, clean-ups, de-tan, anti-ageing |
| **Makeup** | Bridal, party, editorial |
| **Nail Care** | Manicure, pedicure, nail art, gel/acrylic |
| **Waxing** | Face & body waxing |
| **Body Treatments** | Body polishing, scrubs, wraps |
| **Hand & Foot Care** | Spa packages |
| **Bridal** | Full bridal packages (hair + makeup + skin) |

### Academy Courses
Professional training programmes for aspiring beauticians:
- Hair Styling & Colouring
- Makeup Artistry
- Nail Technology
- Skin Care & Aesthetics
- Full Beauty Diploma

---

## 👥 User Roles & Permissions

### CLIENT (Default)
Every new registered user is a CLIENT. Clients can:
- Book and manage their own appointments
- Browse and purchase products
- Track orders and loyalty points
- View and redeem gift vouchers
- Submit service reviews
- Edit their own profile

### RECEPTIONIST
Assigned manually by Admin. Receptionists can:
- View and manage ALL appointments (calendar view)
- Look up client profiles and visit history
- Create, edit, and publish blog posts
- Upload and organise gallery photos
- Manage contact form submissions

### OWNER
Assigned to the business owner. Owners can:
- Access revenue analytics and business KPIs
- Manage all appointments and orders
- Update product listings and pricing
- Edit site content (About, Hero, CMS blocks)
- Moderate customer reviews

### ADMIN
Full system access. Admins can:
- Manage all users and change roles
- Configure business settings
- Access system audit logs
- Manage all features across all roles
- Deploy and monitor the application

---

## 💰 E-Commerce & Payments

### Products
The retail catalogue includes:
- Hair care products
- Makeup & cosmetics
- Skin care items
- Nail care products
- Tools & accessories
- Gift vouchers
- Academy enrolment packages

### Payment Methods
| Method | Handled By | Use Case |
|--------|-----------|------|
| UPI | Unified offline system (`mark-paid`) | Primary in-salon method |
| Cash | Unified offline system (`mark-paid`) | Walk-in clients |
| Card (in-salon) | Unified offline system (`mark-paid`) | In-person card swipe |

> **Stripe is not installed.** The `stripePaymentId`, `stripeSessionId` columns in the `Payment` model are orphaned legacy fields from an earlier design iteration. They are never populated in production.

### Unified Offline Payment System
Both appointments and orders share a single payment confirmation flow:
1. Client visits → staff selects method (UPI/CASH/CARD) + amount + optional transaction ref
2. `POST /api/appointments/mark-paid` or `POST /api/orders/mark-paid` is called
3. `lib/payments/markAsPaid.ts` upserts a `Payment` record with `status: PAID`
4. An in-app `Notification` is created for the client
5. An `ActivityLog` entry is written for audit
6. 409 returned if already paid — prevents double-marking

Academy enrollments also use this via `PATCH /api/academy/enrollments/[id]/mark-paid`.

### Gift Vouchers
- Purchasable for any value, redeemable in-salon or online
- Time-limited with configurable expiry
- Trackable `remaining_value` for partial redemptions

---

## 🏆 Loyalty Programme

### Tier Structure
| Tier | Points Required | Perks |
|------|----------------|-------|
| 🥉 Bronze | 0 – 999 | Base earning rate |
| 🥈 Silver | 1,000 – 4,999 | Bonus points on birthdays |
| 🥇 Gold | 5,000 – 14,999 | Priority booking, bonus rate |
| 💎 Platinum | 15,000+ | Exclusive offers, complimentary services |

### Earning Events
- **Appointment completion** — Points per rupee spent
- **Product purchase** — Points per rupee spent
- **Referral** — Fixed points bonus when referred friend completes first visit
- **Review submission** — Fixed points for approved reviews

### Redemption
100 points = ₹1 discount on next booking or order.

---

## 📣 Marketing & Engagement

### Blog (CMS)
- Managed by Receptionist role
- Draft → Published → Archived workflow
- SEO metadata per post (title, description, keywords)
- View counter, reading time estimation
- Tagging and category system
- Comments with moderation

### Gallery
- Categorised by service type (Hair, Makeup, Bridal, etc.)
- Before/After comparisons
- Featured images prioritised on public gallery page
- Uploaded via `POST /api/upload` — auto-converted to **WebP** with smart-crop **thumbnails**
- Stored on local VPS (`public/uploads/gallery/` full + `public/uploads/gallery/thumbs/` thumbnails)
- Public gallery page shows thumbnails in masonry grid; lightbox shows full-size on click
- Managed by Receptionist role via `/dashboard/receptionist/gallery`

### Notifications
In-app notification system for:
- Appointment confirmations & reminders
- Order status updates
- Loyalty point changes
- Voucher expiry warnings
- Promotional announcements

### Notification System — Current State

#### In-App Notifications ✅ Live
Fired on these events via `prisma.notification.create()`:
| Event | Trigger | Recipient |
|-------|---------|----------|
| Appointment booked | Client books via `/book` | Client |
| Appointment status change | Staff updates status | Client |
| Order placed | Client completes checkout | Client |
| Payment confirmed | Staff marks appointment/order as paid | Client |

#### SMS & Email — Facade Built, Not Yet Sending
The `lib/notifications.ts` facade (`sendBookingNotification()`) is wired with templates for:

| Event | SMS | Email |
|-------|-----|-------|
| `created` | ✅ Template ready | ✅ Template ready |
| `rescheduled` | ✅ Template ready | ✅ Template ready (full HTML) |
| `cancelled` | ✅ Template ready | ✅ Template ready |
| `completed` | ✅ Template ready | — (not needed currently) |
| `reminder` | ✅ Template ready | ✅ Template ready |

**Current status:** `lib/resend.ts` and `lib/twilio.ts` are stubs — they log to console and do not send. The facade is not yet called from any API route.  
**To activate:** ① Install `resend` + `twilio` packages ② Set env vars ③ Call `sendBookingNotification()` in appointment/order routes — templates and facade are fully ready.

#### WhatsApp / SMS Booking Webhook
Endpoint: `POST /api/webhooks/whatsapp` — receives Twilio webhook callbacks.  
**Status:** Route exists; active only once Twilio account is configured.

---

## 📱 Progressive Web App (PWA)

The platform is fully configured as a PWA. Clients can install it as a native-looking app on their phone home screen — no App Store required.

### PWA Configuration
| File | Purpose |
|------|---------|
| `public/manifest.json` | App name, icons, theme, shortcuts, display mode |
| `public/sw.js` | Service worker — cache-first for shell, network-first for APIs |
| `components/ui/PWARegister.tsx` | Auto-registers the service worker on every page load |
| `app/layout.tsx` | Apple meta tags, splash screens, touch icons |

### Install QR Codes
For in-salon distribution:
- **File:** `public/docs/install-qr.html` — Self-contained, fully offline HTML page with branded printable cards for both iPhone and Android
- **Bare QR:** `public/docs/qr-install.png` — 400×400 PNG, ready to WhatsApp or print

### Current PWA URL
`https://speculatively-fictional-joni.ngrok-free.dev` _(temporary — ngrok tunnel must be running)_

### Future: Real Domain + APK
Once `kanishkassalon.com` is pointed to the server and Let's Encrypt SSL is installed:
1. Update QR code URL to `https://kanishkassalon.com`
2. Generate Android APK using **Bubblewrap** (Google Trusted Web Activity) for Play Store or direct distribution

---

## 🌐 SEO & Online Visibility

### Technical SEO
- `app/sitemap.ts` — Auto-generated XML sitemap
- `app/robots.ts` — Search engine crawl directives
- Per-page `generateMetadata()` — Dynamic Open Graph and Twitter cards
- Schema.org structured data — LocalBusiness, Service, Product
- Canonical URLs prevent duplicate content

### Content Strategy
- Blog articles on hair care, beauty tips, trends
- Location-focused content targeting Indore searches
- Before/after galleries with descriptive alt text

---

## 🖥️ Deployment (Current State — April 2026)

| Item | Status |
|------|--------|
| **Server** | VPS at `168.231.121.107` |
| **App** | Running via PM2 on port 3001 (standalone Next.js build) |
| **Nginx** | Proxying port 80 (HTTP→HTTPS redirect) and 443 (SSL) |
| **SSL** | Self-signed cert (temporary) + ngrok tunnel for trusted HTTPS |
| **Domain** | `kanishkassalon.com` — DNS not yet configured (pending client approval) |
| **Restarts** | High restart count (~134k) due to crash-loop on first request; recovers quickly — investigate DB connection on first hit |

### Next Deployment Steps
1. Client approves → purchase domain `kanishkassalon.com`
2. Point A record → `168.231.121.107`
3. Run `certbot --nginx -d kanishkassalon.com` → free Let's Encrypt SSL
4. Update NEXTAUTH_URL and NEXT_PUBLIC_APP_URL env vars
5. Rebuild and redeploy via standard deploy workflow (see DEPLOY.md)
6. Optionally generate APK via Bubblewrap

---

## 🔒 Security

| Feature | Implementation |
|---------|---------------|
| Password hashing | bcrypt (10 rounds) |
| Session management | JWT, 30-day expiry |
| Route protection | Middleware RBAC checks |
| API authentication | `requireAuth()` / `requireRole()` on every route |
| SQL injection prevention | Prisma ORM parameterised queries |
| Image safety | EXIF/GPS stripped on upload via `sharp` |
| Disabled account check | Middleware blocks inactive users |
| HTTPS | Self-signed (temp) → Let's Encrypt (production) |
| Upload security | MIME type + file size validation before processing; folder whitelist prevents path traversal |
