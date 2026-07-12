import { useRef, useCallback } from 'react';
import { createStreamParser, streamFetch, type StreamCallbacks, type ParsedTags } from '../sillytavern';

export function useStreamParser() {
  const abortRef = useRef<AbortController | null>(null);

  const stream = useCallback(async (
    url: string,
    body: any,
    apiKey: string,
    callbacks: StreamCallbacks,
  ): Promise<ParsedTags> => {
    abortRef.current = new AbortController();
    try {
      return await streamFetch(url, body, { Authorization: `Bearer ${apiKey}` }, callbacks, abortRef.current.signal);
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
