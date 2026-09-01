# Engineering Coding Standards & Guidelines

## 1. Strict TypeScript Rules

- Strict mode enabled (`"strict": true`).
- Implicit `any` is prohibited (`"noImplicitAny": true`).
- All exported functions must have explicit parameter and return types.

## 2. Architecture & File Limits

- SOLID design principles strictly enforced.
- Maximum file size: **500 lines**.
- Maximum function size: **100 lines**.
- Prefer small, composable, single-responsibility files.

## 3. Component & State Management

- Next.js 15 Server Components by default.
- Use `'use client'` strictly when client state or hooks are required.
- Validate all forms with React Hook Form + Zod resolvers.
- Global UI state via Zustand; server state via TanStack Query.
