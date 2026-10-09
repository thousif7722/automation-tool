# AutoDM Disaster Recovery & Emergency Operations Runbook

## 1. Executive Summary & Recovery Objectives
This runbook defines the emergency response protocol for service disruptions, database corruption, infrastructure failure, or security incidents affecting the **AutoDM** SaaS platform.

### Recovery Metrics (RTO / RPO)
- **Recovery Time Objective (RTO)**: < 1 Hour (Target: 15 minutes)
- **Recovery Point Objective (RPO)**: < 6 Hours for database data, < 1 second for active queues.

---

## 2. Emergency Escalation & Incident Levels

| Severity | Definition | Action Required |
| :--- | :--- | :--- |
| **SEV-1 (Critical)** | Core DB failure, platform-wide downtime, or security breach | Immediate notification, initiate disaster recovery failover |
| **SEV-2 (Major)** | Webhook delivery failure or Instagram API rate-limiting | Failover queue workers, inspect Redis buffers |
| **SEV-3 (Minor)** | Non-critical UI glitch or isolated tenant issue | Standard patch & deploy within 24 hours |

---

## 3. Database Restoration Playbook

### Step 1: Quarantine Affected Services
Stop api and web containers to prevent inconsistent writes during restoration:
```bash
docker compose stop api web worker
```

### Step 2: Locate Latest Valid Backup
List available backups in the backup directory:
```bash
ls -lh /backups/mongo/
```

### Step 3: Execute Database Restore (`mongorestore`)
Restore database from compressed archive:
```bash
docker exec -i autodm-mongo mongorestore --archive --gzip --drop \
  --username $MONGO_USER --password $MONGO_PASS \
  --authenticationDatabase admin < /backups/mongo/autodm_LATEST.archive.gz
```

### Step 4: Verify Database Integrity
Run schema and index checks via `mongosh`:
```bash
docker exec -it autodm-mongo mongosh -u $MONGO_USER -p $MONGO_PASS --eval "db.users.countDocuments(); db.workspaces.countDocuments()"
```

### Step 5: Restart Core Platform
```bash
docker compose start api web worker
```

---

## 4. Emergency Killswitch & Platform Lockdown
If an active security threat or runaway automation loop is detected:
1. Access Super Admin Portal: `https://admin.autodm.onewayfix.com/admin`
2. Toggle **Global Platform Pause** or execute command line emergency stop:
```bash
docker compose stop worker
```
3. Inspect system logs:
```bash
docker compose logs --tail 200 -f api worker
```
