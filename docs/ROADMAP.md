# Instagram Automation OS — Implementation Roadmap

> **Principle:** INSPECT → PLAN → IMPLEMENT → TEST → VERIFY → DOCUMENT → REPORT → STOP
> Each phase stops and awaits explicit instruction before the next phase begins.

---

## Current State Summary

The existing codebase (`d:\automation agents`) has:
- ✅ Monorepo skeleton (pnpm workspaces)
- ✅ Express API structure with routes grouping
- ✅ Mongoose models (User, Workspace, InstagramAccount, AutomationRule, Lead, Message, Subscription, Usage)
- ✅ Auth routes (register, login, Google OAuth partial)
- ✅ Webhook signature verification
- ✅ Billing service abstraction (BillingService / IPaymentProvider)
- ✅ Plan definitions (5 tiers, INR pricing)
- ✅ Shared packages (types, utils, validation, config)
- ✅ Customer dashboard UI (dark theme, sidebar, multiple pages)
- ⚠️ Many stubs not yet connected to real APIs
- ❌ Critical security issues (see SECURITY.md and TECHNICAL-DEBT.md)
- ❌ No event-driven architecture (BullMQ unused)
- ❌ No multi-tenant isolation
- ❌ No real Meta Graph API integration

---

## Phase 0 — Foundation Hardening (Security & Data Integrity)

**Goal:** Make the existing codebase production-safe before building new features.

> **Do NOT build new features until Phase 0 is complete.**

### 0.1 Critical Security Fixes
- [ ] Remove `x-demo-user` bypass in `middleware/auth.ts`
- [ ] Add startup validation: fail fast if `JWT_SECRET` is default/empty
- [ ] Implement `ENCRYPTION_KEY` and AES-256-GCM encryption for access tokens
- [ ] Implement Google ID Token server-side verification with `google-auth-library`
- [ ] Tighten CORS to specific allowed origins

### 0.2 Tenant Isolation
- [ ] Add `workspaceId: ObjectId` field to: `AutomationRule`, `Lead`, `Message`, `InstagramAccount`, `WorkflowExecution`
- [ ] Add `workspaceId` to `Subscription` and `Usage` (replacing userId)
- [ ] Create `workspaceTenantMiddleware` that resolves and injects workspace context
- [ ] Apply tenant filter to ALL list/read queries
- [ ] Write test cases proving cross-tenant data isolation

### 0.3 Webhook Idempotency
- [ ] Create `ProcessedEvent` model or Redis-based tracker
- [ ] Check `eventId` before processing any webhook
- [ ] Store `eventId` with 48h TTL after processing

### 0.4 Fix Root Package.json
- [ ] Remove app-level dependencies from root `package.json`
- [ ] Verify `pnpm install` works cleanly

**Exit Criteria:** No critical security issues remain open. Tenant isolation passes test suite.

---

## Phase 1 — Event-Driven Core

**Goal:** Replace synchronous automation with a proper queue-based system.

### 1.1 BullMQ Infrastructure
- [ ] Create `QueueService` singleton in `apps/api/src/queues/`
- [ ] Define queues: `automation`, `notifications`, `instagram-api`, `ai-tasks`
- [ ] Create `AutomationWorker` that processes automation jobs
- [ ] Create `NotificationWorker` for email/Slack alerts

### 1.2 Webhook Refactor
- [ ] Webhook POST `/api/webhooks/instagram` → enqueue to `automation` queue immediately → return 200
- [ ] Move all event processing logic from inline handler to `AutomationWorker`
- [ ] Handle message events (DMs), comment events, mention events, story reply events

### 1.3 CommentAutomationEngine Refactor
- [ ] Load active rules from MongoDB on startup and on cache miss
- [ ] Write leads to `LeadModel` (not in-memory array)
- [ ] Write messages to `MessageModel` (not in-memory array)
- [ ] Record `WorkflowExecution` for every automation run
- [ ] Track retry state and failure reasons

### 1.4 Retry & Dead Letter
- [ ] Configure retry policy: 3 attempts with exponential backoff
- [ ] Failed jobs after max retries → `dead-letter` queue
- [ ] Admin endpoint to list and reprocess dead-letter jobs

**Exit Criteria:** Webhook events are processed asynchronously. No automation occurs inside HTTP request. Retry and DLQ functional.

---

## Phase 2 — Real Meta Integration

**Goal:** Connect to the actual Instagram Graph API.

### 2.1 InstagramClient Implementation
- [ ] Replace stub `InstagramClient` with real Graph API client
- [ ] Implement: `replyToComment(commentId, text)` → POST /v19.0/{comment-id}/replies
- [ ] Implement: `sendDirectMessage(recipientId, text)` → POST /v19.0/me/messages
- [ ] Implement: `getProfile(userId)` → GET /v19.0/{user-id}?fields=name,biography
- [ ] Implement: `getMediaComments(mediaId)` → GET /v19.0/{media-id}/comments
- [ ] Add proper error handling for Graph API error codes (190, 200, 368, etc.)
- [ ] Add rate limit respect (200 calls/hour per app)
- [ ] Retry with exponential backoff on 5xx / rate limit errors

### 2.2 Meta OAuth Flow
- [ ] Implement real token exchange in `/api/meta/callback`:
  - Exchange `code` for short-lived token
  - Exchange short-lived for long-lived token (60-day)
  - Store encrypted token in `InstagramAccount`
- [ ] Implement token refresh scheduler (every 45 days)
- [ ] Implement webhook subscription setup after account connection
- [ ] State parameter CSRF validation

### 2.3 Meta Scope Review
Required scopes for full platform:
```
instagram_basic
instagram_manage_comments
instagram_manage_messages
instagram_content_publish
pages_show_list
pages_read_engagement
pages_manage_metadata
```

**Exit Criteria:** Real Instagram accounts can be connected. Real DMs can be sent and received. Real comment replies work.

---

## Phase 3 — AI Layer

**Goal:** Build the model-provider abstraction and implement AI-powered responses.

### 3.1 ModelProvider Abstraction
```typescript
interface ModelProvider {
  name: string;
  generateText(prompt: Prompt, options: GenerateOptions): Promise<TextResult>;
  generateStructured<T>(prompt: Prompt, schema: ZodSchema<T>): Promise<T>;
  embedText(text: string): Promise<number[]>;
}
```

Implementations to build:
- [ ] `OllamaProvider` — local development
- [ ] `BedrockProvider` — Amazon Bedrock Nova
- [ ] `GeminiProvider` — Google Gemini

### 3.2 Tool Registry & Executor
- [ ] `ToolRegistry` — register/discover available tools
- [ ] `ToolExecutor` — execute tool calls with full security pipeline
- [ ] Implement security pipeline (schema → tenant permission → risk → audit)
- [ ] Initial tools: `reply_comment`, `send_dm`, `create_lead`, `get_contact`, `update_contact`

### 3.3 AI Workflow Generation
- [ ] `WorkflowGenerationService` — accepts natural language → returns workflow JSON
- [ ] Prompt templates for workflow generation
- [ ] Validate generated workflow against workflow schema before saving
- [ ] Frontend: NL input → preview generated workflow → confirm → activate

### 3.4 AI Response Engine
- [ ] `AIResponseService` — generates contextual DM/comment replies
- [ ] Knowledge base integration (vector search over business FAQs)
- [ ] Persona/tone configuration per workspace
- [ ] Content moderation post-processing before sending

**Exit Criteria:** AI can generate a validated workflow from a natural language description. AI can generate contextual DM replies anchored to knowledge base content.

---

## Phase 4 — Visual Workflow Builder

**Goal:** Implement the React Flow-based visual workflow editor.

### 4.1 Frontend — React Flow Integration
- [ ] Install `reactflow` in `apps/web`
- [ ] Install Tailwind CSS properly in `apps/web`
- [ ] Create `WorkflowBuilder` component
- [ ] Define custom node types: TriggerNode, ConditionNode, ActionNode, DelayNode, AISplitNode

### 4.2 Node Palette
- [ ] Trigger nodes: Comment, DM, Mention, Story Reply, New Follower
- [ ] Condition nodes: Keyword match, Time check, User stage, Lead score
- [ ] Action nodes: Reply comment, Send DM, Create lead, Update lead, Notify team, HTTP webhook
- [ ] AI nodes: Generate reply, Qualify lead, Score lead, Route conversation

### 4.3 Backend — Workflow Engine
- [ ] `WorkflowEngine` that interprets node/edge graph
- [ ] `WorkflowState` tracking per execution
- [ ] Variable substitution in action content (`{{contact.name}}`, `{{comment.text}}`)
- [ ] Delay handling via BullMQ delayed jobs

**Exit Criteria:** User can create a multi-step workflow visually and trigger it via a real Instagram comment.

---

## Phase 5 — CRM & Unified Inbox

- [ ] Contact profiles with full conversation history
- [ ] Lead pipeline (kanban board)
- [ ] Lead scoring system
- [ ] Unified inbox with real-time DM support (polling or Meta webhooks)
- [ ] Human takeover: pause automation for a specific contact
- [ ] Notes, tags, custom fields on contacts

---

## Phase 6 — Analytics & Content

- [ ] Real funnel analytics: comment → DM → lead → sale
- [ ] Per-automation performance metrics
- [ ] Content calendar UI
- [ ] AI caption/hashtag generation
- [ ] Export: leads to CSV, analytics to PDF

---

## Phase 7 — Scale & Platform

- [ ] Agency multi-workspace management
- [ ] White-label (custom domain, custom branding)
- [ ] Automation marketplace (publish/sell/fork templates)
- [ ] Public API with API key management
- [ ] MCP server for external tool integration
- [ ] Multi-channel: WhatsApp, Facebook Messenger expansion

---

## Priority Matrix

```
                 HIGH IMPACT
                     │
   Phase 2           │         Phase 1
 (Real Meta API) ────┼──── (Event Queue)
                     │
   LOW EFFORT        │              HIGH EFFORT
─────────────────────┼─────────────────────────────
                     │
   Phase 0           │         Phase 3
 (Security Fixes)    │      (AI Layer)
                     │
                 LOW IMPACT
```

**Do Phase 0 first regardless of quadrant — security is non-negotiable.**

---

## What Should Be Preserved (Do NOT Rewrite)

1. `packages/utils` — `verifyMetaSignature`, `matchCommentKeyword` work correctly
2. `packages/validation` — Zod schemas are well-formed
3. `packages/config` — Plan definitions are complete
4. `apps/api/src/models/` — All Mongoose schemas (additive changes only)
5. `apps/api/src/services/billingService.ts` — `IPaymentProvider` abstraction is good
6. `apps/web/src/components/Sidebar.tsx` — UI is functional
7. `apps/landing/` — Do not touch the marketing site

## What Must Change (But Not Full Rewrite)

1. `apps/api/src/index.ts` — Remove hardcoded demo rule; add queue initialization
2. `apps/api/src/middleware/auth.ts` — Remove x-demo-user bypass + add workspace middleware
3. `apps/api/src/services/commentEngine.ts` — Wire to MongoDB + queue
4. `apps/api/src/webhooks/index.ts` — Change to queue-first pattern
5. `apps/api/src/routes/meta.ts` — Implement real OAuth flow
6. `apps/api/src/routes/analytics.ts` — Remove hardcoded fallbacks

## What Needs Full Implementation (Net New)

1. `InstagramClient` — Real Graph API HTTP client
2. `ModelProvider` abstraction + implementations
3. `ToolRegistry` + `ToolExecutor` with security pipeline
4. `WorkflowEngine` for node/edge execution
5. `QueueService` + `AutomationWorker`
6. `workspaceTenantMiddleware`
7. Encrypted token storage
8. Webhook idempotency
9. Visual Workflow Builder (React Flow)
10. Auth frontend (login/register pages + auth context)
