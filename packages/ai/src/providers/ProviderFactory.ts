import { ModelProvider } from '../types';
import { OllamaProvider } from './OllamaProvider';
import { BedrockProvider } from './BedrockProvider';
import { GeminiProvider } from './GeminiProvider';

export type SupportedProvider = 'ollama' | 'bedrock' | 'gemini';

export class ProviderFactory {
  static createProvider(type: SupportedProvider = 'ollama', modelName?: string): ModelProvider {
    switch (type) {
      case 'bedrock':
        return new BedrockProvider(modelName || 'amazon.nova-lite-v1:0');
      case 'gemini':
        return new GeminiProvider(modelName || 'gemini-1.5-pro');
      case 'ollama':
      default:
        return new OllamaProvider(modelName || 'llama3:8b');
    }
  }
}
