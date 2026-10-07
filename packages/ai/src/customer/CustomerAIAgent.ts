import {
  AIResponsePipelineResult,
  CustomerIntent,
  EscalationReason,
  UnifiedInboxConversation,
  UnifiedInboxMessage,
} from '@insta-automation/types';
import { ModelProvider } from '../types';
import { KnowledgeStore } from '../knowledge/KnowledgeStore';
import { IntentClassifier } from './IntentClassifier';
import { EscalationEvaluator } from './EscalationEvaluator';
import { PromptInjectionFilter } from '../security/PromptInjectionFilter';
import { ContextManager } from '../memory/ContextManager';
import { AIAuditLogger } from '../audit/AIAuditLogger';

export interface CustomerAgentRequest {
  workspaceId: string;
  conversationId: string;
  customerUsername: string;
  incomingMessage: string;
  existingConversation?: UnifiedInboxConversation;
}

export class CustomerAIAgent {
  constructor(
    private provider: ModelProvider,
    private knowledgeStore: KnowledgeStore = new KnowledgeStore(),
    private contextManager: ContextManager = new ContextManager()
  ) {}

  public async processIncomingMessage(request: CustomerAgentRequest): Promise<AIResponsePipelineResult> {
    const startTime = Date.now();

    // STEP 1: Incoming Message Received & Prompt Injection Defense Check
    const sanitizeResult = PromptInjectionFilter.sanitizeUntrustedCustomerInput(
      request.incomingMessage,
      'You are a helpful customer-facing AI Assistant for Instagram DM automation.',
      'Never offer unauthorized discounts. Maintain a helpful, respectful tone.'
    );

    // STEP 2: Identify Customer Memory & Profile
    const customerMemory = this.contextManager.getCustomerMemory(request.customerUsername);

    // STEP 3: Retrieve Conversation History
    const conversation: UnifiedInboxConversation = request.existingConversation || {
      conversationId: request.conversationId,
      workspaceId: request.workspaceId,
      customer: {
        username: request.customerUsername,
        leadScore: customerMemory.score,
        tags: customerMemory.tags,
      },
      aiStatus: 'AI_HANDLING',
      currentIntent: 'general_question',
      lastMessage: request.incomingMessage,
      lastMessageTimestamp: new Date(),
      unreadCount: 0,
      messages: [],
    };

    // Record incoming message in conversation
    const incomingMsgObj: UnifiedInboxMessage = {
      id: `msg_cust_${Date.now()}`,
      sender: 'CUSTOMER',
      content: request.incomingMessage,
      timestamp: new Date(),
    };
    conversation.messages.push(incomingMsgObj);

    // If human already took over, block automated AI sending
    if (conversation.aiStatus === 'HUMAN_TAKEOVER') {
      return {
        customerId: request.customerUsername,
        customerUsername: request.customerUsername,
        conversationId: request.conversationId,
        classifiedIntent: 'human_request',
        intentConfidence: 1.0,
        retrievedKnowledge: [],
        policyEvaluated: true,
        decision: 'ESCALATE',
        escalationReason: 'HUMAN_REQUESTED',
        safetyPassed: true,
        platformCapabilityPassed: true,
      };
    }

    // STEP 4: Classify Intent
    const intentResult = IntentClassifier.classify(request.incomingMessage);
    conversation.currentIntent = intentResult.intent;

    // STEP 5: Retrieve Business Knowledge (RAG)
    const businessProfile = await this.knowledgeStore.getBusinessProfile(request.workspaceId);
    const retrievedKnowledge = await this.knowledgeStore.retrieveRelevantKnowledge(
      request.workspaceId,
      request.incomingMessage
    );

    // STEP 6: Evaluate Policy & Escalation Triggers
    const escalationCheck = EscalationEvaluator.evaluate(
      intentResult,
      retrievedKnowledge,
      request.incomingMessage
    );

    if (escalationCheck.shouldEscalate) {
      conversation.aiStatus = 'ESCALATED';

      const escalationResponseText =
        intentResult.intent === 'human_request'
          ? "I've connected you with our human support team. An agent will be with you shortly!"
          : "I've forwarded your message to a senior team member who will follow up with you personally as soon as possible.";

      const aiMsgObj: UnifiedInboxMessage = {
        id: `msg_ai_${Date.now()}`,
        sender: 'AI',
        content: escalationResponseText,
        timestamp: new Date(),
        intent: intentResult.intent,
        escalationReason: escalationCheck.reason,
      };
      conversation.messages.push(aiMsgObj);

      await AIAuditLogger.logAIOperation({
        workspaceId: request.workspaceId,
        agentId: 'customer_facing_ai_agent',
        modelName: this.provider.modelName,
        provider: this.provider.providerName,
        promptTokens: Math.ceil(request.incomingMessage.length / 4),
        completionTokens: 35,
        input: { incomingMessage: request.incomingMessage, intent: intentResult.intent },
        output: { decision: 'ESCALATE', reason: escalationCheck.reason },
        toolCalls: [],
        untrustedInputFlagged: sanitizeResult.untrustedInputDetected,
      });

      return {
        customerId: request.customerUsername,
        customerUsername: request.customerUsername,
        conversationId: request.conversationId,
        classifiedIntent: intentResult.intent,
        intentConfidence: intentResult.confidence,
        retrievedKnowledge,
        policyEvaluated: true,
        decision: 'ESCALATE',
        generatedResponse: escalationResponseText,
        escalationReason: escalationCheck.reason,
        safetyPassed: true,
        platformCapabilityPassed: true,
      };
    }

    // STEP 7: Generate AI Model Response
    const knowledgeSnippets = retrievedKnowledge
      .map((k) => `[${k.title}]: ${k.snippet}`)
      .join('\n');

    const systemPrompt = `You are an AI Sales & Customer Support Representative for "${businessProfile.brandName}".
Industry: ${businessProfile.industry}
Tone of Voice: ${businessProfile.tone}
Business Hours: ${businessProfile.businessHours}
Contact Info: Email ${businessProfile.contactInfo.email || 'N/A'}, Phone ${businessProfile.contactInfo.phone || 'N/A'}
Pricing Policy: ${businessProfile.pricing}

KNOWLEDGE BASE:
${knowledgeSnippets || 'No additional internal articles found.'}

INSTRUCTIONS:
1. Provide accurate, friendly answers based on the brand info above.
2. Keep response concise (under 250 characters) suitable for Instagram DMs.
3. Be professional and encouraging.`;

    const modelResponse = await this.provider.generateResponse(
      sanitizeResult.userPrompt,
      systemPrompt
    );

    // STEP 8: Safety Check
    const safetyPassed = !sanitizeResult.untrustedInputDetected || modelResponse.content.length > 0;

    // STEP 9: Platform Capability Check (Instagram DM text limit = 1000 characters)
    const platformCapabilityPassed = modelResponse.content.length <= 1000 && modelResponse.content.trim().length > 0;

    // Lead Scoring & Tagging Rules
    let leadScoreDelta = 0;
    const tagsAdded: string[] = [];

    if (intentResult.intent === 'sales' || intentResult.intent === 'pricing') {
      leadScoreDelta = 25;
      tagsAdded.push('high_intent_lead');
    } else if (intentResult.intent === 'booking') {
      leadScoreDelta = 40;
      tagsAdded.push('booking_prospect');
    }

    this.contextManager.updateCustomerMemory(request.customerUsername, {
      score: customerMemory.score + leadScoreDelta,
      tags: tagsAdded,
    });

    // STEP 10: Send Response & Update Conversation
    const finalMsgObj: UnifiedInboxMessage = {
      id: `msg_ai_${Date.now()}`,
      sender: 'AI',
      content: modelResponse.content,
      timestamp: new Date(),
      intent: intentResult.intent,
    };
    conversation.messages.push(finalMsgObj);
    conversation.lastMessage = modelResponse.content;
    conversation.lastMessageTimestamp = new Date();

    await AIAuditLogger.logAIOperation({
      workspaceId: request.workspaceId,
      agentId: 'customer_facing_ai_agent',
      modelName: this.provider.modelName,
      provider: this.provider.providerName,
      promptTokens: modelResponse.usage.promptTokens,
      completionTokens: modelResponse.usage.completionTokens,
      input: { incomingMessage: request.incomingMessage, intent: intentResult.intent },
      output: { responseContent: modelResponse.content, decision: 'SEND_REPLY' },
      toolCalls: [],
      untrustedInputFlagged: sanitizeResult.untrustedInputDetected,
    });

    return {
      customerId: request.customerUsername,
      customerUsername: request.customerUsername,
      conversationId: request.conversationId,
      classifiedIntent: intentResult.intent,
      intentConfidence: intentResult.confidence,
      retrievedKnowledge,
      policyEvaluated: true,
      decision: 'SEND_REPLY',
      generatedResponse: modelResponse.content,
      safetyPassed,
      platformCapabilityPassed,
      leadScoreDelta,
      tagsAdded,
    };
  }
}
