# Instagram Automation OS - Final System Architecture

## Executive Architecture Summary
Instagram Automation OS is an enterprise-grade social automation engine designed to support high-volume Instagram direct messaging, lead capture, visual workflow execution, customer-facing AI agents, and multi-tenant SaaS management.

---

## 1. System Components & Architecture Overview

```mermaid
graph TD
    Client[Web & Mobile Clients / React Flow Builder] -->|HTTPS / WSS| API[Express API Gateway apps/api]
    Meta[Meta Instagram Graph API] -->|Webhooks / HMAC SHA256| API
    
    API --> Auth[Auth & RBAC Middleware]
    API --> Tenant[Tenant Isolation Layer]
    API --> Normalizer[Instagram Event Normalizer]
    
    Normalizer --> EventStore[(MongoDB Event Store)]
    Normalizer --> Queue[BullMQ Event Queues / Redis]
    
    Queue --> Worker[Automation Worker Service]
    Queue --> AIWorker[AI Agent Execution Worker]
    
    Worker --> Engine[Workflow Execution Engine]
    Engine --> Policy[AI Policy Engine & Risk Gated Execution]
    
    Policy --> MCP[MCP Registry & Tool Executors]
    MCP --> MetaAPI[Instagram Graph API Client]
```

---

## 2. Request Flow Architecture

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant Meta as Meta Webhook Edge
    participant API as API Gateway (apps/api)
    participant Dedup as Event Deduplicator
    participant Queue as BullMQ (Redis)
    participant Worker as Automation Worker
    participant AI as Customer AI Agent
    participant Graph as Meta Graph API

    Customer->>Meta: Sends Instagram DM / Comment
    Meta->>API: POST /api/v1/webhooks/instagram (HMAC SHA-256)
    API->>API: Verify Signature & Tenant Association
    API->>Dedup: Check Duplicate Event (Idempotency)
    Dedup-->>API: Not Duplicate
    API->>Queue: Enqueue to 'instagram-events' queue
    API-->>Meta: 200 OK (< 200ms ACK)
    
    Queue->>Worker: Consume Event Job
    Worker->>AI: Process Customer Message (RAG + Intent)
    AI-->>Worker: Generated Response / Tool Execution Plan
    Worker->>Graph: POST /v18.0/me/messages (Send DM)
    Graph-->>Customer: Deliver Instagram Message
```

---

## 3. Event Flow Architecture

```mermaid
flowchart LR
    A[Incoming Webhook] --> B[Verification & Signature Check]
    B --> C[Event Normalization canonical AutomationEvent]
    C --> D[Persistent MongoDB Audit Record]
    D --> E[BullMQ Queue Dispatcher]
    E --> F[Worker Concurrency & Backoff Retry]
    F --> G[Workflow Engine Execution]
    F --> H[CRM & Lead Scoring Engine]
    F --> I[Analytics Aggregator]
```

---

## 4. AI Agent Architecture Flow

```mermaid
graph TD
    Input[Incoming Customer Message] --> PromptFilter[Prompt Injection Filter]
    PromptFilter --> XMLWrap[XML Context Enclosure <untrusted_customer_message>]
    XMLWrap --> Intent[Intent Classifier & RAG Knowledge Store]
    Intent --> EscalationCheck{High Risk / Human Request?}
    
    EscalationCheck -->|Yes| HumanTakeover[Trigger Human Escalation]
    EscalationCheck -->|No| Model[LLM Model Provider Ollama / Bedrock / Gemini]
    
    Model --> ToolPlan{Tool Call Proposed?}
    ToolPlan -->|No| Respond[Deliver Response]
    ToolPlan -->|Yes| Policy[Policy Engine Evaluation]
    
    Policy -->|Allowed| Executor[Tool Execution & Audit Log]
    Policy -->|Blocked| Block[Reject Tool Call & Log]
```

---

## 5. Workflow Execution Engine Flow

```mermaid
stateDiagram-v2
    [*] --> Trigger: Event Matched (Comment/DM)
    Trigger --> ConditionCheck: Evaluate Condition Nodes
    
    ConditionCheck --> BranchTrue: Match (e.g. keyword = 'PRICE')
    ConditionCheck --> BranchFalse: No Match
    
    BranchTrue --> AIDecision: Run AI Decision / Intent Node
    AIDecision --> ActionExecution: Execute Actions (Send DM, Tag, CRM Lead)
    ActionExecution --> GoalTracking: Update Conversion Goal Metrics
    GoalTracking --> [*]: Completed
```

---

## 6. Instagram Integration Flow

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant Frontend as Next.js Dashboard
    participant API as API Gateway
    participant MetaOAuth as Meta OAuth 2.0
    participant Storage as Encrypted Database

    Admin->>Frontend: Click "Connect Instagram Account"
    Frontend->>MetaOAuth: Redirect to Meta Authorization Dialog
    MetaOAuth-->>Admin: Grant Permissions Scope (instagram_basic, instagram_manage_messages)
    Admin->>MetaOAuth: Approve Authorization
    MetaOAuth->>API: OAuth Callback with Auth Code
    API->>MetaOAuth: Exchange Code for Long-Lived Token
    API->>Storage: Encrypt Token with AES-256-GCM & Save Record
    Storage-->>Frontend: Connected Status Display (Plaintext Token NEVER Exposed)
```

---

## 7. Tenant Isolation Model

```mermaid
graph LR
    subgraph Tenant Alpha
        A_User[User A] --> A_API[API Workspace Guard]
        A_API --> A_DB[(MongoDB Filter: workspaceId: tenant_alpha)]
    end

    subgraph Tenant Beta
        B_User[User B] --> B_API[API Workspace Guard]
        B_API --> B_DB[(MongoDB Filter: workspaceId: tenant_beta)]
    end

    subgraph Platform Admin / Agency
        Agency[Agency Dashboard] --> Entitlements[Entitlement Engine]
        Entitlements --> ClientList[List Permitted Workspaces Only]
    end
```

---

## 8. Deployment Architecture

```mermaid
graph TD
    CDN[Cloudflare CDN / WAF] --> ALB[AWS Application Load Balancer]
    
    subgraph Private VPC Container Cluster
        ALB --> NextApp[Next.js Visual Builder SSR - Port 3000]
        ALB --> ApiApp[Express API Services - Port 4000]
        
        ApiApp --> WorkerCluster[BullMQ Worker Service Containers]
    end

    subgraph Managed Database Infrastructure
        WorkerCluster --> MongoDb[(MongoDB Replica Set)]
        WorkerCluster --> Redis[(Redis Cluster Cache & Queue)]
    end
```

---

## 9. Disaster Recovery Strategy

```mermaid
flowchart TD
    PrimaryRegion[Primary Region - US-East-1] -->|Continuous Replication| DRRegion[Disaster Recovery Region - US-West-2]
    
    PrimaryRegion --> DBPrimary[(Primary MongoDB & Redis)]
    DBPrimary -->|Oplog Sync| DBSecondary[(Standby Database Replica)]
    
    FailoverTrigger[Region Failure Detected] --> Route53[DNS Failover Update]
    Route53 --> DRRegion
```

---

## 10. Scaling Strategy

```mermaid
flowchart LR
    Load[100,000 DMs / Min Load] --> Gateway[API Gateway Rate Limiter]
    Gateway --> PubSub[Redis Pub/Sub & BullMQ Partitioning]
    PubSub --> WorkerScale[Auto-Scaling Worker Pods (HPA 1-50 Pods)]
    WorkerScale --> DBWrite[MongoDB Write Sharding & Redis Caching]
```
