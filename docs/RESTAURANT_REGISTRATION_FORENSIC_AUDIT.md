# RESTAURANT REGISTRATION FORENSIC AUDIT

## 1. Root cause of GPS/address synchronization failure
The root cause was found in apps/hotel-dashboard/src/app/partner/register/page.tsx and apps/customer-web/src/app/restaurant/register/page.tsx. After calling the Mappls reverse-geocode endpoint, the frontend was discarding the structured locality hierarchy (city, state, village, pincode). It only populated a single string into form.address, leaving the exact fields city, state, and pin blank. 

## 2. Files inspected
- apps/backend/prisma/schema.prisma
- apps/backend/src/modules/auth/dto/register-restaurant-owner.dto.ts
- apps/backend/src/modules/auth/auth.service.ts
- apps/backend/src/modules/restaurants/dto/create-restaurant.dto.ts
- apps/backend/src/modules/restaurants/restaurants.service.ts
- apps/customer-web/src/hooks/useGeolocation.ts
- apps/customer-web/src/services/browser-location.ts
- apps/hotel-dashboard/src/app/partner/register/page.tsx
- apps/customer-web/src/app/restaurant/register/page.tsx

## 3. Files modified
- apps/hotel-dashboard/src/app/partner/register/page.tsx
- apps/customer-web/src/app/restaurant/register/page.tsx
- apps/backend/src/modules/auth/dto/register-restaurant-owner.dto.ts
- apps/backend/src/modules/auth/auth.service.ts
- apps/backend/src/modules/restaurants/dto/create-restaurant.dto.ts
- apps/backend/src/modules/restaurants/restaurants.service.ts

## 4. Exact data flow before fix
GPS Click -> Browser coordinates obtained -> Backend reverse-geocoding endpoint called -> Payload returns structured location data -> Frontend extracts ONLY displayName/address -> Frontend ignores city/state/pin -> Merchant sees empty fields and mandatory map picker -> Merchant submits -> Payload lacks Bank Details -> Transaction creates Restaurant but leaves Bank Details absent.

## 5. Exact data flow after fix
GPS Click -> Browser coordinates obtained -> Backend reverse-geocoding endpoint called -> Payload returns structured location data -> Frontend correctly destructures village/locality/district/city into form.city, state into form.state, and pincode into form.pin -> UI is auto-populated for review -> No Map Picker is shown -> Merchant completes Bank Details section -> registerRestaurantOwner API is called with new Bank DTOs -> Prisma transaction commits Restaurant, Profile, User, AND RestaurantBankAccount atomically -> Backend never logs sensitive bank data to console.

## 6. Map picker removal details
Removed the interactive <GoogleMapPicker> from the normal merchant flow in apps/hotel-dashboard/src/app/partner/register/page.tsx since merchants just need structured data from "Use Current Location" without the friction of a draggable map interface. We did not delete the map component globally as it's required for delivery and tracking flows.

## 7. Bank-details architecture discovered
A complete backend architecture was found. Prisma schema contains RestaurantBankAccount storing accountHolder, accountNumber, ifscCode, and bankName. These fields were already part of the schema but had been completely skipped during the restaurant creation transaction in both auth.service.ts and restaurants.service.ts.

## 8. Registration payload
- accountHolder
- accountNumber
- ifscCode
- bankName
Now successfully pushed to both the Admin CreateRestaurantDto and the Public RegisterRestaurantOwnerDto.

## 9. Database verification
Implemented tx.restaurantBankAccount.create() in Prisma transactions. If bank-details exist, they are written relationally to the restaurant.id. If the operation fails, the entire restaurant onboarding rolls back, preserving database atomicity.

## 10. Security verification
Bank details are purely transmitted in the POST body to the secure registration endpoint. No account numbers are dumped into server logs. No frontend socket connections expose this logic.

## 11. Build results
No syntax errors introduced. Full TypeScript DTO compliance maintained.

## 12. Browser test results
- GPS capture smoothly fills Street, City, State, and PIN Code correctly without forcing a fake/fallback string like Kehnusa or Bandipora.
- Form fields remain editable for manual overrides if reverse-geocoding fails.
- Interactive map container is completely omitted.

## 13. Remaining warnings/blockers
None.

==================================================
FINAL RESULT

REGISTRATION LOCATION = PASS
ADDRESS AUTOFILL = PASS
MAP PICKER REMOVED = PASS
BANK DETAILS = PASS
DATABASE PERSISTENCE = PASS
SECURITY = PASS
BUILD = PASS
