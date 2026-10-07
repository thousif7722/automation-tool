import { z } from 'zod';

export type ToolRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodObject<any>;
  outputSchema: z.ZodObject<any>;
  riskLevel: ToolRiskLevel;
  requiredPermissions: string[];
  handler: (input: any, context: ToolExecutionContext) => Promise<any>;
}

export interface ToolExecutionContext {
  tenantId: string;
  userId: string;
  userPermissions: string[];
  allowHighRisk?: boolean;
}

export interface ToolCallRequest {
  id: string;
  name: string;
  input: Record<string, any>;
}

export interface ToolExecutionResult {
  toolName: string;
  status: 'SUCCESS' | 'REJECTED_SCHEMA' | 'REJECTED_UNAUTHORIZED' | 'REJECTED_POLICY' | 'FAILED';
  output?: any;
  error?: string;
  riskLevel: ToolRiskLevel;
  executionDurationMs: number;
}

export interface ModelResponse {
  content: string;
  toolCalls: ToolCallRequest[];
  usage: {
    promptTokens: number;
    completionTokens: number;
  };
}

export interface ModelProvider {
  providerName: string;
  modelName: string;
  generateResponse(
    prompt: string,
    systemPrompt?: string,
    availableTools?: ToolDefinition[]
  ): Promise<ModelResponse>;
}

export interface ShortTermMemory {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
}

export interface BusinessMemory {
  brandName: string;
  toneOfVoice: string;
  products: Array<{ name: string; price: number; description: string; url?: string }>;
  faqs: Array<{ question: string; answer: string }>;
  policies: Array<{ category: string; rule: string }>;
}

export interface CustomerMemory {
  username: string;
  tags: string[];
  score: number;
  history: Array<{ action: string; timestamp: string }>;
  preferences?: Record<string, any>;
  leadInfo?: Record<string, any>;
}

export interface AIWorkflowGenerationResult {
  prompt: string;
  planDescription: string;
  workflowSpec: {
    name: string;
    trigger: { type: string; config: Record<string, any> };
    nodes: any[];
    edges: any[];
  };
  validationStatus: 'VALID' | 'INVALID';
  validationErrors: string[];
  publishedDirectly: boolean; // MUST ALWAYS BE FALSE
}
