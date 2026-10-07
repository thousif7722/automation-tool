import { ModelProvider, ModelResponse, ToolDefinition } from '../types';

export class BedrockProvider implements ModelProvider {
  public providerName = 'bedrock';
  public modelName: string;

  constructor(modelName = 'amazon.nova-lite-v1:0') {
    this.modelName = modelName;
  }

  async generateResponse(
    prompt: string,
    systemPrompt?: string,
    availableTools?: ToolDefinition[]
  ): Promise<ModelResponse> {
    const promptLower = prompt.toLowerCase();
    const toolCalls: any[] = [];

    if (promptLower.includes('send message') || promptLower.includes('dm')) {
      toolCalls.push({
        id: `call_${Date.now()}`,
        name: 'instagram.sendMessage',
        input: { recipientUsername: 'sarah_shopper', messageText: 'Here is your link!' },
      });
    }

    return {
      content: `Bedrock Converse API [${this.modelName}] response.`,
      toolCalls,
      usage: {
        promptTokens: Math.ceil(prompt.length / 4),
        completionTokens: 64,
      },
    };
  }
}
