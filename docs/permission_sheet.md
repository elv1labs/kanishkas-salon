# Kanishka's Salon — Role Permission Sheet

## Roles Overview

There are **4 roles** in this system: `ADMIN`, `OWNER`, `RECEPTIONIST`, and `CLIENT`.

---

## Dashboard Access (Route-Level)

| Route | ADMIN | OWNER | RECEPTIONIST | CLIENT |
|---|:---:|:---:|:---:|:---:|
| `/admin/*` | ✅ | ❌ | ❌ | ❌ |
| `/dashboard/owner/*` | ✅ | ✅ | ❌ | ❌ |
| `/dashboard/receptionist/*` | ✅ | ✅ | ✅ | ❌ |
| `/dashboard/client/*` | ✅ | ✅ | ✅ | ✅ |

> Admins can access every dashboard area. Each role is automatically redirected to their own dashboard on login.

---

## Feature Permissions (`hasPermission()`)

| Permission | ADMIN | OWNER | RECEPTIONIST | CLIENT |
|---|:---:|:---:|:---:|:---:|
| `manageUsers` — Create/edit/deactivate all users | ✅ | ❌ | ❌ | ❌ |
| `manageSettings` — Edit business settings | ✅ | ❌ | ❌ | ❌ |
| `viewAnalytics` — View revenue & reports | ✅ | ✅ | ❌ | ❌ |
| `manageProducts` — Add/edit/remove products | ✅ | ✅ | ❌ | ❌ |
| `manageOrders` — View & process shop orders | ✅ | ✅ | ❌ | ❌ |
| `manageContent` — Edit CMS / site content | ✅ | ✅ | ❌ | ❌ |
| `manageAppointments` — Book/cancel/edit any appointment | ✅ | ✅ | ✅ | ❌ |
| `manageClients` — View & manage client profiles | ✅ | ✅ | ✅ | ❌ |
| `manageBlog` — Manage all blog posts | ✅ | ✅ | ✅ | ❌ |
| `createBlog` — Author own blog posts | ✅ | ✅ | ✅ | ❌ |
| `manageGallery` — Upload/manage gallery | ✅ | ✅ | ✅ | ❌ |
| `createGallery` — Upload to gallery | ✅ | ✅ | ✅ | ❌ |
| `bookAppointments` — Reserve appointments for self | ❌ | ❌ | ❌ | ✅ |
| `placeOrders` — Buy products from shop | ❌ | ❌ | ❌ | ✅ |
| `viewOwnData` — View own profile, orders, loyalty | ❌ | ❌ | ❌ | ✅ |

---

## Role Summaries & Accounts

| Role | Email(s) | Summary |
|---|---|---|
| **ADMIN** | `kanishkasen100@gmail.com` | Full superuser — can access and manage everything |
| **OWNER** | `priya.s@kanishkas.in` | Operations manager — analytics, products, orders, content |
| **RECEPTIONIST** | `neha.g@kanishkas.in`, `aarti.j@kanishkas.in` | Front-desk — appointments, clients, blog, gallery |
| **CLIENT** | All other accounts | Self-service — book appointments, shop, view own data |

---

## Account Status Notes

- **Inactive accounts** (`isActive: false`) are blocked from login entirely, regardless of role.
- Currently only **Pooja Verma** (`pooja.v@yahoo.com`) is seeded as inactive.
