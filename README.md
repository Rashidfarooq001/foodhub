# FoodHub - Enterprise Multi-Restaurant Food Delivery Ecosystem

FoodHub is a hyper-local multi-restaurant food ordering and delivery ecosystem built with Next.js 15, NestJS 10, Turborepo, and pnpm.

## System Architecture Overview

The ecosystem comprises 5 applications and 6 shared packages:

### Applications (`apps/`)

- `customer-web`: Next.js 15 App Router Customer Web App (Port 3000)
- `hotel-dashboard`: Next.js 15 App Router Kitchen Display & Management (Port 3001)
- `delivery-dashboard`: Next.js 15 App Router Driver PWA (Port 3002)
- `admin-dashboard`: Next.js 15 App Router Enterprise Command Center (Port 3003)
- `backend`: NestJS 10 REST & WebSockets API Gateway (Port 4000)

### Shared Packages (`packages/`)

- `@foodhub/ui`: Shared Tailwind CSS & shadcn/ui React components
- `@foodhub/types`: Shared Zod schemas, TypeScript interfaces & Enums
- `@foodhub/config`: Shared environment configuration & system constants
- `@foodhub/utils`: Shared formatters, validators, and Haversine spatial tools
- `@foodhub/hooks`: Custom React hooks suite (`useTheme`, `useDebounce`, `usePagination`, etc.)
- `@foodhub/api-client`: Axios instance, token manager, and interceptors

## Quick Start Guide

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Docker & Docker Compose (Optional for local Postgres/Redis/Nginx)

### Installation

```bash
# Clone the repository and install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Run all applications concurrently in development mode
pnpm dev
```

## Local Development Localhost Ports

- Customer Web: `http://localhost:3000`
- Hotel Dashboard: `http://localhost:3001`
- Delivery Dashboard: `http://localhost:3002`
- Admin Dashboard: `http://localhost:3003`
- Backend Core API: `http://localhost:4000/api/v1`
- Swagger Documentation: `http://localhost:4000/api/v1/docs`

## Documentation & Architecture Guides

- [Project Structure](docs/PROJECT_STRUCTURE.md)
- [Installation Guide](docs/INSTALLATION_GUIDE.md)
- [Development Guide](docs/DEVELOPMENT_GUIDE.md)
- [Folder Explanation](docs/FOLDER_EXPLANATION.md)
- [Coding Standards](docs/CODING_STANDARDS.md)
