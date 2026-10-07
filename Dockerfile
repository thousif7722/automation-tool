# Multi-stage production build for Instagram Automation OS

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.12.1 --activate
WORKDIR /app

# Stage 1: Install dependencies
FROM base AS dependencies
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy all workspace package.json files for dependency resolution
COPY packages/config/package.json ./packages/config/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/validation/package.json ./packages/validation/
COPY packages/database/package.json ./packages/database/
COPY packages/auth/package.json ./packages/auth/
COPY packages/permissions/package.json ./packages/permissions/
COPY packages/audit/package.json ./packages/audit/
COPY packages/billing/package.json ./packages/billing/
COPY packages/events/package.json ./packages/events/
COPY packages/workflows/package.json ./packages/workflows/
COPY packages/ai/package.json ./packages/ai/
COPY packages/instagram/package.json ./packages/instagram/
COPY packages/queue/package.json ./packages/queue/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY services/automation-worker/package.json ./services/automation-worker/
COPY services/scheduler/package.json ./services/scheduler/
COPY services/webhook-worker/package.json ./services/webhook-worker/

RUN pnpm install --frozen-lockfile

# Stage 2: Build source code
FROM dependencies AS builder
COPY . .
RUN pnpm build

# Stage 3: API Runner
FROM node:20-alpine AS api-runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app ./

EXPOSE 4000

USER node

CMD ["node", "apps/api/dist/index.js"]

# Stage 4: Web Runner (Next.js Standalone)
FROM node:20-alpine AS web-runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

EXPOSE 3000

USER node

CMD ["node", "apps/web/server.js"]
