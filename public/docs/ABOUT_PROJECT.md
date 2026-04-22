# 📖 Kanishka's Family Salon & Academy — About the Project

> *Elegance meets technology — a full-stack platform for Indore's premier family salon*

---

## 🏢 Business Overview

**Kanishka's Family Salon & Academy** is a premium beauty salon and professional training academy located in Anand Bazar, Baikunth Dham, Indore, Madhya Pradesh 452001. The business serves families across all age groups, offering a comprehensive range of beauty, wellness, and grooming services alongside accredited professional training courses.

### Contact Information
| Detail | Value |
|--------|-------|
| **Phone** | +91 9171230292 |
| **Email** | kanishkasen100@gmail.com |
| **Address** | Anand Bazar, Baikunth Dham, Indore, MP 452001 |
| **Hours** | 10:00 AM – 9:00 PM, All Days |
| **Currency** | INR (Indian Rupee) |
| **Timezone** | Asia/Kolkata (IST, UTC+5:30) |

---

## 💡 Project Purpose

This platform was built to transform Kanishka's Salon from a walk-in-only business into a modern, tech-enabled enterprise. The goals are:

1. **Reduce friction for clients** — Allow 24/7 appointment booking, product ordering, and loyalty point tracking without calling in.
2. **Empower staff operationally** — Give receptionists and owners real-time dashboards to manage appointments, content, and revenue.
3. **Drive repeat business** — Loyalty programme, gift vouchers, and referral incentives keep clients engaged.
4. **Expand online presence** — SEO-optimised blog, gallery, and service pages grow organic traffic and brand visibility.
5. **Professionalise the Academy** — Manage student enrolments, courses, and certifications within the same platform.

---

## 🛠️ Technology Decisions & Rationale

### Why Next.js 14 with App Router?
- **Full-stack in one repo:** API routes, server components, and client UI live together — fewer moving parts.
- **SEO-first:** Server-side rendering and static generation for public pages maximises search rankings.
- **Type safety:** TypeScript throughout prevents runtime bugs in business-critical flows like booking and payments.

### Why PostgreSQL + Prisma?
- **Relational data fits the domain:** Appointments, orders, and users have rich relationships that SQL handles natively.
- **Prisma ORM:** Type-safe queries, auto-generated migrations, and Prisma Studio for non-technical data inspection.
- **Supabase hosting:** Managed PostgreSQL with connection pooling; no DevOps overhead.

### Why Tailwind CSS + Radix UI?
- **Tailwind** provides a utility-first system with custom design tokens (`espresso`, `gold`, `cream`) that match the salon's brand palette without writing custom CSS files.
- **Radix UI** delivers accessible, unstyled primitives (dialogs, dropdowns, toasts) that were styled to match the brand.

### Why Stripe for Payments?
- Global standard with reliable webhooks, PCI-compliance out-of-the-box.
- Handles both appointment deposit payments and e-commerce checkout.

### Why Cloudinary for Images?
- Automatic image optimisation, transformation, and CDN delivery.
- `next-cloudinary` provides React upload and display components that integrate natively.

### Why Resend + Twilio?
- **Resend** is a modern developer-first email API built on React Email — perfect for beautifully templated transactional emails.
- **Twilio** handles SMS appointment reminders — reaching clients on any phone without internet.

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
|--------|-----------|---------|
| Card (online) | Stripe | E-commerce, appointment deposits |
| UPI | Manual / future | In-salon payments |
| Cash | Manual | In-salon walk-ins |

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
- Uploaded via Cloudinary CDN

### Notifications
In-app notification system for:
- Appointment confirmations & reminders
- Order status updates
- Loyalty point changes
- Voucher expiry warnings
- Promotional announcements

### SMS & Email Automation
| Trigger | Channel | Message Type |
|---------|---------|-------------|
| Appointment confirmed | SMS + Email | Confirmation with booking ref |
| 24h before appointment | SMS | Reminder |
| Appointment completed | Email | Review request |
| Order shipped | Email | Tracking update |
| Points milestone reached | Email | Tier upgrade congratulations |

### WhatsApp / SMS Booking
Clients can book appointments by sending an SMS or WhatsApp message to the salon's Twilio number. The system automatically:
- Parses the requested service, date, and time
- Matches the service against the catalogue
- Creates a pending appointment
- Replies with a confirmation message

Endpoint: `/api/webhooks/whatsapp` (receives Twilio webhook callbacks)

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

## 🔒 Security

| Feature | Implementation |
|---------|---------------|
| Password hashing | bcrypt (10 rounds) |
| Session management | JWT, 30-day expiry |
| Route protection | Middleware RBAC checks |
| API authentication | `requireAuth()` / `requireRole()` on every route |
| Webhook verification | Stripe signature validation |
| SQL injection prevention | Prisma ORM parameterised queries |
| Disabled account check | Middleware blocks inactive users |
