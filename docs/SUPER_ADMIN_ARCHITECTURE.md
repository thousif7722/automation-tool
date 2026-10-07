# Super Admin Control Plane Architecture

## Executive Overview
The Super Admin Control Plane is an isolated, enterprise-grade management layer for the AutoDM multi-tenant SaaS platform. It provides centralized telemetry, RBAC administration, emergency platform safety controls, BullMQ worker management, AI cost tracking, and CMS publishing capabilities without modifying underlying business logic or breaking customer applications.

---

## Architectural Topology

```
                   +--------------------------------+
                   |    Public Internet Requests    |
                   +--------------------------------+
                                   |
                  +----------------------------------+
                  |           Host Nginx             |
                  +----------------------------------+
                     /             |              \
                    /              |               \
       (Marketing & App)       (Super Admin)     (Backend API)
              |                    |                  |
      autodm.onewayfix.com  admin.autodm.onewayfix.com /api/*
              |                    |                  |
              v                    v                  v
     Next.js Web (3000)   Next.js Admin (3000)    Express API (4000)
```

---

## Subdomain & Authorization Domains
1. **Public Marketing Website:** `https://autodm.onewayfix.com/`
2. **Customer App Dashboard:** `https://autodm.onewayfix.com/app`
3. **Super Admin Platform:** `https://admin.autodm.onewayfix.com/` (or `/admin`)
4. **Backend API Contracts:** `https://autodm.onewayfix.com/api/*`

---

## RBAC Authorization Matrix

| Role | Access Level | Responsibilities |
|---|---|---|
| `PLATFORM_OWNER` | Full Unrestricted | System configuration, emergency kill-switches, billing entitlements |
| `SUPER_ADMIN` | Full Administrative | Tenant management, user management, queue operations |
| `PLATFORM_SUPPORT` | Support Impersonation | Read-only workspace impersonation for troubleshooting |
| `PLATFORM_FINANCE` | Billing Telemetry | Revenue, MRR, Razorpay webhook status, refund processing |
| `PLATFORM_OPERATIONS` | Infrastructure Telemetry | Queue monitoring, AI model switching, worker restarts |
| `PLATFORM_SECURITY` | Safety & Audit | Audit log monitoring, session revocation, IP filtering |

---

## Tenant Failure Isolation Strategy
- **Database Scope:** Queries are scoped by tenant ID with indexed execution plans.
- **Queue Concurrency:** BullMQ worker jobs are partitioned per tenant to prevent noisy neighbor starvation.
- **Circuit Breakers:** Meta API and AI provider calls use exponential backoff and circuit breakers to fail isolated tenant requests gracefully without affecting global system stability.
