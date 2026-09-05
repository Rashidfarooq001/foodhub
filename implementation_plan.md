# Banner & Coupon Full Integration

## Goal
Integrate the Banner and Coupon systems completely across Admin, Backend, and Customer apps using a single PostgreSQL source of truth and realtime Socket.IO synchronization.

## 1. Banner Source of Truth

**Backend (`apps/backend/src/modules/banners`)**
- [NEW] `BannersModule`, `BannersController`, `BannersService`
- Endpoints:
  - `GET /banners` -> Active banners for Customer App
  - `GET /admin/banners` -> All banners
  - `POST /admin/banners` -> Create banner
  - `DELETE /admin/banners/:id` -> Deactivate/Delete
- When banners are modified, `BannersService` will emit a `banner:updated` Socket.IO event.

**Admin Dashboard (`apps/admin-dashboard/src/app/cms/page.tsx`)**
- [MODIFY] Remove `localStorage` mock logic.
- Integrate real fetch to `GET /admin/banners` and `POST /admin/banners`.

**Customer Web (`apps/customer-web/src/components/home/HeroBanner.tsx`)**
- [MODIFY] Switch from `GET /coupons` to `GET /banners`.
- Map `imageUrl`, `title`, and `targetUrl` properly to UI elements.
- Subscribe to `banner:updated` socket event (via `socket.on`) to refetch banners seamlessly without reload.

## 2. Coupon Source of Truth & Validation

**Backend (`apps/backend/src/modules/coupons/coupons.controller.ts`)**
- [MODIFY] Remove hardcoded `valid: false` and `[]` responses.
- Wire `listActive`, `validate`, and `suggest` routes to the existing robust `CouponsService`.
- Emit `coupon:updated` Socket.IO event on admin modifications.

**Backend (`apps/backend/src/modules/tax/order-quote.service.ts`)**
- [MODIFY] `OrderQuoteRequest` -> Add `couponCode` and `customerId`.
- [MODIFY] `calculateQuote` -> Inject `CouponsService`. Instead of trusting `req.discountAmount`, compute `discountAmount` authoritatively by calling `this.couponsService.validateCoupon`.
- [MODIFY] `OrderQuoteResult` -> Return `appliedCouponCode` and `couponMessage`.

**Backend (`apps/backend/src/modules/orders/orders.service.ts`)**
- [MODIFY] `createOrder` ->
  - Strip hardcoded `const discountAmount = 0`.
  - Validate `dto.couponCode` via `CouponsService`.
  - Deduct the authoritative discount amount.
  - Wrap in a Prisma transaction if possible, and `CREATE` a `CouponUsage` record to track concurrency and limits safely.

**Admin Dashboard (`apps/admin-dashboard/src/app/coupons/page.tsx`)**
- [MODIFY] Remove `localStorage` mock logic.
- Integrate real fetch to `GET /coupons/admin`, `POST /coupons`, etc.

**Customer Web (`apps/customer-web/src/stores/use-cart-store.ts` & Cart UI)**
- [MODIFY] `useCartStore` -> Add `couponCode` to state. Send it in `fetchOrderQuote`.
- [MODIFY] `CartDrawer` or `Checkout` page to display the authoritative coupon message from the backend quote result.
- [MODIFY] Checkout page to allow applying coupons.

## Verification Plan
1. Admin creates Banner -> Customer home updates instantly (Socket.IO).
2. Admin creates Coupon -> Valid in Customer checkout.
3. Customer applies Coupon -> Backend calculates discount in Quote -> Total is exact.
4. Order placed -> CouponUsage recorded -> Final payment exact.
