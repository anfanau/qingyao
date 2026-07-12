import type { AppSettings, ApiConfig } from './types';
import type { ProviderAdapter } from './providers/types';
import { getAdapter } from './providers/index';

export type RouteTarget = 'primary' | 'secondary';

export interface RouteDecision {
  target: RouteTarget;
  config: ApiConfig;
  adapter: ProviderAdapter;
}

export function routeApi(
  settings: AppSettings,
  content: { userInput: string; hasVarsTag?: boolean; isSummary?: boolean },
): RouteDecision {
  const useSecondary =
    settings.api.secondary.enabled &&
    (content.hasVarsTag || content.isSummary);

  if (useSecondary) {
    const config: ApiConfig = {
      baseUrl: settings.api.secondary.baseUrl,
      apiKey: settings.api.secondary.apiKey,
      model: settings.api.secondary.model,
      provider: settings.api.secondary.provider,
    };
    return { target: 'secondary', config, adapter: getAdapter(config.provider) };
  }

  const config: ApiConfig = {
    baseUrl: settings.api.primary.baseUrl,
    apiKey: settings.api.primary.apiKey,
    model: settings.api.primary.model,
    provider: settings.api.primary.provider,
  };
  return { target: 'primary', config, adapter: getAdapter(config.provider) };
}

export function buildRequestBody(
  route: RouteDecision,
  messages: Array<{ role: string; content: string }>,
  overrides?: { temperature?: number; max_tokens?: number; top_p?: number },
) {
  return route.adapter.buildRequestBody({
    model: route.config.model,
    messages,
    overrides,
  });
}
