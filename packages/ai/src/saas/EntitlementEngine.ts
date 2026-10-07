import { SubscriptionPlanSlug, PlanLimits, MeteredResource, UsageRecord } from '@insta-automation/types';

export const PLAN_LIMITS_MAP: Record<SubscriptionPlanSlug, PlanLimits> = {
  free: {
    maxInstagramAccounts: 1,
    maxTeamMembers: 1,
    maxAutomationRunsPerMonth: 500,
    maxAIResponsesPerMonth: 100,
    maxConversationsPerMonth: 200,
    maxContacts: 100,
    maxKnowledgeStorageMB: 10,
    analyticsRetentionDays: 7,
    featureFlags: {
      aiAgentEnabled: false,
      crmEnabled: false,
      contentStudioEnabled: false,
      agencyModeEnabled: false,
      whiteLabelEnabled: false,
      customDomainEnabled: false,
      prioritySupport: false,
    },
  },
  starter: {
    maxInstagramAccounts: 2,
    maxTeamMembers: 2,
    maxAutomationRunsPerMonth: 5000,
    maxAIResponsesPerMonth: 1000,
    maxConversationsPerMonth: 2000,
    maxContacts: 1000,
    maxKnowledgeStorageMB: 50,
    analyticsRetentionDays: 30,
    featureFlags: {
      aiAgentEnabled: true,
      crmEnabled: true,
      contentStudioEnabled: false,
      agencyModeEnabled: false,
      whiteLabelEnabled: false,
      customDomainEnabled: false,
      prioritySupport: false,
    },
  },
  growth: {
    maxInstagramAccounts: 5,
    maxTeamMembers: 5,
    maxAutomationRunsPerMonth: 25000,
    maxAIResponsesPerMonth: 5000,
    maxConversationsPerMonth: 10000,
    maxContacts: 5000,
    maxKnowledgeStorageMB: 250,
    analyticsRetentionDays: 90,
    featureFlags: {
      aiAgentEnabled: true,
      crmEnabled: true,
      contentStudioEnabled: true,
      agencyModeEnabled: false,
      whiteLabelEnabled: false,
      customDomainEnabled: false,
      prioritySupport: false,
    },
  },
  pro: {
    maxInstagramAccounts: 10,
    maxTeamMembers: 10,
    maxAutomationRunsPerMonth: 100000,
    maxAIResponsesPerMonth: 25000,
    maxConversationsPerMonth: 50000,
    maxContacts: 25000,
    maxKnowledgeStorageMB: 1000,
    analyticsRetentionDays: 365,
    featureFlags: {
      aiAgentEnabled: true,
      crmEnabled: true,
      contentStudioEnabled: true,
      agencyModeEnabled: false,
      whiteLabelEnabled: false,
      customDomainEnabled: true,
      prioritySupport: true,
    },
  },
  business: {
    maxInstagramAccounts: 25,
    maxTeamMembers: 25,
    maxAutomationRunsPerMonth: 500000,
    maxAIResponsesPerMonth: 100000,
    maxConversationsPerMonth: 250000,
    maxContacts: 100000,
    maxKnowledgeStorageMB: 5000,
    analyticsRetentionDays: 730,
    featureFlags: {
      aiAgentEnabled: true,
      crmEnabled: true,
      contentStudioEnabled: true,
      agencyModeEnabled: true,
      whiteLabelEnabled: false,
      customDomainEnabled: true,
      prioritySupport: true,
    },
  },
  enterprise: {
    maxInstagramAccounts: 100,
    maxTeamMembers: 100,
    maxAutomationRunsPerMonth: 5000000,
    maxAIResponsesPerMonth: 1000000,
    maxConversationsPerMonth: 2500000,
    maxContacts: 1000000,
    maxKnowledgeStorageMB: 50000,
    analyticsRetentionDays: 1825,
    featureFlags: {
      aiAgentEnabled: true,
      crmEnabled: true,
      contentStudioEnabled: true,
      agencyModeEnabled: true,
      whiteLabelEnabled: true,
      customDomainEnabled: true,
      prioritySupport: true,
    },
  },
};

export class EntitlementEngine {
  public getPlanLimits(planSlug: SubscriptionPlanSlug): PlanLimits {
    return PLAN_LIMITS_MAP[planSlug] ?? PLAN_LIMITS_MAP.free;
  }

  public isFeatureEnabled(planSlug: SubscriptionPlanSlug, featureKey: keyof PlanLimits['featureFlags']): boolean {
    const limits = this.getPlanLimits(planSlug);
    return Boolean(limits.featureFlags[featureKey]);
  }

  public checkEntitlement(
    usage: UsageRecord,
    planSlug: SubscriptionPlanSlug,
    resource: MeteredResource,
    requestedIncrement = 1
  ): { allowed: boolean; current: number; limit: number; remaining: number } {
    const limits = this.getPlanLimits(planSlug);
    let current = 0;
    let limit = 0;

    switch (resource) {
      case 'instagramAccounts':
        current = usage.instagramAccounts;
        limit = limits.maxInstagramAccounts;
        break;
      case 'teamMembers':
        current = usage.teamMembers;
        limit = limits.maxTeamMembers;
        break;
      case 'automationRuns':
        current = usage.automationRunsThisMonth;
        limit = limits.maxAutomationRunsPerMonth;
        break;
      case 'aiUsage':
        current = usage.aiResponsesThisMonth;
        limit = limits.maxAIResponsesPerMonth;
        break;
      case 'conversations':
        current = usage.conversationsThisMonth;
        limit = limits.maxConversationsPerMonth;
        break;
      case 'contacts':
        current = usage.contactsCount;
        limit = limits.maxContacts;
        break;
      case 'knowledgeStorage':
        current = usage.knowledgeStorageMB;
        limit = limits.maxKnowledgeStorageMB;
        break;
      case 'analyticsRetention':
        current = limits.analyticsRetentionDays;
        limit = limits.analyticsRetentionDays;
        break;
    }

    const remaining = Math.max(0, limit - current);
    const allowed = current + requestedIncrement <= limit;

    return { allowed, current, limit, remaining };
  }
}
