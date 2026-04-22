# 📚 Kanishka's Family Salon & Academy — Documentation Index

> **Platform:** Full-stack Next.js 14 PWA  
> **Business:** Kanishka's Family Salon & Academy, Indore, MP  
> **Server:** `168.231.121.107` · Docker + Nginx · Port 3001  
> **Live via:** `https://kanishkas.elv1labs.store` _(VPS — domain pending final DNS)_  
> **Last Updated:** April 11, 2026

---

## 📄 Documentation Files

| Document | Location | Purpose | Audience |
|----------|----------|---------|---------| 
| **Project Map** | [`docs/PROJECT_MAP.md`](./PROJECT_MAP.md) | Complete route map, DB models, components, API endpoints, completion status | Developers, Project Managers |
| **About the Project** | [`docs/ABOUT_PROJECT.md`](./ABOUT_PROJECT.md) | Business overview, tech decisions, service offerings, value generation, security | Stakeholders, New Team Members |
| **User & Client Manual** | [`docs/USER_MANUAL.md`](./USER_MANUAL.md) | How to use the platform as a client or customer, including PWA install | Clients, End Users |
| **Productivity Guide** | [`docs/PRODUCTIVITY_GUIDE.md`](./PRODUCTIVITY_GUIDE.md) | Developer workflow, patterns, backlog, deployment | Developers |
| **Deployment Guide** | [`DEPLOY.md`](../DEPLOY.md) | Server setup, PM2, Nginx, SSL, health checks | DevOps, Developers |
| **Dashboard Status** | [`DASHBOARD_STATUS.md`](../DASHBOARD_STATUS.md) | Live vs mockup page assessment | Developers |
| **Implementation Checklist** | [`IMPLEMENTATION_CHECKLIST.md`](../IMPLEMENTATION_CHECKLIST.md) | Original feature checklist with current tick-off status | Project Managers |
| **CLAUDE.md** | [`CLAUDE.md`](../CLAUDE.md) | AI assistant context & architecture overview | AI Tools, Developers |

---

## 🚀 Quick Links for Developers

- [Environment Setup → PRODUCTIVITY_GUIDE.md#1](./PRODUCTIVITY_GUIDE.md)
- [Adding a New API Route → PRODUCTIVITY_GUIDE.md#4](./PRODUCTIVITY_GUIDE.md)
- [Dashboard Page Pattern → PRODUCTIVITY_GUIDE.md#9](./PRODUCTIVITY_GUIDE.md)
- [Auth & Role Guards → PRODUCTIVITY_GUIDE.md#7](./PRODUCTIVITY_GUIDE.md)
- [Production Deployment → DEPLOY.md](../DEPLOY.md)
- [Priority Backlog → PRODUCTIVITY_GUIDE.md#15](./PRODUCTIVITY_GUIDE.md)

---

## 🌐 Live Deployment Quick Reference

| Item | Value |
|------|-------|
| **Server IP** | `168.231.121.107` |
| **App Port** | `3001` (Next.js standalone via Docker) |
| **Proxy** | Nginx on ports 80 (HTTP→HTTPS redirect) and 443 (SSL) |
| **Process Manager** | Docker Compose (`docker compose ps` to check) |
| **Temporary HTTPS URL** | `https://kanishkas.elv1labs.store` |
| **Upload Storage** | Docker named volume `uploads_data` → `/app/public/uploads` |
| **PWA Install QR** | `public/docs/install-qr.html` |
| **Permanent domain** | Pending client approval — `kanishkassalon.com` |

> ⚠️ **Never** run `docker compose down -v` in production — this destroys the `uploads_data` volume and all uploaded images.

---

## 🗺️ Quick Links for Project Map

- [Public Website Pages → PROJECT_MAP.md](./PROJECT_MAP.md)
- [Dashboard Pages (all roles) → PROJECT_MAP.md](./PROJECT_MAP.md)
- [API Endpoints list → PROJECT_MAP.md](./PROJECT_MAP.md)
- [Database Models → PROJECT_MAP.md](./PROJECT_MAP.md)
- [Current Completion Status → PROJECT_MAP.md](./PROJECT_MAP.md)

---

## 👤 Quick Links for User Manual

- [Installing the App (PWA) → USER_MANUAL.md](./USER_MANUAL.md)
- [Creating an Account → USER_MANUAL.md](./USER_MANUAL.md)
- [Booking an Appointment → USER_MANUAL.md](./USER_MANUAL.md)
- [Shopping for Products → USER_MANUAL.md](./USER_MANUAL.md)
- [Loyalty Programme → USER_MANUAL.md](./USER_MANUAL.md)
- [FAQs → USER_MANUAL.md](./USER_MANUAL.md)

---

## 📱 PWA & App Distribution

The platform is a **Progressive Web App (PWA)** — no App Store needed.

| Platform | Install Method |
|----------|---------------|
| **Android** | Chrome → Menu ⋮ → Add to Home Screen → App |
| **iPhone** | Safari → Share → Add to Home Screen |

**QR Code cards for in-salon printing:** [`public/docs/install-qr.html`](../public/docs/install-qr.html)  
**Bare QR image:** [`public/docs/qr-install.png`](../public/docs/qr-install.png)

> When the domain is live with real HTTPS (Let's Encrypt), an **Android APK** can be generated using Bubblewrap (Google TWA) for direct distribution or Play Store upload.
