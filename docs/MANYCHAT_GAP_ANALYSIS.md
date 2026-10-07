# Instagram Automation OS - ManyChat Architecture Gap Analysis

## Overview
This document evaluates the existing monorepo implementation against the newly defined **ManyChat-Style Information Architecture**.

---

## 1. Feature Status Inventory

| Feature Module | Existing Codebase State | Status | Gap & Action Plan |
| :--- | :--- | :---: | :--- |
| **Visual Workflow Builder** | React Flow canvas, node palette, simulator drawer, validation panel in `apps/web/src/components`. | **EXISTING** | Mount into `/automation/builder` route; preserve 100% of existing visual builder functionality. |
| **AI Workflow Generator** | LLM orchestrator in `@insta-automation/ai` package. | **PARTIAL** | Add natural language prompt drawer UI in `/automation/new` that converts text prompt -> React Flow node JSON graph. |
| **Unified Inbox** | Backend message routes in `apps/api/src/routes/messages.ts` and CRM service. | **PARTIAL** | Build 3-column React frontend inbox component in `/inbox` with AI/Human toggle switch and Customer Profile sidebar. |
| **Contacts & Lead CRM** | `CRMService`, `LeadModel`, `CustomerModel` in `@insta-automation/database`. | **EXISTING** | Build Lead Kanban Pipeline UI (`NEW` -> `CONVERTED`) and Customer table view in `/contacts`. |
| **Instagram Account Hub** | `InstagramAccountService`, OAuth flow, encrypted token storage in `@insta-automation/instagram`. | **EXISTING** | Build Account Health dashboard & connection status cards in `/instagram`. |
| **AI Agent & Knowledge (RAG)** | `CustomerAIAgent`, `KnowledgeStore`, `PromptInjectionFilter` in `@insta-automation/ai`. | **EXISTING** | Build AI Studio config UI & FAQ / Document upload form in `/ai`. |
| **Content & Analytics** | `ContentService`, `AnalyticsService` in `@insta-automation/ai`. | **EXISTING** | Build Content Calendar & Business Analytics dashboard in `/content` and `/analytics`. |
| **SaaS Entitlements & Billing** | `SaaSService`, `EntitlementEngine`, `packages/billing` Razorpay provider. | **EXISTING** | Connect subscription plan cards & quota meters in `/settings/billing`. |
| **Agency Workspace Switcher** | `SaaSService` multi-client methods (`getAgencyClients`). | **EXISTING** | Build workspace switcher dropdown in top navigation bar. |
| **Super Admin Portal** | Express routes in `apps/api/src/routes/admin.ts`. | **EXISTING** | Maintain strict separation; mount under isolated `/admin` path for platform super admins. |

---

## 2. Redundancy & Conflict Resolution
1. **No Code Deletion**: All existing React Flow nodes (`Instagram Comment`, `Send DM`, `Keyword Match`, `Goal Conversion`) and simulation engines remain untouched.
2. **Unified Navigation**: Re-organize single-page view into a clean top-level tabbed layout matching modern SaaS design systems.
