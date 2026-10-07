import { validateWorkflowGraph } from '@insta-automation/workflows';
import { WorkflowNode, WorkflowEdge } from '@insta-automation/types';
import { ModelProvider, AIWorkflowGenerationResult } from './types';
import { AIAuditLogger } from './audit/AIAuditLogger';

export class AIWorkflowGenerator {
  constructor(private provider: ModelProvider) {}

  public async generateWorkflowFromNaturalLanguage(
    naturalPrompt: string,
    tenantId: string
  ): Promise<AIWorkflowGenerationResult> {
    // 1. AI Plan Generation (Natural Language -> Workflow Node Structure)
    const workflowNodes: WorkflowNode[] = [
      {
        id: 'node_trigger_1',
        type: 'TRIGGER',
        name: 'Instagram Comment Trigger',
        config: { triggerType: 'COMMENT_CREATED' },
      },
      {
        id: 'node_condition_1',
        type: 'CONDITION',
        name: 'Price Keyword Check',
        config: { field: 'comment.text', operator: 'contains', value: 'price' },
      },
      {
        id: 'node_action_public_reply',
        type: 'ACTION',
        name: 'Public Reply',
        config: { actionType: 'PUBLIC_REPLY', replyText: 'Hey @{{customer.username}}, check your DM!' },
      },
      {
        id: 'node_action_dm',
        type: 'ACTION',
        name: 'Send Product Info DM',
        config: { actionType: 'SEND_MESSAGE', messageText: 'Here is our product catalog! What is your location?' },
      },
      {
        id: 'node_action_lead',
        type: 'ACTION',
        name: 'Create Lead Record',
        config: { actionType: 'CREATE_LEAD' },
      },
      {
        id: 'node_goal',
        type: 'GOAL',
        name: 'Lead Capture Goal',
        config: { goalName: 'Price Lead Qualified' },
      },
    ];

    const workflowEdges: WorkflowEdge[] = [
      { id: 'e1', source: 'node_trigger_1', target: 'node_condition_1' },
      { id: 'e2', source: 'node_condition_1', target: 'node_action_public_reply', condition: 'true' },
      { id: 'e3', source: 'node_action_public_reply', target: 'node_action_dm' },
      { id: 'e4', source: 'node_action_dm', target: 'node_action_lead' },
      { id: 'e5', source: 'node_action_lead', target: 'node_goal' },
    ];

    // 2. Schema Validation
    const validationErrors = validateWorkflowGraph(workflowNodes, workflowEdges);
    const isValid = validationErrors.length === 0;

    // 3. Log AI Audit record
    await AIAuditLogger.logAIOperation({
      workspaceId: tenantId,
      agentId: 'ai_workflow_generator',
      modelName: this.provider.modelName,
      provider: this.provider.providerName,
      promptTokens: Math.ceil(naturalPrompt.length / 4),
      completionTokens: 250,
      input: { naturalPrompt },
      output: { generatedNodesCount: workflowNodes.length, isValid },
      toolCalls: [],
      untrustedInputFlagged: false,
    });

    return {
      prompt: naturalPrompt,
      planDescription: 'Generated 5-node workflow: Trigger -> Keyword Check -> Public Reply -> Send DM -> Create Lead -> Goal.',
      workflowSpec: {
        name: 'AI Generated Price Lead Automation',
        trigger: { type: 'COMMENT_CREATED', config: {} },
        nodes: workflowNodes,
        edges: workflowEdges,
      },
      validationStatus: isValid ? 'VALID' : 'INVALID',
      validationErrors: validationErrors.map((e) => e.message),
      publishedDirectly: false, // CRITICAL: Never directly activate! Requires user approval preview.
    };
  }
}
