# FoodHub — Phase 14 / 15 / 16 Engineering Guide

**Maps & Geolocation · Wallet/Coupons/Referral · Reviews & Ratings**

---

## PHASE 14 — MAPS & GEOLOCATION

### Architecture

```
Customer Browser
  └─ AddressPickerMap (Leaflet / OpenStreetMap)
       ├─ Nominatim search → GET /api/v1/geo/search?q=
       ├─ Drag marker    → GET /api/v1/geo/reverse?lat=&lng=
       └─ Confirm Address

Delivery Tracking
  └─ DeliveryRouteMap
       ├─ Restaurant marker 🍽
       ├─ Driver marker 🛵  (live via Socket.IO)
       └─ Customer marker 🏠

Home Page
  └─ NearbyRestaurantsMap
       └─ GET /api/v1/geo/nearby-restaurants?lat=&lng=&radius=
```

### API Endpoints

| Method | Endpoint                                           | Description                          | Auth |
| ------ | -------------------------------------------------- | ------------------------------------ | ---- |
| `GET`  | `/api/v1/geo/search?q=`                            | Forward geocoding via Nominatim OSM  | None |
| `GET`  | `/api/v1/geo/reverse?lat=&lng=`                    | Reverse geocoding                    | None |
| `GET`  | `/api/v1/geo/distance?fromLat&fromLng&toLat&toLng` | Haversine distance + ETA             | None |
| `GET`  | `/api/v1/geo/nearby-restaurants?lat&lng&radius`    | Restaurants near location            | None |
| `GET`  | `/api/v1/geo/nearby-drivers?lat&lng`               | Available drivers near location      | JWT  |
| `POST` | `/api/v1/geo/validate-radius`                      | Check delivery address within radius | None |

### Haversine Formula

```
d = 2R · arcsin( √(sin²(Δlat/2) + cos(lat₁)·cos(lat₂)·sin²(Δlng/2)) )
R = 6371 km
ETA = ⌈ distance / 20 km·h⁻¹ × 60 ⌉  minutes
```

### Delivery Radius Validation Flow

```
POST /api/v1/geo/validate-radius
  { restaurantId, deliveryLat, deliveryLng }
    ↓
  Fetch restaurant {lat, lng, deliveryRadius} from DB
    ↓
  Haversine(restaurantLat, restaurantLng, deliveryLat, deliveryLng)
    ↓
  { valid: distance ≤ deliveryRadius, distanceKm, radiusKm }
```

---

## PHASE 15 — WALLET, COUPONS & REFERRALS

### Referral Flow

```
New User Registers
  └─ GET /api/v1/referrals/my-code
       └─ GenerateCode() → "FH-A3BK9Z"  [stored in users.referral_code]

User Posts Code to Friend
  └─ Friend: POST /api/v1/referrals/apply  { code: "FH-A3BK9Z" }
       ├─ Guard: code exists
       ├─ Guard: not self-referral
       ├─ Guard: referral not already used (referrals.referee_id unique)
       ├─ WalletService.credit(referrerId, ₹50, "Referral reward")
       └─ WalletService.credit(refereeId,  ₹30, "Welcome bonus")
```

**Fraud Guards**:

- `users.referral_code @unique` — no duplicate codes
- `referrals.referee_id @unique` — one referral per new user
- `referrer.id === referee.id` → 400 Bad Request

### Coupon Validation Engine

```
ValidateCoupon(code, customerId, subtotal)
  1. Coupon exists & status = ACTIVE           → else "invalid"
  2. now ≥ validFrom                           → else "not yet active"
  3. now ≤ validTill                           → else "expired"
  4. subtotal ≥ minOrderVal                    → else "minimum order ₹X required"
  5. CouponUsage.count(couponId, customerId) < 1 → else "already used"
  6. CouponUsage.count(couponId) < usageLimit  → else "limit reached"
  7. Calculate discount:
       FLAT:       min(discountVal, subtotal)
       PERCENTAGE: min(subtotal × rate%, maxDiscount)
  → { valid: true, discountAmount, couponId }
```

**Best-Coupon Suggestion Algorithm**:

- Iterates all ACTIVE coupons ordered by `discountVal DESC`
- Runs `validateCoupon` on each
- Returns the highest `discountAmount` among valid coupons

### Loyalty Tier Logic

| Tier     | Required Points |
| -------- | --------------- |
| SILVER   | 0 – 499         |
| GOLD     | 500 – 1999      |
| PLATINUM | 2000+           |

Points: 1 point per ₹10 spent (to be implemented in order completion hook).

---

## PHASE 16 — REVIEWS & RATINGS

### Eligibility Rules (enforced in service layer)

```
createRestaurantReview(userId, dto)
  1. order.customerId == customer.id         → else 403 Forbidden
  2. order.status == DELIVERED               → else 400 "delivered orders only"
  3. restaurantReview.unique(orderId+customerId) → else 409 Conflict
```

### Wilson Score Lower Bound

Used to produce a confidence-adjusted rating that rewards volume:

```
p̂ = average_rating / 5
z = 1.96 (95% confidence)
lower = (p̂ + z²/2n − z·√((p̂(1−p̂) + z²/4n)/n)) / (1 + z²/n)
displayRating = lower × 5   (in range [0, 5])
```

A restaurant with 3×5-star ratings scores lower than one with 300×4.5-star ratings.

### API Endpoints

| Method  | Endpoint                         | Description                         | Auth      |
| ------- | -------------------------------- | ----------------------------------- | --------- |
| `POST`  | `/api/v1/reviews/restaurant`     | Submit restaurant review            | JWT       |
| `POST`  | `/api/v1/reviews/food`           | Submit food item review             | JWT       |
| `POST`  | `/api/v1/reviews/driver`         | Submit driver review                | JWT       |
| `GET`   | `/api/v1/reviews/restaurant/:id` | List restaurant reviews (paginated) | None      |
| `POST`  | `/api/v1/reviews/:id/vote`       | Helpful / not-helpful vote          | JWT       |
| `POST`  | `/api/v1/reviews/:id/report`     | Report a review                     | JWT       |
| `POST`  | `/api/v1/reviews/:id/reply`      | Owner or admin reply                | JWT       |
| `PATCH` | `/api/v1/reviews/:id/moderate`   | Hide or delete (admin only)         | JWT+ADMIN |

### Moderation Flow

```
report_review(reviewId, userId, reason)
  → ReviewReport.create

moderate_review(reviewId, { action: 'HIDE' })
  → RestaurantReview.update({ isHidden: true })
  → updateRestaurantRating() — recomputes Wilson score excluding hidden reviews

moderate_review(reviewId, { action: 'DELETE' })
  → RestaurantReview.delete
  → updateRestaurantRating()
```

---

## NEW SCHEMA MODELS (Phase 14-16)

| Model            | Purpose                                      |
| ---------------- | -------------------------------------------- |
| `ReviewVote`     | Helpful/unhelpful vote per user per review   |
| `ReviewReport`   | User-reported reviews pending moderation     |
| `ReviewReply`    | Owner/admin text reply to a review           |
| `CustomerPoints` | Loyalty points + tier (SILVER/GOLD/PLATINUM) |

### Schema Field Additions

| Model              | Field                                | Purpose                         |
| ------------------ | ------------------------------------ | ------------------------------- |
| `User`             | `referralCode String? @unique`       | Phase 15 referral engine        |
| `Restaurant`       | `deliveryRadius Float @default(5.0)` | Phase 14 radius validation      |
| `RestaurantReview` | `isAnonymous Boolean`                | Phase 16 anonymous reviews      |
| `RestaurantReview` | `isHidden Boolean`                   | Phase 16 moderation             |
| `RestaurantReview` | `@@unique([orderId, customerId])`    | One review per order constraint |

---

## MAP COMPONENTS

| Component              | Location                       | Description                                 |
| ---------------------- | ------------------------------ | ------------------------------------------- |
| `AddressPickerMap`     | `customer-web/components/map/` | Draggable Leaflet marker + Nominatim search |
| `NearbyRestaurantsMap` | `customer-web/components/map/` | Restaurant pins on OSM                      |
| `DeliveryRouteMap`     | `customer-web/components/map/` | Route polyline with driver live position    |

All components use `import('leaflet')` dynamically (no SSR) and OpenStreetMap tiles.
