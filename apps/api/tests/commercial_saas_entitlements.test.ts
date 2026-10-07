import { SaaSService, EntitlementEngine, PLAN_LIMITS_MAP } from '@insta-automation/ai';
import { SubscriptionPlanSlug } from '@insta-automation/types';

describe('Commercial SaaS Layer & Entitlement Engine Unit Tests', () => {
  const workspaceId = 'ws_saas_test_777';
  let saasService: SaaSService;
  let entitlementEngine: EntitlementEngine;

  beforeEach(() => {
    saasService = new SaaSService();
    entitlementEngine = new EntitlementEngine();
  });

  describe('1. Multi-Tier Plan Entitlements & Feature Flags', () => {
    it('should define distinct limits across all 6 subscription tiers', () => {
      const plans: SubscriptionPlanSlug[] = ['free', 'starter', 'growth', 'pro', 'business', 'enterprise'];

      for (const plan of plans) {
        const limits = entitlementEngine.getPlanLimits(plan);
        expect(limits.maxInstagramAccounts).toBeGreaterThan(0);
        expect(limits.maxAutomationRunsPerMonth).toBeGreaterThan(0);
        expect(limits.featureFlags).toBeDefined();
      }

      // Specific tier assertions
      expect(PLAN_LIMITS_MAP.free.maxInstagramAccounts).toBe(1);
      expect(PLAN_LIMITS_MAP.enterprise.maxInstagramAccounts).toBe(100);
      expect(PLAN_LIMITS_MAP.free.featureFlags.aiAgentEnabled).toBe(false);
      expect(PLAN_LIMITS_MAP.starter.featureFlags.aiAgentEnabled).toBe(true);
      expect(PLAN_LIMITS_MAP.business.featureFlags.agencyModeEnabled).toBe(true);
      expect(PLAN_LIMITS_MAP.enterprise.featureFlags.whiteLabelEnabled).toBe(true);
    });
  });

  describe('2. Subscription Lifecycle & Upgrades/Downgrades', () => {
    it('should initialize on free plan and handle upgrade to Pro plan', async () => {
      const initial = await saasService.getSubscription(workspaceId);
      expect(initial.planSlug).toBe('free');
      expect(initial.status).toBe('ACTIVE');

      // Upgrade to Pro
      const upgraded = await saasService.updateSubscriptionPlan(workspaceId, 'pro');
      expect(upgraded.planSlug).toBe('pro');

      // Verify entitlement immediately expands
      const entitlement = await saasService.checkMeteredEntitlement(workspaceId, 'automationRuns');
      expect(entitlement.limit).toBe(100000); // Pro limit
    });

    it('should cancel subscription gracefully at period end', async () => {
      const cancelled = await saasService.cancelSubscription(workspaceId);
      expect(cancelled.status).toBe('CANCELED');
      expect(cancelled.cancelAtPeriodEnd).toBe(true);
    });
  });

  describe('3. Usage Metering & Over-Quota Protection', () => {
    it('should track usage and enforce quota limits on Free plan', async () => {
      // Free plan has max 100 AI responses per month
      await saasService.incrementUsage(workspaceId, 'aiUsage', 50);
      const usage = await saasService.getUsage(workspaceId);
      expect(usage.aiResponsesThisMonth).toBe(50);

      // Attempting to exceed free quota (add 60 when 50 used -> 110 > 100 limit)
      await expect(saasService.incrementUsage(workspaceId, 'aiUsage', 60)).rejects.toThrow(
        /Quota Exceeded: Usage limit for resource 'aiUsage' reached/
      );
    });
  });

  describe('4. Agency Mode Architecture & Client Isolation', () => {
    it('should manage agency clients and enforce client isolation permissions', async () => {
      const ownerWs = 'ws_agency_owner';
      const client1Ws = 'ws_client_alpha';
      const client2Ws = 'ws_client_beta';

      // Create Agency
      const agency = await saasService.createAgency('Apex Growth Agency', ownerWs);
      await saasService.addAgencyClient(agency.id, client1Ws, 'Alpha E-Commerce');
      await saasService.addAgencyClient(agency.id, client2Ws, 'Beta Fitness');

      // Agency owner lists all clients
      const allClients = await saasService.listAgencyClients(agency.id, ownerWs);
      expect(allClients.length).toBe(2);

      // Client 1 can only view its own isolated client record
      const client1View = await saasService.listAgencyClients(agency.id, client1Ws);
      expect(client1View.length).toBe(1);
      expect(client1View[0].clientWorkspaceId).toBe(client1Ws);

      // Unauthorized workspace gets Access Denied
      await expect(saasService.listAgencyClients(agency.id, 'ws_unauthorized')).rejects.toThrow(
        /Access Denied/
      );
    });
  });

  describe('5. White-Label Architecture & Entitlement Guard', () => {
    it('should block white-label configuration on non-enterprise plans and permit it on enterprise', async () => {
      // On Free plan
      await expect(
        saasService.configureWhiteLabel(workspaceId, {
          enabled: true,
          brandName: 'Custom Agency Brand',
          customDomain: 'automation.myagency.com',
        })
      ).rejects.toThrow(/Feature Restricted: White-label custom branding is only available on Enterprise/);

      // Upgrade workspace to Enterprise plan
      await saasService.updateSubscriptionPlan(workspaceId, 'enterprise');

      // Now configure white-label
      const config = await saasService.configureWhiteLabel(workspaceId, {
        enabled: true,
        brandName: 'Custom Agency Brand',
        customDomain: 'automation.myagency.com',
        primaryColor: '#10b981',
      });

      expect(config.enabled).toBe(true);
      expect(config.brandName).toBe('Custom Agency Brand');
      expect(config.customDomain).toBe('automation.myagency.com');
      expect(config.primaryColor).toBe('#10b981');
    });
  });
});
