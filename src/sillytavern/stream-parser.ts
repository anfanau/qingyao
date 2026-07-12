import type { ParsedTags, StreamCallbacks } from './types';

const TAG_ORDER = ['thinking', 'think', 'maintext', 'sum', 'vars', 'option'] as const;

interface ParserState {
  currentTag: string | null;
  buffer: string;
  tagBuffers: Record<string, string>;
  vars: Record<string, string | number>;
  options: Array<{ name: string; description: string }>;
}

export function createStreamParser(callbacks: StreamCallbacks) {
  const state: ParserState = {
    currentTag: null,
    buffer: '',
    tagBuffers: {},
    vars: {},
    options: [],
  };

  for (const tag of TAG_ORDER) {
    state.tagBuffers[tag] = '';
  }

  function feed(chunk: string): void {
    state.buffer += chunk;
    process();
  }

  function process(): void {
    const tagRegex = /<\/?(thinking|think|maintext|sum|vars|option)(?:\s+name="(.*?)")?\s*>/gi;
    let match: RegExpExecArray | null;

    while ((match = tagRegex.exec(state.buffer)) !== null) {
      const [fullMatch, tagName, attrValue] = match;
      const isClosing = fullMatch.startsWith('</');
      const beforeTag = state.buffer.substring(0, match.index);

      // Flush text before tag to current tag buffer
      if (state.currentTag && beforeTag) {
        state.tagBuffers[state.currentTag] += beforeTag;
        emitChunk(state.currentTag, beforeTag);
      }

      if (!isClosing) {
        // Opening tag
        state.currentTag = tagName.toLowerCase();
        if (tagName === 'option' && attrValue) {
          state.tagBuffers['option'] = ''; // reset for new option
        }
      } else {
        // Closing tag
        if (state.currentTag === tagName.toLowerCase()) {
          finalizeTag(tagName.toLowerCase());
        }
        state.currentTag = null;
      }

      state.buffer = state.buffer.substring(match.index + fullMatch.length);
      tagRegex.lastIndex = 0;
    }
  }

  function emitChunk(tag: string, chunk: string): void {
    switch (tag) {
      case 'maintext': callbacks.onMainText?.(chunk, state.tagBuffers.maintext); break;
      case 'thinking': callbacks.onThinking?.(chunk, state.tagBuffers.thinking); break;
      case 'think': callbacks.onThink?.(chunk, state.tagBuffers.think); break;
      case 'sum': callbacks.onSum?.(chunk, state.tagBuffers.sum); break;
    }
  }

  function finalizeTag(tag: string): void {
    switch (tag) {
      case 'vars': {
        const varRegex = /<(\S+?):(.+?)>/g;
        let vm: RegExpExecArray | null;
        while ((vm = varRegex.exec(state.tagBuffers.vars)) !== null) {
          const key = vm[1].trim();
          const rawValue = vm[2].trim();
          const num = Number(rawValue);
          state.vars[key] = Number.isNaN(num) ? rawValue : num;
        }
        callbacks.onVars?.({ ...state.vars });
        break;
      }
      case 'option': {
        const optMatch = state.tagBuffers.option.match(/<option\s+name="(.*?)"\s*>/i);
        if (optMatch) {
          // Extract description from the text after the tag
          const descStart = state.tagBuffers.option.indexOf('>') + 1;
          const description = state.tagBuffers.option.substring(descStart).trim();
          const name = optMatch[1];
          state.options.push({ name, description: description || name });
          callbacks.onOptions?.([...state.options]);
        }
        break;
      }
    }
  }

  function flush(): ParsedTags {
    process();
    // Flush remaining buffer
    if (state.currentTag && state.buffer) {
      state.tagBuffers[state.currentTag] += state.buffer;
      emitChunk(state.currentTag, state.buffer);
    }
    const parsed: ParsedTags = {
      maintext: state.tagBuffers.maintext.trim(),
      thinking: state.tagBuffers.thinking.trim(),
      think: state.tagBuffers.think.trim(),
      sum: state.tagBuffers.sum.trim(),
      vars: { ...state.vars },
      options: [...state.options],
    };
    callbacks.onDone?.(parsed);
    return parsed;
  }

  function reset(): void {
    state.buffer = '';
    state.currentTag = null;
    for (const tag of TAG_ORDER) state.tagBuffers[tag] = '';
    state.vars = {};
    state.options = [];
  }

  return { feed, flush, reset };
}

export async function streamFetch(
  url: string,
  body: any,
  headers: Record<string, string>,
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
): Promise<ParsedTags> {
  const parser = createStreamParser(callbacks);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ ...body, stream: true }),
    signal,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API error ${response.status}: ${errText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;
      try {
        const json = JSON.parse(data);
        const content = json.choices?.[0]?.delta?.content;
        if (content) parser.feed(content);
      } catch { /* skip unparseable chunks */ }
    }
  }

  return parser.flush();
}
