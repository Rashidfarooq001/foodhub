# FOODHUB PLATFORM - PRODUCT FOUNDATION & SOFTWARE REQUIREMENTS SPECIFICATION (SRS)

**Document Version:** 1.0.0-PROD  
**Phase:** Phase -1 (Planning, Architecture & Product Blueprint)  
**Target Launch Quality:** Commercial Enterprise Production

---

## EXECUTIVE SUMMARY & SYSTEM OVERVIEW

**FoodHub** is an enterprise-grade, hyper-local multi-restaurant food ordering and delivery ecosystem. The platform serves four primary market participants: Consumers, Restaurant Partners (Hotels), Delivery Fleet Couriers, and Platform Operators (Admins/Support/Finance).

The ecosystem is architected around **five distinct applications** powered by a unified microservices-ready monolithic API backend:

1. **Customer Web Application** (Next.js 15 App Router - Responsive Web App)
2. **Hotel / Restaurant Partner Dashboard** (Next.js 15 App Router - Kitchen Display & Management)
3. **Delivery Partner Dashboard** (Next.js 15 App Router - Mobile-Optimized Driver PWA)
4. **Platform Admin Super-Dashboard** (Next.js 15 App Router - Command & Control Center)
5. **Backend Core API Service** (NestJS 10 Framework - RESTful, WebSockets & Background Workers)

---

## 1. BUSINESS REQUIREMENTS DOCUMENT (BRD)

### 1.1 Business Vision

To establish the premier hyper-local food discovery and delivery platform delivering ultra-low friction food ordering experiences, sub-30-minute fulfillment SLA, transparent merchant economics, and real-time telemetry across urban and semi-urban markets.

### 1.2 Business Mission

- **For Consumers:** Deliver hot, fresh food reliably from top local restaurants with transparent live tracking and dynamic options.
- **For Restaurants:** Provide zero-friction digital store creation, automated kitchen display dispatch, instant inventory controls, and fair payout cycles.
- **For Delivery Partners:** Offer flexible gig earnings, transparent payout calculations, optimized route navigation, and safety guarantees.
- **For Platform Operators:** Enable automated operations, fraud prevention, dynamic surge control, and enterprise financial reconciliation.

### 1.3 Strategic Business Goals & Key Performance Indicators (KPIs)

| Metric Goal                       | Target Value        | Verification Method                           |
| :-------------------------------- | :------------------ | :-------------------------------------------- |
| **System Availability SLA**       | 99.99% Uptime       | Automated Healthchecks & Cloudflare Analytics |
| **Peak Throughput Capacity**      | 10,000 requests/sec | Distributed Load Tests (k6 / Locust)          |
| **Average Fulfillment Time**      | < 32 Minutes        | Socket.IO Order Telemetry Timestamps          |
| **Merchant Order Acceptance SLA** | < 90 Seconds        | Automated BullMQ Timeout Alerts               |
| **Driver Acceptance SLA**         | < 30 Seconds        | Auto-dispatch Reassignment Trigger            |
| **Refund Resolution Time**        | Instant / < 12 hrs  | Automated Refund Engine & Wallet Credit       |
| **API Latency (p95)**             | < 120 ms            | APM Tracking (OpenTelemetry/Datadog)          |

### 1.4 Project Scope Boundaries

#### In-Scope (Phase 1 Commercial Release):

- Unified NestJS 10 backend supporting PostgreSQL 16 via Prisma ORM, Redis 7 caching & Socket.IO real-time websockets.
- Multi-role JWT authentication with MSG91 OTP mobile verification and OAuth fallbacks.
- OpenStreetMap (OSM) & Leaflet spatial coordinate distance calculations, geofencing, and driver live tracking.
- Razorpay Payment Gateway integration (UPI, Credit/Debit Cards, Net Banking, Razorpay Wallet) + Cash on Delivery (COD) mode.
- In-App Customer & Courier Wallet system with immutable double-entry ledger transactions.
- Cloudflare R2 S3-compatible Object Storage for restaurant assets, menu imagery, and KYC documents.
- Firebase Cloud Messaging (FCM) mobile push alerts + MSG91 SMS notifications.

#### Out-of-Scope (Deferred to Future Iterations):

- Autonomous drone or robotic delivery integrations.
- Native desktop POS hardware driver integrations.
- Native Swift (iOS) / Kotlin (Android) binary builds (Phase 1 uses PWA / Next.js 15 Web Standard).

### 1.5 Key Stakeholders Matrix

| Stakeholder Group      | Role / Primary Interest                                                            | Key Expectations                                                       |
| :--------------------- | :--------------------------------------------------------------------------------- | :--------------------------------------------------------------------- |
| **End Customers**      | Ordering food, tracking delivery, applying coupons, managing wallet.               | Instant load speed, accurate ETA, hot food delivery, seamless payment. |
| **Restaurant Owners**  | Managing store listings, updating prices, viewing revenue reports.                 | Reliable payouts, simple interface, flexible menu builder.             |
| **Kitchen Staff**      | Accepting incoming orders, setting prep times, marking order ready.                | Audio alerts, large touch-friendly interface, fast status toggles.     |
| **Delivery Drivers**   | Accepting job offers, navigating to pickup/dropoff, verifying OTP.                 | High dispatch efficiency, clear earnings breakdown, responsive map.    |
| **Super Admin**        | Platform oversight, onboarding approvals, global fee parameters.                   | Real-time monitoring, audit logs, override permissions.                |
| **Operations Support** | Resolving order disputes, issuing refunds, driver reassignment.                    | Complete order timeline view, ticket notes, direct action buttons.     |
| **Finance Manager**    | Merchant settlement audit, GST/TDS tax deductions, payment gateway reconciliation. | Exportable financial ledgers, automated payout batches.                |

---

## 2. USER PERSONAS

### Persona 1: Customer – Aarav Sharma (The Busy Urban Professional)

- **Demographics:** 28 years old, Senior Software Engineer, living in Tier-1 Metro.
- **Goals:** Quick dinner ordering after late work shifts, single-click payment, accurate live location tracking of courier.
- **Pain Points:** Delayed orders with outdated static ETAs, cold food, difficult refund process when items are missing.
- **Tech Literacy:** Expert. Uses iPhone & High-speed Fiber/5G.
- **Key Interactions:** Customer Web App -> Search -> Cart -> Razorpay UPI -> Socket.IO Live Map Tracking -> Rating.

### Persona 2: Restaurant Owner – Rajesh Patel (Spice Garden Restaurant)

- **Demographics:** 46 years old, Owner of 2 popular casual dining outlets.
- **Goals:** Increase off-peak delivery sales, maintain menu accuracy, track daily revenue and payout schedules.
- **Pain Points:** High commission fees, delayed weekly payouts, complex menu management tools.
- **Tech Literacy:** Moderate. Uses iPad & Android Smartphone.
- **Key Interactions:** Hotel Dashboard -> Daily Sales Overview -> Menu Builder -> Payout Requests -> Revenue Reports.

### Persona 3: Kitchen Staff / Operator – Priya Nair (Head Chef)

- **Demographics:** 26 years old, Kitchen Supervisor.
- **Goals:** Clear visibility of incoming orders, fast preparation status updating, marking out-of-stock items quickly during rush hours.
- **Pain Points:** Loud noisy kitchen environment where alerts get missed, slow software interfaces causing delayed prep times.
- **Tech Literacy:** Basic to Moderate. Uses Wall-mounted Touch Tablet.
- **Key Interactions:** Hotel Live KDS Dashboard -> Audio Alert -> Click "Accept (15 mins)" -> Click "Food Ready".

### Persona 4: Delivery Partner – Vikram Singh (Gig Courier)

- **Demographics:** 24 years old, Full-time Delivery Courier.
- **Goals:** Maximize completed orders per hour, transparent distance-based payout earnings, easy navigation.
- **Pain Points:** Battery drain from GPS, delayed food pickup at kitchens, unresponsive customer address details.
- **Tech Literacy:** Moderate. Uses budget Android Smartphone on 4G connection.
- **Key Interactions:** Delivery Mobile PWA -> Online Toggle -> Job Pop-up (Accept) -> Leaflet Map to Restaurant -> Order Pickup -> Leaflet Map to Customer -> OTP Verify -> Mark Delivered.

### Persona 5: Super Admin – Ananya Verma (VP of Operations)

- **Demographics:** 36 years old, Operations Lead.
- **Goals:** Complete system stability, real-time oversight of active orders across cities, auditing platform commissions and KYC compliance.
- **Pain Points:** System downtime during lunch/dinner peak hours, fraud attempt by rogue delivery partners or fake merchant listings.
- **Tech Literacy:** Advanced. Uses MacBook Pro & Dual Monitors.
- **Key Interactions:** Admin Dashboard -> Command Center metrics -> Restaurant KYC Approvals -> Driver Fleets -> Global Platform Settings.

### Persona 6: Operations Support Executive – Rohan Mehta (Customer Success Lead)

- **Demographics:** 29 years old, Customer Support Specialist.
- **Goals:** Resolve customer order disputes quickly, cancel stuck orders, reassign unassigned drivers, issue wallet credits.
- **Pain Points:** Lack of full order audit trail context, inability to communicate directly with drivers during active trips.
- **Tech Literacy:** Advanced. Uses Desktop PC with CRM tools.
- **Key Interactions:** Admin Support Portal -> Order Timeline Inspection -> Call Customer/Driver -> Issue Partial Refund -> Audit Log.

### Persona 7: Finance & Reconciliation Manager – Meera Iyer (CFO / Finance Lead)

- **Demographics:** 40 years old, Chartered Accountant & Finance Lead.
- **Goals:** Accurate tax compliance (GST & TDS), automated Razorpay settlement reconciliation, merchant payout disbursement batching.
- **Pain Points:** Manual payment discrepancies, multi-channel commission calculation errors, missing transaction ledgers.
- **Tech Literacy:** Advanced. Uses Excel, Tally, and Admin Finance Portal.
- **Key Interactions:** Admin Financial Portal -> Revenue Ledger -> Razorpay Settlement Import -> Payout Batch Approval -> GST Report Export.

---

## 3. FEATURE LIST (CATEGORIZED BY PRIORITY)

### 3.1 Must Have Features (Priority 0 - Critical Path for Launch)

- **Multi-Role Authentication & Authorization:** JWT access & refresh tokens, Passport.js, MSG91 SMS OTP verification, Role-based route guards (`CUSTOMER`, `HOTEL_STAFF`, `HOTEL_OWNER`, `DELIVERY_PARTNER`, `ADMIN`, `SUPER_ADMIN`).
- **Hyper-Local Restaurant Discovery:** OpenStreetMap geocoding, distance spatial queries (PostGIS / Haversine formula), filter by cuisine, rating, dietary preference (Veg/Non-Veg/Egg), estimated preparation time.
- **Dynamic Menu & Catalog System:** Multi-category menus, variant selections (Small, Medium, Large), addon groups (Extra Cheese, Choice of Sauce), inventory stock status toggles (In Stock / Out of Stock).
- **Checkout & Razorpay Payment Integration:** Shopping cart state engine (Zustand), address selector, delivery instructions, Razorpay payment modal integration, Cash on Delivery (COD) validation.
- **Real-Time Order Lifecycle State Machine:** 12-state order lifecycle with Socket.IO bidirectional event broadcasts to Customer, Kitchen, Driver, and Admin.
- **Hotel Live Kitchen Display System (KDS):** Visual order queue card grid, audio alert notifications, preparation timer selector, single-click status progression.
- **Delivery Partner Dispatch & Live Navigation:** Geofenced auto-assignment engine, 30s acceptance pop-up modal, Leaflet map route rendering, 4-digit customer delivery OTP verification.
- **Admin Command & Control Center:** Real-time platform Gross Merchandise Value (GMV), active order maps, merchant onboarding KYC approval workspace, driver fleet monitoring.

### 3.2 Should Have Features (Priority 1 - High Value)

- **Dynamic Surge & Distance Pricing:** Distance-based tiered delivery fee calculation + peak-hour weather/demand surge price multipliers.
- **In-App Customer Wallet System:** Wallet balance management, promotional cashback credits, refund balances, immutable double-entry ledger database tables.
- **Coupon & Promotional Discount Engine:** Percentage off, flat amount discounts, minimum cart thresholds, maximum discount caps, first-order validation, merchant-sponsored vs platform-sponsored coupons.
- **Multi-Factor Review & Rating System:** Customer post-delivery review prompt (Food Quality 1-5, Packaging 1-5, Delivery Speed 1-5, text comments, dish recommendations).
- **Automated Background Job Processing:** BullMQ queues backed by Redis for auto-cancelling unaccepted orders, retrying failed webhooks, sending SMS notifications.
- **Firebase Cloud Messaging (FCM) Integration:** Real-time mobile push notifications for order status changes even when app is backgrounded.

### 3.3 Nice To Have Features (Priority 2 - Post-Launch Polish)

- **Scheduled Orders:** Pre-order food up to 48 hours in advance for specific delivery time slots.
- **Favorites & Instant Re-ordering:** 1-click reorder previous basket, saved favorite dishes and restaurants.
- **Spatial Heatmaps:** Admin visual heatmaps displaying high-density order zones and driver deficit areas.
- **Exportable Financial Reports:** PDF and CSV exports for merchant earnings statements and tax deductions.

### 3.4 Future Features (Priority 3 - v2 Roadmap)

- **Group Basket Ordering:** Shared cart link allowing multiple users to add items to a single checkout basket.
- **Subscription Meal Plans:** Weekly/Monthly automated recurring meal dispatch from partner cloud kitchens.
- **AI-Powered Personalization:** Machine learning dish suggestions based on ordering history, time of day, and weather conditions.

---

## 4. COMPLETE USER FLOW & JOURNEY MAPS

### 4.1 Customer Order Journey (8 Screens)

1. **Screen C1: Landing / Location Selector** -> Selects GPS location or enters saved address.
2. **Screen C2: Restaurant Discovery & Search** -> Applies filters (Veg only, Rating 4+, Delivery speed).
3. **Screen C3: Restaurant Menu Detail** -> Selects restaurant, views categories and dishes.
4. **Screen C4: Item Customization Modal** -> Chooses variants (Size) and addons (Extra cheese), adds to cart.
5. **Screen C5: Cart & Order Review** -> Reviews basket items, applies coupon, confirms address.
6. **Screen C6: Payment Selection & Razorpay Gateway** -> Initiates payment via UPI / Card / COD.
7. **Screen C7: Real-Time Order Tracking** -> Socket.IO updates, Leaflet driver location map, delivery OTP displayed.
8. **Screen C8: Delivery Completion & Rating Review Modal** -> Submits rating for food, packaging, and courier.

### 4.2 Hotel / Kitchen Journey (6 Screens)

1. **Screen R1: Hotel Login & Staff Auth** -> Authenticates kitchen staff.
2. **Screen R2: Live KDS Order Queue** -> Chime alert plays on new order; staff selects prep time (e.g. 20m) and accepts.
3. **Screen R3: Preparing Queue State** -> Kitchen prepares items; marks order as "Food Ready".
4. **Screen R4: Ready for Pickup State** -> Driver arrives; staff verifies order number and hands over parcel.
5. **Screen R5: Menu Inventory Toggle Workspace** -> Quick stock toggle (In Stock / Out of Stock).
6. **Screen R6: Daily Kitchen Revenue & Payout Ledger** -> Displays daily total sales and pending payouts.

### 4.3 Delivery Courier Journey (7 Screens)

1. **Screen D1: Delivery Driver Login & KYC Verification** -> Driver auth and verification status check.
2. **Screen D2: Duty Toggle (Switch to ONLINE)** -> Driver goes online; geofence dispatch active.
3. **Screen D3: Order Offer Modal** -> 30s countdown pop-up with trip distance and earnings; driver clicks ACCEPT.
4. **Screen D4: Leaflet Map Navigation to Restaurant** -> Route guidance to hotel; clicks "Arrived at Restaurant".
5. **Screen D5: Leaflet Map Navigation to Customer** -> Picks up parcel; route guidance to customer dropoff.
6. **Screen D6: Delivery OTP Entry & Verification** -> Asks customer for 4-digit OTP and verifies.
7. **Screen D7: Trip Completed & Earnings Summary Screen** -> Displays trip earnings, bonus, and updated wallet total.

### 4.4 Admin & Operations Journey (7 Screens)

1. **Screen A1: Admin Login with Multi-Factor Auth** -> Secure admin authentication.
2. **Screen A2: Executive Command Center Overview** -> Live GMV, active orders count, online driver count, system latency.
3. **Screen A3: Merchant Onboarding Workspace** -> Reviews FSSAI license and bank details; approves/rejects.
4. **Screen A4: Driver Fleet KYC Audit Workspace** -> Audits driving license and vehicle registration.
5. **Screen A5: Live Order Support & Dispatch Override Center** -> Manually reassigns driver or issues refund.
6. **Screen A6: Financial Payouts & Settlement Engine** -> Generates and dispatches weekly merchant payout batches.
7. **Screen A7: Marketing Coupon & Surge Rule Configuration** -> Configures promotional codes and surge multipliers.

---

## 5. INFORMATION ARCHITECTURE & TAXONOMY

- **Customer App:** Discovery -> Catalog -> Cart & Checkout -> Tracking -> Account (Orders, Wallet, Addresses).
- **Hotel Dashboard:** Kitchen KDS (New, Preparing, Ready) -> Menu Management (Items, Categories, Addons) -> Revenue & Payouts -> Settings.
- **Delivery Dashboard:** Shift Feed (Duty Toggle, Offers) -> Active Navigation (Pickup Map, Dropoff Map) -> Earnings Ledger -> Account & KYC.
- **Admin Dashboard:** Command Center -> Merchant Auditing -> Driver Fleet KYC -> Order Incident Escalation -> Financial Ledgers -> Platform Settings.

---

## 6. SITEMAPS FOR ALL 4 FRONTEND APPLICATIONS

### 6.1 Customer Web Application Sitemap

- `/` - Home Landing & Hyper-Local Restaurant Feed
- `/explore` - Search, Category Filters, Cuisine Explorer
- `/restaurant/[slug]` - Restaurant Details, Menu Catalog & Category Navigation
- `/cart` - Shopping Cart Review
- `/checkout` - Address Selection, Coupon Field, Razorpay Trigger
- `/order/[id]/track` - Real-Time Socket.IO Order Status & Leaflet Map
- `/profile` - User Profile Management
  - `/profile/orders` - Order History & Order Detail Modals
  - `/profile/wallet` - Wallet Balance & Passbook Ledger
  - `/profile/addresses` - Saved Addresses (Home, Work, Other)
- `/help` - Help Center, FAQ, Support Ticket Escalation

### 6.2 Hotel / Restaurant Dashboard Sitemap

- `/hotel/login` - Merchant Staff Login
- `/hotel/onboarding` - Merchant Registration & FSSAI / Bank Document Submission
- `/hotel/kds` - Live Kitchen Display System Queue
- `/hotel/orders` - Order History & Analytical Search
- `/hotel/menu` - Menu Management Workspace
  - `/hotel/menu/items` - Food Items List & Quick Stock Toggles
  - `/hotel/menu/categories` - Category Reordering
  - `/hotel/menu/addons` - Addon Groups & Customizations
- `/hotel/payouts` - Earnings Overview & Payout Request Log
- `/hotel/reviews` - Customer Feedback & Ratings Workspace
- `/hotel/settings` - Store Timings, FSSAI Details, Packing Charges

### 6.3 Delivery Partner Dashboard Sitemap (Mobile PWA)

- `/delivery/login` - Driver Phone OTP Login
- `/delivery/onboarding` - Driver KYC Document Upload (DL, RC, Vehicle)
- `/delivery/dashboard` - Main Duty Hub (Online/Offline Toggle, Active Radar)
- `/delivery/active-order` - Step-by-Step Navigation & OTP Verification Workspace
- `/delivery/earnings` - Daily Earnings Breakdown, Trip Bonuses, Cash Collection
- `/delivery/history` - Completed Trip History
- `/delivery/profile` - Courier Profile & Support Helpdesk

### 6.4 Admin Dashboard Sitemap

- `/admin/login` - Enterprise Admin Authentication
- `/admin/dashboard` - Command Center Overview (Real-time Analytics)
- `/admin/merchants` - Merchant Onboarding Approvals & Store Master List
- `/admin/delivery-fleet` - Driver KYC Verification & Live Courier Map
- `/admin/orders` - Platform Order Incident Control & Override Tools
- `/admin/financials` - Payout Disbursement Engine & Razorpay Reconciliation
- `/admin/promos` - Global Coupon Creator & Surge Price Matrix Setup
- `/admin/settings` - Platform Configuration, Commission Rates, System Audit Logs

---

## 7. BRAND GUIDELINES & SPECIFICATIONS

### 7.1 Logo Concept & Brand Identity

- **Brand Name:** FoodHub
- **Tagline:** Hyper-Fast Food Delivery
- **Logo Emblem:** A sleek geometric combination of a location map pin and a dynamic cloche/fork icon. Constructed with sharp 45-degree angle cuts symbolizing speed and precision.
- **Brand Personality:** Energetic, Ultra-Reliable, Modern, Clean, Delighting.

### 7.2 Core Color Palette Tokens

| Token Name            | Hex Value               | Semantic Purpose                         |
| :-------------------- | :---------------------- | :--------------------------------------- |
| **Primary Base**      | `#FF5200` (Orange)      | Main Brand Accent, CTAs, Hero Elements   |
| **Primary Hover**     | `#E04800`               | Hover States for Buttons                 |
| **Primary Light**     | `#FFF1EC`               | Background Highlights, Badges            |
| **Secondary Base**    | `#00C853` (Emerald)     | Success, Veg Tag, Wallet Cash            |
| **Secondary Light**   | `#E6F9ED`               | Success Badges, Veg Filters              |
| **Neutral Slate-900** | `#0F172A` (Dark Slate)  | Headings, Dark Mode Background           |
| **Neutral Slate-600** | `#475569` (Muted Slate) | Body Text, Secondary Labels              |
| **Neutral Slate-100** | `#F1F5F9` (Light Slate) | Borders, Card Backgrounds                |
| **Functional Error**  | `#EF4444` (Red)         | Non-Veg Tag, Errors, Destructive Actions |
| **Functional Amber**  | `#F59E0B` (Amber)       | Ratings, Warnings, Pending Status        |
| **Functional Info**   | `#3B82F6` (Blue)        | Live Tracking Status, Info Badges        |

### 7.3 Typography Standards

- **Primary Body Font:** `Inter`, sans-serif (Google Fonts)
- **Primary Heading Font:** `Outfit`, sans-serif (Google Fonts)
- **Monospace Code Font:** `JetBrains Mono`, monospace
- **Font Weight Hierarchy:** Light (300), Regular (400), Medium (500), SemiBold (600), Bold (700), ExtraBold (800).

---

## 8. DESIGN SYSTEM TOKENS (SHADCN / TAILWIND ALIGNED)

### 8.1 Color Tokens Specification (CSS Custom Properties)

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 19 100% 50%; /* #FF5200 */
  --primary-foreground: 210 40% 98%;
  --secondary: 145 100% 39%; /* #00C853 */
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 19 100% 50%;
  --radius: 0.75rem; /* 12px */
}
```

### 8.2 Spacing & Geometry Tokens

- Base Grid Step: 4px
- `space-1` = 4px, `space-2` = 8px, `space-3` = 12px, `space-4` = 16px, `space-6` = 24px, `space-8` = 32px, `space-12` = 48px, `space-16` = 64px.

### 8.3 Shadow Elevation Tokens

- `shadow-sm`: `0 1px 2px 0 rgb(0 0 0 / 0.05)`
- `shadow-md`: `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`
- `shadow-lg`: `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`
- `shadow-brand`: `0 8px 25px -5px rgba(255, 82, 0, 0.25)`

### 8.4 Animation & Transition Tokens

- Fast Micro-interaction: `150ms cubic-bezier(0.4, 0, 0.2, 1)`
- Modal/Drawer Transition: `300ms cubic-bezier(0.16, 1, 0.3, 1)`
- Framer Motion Spring Variant: `{ type: "spring", stiffness: 300, damping: 28 }`

---

## 9. REUSABLE UI COMPONENT SPECIFICATIONS

1. **Primary & Secondary Buttons:** Sizes: `sm` (32px), `md` (40px), `lg` (48px), `xl` (56px). Supports loading state spinner, left/right Lucide icons.
2. **Restaurant Catalog Card:** Displays store banner image (Cloudflare R2), Veg/Non-veg badges, average rating pill, delivery time estimate (e.g. "25-30 min"), distance pill ("2.4 km"), cuisine tags.
3. **Food Item Card:** Title, price, description snippet, food tag indicator (Green dot for Veg, Red triangle for Non-veg), "ADD" button with integer step counter (`- 1 +`), variant tag ("Customizable").
4. **Live KDS Kitchen Card:** Color-coded timer header (Green < 10m, Amber 10-20m, Red > 20m), item checklist with addon sub-bullets, action button ("Accept Order" -> "Food Ready" -> "Handed to Driver").
5. **Driver Radar Offer Card:** Distance to restaurant, payout amount (e.g. "₹65.00"), 30-second radial countdown timer ring, Accept / Reject buttons.
6. **Cart & Checkout Drawer:** Sticky bottom bar on mobile, full side drawer on desktop. Calculates Subtotal, Packaging Fee, Delivery Fee, Taxes (5% GST), Coupon Discount, Total Amount Payable.
7. **OTP 4-Digit Input:** Auto-focus sequential text inputs with SMS auto-read compatibility and 60-second resend countdown timer.
8. **Live Order Timeline Tracker:** Vertical status stepper showing `Order Placed` -> `Accepted by Kitchen` -> `Food Being Prepared` -> `Driver Assigned` -> `Out for Delivery` -> `Delivered`.

---

## 10. RESPONSIVE LAYOUT MATRIX & BREAKPOINT RULES

| Device Category   | Viewport Width         | Navigation Pattern             | Layout Grid Columns | Special UI Rules                                                          |
| :---------------- | :--------------------- | :----------------------------- | :------------------ | :------------------------------------------------------------------------ |
| **Mobile**        | < 640px (`sm`)         | Bottom Sticky Nav Bar / Drawer | 1 Column Stack      | Floating view cart bar, full-screen modals, touch-optimised 48px targets. |
| **Tablet**        | 640px - 1023px (`md`)  | Collapsible Drawer / Header    | 2 Columns Grid      | Responsive data table with horizontal swipe.                              |
| **Laptop**        | 1024px - 1439px (`lg`) | Permanent Top Nav / Sidebar    | 3 Columns Grid      | Dual pane dashboard layout with side inspection drawers.                  |
| **Desktop / KDS** | 1440px+ (`xl`)         | Extended Fixed Sidebar         | 4 Columns Grid      | High-density multi-card KDS kitchen grid & live admin command maps.       |

---

## 11. STRUCTURAL ASCII WIREFRAMES FOR CORE SCREENS

### 11.1 Screen C1 & C2: Customer Restaurant Discovery (`/explore`)

```
+-----------------------------------------------------------------------------------+
| [Logo: FoodHub]  📍 Deliver to: 124 Park Avenue, Koramangala ▾   [Search dishes] [🛒 Cart (2)] |
+-----------------------------------------------------------------------------------+
| [Banner: 50% OFF ON FIRST ORDER - USE CODE: FOODHUB50                        ]    |
+-----------------------------------------------------------------------------------+
| Categories: [ All ] [ 🍔 Burgers ] [ 🍕 Pizza ] [ 🥗 Healthy ] [ 🍨 Desserts ]   |
+-----------------------------------------------------------------------------------+
| Filters: [ Sort: Rating ▾ ] [ Veg Only ( ) ] [ Under 30 Mins (x) ] [ Price ▾ ]    |
+-----------------------------------------------------------------------------------+
| RESTAURANTS NEAR YOU (142 Stores)                                                 |
| +-----------------------------------+ +-----------------------------------+ |
| | [ Image: Pizza Paradise         ] | | [ Image: Urban Burger Club      ] | |
| | Pizza Paradise         ⭐ 4.5 (1k+) | | Urban Burger Club      ⭐ 4.3 (500+) | |
| | Italian, Fast Food • ₹300 for two | | American, Fast Food • ₹400 for two| |
| | 🕒 20-25 Mins       📍 1.8 km     | | 🕒 25-30 Mins       📍 3.2 km     | |
| | 🏷️ 40% OFF up to ₹80             | | 🏷️ Free Delivery                 | |
| +-----------------------------------+ +-----------------------------------+ |
+-----------------------------------------------------------------------------------+
| [Bottom Mobile Nav: 🏠 Home   🔍 Search   📜 Orders   👤 Profile]                  |
+-----------------------------------------------------------------------------------+
```

### 11.2 Screen C7: Customer Live Real-Time Order Tracking (`/order/[id]/track`)

```
+-----------------------------------------------------------------------------------+
| ← Back to Orders           ORDER #FH-89210            [ Help & Support ]          |
+-----------------------------------------------------------------------------------+
| +---------------------------------------------+ +-------------------------------+ |
| |                                             | | ORDER STATUS: OUT FOR DELIVERY| |
| |          [ LEAFLET REAL-TIME MAP ]          | | Estimated Arrival: 14 Mins   | |
| |                                             | |                               | |
| |   🏬 Pizza Paradise                         | | [====================>----]   | |
| |        \                                    | |                               | |
| |         🛵 Courier (Vikram)                 | | 🛵 Courier Details:           | |
| |          \                                  | | Vikram Singh (⭐ 4.9)         | |
| |           🏠 Customer Address               | | Vehicle: KA-01-EQ-4421        | |
| |                                             | | [ 📞 Call ] [ 💬 Message ]   | |
| |                                             | |                               | |
| +---------------------------------------------+ | 🔑 Delivery OTP: [ 4  8  1  9 ]| |
|                                                 +-------------------------------+ |
+-----------------------------------------------------------------------------------+
```

### 11.3 Screen R2: Hotel Live Kitchen KDS Display (`/hotel/kds`)

```
+-----------------------------------------------------------------------------------+
| [FoodHub Kitchen KDS]  Spice Garden Outlet #1    [🔊 Sound: ON]  [STATUS: ONLINE] |
+-----------------------------------------------------------------------------------+
| NEW ORDERS (2)             PREPARING (1)                READY FOR PICKUP (1)      |
| +------------------------+ +------------------------+ +------------------------+ |
| | ORDER #FH-9012  🕒 02m | | ORDER #FH-9008  🕒 14m | | ORDER #FH-9001  🕒 22m | |
| | 2x Paneer Butter Masala| | 1x Chicken Biryani     | | 3x Veg Club Sandwich   | |
| | 4x Butter Naan         | | 2x Garlic Naan         | | Driver: Vikram Singh   | |
| | Special: Extra spicy   | |                        | | Status: Driver Arrived | |
| |                        | | [ MARK FOOD READY ]    | |                        | |
| | [ ACCEPT (20 MINS) ]   | |                        | | [ HANDOVER TO DRIVER ] | |
| +------------------------+ +------------------------+ +------------------------+ |
+-----------------------------------------------------------------------------------+
```

### 11.4 Screen D3 & D4: Delivery Courier Navigation Dashboard (`/delivery/dashboard`)

```
+-----------------------------------------------------------------------------------+
| [🛵 FoodHub Courier]       Status: 🟢 ONLINE            Today's Earnings: ₹840.00 |
+-----------------------------------------------------------------------------------+
| +-------------------------------------------------------------------------------+ |
| | NEW DELIVERY OFFER!                                             ⏱️ 22s        | |
| | Pickup: Spice Garden Restaurant (1.2 km away)                                 | |
| | Dropoff: 402 Horizon Towers, Sector 4 (3.4 km away)                           | |
| | Earning for trip: ₹72.50 (Incl. ₹10 Surge Bonus)                              | |
| |                                                                               | |
| | [ REJECT ]                                              [ ACCEPT ORDER (₹72) ]| |
| +-------------------------------------------------------------------------------+ |
|                                                                                   |
| ACTIVE TRIP MAP NAVIGATION:                                                       |
| [ Route: Current Location ===> Spice Garden Kitchen ===> Customer Location ]      |
+-----------------------------------------------------------------------------------+
```

---

## 12. DATABASE PLANNING & DATA ARCHITECTURE (LOGICAL SCHEMAS)

- **Users:** `id` (UUID), `phone` (Unique String), `email` (Optional Unique), `password_hash` (String), `role` (Enum), `is_verified` (Boolean), `created_at`, `updated_at`.
- **UserProfiles:** `id`, `user_id` (FK), `full_name`, `avatar_url`, `fcm_token`.
- **Restaurants:** `id`, `owner_id` (FK), `name`, `slug` (Unique), `phone`, `license_fssai` (Unique), `address_line`, `latitude` (Float), `longitude` (Float), `is_active` (Boolean), `is_open` (Boolean), `avg_rating` (Decimal), `commission_rate` (Decimal), `created_at`.
- **MenuCategories:** `id`, `restaurant_id` (FK), `name`, `display_order` (Int), `is_active`.
- **MenuItems:** `id`, `category_id` (FK), `restaurant_id` (FK), `name`, `description`, `price` (Decimal), `image_url`, `is_veg` (Boolean), `is_available` (Boolean), `created_at`.
- **MenuItemVariants:** `id`, `item_id` (FK), `name` (e.g. Small, Large), `price_modifier` (Decimal).
- **MenuItemAddons:** `id`, `item_id` (FK), `name` (e.g. Extra Cheese), `price` (Decimal).
- **Orders:** `id`, `order_number` (Unique String e.g. FH-10928), `customer_id` (FK), `restaurant_id` (FK), `status` (Enum), `subtotal`, `packaging_fee`, `delivery_fee`, `tax_amount`, `discount_amount`, `total_amount`, `payment_status` (Enum), `delivery_address_json`, `delivery_otp` (String 4-digit), `created_at`.
- **OrderItems:** `id`, `order_id` (FK), `item_id` (FK), `quantity` (Int), `unit_price`, `total_price`.
- **Payments:** `id`, `order_id` (FK), `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`, `amount`, `status` (Enum), `method` (UPI, CARD, COD), `created_at`.
- **DeliveryProfiles:** `id`, `user_id` (FK), `vehicle_type`, `vehicle_number`, `license_number`, `is_online` (Boolean), `current_lat` (Float), `current_lng` (Float), `wallet_balance` (Decimal).
- **DeliveryAssignments:** `id`, `order_id` (FK), `driver_id` (FK), `status` (Enum), `assigned_at`, `picked_at`, `delivered_at`, `payout_amount`.
- **Wallets & Transactions:** `id`, `user_id` (FK), `balance`, `transaction_type` (CREDIT/DEBIT), `amount`, `reference_id`, `description`, `created_at`.

---

## 13. API & MICROSERVICES ARCHITECTURE PLANNING

### 13.1 NestJS Backend Modules Layout

`/src/modules`: `auth`, `users`, `restaurants`, `menu`, `orders`, `payments`, `delivery`, `wallet`, `coupons`, `reviews`, `websockets`, `queues`.

### 13.2 Key REST Endpoints Table

| Module     | Method  | Endpoint                                 | Auth Guard  | Description                           |
| :--------- | :------ | :--------------------------------------- | :---------- | :------------------------------------ |
| Auth       | `POST`  | `/api/v1/auth/send-otp`                  | Public      | Sends MSG91 SMS OTP                   |
| Auth       | `POST`  | `/api/v1/auth/verify-otp`                | Public      | Returns JWT Access & Refresh Tokens   |
| Restaurant | `GET`   | `/api/v1/restaurants/nearby`             | Public      | Spatial search by lat/lng             |
| Restaurant | `GET`   | `/api/v1/restaurants/:slug`              | Public      | Fetches menu catalog tree             |
| Orders     | `POST`  | `/api/v1/orders`                         | Customer    | Creates draft order & Razorpay order  |
| Orders     | `GET`   | `/api/v1/orders/:id/track`               | Auth        | Returns live order state & driver pos |
| Kitchen    | `PATCH` | `/api/v1/kitchen/orders/:id/status`      | Hotel Staff | Updates status (`ACCEPTED`, `READY`)  |
| Delivery   | `PATCH` | `/api/v1/delivery/duty`                  | Driver      | Toggles Online/Offline status         |
| Delivery   | `POST`  | `/api/v1/delivery/orders/:id/verify-otp` | Driver      | Verifies customer OTP & delivers      |
| Admin      | `GET`   | `/api/v1/admin/analytics/overview`       | Admin       | Returns system GMV & stats            |

---

## 14. MONOREPO FOLDER STRUCTURE & WORKSPACE PLANNING

```
foodhub-platform/
├── apps/
│   ├── customer-web/          # Next.js 15 App Router (Port 3000)
│   ├── hotel-dashboard/       # Next.js 15 App Router (Port 3001)
│   ├── delivery-dashboard/    # Next.js 15 App Router PWA (Port 3002)
│   ├── admin-dashboard/       # Next.js 15 App Router (Port 3003)
│   └── backend-api/           # NestJS 10 Framework (Port 4000)
├── packages/
│   ├── ui/                    # Shared shadcn/ui React components
│   ├── types/                 # Shared TypeScript interfaces & Zod Schemas
│   ├── config/                # Shared ESLint, Prettier, Tailwind & TSConfig
│   └── utils/                 # Shared formatting & math functions
├── docker/
│   ├── docker-compose.yml     # Local Postgres, Redis, Nginx services
│   └── nginx.conf             # Reverse proxy routing rules
└── README.md
```

---

## 15. ROLE-BASED ACCESS CONTROL (RBAC) MATRIX

| Action / Resource        | CUSTOMER | HOTEL_STAFF | DRIVER  | ADMIN   | SUPER_ADMIN    |
| :----------------------- | :------- | :---------- | :------ | :------ | :------------- |
| Browse Restaurants       | ALLOWED  | ALLOWED     | ALLOWED | ALLOWED | ALLOWED        |
| Place Order              | ALLOWED  | DENIED      | DENIED  | DENIED  | ALLOWED (Test) |
| Accept Kitchen Order     | DENIED   | ALLOWED     | DENIED  | DENIED  | ALLOWED        |
| Toggle Dish Availability | DENIED   | ALLOWED     | DENIED  | DENIED  | ALLOWED        |
| Accept Delivery Job      | DENIED   | DENIED      | ALLOWED | DENIED  | DENIED         |
| Approve Merchant KYC     | DENIED   | DENIED      | DENIED  | ALLOWED | ALLOWED        |
| Update System Fees       | DENIED   | DENIED      | DENIED  | DENIED  | ALLOWED        |
| View Audit Logs          | DENIED   | DENIED      | DENIED  | ALLOWED | ALLOWED        |

---

## 16. DETAILED BUSINESS RULES & GOVERNANCE ENGINES

### 16.1 Restaurant Onboarding & Verification Rules

- Merchant must upload FSSAI 14-digit license, GSTIN tax registration certificate, and bank account cancelled cheque.
- Auto-rejection if FSSAI license expiry date is within 30 days of submission.
- Admin must review and approve document scans within 48 business hours before the restaurant listing status transitions to `APPROVED`.

### 16.2 Delivery Courier KYC Approval Rules

- Courier driver must upload Driving License, Vehicle Registration Certificate (RC), and National Identity proof.
- Background check status must be verified as `CLEAR` by Admin before driver can switch duty status to `ONLINE`.

### 16.3 Cancellation & Refund Governance Rules

- **Cancellation within 60s of order placement:** 100% immediate refund credited to Customer Wallet / Source Gateway.
- **Cancellation after Kitchen Acceptance:** 0% refund if kitchen has started food preparation (prevents food waste loss).
- **Restaurant Order Rejection / Timeout:** 100% instant refund + ₹50 promotional wallet voucher compensation to customer.

### 16.4 Delivery Auto-Dispatch & Geofence Rules

- Search radius starts at 3.0 km from restaurant location.
- Active drivers sorted by Haversine distance and current active trip count.
- Driver receives job offer modal with 30-second countdown timer. If no action, offer auto-escalates to next nearest driver.

---

## 17. CODING STANDARDS & ENGINEERING GUIDELINES

### 17.1 TypeScript & Code Quality Rules

- Enforce strict mode in `tsconfig.json` (`strict: true`, `noImplicitAny: true`).
- Absolute paths configured using TS path aliases (e.g. `@/components/`, `@/services/`, `@/types/`).

### 17.2 Component & State Management Conventions

- Server Components by default in Next.js 15 App Router. Use `'use client'` directive strictly when React state, hooks, or browser events are required.
- Global UI state managed via **Zustand** stores. Async server state managed exclusively via **TanStack Query (React Query v5)** with automatic cache invalidation.
- All form inputs validated client-side using **React Hook Form** with **Zod** schema resolvers.

---

## 18. ACCEPTANCE CRITERIA FOR PHASE -1 SIGN-OFF

The **Phase -1 (Architecture & Product Blueprint)** phase is defined as **100% COMPLETE** when the following criteria are verified:

1. **System Blueprint Completeness:** All 18 architectural specification sections are thoroughly documented with zero ambiguous placeholders.
2. **Tech Stack Consistency:** Clean alignment with Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Zustand, TanStack Query, NestJS, Prisma, PostgreSQL, Redis, BullMQ, Socket.IO, and Cloudflare R2.
3. **Zero Application Code Constraint:** No runtime JavaScript/TypeScript code, NestJS modules, or database migrations executed during Phase -1.
4. **Phase 0 Readiness:** The architecture blueprint is detailed to the extent that engineering teams can immediately generate boilerplates, schemas, and API contracts in Phase 0 without requiring further design clarification.

---

**END OF PRODUCT REQUIREMENTS BLUEPRINT**
