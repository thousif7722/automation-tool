# Instagram Automation OS - ManyChat-Style Product Architecture

## Executive Architecture Identity
**Instagram Automation OS** combines the frictionless, intuitive user experience of modern social messaging platforms (e.g. ManyChat) with enterprise-grade AI agents, intelligent workflow generation, unified CRM, and multi-tenant SaaS capabilities.

```
       ┌─────────────────────────────────────────────────────────────┐
       │             MANYCHAT-STYLE SAAS EXPERIENCE LAYER            │
       │                                                             │
       │  ┌──────────┐ ┌────────────┐ ┌─────────┐ ┌───────────────┐  │
       │  │   HOME   │ │ AUTOMATION │ │  INBOX  │ │ CONTACTS CRM  │  │
       │  └──────────┘ └────────────┘ └─────────┘ └───────────────┘  │
       │  ┌──────────┐ ┌────────────┐ ┌─────────┐ ┌───────────────┐  │
       │  │INSTAGRAM │ │  AI AGENT  │ │ CONTENT │ │   ANALYTICS   │  │
       │  └──────────┘ └────────────┘ └─────────┘ └───────────────┘  │
       └──────────────────────────────┬──────────────────────────────┘
                                      │
       ┌──────────────────────────────┴──────────────────────────────┐
       │             ENTERPRISE AUTOMATION & AI ENGINE               │
       │                                                             │
       │  ┌─────────────────────────┐  ┌──────────────────────────┐  │
       │  │   REACT FLOW BUILDER    │  │  AI WORKFLOW GENERATOR   │  │
       │  └─────────────────────────┘  └──────────────────────────┘  │
       │  ┌─────────────────────────┐  ┌──────────────────────────┐  │
       │  │  UNIFIED CRM & LEADS    │  │ MCP TOOL POLICY ENGINE   │  │
       │  └─────────────────────────┘  └──────────────────────────┘  │
       └──────────────────────────────┬──────────────────────────────┘
                                      │
       ┌──────────────────────────────┴──────────────────────────────┐
       │              META GRAPH API & WORKER PIPELINE               │
       │                                                             │
       │    Meta Webhooks -> BullMQ Queues -> Workers -> Meta API    │
       └─────────────────────────────────────────────────────────────┘
```

---

## 1. Top-Level Core Modules

### 1. Home Dashboard (`/home`)
- **Executive Metrics**: Followers, Reach, Engagement, Unread DMs, Leads, Qualified Leads, Conversions, Estimated Revenue.
- **Automation Performance**: AI Resolution Rate vs. Human Escalations, Top Automations, Failed Automations.
- **AI Insights Banner**: Evidence-based recommendations (e.g., *"Your Price Lead Automation generated 37 leads this week"*).

### 2. Automation Center (`/automation`)
- **My Automations**: Grid/List of automations with status (`ACTIVE`, `DRAFT`, `PAUSED`, `ERROR`), execution metrics, conversion counts.
- **Create Automation Options**:
  1. **BUILD WITH AI (Default)**: Natural language prompt (`"When someone asks for price in comments, send DM and tag lead"`) -> Intent -> Visual Workflow Preview -> Approval.
  2. **BUILD VISUALLY**: Interactive React Flow canvas with Node Palette, simulator, edge validation, and step execution drawer.
- **Templates Library**: Pre-built flows for Price Inquiry, Lead Magnet Download, Story Engagement, FAQ Auto-responder.

### 3. Unified Inbox (`/inbox`)
- **3-Column ManyChat Layout**:
  - *Left*: Filterable Conversation List (*All*, *Instagram*, *AI Active*, *Human Takeover*, *Assigned to Me*).
  - *Middle*: Message Thread, Quick Reply Pills, AI/Human Toggle Switch, Media Attachments.
  - *Right*: Customer Profile card (*Username*, *Lead Score*, *Intent*, *Tags*, *Custom Fields*, *Automation History*, *Assignee*).

### 4. Contacts CRM (`/contacts`)
- **All Contacts Directory**: Searchable list with interaction history, source, lead score.
- **Lead Pipeline Kanban**: Drag-and-drop columns (`NEW` -> `CONTACTED` -> `QUALIFIED` -> `HOT` -> `CONVERTED` -> `LOST`).
- **Tags & Custom Fields Manager**: Configurable business data schema.

### 5. Instagram Hub (`/instagram`)
- **Account Health & Connections**: Connected Professional Accounts, Token Expiry Status, OAuth Re-authorization.
- **Channel Monitors**: Dedicated views for Comments, DMs, Story Replies, Mentions, Media Posts.

### 6. AI Agent Studio (`/ai`)
- **Agent Configuration**: Business Info, Brand Voice, Language Tone, Operating Hours, Response Behavior.
- **Knowledge Base (RAG)**: FAQ lists, Document Uploads (PDF/DOCX), Website Scrapes, Product Catalogs, Return Policies.
- **Policy & Safety Rules**: Human Escalation Triggers (Legal threats, refunds, low confidence).

### 7. Content & Publishing (`/content`)
- **AI Content Generator**: Script ideas, caption generation, hook suggestions, hashtag recommendations.
- **Content Calendar & Approval**: Draft review before publishing, post scheduling, publishing queue history.

### 8. Analytics & Attribution (`/analytics`)
- **Business Outcomes**: Conversion Rate, Revenue Attribution, Lead Velocity, Response Times.
- **Conversational AI Query Engine**: Ask AI natural language questions about performance (*"Which post produced the highest quality leads?"*).

### 9. Team & Permissions (`/team`)
- **Workspace Roles**: `OWNER`, `ADMIN`, `MEMBER`, `AGENCY_VIEWER`.
- **Assignment Routing**: Automated lead & conversation routing based on agent availability.

### 10. Settings & Entitlements (`/settings`)
- Business details, Meta OAuth configurations, Billing plan upgrades (Entitlement Engine limits), API Keys, Security Audit logs.
