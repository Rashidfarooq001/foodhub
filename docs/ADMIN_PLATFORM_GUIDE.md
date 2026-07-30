# FoodHub Platform - Admin Dashboard & Platform Operations Architecture

**Document Version:** 1.0.0-PROD  
**Phase:** Phase 7 (Platform Admin Dashboard)  
**Application Port:** `3003` (Local domain: `admin.foodhub.local`)

---

## 1. COMPREHENSIVE PAGES & ROUTING MATRIX

The `admin-dashboard` Next.js 15 App Router application provides platform operators with 19 administrative control panels:

| Route Path | Page Title | Operational Capabilities |
| :--- | :--- | :--- |
| `/` | **Platform Command Center** | Real-time GMV revenue (₹4.85L), order counts (1,420), online drivers (380), active stores (142), Recharts growth trend graph. |
| `/restaurants/approval` | **Restaurant Approval Queue**| Merchant onboarding verification queue for reviewing GSTIN certificates, FSSAI licenses, and bank accounts. |
| `/restaurants` | **All Restaurants** | Global merchant directory with suspend/activate triggers. |
| `/delivery-partners/approval`| **Driver Approval Queue**| Courier onboarding queue for reviewing driving licenses, vehicle RC, and insurance docs. |
| `/delivery-partners` | **Delivery Partners** | Active courier fleet directory and rating scores. |
| `/customers` | **Customer Directory** | Registered customer accounts log with wallet balances and account suspension toggles. |
| `/orders` | **Global Orders Log** | Platform-wide order search with status timeline inspection and refund triggers. |
| `/payments` | **Payments & Settlements** | Net commission revenue ledger (18% rate) and Friday merchant settlement payout queues. |
| `/coupons` | **Coupons & Campaigns** | Platform-wide discount coupons and marketing campaign manager. |
| `/analytics` | **Platform Analytics** | Recharts bar graphs for daily order volumes, driver dispatch ETAs, and customer retention rates. |
| `/support-tickets` | **Support Tickets** | Customer & merchant ticket resolution helpdesk queue. |
| `/cms` | **CMS & Banners** | Homepage hero offer banner carousel & promotional content editor. |
| `/feature-flags` | **Feature Flags & Control** | Maintenance mode toggle, emergency order shutdown, and experimental feature flags. |
| `/system-settings` | **System Settings** | Platform name, commission %, GST tax rate (5%), delivery charges, and wallet rules. |
| `/audit-logs` | **Audit Logs & Security** | Immutable administrative activity log with operator identity and IP address tracking. |
| `/roles` | **Roles Management** | System RBAC roles (`SuperAdmin`, `Admin`, `Finance`, `Support`, `Moderator`). |
| `/permissions` | **Permissions Matrix** | Granular feature permission policies. |
| `/profile` | **Admin Profile** | Operator credential & security settings. |

---

## 2. AUTHORIZED ROLES & RBAC SECURITY

* **`SuperAdmin`**: Complete platform privileges including system settings, commission overrides, and maintenance mode toggles.
* **`Admin`**: Restaurant and driver onboarding approvals, customer suspensions, and CMS edits.
* **`Finance`**: Merchant payout settlements, refund approvals, and financial statement exports.
* **`Support`**: Order refund triggers and customer support ticket handling.
* **`Moderator`**: Reviews moderation and promotional banner management.

---

## 3. VERIFICATION & BUILD SUMMARY

```bash
# Monorepo TypeScript Type Check
$ pnpm type-check
• turbo 2.10.7
  Tasks: 17 successful, 17 total (0 errors across 11 projects)

# Monorepo Production Build Execution
$ pnpm build
• turbo 2.10.7
  Tasks: 11 successful, 11 total (All 5 applications built cleanly)
```
