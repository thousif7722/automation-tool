# Super Admin Operational Playbook

## System Incident Response & Emergency Procedures

### 1. High AI Provider Error Rate or Outage
1. Navigate to Super Admin Dashboard -> **AI Operations**.
2. Inspect active request telemetry and error rates.
3. If primary provider (Amazon Bedrock) is degraded, execute fallback to Google Gemini 1.5 Flash.
4. If cost exceeds budget threshold, toggle `PAUSE_AI` in the **Safety Center**.

### 2. BullMQ Worker Queue Backlog
1. Navigate to Super Admin Dashboard -> **Queue & Workers**.
2. Inspect `instagram-webhook-events` and `ai-dm-automation` queue status.
3. Check dead-letter job count.
4. Click **Retry Failed Jobs** to replay dead-letter events safely.

### 3. Tenant Abuse or Meta API Rate Limit Violation
1. Navigate to Super Admin Dashboard -> **Tenants**.
2. Search for the target workspace handle (e.g. `@abusive_brand`).
3. Click **Suspend Tenant**.
4. Enter mandatory reason for the immutable audit log and confirm suspension.

### 4. Updating Marketing Site Content (CMS)
1. Navigate to Super Admin Dashboard -> **Website CMS**.
2. Update Hero headline, subtitle, or CTA values.
3. Preview changes in draft mode.
4. Click **Publish CMS Changes to Live Website** to broadcast updates instantly.
