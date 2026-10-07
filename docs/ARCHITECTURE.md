# Instagram Automation OS — Architecture

> **Repository:** `d:\automation agents` (monorepo, referred to as `insta-automation`)
> **Last Inspected:** 2026-10-06
> **Inspected by:** Antigravity AI Principal Architect

---

## 1. Current Monorepo Layout

```
insta-automation/
├── apps/
│   ├── api/           Express + TypeScript backend            → port 4000
│   ├── web/           Next.js 14 customer dashboard           → port 3000
│   ├── admin/         Next.js 14 super-admin panel            → port 3001
│   └── landing/       Next.js 16 public marketing site        → port 3002
├── packages/
│   ├── types/         Shared TypeScript interfaces
│   ├── utils/         verifyMetaSignature, matchCommentKeyword, sanitizeText
│   ├── validation/    Zod schemas (auth, automation, webhook)
│   ├── config/        System plan definitions
│   └── ui/            (empty — no shared components yet)
├── infrastructure/
│   ├── docker/        docker-compose.yml (api + mongo + redis)
│   └── nginx/         nginx.conf (reverse proxy, api only)
├── docs/
│   └── architecture/  overview.md (skeletal)
├── .env               Environment variable template
├── pnpm-workspace.yaml
└── package.json
```

**Package Manager:** pnpm (workspace)
**Node Requirement:** ≥ 18.0.0
**Language:** TypeScript 5.x throughout (all apps)

---

## 2. Backend — `apps/api` (Express 4)

### 2.1 Entry Point (`src/index.ts`)

- Connects to MongoDB via Mongoose (with console-warn-only fallback)
- Instantiates `CommentAutomationEngine` at startup with one hard-coded demo rule
- Registers all route groups on `/api/*`
- Starts HTTP server on `PORT` (default 4000)

### 2.2 Route Groups

| Route Prefix | File | Status |
|---|---|---|
| `/api/auth` | `routes/auth.ts` | ✅ Functional (JWT + Google) |
| `/api/billing` | `routes/billing.ts` | ✅ Functional (dev provider) |
| `/api/billing/razorpay` | `routes/razorpay.ts` | ⚠️ Stubbed (no real SDK) |
| `/api/contacts` | `routes/contacts.ts` | ⚠️ Minimal |
| `/api/forms` | `routes/forms.ts` | ⚠️ Minimal |
| `/api/workspaces` | `routes/workspaces.ts` | ⚠️ Minimal |
| `/api/meta` | `routes/meta.ts` | ⚠️ OAuth stub — hardcoded username |
| `/api/instagram` | `routes/instagram.ts` | ⚠️ Hardcoded fallback account |
| `/api/workflows` | `routes/workflows.ts` | ✅ CRUD to MongoDB |
| `/api/automations` | `routes/automation.ts` | ⚠️ In-memory engine only |
| `/api/webhooks` | `webhooks/index.ts` | ✅ Meta HMAC verified |
| `/api/leads` | `routes/leads.ts` | ⚠️ Stub |
| `/api/messages` | `routes/messages.ts` | ⚠️ Stub |
| `/api/analytics` | `routes/analytics.ts` | ⚠️ Hardcoded fallbacks in response |
| `/api/admin` | `routes/admin.ts` | ⚠️ Auth-guarded, minimal stats |

### 2.3 Mongoose Models

| Model | File | Notes |
|---|---|---|
| User | `models/User.ts` | Roles: user/admin/superadmin |
| Workspace | `models/Workspace.ts` | RBAC roles: OWNER/ADMIN/MANAGER/EDITOR/VIEWER |
| InstagramAccount | `models/InstagramAccount.ts` | userId ref, accessToken stored in plain text |
| AutomationRule | `models/AutomationRule.ts` | Keyword matching, has nodes/edges for future visual builder |
| Lead | `models/Lead.ts` | Minimal: username, keyword, commentText |
| Message | `models/Message.ts` | INBOUND/OUTBOUND, status tracking |
| WorkflowExecution | `models/WorkflowExecution.ts` | Minimal log array |
| Subscription | `models/Subscription.ts` | Per-user (not per-workspace) billing |
| Usage | `models/Usage.ts` | Per-user usage counters |
| Contact | (presumed in `routes/contacts.ts`) | Not located |
| Form | `models/Form.ts` | Exists |
| Plan | `models/Plan.ts` | Exists (separate from config/plans.ts) |

### 2.4 Middleware

| Middleware | File | Notes |
|---|---|---|
| `authMiddleware` | `middleware/auth.ts` | JWT verify; **DANGEROUS** `x-demo-user` bypass header |
| `adminOnly` | `middleware/auth.ts` | Role check for admin/superadmin |
| `checkPlanLimit` | `middleware/planLimit.ts` | Per-resource quota enforcement |

### 2.5 Services

| Service | File | Notes |
|---|---|---|
| `CommentAutomationEngine` | `services/commentEngine.ts` | **In-memory only** — rules and leads not persisted |
| `BillingService` | `services/billingService.ts` | `DevPaymentProvider` by default; IPaymentProvider abstraction exists |

### 2.6 Integrations

| Integration | File | Status |
|---|---|---|
| `InstagramClient` | `integrations/meta/instagram/index.ts` | **Stub** — only console.log, no real HTTP |
| `FacebookClient` | `integrations/meta/facebook/index.ts` | **210 bytes — essentially empty** |
| `AIAutomationService` | `integrations/ai/index.ts` | **Stub** — returns hardcoded string |
| Razorpay | `integrations/razorpay/index.ts` | **351 bytes — essentially empty** |
| WhatsApp | `integrations/whatsapp/index.ts` | **313 bytes — essentially empty** |

### 2.7 Queue Infrastructure

- `bullmq` and `ioredis` are in `apps/api/package.json` **but never imported or used anywhere.**
- There is **no worker process**, no queue, no job scheduler.
- All automation runs synchronously inside the HTTP request/response cycle.

---

## 3. Frontend — `apps/web` (Next.js 14)

### 3.1 Pages Discovered

| Route | File | Status |
|---|---|---|
| `/` | `app/page.tsx` | Redirects to `/dashboard` |
| `/dashboard` | `app/dashboard/page.tsx` | Large single-file page (~430 lines) |
| `/workflows` | `app/workflows/page.tsx` | Functional list with API fetch |
| `/analytics` | `app/analytics/page.tsx` | Exists |
| `/leads` | `app/leads/page.tsx` | Exists |
| `/messages` | `app/messages/page.tsx` | Exists |
| `/settings` | `app/settings/page.tsx` | Exists |
| `/inbox` | `app/inbox/page.tsx` | Exists |
| `/contacts` | `app/contacts/page.tsx` | Exists |
| `/ai-builder` | `app/ai-builder/page.tsx` | Exists |
| `/builder` | `app/builder/page.tsx` | Exists |
| `/channels` | `app/channels/page.tsx` | Exists |
| `/forms` | `app/forms/page.tsx` | Exists |
| `/templates` | `app/templates/page.tsx` | Exists |
| `/pricing` | `app/pricing/page.tsx` | Exists |
| `/link-page` | `app/link-page/page.tsx` | Exists |

### 3.2 Shared Components

| Component | Notes |
|---|---|
| `Sidebar.tsx` | Full nav with dark theme, mobile hamburger, bottom nav bar |
| `Topbar.tsx` | Present |
| `UpgradeModal.tsx` | Present |
| `AuthModal.tsx` | 181 bytes — essentially empty |

### 3.3 Key Observations

- No Tailwind CSS config in `apps/web` — uses inline styles and manual CSS classes.
- No auth context or token management — the frontend has **no login gate**.
- `NEXT_PUBLIC_API_URL` used for API calls but not set in `.env` consistently.
- No React Flow or visual workflow builder implementation exists yet.
- No shared UI package used (the `packages/ui` package is empty).

---

## 4. Admin Panel — `apps/admin` (Next.js 14)

- `apps/admin/src/app/layout.tsx` — exists (minimal)
- `apps/admin/src/app/page.tsx` — 15,514 bytes, appears to have basic admin UI
- **No sub-pages** (no `/users`, `/subscriptions`, etc.)
- No separate authentication; relies on URL obscurity

---

## 5. Landing — `apps/landing` (Next.js 16)

- Non-trivial marketing page with multiple editorial sections
- Runs on port 3002
- Has Tailwind CSS configured
- Separate from the main SaaS app

---

## 6. Shared Packages

### `@insta-automation/types`
Defines: `User`, `AuthResponse`, `InstagramAccount`, `CommentAutomationRule`, `InstagramCommentWebhookEvent`, `CommentExecutionResult`, `LeadCaptureRecord`, `AnalyticsSummary`

**Gap:** Missing types for: `WorkflowNode`, `WorkflowEdge`, `AIAgent`, `ToolCall`, `TenantContext`, `RBACPolicy`

### `@insta-automation/utils`
Provides: `verifyMetaSignature`, `matchCommentKeyword`, `sanitizeText`, `formatTimestamp`

**Gap:** No retry logic, no idempotency helpers, no exponential backoff utilities

### `@insta-automation/validation`
Provides Zod schemas for: `GoogleLoginSchema`, `LoginSchema`, `SignupSchema`, `CommentTriggerRuleSchema`, `WebhookPayloadSchema`

**Gap:** No workflow validation, no AI prompt validation, no tool call schema validation

### `@insta-automation/config`
Provides: `SYSTEM_PLANS` array (5 plans from FREE to BUSINESS, priced in INR)

### `packages/ui`
**Empty — no implementation.**

---

## 7. Infrastructure

### Docker
- `infrastructure/docker/docker-compose.yml` — api + mongo + redis
- **No Dockerfile for api** — the compose references `infrastructure/docker/Dockerfile` which does **not exist**
- No docker-compose for web or admin apps
- No health check probes defined

### Nginx
- `infrastructure/nginx/nginx.conf` — proxies port 80 → api:4000 only
- **No SSL/TLS configuration**
- **No proxy config for web, admin, landing apps**

---

## 8. Testing

- `apps/api/tests/commentEngine.test.ts` — custom assertion-based test (uses Node's `assert`, not Jest)
- `apps/api/tests/runTests.js` — manual runner
- **No Jest configuration**, no test command that actually runs
- **No frontend tests**
- **No integration tests**
- **No API contract tests**

---

## 9. Environment Configuration

Current `.env`:
- Core services: PORT, NODE_ENV, API_URL, WEB_URL, LANDING_URL
- Databases: MONGODB_URI, REDIS_HOST, REDIS_PORT
- Auth: JWT_SECRET (insecure default), GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- Meta: META_APP_ID, META_APP_SECRET, META_VERIFY_TOKEN
- Payment: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
- AI: OPENAI_API_KEY only

**Missing:** REDIS_PASSWORD, ENCRYPTION_KEY (for access token storage), META_REDIRECT_URI (prod), AI provider abstraction vars (Bedrock, Gemini, Ollama)

---

## 10. Proposed Target Architecture

```
                           ┌─────────────────────────────────┐
                           │      PUBLIC INTERNET / META      │
                           └──────────────┬──────────────────┘
                                          │ Webhooks / OAuth
                           ┌──────────────▼──────────────────┐
                           │         Nginx / API Gateway       │
                           │     SSL Termination + Rate Limit  │
                           └──────┬──────────┬───────────────┘
                    ┌─────────────▼──┐  ┌────▼────────────────┐
                    │   apps/api     │  │   apps/web (Next.js) │
                    │  Express+TS    │  │   Customer Dashboard  │
                    └──────┬─────────┘  └────────────────────-┘
                           │
          ┌────────────────┼───────────────────────┐
          │                │                       │
   ┌──────▼──────┐  ┌──────▼──────┐  ┌────────────▼─────────┐
   │  MongoDB    │  │    Redis    │  │     BullMQ Workers    │
   │  (Mongoose) │  │  (Cache +   │  │  - AutomationWorker   │
   │             │  │   Queues)   │  │  - NotificationWorker │
   └─────────────┘  └─────────────┘  └──────────────────────┘
                                               │
                          ┌────────────────────▼──────────────┐
                          │         AI Layer (Abstracted)       │
                          │  ModelProvider ← ToolRegistry       │
                          │  AgentOrchestrator ← ContextMgr     │
                          │  Ollama | Bedrock | Gemini          │
                          └────────────────────────────────────┘
```

### Multi-Tenancy Model (Target)
Every entity scoped to `workspaceId`:
- Workspace → Users (many-to-many via WorkspaceMember)
- Workspace → InstagramAccounts
- Workspace → AutomationRules (Workflows)
- Workspace → Leads
- Workspace → Messages / Conversations
- Workspace → Analytics
- Workspace → Subscription / Usage

### Event Pipeline (Target)
```
Meta Webhook POST
  → API (respond 200 immediately)
  → EventNormalizer
  → Redis Queue (BullMQ)
  → AutomationWorker
  → WorkflowEngine
  → ToolExecutor (with security pipeline)
  → Instagram Graph API / External
  → AuditLog
```
