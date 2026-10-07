# Instagram Automation OS — Development Guide

> **Repository Location:** `d:\automation agents`
> **This Guide Covers:** Local development setup, running the apps, contributing code, and coding standards.

---

## 1. Prerequisites

| Tool | Minimum Version | Install |
|---|---|---|
| Node.js | 18.0.0 | https://nodejs.org |
| pnpm | 8.0.0 | `npm install -g pnpm` |
| MongoDB | 6.0+ | Docker (recommended) or MongoDB Atlas |
| Redis | 7.0+ | Docker (recommended) |
| TypeScript | 5.x | Included via devDependencies |

---

## 2. Initial Setup

```bash
# Clone / navigate to the monorepo
cd "d:\automation agents"

# Install all workspace dependencies
pnpm install

# Copy environment file
cp .env.example .env
# → Edit .env with your local values
```

### Minimum Required .env Values for Local Dev

```bash
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/insta_automation
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=<generate: openssl rand -base64 64>
```

---

## 3. Start Infrastructure (Docker)

```bash
# Start MongoDB + Redis
docker run -d --name mongo -p 27017:27017 mongo:latest
docker run -d --name redis -p 6379:6379 redis:alpine

# Or use the provided docker-compose (API will fail to build due to TD-007)
# Once Dockerfile is fixed:
# docker compose -f infrastructure/docker/docker-compose.yml up -d mongo redis
```

---

## 4. Running Each App

### API (port 4000)
```bash
cd apps/api
pnpm dev
# → ts-node-dev --respawn --transpile-only src/index.ts
```

### Web Dashboard (port 3000)
```bash
cd apps/web
pnpm dev
# → next dev -p 3000
```

### Admin Panel (port 3001)
```bash
cd apps/admin
pnpm dev
# → next dev -p 3001 (currently missing this -p flag; check package.json)
```

### Landing Page (port 3002)
```bash
cd apps/landing
pnpm dev
# → next dev -p 3002
```

### Run All Apps Simultaneously
```bash
# From monorepo root (runs all apps)
pnpm dev
```

---

## 5. Port Reference

| App | Port | URL |
|---|---|---|
| API (Express) | 4000 | http://localhost:4000 |
| Web Dashboard | 3000 | http://localhost:3000 |
| Admin Panel | 3001 | http://localhost:3001 |
| Landing Page | 3002 | http://localhost:3002 |
| MongoDB | 27017 | mongodb://localhost:27017 |
| Redis | 6379 | redis://localhost:6379 |

**Health Check:** `GET http://localhost:4000/api/health`

---

## 6. Project Structure Conventions

```
apps/api/src/
  ├── config/          Static configuration (plans, constants)
  ├── integrations/    External service clients (Meta, AI, Razorpay)
  │   ├── meta/        Instagram + Facebook API clients
  │   ├── ai/          ModelProvider abstraction + implementations
  │   └── razorpay/    Payment gateway client
  ├── middleware/      Express middleware (auth, tenant, rate limit, validation)
  ├── models/          Mongoose schemas (one file per collection)
  ├── queues/          BullMQ queue definitions + workers
  ├── routes/          Express router (one file per resource)
  ├── services/        Business logic (CommentEngine, BillingService, etc.)
  └── webhooks/        Webhook handlers (Meta, Razorpay)
```

---

## 7. Coding Standards

### TypeScript
- **Strict mode** required: `"strict": true` in all `tsconfig.json`
- No `any` casts unless absolutely necessary (and must be commented)
- All exported functions must have return type annotations
- Use `interface` for object shapes, `type` for unions/intersections

### Naming Conventions
```
Models:         PascalCase noun         UserModel, AutomationRuleModel
Routes:         camelCase noun + Router authRouter, workflowsRouter
Services:       PascalCase noun + Service  BillingService, CommentAutomationEngine
Middleware:     camelCase verb + Ware  authMiddleware, tenantMiddleware
Queues:         camelCase noun + Queue  automationQueue, notificationQueue
Workers:        PascalCase noun + Worker  AutomationWorker
```

### Route Handler Pattern
Every route handler must follow this pattern:

```typescript
router.get('/', authMiddleware, workspaceTenantMiddleware, async (req: AuthRequest, res) => {
  try {
    // Always include workspaceId in data queries
    const items = await Model.find({ workspaceId: req.workspace.id }).lean();
    return res.json({ success: true, data: items });
  } catch (error: any) {
    console.error('[Route Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});
```

### Model Field Requirements
Every Mongoose model for tenant data MUST include:
```typescript
workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true }
createdBy:   { type: Schema.Types.ObjectId, ref: 'User', index: true }
// + timestamps: true in schema options
```

### API Response Shape
All API responses must follow this shape:
```typescript
// Success
{ success: true, data?: any, message?: string }

// Error
{ success: false, message: string, code?: string, errors?: any }
```

---

## 8. Environment Variables Reference

```bash
# ─── CORE ───────────────────────────────────────
PORT=4000
NODE_ENV=development                     # development | production | test

# ─── SERVICES ───────────────────────────────────
API_URL=http://localhost:4000
WEB_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001
LANDING_URL=http://localhost:3002

# ─── DATABASE ───────────────────────────────────
MONGODB_URI=mongodb://localhost:27017/insta_automation
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=                          # Required in production

# ─── SECURITY ───────────────────────────────────
JWT_SECRET=                              # ≥ 64 random chars — REQUIRED
ENCRYPTION_KEY=                          # 32 hex bytes — for token encryption

# ─── GOOGLE OAUTH ───────────────────────────────
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
FRONTEND_URL=http://localhost:3000

# ─── META / INSTAGRAM ───────────────────────────
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_VERIFY_TOKEN=your_custom_verify_token
META_REDIRECT_URI=http://localhost:4000/api/meta/callback

# ─── PAYMENT ────────────────────────────────────
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx

# ─── AI PROVIDERS ───────────────────────────────
ACTIVE_AI_PROVIDER=ollama               # ollama | bedrock | gemini | openai
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3
AWS_REGION=us-east-1                    # for Bedrock
AWS_ACCESS_KEY_ID=                      # for Bedrock (prefer IAM role in prod)
AWS_SECRET_ACCESS_KEY=                  # for Bedrock
BEDROCK_MODEL_ID=amazon.nova-lite-v1:0
GEMINI_API_KEY=
OPENAI_API_KEY=                         # fallback
```

---

## 9. Testing

### Running Tests
```bash
# unit tests (when Jest is configured)
pnpm test

# run existing custom tests
cd apps/api
node tests/runTests.js
```

### Test Strategy
1. **Unit tests**: Every service, utility, and middleware must have unit tests
2. **Integration tests**: API routes tested with supertest + in-memory MongoDB
3. **E2E tests**: Critical user flows (register, connect account, create automation, trigger, check lead)

### Test File Locations
```
apps/api/tests/            Backend unit + integration tests
apps/web/__tests__/        Frontend component tests (planned)
packages/utils/tests/      Shared utility tests
```

---

## 10. Git Workflow

```
main          → production-ready code only
develop       → integration branch
feature/xxx   → individual feature branches
fix/xxx       → bug fix branches
```

### Commit Message Format
```
type(scope): short description

Types: feat, fix, refactor, docs, test, chore, security
Scopes: api, web, admin, landing, packages, infra

Examples:
  feat(api): implement BullMQ automation queue
  fix(api): remove x-demo-user auth bypass (TD-003)
  security(api): encrypt Instagram access tokens at rest
```

---

## 11. Adding a New API Route

1. Create the Zod schema in `packages/validation/src/`
2. Create the route file in `apps/api/src/routes/`
3. Add `authMiddleware` and `workspaceTenantMiddleware` to protected routes
4. Include `workspaceId` in all DB queries
5. Register the router in `apps/api/src/index.ts`
6. Write tests in `apps/api/tests/`
7. Update API documentation

## 12. Adding a New Mongoose Model

1. Create file in `apps/api/src/models/ModelName.ts`
2. Always include: `workspaceId`, `createdBy`, `{ timestamps: true }`
3. Add relevant indexes for common query patterns
4. Export the model with the `mongoose.models.X || mongoose.model(...)` pattern to prevent recompilation issues
5. Add corresponding TypeScript interface to `packages/types/src/index.ts`

## 13. Adding a New AI Provider

1. Create `apps/api/src/integrations/ai/providers/ProviderName.ts`
2. Implement the `ModelProvider` interface
3. Register in `AIProviderFactory` based on `ACTIVE_AI_PROVIDER` env var
4. Add required env vars to `.env.example` and `DEVELOPMENT.md`
5. Test with a simple prompt in isolation before integrating
