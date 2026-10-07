import { BusinessProfile, KnowledgeItem, KnowledgeDocumentType } from '@insta-automation/types';
import { BusinessProfileModel, KnowledgeItemModel } from '@insta-automation/database';

export interface RetrievedKnowledge {
  id: string;
  title: string;
  documentType: KnowledgeDocumentType;
  snippet: string;
  score: number;
}

export class KnowledgeStore {
  private inMemoryProfile: Map<string, BusinessProfile> = new Map();
  private inMemoryItems: Map<string, KnowledgeItem[]> = new Map();

  constructor() {
    // Seed default baseline profile for fallback
    const defaultProfile: BusinessProfile = {
      brandName: 'Apex Fitness Gear',
      description: 'Premium performance athletic wear and fitness accessories.',
      industry: 'E-commerce & Fitness',
      tone: 'friendly',
      languages: ['en'],
      businessHours: 'Mon-Fri 9:00 AM - 6:00 PM EST',
      locations: ['New York, USA', 'London, UK'],
      contactInfo: {
        email: 'support@apexfitness.com',
        phone: '+1 (800) 555-APEX',
        website: 'https://apexfitness.com',
      },
      products: [
        { name: 'Apex Ultra Leggings', description: 'High-waisted compression leggings', price: 68 },
        { name: 'Pro Power Hoodie', description: 'Thermal fleece training hoodie', price: 85 },
      ],
      services: [{ name: 'Custom Apparel Printing', description: 'Bulk order branding for gyms', price: 150 }],
      pricing: 'Standard retail pricing $45 - $120. Bulk discount 15% on 20+ units.',
      policies: [
        { category: 'Refunds', rule: '30-day returns on unworn items with tags attached.' },
        { category: 'Shipping', rule: 'Free shipping on US orders over $75.' },
      ],
    };
    this.inMemoryProfile.set('default', defaultProfile);
  }

  public async setBusinessProfile(workspaceId: string, profile: BusinessProfile): Promise<BusinessProfile> {
    this.inMemoryProfile.set(workspaceId, profile);
    try {
      if (BusinessProfileModel && BusinessProfileModel.db && BusinessProfileModel.db.readyState === 1) {
        await BusinessProfileModel.findOneAndUpdate(
          { workspaceId },
          { ...profile, workspaceId },
          { upsert: true, new: true }
        );
      }
    } catch {}
    return profile;
  }

  public async getBusinessProfile(workspaceId: string): Promise<BusinessProfile> {
    if (this.inMemoryProfile.has(workspaceId)) {
      return this.inMemoryProfile.get(workspaceId)!;
    }
    try {
      if (BusinessProfileModel && BusinessProfileModel.db && BusinessProfileModel.db.readyState === 1) {
        const doc = await BusinessProfileModel.findOne({ workspaceId }).lean();
        if (doc) {
          const profile: BusinessProfile = {
            brandName: doc.brandName,
            description: doc.description,
            industry: doc.industry,
            tone: doc.tone as any,
            languages: doc.languages,
            businessHours: doc.businessHours,
            locations: doc.locations,
            contactInfo: doc.contactInfo,
            products: doc.products,
            services: doc.services,
            pricing: doc.pricing,
            policies: doc.policies,
          };
          this.inMemoryProfile.set(workspaceId, profile);
          return profile;
        }
      }
    } catch {}
    return this.inMemoryProfile.get('default')!;
  }

  public async addKnowledgeItem(
    workspaceId: string,
    item: Omit<KnowledgeItem, 'id' | 'workspaceId' | 'createdAt' | 'updatedAt'>
  ): Promise<KnowledgeItem> {
    const newItem: KnowledgeItem = {
      ...item,
      id: `kitem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      workspaceId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const existing = this.inMemoryItems.get(workspaceId) || [];
    existing.push(newItem);
    this.inMemoryItems.set(workspaceId, existing);

    try {
      if (KnowledgeItemModel && KnowledgeItemModel.db && KnowledgeItemModel.db.readyState === 1) {
        await KnowledgeItemModel.create({ ...newItem, workspaceId });
      }
    } catch {}

    return newItem;
  }

  public async getKnowledgeItems(workspaceId: string): Promise<KnowledgeItem[]> {
    const cached = this.inMemoryItems.get(workspaceId);
    if (cached && cached.length > 0) return cached;

    try {
      if (KnowledgeItemModel && KnowledgeItemModel.db && KnowledgeItemModel.db.readyState === 1) {
        const docs = await KnowledgeItemModel.find({ workspaceId }).lean();
        if (docs.length > 0) {
          const items: KnowledgeItem[] = docs.map((d) => ({
            id: d._id.toString(),
            workspaceId: d.workspaceId.toString(),
            title: d.title,
            documentType: d.documentType,
            content: d.content,
            tags: d.tags,
            sourceUrl: d.sourceUrl,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt,
          }));
          this.inMemoryItems.set(workspaceId, items);
          return items;
        }
      }
    } catch {}

    return [];
  }

  public async retrieveRelevantKnowledge(
    workspaceId: string,
    query: string,
    limit: number = 3
  ): Promise<RetrievedKnowledge[]> {
    const profile = await this.getBusinessProfile(workspaceId);
    const items = await this.getKnowledgeItems(workspaceId);
    const queryLower = query.toLowerCase();

    const results: RetrievedKnowledge[] = [];

    // Search knowledge items
    for (const item of items) {
      let score = 0;
      const titleLower = item.title.toLowerCase();
      const contentLower = item.content.toLowerCase();

      const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 2);
      for (const word of queryWords) {
        if (titleLower.includes(word)) score += 0.4;
        if (contentLower.includes(word)) score += 0.2;
      }
      for (const tag of item.tags) {
        if (queryLower.includes(tag.toLowerCase())) score += 0.3;
      }

      if (score > 0) {
        results.push({
          id: item.id,
          title: item.title,
          documentType: item.documentType,
          snippet: item.content.substring(0, 300),
          score: Math.min(score, 1.0),
        });
      }
    }

    // Search products in profile
    for (const prod of profile.products) {
      if (queryLower.includes(prod.name.toLowerCase()) || queryLower.includes('product') || queryLower.includes('price')) {
        results.push({
          id: `prod_${prod.name}`,
          title: `Product: ${prod.name}`,
          documentType: 'PRODUCT_INFO',
          snippet: `${prod.name}: ${prod.description} (Price: $${prod.price})`,
          score: 0.85,
        });
      }
    }

    // Search policies in profile
    for (const pol of profile.policies) {
      if (queryLower.includes(pol.category.toLowerCase()) || queryLower.includes('policy') || queryLower.includes('return') || queryLower.includes('refund')) {
        results.push({
          id: `pol_${pol.category}`,
          title: `Policy: ${pol.category}`,
          documentType: 'POLICY',
          snippet: `${pol.category}: ${pol.rule}`,
          score: 0.9,
        });
      }
    }

    // Sort by score descending and return top matches
    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }
}
