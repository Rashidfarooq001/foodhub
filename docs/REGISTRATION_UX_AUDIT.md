# REGISTRATION UX AUDIT

## 1. Current Registration Height / Structure
Previously, both the Restaurant (Merchant) and Delivery Partner registration pages were structured as four vertically stacked, oversized cards. Each card featured excessive padding (p-6 to p-8), huge fixed-height file drop zones (h-10 icon + p-6 padding + text block), and sprawling grid spacing (gap-6). The map picker occupied an unnecessary 300px vertical block.

## 2. Major Sources of Excessive Scrolling
- Redundant `<div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-xl space-y-6">` wrappers for every sub-section.
- Inter-section vertical spacing (`space-y-8` -> `space-y-4`).
- Oversized media drop zones requiring dragging or massive click areas.
- The 300px interactive `<GoogleMapPicker>` in the location flow which pushed down the submit button.

## 3. Components Modified
- `apps/hotel-dashboard/src/app/partner/register/page.tsx`: Entire layout refactored into a single card `<form className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xl space-y-6">`. Section headers were compressed to uppercase `h2` tracking elements with thin underlines (`border-b border-gray-200 pb-2 mb-2`).
- `apps/customer-web/src/app/driver/register/page.tsx`: Disabled-block lock removed. Layout refactored symmetrically to match the compact single-card layout of the merchant flow.
- `apps/hotel-dashboard/src/components/common/MediaUploader.tsx`: Shrunk drop-zone paddings and icon sizes.
- `apps/customer-web/src/components/common/MediaUploader.tsx`: Synchronized compact dimensions.

## 4. Fields Preserved & Layout Adjustments
- **Preserved:** Basic info, OTP logic (MSG91 script), Bank details, Address, Cuisines, Documents (PAN/FSSAI for Merchant, DL/RC/Aadhaar for Driver).
- **Adjustments:** Grids switched to `gap-4`, inputs reduced padding (`py-2`). 

## 5. Fields Removed and Why
- **Interactive Map Picker (GoogleMapPicker):** Removed to save ~300px vertical space. Replaced completely by the hidden `useGeolocation()` hook paired with Mappls reverse-geocoding, which automatically triggers on "Use Current Location" and silently hydrates the inputs.

## 6. Location & Bank Flows
- **Location:** "Use Current Location" -> Browser Geolocation API -> `GET /geolocation/reverse-geocode` -> Hydrate `address`, `city`, `state`, `pin`.
- **Bank Details:** Preserved compactly at the bottom.

## 7. Desktop & Mobile Improvements
- **Mobile:** `<form>` scales gracefully with `p-4 sm:p-6`. The single-column grid works without feeling bloated. Sub-headers guide the eye smoothly.
- **Desktop:** The 2-column grid spans the compact form beautifully, keeping everything within roughly one and a half viewport heights instead of three.

==================================================
FINAL RESULT

RESTAURANT REGISTRATION = PASS
DELIVERY REGISTRATION = PASS
GPS = PASS
MAPPLS = PASS
BANK DETAILS = PASS
DOCUMENT UPLOAD = PASS
DATABASE SUBMISSION = PASS
MOBILE UX = PASS
