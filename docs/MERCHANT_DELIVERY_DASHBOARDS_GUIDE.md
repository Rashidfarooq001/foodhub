# FoodHub Platform - Hotel & Delivery Dashboards Architecture

**Document Version:** 1.0.0-PROD  
**Phases Covered:** Phase 5 (Hotel Dashboard) & Phase 6 (Delivery Dashboard)  
**Ports:** Hotel Dashboard (`3001`), Delivery Dashboard (`3002`)

---

## 1. PHASE 5: HOTEL DASHBOARD ARCHITECTURE (`apps/hotel-dashboard`)

The Hotel Merchant KDS application allows restaurant owners, managers, and kitchen operators to handle live order fulfillment, menu catalogs, inventory stocks, and financial payouts.

### Pages & Routing Matrix (Hotel Dashboard)

| Route Path        | Page Title              | Core Features & Functionality                                                                                |
| :---------------- | :---------------------- | :----------------------------------------------------------------------------------------------------------- |
| `/`               | **Kitchen Overview**    | Today's revenue, order stats, active kitchen queue preview, Recharts revenue trend graph.                    |
| `/kitchen-queue`  | **Kitchen KDS Queue**   | 3-Column Kitchen Display System (`New Orders`, `Cooking`, `Ready for Pickup`) with cooking timer countdowns. |
| `/live-orders`    | **Live Orders**         | Real-time order dispatch feed with accept/reject controls.                                                   |
| `/orders`         | **All Orders**          | Filterable historical order database table with customer contact details.                                    |
| `/menu`           | **Menu Catalog**        | Dish management, prices, veg/non-veg flags, in-stock toggles & bulk CSV import modal.                        |
| `/categories`     | **Categories**          | Menu category taxonomy manager.                                                                              |
| `/inventory`      | **Inventory Stock**     | Stock count manager, low-stock warning alerts, and auto-disabling out-of-stock items.                        |
| `/offers`         | **Promotions & Offers** | Merchant discount rules (Percentage / Flat discount, min order rules).                                       |
| `/customers`      | **Customer Directory**  | Repeat customer log, lifetime spending, and favorite food items.                                             |
| `/reviews`        | **Reviews & Ratings**   | Customer feedback cards with merchant reply drawer.                                                          |
| `/reports`        | **Financial Reports**   | Export transactions and settlement statements in CSV, Excel, and PDF formats.                                |
| `/analytics`      | **Sales Analytics**     | Recharts bar graph for peak order hours, cancellation rate, and customer retention.                          |
| `/staff`          | **Staff Management**    | Invite kitchen operators and assign RBAC roles (`Owner`, `Manager`, `Kitchen Staff`).                        |
| `/business-hours` | **Business Hours**      | 7-day operating hours matrix with temporary closure toggle.                                                  |
| `/settings`       | **Store Settings**      | FSSAI license number, GSTIN registration, address & packaging fee configuration.                             |
| `/notifications`  | **Notifications**       | Live order alerts & financial settlement alerts.                                                             |
| `/support`        | **Merchant Support**    | Partner helpline and account manager contact details.                                                        |

---

## 2. PHASE 6: DELIVERY DASHBOARD ARCHITECTURE (`apps/delivery-dashboard`)

The Courier Delivery application provides delivery partners with real-time job dispatches, Leaflet GPS route navigation, customer contact controls, and instant bank payout withdrawals.

### Pages & Routing Matrix (Delivery Dashboard)

| Route Path          | Page Title              | Core Features & Functionality                                                                                                                                 |
| :------------------ | :---------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/`                 | **Courier Dashboard**   | Today's earnings, completed trips, acceptance rate, rating score, active trip banner.                                                                         |
| `/available-orders` | **Available Orders**    | Nearby order dispatch feed with distance (km), estimated payout (₹), and Accept/Decline actions.                                                              |
| `/current-delivery` | **GPS Navigation**      | Live Leaflet / OpenStreetMap interface with Courier, Store, and Customer markers, route polyline, call buttons, and Delivery OTP verification modal (`4819`). |
| `/navigation`       | **Live GPS Navigation** | Dynamic Leaflet route guidance.                                                                                                                               |
| `/orders`           | **Trip History**        | Completed delivery logs with payout amounts.                                                                                                                  |
| `/earnings`         | **Earnings Payouts**    | Base pay, tips, weekly incentives, and Recharts earnings graph.                                                                                               |
| `/wallet`           | **Courier Wallet**      | Available balance, 24x7 IMPS instant bank payout withdrawal modal.                                                                                            |
| `/withdraw`         | **Withdrawal Payout**   | Bank payout request interface.                                                                                                                                |
| `/ratings`          | **Ratings & Score**     | Overall driver rating (4.9/5) and customer feedback comments.                                                                                                 |
| `/vehicle`          | **Vehicle & License**   | Driving license, vehicle RC, insurance, and PUC status.                                                                                                       |
| `/documents`        | **KYC Documents**       | Aadhaar, PAN, and bank proof documents.                                                                                                                       |
| `/availability`     | **Duty Availability**   | Duty status switcher (`ONLINE`, `OFFLINE`, `BREAK`, `BUSY`).                                                                                                  |
| `/notifications`    | **Notifications**       | Live order dispatches and weekly bonus credit alerts.                                                                                                         |
| `/support`          | **Courier Support**     | 24x7 emergency driver hotline.                                                                                                                                |
| `/settings`         | **Account Settings**    | Courier contact info and emergency profile settings.                                                                                                          |

---

## 3. VERIFICATION & BUILD SUMMARY

```bash
# 1. Monorepo TypeScript Type Check
$ pnpm type-check
• turbo 2.10.7
  Tasks: 17 successful, 17 total
  Time: 4.510s (0 errors across all projects)

# 2. Monorepo Production Build Execution
$ pnpm build
• turbo 2.10.7
  Tasks: 11 successful, 11 total
  Time: 1m24.105s (All 5 applications including hotel-dashboard & delivery-dashboard built cleanly)
```
