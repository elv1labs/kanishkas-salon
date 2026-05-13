# CLAUDE.md

This file provides guidance to AI coding assistants when working with code in this repository.

## Project Overview

Kanishka's Family Salon & Academy is a full-stack Next.js 14 application for a salon business in Indore, India. It includes:
- Public-facing website (services, booking, products, blog, gallery, contact)
- Client dashboard (appointments, orders, loyalty programme, profile)
- Staff dashboards (receptionist, owner)
- Admin dashboard (user management, settings, audit logs)
- E-commerce (products, gift vouchers)
- Appointment booking system with offline payment tracking
- Photo gallery with local VPS storage + sharp image processing
- Beauty academy with course management and enrollment

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL (via Prisma ORM)
- **Auth**: NextAuth.js v4 with credentials (bcrypt) + Google OAuth — both configured
- **Styling**: Tailwind CSS with custom theme (espresso, gold, cream color palette)
- **Animations**: Framer Motion
- **UI Components**: Radix UI primitives
- **Image Processing**: `sharp` — converts uploads to WebP, generates thumbnails, strips EXIF
- **Media Storage**: Local VPS filesystem (`public/uploads/<folder>/`) via `lib/storage.ts`

> ⚠️ **No Stripe in use.** The payment system is fully offline-first (UPI/CASH/CARD tracked via `markAsPaid`). The Stripe-related schema fields (`stripePaymentId`, `stripeSessionId`) are orphaned scaffolding from an earlier design. No `stripe` npm package is installed.

## Key Commands

```bash
npm run dev          # Development server (localhost:3000)
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
npm run type-check   # TypeScript type checking
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes (no migrations)
npm run db:migrate   # Create and apply migrations
npm run db:studio    # Open Prisma Studio GUI
npm run db:seed      # Seed database
```

## Architecture

### Route Groups

- `app/(public)/` - Public website pages (home, services, products, blog, gallery, contact, cart, book)
- `app/(auth)/` - Authentication pages (login, register)
- `app/dashboard/` - Role-based dashboard pages:
  - `client/` - Client-facing (appointments, orders, loyalty, profile)
  - `receptionist/` - Staff dashboard (appointments, clients, blog drafts, gallery)
  - `owner/` - Business owner (revenue, appointments, content, products, orders)
- `app/admin/` - Admin-only pages (users, settings, logs, appointments, academy, etc.) — also accessible via `/dashboard/admin/` aliases (redirected)
- `app/api/` - REST API routes (auth, appointments, orders, products, services, gallery, upload, etc.)

### Role-Based Access Control (RBAC)

Four user roles defined in `UserRole` enum:
1. **CLIENT** - Default for new users, can book appointments and manage own data
2. **RECEPTIONIST** - Manage appointments, clients, blog drafts, gallery
3. **OWNER** - Full business access (revenue, content, products, orders)
4. **ADMIN** - Complete system access (users, roles, settings, logs)

Middleware (`middleware.ts`) handles route protection and role-based redirects.

### Authentication Flow

- `lib/auth.ts` contains NextAuth configuration with `requireAuth()`, `requireRole()`, and `getAuthSession()` helpers
- Session strategy: JWT (30-day expiry)
- Google OAuth configured but requires `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` env vars to be set
- Password auth uses bcrypt for verification
- Middleware checks for deactivated accounts

### Payment System — Offline-First

The platform uses a fully offline payment tracking model designed for a physical salon:
- All payments happen in-person (UPI, Cash, Card)
- `lib/payments/markAsPaid.ts` provides atomic payment upsert logic
- `POST /api/appointments/mark-paid` — marks appointment payments (staff only)
- `POST /api/orders/mark-paid` — marks order payments (staff only)
- `PATCH /api/academy/enrollments/[id]/mark-paid` — marks academy enrollment payments
- Payment records are stored in the `Payment` DB model with full audit trail
- **No Stripe SDK is installed.** The `/api/webhooks/stripe/` directory is an empty folder (legacy artifact).

### Image Upload System

```
POST /api/upload (multipart/form-data)
  ↓
lib/storage.ts → sharp pipeline:
  • auto-rotate from EXIF
  • resize full: max 1600×1600 px, WebP q82
  • thumbnail: 400×400 smart-crop, WebP q70
  • EXIF stripped by default
  ↓
public/uploads/<folder>/          ← full-size WebP
public/uploads/<folder>/thumbs/  ← thumbnail WebP
  ↓
Returns: { imageUrl, thumbnailUrl, width, height, sizeBytes }
```

Gallery dashboard (`/dashboard/receptionist/gallery`) calls `/api/upload` then `POST /api/gallery` to persist both URLs.

### Database Schema

Key models in `prisma/schema.prisma`:
- **User/ClientProfile/StaffProfile** - User accounts with extended profiles
- **Service/ServiceCategory_Model** - Salon services with categories
- **Appointment** - Booking system with status tracking
- **Product/Order/OrderItem** - E-commerce
- **Payment** - Offline payment tracking (method: CASH/UPI/CARD/ONLINE; stripePaymentId is unused orphan)
- **LoyaltyAccount/LoyaltyTransaction/LoyaltyRule** - Points system
- **GiftVoucher** - Gift card management
- **BlogPost/BlogComment** - Content management
- **GalleryItem** - Photo gallery (imageUrl + thumbnailUrl stored as local /uploads/ paths)
- **Review** - Service/product reviews
- **Notification** - In-app notification feed (live)
- **ActivityLog** - Audit trail
- **Course/CourseEnrollment** - Academy management

### Styling Convention

Custom Tailwind colors defined in `tailwind.config.ts`:
- `espresso` / `dark` - Primary dark (#1A1A1A)
- `gold` - Accent (#C9A84C)
- `cream` - Background (#FDFAF5)
- `charcoal` - Text (#2E2E2E)
- `rose-gold` - Accent variant (#B76E79)

Font families:
- `font-display` - Playfair Display (headings)
- `font-body` - DM Sans (body text)
- `font-accent` - Cormorant Garamond (accent text)

### API Utilities

`lib/api-utils.ts` provides standardized response helpers:
- `apiSuccess(data, status)` - Success JSON response
- `apiError(message, status, details)` - Error JSON response
- `parseJsonBody(req)` - Safe JSON parsing with error handling
- `validatePagination(params)` - Pagination parameter validation
- `handlePrismaError(error, context)` - Maps Prisma errors to HTTP responses

### Notification System

- **In-app notifications** (`prisma.notification.create()`) — **live and active**
- **Email (Resend)** — stub only: `lib/resend.ts` logs to console, does not send. Requires `resend` package + `RESEND_API_KEY`
- **SMS (Twilio)** — stub only: `lib/twilio.ts` logs to console, does not send. Requires `twilio` package + `TWILIO_*` vars
- **WhatsApp webhook** — `POST /api/webhooks/whatsapp` exists; active once Twilio is configured
- `lib/notifications.ts` provides the `sendBookingNotification()` facade; **not yet called from API routes**

### Prisma Usage

Singleton pattern in `lib/prisma.ts` prevents multiple instances in development:
```typescript
import { prisma } from "@/lib/prisma";
```

## Environment Variables

Required (see `.env.example`):
- `DATABASE_URL` / `DIRECT_URL` - PostgreSQL connection
- `NEXTAUTH_SECRET` - Must be a secure random value (`openssl rand -base64 32`)
- `NEXTAUTH_URL` - Full app URL (e.g. `https://kanishkassalon.com`)
- `NEXT_PUBLIC_APP_URL` - Public app URL

Optional (enables additional features):
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth login
- `CLOUDINARY_*` - Not used; local VPS storage replaces Cloudinary
- `RESEND_API_KEY` - Activates email notifications (stub without it)
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE` - Activates SMS/WhatsApp
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps embed on contact page

## Deployment

### Docker (Recommended for Production)
```bash
docker compose up -d --build
docker compose exec app npx prisma migrate deploy
docker compose exec app npx tsx prisma/seed.ts
```

Docker setup (`Dockerfile`, `docker-compose.yml`):
- Multi-stage build: `deps` → `builder` → `runner`
- `builder` stage installs `libvips` / `vips-dev` / `fftw-dev` for sharp
- `runner` stage includes `libvips` runtime + sharp native bindings
- PostgreSQL container + Next.js app container
- **Named volume `uploads_data`** mounted at `/app/public/uploads` — persists uploaded images across restarts and rebuilds ← critical
- App exposes port 3001 (mapped from 3000 internally)
- Uses standalone Next.js output (`output: 'standalone'`)

### PM2 on Bare VPS
See `DEPLOY.md` for full Nginx + PM2 + SSL setup.

Build for production:
```bash
npm run build  # Creates .next/standalone output
```