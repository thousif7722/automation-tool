# Instagram Automation OS — Technical Debt Register

> **Severity:** 🔴 CRITICAL | 🟠 HIGH | 🟡 MEDIUM | 🟢 LOW
> **Last Updated:** 2026-10-06

---

## 🔴 CRITICAL — Must fix before any real traffic or production use

### TD-001 — CommentAutomationEngine is Volatile (In-Memory)
**Location:** `apps/api/src/services/commentEngine.ts`
**Problem:** Automation rules are registered in a JavaScript array (`activeRules`). Leads are captured in `leadsDatabase: LeadCaptureRecord[]`. Both are lost on every server restart. There is no persistence to MongoDB.
**Impact:** Zero data durability. Every deploy flushes all rules and captured leads.
**Fix:** Wire `CommentAutomationEngine` to read from `AutomationRuleModel` and write to `LeadModel` and `MessageModel`.

### TD-002 — AccessToken Stored in Plain Text
**Location:** `apps/api/src/models/InstagramAccount.ts` — field `accessToken: String`
**Problem:** Instagram OAuth long-lived access tokens are stored as plain text strings in MongoDB.
**Impact:** Any MongoDB compromise = full access to all connected Instagram accounts. This is a critical OAuth security failure and likely a Meta platform policy violation.
**Fix:** Encrypt with AES-256-GCM before write; decrypt on access. Introduce `ENCRYPTION_KEY` in env.

### TD-003 — JWT `x-demo-user` Bypass Header
**Location:** `apps/api/src/middleware/auth.ts` lines 20-29
**Problem:** Any request with the header `x-demo-user: any-value` bypasses authentication entirely and is treated as an admin user.
**Impact:** Anyone who discovers this header can make admin-level API calls without credentials.
**Fix:** Remove entirely. If dev bypass is needed, gate by `NODE_ENV=development` with an explicit feature flag.

### TD-004 — No Tenant Isolation on Any Database Query
**Location:** All route files (`routes/*.ts`)
**Problem:** Queries like `AutomationRuleModel.find()` return ALL records across ALL users. There is no `workspaceId` or `userId` filter on GET requests.
**Impact:** User A can read User B's workflows, leads, and messages. Complete data exposure.
**Fix:** Add `workspaceId` to all models and enforce it on every query through a `tenantMiddleware` that injects the resolved workspace context.

### TD-005 — Webhook Processing is Synchronous Inside HTTP Request
**Location:** `apps/api/src/webhooks/index.ts` lines 46-54
**Problem:** `await engine.processCommentEvent(...)` is called directly inside the POST /webhooks/instagram handler. This means every comment event runs the full automation pipeline (including potential external API calls) before returning 200 to Meta.
**Impact:** If processing takes > 5 seconds, Meta retries the webhook, causing duplicate automation runs. If the process crashes mid-execution, the event is lost.
**Fix:** Publish events to a BullMQ queue immediately. Return `200 EVENT_RECEIVED`. Let the worker process asynchronously.

### TD-006 — Missing Idempotency Key Tracking
**Location:** `apps/api/src/webhooks/index.ts`
**Problem:** No tracking of processed webhook event IDs (`comment_id`, `message_id`). Meta webhook delivery has at-least-once semantics on retries.
**Impact:** Every retry from Meta = duplicate DM, duplicate lead, duplicate reply. This can spam users and violate Meta's messaging policies.
**Fix:** Store processed event IDs in Redis with TTL. Check before processing.

### TD-007 — Docker Build Broken (Missing Dockerfile)
**Location:** `infrastructure/docker/docker-compose.yml` references `infrastructure/docker/Dockerfile`
**Problem:** The Dockerfile does not exist in the repository.
**Impact:** `docker compose up --build` fails. The project cannot be containerized.
**Fix:** Create a production-ready multi-stage Dockerfile for the API app.

---

## 🟠 HIGH — Must resolve before first beta launch

### TD-008 — Hardcoded OAuth Callback Stores Wrong Username
**Location:** `apps/api/src/routes/meta.ts` lines 46-56
**Problem:** The OAuth callback endpoint doesn't actually exchange the auth code for an access token. It hardcodes `@autoflow_official` and `ig_user_884920` as the connected account.
**Impact:** Meta OAuth integration is non-functional. No real accounts can be connected.
**Fix:** Implement proper Graph API token exchange: `code` → short-lived token → long-lived token → store encrypted.

### TD-009 — InstagramClient and AIAutomationService Are Stubs
**Location:** `apps/api/src/integrations/meta/instagram/index.ts`, `apps/api/src/integrations/ai/index.ts`
**Problem:** Both classes only `console.log` and return fake IDs. No real HTTP calls are made to Meta Graph API or any AI provider.
**Impact:** The product cannot actually send DMs, reply to comments, or generate AI responses.
**Fix:** Implement real Graph API clients with proper error handling, retry logic, and rate limit awareness.

### TD-010 — BullMQ/Redis Installed but Never Used
**Location:** `apps/api/package.json` — `bullmq`, `ioredis` present; zero imports in source code
**Problem:** The queue infrastructure is declared as a dependency but no queue, worker, or job is implemented.
**Impact:** Missing architectural requirement. All events go through HTTP. Cannot scale.
**Fix:** Implement `QueueService`, `AutomationWorker`, and ensure webhook handler enqueues rather than processes inline.

### TD-011 — No Auth Guard on Frontend
**Location:** `apps/web/src/app/page.tsx`
**Problem:** Root redirects directly to `/dashboard` with no authentication check. No token storage, no login context, no auth state.
**Impact:** The SaaS product has no login. Any URL is publicly accessible.
**Fix:** Implement AuthContext with JWT storage, protected route wrapper, and redirect to `/login` when unauthenticated.

### TD-012 — Subscription/Usage Model is User-Scoped, Not Workspace-Scoped
**Location:** `apps/api/src/models/Subscription.ts`, `apps/api/src/models/Usage.ts`
**Problem:** Both models store `userId: String` as the tenant key. The platform uses Workspace as the entity boundary (a user can have multiple workspaces, a workspace can have multiple users).
**Impact:** Billing breaks in multi-workspace and team-member scenarios.
**Fix:** Migrate to `workspaceId` as the key. One subscription and one usage record per workspace.

### TD-013 — Analytics Route Uses Hardcoded Fallback Numbers
**Location:** `apps/api/src/routes/analytics.ts` lines 25-32
**Problem:** `commentsProcessed: commentsProcessed || 1482`, `dmsSent: dmsSent || 1320`, etc. If the database returns zero counts, fabricated numbers are returned instead.
**Impact:** Dashboard shows fake metrics. Cannot detect actual zero-activity correctly.
**Fix:** Remove hardcoded fallbacks. Return real zeros.

### TD-014 — Root `package.json` Has Duplicate/Conflicting Dependencies
**Location:** `package.json` (root) vs `apps/api/package.json`
**Problem:** The root `package.json` declares `express`, `mongoose`, `bcryptjs`, `dotenv`, `zod`, `jsonwebtoken` as dependencies — these belong only to the `api` app. The root should have only workspace tooling.
**Impact:** Potential version conflicts between root and app-level packages, confusing install behavior.
**Fix:** Remove app-level deps from root `package.json`.

### TD-015 — Nginx Config Has No SSL, No Web/Admin Proxying
**Location:** `infrastructure/nginx/nginx.conf`
**Problem:** Only routes traffic to `api:4000`. No HTTPS. No proxy rules for `web:3000` or `admin:3001`.
**Impact:** Cannot serve the frontend apps through the reverse proxy.
**Fix:** Add full Nginx config with SSL termination (certbot/Let's Encrypt), and proxy blocks for all three apps.

---

## 🟡 MEDIUM — Must address within first production sprint

### TD-016 — No Rate Limiting on API
**Problem:** No `express-rate-limit` or equivalent middleware on any route.
**Fix:** Add per-IP rate limiting globally; per-user rate limiting on sensitive routes.

### TD-017 — No Input Sanitization Beyond Zod
**Problem:** `sanitizeText` exists in utils but is not applied in any route handler. XSS/injection risk in stored comment text and DM content.
**Fix:** Apply `sanitizeText` to all user-supplied string fields before persistence.

### TD-018 — No Request Logging / Audit Trail
**Problem:** No structured request logging (no Winston, Pino, or Morgan). No audit log for sensitive operations.
**Fix:** Implement structured logging middleware; create AuditLog model for sensitive operations.

### TD-019 — Test Framework is Non-Standard
**Problem:** Tests use Node's built-in `assert` with a custom runner. There is no Jest config, no `jest` command, no `pnpm test` that actually runs.
**Fix:** Set up Vitest or Jest with proper config. Convert existing tests.

### TD-020 — JWT_SECRET Has Insecure Default
**Location:** `apps/api/src/routes/auth.ts` line 10, `apps/api/src/middleware/auth.ts` line 4
**Problem:** `JWT_SECRET` defaults to `'super_secret_jwt_key_change_in_production'`.
**Fix:** Fail fast on startup if `JWT_SECRET` env var is not set or equals the default value in non-development modes.

### TD-021 — Google OAuth Incomplete
**Problem:** The `/api/auth/google` endpoint accepts decoded Google user data from the frontend (name, email, googleId). It does NOT verify the Google ID Token server-side with Google's public keys.
**Impact:** Spoofed Google logins — any client can claim to be any Google user.
**Fix:** Accept the Google `id_token` from the client and verify it server-side using `google-auth-library`.

### TD-022 — `packages/ui` is Empty
**Problem:** The shared UI package exists in the workspace but has no components.
**Impact:** Each app builds its own components independently, leading to inconsistency.
**Fix:** Extract shared Button, Modal, Table, Badge, Input components into `packages/ui`.

---

## 🟢 LOW — Housekeeping

### TD-023 — Stray Files in Monorepo Root
`old_page.tsx`, `ui_panels_showcase.md`, `tree.txt`, `tree_initial.txt`, `user_dashboard_panel_*` files in root of `automation agents/`. Not part of source code.

### TD-024 — `apps/web` Has No Tailwind CSS Config
Uses a mix of inline styles and Tailwind class names (`className="md:hidden"`, `className="grid grid-cols-1 md:grid-cols-12"`). No `tailwind.config.ts` or `postcss.config.js` in `apps/web`. Tailwind classes will not work.

### TD-025 — `routes/automation.ts` Duplicates `routes/workflows.ts`
Two separate routes manage automation rules with overlapping concerns and different data sources (one uses in-memory engine, the other uses MongoDB). Should be unified.

### TD-026 — Hard-Coded Default Account in `/api/instagram/accounts`
Returns a fake `@autoflow_official` account when no real accounts exist. This masks the actual unconnected state.
