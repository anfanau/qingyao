import { useRef, useCallback } from 'react';
import { createStreamParser, streamFetch, type StreamCallbacks, type ParsedTags } from '../sillytavern';
import type { ProviderAdapter } from '../sillytavern/providers/types';

export function useStreamParser() {
  const abortRef = useRef<AbortController | null>(null);

  const stream = useCallback(async (
    url: string,
    body: any,
    apiKey: string,
    callbacks: StreamCallbacks,
    adapter: ProviderAdapter,
  ): Promise<ParsedTags> => {
    abortRef.current = new AbortController();
    try {
      const headers = adapter.buildHeaders(apiKey);
      return await streamFetch(url, body, headers, callbacks, adapter, abortRef.current.signal);
    } finally {
      abortRef.current = null;
    }
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const createParser = useCallback((callbacks: StreamCallbacks) => {
    return createStreamParser(callbacks);
  }, []);

  return { stream, abort, createParser };
}
