# Instagram Automation OS - Production Environment Configuration Matrix

## Overview
This matrix documents every environment variable required by services in the **Instagram Automation OS** monorepo (`apps/api`, `apps/web`, workers, AI services, Instagram integration, billing, database, Redis, and queues).

---

## Environment Variable Matrix

| Variable Name | Service Scope | Required / Optional | Dev Default Source | Prod Value Source | Secret / Public | Rotation Policy | Failure Behavior |
| :--- | :--- | :---: | :--- | :--- | :---: | :--- | :--- |
| `NODE_ENV` | All | Required | `development` | Environment | Public | N/A | Falls back to `development` |
| `PORT` | `apps/api` | Required | `4000` | Cloud Container Port | Public | N/A | Service fails to bind port |
| `API_URL` | All | Required | `http://localhost:4000` | Ingress Route / DNS | Public | N/A | Cross-origin requests fail |
| `WEB_URL` | All | Required | `http://localhost:3000` | CDN Domain | Public | N/A | Redirects fail |
| `MONGODB_URI` | `apps/api`, Workers | **Required** | `mongodb://localhost:27017/insta_automation` | KMS / Secrets Manager | **Secret** | 90 Days | App throws exception on start |
| `REDIS_HOST` | `apps/api`, Workers | **Required** | `localhost` | ElastiCache Endpoint | Public | N/A | Queues halt processing |
| `REDIS_PORT` | `apps/api`, Workers | Required | `6379` | `6379` | Public | N/A | Redis connection rejected |
| `REDIS_PASSWORD` | `apps/api`, Workers | Optional (Prod Req) | Empty | Secrets Manager | **Secret** | 90 Days | Redis AUTH failure |
| `JWT_SECRET` | `apps/api` | **Required** | Development Mock | AWS Secrets Manager | **Secret** | 180 Days | System fails startup (>32 chars) |
| `ENCRYPTION_KEY` | `apps/api`, `instagram` | **Required** | Development Mock | AWS Secrets Manager | **Secret** | Critical | Token decryption throws error |
| `META_APP_ID` | `instagram`, `api` | **Required** | Placeholder | Meta App Dashboard | Public | N/A | OAuth flow rejected |
| `META_APP_SECRET` | `instagram`, `api` | **Required** | Placeholder | Meta App Dashboard | **Secret** | On Breach | OAuth code exchange fails |
| `META_VERIFY_TOKEN` | `instagram`, `api` | **Required** | Placeholder | Meta App Dashboard | **Secret** | Annual | Webhook handshake returns 403 |
| `RAZORPAY_KEY_ID` | `billing`, `api` | Required (Prod) | Placeholder | Razorpay Dashboard | Public | N/A | Checkout sessions fail |
| `RAZORPAY_KEY_SECRET` | `billing`, `api` | Required (Prod) | Placeholder | Razorpay Dashboard | **Secret** | 90 Days | Webhook HMAC verification fails |
| `ACTIVE_AI_PROVIDER` | `ai` | Required | `ollama` | Environment (`ollama` / `bedrock` / `gemini`) | Public | N/A | Defaults to `ollama` |
| `BEDROCK_MODEL_ID` | `ai` | Optional | `amazon.nova-lite-v1:0` | Environment | Public | N/A | Bedrock converse call fails |
| `GEMINI_API_KEY` | `ai` | Optional | Empty | Secrets Manager | **Secret** | 90 Days | Gemini API call rejected (401) |

---

## Secret Storage & Injection Directives
1. **Zero Hardcoded Secrets**: Secrets must NEVER be stored in repository source code or committed `.env` files.
2. **KMS / Secrets Manager Integration**: Production environments must inject secrets dynamically into task definitions (AWS ECS Secrets / Kubernetes Secret Store).
3. **Automated Validation**: `packages/config/src/index.ts` enforces strict validation rules on startup, halting process launch if `JWT_SECRET` or `ENCRYPTION_KEY` are insecure in production.
