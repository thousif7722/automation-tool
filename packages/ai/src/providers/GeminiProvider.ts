import { ModelProvider, ModelResponse, ToolDefinition } from '../types';

export class GeminiProvider implements ModelProvider {
  public providerName = 'gemini';
  public modelName: string;

  constructor(modelName = 'gemini-1.5-pro') {
    this.modelName = modelName;
  }

  async generateResponse(
    prompt: string,
    systemPrompt?: string,
    availableTools?: ToolDefinition[]
  ): Promise<ModelResponse> {
    const promptLower = prompt.toLowerCase();
    const toolCalls: any[] = [];

    if (promptLower.includes('reply') || promptLower.includes('comment')) {
      toolCalls.push({
        id: `call_${Date.now()}`,
        name: 'instagram.replyComment',
        input: { commentId: 'c_123', replyText: 'Thanks @sarah_shopper!' },
      });
    }

    return {
      content: `Google Gemini [${this.modelName}] response.`,
      toolCalls,
      usage: {
        promptTokens: Math.ceil(prompt.length / 4),
        completionTokens: 50,
      },
    };
  }
}
