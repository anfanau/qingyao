import type { GameVariables, ChatMessage } from './types';
import { DEFAULT_GAME_VARIABLES } from './types';

export function mergeVariables(
  current: GameVariables,
  updates: Record<string, string | number>,
): GameVariables {
  const next = { ...current };
  for (const [key, rawValue] of Object.entries(updates)) {
    if (key.includes('.')) {
      const [parent, child] = key.split('.', 2);
      if (parent in next && typeof next[parent] === 'object' && !Array.isArray(next[parent])) {
        (next as any)[parent] = { ...(next as any)[parent], [child]: rawValue };
      }
    } else if (key.startsWith('+') && Array.isArray((next as any)[key.slice(1)])) {
      const arrKey = key.slice(1);
      (next as any)[arrKey] = [...(next as any)[arrKey], rawValue as string];
    } else if (key.startsWith('-') && Array.isArray((next as any)[key.slice(1)])) {
      const arrKey = key.slice(1);
      (next as any)[arrKey] = (next as any)[arrKey].filter((i: string) => i !== String(rawValue));
    } else if (typeof rawValue === 'number' && key in next && typeof (next as any)[key] === 'number') {
      (next as any)[key] = (next as any)[key] + rawValue;
    } else {
      (next as any)[key] = rawValue;
    }
  }
  return next;
}

export function backtrackVariables(
  messages: ChatMessage[],
  targetIndex: number,
): GameVariables {
  let vars = { ...DEFAULT_GAME_VARIABLES };
  for (let i = 0; i <= targetIndex && i < messages.length; i++) {
    if (messages[i].parsedTags?.vars) {
      vars = mergeVariables(vars, messages[i].parsedTags!.vars);
    }
  }
  return vars;
}
