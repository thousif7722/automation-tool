# Instagram Automation OS - Known Limitations & Technical Risk Register

## Executive Overview
This document details the known technical limitations, API boundary constraints, infrastructure dependencies, and operational risks identified during the production readiness audit of **Instagram Automation OS**.

---

## 1. Meta / Instagram Graph API Boundaries & Platform Limits

1. **Meta Messaging Rate Limits**:
   - Meta limits Instagram DMs to 200 messages per hour per account for standard accounts, with rolling velocity limits enforced by Graph API.
   - *Mitigation*: BullMQ rate limiters with delay queues back off requests automatically when HTTP 429 is encountered.

2. **24-Hour Messaging Window Policy**:
   - Meta restricts sending automated messages to users after 24 hours from their last message, unless using specific message tags (e.g., `POST_PURCHASE_UPDATE`).
   - *Mitigation*: `InstagramApiClient` checks `lastInteraction` timestamp and halts non-compliant automated DMs, flagging them for human escalation.

3. **Webhook Verification Token Lifetime**:
   - Meta webhook challenge verification tokens must be verified within 5 seconds during setup.
   - *Mitigation*: `InstagramWebhookService` returns `GET /webhooks/instagram` hub challenge responses synchronously in under 50ms.

---

## 2. Infrastructure & Persistence Limitations

1. **Redis Event Deduplication Persistence**:
   - The in-memory deduplication cache is backed by MongoDB (`ProcessedEventModel`). In high-volume production (>10,000 req/sec), single-node Redis should be upgraded to Redis Cluster with TTL indexing to avoid MongoDB write spikes.

2. **Full-Text RAG Search Scalability**:
   - `KnowledgeStore` currently uses in-memory vector/keyword similarity matching for business profile FAQs and documents.
   - *Mitigation*: For enterprise tier accounts with >10,000 knowledge documents, migrate retrieval to Pinecone or MongoDB Vector Search (`$vectorSearch`).

---

## 3. Operational & System Constraints

1. **Concurrent Test Execution Timeout**:
   - Running the full 42-test suite in parallel across monorepo packages can hit Jest worker memory contention if run without maxWorkers constraints on low-spec hardware.
   - *Recommendation*: Use `npx jest --maxWorkers=2` or run test suites by module in CI/CD pipelines.

2. **Stripe Production Webhook Integration**:
   - Subscription changes currently execute via `SaaSService` internal endpoints. Live Stripe Webhook signature verification (`stripe-signature`) requires production Stripe Secret Keys.
