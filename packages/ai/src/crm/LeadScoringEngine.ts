import { ScoringRule, ScoringSignal, LeadState } from '@insta-automation/types';
import { ScoringRuleModel } from '@insta-automation/database';

export class LeadScoringEngine {
  private inMemoryRules: Map<string, ScoringRule[]> = new Map();

  constructor() {
    // Default baseline scoring rules
    const defaultRules: ScoringRule[] = [
      {
        id: 'rule_price',
        signal: 'price_question',
        points: 15,
        description: 'Customer asked about pricing or rates',
        isEnabled: true,
      },
      {
        id: 'rule_availability',
        signal: 'availability_question',
        points: 10,
        description: 'Customer inquired about stock or schedule availability',
        isEnabled: true,
      },
      {
        id: 'rule_location',
        signal: 'location_provided',
        points: 20,
        description: 'Customer shared city, state, or delivery location',
        isEnabled: true,
      },
      {
        id: 'rule_contact',
        signal: 'contact_info_provided',
        points: 30,
        description: 'Customer provided email or phone contact info',
        isEnabled: true,
      },
      {
        id: 'rule_product',
        signal: 'product_selected',
        points: 25,
        description: 'Customer selected a specific product or service tier',
        isEnabled: true,
      },
      {
        id: 'rule_intent',
        signal: 'purchase_intent',
        points: 40,
        description: 'Customer expressed active buy or order intent',
        isEnabled: true,
      },
      {
        id: 'rule_repeat',
        signal: 'repeat_engagement',
        points: 10,
        description: 'Customer engaged in multiple conversation sessions',
        isEnabled: true,
      },
    ];
    this.inMemoryRules.set('default', defaultRules);
  }

  public async getScoringRules(workspaceId: string): Promise<ScoringRule[]> {
    if (this.inMemoryRules.has(workspaceId)) {
      return this.inMemoryRules.get(workspaceId)!;
    }

    try {
      if (ScoringRuleModel && ScoringRuleModel.db && ScoringRuleModel.db.readyState === 1) {
        const docs = await ScoringRuleModel.find({ workspaceId }).lean();
        if (docs.length > 0) {
          const rules: ScoringRule[] = docs.map((d) => ({
            id: d.ruleId,
            signal: d.signal as ScoringSignal,
            points: d.points,
            description: d.description,
            isEnabled: d.isEnabled,
          }));
          this.inMemoryRules.set(workspaceId, rules);
          return rules;
        }
      }
    } catch {}

    return this.inMemoryRules.get('default')!;
  }

  public async updateScoringRule(
    workspaceId: string,
    ruleId: string,
    updates: Partial<Omit<ScoringRule, 'id'>>
  ): Promise<ScoringRule[]> {
    const rules = await this.getScoringRules(workspaceId);
    const updatedRules = rules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r));
    this.inMemoryRules.set(workspaceId, updatedRules);

    try {
      if (ScoringRuleModel && ScoringRuleModel.db && ScoringRuleModel.db.readyState === 1) {
        const target = updatedRules.find((r) => r.id === ruleId);
        if (target) {
          await ScoringRuleModel.findOneAndUpdate(
            { workspaceId, ruleId },
            { ...target, workspaceId, ruleId },
            { upsert: true }
          );
        }
      }
    } catch {}

    return updatedRules;
  }

  public detectSignals(message: string): ScoringSignal[] {
    const signals: ScoringSignal[] = [];
    const textLower = message.toLowerCase();

    // 1. Price Question
    if (textLower.includes('price') || textLower.includes('cost') || textLower.includes('how much') || textLower.includes('rates')) {
      signals.push('price_question');
    }

    // 2. Availability Question
    if (textLower.includes('available') || textLower.includes('in stock') || textLower.includes('when can i book')) {
      signals.push('availability_question');
    }

    // 3. Location Provided
    if (textLower.includes('live in') || textLower.includes('located in') || textLower.includes('my address') || textLower.includes('shipping to')) {
      signals.push('location_provided');
    }

    // 4. Contact Information Provided
    if (textLower.includes('@') || textLower.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/) || textLower.includes('my phone') || textLower.includes('my email')) {
      signals.push('contact_info_provided');
    }

    // 5. Product Selected
    if (textLower.includes('leggings') || textLower.includes('hoodie') || textLower.includes('package') || textLower.includes('tier') || textLower.includes('option')) {
      signals.push('product_selected');
    }

    // 6. Purchase Intent
    if (textLower.includes('buy') || textLower.includes('purchase') || textLower.includes('ready to order') || textLower.includes('send invoice')) {
      signals.push('purchase_intent');
    }

    return signals;
  }

  public calculateScoreIncrement(signals: ScoringSignal[], rules: ScoringRule[]): number {
    let increment = 0;
    const ruleMap = new Map(rules.filter((r) => r.isEnabled).map((r) => [r.signal, r.points]));

    for (const signal of signals) {
      if (ruleMap.has(signal)) {
        increment += ruleMap.get(signal)!;
      }
    }
    return increment;
  }

  public deriveLeadStateFromScore(currentScore: number, existingStatus: LeadState): LeadState {
    if (existingStatus === 'CONVERTED' || existingStatus === 'LOST') {
      return existingStatus; // Final states remain intact unless manually updated
    }
    if (currentScore >= 90) return 'HOT';
    if (currentScore >= 60) return 'QUALIFIED';
    if (currentScore >= 30) return 'CONTACTED';
    return 'NEW';
  }
}
