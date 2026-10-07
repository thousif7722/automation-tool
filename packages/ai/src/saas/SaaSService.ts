import {
  SubscriptionPlanSlug,
  SubscriptionRecord,
  UsageRecord,
  InvoiceRecord,
  AgencyRecord,
  WhiteLabelConfig,
  MeteredResource,
  BillingStatus,
} from '@insta-automation/types';
import {
  SubscriptionModel,
  UsageModel,
  InvoiceModel,
  AgencyModel,
  WhiteLabelConfigModel,
} from '@insta-automation/database';
import { EntitlementEngine } from './EntitlementEngine';

export class SaaSService {
  private entitlementEngine: EntitlementEngine;
  private inMemorySubs: Map<string, SubscriptionRecord> = new Map();
  private inMemoryUsage: Map<string, UsageRecord> = new Map();
  private inMemoryAgencies: Map<string, AgencyRecord> = new Map();
  private inMemoryWhiteLabel: Map<string, WhiteLabelConfig> = new Map();

  constructor() {
    this.entitlementEngine = new EntitlementEngine();
  }

  // ==========================================
  // SUBSCRIPTION & BILLING STATE
  // ==========================================

  public async getSubscription(workspaceId: string): Promise<SubscriptionRecord> {
    if (this.inMemorySubs.has(workspaceId)) {
      return this.inMemorySubs.get(workspaceId)!;
    }

    try {
      if (SubscriptionModel && SubscriptionModel.db && SubscriptionModel.db.readyState === 1) {
        const doc = await SubscriptionModel.findOne({ workspaceId }).lean();
        if (doc) {
          const sub: SubscriptionRecord = {
            id: doc._id.toString(),
            workspaceId: doc.workspaceId.toString(),
            planSlug: doc.planSlug as SubscriptionPlanSlug,
            status: doc.status as BillingStatus,
            currentPeriodStart: doc.currentPeriodStart,
            currentPeriodEnd: doc.currentPeriodEnd,
            cancelAtPeriodEnd: doc.cancelAtPeriodEnd,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
          };
          this.inMemorySubs.set(workspaceId, sub);
          return sub;
        }
      }
    } catch {}

    const defaultSub: SubscriptionRecord = {
      id: `sub_free_${workspaceId}`,
      workspaceId,
      planSlug: 'free',
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
      cancelAtPeriodEnd: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.inMemorySubs.set(workspaceId, defaultSub);
    return defaultSub;
  }

  public async updateSubscriptionPlan(
    workspaceId: string,
    newPlan: SubscriptionPlanSlug
  ): Promise<SubscriptionRecord> {
    const sub = await this.getSubscription(workspaceId);
    sub.planSlug = newPlan;
    sub.status = 'ACTIVE';
    sub.updatedAt = new Date();

    this.inMemorySubs.set(workspaceId, sub);

    try {
      if (SubscriptionModel && SubscriptionModel.db && SubscriptionModel.db.readyState === 1) {
        await SubscriptionModel.findOneAndUpdate(
          { workspaceId },
          { planSlug: newPlan, status: 'ACTIVE' },
          { upsert: true, new: true }
        );
      }
    } catch {}

    return sub;
  }

  public async cancelSubscription(workspaceId: string): Promise<SubscriptionRecord> {
    const sub = await this.getSubscription(workspaceId);
    sub.cancelAtPeriodEnd = true;
    sub.status = 'CANCELED';
    sub.updatedAt = new Date();

    this.inMemorySubs.set(workspaceId, sub);

    try {
      if (SubscriptionModel && SubscriptionModel.db && SubscriptionModel.db.readyState === 1) {
        await SubscriptionModel.findOneAndUpdate(
          { workspaceId },
          { cancelAtPeriodEnd: true, status: 'CANCELED' }
        );
      }
    } catch {}

    return sub;
  }

  // ==========================================
  // USAGE TRACKING & ENTITLEMENTS
  // ==========================================

  public async getUsage(workspaceId: string): Promise<UsageRecord> {
    if (this.inMemoryUsage.has(workspaceId)) {
      return this.inMemoryUsage.get(workspaceId)!;
    }

    const defaultUsage: UsageRecord = {
      workspaceId,
      instagramAccounts: 1,
      teamMembers: 1,
      automationRunsThisMonth: 0,
      aiResponsesThisMonth: 0,
      conversationsThisMonth: 0,
      contactsCount: 0,
      knowledgeStorageMB: 0,
    };

    this.inMemoryUsage.set(workspaceId, defaultUsage);
    return defaultUsage;
  }

  public async checkMeteredEntitlement(
    workspaceId: string,
    resource: MeteredResource,
    requestedIncrement = 1
  ): Promise<{ allowed: boolean; current: number; limit: number; remaining: number }> {
    const sub = await this.getSubscription(workspaceId);
    const usage = await this.getUsage(workspaceId);
    return this.entitlementEngine.checkEntitlement(usage, sub.planSlug, resource, requestedIncrement);
  }

  public async incrementUsage(
    workspaceId: string,
    resource: MeteredResource,
    count = 1
  ): Promise<UsageRecord> {
    const entitlement = await this.checkMeteredEntitlement(workspaceId, resource, count);
    if (!entitlement.allowed) {
      throw new Error(
        `Quota Exceeded: Usage limit for resource '${resource}' reached (${entitlement.current}/${entitlement.limit}). Please upgrade your subscription.`
      );
    }

    const usage = await this.getUsage(workspaceId);

    switch (resource) {
      case 'instagramAccounts':
        usage.instagramAccounts += count;
        break;
      case 'teamMembers':
        usage.teamMembers += count;
        break;
      case 'automationRuns':
        usage.automationRunsThisMonth += count;
        break;
      case 'aiUsage':
        usage.aiResponsesThisMonth += count;
        break;
      case 'conversations':
        usage.conversationsThisMonth += count;
        break;
      case 'contacts':
        usage.contactsCount += count;
        break;
      case 'knowledgeStorage':
        usage.knowledgeStorageMB += count;
        break;
    }

    this.inMemoryUsage.set(workspaceId, usage);
    return usage;
  }

  public async createInvoice(workspaceId: string, amountDue: number, currency = 'usd'): Promise<InvoiceRecord> {
    const invoice: InvoiceRecord = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      workspaceId,
      amountDue,
      amountPaid: amountDue,
      currency,
      status: 'PAID',
      pdfUrl: `https://invoices.insta-automation.com/inv_${Date.now()}.pdf`,
      createdAt: new Date(),
    };

    try {
      if (InvoiceModel && InvoiceModel.db && InvoiceModel.db.readyState === 1) {
        await InvoiceModel.create({
          workspaceId,
          amountDue,
          amountPaid: amountDue,
          currency,
          status: 'PAID',
          pdfUrl: invoice.pdfUrl,
        });
      }
    } catch {}

    return invoice;
  }

  // ==========================================
  // AGENCY MODE ARCHITECTURE
  // ==========================================

  public async createAgency(agencyName: string, ownerWorkspaceId: string): Promise<AgencyRecord> {
    const agency: AgencyRecord = {
      id: `agency_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      agencyName,
      ownerWorkspaceId,
      clients: [],
      createdAt: new Date(),
    };

    this.inMemoryAgencies.set(agency.id, agency);
    return agency;
  }

  public async addAgencyClient(
    agencyId: string,
    clientWorkspaceId: string,
    clientName: string,
    role: 'CLIENT_ADMIN' | 'CLIENT_VIEWER' = 'CLIENT_ADMIN'
  ): Promise<AgencyRecord> {
    const agency = this.inMemoryAgencies.get(agencyId);
    if (!agency) {
      throw new Error(`Agency ${agencyId} not found`);
    }

    const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    agency.clients.push({
      clientId,
      clientWorkspaceId,
      clientName,
      role,
      joinedAt: new Date(),
    });

    this.inMemoryAgencies.set(agencyId, agency);
    return agency;
  }

  public async listAgencyClients(agencyId: string, requestorWorkspaceId: string): Promise<any[]> {
    const agency = this.inMemoryAgencies.get(agencyId);
    if (!agency) {
      throw new Error(`Agency ${agencyId} not found`);
    }

    // Client Isolation enforcement: requestor must be the agency owner or a member client
    const isOwner = agency.ownerWorkspaceId === requestorWorkspaceId;
    const isClient = agency.clients.some((c: { clientWorkspaceId: string }) => c.clientWorkspaceId === requestorWorkspaceId);

    if (!isOwner && !isClient) {
      throw new Error(`Access Denied: Workspace ${requestorWorkspaceId} does not have agency access permission.`);
    }

    if (!isOwner) {
      // Return isolated view for specific client
      return agency.clients.filter((c: { clientWorkspaceId: string }) => c.clientWorkspaceId === requestorWorkspaceId);
    }

    return agency.clients;
  }

  // ==========================================
  // WHITE-LABEL INFRASTRUCTURE
  // ==========================================

  public async configureWhiteLabel(
    workspaceId: string,
    config: Partial<WhiteLabelConfig>
  ): Promise<WhiteLabelConfig> {
    const sub = await this.getSubscription(workspaceId);
    const hasWhiteLabel = this.entitlementEngine.isFeatureEnabled(sub.planSlug, 'whiteLabelEnabled');

    if (!hasWhiteLabel) {
      throw new Error(
        `Feature Restricted: White-label custom branding is only available on Enterprise plans. Upgrade to unlock.`
      );
    }

    const updated: WhiteLabelConfig = {
      workspaceId,
      enabled: config.enabled ?? true,
      customDomain: config.customDomain,
      brandName: config.brandName ?? 'My Brand',
      logoUrl: config.logoUrl,
      primaryColor: config.primaryColor ?? '#6366f1',
      secondaryColor: config.secondaryColor ?? '#a855f7',
      emailSenderName: config.emailSenderName,
      emailSenderAddress: config.emailSenderAddress,
    };

    this.inMemoryWhiteLabel.set(workspaceId, updated);
    return updated;
  }

  public async getWhiteLabelConfig(workspaceId: string): Promise<WhiteLabelConfig> {
    if (this.inMemoryWhiteLabel.has(workspaceId)) {
      return this.inMemoryWhiteLabel.get(workspaceId)!;
    }

    return {
      workspaceId,
      enabled: false,
      brandName: 'Instagram Automation OS',
      primaryColor: '#6366f1',
      secondaryColor: '#a855f7',
    };
  }
}
