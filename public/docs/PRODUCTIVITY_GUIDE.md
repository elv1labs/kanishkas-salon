# ⚡ Software Productivity Guide
## Kanishka's Family Salon & Academy — Developer Reference & Productivity Handbook

> A practical, opinionated guide to developing, debugging, and shipping features on this codebase efficiently.

---

## 🧭 Table of Contents

1. [Quick Start & Environment Setup](#1-quick-start--environment-setup)
2. [Daily Development Workflow](#2-daily-development-workflow)
3. [Codebase Navigation](#3-codebase-navigation)
4. [Adding New Features — Step-by-Step](#4-adding-new-features--step-by-step)
5. [API Route Patterns](#5-api-route-patterns)
6. [Database Operations](#6-database-operations)
7. [Authentication & Role Guards](#7-authentication--role-guards)
8. [Component Creation Standards](#8-component-creation-standards)
9. [Dashboard Page Pattern](#9-dashboard-page-pattern)
10. [Email & SMS Sending](#10-email--sms-sending)
11. [Debugging & Troubleshooting](#11-debugging--troubleshooting)
12. [Git Workflow & Commit Standards](#12-git-workflow--commit-standards)
13. [Production Deployment](#13-production-deployment)
14. [Performance Optimisations](#14-performance-optimisations)
15. [Priority Backlog & Next Steps](#15-priority-backlog--next-steps)

---

## 1. Quick Start & Environment Setup

### Prerequisites
```bash
node >= 18.x
npm >= 9.x
Docker (for local DB) OR Supabase project
```

### First-Time Setup
```bash
# 1. Clone and install
cd /home/elv1/projects/kanishkas-salon
npm install

# 2. Environment
cp .env.example .env.local
# Fill in all values — see docs/ABOUT_PROJECT.md for service URLs

# 3. Database
npm run db:generate    # Generate Prisma client from schema
npm run db:push        # Push schema to DB (dev only)
npm run db:seed        # Seed with initial data

# 4. Start dev server
npm run dev            # → http://localhost:3000
```

### With Docker (Local Database)
```bash
docker compose up -d   # Start PostgreSQL locally
# Set DATABASE_URL=postgresql://postgres:password@localhost:5432/kanishkas
npm run db:push
npm run dev
```

---

## 2. Daily Development Workflow

### Start of Day
```bash
# Pull latest changes
git pull origin main

# Install any new packages
npm install

# Start dev server
npm run dev
```

### Before Committing
```bash
# Type-check (MUST pass)
npm run type-check

# Lint
npm run lint

# If schema changed
npm run db:generate
```

### Stripe Webhooks (when working on payments)
```bash
# In a separate terminal
npm run stripe:listen
# This forwards Stripe events → localhost:3000/api/webhooks/stripe
```

---

## 3. Codebase Navigation

### Key Files to Know First
| File | Why It Matters |
|------|---------------|
| `prisma/schema.prisma` | Every data model — read this first |
| `lib/auth.ts` | Auth helpers — used on every protected route |
| `lib/api-utils.ts` | Standard API response helpers |
| `middleware.ts` | Route protection & RBAC |
| `app/layout.tsx` | Root layout, providers, fonts |
| `tailwind.config.ts` | All design tokens / custom colours |
| `.env.example` | Reference for all env vars needed |

### Mental Model for Routes
```
/                    → app/(public)/page.tsx
/login               → app/(auth)/login/page.tsx
/dashboard/client/*  → app/dashboard/client/*/page.tsx
/api/appointments    → app/api/appointments/route.ts
```

---

## 4. Adding New Features — Step-by-Step

### Adding a New API Endpoint

**Example: Add `GET /api/promotions`**

```bash
mkdir -p app/api/promotions
```

```typescript
// app/api/promotions/route.ts
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, handlePrismaError } from "@/lib/api-utils";

export async function GET(req: Request) {
  try {
    const session = await requireAuth();           // Guards the route
    // const session = await requireRole("ADMIN"); // Role-specific guard
    
    const promotions = await prisma.promotion.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(promotions);
  } catch (error) {
    return handlePrismaError(error, "promotions");
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireRole("ADMIN");
    const body = await req.json();
    
    const promotion = await prisma.promotion.create({ data: body });
    return apiSuccess(promotion, 201);
  } catch (error) {
    return handlePrismaError(error, "promotion");
  }
}
```

### Adding a New Dashboard Page

**Example: Receptionist promotions page**

```bash
mkdir -p app/dashboard/receptionist/promotions
```

```typescript
// app/dashboard/receptionist/promotions/page.tsx
"use client";
import { useState, useEffect } from "react";

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/promotions")
      .then(res => res.json())
      .then(data => {
        setPromotions(data.data);
        setLoading(false);
      })
      .catch(err => {
        setError("Failed to load promotions");
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-display font-bold">Promotions</h1>
      {/* render promotions */}
    </div>
  );
}
```

### Adding a New Database Model

1. Add model to `prisma/schema.prisma`
2. Run `npm run db:migrate` (creates migration file)
3. Run `npm run db:generate` (updates Prisma client)
4. Seed if needed in `prisma/seed.ts`

---

## 5. API Route Patterns

### Standard Success Response
```typescript
return apiSuccess({ users, total, page });
// → { success: true, data: { users, total, page } }
```

### Standard Error Response
```typescript
return apiError("User not found", 404);
// → { success: false, error: "User not found" }
```

### Prisma Error Auto-Handling
```typescript
return handlePrismaError(error, "user");
// Converts P2002 (unique violation), P2025 (not found), etc.
// to appropriate HTTP status codes automatically
```

### Pagination Pattern
```typescript
const { page, limit, skip } = validatePagination(
  searchParams.get("page"),
  searchParams.get("limit")
);

const [items, total] = await Promise.all([
  prisma.item.findMany({ skip, take: limit }),
  prisma.item.count(),
]);

return apiSuccess({ items, total, page, limit });
```

---

## 6. Database Operations

### Common Prisma Patterns

```typescript
// Find with relations
const user = await prisma.user.findUnique({
  where: { id },
  include: { profile: true, loyaltyAccount: true },
});

// Upsert (create or update)
await prisma.loyaltyAccount.upsert({
  where: { userId },
  create: { userId, totalPoints: 100 },
  update: { totalPoints: { increment: 100 } },
});

// Transaction (atomic operations)
await prisma.$transaction([
  prisma.loyaltyAccount.update({ ... }),
  prisma.loyaltyTransaction.create({ ... }),
]);

// Raw aggregation
const revenue = await prisma.payment.aggregate({
  _sum: { amount: true },
  where: { status: "PAID" },
});
```

### Prisma Studio (Visual DB Browser)
```bash
npm run db:studio
# Opens at http://localhost:5555 — view/edit any table
```

### Reset & Reseed Database
```bash
npm run db:push -- --force-reset   # ⚠️ DESTROYS ALL DATA
npm run db:seed                    # Re-seed
```

---

## 7. Authentication & Role Guards

### Protecting an API Route

```typescript
import { requireAuth, requireRole } from "@/lib/auth";

// Any logged-in user
const session = await requireAuth();

// Specific role required
const session = await requireRole("ADMIN");
const session = await requireRole("OWNER");

// Multiple roles accepted
const session = await requireRole(["ADMIN", "OWNER"]);
```

### Server Component Auth Check
```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function ProtectedPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  
  return <div>Welcome, {session.user.name}</div>;
}
```

### Client Component Auth Check
```typescript
import { useSession } from "next-auth/react";

export default function Component() {
  const { data: session, status } = useSession();
  if (status === "loading") return <Spinner />;
  if (!session) return <LoginPrompt />;
  
  return <div>Hello {session.user.role}</div>;
}
```

---

## 8. Component Creation Standards

### File Naming
- Pages: `page.tsx` (required by Next.js)
- Server components: `PascalCase.tsx`
- Client components: `PascalCase.tsx` with `"use client"` at top

### Component Template
```typescript
"use client"; // Only if using hooks or browser APIs

interface Props {
  title: string;
  children?: React.ReactNode;
}

export default function SomeComponent({ title, children }: Props) {
  return (
    <section className="py-12">
      <h2 className="font-display text-3xl text-espresso">{title}</h2>
      {children}
    </section>
  );
}
```

### Using Design Tokens
```tsx
// ✅ Use design tokens
<div className="bg-cream text-charcoal border-gold/20">
<button className="bg-gold text-espresso hover:bg-gold/90">

// ❌ Avoid hardcoded colours
<div style={{ backgroundColor: '#C9A84C' }}>
```

---

## 9. Dashboard Page Pattern

All dashboard pages follow this exact pattern for consistency:

```typescript
"use client";
import { useState, useEffect } from "react";

type Item = { id: string; name: string; /* ... */ };

export default function DashboardPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    try {
      const res = await fetch("/api/your-endpoint");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setItems(data.data.items ?? data.data);
    } catch (err) {
      setError("Could not load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-espresso">
          Page Title
        </h1>
        {/* Action button */}
      </div>
      {/* Content */}
    </div>
  );
}
```

---

## 10. Email & SMS Sending

### Send an Email (Resend)
```typescript
import { sendAppointmentConfirmation, sendOrderConfirmation } from "@/lib/resend";

// Appointment confirmation
await sendAppointmentConfirmation({
  to: user.email,
  clientName: user.name,
  serviceName: service.name,
  date: "Saturday, 29 March 2026",
  time: "2:30 PM",
  bookingRef: "REF123",
});

// Order confirmation
await sendOrderConfirmation({
  to: user.email,
  clientName: user.name,
  orderRef: "ORD456",
  items: [...],
  total: 2500,
});
```

### Send an SMS (Twilio)
```typescript
import { sendAppointmentReminder } from "@/lib/twilio";

// SMS reminder
await sendAppointmentReminder({
  to: user.phone!,        // Must include country code: +919171230292
  clientName: user.name,
  serviceName: "Hair Spa",
  appointmentTime: "2:30 PM tomorrow",
});
```

> **Best practice:** Always call these as fire-and-forget inside a try-catch. Never let email/SMS failures block the main API response.

```typescript
// ✅ Non-blocking
sendAppointmentConfirmation({ ... }).catch(console.error);

// ❌ Don't await in critical path
await sendAppointmentConfirmation({ ... });
```

---

## 11. Debugging & Troubleshooting

### Common Issues

#### `PrismaClientKnownRequestError: P2025`
Record not found. Check `where` clause IDs and relations.

#### `Hydration error: Text content did not match`
Server vs. client HTML mismatch. Wrap client-only content in `useEffect` or mark as `"use client"`.

#### `Unauthorised: No session` on a protected route
Check `requireAuth()` is called and `NEXTAUTH_SECRET` is set in env.

#### `Invalid Stripe webhook signature`
Ensure `npm run stripe:listen` is running and `STRIPE_WEBHOOK_SECRET` matches the tunnel secret.

#### Prisma client not updated after schema change
```bash
npm run db:generate
```

### Debug Checklist
```bash
# 1. Check env vars are loaded
node -e "require('dotenv').config({path:'.env.local'}); console.log(process.env.DATABASE_URL)"

# 2. Check DB connection
npx prisma db pull

# 3. Check API route response
curl http://localhost:3000/api/health

# 4. View recent DB changes
npm run db:studio
```

### Logging Tips
```typescript
// Structured logging in API routes
console.log("[API:appointments]", { method: "GET", userId: session.user.id });
console.error("[API:appointments]", { error: error.message, stack: error.stack });
```

---

## 12. Git Workflow & Commit Standards

### Branch Naming
```
feature/appointment-calendar
fix/revenue-api-calculation
chore/update-prisma-schema
docs/user-manual
```

### Commit Message Format
```
type(scope): short description

feat(appointments): add status update PATCH endpoint
fix(auth): resolve session expiry on dashboard reload
chore(prisma): add Promotion model to schema
docs(readme): update env vars reference
```

### Commit Types
| Type | When to Use |
|------|------------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `chore` | Maintenance, deps, config |
| `docs` | Documentation only |
| `refactor` | Code change without new feature/fix |
| `style` | CSS/UI-only changes |
| `test` | Test additions or fixes |

---

## 13. Production Deployment

### Pre-deployment Checklist
```bash
# ✅ Type check passes
npm run type-check

# ✅ No lint errors
npm run lint

# ✅ Build succeeds
npm run build

# ✅ All env vars set in production
# DATABASE_URL, NEXTAUTH_SECRET, STRIPE_*, CLOUDINARY_*, RESEND_*, TWILIO_*
```

### Deploy with Docker
```bash
# Build image
docker build -t kanishkas-salon .

# Start with compose (PostgreSQL + App)
docker compose up -d

# Run DB migrations in container
docker compose exec app npx prisma migrate deploy
docker compose exec app npx tsx prisma/seed.ts
```

### Environment Configuration for Production

| Env Var | Production Value |
|---------|-----------------|
| `NODE_ENV` | `production` |
| `NEXTAUTH_URL` | `https://yourdomain.com` |
| `NEXT_PUBLIC_APP_URL` | `https://yourdomain.com` |
| `DATABASE_URL` | Supabase pooled connection string |
| Stripe keys | Replace `pk_test_` with `pk_live_` |

---

## 14. Performance Optimisations

### Image Handling
- Always use `next/image` with `sizes` attribute for responsive images.
- Gallery images are hosted on Cloudinary — use transformations in the URL for resizing.

```typescript
// next/image with Cloudinary
<Image
  src={galleryItem.imageUrl}
  alt={galleryItem.altText}
  width={400}
  height={300}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

### Database Query Optimisation
- Always use `select` or `include` — never fetch full models when only a subset of fields is needed.
- Add `@@index` in schema for frequently filtered columns.
- Use `Promise.all` for parallel DB queries.

```typescript
// ✅ Efficient
const [appointments, count] = await Promise.all([
  prisma.appointment.findMany({ select: { id, date, status, client: { select: { name } } } }),
  prisma.appointment.count(),
]);

// ❌ Inefficient
const appointments = await prisma.appointment.findMany({ include: { client: true, service: true, payment: true } });
const count = await prisma.appointment.count();
```

### Client-Side Performance
- Keep `"use client"` boundaries as small and deep as possible.
- Use `Suspense` for async server components.
- Wrap heavy animations in `dynamic` imports.

---

## 15. Priority Backlog & Next Steps

> Updated: March 30, 2026. Ordered by business impact.

### ✅ Sprint 1 — Critical Fixes (COMPLETED)

- [x] **Owner Revenue Page** — Wired to `/api/analytics/revenue` with period filtering
- [x] **Receptionist Blog Page** — Full CRUD wired to `/api/blog`
- [x] **Admin Audit Logs** — Connected to `/api/activity-logs` with search, filter, pagination
- [x] **Admin Settings** — `BusinessSettings` form wired to `/api/settings` GET/PATCH

### ✅ Sprint 2 — High Value (COMPLETED)

- [x] **Owner Content CMS** — Connected to `/api/content`, `/api/blog`, `/api/gallery`
- [x] **Receptionist Gallery** — Upload and management wired to `/api/gallery`
- [x] **Receptionist Clients** — Client list wired to `/api/users`
- [x] **Appointment Calendar** — All 4 role dashboard calendar pages are live
- [x] **Admin Content CMS** — Blog + Gallery + Documents tabs, wired to 3 APIs
- [x] **Navbar Login Button** — `useSession`-aware Login/Dashboard button in Header
- [x] **WhatsApp Webhook** — `/api/webhooks/whatsapp` for SMS-based booking
- [x] **Email/SMS Integration** — `lib/resend.ts` + `lib/twilio.ts` with templates

### ✅ Sprint 3 — Polish (COMPLETED)

- [x] **Client Profile Edit** — Profile form wired to `/api/users/me` GET/PATCH
- [x] **Order Tracking** — Client and admin order pages are live
- [x] **Client Dashboard Overview** — Aggregated stats from 3 APIs

### 🟡 Remaining Work

- [ ] **Cart State Management** — Replace localStorage with React Context
- [ ] **Review Moderation** — Admin reviews approval queue UI
- [ ] **Notification Feed** — Connect notification bell to `/api/notifications`
- [ ] **Academy Enrollment** — Course listing page, enrollment form
- [ ] **Gift Voucher UI** — Purchase and redemption flow
- [ ] **Referral Dashboard** — Referral tracking and rewards UI

### 🔵 Future Enhancements

- [ ] **Push Notifications** — PWA push via Firebase Cloud Messaging
- [ ] **Google Calendar Sync** — Sync appointments to staff Google Calendars
- [ ] **Razorpay Integration** — Add Indian payment gateway as Stripe alternative
- [ ] **Automated Email Campaigns** — Birthday offers, re-engagement emails
- [ ] **Advanced Analytics** — Service popularity heatmaps, peak hour analysis
- [ ] **Multi-location Support** — If the salon expands to new branches
- [ ] **Multi-language Support** — Hindi translations

---

## 📎 Quick Reference Card

```bash
# Dev
npm run dev               # Start dev server
npm run type-check        # TypeScript validation
npm run lint              # ESLint

# Database
npm run db:generate       # Regenerate Prisma client
npm run db:push           # Push schema (dev, no migration file)
npm run db:migrate        # Create migration (dev)
npm run db:migrate:prod   # Apply migrations (production)
npm run db:seed           # Seed data
npm run db:studio         # Visual DB browser

# Stripe
npm run stripe:listen     # Webhook forwarding

# Production
npm run build             # Production build
npm run start             # Production server
```

### Useful URLs (Development)
| URL | Purpose |
|-----|---------|
| `http://localhost:3000` | Main application |
| `http://localhost:3000/api/health` | Health check |
| `http://localhost:5555` | Prisma Studio |

### Test Credentials (Seeded)
| Role | Email | Password |
|------|-------|---------|
| Admin | admin@kanishkassalon.com | `Admin@1234` |
| Owner | owner@kanishkassalon.com | `Owner@1234` |
| Receptionist | receptionist@kanishkassalon.com | `Staff@1234` |
| Client | client@test.com | `Client@1234` |

> ⚠️ Replace all test credentials before going live.
