# AutoDM Production Data Security & Tenant Isolation Standard

## 1. Tenant Isolation Architecture
AutoDM enforces strict, multi-tenant isolation across all data access patterns:

1. **Database Schema Isolation**:
   - Every domain model (`Lead`, `Conversation`, `Workflow`, `InstagramAccount`) contains an immutable `workspaceId: ObjectId` reference.
   - All Mongoose queries initiated by tenant requests automatically include `{ workspaceId: req.workspaceId }`.

2. **Middleware Security Guarantees**:
   - `authMiddleware` validates JWT signature and extracts user identity (`req.user`).
   - `tenantMiddleware` resolves user's active workspace and verifies membership, injecting `req.workspaceId`.

---

## 2. Token & Credential Encryption Standards

- **Passwords**: Hashed using **bcrypt** with a salt factor of 12.
- **Instagram Access Tokens**: Encrypted at rest in MongoDB using **AES-256-GCM** via system `ENCRYPTION_KEY`.
- **JWT Signing**: Signed with HS256 using a minimum 64-character secret key (`JWT_SECRET`).

---

## 3. Super Admin vs Customer Domain Isolation

To prevent cross-domain contamination and administrative escalation attacks:

| Control Plane | Domain Endpoint | Authentication Mechanism | Role Requirement |
| :--- | :--- | :--- | :--- |
| **Customer App** | `autodm.onewayfix.com/app` | User JWT (`/auth/login`) | `user`, `admin` |
| **Super Admin** | `admin.autodm.onewayfix.com/admin` | Admin JWT (`/auth/admin-login`) + Nginx Basic Auth | `superadmin` |

---

## 4. API & Webhook Hardening
- **Prompt Injection Defense**: Untrusted customer content is wrapped in `<untrusted_customer_message>` sandboxes before LLM processing.
- **Webhook Handshake**: Instagram webhooks validate `hub.verify_token` and verify `X-Hub-Signature-256` HMAC signatures using `META_APP_SECRET`.
