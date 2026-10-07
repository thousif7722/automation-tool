# Instagram Automation OS — Security Architecture

> **Philosophy:** Defense in depth. Every layer assumes the previous layer has been compromised.

---

## 1. Authentication & Session Security

### 1.1 JWT Tokens
- Signed with `HS256` using `JWT_SECRET` (minimum 64 random bytes, enforced at startup)
- Expiry: 7 days (sliding window recommended for production)
- Payload: `{ id, email, role, workspaceId, subscriptionPlan, iat, exp }`
- Tokens are **never** stored server-side (stateless). Redis blocklist must be used for logout/revoke.

### 1.2 Token Validation (Current Issues)
- ⚠️ **TD-003**: The `x-demo-user` header bypass must be removed immediately
- ⚠️ **TD-020**: Default `JWT_SECRET` must fail fast at startup
- **Required:** `if (process.env.JWT_SECRET === 'super_secret_jwt_key_change_in_production') throw new Error('...')`

### 1.3 Google OAuth
- ⚠️ **TD-021**: Must verify `id_token` server-side with `google-auth-library`
- Client sends: `id_token` (not raw user data)
- Server: `OAuth2Client.verifyIdToken()` → extract claims → find/create user

### 1.4 Password Security
- bcrypt with cost factor ≥ 12
- No password storage for OAuth-only users
- Password reset via time-limited signed token (not implemented yet)

---

## 2. Multi-Tenant Authorization

### 2.1 Tenant Isolation Model
Every API request that accesses data must pass through tenant context resolution:

```
Request → authMiddleware → workspaceTenantMiddleware → Route Handler
```

The `workspaceTenantMiddleware`:
1. Reads `workspaceId` from request (header `X-Workspace-ID` or route param)
2. Verifies the authenticated user is a member of that workspace
3. Injects `req.workspace` and `req.workspaceRole` onto the request
4. All subsequent DB queries **must** include `{ workspaceId: req.workspace.id }` as a filter

### 2.2 RBAC Role Hierarchy

```
OWNER > ADMIN > MANAGER > EDITOR > VIEWER
```

| Action | OWNER | ADMIN | MANAGER | EDITOR | VIEWER |
|---|---|---|---|---|---|
| Read workflows/leads | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create/edit workflows | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete workflows | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage team members | ✅ | ✅ | ❌ | ❌ | ❌ |
| Billing / plan changes | ✅ | ✅ | ❌ | ❌ | ❌ |
| Connect/disconnect Instagram | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete workspace | ✅ | ❌ | ❌ | ❌ | ❌ |

### 2.3 API-Level Enforcement
Every route that returns or modifies data must:
```typescript
// Example pattern
const rules = await AutomationRuleModel.find({ 
  workspaceId: req.workspace.id  // ← MANDATORY tenant filter
}).lean();
```

---

## 3. Instagram OAuth Token Security

### 3.1 Token Storage
- ⚠️ **TD-002**: Access tokens must NOT be stored in plain text
- **Required:** AES-256-GCM encryption at rest
- `ENCRYPTION_KEY` = 32-byte random key, stored in env only
- Schema: `accessTokenEncrypted: String`, `accessTokenIV: String`

### 3.2 Token Access Pattern
```typescript
// Write:
const { encrypted, iv } = encrypt(longLivedToken, process.env.ENCRYPTION_KEY);
account.accessTokenEncrypted = encrypted;
account.accessTokenIV = iv;

// Read:
const token = decrypt(account.accessTokenEncrypted, account.accessTokenIV, process.env.ENCRYPTION_KEY);
```

### 3.3 Token Refresh
- Meta long-lived tokens expire in 60 days
- Scheduled job must refresh tokens at 45-day mark
- Failed refresh triggers account status → `ERROR` and notifies workspace owner

---

## 4. Webhook Security

### 4.1 Meta Webhook Verification
- All POST webhooks to `/api/webhooks/instagram` verify `x-hub-signature-256`
- Uses timing-safe comparison (`crypto.timingSafeEqual`) — ✅ already implemented
- Webhook processing must be async (queue-based) — see TD-005

### 4.2 Idempotency (Duplicate Prevention)
- ⚠️ **TD-006**: Not yet implemented
- Every incoming comment/message/mention has a unique `event_id`
- Before processing: `Redis.SET event:{id} 1 EX 86400 NX`
- If key already exists → skip (event already processed)

---

## 5. AI Security Pipeline

### 5.1 Prompt Injection Prevention
All user-supplied content (comments, DM messages, contact names) that is passed to an AI model must be wrapped in structural delimiters:

```
[SYSTEM]
You are the customer service agent for {business_name}. 
You MUST follow these instructions at all times.
...

[CUSTOMER INPUT — UNTRUSTED]
{user_message}
[END CUSTOMER INPUT]

[TASK]
Respond appropriately to the customer input above.
```

- System instructions are never in the same structural position as user data
- AI responses are post-processed before being sent (content moderation, length limits)

### 5.2 Tool Call Security Pipeline
Before any AI-generated tool call executes, it must pass through all of these checks in sequence:

```
AI Tool Call Request
  → Schema Validation (is the tool call correctly formed?)
  → Tool Registry Check (does this tool exist?)
  → Tenant Permission Check (does this workspace have access to this tool?)
  → User Role Check (does this user's role allow this tool category?)
  → Workflow Permission Check (is this tool allowed in this workflow context?)
  → Risk Level Check (is this a SENSITIVE action requiring confirmation?)
  → Platform Policy Check (does this action comply with Meta terms?)
  → Execution
  → Audit Log (record tool name, inputs, outputs, user, workspace, timestamp)
```

### 5.3 Tool Risk Levels

| Level | Examples | Requirement |
|---|---|---|
| READ | get_profile, get_analytics, get_comments, get_customer | Auto-execute |
| WRITE | reply_comment, send_dm, create_lead, update_contact | Auto-execute with rate limits |
| SENSITIVE | disconnect_account, delete_workflow, bulk_operations, billing_changes | Require explicit confirmation |
| DESTRUCTIVE | delete_all_data, remove_workspace | Require multi-step confirmation + owner role |

---

## 6. API Security

### 6.1 Rate Limiting (Required)
```
Global:      100 requests / 15 minutes / IP
Auth routes: 10 requests / 15 minutes / IP
Webhook:     No rate limit (handled by Meta signature verification)
AI routes:   20 requests / minute / workspace
```

### 6.2 Input Validation
- All route handlers must use Zod schemas for request validation
- No direct use of `req.body` without schema parsing
- Reject and log oversized payloads (limit: 1MB for JSON, 10MB for media uploads)

### 6.3 Security Headers (Nginx / API)
Required headers on all responses:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: [appropriate policy]
```

### 6.4 CORS Configuration
- `apps/api`: Allow only `WEB_URL`, `ADMIN_URL`, `LANDING_URL` origins
- Do NOT use `cors({ origin: '*' })` in production (currently it is `app.use(cors())`)

---

## 7. Audit Logging

Every sensitive operation must be recorded:

```typescript
interface AuditLogEntry {
  id: string;
  workspaceId: string;
  userId: string;
  action: string;         // e.g., 'workflow.delete', 'account.disconnect'
  resource: string;       // e.g., 'AutomationRule:abc123'
  ipAddress: string;
  userAgent: string;
  result: 'SUCCESS' | 'FAILURE' | 'DENIED';
  metadata?: Record<string, any>;
  timestamp: Date;
}
```

Audit logs are **append-only** — no delete, no update. Retention: minimum 90 days.

---

## 8. Secrets Management

### Development
- `.env` file (never committed to git — ✅ in `.gitignore`)
- All secrets have clearly named env vars

### Production (Target)
- AWS Secrets Manager or HashiCorp Vault
- Secrets injected at container startup via IAM role
- No secrets in Docker images or CI/CD logs
- Secret rotation supported without downtime

### Required Environment Variables for Production
```
JWT_SECRET             # ≥ 64 random bytes, base64 encoded
ENCRYPTION_KEY         # 32 random bytes for AES-256, hex encoded
META_APP_SECRET        # From Meta Developer Console
META_VERIFY_TOKEN      # Random string, set in Meta webhook config
MONGODB_URI            # With credentials, via Secrets Manager
REDIS_PASSWORD         # Required for production Redis
GOOGLE_CLIENT_SECRET   # From Google Cloud Console
RAZORPAY_KEY_SECRET    # From Razorpay Dashboard
```

---

## 9. Security Checklist Before Production

- [ ] Remove `x-demo-user` bypass header (TD-003)
- [ ] Add JWT_SECRET startup validation (TD-020)
- [ ] Encrypt access tokens at rest (TD-002)
- [ ] Implement tenant isolation on all queries (TD-004)
- [ ] Add webhook idempotency with Redis (TD-006)
- [ ] Move webhook processing to BullMQ queue (TD-005)
- [ ] Implement Google ID Token server-side verification (TD-021)
- [ ] Add rate limiting to all routes (TD-016)
- [ ] Restrict CORS to allowed origins
- [ ] Add security response headers via Nginx
- [ ] Implement AuditLog model and middleware
- [ ] Enable HTTPS / SSL (Nginx + Let's Encrypt)
- [ ] Set up secret rotation process
