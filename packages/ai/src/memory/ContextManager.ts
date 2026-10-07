import { ShortTermMemory, BusinessMemory, CustomerMemory } from '../types';

export class ContextManager {
  private shortTermMemory: ShortTermMemory = { messages: [] };
  private businessMemory: BusinessMemory;
  private customerMemories: Map<string, CustomerMemory> = new Map();

  constructor(initialBusinessMemory?: Partial<BusinessMemory>) {
    this.businessMemory = {
      brandName: initialBusinessMemory?.brandName || 'Instagram Automation OS',
      toneOfVoice: initialBusinessMemory?.toneOfVoice || 'Professional & Friendly',
      products: initialBusinessMemory?.products || [
        { name: 'Core SaaS License', price: 49, description: 'Automated DMs & Leads for Instagram' },
      ],
      faqs: initialBusinessMemory?.faqs || [
        { question: 'What is the price?', answer: 'Our core subscription starts at $49/month.' },
      ],
      policies: initialBusinessMemory?.policies || [
        { category: 'Refunds', rule: '30-day money-back guarantee.' },
      ],
    };
  }

  // Short term conversation memory
  public addMessage(role: 'user' | 'assistant' | 'system', content: string): void {
    this.shortTermMemory.messages.push({ role, content });
    if (this.shortTermMemory.messages.length > 20) {
      this.shortTermMemory.messages.shift();
    }
  }

  public getShortTermMemory(): ShortTermMemory {
    return this.shortTermMemory;
  }

  // Business Memory
  public getBusinessMemory(): BusinessMemory {
    return this.businessMemory;
  }

  public updateBusinessMemory(update: Partial<BusinessMemory>): void {
    this.businessMemory = { ...this.businessMemory, ...update };
  }

  // Customer Memory
  public getCustomerMemory(username: string): CustomerMemory {
    if (!this.customerMemories.has(username)) {
      this.customerMemories.set(username, {
        username,
        tags: ['new_visitor'],
        score: 0,
        history: [],
      });
    }
    return this.customerMemories.get(username)!;
  }

  public updateCustomerMemory(username: string, update: Partial<CustomerMemory>): CustomerMemory {
    const existing = this.getCustomerMemory(username);
    const updated = {
      ...existing,
      ...update,
      tags: Array.from(new Set([...existing.tags, ...(update.tags || [])])),
    };
    this.customerMemories.set(username, updated);
    return updated;
  }
}
