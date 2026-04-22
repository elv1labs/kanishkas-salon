# KANISHKA'S FAMILY SALON & ACADEMY
## Complete Work Report & Fix Roadmap

---

**Prepared by:** elv1labs  
**Date:** April 20, 2026  
**Stack:** Next.js 14 / Prisma / PostgreSQL / Docker  
**Schema:** 857 lines | **APIs:** 28 groups | **Dashboards:** 4

| | |
|---|---|
| **6** Critical Blockers (P1) | **4** High Priority (P2) | **3** Medium Priority (P3) |

| | |
|---|---|
| **7.5 / 10** Implementation Score | **6.2 / 10** Production Readiness |

---

## 1. Executive Summary

Kanishka's Family Salon & Academy is a feature-rich, offline-first salon management platform built on Next.js 14, backed by a 857-line Prisma schema across 25+ models, 28 API route groups, and 4 role-based dashboards. The platform covers the full operational surface of an Indian salon-academy business: appointment booking, e-commerce, loyalty, academy enrollment, content CMS, and multi-role access control.

The platform sits at approximately **75% production readiness**. The remaining 25% is not missing features — it is about **operationalising what already exists**. The infrastructure, schema, and notification pipelines are built; the automation hooks, safety nets, and connectivity between modules are what remain.

### Overall Module Scorecard

| Module / Area | Build | Prod Ready | Status | Priority |
|---|:---:|:---:|:---:|:---:|
| Authentication & Account Management | 6/10 | 4/10 | \[~\] | |
| Client Dashboard | 8/10 | 7/10 | \[~\] | |
| Receptionist Dashboard | 7/10 | 6/10 | \[~\] | |
| Owner Dashboard | 7/10 | 6/10 | \[~\] | |
| Admin Dashboard | 9/10 | 8/10 | \[OK\] | |
| Appointment Booking System | 7/10 | 5/10 | \[~\] | |
| E-Commerce & Product Store | 8/10 | 6/10 | \[~\] | |
| Loyalty Programme | 5/10 | 3/10 | \[X\] | |
| Academy Module | 7/10 | 7/10 | \[OK\] | |
| Notification Engine | 8/10 | 6/10 | \[~\] | |
| Content CMS & Media Manager | 9/10 | 8/10 | \[OK\] | |
| Reviews & Moderation | 7/10 | 6/10 | \[~\] | |
| API Architecture | 8/10 | 7/10 | \[~\] | |
| Image Pipeline & File Storage | 9/10 | 9/10 | \[OK\] | |
| Deployment & Infrastructure | 7/10 | 5/10 | \[~\] | |
| **WEIGHTED AVERAGE** | **7.5 / 10** | **6.2 / 10** | | |

**Legend:** \[OK\] = Production Ready · \[~\] = Needs Work · \[X\] = Broken / Missing

---

## 2. Priority 1 — Critical Blockers (Fix Before Launch)

These 6 issues will cause immediate, visible failures for real users within the first day of going live. None require new features — they require completing or correcting what is already partially built.

### 2.1 Password Reset / Account Recovery

| | |
|---|---|
| **Module** | Authentication |
| **Severity** | CRITICAL — Production Blocker |
| **Effort** | 2 days |

**What is broken:** No forgot-password link exists anywhere in the UI. No `/api/auth/reset-password` route exists. The `VerificationToken` model is in the schema but has never been used. A user who forgets their password has zero self-service recovery path.

**What needs to be built:**
- Add 'Forgot Password' link on the login page
- Create `POST /api/auth/forgot-password` — validates email, creates a `VerificationToken` record with a 1-hour TTL, sends a reset link via Resend SDK (template already set up)
- Create `GET /api/auth/reset-password?token=X` — validates token, renders reset form
- Create `POST /api/auth/reset-password` — validates new password server-side, updates bcrypt hash, deletes the token
- Add 'Change Password' section to all dashboard profile pages

### 2.2 Slot Availability Engine

| | |
|---|---|
| **Module** | Appointment Booking |
| **Severity** | CRITICAL — Operational Failure |
| **Effort** | 5 days |

**What is broken:** The `StaffAvailabilityBlock` model and `StaffProfile.workStartTime` / `workEndTime` fields exist in the schema but are never queried during booking. Clients can book at 3 AM, on public holidays, or during staff leave. If no `staffId` is selected, zero conflict detection occurs — two clients can book the same slot simultaneously with no warning.

**What needs to be built:**
- Create `GET /api/appointments/available-slots?serviceId=X&staffId=Y&date=Z`
- Query `StaffProfile.workStartTime` and `workEndTime` to define the valid booking window
- Query `StaffAvailabilityBlock` to exclude blocked periods (leave, breaks, holidays)
- Query existing CONFIRMED / IN_PROGRESS appointments to exclude taken slots
- Calculate slot grid based on `service.duration` and return available time slots
- Update the `/book` public page to display and enforce only returned available slots
- Add business hours to `BusinessSettings` and enforce them as the outer booking window

### 2.3 Payment Gateway (Razorpay)

| | |
|---|---|
| **Module** | E-Commerce / Appointments |
| **Severity** | CRITICAL — Revenue Blocked |
| **Effort** | 14 days |

**What is broken:** No payment gateway is integrated. All payments — product orders, gift vouchers, academy enrollments — require a staff member to manually mark payment via the `mark-paid` API endpoint. This works for in-store cash/card, but blocks any online revenue entirely.

**What needs to be built:**
- Install and configure Razorpay SDK (standard choice for Indian businesses)
- Create `POST /api/payments/create-order` — creates a Razorpay order, returns `order_id`
- Add Razorpay checkout widget to the product checkout flow
- Add Razorpay checkout to gift voucher purchase flow
- Create `POST /api/payments/verify` — validates Razorpay webhook signature, marks Payment record as PAID atomically
- Handle payment failure states with user-friendly error messages
- Add `ONLINE` to `PaymentMethod` enum (already defined in schema)

### 2.4 Loyalty Programme Automation

| | |
|---|---|
| **Module** | Loyalty Programme |
| **Severity** | CRITICAL — Will Break Within Days of Launch |
| **Effort** | 2 days |

**What is broken:** Staff must manually open the admin panel and award loyalty points after every single appointment and purchase. The `LoyaltyRule` table — built specifically for a dynamic rules engine — is never queried anywhere in the codebase. Tier upgrades (Bronze to Silver, etc.) based on `lifetimeEarned` are not implemented. This will stop happening consistently within the first week of launch.

**What needs to be built:**
- In the `PATCH /api/appointments` handler, when status changes to `COMPLETED`, automatically call a new `awardLoyaltyPoints(appointmentId)` function
- `awardLoyaltyPoints()` queries `LoyaltyRule` table for `EARN_APPOINTMENT` type, calculates points from service price using `pointsPerRupee`, creates `LoyaltyTransaction` record
- In `POST /api/orders` (after order creation), auto-award `EARN_PURCHASE` points using the same rules engine
- Add tier-upgrade logic: after every point award, check `lifetimeEarned` thresholds and update `LoyaltyAccount.tier` automatically
- Add referral auto-award when a referred user makes their first appointment
- Add review auto-award when an admin approves a review (`EARN_REVIEW`)

### 2.5 Google OAuth Dead Button

| | |
|---|---|
| **Module** | Authentication |
| **Severity** | CRITICAL — Trust Damage on First Impression |
| **Effort** | 1 day (fix) or 2 days (implement) |

**What is broken:** The registration and login pages show a 'Continue with Google' button. The button calls `signIn('google')` but `authOptions` in `auth.ts` only registers `CredentialsProvider` — no `GoogleProvider` is configured. Clicking the button throws a visible NextAuth error. Every new user who tries Google sign-in gets an error on their first interaction with the product.

**Fix options (choose one):**
- **Quick fix:** Remove the Google button from the UI entirely until OAuth is properly configured
- **Full fix:** Add `GoogleProvider` to `authOptions` with `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` env vars, configure Google Cloud Console OAuth credentials, handle the account-linking case where a Google email matches an existing credentials account

### 2.6 Account Deactivation Check Is Broken

| | |
|---|---|
| **Module** | Authentication / Security |
| **Severity** | CRITICAL — Security Gap |
| **Effort** | 0.5 days |

**What is broken:** The `authorize()` callback in `auth.ts` throws the string `'AccountDeactivated'` when a deactivated user tries to log in. NextAuth surfaces all throws from `authorize()` as a generic `CredentialsSignin` error — the specific error string is lost. The middleware checks `token.error === 'AccountDeactivated'` which never gets set, so deactivated accounts may be able to log in.

**What needs to be built:**
- Change `authorize()` to return `null` instead of throwing when account is deactivated — but set a custom error by returning a user object with an `isDeactivated` flag
- In the `jwt` callback, check for `isDeactivated` and set `token.error = 'AccountDeactivated'`
- The existing middleware check will then work correctly
- Return a user-facing error message: *'Your account has been deactivated. Please contact support.'*

---

## 3. Priority 2 — High Impact (Fix Within First Sprint)

These 4 items do not cause immediate crashes but will directly hurt the business within the first week of operation — missed revenue, poor client experience, or operational risk.

### 3.1 Appointment Reminder Cron Job

| | |
|---|---|
| **Module** | Notification Engine |
| **Impact** | No-show rates increase 30–40% without reminders |
| **Effort** | 2 days |

**What is broken:** The SMS and email reminder templates (`appointmentReminder`) are fully written and branded. The `sendAppointmentReminder()` function exists in `notifications.ts`. Nothing triggers it. There is no scheduled job anywhere in the codebase.

**What needs to be built:**
- Create a cron endpoint at `POST /api/cron/appointment-reminders` (protected by a secret header)
- Query all CONFIRMED appointments where `date = tomorrow`
- For each, call `sendAppointmentReminder()` with client details
- Set up a daily cron trigger — options: Vercel Cron (if hosted on Vercel), a Docker cron container in `docker-compose.yml`, or an external cron service (Render, Railway, EasyCron)
- Add reminder sent tracking (`reminderSentAt` field on Appointment model) to prevent duplicate sends

### 3.2 Staff Performance Analytics

| | |
|---|---|
| **Module** | Owner Dashboard |
| **Impact** | Owner cannot evaluate or manage individual staff members |
| **Effort** | 5 days |

**What is broken:** The owner dashboard has strong overall revenue analytics (daily/weekly/monthly breakdowns, category shares, period-over-period change). But there is zero per-stylist visibility. No staff performance page exists.

**What needs to be built:**
- Create `GET /api/analytics/staff` — groups completed appointments and their payment amounts by `staffId`
- Return per-staff: appointments completed, total revenue generated, average service value, unique clients served, repeat client rate
- Add a Staff Performance page to the owner dashboard (`/dashboard/owner/staff-analytics`)
- Add a date-range filter (this week / this month / custom)
- Add a leaderboard view and a per-staff detail drill-down

### 3.3 Database Backup Automation

| | |
|---|---|
| **Module** | Deployment & Infrastructure |
| **Impact** | Data loss is unrecoverable — client records, revenue history, appointments |
| **Effort** | 1 day |

**What is broken:** The PostgreSQL data volume (`postgres_data`) is persistent across container rebuilds but has no automated backup. A VPS failure, accidental `docker volume rm`, or database corruption would permanently destroy all business data.

**What needs to be built:**
- Add a backup service to `docker-compose.yml` using `postgres:16-alpine` with a daily `pg_dump` cron
- Compress and timestamp the dump: `kanishkas_backup_YYYY-MM-DD.sql.gz`
- Upload to an off-site location: AWS S3, Backblaze B2, or Google Cloud Storage
- Retain the last 30 daily backups, rotate older ones automatically
- Send a daily backup confirmation email to the admin via Resend
- Alternatively: use Supabase or Neon.tech as managed PostgreSQL with built-in backup

### 3.4 Prisma Migrate on Deploy

| | |
|---|---|
| **Module** | Deployment & Infrastructure |
| **Impact** | Schema changes cause app crash on every deploy |
| **Effort** | 1 day |

**What is broken:** The Dockerfile does not run `prisma migrate deploy`. After any schema change and rebuild, the running database and the app's expected schema will be out of sync, causing Prisma to throw errors on every database query.

**What needs to be built:**
- Create an `entrypoint.sh` script: run `npx prisma migrate deploy`, then `exec node server.js`
- Update the Dockerfile runner stage to use `ENTRYPOINT ["/app/entrypoint.sh"]`
- The `migrate deploy` command is idempotent — safe to run on every startup
- Also add a `db:reset` make target for development resets

---

## 4. Priority 3 — Medium Impact (Second Sprint)

These 3 items are visible product gaps that affect trust and usability but will not cause immediate failures.

### 4.1 Client Notifications Inbox Page

| | |
|---|---|
| **Module** | Client Dashboard |
| **Effort** | 1 day |

**What is broken:** In-app notifications are correctly created via `prisma.notification.create()` for every major event (appointment created, order placed, loyalty earned). The `GET /api/notifications` endpoint exists. There is no `/dashboard/client/notifications` page — clients have nowhere to read their notifications.

**What needs to be built:**
- Create `/dashboard/client/notifications` page
- Fetch from `GET /api/notifications` (already built)
- Display notifications grouped by date with read/unread state
- Call `PATCH /api/notifications/:id` on click to mark as read
- Add a notification bell icon with unread count badge to the client dashboard header

### 4.2 Owner Response to Reviews

| | |
|---|---|
| **Module** | Reviews & Moderation |
| **Effort** | 1 day |

**What is broken:** The `Review` model has `ownerResponse` and `respondedAt` fields in the schema. The `PATCH /api/reviews` endpoint only handles `approve` and `reject` actions — no action handler for adding an `ownerResponse` exists.

**What needs to be built:**
- Add a `'respond'` action to the `PATCH /api/reviews` handler
- Accepts `ownerResponse` string, sets `respondedAt: new Date()`
- Restricted to OWNER and ADMIN roles
- Display `ownerResponse` below the review on the public website
- Add 'Add Response' button to the admin review moderation page

### 4.3 WhatsApp Webhook Implementation

| | |
|---|---|
| **Module** | Notification Engine |
| **Effort** | 4 days |

**What is broken:** The `/api/webhooks/whatsapp` directory exists but contains no route handler. For an Indian salon, WhatsApp is the primary client communication channel — more used than email.

**What needs to be built:**
- Implement the `POST /api/webhooks/whatsapp` route handler
- Verify Twilio webhook signature for security
- Parse inbound WhatsApp message body
- Support basic commands: `'BOOK'`, `'STATUS'`, `'CANCEL'` to check or modify appointments
- Send WhatsApp confirmation messages via Twilio when appointments are created or updated
- Add WhatsApp as a notification channel option alongside SMS

---

## 5. Dashboard-Specific Work Items

### 5.1 Client Dashboard

| Missing Feature | Priority | Fix Required |
|---|:---:|---|
| No 'Leave a Review' CTA after appointments | P2 | Add review prompt card when appointment status = COMPLETED |
| No notifications inbox page | P3 | Create `/dashboard/client/notifications` (covered in 4.1) |
| Client cannot cancel their own orders | P3 | Add cancel button + PATCH handler restricted to PENDING status |
| No server-side password validation at registration | P1 | Add Zod password schema to `/api/auth/register` |

### 5.2 Receptionist Dashboard

| Missing Feature | Priority | Fix Required |
|---|:---:|---|
| Cannot manage product sales / orders | P2 | Add `manageOrders` to RECEPTIONIST permission set, link orders page |
| Cannot view revenue | P3 | Add a read-only today's revenue card to receptionist dashboard |
| No quick 'New Walk-In' shortcut on dashboard | P3 | Add prominent walk-in booking widget on dashboard home |

### 5.3 Owner Dashboard

| Missing Feature | Priority | Fix Required |
|---|:---:|---|
| No staff performance analytics | P2 | Build staff analytics page (covered in 3.2) |
| Loyalty management not accessible | P2 | Add loyalty rules page to owner dashboard; move loyalty-approvals link |
| Business settings inaccessible (admin-only) | P3 | Move basic settings (hours, SMS templates) to owner access level |
| No academy enrollment detail view | P3 | Link `/admin/academy/enrollments` from owner dashboard |

### 5.4 Admin Dashboard

| Missing Feature | Priority | Fix Required |
|---|:---:|---|
| Gift Vouchers card links to `/admin/users` (wrong) | P2 | Create `/admin/vouchers` page; fix navigation link |
| Review moderation page not linked in dashboard nav | P2 | Add Reviews card linking to `/admin/reviews` on the admin dashboard |
| No rate limiting on any API endpoint | P2 | Add `next-rate-limit` or `@upstash/ratelimit` to sensitive endpoints |
| No monitoring / alerting | P2 | Integrate Sentry (error tracking) or BetterStack (uptime + logs) |

---

## 6. API Architecture — Consistency Fixes

The API layer is functionally solid but has consistency issues that create maintenance overhead. These are not user-facing bugs but will slow down future development.

### 6.1 Inconsistent Response Format

| | |
|---|---|
| **Problem** | ~40% of APIs use raw `NextResponse.json()` instead of `apiSuccess`/`apiError` helpers |
| **Affected** | `/api/analytics/revenue`, `/api/staff`, `/api/activity-logs`, `/api/admin-reviews`, and others |
| **Fix** | Refactor to use `apiSuccess({ data })` and `apiError(code, message)` from `api-utils.ts` uniformly |
| **Effort** | 2 days |

### 6.2 Non-RESTful Appointment PATCH

| | |
|---|---|
| **Problem** | `PATCH /api/appointments` uses `id` in request body instead of URL param `/api/appointments/:id` |
| **Fix** | Move to `/api/appointments/[id]/route.ts` with `id` as URL segment |
| **Effort** | 1 day |

### 6.3 Missing Rate Limiting

| | |
|---|---|
| **Problem** | No rate limiting on any endpoint. The login endpoint is vulnerable to brute force attacks. |
| **Fix** | Add `@upstash/ratelimit` to `/api/auth/[...nextauth]` login, `/api/contact`, and `/api/auth/register` |
| **Effort** | 1 day |

### 6.4 Missing Zod Validation on GET Query Params

| | |
|---|---|
| **Problem** | Some GET endpoints parse query params without Zod validation — malformed params cause unhandled errors |
| **Affected** | `/api/analytics/revenue`, `/api/staff`, `/api/activity-logs` |
| **Fix** | Add Zod `.parse()` on `searchParams` at the top of each GET handler |
| **Effort** | 1 day |

---

## 7. Full Fix Roadmap — Effort & Sequencing

| # | Fix Item | Priority | Effort | Module | Status |
|:---:|---|:---:|:---:|---|:---:|
| 1 | Fix account deactivation check | P1 | 0.5 days | Auth | TODO |
| 2 | Remove / fix Google OAuth button | P1 | 1 day | Auth | TODO |
| 3 | Build password reset flow | P1 | 2 days | Auth | TODO |
| 4 | Add server-side password validation | P1 | 0.5 days | Auth | TODO |
| 5 | Add prisma migrate deploy to startup | P2 | 1 day | Infra | TODO |
| 6 | Add automated database backups | P2 | 1 day | Infra | TODO |
| 7 | Add appointment reminder cron | P2 | 2 days | Notifications | TODO |
| 8 | Automate loyalty point earning | P1 | 2 days | Loyalty | TODO |
| 9 | Implement auto tier upgrades | P1 | 1 day | Loyalty | TODO |
| 10 | Build slot availability API | P1 | 5 days | Booking | TODO |
| 11 | Enforce business hours in booking | P1 | 1 day | Booking | TODO |
| 12 | Add manageOrders to receptionist | P2 | 0.5 days | RBAC | TODO |
| 13 | Fix Gift Vouchers admin nav link | P2 | 0.5 days | Admin | TODO |
| 14 | Add Reviews card to admin dashboard | P2 | 0.5 days | Admin | TODO |
| 15 | Build client notifications inbox | P3 | 1 day | Client | TODO |
| 16 | Add 'Leave Review' CTA post-appt | P2 | 1 day | Client | TODO |
| 17 | Add owner response to reviews API | P3 | 1 day | Reviews | TODO |
| 18 | Build staff analytics page (owner) | P2 | 5 days | Owner | TODO |
| 19 | Add rate limiting to auth endpoints | P2 | 1 day | API | TODO |
| 20 | Standardise API response format | P2 | 2 days | API | TODO |
| 21 | Implement WhatsApp webhook | P3 | 4 days | Notifications | TODO |
| 22 | Integrate Razorpay payment gateway | P1 | 14 days | Payments | TODO |
| 23 | Add monitoring (Sentry / BetterStack) | P2 | 1 day | Infra | TODO |
| 24 | Mobile responsiveness testing | P2 | 3 days | Frontend | TODO |
| | **TOTAL ESTIMATED EFFORT** | | **~51 days** | | |

### Recommended Sprint Plan

| Sprint | Duration | Work Items |
|---|---|---|
| **Sprint 1** | ~2 weeks | Items 1–11: All P1 critical blockers. Platform is safe to demo to real clients after this sprint. |
| **Sprint 2** | ~2 weeks | Items 12–20: P2 high-impact fixes. Receptionist can handle product sales, owner has staff analytics, monitoring is active. |
| **Sprint 3** | ~1.5 weeks | Items 21–24: P3 polish items + WhatsApp + Razorpay gateway. Platform is fully production-grade. |

---

## 8. Platform Strengths — What Is Already Production-Grade

These areas require no work and already meet or exceed industry standard. They represent genuine competitive advantages.

| Area | Why It Leads |
|---|---|
| **Content CMS & Media Manager** | Full SEO blog (auto-slug, reading time, seoTitle/Description/Keywords, ogImage), photo gallery with 8 categories, hero slide drag-to-reorder, site image manager. Fresha and Vagaro have none of this. |
| **Academy Module** | Unique in the market. ENQUIRY→ENROLLED→ACTIVE→COMPLETED pipeline, JSON curriculum, certificate flag, offline consultative enrollment. Fits Indian salon-academy hybrid model perfectly. |
| **Image Pipeline** | WebP quality 82, smart-crop 400×400 thumbnails, EXIF stripping, path traversal protection, 1-year immutable cache headers, `VIPS_CONCURRENCY=1` Alpine fix. Production-hardened. |
| **Indian Market Fit** | 18% GST calculation, Indian pincode validation, offline UPI/cash/card model, rupee denomination, SMS-first notifications. Purpose-built where generic SaaS fails. |
| **Walk-in Flow** | Auto-creates guest user with synthetic email. Practical for Indian salons where walk-ins are ~60% of business. Elegant and correct. |
| **E-Commerce Transactions** | Order creation runs stock decrement + payment + loyalty deduction + voucher redemption in a single atomic Prisma transaction. No partial state bugs possible. |
| **RBAC System** | Two-layer system (static + dynamic DB-backed with TTL cache). Per-user overrides, auto-seeds defaults on empty DB. Secure and extensible. |
| **Activity Logging** | Nearly every mutation creates an `ActivityLog` entry. Full audit trail is built-in. Most vibe-coded platforms skip this entirely. |

---

## 9. Final Verdict for elv1labs

| | |
|---|---|
| **What it is** | A feature-rich, offline-first salon management platform with a polished public website, 4 role-based dashboards, comprehensive admin tools, and a realistic Indian-market design. The 857-line schema demonstrates serious architectural thinking that goes well beyond typical vibe-coded projects. |
| **What it isn't** | A fully automated operational platform. The loyalty programme is manual, slot availability is unenforced, reminders are unscheduled, tier upgrades don't auto-fire, and there is no payment gateway. These are not missing features — they are disconnected wires. |
| **True completion** | 75% production-ready. The remaining 25% is operationalisation, not new building. |
| **vs Industry** | Leads Fresha/Vagaro on CMS, Academy, and Indian market fit. Trails on booking reliability, payment, loyalty automation, and mobile polish. Competitive moat is domain specificity, not feature volume. |
| **Time to 95%** | ~51 working days across 3 sprints. Sprint 1 alone (P1 fixes, ~2 weeks) makes the platform safe for real clients. |

---

### elv1labs Positioning Statement (from this audit)

> *We build custom platforms for businesses with non-standard models — the ones that generic SaaS forces into painful workarounds. You get a platform that fits your business, not a business that has to fit the platform.*

Kanishka's is the proof-of-concept for exactly this thesis. The academy module, the Indian GST logic, the walk-in flow, the content CMS — none of these exist in Fresha or Vagaro. They exist here because the platform was built for a specific business, not a generic market segment. **That is the elv1labs differentiator.**