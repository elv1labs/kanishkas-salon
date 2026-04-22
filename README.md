# 💇 Kanishka's Family Salon & Academy

> A full-stack Next.js 14 platform for a premium family salon and professional beauty academy in Indore, India.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=flat-square&logo=pwa)](https://web.dev/progressive-web-apps/)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🌐 **Public Website** | Services, products, blog, gallery, booking, contact — fully SEO-optimised |
| 📅 **Appointment Booking** | Multi-step booking flow with date/time selection, staff preferences |
| 🛍️ **E-Commerce** | Product catalogue, cart (React Context with cross-tab sync), checkout |
| 💳 **Payments** | Offline-first tracking (UPI/Cash/Card via `mark-paid`) — no Stripe dependency |
| 🏆 **Loyalty Programme** | 4-tier points system (Bronze → Platinum), earn on every visit and purchase |
| 🎁 **Gift Vouchers** | Purchasable vouchers with partial redemption support |
| 📊 **Role-Based Dashboards** | Client, Receptionist, Owner, Admin — each with tailored views |
| 📱 **Progressive Web App** | Installable on iOS & Android, offline-capable, no App Store needed |
| 📝 **Blog & Gallery CMS** | Staff-managed content with SEO metadata and category filtering |
| 🖼️ **Smart Image Uploads** | Local VPS storage with `sharp`: WebP conversion + auto-thumbnails + EXIF stripping |
| 🔔 **Notifications** | In-app notification feed (live); email/SMS stubs ready to activate |
| 🎓 **Academy** | Course management and student enrollment for the beauty academy |
| 📈 **Revenue Analytics** | Real-time revenue, service popularity, and business KPIs for owners |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router) |
| **Language** | TypeScript |
| **Database** | PostgreSQL 16 via [Prisma ORM](https://www.prisma.io/) |
| **Auth** | [NextAuth.js v4](https://next-auth.js.org/) — email/password + Google OAuth |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) with custom design tokens |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |
| **UI Primitives** | [Radix UI](https://www.radix-ui.com/) |
| **Image Processing** | [sharp](https://sharp.pixelplumbing.com/) — WebP conversion, smart thumbnails, EXIF stripping |
| **Media Storage** | Local VPS filesystem (`public/uploads/`) — persistent via Docker named volume |
| **Deployment** | Docker (PostgreSQL + Next.js) + Nginx reverse proxy |

---

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18.x
- npm ≥ 9.x
- PostgreSQL (local, Docker, or managed)

### Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd kanishkas-salon

# 2. Install dependencies (includes sharp for image processing)
npm install

# 3. Configure environment
cp .env.example .env.local
# Fill in all required values (see .env.example for reference)

# 4. Set up the database
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database
npm run db:seed        # Seed with initial data

# 5. Start development server
npm run dev            # → http://localhost:3000
```

### With Docker (Recommended — includes persistent image storage)

```bash
# Start PostgreSQL + Next.js app with persistent upload volume
docker compose up -d --build

# Run migrations and seed in the container
docker compose exec app npx prisma migrate deploy
docker compose exec app npx tsx prisma/seed.ts
```

> The `uploads_data` Docker named volume persists all uploaded gallery/product/staff images across rebuilds and restarts. Do not use `docker compose down -v` in production.

---

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | TypeScript type checking |
| `npm run db:generate` | Generate Prisma client from schema |
| `npm run db:push` | Push schema changes (dev, no migration file) |
| `npm run db:migrate` | Create and apply migrations |
| `npm run db:studio` | Open Prisma Studio GUI (http://localhost:5555) |
| `npm run db:seed` | Seed database with initial data |

---

## 🏗️ Project Structure

```
kanishkas-salon/
├── app/
│   ├── (public)/          # Public website pages (home, services, products, blog, etc.)
│   ├── (auth)/            # Login & registration
│   ├── dashboard/
│   │   ├── client/        # Client dashboard (appointments, orders, loyalty, profile)
│   │   ├── receptionist/  # Staff dashboard (appointments, clients, blog, gallery)
│   │   ├── owner/         # Business owner (revenue, products, orders, content)
│   │   └── admin/         # Admin (users, settings, logs, full access)
│   └── api/               # REST API routes
├── components/
│   ├── layout/            # Header, Footer, DashboardLayout
│   ├── providers/         # Session, Cart providers
│   └── ui/                # Reusable UI components
├── lib/                   # Utilities (auth, prisma, api-utils, storage, payments, notifications)
├── prisma/
│   ├── schema.prisma      # Database schema (22+ models)
│   └── seed.ts            # Database seeding script
├── public/
│   ├── uploads/           # Uploaded images (gallery/, products/, staff/, etc.)
│   │   └── */thumbs/      # Auto-generated 400×400 WebP thumbnails
│   ├── manifest.json      # PWA manifest
│   └── sw.js              # Service worker
├── docs/                  # Project documentation
└── types/                 # TypeScript type definitions
```

---

## 👥 User Roles

| Role | Access Level |
|------|-------------|
| **CLIENT** | Book appointments, shop, track orders, manage loyalty points |
| **RECEPTIONIST** | Manage appointments, clients, blog, gallery |
| **OWNER** | Revenue analytics, products, orders, content review |
| **ADMIN** | Full system access — users, roles, settings, audit logs |

### Test Credentials (Seeded)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@kanishkassalon.com | `Admin@1234` |
| Owner | owner@kanishkassalon.com | `Owner@1234` |
| Receptionist | receptionist@kanishkassalon.com | `Staff@1234` |
| Client | client@test.com | `Client@1234` |

> ⚠️ **Replace all test credentials before deploying to production.**

---

## 💳 Payment System

The platform uses a **fully offline-first payment model** — designed for a physical salon where clients pay in-person.

| Method | Flow |
|--------|------|
| **UPI** | Client pays in-salon → staff marks paid via dashboard |
| **Cash** | Client pays in-salon → staff marks paid via dashboard |
| **Card (in-person)** | Client cards in-salon → staff marks paid via dashboard |

**No Stripe SDK is installed.** The `stripePaymentId` / `stripeSessionId` columns in the `Payment` schema are orphaned legacy fields that are never populated. The `/api/webhooks/stripe/` directory is an empty folder.

---

## 🖼️ Image Upload System

All images are stored locally on the VPS. The `sharp` pipeline automatically:
1. Auto-rotates based on EXIF orientation
2. Resizes to max 1600×1600 px
3. Converts to **WebP** (30–70% smaller than JPEG/PNG)
4. Generates a **400×400 smart-crop thumbnail** (WebP, q70)
5. Strips EXIF/GPS metadata

Images are served from `/uploads/<folder>/` with **1-year immutable cache headers**, so repeat visitors pay zero bandwidth.

---

## 🎨 Design System

| Token | Value | Usage |
|-------|-------|-------|
| `espresso` | `#1A1A1A` | Primary dark / backgrounds |
| `gold` | `#C9A84C` | Accent / CTAs / highlights |
| `cream` | `#FDFAF5` | Light backgrounds |
| `charcoal` | `#2E2E2E` | Body text |
| `rose-gold` | `#B76E79` | Secondary accent |

**Fonts:** Playfair Display (headings) · DM Sans (body) · Cormorant Garamond (accent)

---

## 📚 Documentation

For detailed documentation, see the **[docs/](docs/README.md)** directory:

| Document | Description |
|----------|-------------|
| [**Project Map**](docs/PROJECT_MAP.md) | Complete route map, DB models, API endpoints, completion status |
| [**About the Project**](docs/ABOUT_PROJECT.md) | Business context, tech decisions, service offerings, value propositions |
| [**User Manual**](docs/USER_MANUAL.md) | End-user guide — booking, shopping, loyalty, PWA install |
| [**Productivity Guide**](docs/PRODUCTIVITY_GUIDE.md) | Developer workflow, patterns, debugging, backlog |
| [**Deployment Guide**](DEPLOY.md) | Server setup, Docker, Nginx, SSL, backups & restore |
| [**Dashboard Status**](DASHBOARD_STATUS.md) | Live vs. placeholder page audit |
| [**Implementation Checklist**](IMPLEMENTATION_CHECKLIST.md) | Feature completion tracking |

---

## 🚢 Deployment

The application is deployed on a VPS with Docker + Nginx. See **[DEPLOY.md](DEPLOY.md)** for the full deployment guide including:

- Docker Compose setup (PostgreSQL 16 + Next.js app)
- Persistent upload volume configuration
- Nginx reverse proxy configuration
- SSL setup (Let's Encrypt)
- PostgreSQL backups & restore
- Domain go-live checklist

---

## 📊 Project Status

**Overall Completion: ~97%** — Feature-complete, pending final infrastructure setup.

| Layer | Status |
|-------|--------|
| UI/UX Design | ✅ 100% |
| Frontend Logic | ✅ 100% |
| API Routes | ✅ 100% |
| Database Schema | ✅ 100% |
| Payment System | ✅ 100% (offline-first — no Stripe needed) |
| Image Upload System | ✅ 100% (sharp + local VPS + Docker volume) |
| Auth & RBAC | ✅ 100% |
| In-App Notifications | ✅ 100% |
| Email Notifications | ⚠️ Stub — activate with `resend` package + `RESEND_API_KEY` |
| SMS Notifications | ⚠️ Stub — activate with `twilio` package + `TWILIO_*` vars |
| Google OAuth | ⚠️ Needs `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` |
| Deployment | ⚠️ 85% — domain + Let's Encrypt SSL pending |

**Next milestone:** Domain purchase (`kanishkassalon.com`) and Let's Encrypt SSL — awaiting client approval.

---

## 📄 License

Private — All rights reserved.

---

<p align="center">
  <strong>Kanishka's Family Salon & Academy</strong><br>
  Anand Bazar, Baikunth Dham, Indore, MP 452001<br>
  📱 +91 9171230292 · 📧 kanishkasen100@gmail.com<br>
  🕙 10:00 AM – 9:00 PM, Every Day
</p>
