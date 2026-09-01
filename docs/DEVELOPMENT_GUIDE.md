# Development Workflow Guide

## Turbo Pipeline Commands

- `pnpm dev`: Start all apps concurrently with hot-reloading.
- `pnpm build`: Build all applications and packages via Turborepo caching.
- `pnpm lint`: Run ESLint across all apps and packages.
- `pnpm type-check`: Run TypeScript compiler checks (`tsc --noEmit`).
- `pnpm format`: Format all files using Prettier.
- `pnpm clean`: Clean `.next`, `dist`, and `node_modules` caches.

## Working with Workspace Packages

To add a shared package dependency to an application:

```bash
pnpm --filter customer-web add @foodhub/ui@workspace:*
```
