# ZaykaFood Monorepo Forensic Audit Baseline

## 1. Current State
- **Current Branch:** `main`
- **Current HEAD Commit:** `a0dbca8 feat: Rework Finance & Settlements logic and UI`
- **Previous Significant Commits:**
  - `a0dbca8` (Finance & Settlements Rework)
  - `ea3d711`, `dab541a`, `dabea61`, `0cb725e` (Google Maps Migrations & Route APIs)
  - `c74bf90` (Location coordinate removal & GPS resolving)
  - `61e50e1` (ZaykaFood UI aesthetics and spacing restore)
  - `ece7ce3` (UI redesign and coupon elimination)
- **Last Known Fully Stable UI Commit:** Prior to `ece7ce3` and `0cb725e` (where the map migrations and UI shifts broke multiple frontends).

## 2. Active Unstaged Changes (Hotfixes applied in previous session)
1. `apps/admin-dashboard/src/app/settlements/page.tsx` (Fixed TS compilation `resStats.error` mismatch)
2. `apps/customer-web/src/components/home/LocationSelectorModal.tsx` (Fixed React Error #310 Hooks violation)
3. `apps/delivery-dashboard/src/components/navigation/DeliveryMap.tsx` (Added Google Maps API missing key error boundary)
4. `apps/hotel-dashboard/src/components/map/GoogleMapPicker.tsx` (Added Google Maps API missing key error boundary)

## 3. Known Existing Issues
- **Missing API Keys:** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is completely missing from `.env` files across the monorepo, causing graceful failures (but un-usable maps) in Customer, Merchant, and Delivery dashboards.
- **Removed Features:** Coupons were deliberately removed in `ece7ce3`.
- **Backend Migrations:** Haversine routing was replaced with Google Maps Routes API (`computeRouteMatrix`).

## 4. Next Steps for Audit
This baseline represents the state *before* the exhaustive runtime, API, Database, and Flow tests. The audit will methodically compile, serve, and run Playwright tests across all boundaries.
