# FoodHub — Phase 17 & Phase 18 Engineering & Security Guide

**Reports & Analytics · Platform Security Hardening & Performance Optimization**

---

## PHASE 17 — REPORTS & ANALYTICS

### Architecture

```
Frontends (Admin, Hotel, Delivery Dashboards)
  │
  ├─ Admin BI Dashboard (/analytics)  ──► GET /api/v1/analytics/admin
  ├─ Admin Reports Center (/reports)  ──► GET /api/v1/analytics/sales, export CSV
  ├─ Restaurant Analytics (/analytics) ──► GET /api/v1/analytics/restaurant/:id
  ├─ Driver Performance (/analytics)   ──► GET /api/v1/analytics/driver/:id
  └─ Customer Profile Stats           ──► GET /api/v1/analytics/customer
```

### API Endpoints

| Method | Endpoint | Description | Guard / Role |
|---|---|---|---|
| `GET` | `/api/v1/analytics/admin` | Full platform KPI dashboard & peak hour | `JwtAuthGuard` + `ADMIN` |
| `GET` | `/api/v1/analytics/admin/revenue` | Daily revenue breakdown | `JwtAuthGuard` + `ADMIN` |
| `GET` | `/api/v1/analytics/restaurant/:id` | Restaurant sales, top items & prep time | `JwtAuthGuard` |
| `GET` | `/api/v1/analytics/driver/:id` | Driver earnings, acceptance & completion rates | `JwtAuthGuard` |
| `GET` | `/api/v1/analytics/customer` | Customer order count, total spend & fav rest | `JwtAuthGuard` |
| `GET` | `/api/v1/analytics/sales` | Filtered sales report by date range | `JwtAuthGuard` + `ADMIN` |
| `GET` | `/api/v1/analytics/export` | Export CSV (`orders`, `revenue`, `customers`, `restaurants`) | `JwtAuthGuard` + `ADMIN` |

---

## PHASE 18 — SECURITY & HARDENING

### Security Controls Implemented

1. **Helmet HTTP Headers (`main.ts`)**:
   - `Content-Security-Policy` enabled in production
   - `X-Frame-Options: SAMEORIGIN`
   - `X-Content-Type-Options: nosniff`
   - `Strict-Transport-Security` (HSTS)
   - `Referrer-Policy: no-referrer-when-downgrade`

2. **Global Exception Filter (`GlobalHttpExceptionFilter`)**:
   - Catches all exceptions globally
   - Enforces uniform JSON structure:
     ```json
     {
       "statusCode": 400,
       "error": "Bad Request",
       "message": "Validation failed",
       "requestId": "c1a2b3c4-d5e6-47a8-b9c0-112233445566",
       "timestamp": "2026-07-30T07:50:00.000Z",
       "path": "/api/v1/orders"
     }
     ```

3. **Request Correlation Tracing (`RequestIdInterceptor`)**:
   - Generates or propagates `X-Request-ID` header on every request/response
   - Correlates frontend actions with backend logger traces

4. **Response Data Sanitization (`ResponseSanitizeInterceptor`)**:
   - Strips sensitive properties (`passwordHash`, `refreshTokenHash`, `otpHash`, `secretKey`) from output objects recursively.

5. **File Upload Security Guard (`FileUploadValidationGuard`)**:
   - Restricts MIME types to `image/jpeg`, `image/png`, `image/webp`, `application/pdf`
   - Enforces 5MB max payload size limit
   - Sanitizes filenames against directory traversal and special chars

6. **Hardened CORS Whitelist (`main.ts`)**:
   - Restricts origins to configured domain whitelist (`process.env.ALLOWED_ORIGINS`)
   - Rejects unauthorized origins dynamically

7. **Gzip / Brotli Compression (`main.ts`)**:
   - `compression()` middleware compresses JSON payloads > 1KB reducing bandwidth by up to 70%

---

## SYSTEM HEALTH & MONITORING (`/health`)

| Endpoint | Probe Type | Description |
|---|---|---|
| `GET /health` | Liveness | Basic API uptime, RSS & Heap memory stats |
| `GET /health/db` | Sub-check | Executes `SELECT 1` on PostgreSQL via Prisma |
| `GET /health/redis` | Sub-check | Sets and reads test key in Redis Cache |
| `GET /health/ready` | Readiness | Combined DB + Redis readiness probe for Kubernetes |

---

## VERIFICATION REPORT

```
pnpm --filter backend type-check   ✅  0 errors
pnpm type-check                    ✅  17/17 successful
pnpm build                         ✅  11/11 successful
```
