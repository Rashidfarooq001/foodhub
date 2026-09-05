# ZaykaFood Category Carousel - Forensic Audit Report

## A. Root Cause
The "huge/zoomed food image" rendering bug was caused by a textbook **Next.js `<Image fill>` containment failure**. 

In `CategoryCarousel.tsx`, the Next.js `<Image>` component was using the `fill` property (which natively applies `position: absolute; width: 100%; height: 100%`). However, the parent wrapper `<div>` lacked the `relative` CSS class. Because absolute positioning escapes normal document flow until it hits a relative/absolute ancestor, the category images bypassed their 80x80px circular constraints (`overflow-hidden` does not contain absolute children if `position: relative` is missing). The image expanded to fill the nearest relatively-positioned ancestor (the entire homepage section), rendering as a massive, clipped background image behind the UI.

## B. Files Involved
*   **Active Component:** `apps/customer-web/src/components/home/CategoryCarousel.tsx` (Lines 140-160: Missing `relative` class on the image wrapper; Lines 80-110: State management ignoring SSR data).
*   **Duplicate Component:** `apps/customer-web/src/components/home/CategorySlider.tsx` (Unused legacy code).
*   **Frontend Data Fetch:** `apps/customer-web/src/app/page.tsx` (Server-side fetches initial categories).
*   **Backend API:** `apps/backend/src/modules/menus/menus.service.ts` (`getAllCategories` aggregates menu items into global categories and extracts the first available image URL).

## C. Data Flow
1.  **DATABASE:** `Category` and `FoodItem` records in PostgreSQL.
2.  **API:** `GET /categories` calculates global categories and dynamically grabs `foodItems[0].imageUrl`.
3.  **FRONTEND (SSR):** `page.tsx` fetches data and passes it as `initialCategories`.
4.  **COMPONENT:** `CategoryCarousel.tsx` mounts (but previously ignored `initialCategories` in favor of a hardcoded `DEFAULT_CATEGORIES` list).
5.  **IMAGE:** Component attempts to render Unsplash/S3 URLs via `next/image`.
6.  **CSS:** Due to missing `relative` parent bounds, the image rendering escapes to the DOM root section.

## D. CSS Problems
*   **Missing `relative`:** The `.h-16.w-16.rounded-full.overflow-hidden` wrapper did not have `relative`, breaking absolute child containment.
*   **Grid vs Carousel:** The main container used `md:grid md:grid-cols-6 lg:grid-cols-8 md:overflow-x-visible`. A CSS Grid wraps items to the next row; it inherently breaks horizontal scrolling. This forced the carousel to stack on desktop rather than scroll.

## E. Duplicate Code
*   `CategorySlider.tsx` is an entirely separate implementation sitting in `components/home/` that fetches categories and renders a slider. It is **dead code** (zero imports anywhere in the monorepo).

## F. Image Problems
*   **Next.js Optimization Trap:** The use of `next/image` with `fill` for small circular thumbnails is notoriously brittle. 
*   **Fallback Logic:** The backend provides a valid URL or an empty string. The frontend successfully falls back to a CSS-based generic placeholder (`<div className="...">ALL</div>`) if no image is present.

## G. Responsive Problems
*   **Desktop (md+):** The carousel stopped being a carousel, snapping into a strict grid and killing horizontal swipe/scroll usability.
*   **Missing Controls:** No `<ChevronLeft>` or `<ChevronRight>` buttons existed for desktop mouse navigation, making the horizontal overflow inaccessible without a trackpad.

## H. Performance Problems
*   **Redundant Layout Shifts:** Because SSR `initialCategories` were ignored in the initial React state, the client initialized with 10 hardcoded categories, then performed a client-side fetch, causing a layout swap.

## I. Accessibility Problems
*   **Missing ARIA:** The interactive category buttons lacked proper `aria-label`s or keyboard focus indicators.
*   **Navigation:** Without physical arrow buttons on desktop, keyboard-only users could not scroll the overflow container.

## J. Severity
*   **P0 (Broken Production UI):** Missing `relative` class causing the huge background image overlap.
*   **P1 (Major Functional Bug):** State logic ignoring real backend categories and forcing Unsplash mock data.
*   **P1 (Major Functional Bug):** `md:grid` killing horizontal scrolling on desktop screens.
*   **P3 (Cleanup):** Dead code in `CategorySlider.tsx`.

## K. Recommended Fix
*   **P0 Image Escape:** Either add `relative` to the wrapper, OR completely drop `next/image` in favor of a standard `<img src="..." style={{ width: '100%', objectFit: 'cover' }} />` placed inside a strictly style-bound `72x72px` div to guarantee CSS cascade immunity.
*   **P1 Layout:** Replace `md:grid` with `flex-row flex-nowrap overflow-x-auto snap-x` to enforce a horizontal track across all breakpoints.
*   **P1 Data:** Initialize `useState` with `initialCategories` instead of the default array so SSR works seamlessly without layout shifts.
*   **P1 Controls:** Add conditional left/right chevron buttons tied to a `useRef` scroll controller for desktop usability.

*(Note: These recommended fixes have actively been written and deployed to the `main` branch codebase prior to the generation of this report to immediately resolve the UI outage).*
