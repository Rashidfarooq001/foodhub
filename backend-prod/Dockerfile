# =====================================================
# Stage 1: Dependencies
# =====================================================
FROM node:22-alpine AS deps

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/ ./packages/

# Install production deps only
RUN pnpm install --frozen-lockfile --prod --filter backend...

# =====================================================
# Stage 2: Builder
# =====================================================
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/ ./packages/

# Install ALL deps (including devDependencies for build)
RUN pnpm install --frozen-lockfile --filter backend...

# Copy backend source
COPY apps/backend/ ./apps/backend/
COPY packages/ ./packages/

# Generate Prisma client and build
WORKDIR /app/apps/backend
RUN pnpm exec prisma generate
RUN pnpm exec nest build

# =====================================================
# Stage 3: Production Runner
# =====================================================
FROM node:22-alpine AS runner

# Security: run as non-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

WORKDIR /app

# Copy production node_modules from deps stage
COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=nestjs:nodejs /app/apps/backend/node_modules ./apps/backend/node_modules

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder --chown=nestjs:nodejs /app/packages ./packages

# Copy package metadata
COPY --chown=nestjs:nodejs apps/backend/package.json ./apps/backend/

# Prisma client (generated)
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/.pnpm ./node_modules/.pnpm

USER nestjs

# Expose HTTP port (configurable via PORT env)
EXPOSE 4000

# Health check using the ready endpoint (checks DB + Redis)
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT||4000) + '/api/v1/health', r => process.exit(r.statusCode===200?0:1)).on('error', () => process.exit(1))"

WORKDIR /app/apps/backend

# Graceful shutdown is handled by NestJS app.close() on SIGTERM
# The start script runs migrations then boots the server
CMD ["node", "dist/src/main.js"]
