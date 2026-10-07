import { ModelProvider, ToolExecutionContext } from '../types';
import { ToolRegistry } from '../tools/ToolRegistry';
import { ToolExecutor } from '../tools/ToolExecutor';
import { ContextManager } from '../memory/ContextManager';
import { PromptInjectionFilter } from '../security/PromptInjectionFilter';
import { AIAuditLogger } from '../audit/AIAuditLogger';

export interface AgentExecutionRequest {
  customerUsername: string;
  customerMessage: string;
  developerInstructions?: string;
  tenantPolicy?: string;
  context: ToolExecutionContext;
}

export interface AgentExecutionResult {
  responseContent: string;
  executedTools: Array<{
    toolName: string;
    status: string;
    output?: any;
    error?: string;
    riskLevel: string;
  }>;
  untrustedInputFlagged: boolean;
  promptTokens: number;
  completionTokens: number;
}

export class AgentOrchestrator {
  private toolExecutor: ToolExecutor;

  constructor(
    private provider: ModelProvider,
    private registry: ToolRegistry = new ToolRegistry(),
    private contextManager: ContextManager = new ContextManager()
  ) {
    this.toolExecutor = new ToolExecutor(this.registry);
  }

  public async processCustomerMessage(
    request: AgentExecutionRequest
  ): Promise<AgentExecutionResult> {
    const devInst = request.developerInstructions || 'Help qualified leads and provide product pricing info.';
    const policy = request.tenantPolicy || 'Never commit to discounts greater than 10%.';

    // 1. Prompt Injection Defense
    const sanitizeResult = PromptInjectionFilter.sanitizeUntrustedCustomerInput(
      request.customerMessage,
      devInst,
      policy
    );

    // 2. Fetch context memory
    const customerMemory = this.contextManager.getCustomerMemory(request.customerUsername);
    const businessMemory = this.contextManager.getBusinessMemory();

    const fullSystemPrompt = `${sanitizeResult.systemPrompt}\nBrand Info: ${businessMemory.brandName}\nCustomer Tags: ${customerMemory.tags.join(
      ', '
    )}`;

    // 3. Model Generation Call
    const modelResponse = await this.provider.generateResponse(
      sanitizeResult.userPrompt,
      fullSystemPrompt,
      this.registry.getAllTools()
    );

    // 4. Tool Execution Pipeline
    const executedTools: any[] = [];
    for (const toolCall of modelResponse.toolCalls) {
      const execRes = await this.toolExecutor.executeToolCall(toolCall, request.context);
      executedTools.push({
        toolName: execRes.toolName,
        status: execRes.status,
        output: execRes.output,
        error: execRes.error,
        riskLevel: execRes.riskLevel,
      });
    }

    // 5. Audit Logging
    await AIAuditLogger.logAIOperation({
      workspaceId: request.context.tenantId,
      agentId: 'ai_agent_orchestrator',
      modelName: this.provider.modelName,
      provider: this.provider.providerName,
      promptTokens: modelResponse.usage.promptTokens,
      completionTokens: modelResponse.usage.completionTokens,
      input: { customerMessage: request.customerMessage, username: request.customerUsername },
      output: { responseContent: modelResponse.content },
      toolCalls: executedTools.map((t) => ({
        toolName: t.toolName,
        input: {},
        riskLevel: t.riskLevel,
        status: t.status,
        executionDurationMs: 15,
        error: t.error,
      })),
      untrustedInputFlagged: sanitizeResult.untrustedInputDetected,
    });

    return {
      responseContent: modelResponse.content,
      executedTools,
      untrustedInputFlagged: sanitizeResult.untrustedInputDetected,
      promptTokens: modelResponse.usage.promptTokens,
      completionTokens: modelResponse.usage.completionTokens,
    };
  }
}
