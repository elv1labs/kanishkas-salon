# 🗺️ Kanishka's Family Salon & Academy — Project Map

> **Location:** Anand Bazar, Baikunth Dham, Indore, Madhya Pradesh 452001  
> **Framework:** Next.js 14 (App Router) | **Database:** PostgreSQL via Prisma  
> **Version:** 1.0.0 | **Last Updated:** March 30, 2026

---

## 📐 High-Level Architecture

```
kanishkas-salon/
├── 🌐 Public Website        → app/(public)/
├── 🔐 Authentication        → app/(auth)/
├── 📊 Dashboards            → app/dashboard/
│   ├── 👤 Client            → /dashboard/client/
│   ├── 📋 Receptionist      → /dashboard/receptionist/
│   ├── 👑 Owner             → /dashboard/owner/
│   └── 🛡️  Admin            → /dashboard/admin/
├── 🔌 REST API              → app/api/
├── 🧩 Components            → components/
├── 📚 Libraries             → lib/
├── 🗃️  Database Schema      → prisma/schema.prisma
└── 🐳 Docker Infrastructure → Dockerfile, docker-compose.yml
```

---

## 🌐 Public Website Pages — `app/(public)/`

| Route | File | Description |
|-------|------|-------------|
| `/` | `page.tsx` | Home page — hero, services overview, testimonials, pricing, gallery, blog, CTA |
| `/about` | `about/page.tsx` | About the salon & team |
| `/services` | `services/page.tsx` | Service listings by category |
| `/services/[slug]` | `services/[slug]/page.tsx` | Individual service detail |
| `/products` | `products/page.tsx` | E-commerce product catalogue |
| `/products/[slug]` | `products/[slug]/page.tsx` | Product detail & add-to-cart |
| `/book` | `book/page.tsx` | Appointment booking flow |
| `/gallery` | `gallery/page.tsx` | Photo gallery with category filters |
| `/blog` | `blog/page.tsx` | Blog listing |
| `/blog/[slug]` | `blog/[slug]/page.tsx` | Individual blog post |
| `/cart` | `cart/page.tsx` | Shopping cart & checkout |
| `/orders/[id]/success` | `orders/[id]/success/page.tsx` | Order confirmation / success |
| `/contact` | `contact/page.tsx` | Contact form |

---

## 🔐 Authentication Pages — `app/(auth)/`

| Route | Description |
|-------|-------------|
| `/login` | Sign in with email/password or Google OAuth |
| `/register` | Client self-registration |

---

## 📊 Dashboard Pages — `app/dashboard/`

### 👤 Client Dashboard — `/dashboard/client/`

| Sub-route | Page | API Used | Status |
|-----------|------|----------|--------|
| `/` | Overview (aggregated stats) | `/api/appointments`, `/api/orders`, `/api/loyalty` | ✅ Live |
| `/appointments` | View & manage bookings | `/api/appointments` | ✅ Live |
| `/orders` | Order history | `/api/orders` | ✅ Live |
| `/loyalty` | Points & tier status | `/api/loyalty` | ✅ Live |
| `/profile` | Edit profile & preferences | `/api/users/me` | ✅ Live |

### 📋 Receptionist Dashboard — `/dashboard/receptionist/`

| Sub-route | Page | API Used | Status |
|-----------|------|----------|--------|
| `/` | Daily overview (server component) | Prisma direct | ✅ Live |
| `/appointments` | Appointment calendar | `/api/appointments` | ✅ Live |
| `/clients` | Client list & lookup | `/api/users` | ✅ Live |
| `/blog` | Blog drafts & publishing | `/api/blog` | ✅ Live |
| `/gallery` | Upload gallery images | `/api/gallery` | ✅ Live |

### 👑 Owner Dashboard — `/dashboard/owner/`

| Sub-route | Page | API Used | Status |
|-----------|------|----------|--------|
| `/` | Business KPIs overview (server component) | Prisma direct | ✅ Live |
| `/revenue` | Revenue analytics | `/api/analytics/revenue` | ✅ Live |
| `/appointments` | All appointments | `/api/appointments` | ✅ Live |
| `/orders` | Order management | `/api/orders` | ✅ Live |
| `/products` | Product management | `/api/products` | ✅ Live |
| `/content` | Site content review | `/api/content`, `/api/blog`, `/api/gallery` | ✅ Live |

### 🛡️ Admin Dashboard — `/dashboard/admin/`

| Sub-route | Page | API Used | Status |
|-----------|------|----------|--------|
| `/` | System overview (server component) | Prisma direct | ✅ Live |
| `/users` | User management & roles | `/api/users` | ✅ Live |
| `/products` | Product catalogue admin | `/api/products` | ✅ Live |
| `/appointments` | All bookings | `/api/appointments` | ✅ Live |
| `/orders` | All orders | `/api/orders` | ✅ Live |
| `/settings` | Business settings | `/api/settings` | ✅ Live |
| `/content` | CMS content editor | `/api/content`, `/api/blog`, `/api/gallery` | ✅ Live |
| `/logs` | Activity audit logs | `/api/activity-logs` | ✅ Live |

---

## 🔌 REST API Routes — `app/api/`

| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/auth/[...nextauth]` | GET, POST | NextAuth.js authentication |
| `/api/auth/register` | POST | User registration |
| `/api/users` | GET, PATCH | User management |
| `/api/users/me` | GET, PATCH | Current user profile |
| `/api/appointments` | GET, POST, PATCH | Appointment CRUD |
| `/api/appointments/mark-paid` | POST | Mark appointment as paid |
| `/api/services` | GET, POST, PATCH, DELETE | Service catalogue |
| `/api/products` | GET, POST, PATCH, DELETE | Product catalogue |
| `/api/orders` | GET, POST, PATCH | Order management + Stripe checkout |
| `/api/blog` | GET, POST, PATCH, DELETE | Blog CMS |
| `/api/gallery` | GET, POST, PATCH, DELETE | Gallery management |
| `/api/reviews` | GET, POST | Reviews & ratings |
| `/api/loyalty` | GET, POST | Loyalty points & tier |
| `/api/analytics/revenue` | GET | Revenue & business analytics |
| `/api/content` | GET, PATCH, DELETE | Site content blocks |
| `/api/settings` | GET, PATCH | Business settings |
| `/api/activity-logs` | GET | Audit trail |
| `/api/contact` | POST, GET, PATCH | Contact form submissions |
| `/api/staff` | GET | Staff profiles |
| `/api/webhooks/stripe` | POST | Stripe payment webhooks |
| `/api/webhooks/whatsapp` | POST | WhatsApp/SMS booking webhook |
| `/api/health` | GET | App health check |

---

## 🗃️ Database Models — `prisma/schema.prisma`

### User & Auth
```
User → ClientProfile | StaffProfile | Account | Session
```

| Model | Purpose |
|-------|---------|
| `User` | Core auth entity with role (CLIENT/RECEPTIONIST/OWNER/ADMIN) |
| `ClientProfile` | Extended client data (skin/hair type, visit history) |
| `StaffProfile` | Staff designation, schedule, specializations |
| `StaffAvailabilityBlock` | Staff unavailability periods |
| `Account` | OAuth provider accounts (NextAuth) |
| `Session` | Active sessions (NextAuth) |
| `VerificationToken` | Email verification tokens |

### Services & Bookings
| Model | Purpose |
|-------|---------|
| `Service` | Salon services with pricing, duration, categories |
| `ServiceCategory_Model` | Groupings (Hair, Skin, Nails, Bridal, Academy…) |
| `Appointment` | Booking record with status lifecycle |

### E-Commerce
| Model | Purpose |
|-------|---------|
| `Product` | Retail products with stock management |
| `Order` | Customer orders |
| `OrderItem` | Line items per order |
| `Payment` | Stripe/manual payment records |
| `GiftVoucher` | Purchasable gift cards |

### CRM & Engagement
| Model | Purpose |
|-------|---------|
| `LoyaltyAccount` | Points wallet per user |
| `LoyaltyTransaction` | Earn/redeem history |
| `LoyaltyRule` | Configurable earn/redeem rules |
| `Review` | Service & product ratings |
| `Notification` | In-app notification feed |
| `Referral` | Referral tracking & rewards |

### CMS & Content
| Model | Purpose |
|-------|---------|
| `BlogPost` | Blog articles with SEO metadata |
| `BlogComment` | Reader comments (with moderation) |
| `GalleryItem` | Gallery photos with Cloudinary URLs |
| `SiteContent` | Editable page content blocks |
| `BusinessSettings` | Global salon configuration |
| `ActivityLog` | System audit trail |

### Academy
| Model | Purpose |
|-------|---------|
| `Course` | Academy training courses |
| `CourseEnrollment` | Student enrollment records |

---

## 🧩 Component Library — `components/`

### Layout Components — `components/layout/`
| Component | File | Purpose |
|-----------|------|---------|
| Header | `Header.tsx` | Site-wide navigation with login/dashboard button, mobile drawer |
| Footer | `Footer.tsx` | Links, contact, social, opening hours |
| DashboardLayout | `DashboardLayout.tsx` | Sidebar navigation for all dashboard roles |

### Providers — `components/providers/`
| Component | Purpose |
|-----------|---------|
| `SessionProvider` | NextAuth session context |

### UI Components — `components/ui/`
| Component | Purpose |
|-----------|---------|
| `ServiceCard` | Service listing card with price & duration |
| `GalleryGrid` | Masonry photo gallery |
| `TestimonialCarousel` | Client review carousel |
| `SectionHeading` | Animated section titles |
| `ScrollAnimator` | Framer Motion scroll reveal |
| `MobileNav` | Responsive hamburger navigation |
| `WhatsAppButton` | Floating WhatsApp CTA |
| `AddToCartBtn` | E-commerce add-to-cart action |
| `CategoryFilter` | Filter tabs for products/gallery |
| `MotionWrapper` | Reusable Framer Motion wrapper |
| `PWARegister` | Progressive Web App service worker registration |

---

## 📚 Library Utilities — `lib/`

| File | Purpose |
|------|---------|
| `auth.ts` | NextAuth config, `requireAuth()`, `requireRole()` helpers |
| `prisma.ts` | Singleton Prisma client |
| `api-utils.ts` | `apiSuccess()`, `apiError()`, `handlePrismaError()`, `validatePagination()` |
| `resend.ts` | Email sending — appointment confirmations, order receipts, marketing |
| `twilio.ts` | SMS notifications — appointment reminders, booking confirmations |
| `stripe.ts` | Stripe client instance |

---

## 🎨 Design System

### Color Palette
| Token | Hex | Usage |
|-------|-----|-------|
| `espresso` / `dark` | `#1A1A1A` | Primary backgrounds, text |
| `gold` | `#C9A84C` | Primary accent, CTAs, highlights |
| `cream` | `#FDFAF5` | Light background |
| `charcoal` | `#2E2E2E` | Body text |
| `rose-gold` | `#B76E79` | Secondary accent |

### Typography
| Token | Font | Used For |
|-------|------|---------|
| `font-display` | Playfair Display | Section headings, hero titles |
| `font-body` | DM Sans | Body copy, UI text |
| `font-accent` | Cormorant Garamond | Decorative / accent text |

---

## 🐳 Infrastructure

### Docker Setup
```yaml
Services:
  postgres:  PostgreSQL 15 container
  app:       Next.js (port 3001 → 3000 internal)
```

### Scripts
| Script | Command |
|--------|---------|
| Dev server | `npm run dev` |
| Production build | `npm run build` |
| DB push (no migration) | `npm run db:push` |
| DB migrate (dev) | `npm run db:migrate` |
| DB migrate (production) | `npm run db:migrate:prod` |
| Seed database | `npm run db:seed` |
| Prisma Studio | `npm run db:studio` |
| Stripe webhook tunnel | `npm run stripe:listen` |
| Type check | `npm run type-check` |
| Lint | `npm run lint` |

---

## 🔐 External Services

| Service | Purpose | Key Env Vars |
|---------|---------|--------------|
| **Supabase PostgreSQL** | Primary database | `DATABASE_URL`, `DIRECT_URL` |
| **NextAuth.js** | Auth orchestration | `NEXTAUTH_SECRET`, `NEXTAUTH_URL` |
| **Google OAuth** | Social login | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| **Stripe** | Payment processing & webhooks | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| **Cloudinary** | Image storage & CDN | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` |
| **Resend** | Transactional email | `RESEND_API_KEY` |
| **Twilio** | SMS & WhatsApp notifications | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` |
| **Google Maps** | Location embed & directions | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` |

---

## 📊 Current Completion Status

| Layer | Completion | Notes |
|-------|-----------|-------|
| UI / UX Design | 96% ✅ | All pages visually complete with premium styling |
| Frontend Logic | 96% ✅ | All dashboard pages wired to APIs |
| API Integration | 96% ✅ | 22 API routes, all dashboard pages connected |
| Backend APIs | 95% ✅ | All core endpoints implemented |
| Database Schema | 100% ✅ | Fully modelled and seeded |
| Auth & RBAC | 100% ✅ | All roles and middleware live |
| Payments | 95% ✅ | Stripe integrated, webhooks active |
| Email/SMS | 95% ✅ | Resend + Twilio utilities built and integrated |
| **Overall** | **~96%** | Production-ready with minor polish remaining |

---

## 🚧 Remaining Work

### 🟡 Polish & Enhancement
1. Cart state management — Replace localStorage with React Context
2. Review submission UI on service detail pages
3. Academy enrollment flow
4. Gift voucher purchase/redemption UI
5. Referral programme dashboard
6. End-to-end testing
7. Performance optimisation (Lighthouse >90)
