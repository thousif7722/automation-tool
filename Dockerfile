# Multi-stage production build for Instagram Automation OS API

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Stage 1: Install dependencies
FROM base AS dependencies
COPY package.json pnpm-workspace.yaml ./
COPY packages/config/package.json ./packages/config/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/validation/package.json ./packages/validation/
COPY packages/database/package.json ./packages/database/
COPY packages/auth/package.json ./packages/auth/
COPY packages/permissions/package.json ./packages/permissions/
COPY packages/audit/package.json ./packages/audit/
COPY packages/billing/package.json ./packages/billing/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile || pnpm install

# Stage 2: Build source code
FROM dependencies AS builder
COPY . .
RUN pnpm --filter @insta-automation/api build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 4000

USER node

CMD ["node", "dist/index.js"]
