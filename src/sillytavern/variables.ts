import type { GameVariables, ChatMessage } from './types';
import { DEFAULT_GAME_VARIABLES } from './types';
import { mergeVariables } from './vars-merger';

export function extractVariables(rawText: string): {
  cleanedText: string;
  updates: Record<string, string | number>;
} {
  const updates: Record<string, string | number> = {};
  const varsRegex = /<vars>([\s\S]*?)<\/vars>/gi;

  let cleanedText = rawText.replace(varsRegex, (_match, inner) => {
    const lineRegex = /<(\S+?):(.+?)>/g;
    let lineMatch: RegExpExecArray | null;
    while ((lineMatch = lineRegex.exec(inner)) !== null) {
      const key = lineMatch[1].trim();
      const rawValue = lineMatch[2].trim();
      const num = Number(rawValue);
      updates[key] = Number.isNaN(num) ? rawValue : num;
    }
    return '';
  });

  cleanedText = cleanedText.replace(/\n{3,}/g, '\n\n').trim();
  return { cleanedText, updates };
}

export function snapshotVariables(vars: GameVariables): GameVariables {
  return JSON.parse(JSON.stringify(vars));
}

export function createVariableSnapshot(messages: ChatMessage[]): GameVariables {
  let vars = { ...DEFAULT_GAME_VARIABLES };
  for (const msg of messages) {
    if (msg.parsedTags?.vars) {
      vars = mergeVariables(vars, msg.parsedTags.vars);
    }
  }
  return vars;
}
