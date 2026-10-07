# PHASE 17 — META / INSTAGRAM ACTIVATION ARCHITECTURE GUIDE

This document defines the technical specifications, environment requirements, public HTTPS deployment strategies, and Meta Developer Console setup instructions required to move from **Code Ready** state to **Live Instagram Verified** state.

---

## 1. Subsystem Implementation Overview

```
                          ┌───────────────────────────┐
                          │   Meta Instagram API      │
                          └─────────────┬─────────────┘
                                        │ (HTTPS Webhook)
                                        ▼
                          ┌───────────────────────────┐
                          │  Express Webhook Router   │
                          │   (HMAC Signature Check)  │
                          └─────────────┬─────────────┘
                                        │ (Normalized Event)
                                        ▼
                          ┌───────────────────────────┐
                          │ Event Deduplicator (Redis)│
                          └─────────────┬─────────────┘
                                        │ (Unique Event)
                                        ▼
                          ┌───────────────────────────┐
                          │    BullMQ Queue Manager   │
                          └─────────────┬─────────────┘
                                        │
                                        ▼
                          ┌───────────────────────────┐
                          │  Workflow Engine Worker   │
                          │ (Intent & Scoring Rules)  │
                          └─────────────┬─────────────┘
                                        │
                 ┌──────────────────────┼──────────────────────┐
                 ▼                      ▼                      ▼
      ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
      │  Graph API Outbound│  │  CRM & Lead Engine │  │  3-Column Inbox UI │
      │   (Reply / DM)     │  │  (Customer/Lead)   │  │   (State & Logs)   │
      └────────────────────┘  └────────────────────┘  └────────────────────┘
```

### Subsystem Verification Summary
- **Instagram OAuth**: `packages/instagram/src/oauth.ts` handles authorization URL generation with state parameter matching `workspaceId`. Exchange code retrieves access tokens which are encrypted using AES-256-GCM prior to storage.
- **Webhook Handshake**: `apps/api/src/webhooks/index.ts` verifies `hub.mode === 'subscribe'` and `hub.verify_token === META_VERIFY_TOKEN`.
- **HMAC Signature Verification**: `packages/utils/src/index.ts` executes timing-safe HMAC-SHA256 comparison against `x-hub-signature-256`.
- **Event Deduplication**: `packages/events/src/deduplicator.ts` enforces single execution using Redis key `dedup:{workspaceId}:{eventId}` with 24-hour expiration.
- **Event Queueing**: `packages/queue/src/queueManager.ts` queues BullMQ jobs with exponential retry backoffs and dead-letter handling.
- **CRM & Scoring**: `packages/ai/src/crm/CRMService.ts` auto-creates customer profiles and computes lead scores based on configurable signals.

---

## 2. Environment Audit & Configuration

Required production environment variables:

```env
# Core API & Gateway Configuration
PORT=4000
NODE_ENV=production
API_URL=https://YOUR_DOMAIN.com
WEB_URL=https://app.YOUR_DOMAIN.com

# Database Connections
MONGODB_URI=mongodb://localhost:27017/insta_automation
REDIS_HOST=localhost
REDIS_PORT=6379

# Cryptographic Keys (Must be 32+ characters)
JWT_SECRET=replace_with_secure_random_32_character_string_for_jwt!
ENCRYPTION_KEY=replace_with_secure_random_32_character_token_key!

# Meta Developer Credentials
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_VERIFY_TOKEN=generate_a_secure_verify_token
META_REDIRECT_URI=https://YOUR_DOMAIN.com/api/instagram/oauth/callback
```

---

## 3. Public HTTPS Deployment Options

Meta Graph API webhooks require a publicly accessible HTTPS endpoint with a valid SSL certificate.

### OPTION A: Temporary HTTPS Tunnel (Development & Staging Verification)
For testing real webhooks locally or in staging:
1. Install Cloudflare Tunnel or ngrok:
   ```bash
   cloudflared tunnel --url http://localhost:4000
   ```
2. Copy the generated HTTPS forwarding URL (e.g. `https://random-tunnel.trycloudflare.com`).
3. Update `.env`:
   ```env
   API_URL=https://random-tunnel.trycloudflare.com
   META_REDIRECT_URI=https://random-tunnel.trycloudflare.com/api/instagram/oauth/callback
   ```
4. Configure Meta Developer Webhook Callback URL:
   `https://random-tunnel.trycloudflare.com/api/webhooks/instagram`

### OPTION B: Production AWS HTTPS Deployment
1. Provision AWS Application Load Balancer (ALB) or CloudFront distribution with AWS Certificate Manager (ACM) SSL certificate.
2. Route domain traffic (`api.yourcompany.com`) to Express backend cluster.
3. Configure environment variables in AWS ECS / EC2 container definitions.

---

## 4. Step-by-Step Meta Developer Console Configuration

1. **Create Meta App**:
   - Go to [Meta for Developers](https://developers.facebook.com/).
   - Click **Create App** → Select **Business** type.
2. **Add Instagram Graph API Product**:
   - Add **Instagram Graph API** product to app dashboard.
3. **Configure Webhook**:
   - Go to Webhooks → Select **Instagram**.
   - Callback URL: `https://YOUR_DOMAIN.com/api/webhooks/instagram`
   - Verify Token: Match `META_VERIFY_TOKEN` from `.env`.
   - Subscribe to fields: `comments`, `messages`, `mentions`.
4. **Configure OAuth Redirect URI**:
   - Go to App Settings → Basic / Facebook Login settings.
   - Add Valid OAuth Redirect URI: `https://YOUR_DOMAIN.com/api/instagram/oauth/callback`
5. **App Permissions Required**:
   - `instagram_basic`
   - `instagram_manage_comments`
   - `instagram_manage_messages`
   - `pages_read_engagement`
   - `pages_show_list`
6. **Connect Instagram Account**:
   - Convert target Instagram account to an **Instagram Professional / Creator Account**.
   - Connect the Instagram account to a Facebook Page managed by your Meta Developer user.

---

## 5. Remaining Blockers for Live Verification

1. **Meta Credentials**: Placeholders in `.env` must be replaced with real Meta App ID & Secret.
2. **Public SSL Reachability**: Backend must be reachable over public HTTPS.
