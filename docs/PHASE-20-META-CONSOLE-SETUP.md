# PHASE 20 — META DEVELOPER CONSOLE SETUP GUIDE

This document provides step-by-step instructions for configuring a Meta Developer App, Instagram Graph API product, OAuth redirect URIs, and Webhook subscriptions for **Instagram Automation OS**.

---

## 1. Meta Developer App Configuration Checklist

| Step | Section | Target Value / Setting | Action Required |
| :--- | :--- | :--- | :--- |
| **1. Create App** | Meta Developer Portal | Business App Type | Select "Business" application type in Meta Dashboard. |
| **2. App ID & Secret** | Settings → Basic | Copy `App ID` & `App Secret` | Set `META_APP_ID` & `META_APP_SECRET` in `.env`. |
| **3. Add Product** | Products | Instagram Graph API | Add Instagram Graph API to the app dashboard. |
| **4. Valid OAuth Redirect URI** | Use Cases → Customize | `https://<YOUR_PUBLIC_HTTPS_DOMAIN>/api/instagram/oauth/callback` | Add valid OAuth redirect URI in Facebook Login / Instagram settings. |
| **5. Webhook Callback URL** | Webhooks → Instagram | `https://<YOUR_PUBLIC_HTTPS_DOMAIN>/api/webhooks/instagram` | Configure callback URL in Meta Webhooks dashboard. |
| **6. Verify Token** | Webhooks → Instagram | Match `META_VERIFY_TOKEN` from `.env` | Enter secret verify token string. |
| **7. Webhook Subscriptions** | Webhooks → Instagram | `comments`, `messages`, `mentions` | Subscribe to fields `comments`, `messages`, `mentions`. |

---

## 2. Required Meta Graph API Permissions

The system relies on these official Meta Graph API v19.0 permissions:

- `instagram_basic`: Access user profile, ID, username, and account metadata.
- `instagram_manage_comments`: Read, create, and delete comments on Instagram posts.
- `instagram_manage_messages`: Send and receive direct messages (DMs) with Instagram users.
- `pages_show_list`: Retrieve Facebook Pages linked to Instagram Professional accounts.
- `pages_read_engagement`: Read engagement metrics for associated pages.

---

## 3. Account Requirements & Development Mode

1. **Instagram Professional Account**: The target Instagram account must be converted to a **Creator** or **Business** account.
2. **Linked Facebook Page**: The Instagram Professional Account must be connected to a Facebook Page managed by your Meta Developer user account.
3. **Development Mode Test Users**: In Meta Development Mode, only registered **Test Users** or **Developers/Testers** assigned to the Meta App can complete OAuth authorization and trigger webhooks.
4. **App Review**: Before making the platform public to unassigned third-party Instagram users, submit the app for Meta App Review with screencast demonstrations of comment and DM automation features.
