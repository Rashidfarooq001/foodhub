# Architecture Decision Record (ADR) - FoodHub Monorepo Phase 0

## ADR 001: Adoption of Turborepo and pnpm Workspaces

- **Status:** Accepted
- **Context:** FoodHub consists of 5 distinct applications (`customer-web`, `hotel-dashboard`, `delivery-dashboard`, `admin-dashboard`, `backend`) and 6 shared packages (`ui`, `types`, `config`, `utils`, `hooks`, `api-client`). We needed a fast, scalable monorepo setup to share code seamlessly while keeping apps decoupled.
- **Decision:** Use Turborepo v2.10 with pnpm v11 workspaces.
- **Consequences:** Provides lightning-fast build caching, efficient symlinking of `@foodhub/*` packages, and simple parallel script execution (`pnpm dev`, `pnpm build`).

## ADR 002: Next.js 15 App Router & Server Component Conventions

- **Status:** Accepted
- **Context:** Need standard, high-performance web architecture across 4 web apps.
- **Decision:** Use Next.js 15 App Router across `customer-web`, `hotel-dashboard`, `delivery-dashboard`, and `admin-dashboard`.
- **Consequences:** All components default to Server Components for performance. Shared client components from `@foodhub/ui` are explicitly tagged with `'use client'`.

## ADR 003: NestJS 10 Modular Core Architecture

- **Status:** Accepted
- **Context:** Unified backend needed to serve REST, WebSockets, background queues, and storage integrations.
- **Decision:** Use NestJS 10 Framework configured with domain-driven feature modules (`Common`, `Config`, `Health`, `Logger`, `Database`, `Cache`, `Queue`, `Realtime`, `Storage`, `Notifications`, `Auth`).
- **Consequences:** Decoupled modular design allows seamless future extraction into microservices if needed.

## ADR 004: Shared UI Package with Tailwind CSS & Component Client Boundaries

- **Status:** Accepted
- **Context:** Need consistent visual styling and reusable component UI system across all 4 frontend applications.
- **Decision:** Build `@foodhub/ui` shared package with Tailwind CSS, `clsx`, `tailwind-merge`, and explicit `'use client'` boundaries.
- **Consequences:** Eliminates code duplication across dashboards, ensures unified brand palette, and guarantees React 19 compatibility.
