# Instagram Automation OS - Super Admin Architecture

## Overview
The Super Admin Portal is completely isolated from customer workspace dashboards (`apps/web`). It provides platform-wide administration, tenant oversight, system health monitoring, and entitlement configuration.

---

## 1. Security & Isolation Boundaries
- **Route Isolation**: Super Admin routes (`/admin/*` in API) require explicit `system:admin` permissions.
- **Tenant Context Exemption**: Super Admin requests operate outside single-workspace context to allow cross-tenant analytics and support.
- **Audit Logging**: Every action taken by a Super Admin (e.g. suspending a workspace, changing plan limits) generates an immutable `AuditLogModel` entry.

---

## 2. Super Admin Functional Modules

1. **Platform Overview**: Platform-wide total active workspaces, connected Instagram accounts, total DMs processed, current system throughput.
2. **Tenant & Agency Management**: List, search, inspect, suspend, or upgrade workspace subscriptions.
3. **Queue & Worker Health**: Monitor BullMQ active, waiting, delayed, and dead-letter jobs across all 9 queue types.
4. **AI Token Usage & Costs**: Aggregate LLM call metrics across Ollama, Bedrock, and Gemini models.
5. **System Health & Logs**: Real-time server uptime, MongoDB connection stats, error logs, rate limit breaches.
6. **Feature Flags & System Policies**: Platform-wide feature toggles (e.g., enabling AI Builder beta, restricting agency seats).
