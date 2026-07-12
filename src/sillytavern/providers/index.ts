import type { ApiProvider } from '../types';
import type { ProviderAdapter } from './types';

const adapters: Partial<Record<ApiProvider, ProviderAdapter>> = {};

export function registerAdapter(provider: ApiProvider, adapter: ProviderAdapter): void {
  adapters[provider] = adapter;
}

export function getAdapter(provider: ApiProvider): ProviderAdapter {
  const a = adapters[provider];
  if (!a) throw new Error(`No adapter registered for provider: ${provider}`);
  return a;
}

export async function fetchModels(
  baseUrl: string,
  apiKey: string,
  provider: ApiProvider,
): Promise<string[]> {
  return getAdapter(provider).listModels(baseUrl, apiKey);
}

import { OpenAICompatibleAdapter } from './openai';
registerAdapter('openai-compatible', new OpenAICompatibleAdapter());

import { GeminiAdapter } from './gemini';
registerAdapter('gemini', new GeminiAdapter());
