# AutoDM Data Backup & Preservation Policy

## 1. Overview & Objective
This document outlines the standard operating procedures and policies for data preservation, database backup, and point-in-time recovery for the **AutoDM** multi-tenant platform. The primary goal is to ensure zero data loss of tenant configuration, customer profiles, Instagram credentials, and automation workflows.

---

## 2. Infrastructure & Data Persistence Layer

AutoDM persistence is containerized via Docker volumes and mounted directly to host filesystems:

| Service | Engine | Container Name | Persistent Storage Volume | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Primary DB** | MongoDB 6.0 | `autodm-mongo` | `mongo_data` | Users, Workspaces, Leads, Workflows, Knowledge |
| **Cache & Queue** | Redis 7.0 | `autodm-redis` | `redis_data` | Webhook queues, Rate limits, Session cache |

> **CRITICAL PRODUCTION WARNING**: Never execute `docker compose down -v` on production instances. The `-v` flag deletes named persistent volumes, destroying database states permanently.

---

## 3. Automated Backup Schedule

Production backups are executed via automated `cron` jobs on the host server:

### A. MongoDB Logical Backups (`mongodump`)
- **Frequency**: Every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)
- **Retention**: 30 days locally, 90 days off-site (S3 / GCS)
- **Format**: Compressed archive (`.tar.gz`) with SHA-256 integrity checksums.
- **Execution Command**:
  ```bash
  docker exec autodm-mongo mongodump --archive --gzip --username $MONGO_USER --password $MONGO_PASS --authenticationDatabase admin > /backups/mongo/autodm_$(date +%Y%m%d_%H%M%S).archive.gz
  ```

### B. Redis Persistence Snapshots (`RDB` + `AOF`)
- **AOF (Append Only File)**: Enabled with `everysec` sync policy.
- **RDB Snapshots**: Taken hourly and on container graceful shutdown.

---

## 4. Off-Site Storage & Encryption
- Backup archives are encrypted using AES-256 before egress.
- Encrypted archives are uploaded to an S3-compatible object storage bucket with Object Lock enabled (Write Once Read Many / WORM).

---

## 5. Verification & Testing
- **Automated Verification**: Weekly test restorations are executed in an isolated staging sandbox.
- **Health Check Alerting**: Backup script failures alert system administrators immediately via Telegram/Slack webhook notifications.
