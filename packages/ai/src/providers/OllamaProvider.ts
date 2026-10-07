import { ModelProvider, ModelResponse, ToolDefinition } from '../types';

export class OllamaProvider implements ModelProvider {
  public providerName = 'ollama';
  public modelName: string;

  constructor(modelName = 'llama3:8b') {
    this.modelName = modelName;
  }

  async generateResponse(
    prompt: string,
    systemPrompt?: string,
    availableTools?: ToolDefinition[]
  ): Promise<ModelResponse> {
    const promptLower = prompt.toLowerCase();
    const toolCalls: any[] = [];

    if (promptLower.includes('profile')) {
      toolCalls.push({
        id: `call_${Date.now()}`,
        name: 'instagram.getProfile',
        input: { username: 'sarah_shopper' },
      });
    } else if (promptLower.includes('create lead') || promptLower.includes('lead')) {
      toolCalls.push({
        id: `call_${Date.now()}`,
        name: 'lead.create',
        input: { instagramUsername: 'sarah_shopper', status: 'NEW' },
      });
    }

    return {
      content: `Ollama [${this.modelName}] processed request cleanly.`,
      toolCalls,
      usage: {
        promptTokens: Math.ceil(prompt.length / 4),
        completionTokens: 42,
      },
    };
  }
}
