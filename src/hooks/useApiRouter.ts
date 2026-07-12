import { useCallback } from 'react';
import type { AppSettings } from '../sillytavern';
import { routeApi, buildRequestBody, type RouteDecision } from '../sillytavern';

export function useApiRouter(settings: AppSettings | null) {
  const route = useCallback((userInput: string, hasVarsTag?: boolean, isSummary?: boolean): RouteDecision | null => {
    if (!settings) return null;
    return routeApi(settings, { userInput, hasVarsTag, isSummary });
  }, [settings]);

  const buildBody = useCallback((decision: RouteDecision, messages: Array<{ role: string; content: string }>, overrides?: any) => {
    return buildRequestBody(decision, messages, overrides);
  }, []);

  return { route, buildBody };
}
