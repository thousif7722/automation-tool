# Super Admin Security Architecture & Controls

## Security Principles & Policies
1. **Least-Privilege Enforcement:** Super Admin roles (`PLATFORM_OWNER`, `SUPER_ADMIN`, `PLATFORM_SUPPORT`) are strictly separated from customer workspace permissions. Customer workspace administrators CANNOT gain Super Admin access.
2. **Server-Side Authorization:** All `/api/admin/*` endpoints strictly evaluate Bearer tokens and verify `globalRole` via `authMiddleware` and `adminOnly` Express middleware. Frontend visibility is never relied upon as a security boundary.
3. **Zero-Trust Access Tokens:** Instagram Access Tokens, Refresh Tokens, and Meta App Secrets are NEVER returned in API responses or rendered in the Super Admin UI.
4. **Immutable Audit Logging:** Every high-risk action (tenant suspension, emergency kill-switch activation, feature flag toggle, support impersonation) creates an immutable audit record containing actor identity, role, timestamp, IP, target resource, and reason.

---

## Support Impersonation Protocol
- **Trigger:** Initiated only via `POST /api/admin/impersonate`.
- **Requirements:** Requires elevated Super Admin permissions and mandatory reason input for the audit trail.
- **Visual Alert:** Renders a prominent, persistent warning banner: `IMPERSONATING WORKSPACE: @workspace_name`.
- **Restricted Actions:** Dangerous mutations (deleting accounts, modifying billing secrets) are disabled during impersonation sessions.

---

## Emergency Platform Safety Switches

| Control Key | Description | Risk Level |
|---|---|---|
| `PAUSE_NEW_SIGNUPS` | Blocks public user registration | Medium |
| `PAUSE_INSTAGRAM_OAUTH` | Disables new Meta OAuth handshakes | Medium |
| `PAUSE_INSTAGRAM_SENDING` | Halts outbound Meta DM sending | High |
| `PAUSE_ALL_AUTOMATIONS` | Pauses visual workflow triggers | High |
| `PAUSE_AI` | Disables AI agent processing | High |
| `PAUSE_QUEUE_WORKERS` | Pauses BullMQ worker execution | Critical |
| `MAINTENANCE_MODE` | Restricts app to read-only maintenance | Critical |
