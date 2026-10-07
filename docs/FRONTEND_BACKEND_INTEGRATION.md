# Instagram Automation OS - Frontend to Backend Integration Matrix

## Overview
This document maps every customer-facing UI tab, component, and user flow in `apps/web` to its underlying API endpoint, service implementation, database model, authentication requirement, tenant/workspace scoping, and integration status.

---

## Integration Matrix Table

| UI Screen Tab | UI Component | API Endpoint | Backend Service | Database Model | Auth & Tenant Req. | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **Home** | `HomeTab.tsx` | `GET /api/analytics` | `AnalyticsService` | `LeadModel`, `MessageModel`, `AutomationRuleModel`, `InstagramAccountModel` | `Bearer Token` + Workspace Scope | **CONNECTED** |
| **Automation** | `AutomationTab.tsx` | `GET /api/workflows`<br>`POST /api/workflows`<br>`PUT /api/workflows/:id`<br>`DELETE /api/workflows/:id`<br>`POST /api/workflows/:id/activate`<br>`POST /api/workflows/:id/pause`<br>`POST /api/workflows/:id/test` | `AutomationRuleModel` / `CommentAutomationEngine` | `AutomationRuleModel`, `WorkflowDefinitionModel`, `WorkflowRunModel` | `Bearer Token` + Workspace Scope | **CONNECTED** |
| **AI Workflow Generator** | Prompt Modal in `AutomationTab.tsx` | `POST /api/workflows/generate-ai` | `AgentOrchestrator` / `ModelProvider` | `WorkflowDefinitionModel` | `Bearer Token` + Workspace Scope | **CONNECTED** |
| **Visual Builder** | `WorkflowBuilder.tsx` | `GET /api/workflows/:id`<br>`POST /api/workflows`<br>`PUT /api/workflows/:id` | `WorkflowDefinitionModel` service | `WorkflowDefinitionModel` | `Bearer Token` + Workspace Scope | **CONNECTED** |
| **Simulator** | `SimulatorDrawer.tsx` | `POST /api/automations/simulate`<br>`POST /api/workflows/:id/test` | `CommentAutomationEngine` | `AutomationEventModel` (Transient) | `Bearer Token` + Workspace Scope | **CONNECTED** |
| **Inbox** | `InboxTab.tsx` | `GET /api/messages/conversations`<br>`GET /api/messages/conversations/:id`<br>`POST /api/messages/conversations/:id/reply`<br>`POST /api/messages/conversations/:id/takeover`<br>`POST /api/messages/conversations/:id/return-to-ai`<br>`POST /api/messages/conversations/:id/tag` | `AIConversationModel` service | `AIConversationModel`, `MessageModel` | `Bearer Token` + Workspace Scope | **CONNECTED** |
| **Contacts** | `ContactsTab.tsx` | `GET /api/customers`<br>`GET /api/customers/:id`<br>`PUT /api/customers/:id` | `CRMService` | `CustomerModel`, `TagModel` | `Bearer Token` + Workspace Scope | **CONNECTED** |
| **Leads Kanban** | `ContactsTab.tsx` | `GET /api/leads`<br>`POST /api/leads`<br>`PUT /api/leads/:id`<br>`PUT /api/leads/:id/stage` | `CRMService` | `LeadModel`, `LeadEventModel` | `Bearer Token` + Workspace Scope | **CONNECTED** |
| **Instagram** | `InstagramTab.tsx` | `GET /api/instagram/accounts`<br>`GET /api/instagram/oauth/url`<br>`POST /api/instagram/connect`<br>`POST /api/instagram/health/:id` | `InstagramAccountService` | `InstagramAccountModel` | `Bearer Token` + Workspace Scope | **CONNECTED** |
| **AI Studio** | `AITab.tsx` | `GET /api/ai/config`<br>`PUT /api/ai/config`<br>`GET /api/ai/knowledge`<br>`POST /api/ai/knowledge`<br>`DELETE /api/ai/knowledge/:id` | `CustomerAIAgent`, `KnowledgeStore` | `BusinessProfileModel`, `KnowledgeItemModel` | `Bearer Token` + Workspace Scope | **CONNECTED** |
| **Content** | `ContentTab.tsx` | `GET /api/content/drafts`<br>`POST /api/content/generate-caption` | `ContentService` | `ContentDraftModel` / RAG | `Bearer Token` + Workspace Scope | **CONNECTED** |
| **Analytics** | `AnalyticsTab.tsx` | `GET /api/analytics`<br>`POST /api/ai/ask` | `AnalyticsService`, `CustomerAIAgent` | `LeadModel`, `MessageModel`, `AIAuditLogModel` | `Bearer Token` + Workspace Scope | **CONNECTED** |
| **Team** | `TeamTab.tsx` | `GET /api/workspaces/current/members`<br>`POST /api/workspaces/current/members/invite`<br>`DELETE /api/workspaces/current/members/:id` | `WorkspaceModel` service | `WorkspaceModel`, `UserModel` | `Bearer Token` + Workspace Scope | **CONNECTED** |
| **Settings** | `SettingsTab.tsx` | `GET /api/workspaces/current`<br>`PUT /api/workspaces/current`<br>`GET /api/billing/subscription` | `SaaSService`, `EntitlementEngine` | `WorkspaceModel`, `SubscriptionModel` | `Bearer Token` + Workspace Scope | **CONNECTED** |
| **Super Admin** | Isolated `/admin` | `GET /api/admin/stats`<br>`GET /api/admin/users` | Platform Super Admin Guard | `UserModel`, `WorkspaceModel`, `DeadLetterJobModel` | `Bearer Token` + SuperAdmin Role | **CONNECTED** |

---

## Data Scoping & Security Policy
1. **Server-Side Authorization**: No client-supplied `workspaceId` or `userId` is trusted from request bodies. All workspace identifiers are derived server-side from `req.tenant.workspaceId` initialized via JWT token verification.
2. **Fail-Safe Status Handling**: If real Instagram accounts or live Graph API webhooks are not connected, components display clean "Not connected" state indicators instead of hardcoded demo values.
