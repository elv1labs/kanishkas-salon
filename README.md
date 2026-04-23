# 💇 Kanishka's Family Salon & Academy

> A full-stack Next.js 14 platform for a premium family salon and professional beauty academy in Indore, India.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=flat-square&logo=pwa)](https://web.dev/progressive-web-apps/)
[![Tests](https://img.shields.io/badge/Tests-33%2F33-green?style=flat-square)](./tests)

**Platform Score: 9.0 / 10** vs industry standard (Fresha, Vagaro, Mangomint, Zenoti)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🌐 **Public Website** | Services, products, blog, gallery, booking, contact — fully SEO-optimised |
| 📅 **Appointment Booking** | Visual calendar, categorized time slots, guest booking, 3-step progress flow |
| 🛍️ **E-Commerce** | Product catalogue, cart (React Context + cross-tab sync), checkout |
| 💳 **Payments** | Offline-first (UPI/Cash/Card via `mark-paid`) — designed for Indian salons |
| 🏆 **Loyalty Programme** | 4-tier points system (Bronze → Platinum), auto-earn on every visit/purchase/review |
| 🎁 **Gift Vouchers** | Purchasable vouchers with partial redemption & atomic race-condition protection |
| 📊 **Role-Based Dashboards** | Client, Receptionist, Owner, Admin — each with tailored views |
| 📱 **Progressive Web App** | Installable on iOS & Android, offline-capable |
| 📝 **Blog & Gallery CMS** | Staff-managed with SEO metadata, category filtering |
| 🖼️ **Smart Image Uploads** | Local VPS storage with `sharp`: WebP + auto-thumbnails + EXIF stripping |
| 🔔 **Multi-Channel Notifications** | Email (Resend) + SMS (Twilio) + WhatsApp + In-app + SSE real-time |
| 🎓 **Academy** | Course management with enrollment pipeline |
| 📈 **Advanced Analytics** | Revenue, staff performance, retention buckets, peak hours, commissions |
| 📦 **Service Bundles** | Package deals combining multiple services at discounted prices |
| ⏳ **Waiting List** | Clients join waitlist for fully booked slots with 5-state lifecycle |
| ⭐ **Google Reviews** | Automated review prompts via WhatsApp/SMS/Email post-appointment |
| 🌍 **Multi-Language** | Hindi + English with cookie-based locale switching |
| 🔒 **Security** | Rate limiting, non-root Docker, Sentry monitoring, audit logging |
| 🚀 **CI/CD** | GitHub Actions pipeline (lint → type-check → test → build → Docker) |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router) |
| **Language** | TypeScript (strict) |
| **Database** | PostgreSQL 16 via [Prisma ORM](https://www.prisma.io/) — 37 models, 15 enums |
| **Auth** | [NextAuth.js v4](https://next-auth.js.org/) — email/password + brute-force protection |
| **Styling** | Vanilla CSS + custom design tokens |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |
| **i18n** | [next-intl](https://next-intl.dev/) — Hindi + English |
| **Image Processing** | [sharp](https://sharp.pixelplumbing.com/) — WebP, thumbnails, EXIF stripping |
| **Testing** | [Vitest](https://vitest.dev/) — 33 tests across 3 suites |
| **Monitoring** | [Sentry](https://sentry.io/) — error tracking + source maps |
| **Deployment** | Docker Compose + Nginx reverse proxy on Hostinger KVM 2 VPS |

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 20.x
- npm ≥ 9.x
- PostgreSQL 16 (local, Docker, or managed)

### Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd kanishkas-salon
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in all required values (see .env.example for docs)

# 3. Set up the database
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database
npm run db:seed        # Seed with initial data

# 4. Start development server
npm run dev            # → http://localhost:3000
```

### With Docker (Recommended)

```bash
docker compose up -d --build
# App runs at http://localhost:3001
# Database auto-syncs schema on startup
```

> ⚠️ **Never** run `docker compose down -v` in production — this destroys all data and uploaded images.

---

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm test` | Run Vitest test suite (33 tests) |
| `npm run lint` | Run ESLint |
| `npm run type-check` | TypeScript type checking |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema changes |
| `npm run db:seed` | Seed database with initial data |

---

## 🏗️ Project Structure

```
kanishkas-salon/
├── app/
│   ├── (public)/          # Public pages (home, services, products, blog, gallery, book, contact)
│   ├── (auth)/            # Login & registration
│   ├── dashboard/
│   │   ├── client/        # Appointments, orders, loyalty, profile
│   │   ├── receptionist/  # Appointments, clients, blog, gallery
│   │   ├── owner/         # Revenue, products, orders, content
│   │   └── admin/         # Users, settings, logs, full access
│   └── api/               # 35+ REST API routes
├── components/            # UI components (layout, providers, reusable)
├── i18n/                  # Internationalization (messages/en.json, messages/hi.json)
├── lib/                   # Utilities (auth, prisma, api-utils, whatsapp, notifications)
├── hooks/                 # Custom hooks (useSSE)
├── tests/                 # Vitest test suites
├── prisma/
│   ├── schema.prisma      # Database schema (37 models, 15 enums)
│   └── seed.ts            # Database seeding script
├── .github/workflows/     # CI/CD pipeline
├── docker-compose.yml     # Production orchestration (app + db + backup + cron)
└── Dockerfile             # Multi-stage build with security hardening
```

---

## 👥 User Roles

| Role | Access Level |
|------|-------------|
| **CLIENT** | Book appointments, shop, track orders, manage loyalty points |
| **RECEPTIONIST** | Manage appointments, clients, blog, gallery |
| **OWNER** | Revenue analytics, products, orders, content review |
| **ADMIN** | Full system access — users, roles, settings, audit logs |

### Seeded Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | kanishkasen100@gmail.com | `Kanishka@2024!` |
| Owner | priya.s@kanishkas.in | `Kanishka@2024!` |
| Receptionist | neha.g@kanishkas.in | `Kanishka@2024!` |
| Client | meera.kapoor@gmail.com | `Kanishka@2024!` |

---

## 💳 Payment System

Fully **offline-first** — designed for a physical salon where clients pay in-person.

| Method | Flow |
|--------|------|
| **UPI** | Client scans salon QR → submits UTR → staff verifies |
| **Cash** | Client pays in-salon → staff marks paid |
| **Card** | Client swipes in-salon → staff marks paid |

No Stripe/Razorpay SDK needed. Payment tracking is via `mark-paid` API endpoints.

---

## 🐳 Docker Infrastructure

```
┌─────────────────────────────────────────────────┐
│  docker-compose.yml                             │
│                                                 │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────┐│
│  │   app   │ │   db    │ │ db-backup│ │ cron ││
│  │ Next.js │ │ PG 16   │ │ daily+   │ │ 8PM  ││
│  │ :3001   │ │ :5432   │ │ weekly   │ │ IST  ││
│  └─────────┘ └─────────┘ └──────────┘ └──────┘│
│  1G RAM       Healthcheck  S3 optional  Reminders│
│  1.5 CPU      Persistent   7d/28d ret   Email+SMS│
└─────────────────────────────────────────────────┘
```

- Non-root user (`nextjs:1001`) for security
- Health check: `wget http://127.0.0.1:3000/api/health`
- Log rotation: 10MB × 3 files
- Resource limits: 1GB RAM / 1.5 CPU cores

---

## 📊 Project Status

**Overall Score: 9.0 / 10** — Production-deployed, feature-complete.

| Layer | Status |
|-------|--------|
| All Features | ✅ Complete |
| TypeScript | ✅ 0 errors |
| Tests | ✅ 33/33 passing |
| Production Build | ✅ Compiles |
| Docker | ✅ All containers healthy |
| Database | ✅ 37 models, 15 enums |

**Deployed:** Hostinger KVM 2 VPS (15GB RAM, 8 vCPU)

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Deployment Guide](DEPLOY.md) | Docker, Nginx, SSL, backups, domain go-live |
| [Implementation Checklist](IMPLEMENTATION_CHECKLIST.md) | Feature completion tracking |
| [Dashboard Status](DASHBOARD_STATUS.md) | Page-level audit |
| [Project Map](docs/PROJECT_MAP.md) | Route map, models, endpoints |
| [Business Logic](docs/BUSINESS_LOGIC_OVERVIEW.md) | Payment flows, loyalty, notifications |

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
