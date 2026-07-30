# FoodHub Platform - Production Authentication & Security Specifications

**Document Version:** 1.0.0-PROD  
**Phase:** Phase 3 (Authentication & Authorization Engine)  

---

## 1. MULTI-TENANT AUTHENTICATION MATRIX

FoodHub enforces role-tailored authentication flows across all 7 user personas:

| User Persona | Role Enum | Auth Strategy | Required Credentials | 2FA Required? |
| :--- | :--- | :--- | :--- | :--- |
| **Customer** | `CUSTOMER` | Phone OTP | `phone`, `otp` | No (Passwordless) |
| **Merchant Owner** | `RESTAURANT_OWNER` | Phone + Password | `phone`, `password` | No |
| **Store Manager** | `RESTAURANT_MANAGER` | Phone + Password | `phone`, `password` | No |
| **Kitchen Staff** | `RESTAURANT_STAFF` | Phone + Password | `phone`, `password` | No |
| **Delivery Courier** | `DELIVERY_PARTNER` | Phone + Password | `phone`, `password` | No |
| **Customer Support** | `SUPPORT` | Phone + Password | `phone`, `password` | No |
| **Finance Officer** | `FINANCE` | Phone + Password | `phone`, `password` | No |
| **Platform Admin** | `ADMIN` | Phone + Password + 2FA | `phone`, `password`, `otp` | **Yes (Required)** |
| **Super Admin** | `SUPER_ADMIN` | Phone + Password + 2FA | `phone`, `password`, `otp` | **Yes (Required)** |

---

## 2. SEQUENCE FLOW DIAGRAMS

### 2.1 Customer Passwordless OTP Flow
```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer App
    participant API as NestJS Gateway
    participant OTP as OtpService
    participant DB as PostgreSQL DB
    participant MSG as MSG91 SMS Gateway

    Customer->>API: POST /auth/send-otp { phone: "+919876543210" }
    API->>OTP: sendOtp(phone)
    OTP->>DB: Check 60s cooldown limit
    OTP->>OTP: Generate 4-digit OTP & BCrypt Hash
    OTP->>DB: Store hashed OTP in `otps` table (10m expiry)
    OTP->>MSG: Dispatch SMS payload to user phone
    API-->>Customer: 200 OK { message: "OTP sent", cooldownSec: 60 }

    Customer->>API: POST /auth/verify-otp { phone, otp: "4819" }
    API->>OTP: verifyOtp(phone, rawOtp)
    OTP->>DB: Fetch latest unexpired OTP record
    OTP->>OTP: BCrypt compare(rawOtp, record.otpHash)
    OTP->>DB: Mark `isUsed: true`
    API->>DB: Create session & issue 15m JWT Access + 7d Refresh Token
    API-->>Customer: 200 OK { user, tokens }
```

### 2.2 Refresh Token Rotation Flow
```mermaid
sequenceDiagram
    autonumber
    actor Client as Web Dashboard / PWA
    participant API as NestJS Gateway
    participant Token as TokenService
    participant DB as PostgreSQL DB

    Client->>API: POST /auth/refresh { refreshToken }
    API->>Token: rotateRefreshToken(oldRefreshToken)
    Token->>Token: Verify JWT signature & expiration
    Token->>DB: Lookup hashed token record in `refresh_tokens`
    Token->>DB: Mark old token `isRevoked: true`
    Token->>Token: Mint new 15m Access Token & 7d Refresh Token
    Token->>DB: Store new hashed Refresh Token
    API-->>Client: 200 OK { accessToken, refreshToken, expiresInSec: 900 }
```

---

## 3. RBAC SECURITY MATRIX & DECORATORS

### 3.1 Role Guard Usage Example
```typescript
@Controller('admin/merchants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminMerchantController {
  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getMerchantList() {
    // Only Admin & SuperAdmin allowed
  }
}
```

### 3.2 Granular Permission Guard Usage Example
```typescript
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UserManagementController {
  @Post()
  @RequirePermissions('users:write')
  async createUser() {
    // Requires explicit 'users:write' permission in DB
  }
}
```

---

## 4. API ENDPOINTS REFERENCE SUMMARY

| Endpoint Method & Path | Auth Required | Description |
| :--- | :--- | :--- |
| `POST /api/v1/auth/send-otp` | Public | Send 4-digit SMS OTP (60s cooldown, 10m expiry). |
| `POST /api/v1/auth/verify-otp` | Public | Verify OTP and return JWT access/refresh tokens. |
| `POST /api/v1/auth/login` | Public | Password login for Merchant/Courier/Admin (Triggers 2FA for Admin). |
| `POST /api/v1/auth/logout` | Bearer JWT | Terminate current device session. |
| `POST /api/v1/auth/logout-all` | Bearer JWT | Terminate all active device sessions across all platforms. |
| `POST /api/v1/auth/refresh` | Public | Rotate 7-day Refresh Token and return new 15m Access Token. |
| `POST /api/v1/auth/forgot-password` | Public | Request password reset SMS OTP. |
| `POST /api/v1/auth/reset-password` | Public | Verify reset OTP and update account password (enforces security policy). |
| `POST /api/v1/auth/change-password` | Bearer JWT | Update password for authenticated user. |
| `GET /api/v1/auth/profile` | Bearer JWT | Fetch user identity and profile details. |
| `PATCH /api/v1/auth/profile` | Bearer JWT | Update profile details (first name, last name, avatar URL). |
| `GET /api/v1/auth/sessions` | Bearer JWT | List all active login sessions for user. |
| `DELETE /api/v1/auth/session/:id` | Bearer JWT | Revoke specific device session by UUID. |
