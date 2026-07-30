# Project Structure Guide

```
foodhub/
├── apps/
│   ├── customer-web/          # Next.js 15 App Router Customer Portal
│   ├── hotel-dashboard/       # Next.js 15 App Router Hotel KDS
│   ├── delivery-dashboard/    # Next.js 15 App Router Delivery PWA
│   ├── admin-dashboard/       # Next.js 15 App Router Admin Command Center
│   └── backend/               # NestJS Core Framework API Gateway
├── packages/
│   ├── ui/                    # Shared shadcn/ui React components
│   ├── types/                 # Shared TypeScript interfaces & Zod schemas
│   ├── config/                # Shared environment & system constants
│   ├── utils/                 # Shared formatters, validators & spatial math
│   ├── hooks/                 # Shared React hooks suite
│   └── api-client/            # Axios API client, interceptors & token manager
├── docs/                      # Architectural documentation
├── docker/                    # Dockerfiles, Compose & Nginx configs
├── scripts/                   # Workspace utility scripts
└── .github/                   # GitHub Actions CI/CD workflows
```
