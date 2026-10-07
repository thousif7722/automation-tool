import { ToolRegistry } from './ToolRegistry';
import { PolicyEngine } from '../security/PolicyEngine';
import { ToolCallRequest, ToolExecutionContext, ToolExecutionResult } from '../types';

export class ToolExecutor {
  constructor(private registry: ToolRegistry) {}

  public async executeToolCall(
    callRequest: ToolCallRequest,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const startTime = Date.now();

    // 1. Tool Lookup
    const tool = this.registry.getTool(callRequest.name);
    if (!tool) {
      return {
        toolName: callRequest.name,
        status: 'FAILED',
        error: `Tool '${callRequest.name}' is not registered in ToolRegistry.`,
        riskLevel: 'LOW',
        executionDurationMs: Date.now() - startTime,
      };
    }

    // 2. Schema Validation (Input)
    const schemaValidation = tool.inputSchema.safeParse(callRequest.input);
    if (!schemaValidation.success) {
      return {
        toolName: tool.name,
        status: 'REJECTED_SCHEMA',
        error: `Schema validation failed: ${schemaValidation.error.message}`,
        riskLevel: tool.riskLevel,
        executionDurationMs: Date.now() - startTime,
      };
    }

    const validatedInput = schemaValidation.data;

    // 3. Authorization & Tenant Check
    if (!context.tenantId) {
      return {
        toolName: tool.name,
        status: 'REJECTED_UNAUTHORIZED',
        error: 'Missing tenantId context for tool execution.',
        riskLevel: tool.riskLevel,
        executionDurationMs: Date.now() - startTime,
      };
    }

    // 4. Policy Check (Risk & Permissions)
    const policyResult = PolicyEngine.evaluatePolicy(tool, validatedInput, context);
    if (!policyResult.allowed) {
      return {
        toolName: tool.name,
        status: 'REJECTED_POLICY',
        error: policyResult.reason,
        riskLevel: tool.riskLevel,
        executionDurationMs: Date.now() - startTime,
      };
    }

    // 5. Execute Handler cleanly
    try {
      const result = await tool.handler(validatedInput, context);
      const outputValidation = tool.outputSchema.safeParse(result);

      return {
        toolName: tool.name,
        status: 'SUCCESS',
        output: outputValidation.success ? outputValidation.data : result,
        riskLevel: tool.riskLevel,
        executionDurationMs: Date.now() - startTime,
      };
    } catch (err: any) {
      return {
        toolName: tool.name,
        status: 'FAILED',
        error: err.message || 'Tool execution handler threw error.',
        riskLevel: tool.riskLevel,
        executionDurationMs: Date.now() - startTime,
      };
    }
  }
}
