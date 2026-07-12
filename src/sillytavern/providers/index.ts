import type { ApiProvider } from '../types';
import type { ProviderAdapter } from './types';
import { OpenAICompatibleAdapter } from './openai';
import { GeminiAdapter } from './gemini';

const adapters: Record<ApiProvider, ProviderAdapter> = {
  'openai-compatible': new OpenAICompatibleAdapter(),
  gemini: new GeminiAdapter(),
};

export function getAdapter(provider: ApiProvider): ProviderAdapter {
  return adapters[provider];
}

export async function fetchModels(
  baseUrl: string,
  apiKey: string,
  provider: ApiProvider,
): Promise<string[]> {
  return getAdapter(provider).listModels(baseUrl, apiKey);
}
