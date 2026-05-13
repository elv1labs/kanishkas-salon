# Kanishka's Family Salon & Academy — API Documentation

> **Base URL**: `https://kanishkassalon.com/api`  
> **Version**: 1.0.0  
> **Authentication**: NextAuth.js JWT sessions  

---

## Overview

This REST API powers the Kanishka's Family Salon & Academy platform. All responses follow a standardized envelope format:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-04-26T12:00:00.000Z",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Error Responses

All errors follow RFC 7807 Problem Details:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Service not found",
    "details": { ... }
  },
  "meta": {
    "requestId": "req_xyz789",
    "timestamp": "2026-04-26T12:00:00.000Z"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400/422 | Request body/params failed validation |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `DATABASE_ERROR` | 500 | Database operation failed |

### Rate Limiting

All API routes include rate limit headers:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests per window |
| `X-RateLimit-Remaining` | Remaining requests in window |
| `X-RateLimit-Reset` | Unix timestamp when window resets |
| `X-Request-Id` | Unique request identifier for tracing |

### Authentication

Most endpoints require a valid NextAuth.js session. Session is obtained via:
- **Credentials login**: `POST /api/auth/callback/credentials`
- **Google OAuth**: `GET /api/auth/signin/google`

Role-based access: `CLIENT`, `RECEPTIONIST`, `OWNER`, `ADMIN`

---

## Endpoints

### 🏥 Health

#### `GET /api/health`
Health check endpoint. No authentication required.

**Response** `200 OK`:
```json
{
  "success": true,
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-04-26T12:00:00.000Z"
}
```

---

### 🔐 Authentication

#### `POST /api/auth/register`
Register a new client account.

**Body**:
```json
{
  "name": "Priya Sharma",
  "email": "priya@example.com",
  "password": "SecurePass123!",
  "phone": "+919876543210"
}
```

**Response** `201 Created`

#### `POST /api/auth/forgot-password`
Initiate password reset flow.

#### `POST /api/auth/reset-password`
Complete password reset with token.

---

### 📅 Appointments

#### `GET /api/appointments`
List appointments. Clients see their own; staff see all.

**Auth**: Required  
**Query Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20, max: 100) |
| `dateFrom` | string | Filter from date (YYYY-MM-DD) |
| `dateTo` | string | Filter to date (YYYY-MM-DD) |
| `status` | enum | `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW` |
| `staffId` | string | Filter by staff member (staff only) |

**Response** `200 OK`:
```json
{
  "success": true,
  "appointments": [...],
  "pagination": { "page": 1, "limit": 20, "total": 45, "pages": 3, "hasNext": true, "hasPrev": false }
}
```

#### `POST /api/appointments`
Create a new appointment booking.

**Auth**: Required  
**Body**:
```json
{
  "serviceId": "clxyz123...",
  "staffId": "clxyz456...",
  "date": "2026-05-01",
  "startTime": "14:00",
  "notes": "Please use organic products"
}
```

Walk-in booking (Receptionist only):
```json
{
  "serviceId": "clxyz123...",
  "date": "2026-05-01",
  "startTime": "14:00",
  "isWalkin": true,
  "walkinName": "Walk-in Customer",
  "walkinPhone": "+919876543210"
}
```

**Response** `201 Created`

#### `PATCH /api/appointments`
Update appointment status or details.

**Auth**: Required (Staff: full update, Client: cancel only)  
**Body**:
```json
{
  "id": "clxyz789...",
  "status": "CONFIRMED",
  "staffId": "clxyz456..."
}
```

#### `GET /api/appointments/available-slots`
Get available time slots for a given date and service.

#### `POST /api/appointments/mark-paid`
Mark appointment payment (Staff only).

#### `POST /api/appointments/guest-book`
Book appointment as guest (no auth required).

---

### 💇 Services

#### `GET /api/services`
List salon services. Public endpoint — non-admins see only active services.

**Query Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 50) |
| `category` | enum | `HAIR_STYLING`, `SKIN_CARE`, `BRIDAL`, `NAIL_CARE`, `WAXING`, `ACADEMY` |
| `featured` | boolean | Filter featured services |
| `search` | string | Search by name, description, or tags |

**Response** `200 OK`:
```json
{
  "success": true,
  "services": [
    {
      "id": "clxyz...",
      "name": "Bridal Makeup",
      "slug": "bridal-makeup",
      "category": "BRIDAL",
      "price": 15000,
      "duration": 120,
      "isFeatured": true
    }
  ],
  "pagination": { ... }
}
```

#### `POST /api/services`
Create a new service. **Auth**: ADMIN/OWNER

#### `PATCH /api/services`
Update a service. **Auth**: ADMIN/OWNER

#### `DELETE /api/services?id=...`
Soft-delete (deactivate) a service. **Auth**: ADMIN/OWNER

---

### 🛍️ Products

#### `GET /api/products`
List products. Public endpoint.

**Query Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 12) |
| `category` | enum | Product category filter |
| `featured` | boolean | Filter featured products |
| `search` | string | Search products |
| `sortBy` | string | Sort field: `price`, `createdAt`, `name`, `stock` |
| `sortOrder` | string | `asc` or `desc` |

#### `POST /api/products`
Create product. **Auth**: ADMIN/OWNER

#### `PATCH /api/products`
Update product. **Auth**: ADMIN/OWNER

#### `DELETE /api/products?id=...`
Soft-delete product. **Auth**: ADMIN/OWNER

---

### ⭐ Reviews

#### `GET /api/reviews?serviceId=...`
Fetch published reviews for a service or product.

**Query Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| `serviceId` | string | Service ID (required if no productId) |
| `productId` | string | Product ID (required if no serviceId) |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 10) |

**Response** includes `averageRating` and `totalCount`.

#### `POST /api/reviews`
Submit a review. **Auth**: Required

#### `PATCH /api/reviews`
Moderate a review (approve/reject/respond). **Auth**: ADMIN/OWNER

---

### 📸 Gallery

#### `GET /api/gallery`
List published gallery items.

#### `POST /api/gallery`
Add gallery item. **Auth**: RECEPTIONIST+

---

### 📧 Contact

#### `POST /api/contact`
Submit contact form. Rate limited: 5/minute per IP.

#### `GET /api/contact`
List submissions. **Auth**: Staff

#### `PATCH /api/contact`
Update submission status. **Auth**: Staff

---

### 📰 Newsletter

#### `POST /api/newsletter`
Subscribe to newsletter.

---

### 👥 Staff

#### `GET /api/staff`
List active staff with profiles. Public endpoint.

---

### 📊 Analytics

#### `GET /api/analytics/revenue`
Revenue analytics. **Auth**: OWNER/ADMIN

#### `GET /api/analytics/staff`
Staff performance analytics. **Auth**: OWNER/ADMIN

#### `GET /api/analytics/retention`
Client retention metrics. **Auth**: OWNER/ADMIN

#### `GET /api/analytics/inventory`
Inventory/stock analytics. **Auth**: OWNER/ADMIN

#### `GET /api/analytics/commissions`
Staff commission analytics. **Auth**: OWNER/ADMIN

---

### 📤 Upload

#### `POST /api/upload`
Upload image file (multipart/form-data). Returns WebP-optimized URLs.

**Auth**: Required (Staff+)  
**Content-Type**: `multipart/form-data`

**Response**:
```json
{
  "imageUrl": "/api/uploads/gallery/img_1714000000.webp",
  "thumbnailUrl": "/api/uploads/gallery/thumbs/img_1714000000.webp",
  "width": 1200,
  "height": 800,
  "sizeBytes": 45230
}
```

---

### 🎓 Academy

#### `POST /api/academy/enroll`
Enroll in a course.

#### `GET /api/academy/enrollments`
List enrollments.

#### `PATCH /api/academy/enrollments/[id]/confirm`
Confirm enrollment. **Auth**: Staff

#### `PATCH /api/academy/enrollments/[id]/cancel`
Cancel enrollment.

#### `PATCH /api/academy/enrollments/[id]/mark-paid`
Mark enrollment payment. **Auth**: Staff

---

### 💰 Loyalty & Referrals

#### `GET /api/loyalty`
Get client's loyalty account and transactions.

#### `GET /api/referral`
Get referral code and referral history.

---

### 🔔 Notifications

#### `GET /api/notifications`
List user's notifications.

#### `PATCH /api/notifications`
Mark notifications as read.

---

### 🎫 Vouchers & Bundles

#### `GET /api/vouchers`
List gift vouchers.

#### `GET /api/bundles`
List service bundles.

---

### ⚙️ Admin

#### `GET /api/admin/permissions/roles`
List roles and permissions.

#### `PATCH /api/admin/permissions/users/[userId]`
Update user role. **Auth**: ADMIN

#### `GET /api/admin/hero-slides`
Manage hero slides. **Auth**: ADMIN

#### `GET /api/admin/site-images`
Manage site images. **Auth**: ADMIN

---

## Caching Strategy

| Endpoint Pattern | Cache-Control |
|-----------------|---------------|
| `/api/uploads/*` | `public, max-age=31536000, immutable` |
| `/api/(services\|products\|blog\|gallery)` | `public, s-maxage=60, stale-while-revalidate=300` |
| All other routes | No cache (dynamic) |

## Security Headers

All responses include:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
