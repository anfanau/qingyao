import type { AppSettings, ApiConfig } from './types';

export type RouteTarget = 'primary' | 'secondary';

export interface RouteDecision {
  target: RouteTarget;
  config: ApiConfig;
}

export function routeApi(
  settings: AppSettings,
  content: { userInput: string; hasVarsTag?: boolean; isSummary?: boolean },
): RouteDecision {
  const useSecondary =
    settings.api.secondary.enabled &&
    (content.hasVarsTag || content.isSummary);

  if (useSecondary) {
    return {
      target: 'secondary',
      config: {
        baseUrl: settings.api.secondary.baseUrl,
        apiKey: settings.api.secondary.apiKey,
        model: settings.api.secondary.model,
      },
    };
  }

  return {
    target: 'primary',
    config: {
      baseUrl: settings.api.primary.baseUrl,
      apiKey: settings.api.primary.apiKey,
      model: settings.api.primary.model,
    },
  };
}

export function buildRequestBody(
  route: RouteDecision,
  messages: Array<{ role: string; content: string }>,
  overrides?: { temperature?: number; max_tokens?: number; top_p?: number },
) {
  return {
    model: route.config.model,
    messages,
    stream: true,
    temperature: overrides?.temperature ?? 0.7,
    max_tokens: overrides?.max_tokens ?? 1024,
    top_p: overrides?.top_p ?? 0.9,
  };
}
