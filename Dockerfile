# Multi-stage production build for Instagram Automation OS API

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
RUN pnpm --filter @insta-automation/api build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app ./

EXPOSE 4000

USER node

CMD ["node", "apps/api/dist/apps/api/src/index.js"]
