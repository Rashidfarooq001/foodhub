# FoodHub Platform - Customer Web Application Architecture

**Document Version:** 1.0.0-PROD  
**Phase:** Phase 4 (Customer Web Application)  
**Application Port:** `3000` (Local domain: `customer.foodhub.local`)

---

## 1. COMPREHENSIVE PAGES & ROUTING MATRIX

The `customer-web` Next.js 15 App Router application implements 21 distinct customer-facing pages:

| Page Name                 | Route Path           | Description & Features                                                                                                                                    |
| :------------------------ | :------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Landing & Main Feed**   | `/`                  | Hero offer banner carousel, food categories slider, filterable nearby restaurant grid, and bestseller dishes.                                             |
| **Login & OTP**           | `/login`             | Phone + 4-digit SMS OTP verification modal with 60s cooldown timer and auto-registration.                                                                 |
| **Search**                | `/search`            | Instant search for restaurants, dishes, and cuisines with recent searches and popular tags.                                                               |
| **Categories Directory**  | `/categories`        | Full catalog of food categories (Pizza, Burgers, Biryani, Desserts, Chinese, North Indian).                                                               |
| **Category Detail**       | `/categories/:id`    | Filtered list of top-rated restaurants serving dishes in the selected category.                                                                           |
| **Restaurants Directory** | `/restaurants`       | Directory with distance, rating, delivery speed, and cost-for-two sorting controls.                                                                       |
| **Restaurant Detail**     | `/restaurant/:slug`  | Store header banner, ratings, FSSAI badge, category tabs, menu search, and food cards.                                                                    |
| **Food Customization**    | Modal                | Food variant size choices (Small, Medium, Large) and addon groups (Extra Cheese, Choice of Sauce).                                                        |
| **Cart Drawer**           | Slide-Over           | Slide-over drawer with item list, quantity steppers, bill breakdown, promo code input, and wallet toggle.                                                 |
| **Checkout**              | `/checkout`          | Delivery address selector, delivery instructions, and payment method selector (UPI, Card, NetBanking, COD, Razorpay).                                     |
| **Order Success**         | `/order-success/:id` | Order confirmation screen with estimated arrival countdown.                                                                                               |
| **Live Order Tracking**   | `/orders/:id/track`  | Real-time Leaflet / OpenStreetMap interface with Customer, Store, and Courier markers, ETA countdown, courier call button, and 4-digit Delivery OTP card. |
| **Order History**         | `/orders`            | Past order logs with instant Reorder trigger and active order card.                                                                                       |
| **Wallet**                | `/wallet`            | In-app wallet balance card, credit/debit transaction ledger, and Add Money modal.                                                                         |
| **Coupons**               | `/coupons`           | Active promotional coupons with instant Copy Code action.                                                                                                 |
| **Wishlist**              | `/wishlist`          | Saved favorite dishes and bookmarked restaurants.                                                                                                         |
| **Saved Addresses**       | `/addresses`         | Delivery location manager (Home, Work, Other) with Add Address modal.                                                                                     |
| **Notifications**         | `/notifications`     | Dispatch alerts, order status logs, and promo notification feed.                                                                                          |
| **Customer Support**      | `/support`           | Helpdesk ticket creation form and 24x7 toll-free support line.                                                                                            |
| **Profile**               | `/profile`           | User avatar, name, email, and phone management.                                                                                                           |
| **Settings**              | `/settings`          | Pure Veg Mode toggle, Push notification alerts, and SMS alert toggles.                                                                                    |

---

## 2. STATE STORES SPECIFICATION (ZUSTAND)

1. **`useAuthStore`**: Manages authenticated customer state, user profile, access token, and refresh token with `localStorage` persistence.
2. **`useCartStore`**: Single-restaurant cart validation, quantity add/remove/clear, item variants & addons selection, subtotal calculation, 5% GST tax calculation, packaging fee (₹15), delivery fee (₹30), coupon discount, wallet balance application, and grand total.
3. **`useAddressStore`**: Saved customer addresses list, active selected delivery location, add address, and remove address.
4. **`useSettingsStore`**: Pure Veg Mode toggle (`isVegOnly`), push notification toggle, SMS alert toggle, and light/dark theme preference.

---

## 3. LIVE ORDER TRACKING & LEAFLET MAP ARCHITECTURE

- **Leaflet OpenStreetMap:** Implemented via client-side dynamic rendering (`next/dynamic` with `ssr: false`) in `LiveTrackingMap.tsx`.
- **Marker Pins:**
  - 🏪 **Store Pin:** Orange marker anchored at Restaurant GPS coordinates (`restaurantLat`, `restaurantLng`).
  - 🛵 **Courier Pin:** Green marker anchored at Courier GPS coordinates (`driverLat`, `driverLng`).
  - 📍 **Customer Pin:** Blue marker anchored at Delivery Address GPS coordinates (`customerLat`, `customerLng`).
- **Route Path:** Dashed polyline connecting Restaurant ➔ Courier ➔ Customer.
- **Delivery OTP Security:** Displays 4-digit Delivery OTP (`4819`) for customer to share with courier upon arrival.

---

## 4. VERIFICATION RESULTS

```bash
# 1. Monorepo TypeScript Type Check
$ pnpm type-check
• turbo 2.10.7
  Tasks: 17 successful, 17 total
  Time: 6.120s (0 errors across 11 projects)

# 2. Monorepo Production Build Execution
$ pnpm build
• turbo 2.10.7
  Tasks: 11 successful, 11 total
  Time: 42.105s (All 5 applications including customer-web built cleanly)
```
