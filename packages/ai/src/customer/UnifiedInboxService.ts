import {
  UnifiedInboxConversation,
  UnifiedInboxMessage,
  AIConversationStatus,
  CustomerIntent,
  LeadState,
} from '@insta-automation/types';
import { AIConversationModel, LeadModel } from '@insta-automation/database';
import { CustomerAIAgent } from './CustomerAIAgent';
import { ProviderFactory } from '../providers/ProviderFactory';

export class UnifiedInboxService {
  private inMemoryStore: Map<string, UnifiedInboxConversation> = new Map();
  private customerAgent: CustomerAIAgent;

  constructor() {
    const provider = ProviderFactory.createProvider('ollama');
    this.customerAgent = new CustomerAIAgent(provider);
  }

  public async getOrCreateConversation(
    workspaceId: string,
    conversationId: string,
    customerUsername: string
  ): Promise<UnifiedInboxConversation> {
    if (this.inMemoryStore.has(conversationId)) {
      return this.inMemoryStore.get(conversationId)!;
    }

    try {
      if (AIConversationModel && AIConversationModel.db && AIConversationModel.db.readyState === 1) {
        const doc = await AIConversationModel.findOne({ conversationId }).lean();
        if (doc) {
          const conv: UnifiedInboxConversation = {
            conversationId: doc.conversationId,
            workspaceId: doc.workspaceId.toString(),
            customer: doc.customer as any,
            aiStatus: doc.aiStatus as AIConversationStatus,
            currentIntent: doc.currentIntent as CustomerIntent,
            lastMessage: doc.lastMessage,
            lastMessageTimestamp: doc.lastMessageTimestamp,
            unreadCount: doc.unreadCount,
            messages: doc.messages as any[],
          };
          this.inMemoryStore.set(conversationId, conv);
          return conv;
        }
      }
    } catch {}

    const newConv: UnifiedInboxConversation = {
      conversationId,
      workspaceId,
      customer: {
        username: customerUsername,
        leadScore: 10,
        tags: ['new_inquiry'],
      },
      aiStatus: 'AI_HANDLING',
      currentIntent: 'general_question',
      lastMessage: '',
      lastMessageTimestamp: new Date(),
      unreadCount: 0,
      messages: [],
    };
    this.inMemoryStore.set(conversationId, newConv);
    return newConv;
  }

  public async saveConversation(conv: UnifiedInboxConversation): Promise<void> {
    this.inMemoryStore.set(conv.conversationId, conv);

    try {
      if (AIConversationModel && AIConversationModel.db && AIConversationModel.db.readyState === 1) {
        await AIConversationModel.findOneAndUpdate(
          { conversationId: conv.conversationId },
          {
            conversationId: conv.conversationId,
            workspaceId: conv.workspaceId,
            customer: conv.customer,
            aiStatus: conv.aiStatus,
            currentIntent: conv.currentIntent,
            lastMessage: conv.lastMessage,
            lastMessageTimestamp: conv.lastMessageTimestamp,
            unreadCount: conv.unreadCount,
            messages: conv.messages,
          },
          { upsert: true, new: true }
        );
      }
    } catch {}
  }

  public async listConversations(workspaceId: string): Promise<UnifiedInboxConversation[]> {
    const memList = Array.from(this.inMemoryStore.values()).filter((c) => c.workspaceId === workspaceId);
    if (memList.length > 0) return memList;

    try {
      if (AIConversationModel && AIConversationModel.db && AIConversationModel.db.readyState === 1) {
        const docs = await AIConversationModel.find({ workspaceId }).lean();
        return docs.map((doc) => ({
          conversationId: doc.conversationId,
          workspaceId: doc.workspaceId.toString(),
          customer: doc.customer as any,
          aiStatus: doc.aiStatus as AIConversationStatus,
          currentIntent: doc.currentIntent as CustomerIntent,
          lastMessage: doc.lastMessage,
          lastMessageTimestamp: doc.lastMessageTimestamp,
          unreadCount: doc.unreadCount,
          messages: doc.messages as any[],
        }));
      }
    } catch {}

    return memList;
  }

  // BUTTON ACTION 1: Trigger AI Reply
  public async handleAIReply(
    workspaceId: string,
    conversationId: string,
    customerMessage: string
  ): Promise<UnifiedInboxConversation> {
    const conv = await this.getOrCreateConversation(workspaceId, conversationId, 'customer_user');

    const result = await this.customerAgent.processIncomingMessage({
      workspaceId,
      conversationId,
      customerUsername: conv.customer.username,
      incomingMessage: customerMessage,
      existingConversation: conv,
    });

    if (result.leadScoreDelta) {
      conv.customer.leadScore += result.leadScoreDelta;
    }
    if (result.tagsAdded) {
      conv.customer.tags = Array.from(new Set([...conv.customer.tags, ...result.tagsAdded]));
    }

    await this.saveConversation(conv);
    return conv;
  }

  // BUTTON ACTION 2: Take Over (Switch to Human Agent)
  public async takeOver(workspaceId: string, conversationId: string): Promise<UnifiedInboxConversation> {
    const conv = await this.getOrCreateConversation(workspaceId, conversationId, 'customer_user');
    conv.aiStatus = 'HUMAN_TAKEOVER';

    const systemMsg: UnifiedInboxMessage = {
      id: `msg_sys_${Date.now()}`,
      sender: 'HUMAN_AGENT',
      content: '[System] Human agent took over conversation.',
      timestamp: new Date(),
    };
    conv.messages.push(systemMsg);

    await this.saveConversation(conv);
    return conv;
  }

  // BUTTON ACTION 3: Return to AI (Re-enable AI Agent)
  public async returnToAI(workspaceId: string, conversationId: string): Promise<UnifiedInboxConversation> {
    const conv = await this.getOrCreateConversation(workspaceId, conversationId, 'customer_user');
    conv.aiStatus = 'AI_HANDLING';

    const systemMsg: UnifiedInboxMessage = {
      id: `msg_sys_${Date.now()}`,
      sender: 'HUMAN_AGENT',
      content: '[System] Conversation returned to AI agent handling.',
      timestamp: new Date(),
    };
    conv.messages.push(systemMsg);

    await this.saveConversation(conv);
    return conv;
  }

  // BUTTON ACTION 4: Create Lead
  public async createLead(
    workspaceId: string,
    conversationId: string,
    leadStatus: LeadState = 'QUALIFIED'
  ): Promise<{ success: boolean; leadId: string; conv: UnifiedInboxConversation }> {
    const conv = await this.getOrCreateConversation(workspaceId, conversationId, 'customer_user');

    conv.customer.tags = Array.from(new Set([...conv.customer.tags, 'lead_created']));
    conv.customer.leadScore += 50;

    const leadId = `lead_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    try {
      if (LeadModel && LeadModel.db && LeadModel.db.readyState === 1) {
        await LeadModel.create({
          workspaceId,
          instagramUsername: conv.customer.username,
          status: leadStatus,
          keywordTriggered: conv.currentIntent,
          commentText: conv.lastMessage,
        });
      }
    } catch {}

    await this.saveConversation(conv);
    return { success: true, leadId, conv };
  }

  // BUTTON ACTION 5: Add Tag
  public async addTag(
    workspaceId: string,
    conversationId: string,
    tag: string
  ): Promise<UnifiedInboxConversation> {
    const conv = await this.getOrCreateConversation(workspaceId, conversationId, 'customer_user');
    conv.customer.tags = Array.from(new Set([...conv.customer.tags, tag]));

    await this.saveConversation(conv);
    return conv;
  }
}
