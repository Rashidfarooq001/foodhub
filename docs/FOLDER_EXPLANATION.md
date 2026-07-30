# Folder Hierarchy & Responsibility Explanation

- `apps/customer-web`: End-user customer portal for browsing restaurants, customizing dishes, cart checkout, and tracking deliveries.
- `apps/hotel-dashboard`: Restaurant partner portal for managing live kitchen order queues (KDS), stock toggles, and payout ledgers.
- `apps/delivery-dashboard`: Mobile-optimized driver PWA portal for accepting delivery offers, turn-by-turn navigation, and OTP verification.
- `apps/admin-dashboard`: Platform operational command center for merchant onboarding, driver KYC audits, and financial settlements.
- `apps/backend`: NestJS monolithic service containing modular domain logic (Auth, Orders, Payments, Delivery, Storage, etc.).
- `packages/ui`: Reusable component system using Tailwind CSS and shadcn/ui.
- `packages/types`: Shared TypeScript definitions and Zod validation schemas.
- `packages/utils`: Helper functions, spatial math, and currency/phone formatters.
- `packages/hooks`: Shared React custom hooks (`useTheme`, `useDebounce`, etc.).
- `packages/api-client`: Shared Axios client instance, token manager, and error handlers.
