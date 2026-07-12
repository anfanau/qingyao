import type { Lorebook, LorebookEntry } from './types';

export interface LorebookMatch {
  lorebookId: string;
  lorebookName: string;
  entry: LorebookEntry;
  matchedKey: string;
  priority: number;
}

export function matchLorebooks(
  lorebooks: Lorebook[],
  text: string,
): LorebookMatch[] {
  const matches: LorebookMatch[] = [];
  const lowerText = text.toLowerCase();

  for (const book of lorebooks) {
    for (const entry of book.entries) {
      if (!entry.enabled) continue;

      const matches_ = matchEntry(entry, lowerText);
      if (matches_.length > 0) {
        for (const key of matches_) {
          matches.push({
            lorebookId: book.id,
            lorebookName: book.name,
            entry,
            matchedKey: key,
            priority: entry.priority,
          });
        }
      }
    }
  }

  matches.sort((a, b) => b.priority - a.priority);
  return matches;
}

function matchEntry(entry: LorebookEntry, lowerText: string): string[] {
  const matchedKeys: string[] = [];
  const primaryMatches = matchKeyList(entry.keys, lowerText, entry);
  const secondaryMatches = matchKeyList(entry.secondaryKeys, lowerText, entry);

  switch (entry.selectiveLogic) {
    case 'AND_ANY':
      if (primaryMatches.length > 0) matchedKeys.push(...primaryMatches);
      break;
    case 'AND_ALL':
      if (entry.keys.length > 0 && primaryMatches.length === entry.keys.length) {
        matchedKeys.push(...primaryMatches);
      }
      break;
    case 'NOT_ANY':
      if (primaryMatches.length === 0) matchedKeys.push('(no match)');
      break;
    case 'NOT_ALL':
      if (primaryMatches.length < entry.keys.length || entry.keys.length === 0) {
        matchedKeys.push('(not all)');
      }
      break;
  }

  if (entry.constant) {
    if (matchedKeys.length === 0) matchedKeys.push('(constant)');
  }

  if (entry.useProbability && entry.probability < 100) {
    if (Math.random() * 100 > entry.probability) return [];
  }

  return matchedKeys;
}

function matchKeyList(
  keys: string[],
  lowerText: string,
  entry: LorebookEntry,
): string[] {
  return keys.filter(key => {
    const k = entry.caseSensitive ? key : key.toLowerCase();
    if (entry.matchWholeWords) {
      const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, entry.caseSensitive ? 'g' : 'gi');
      return regex.test(lowerText);
    }
    return lowerText.includes(k);
  });
}

export function formatLorebookContext(
  matches: LorebookMatch[],
  maxTokens: number = 500,
): string {
  if (matches.length === 0) return '';
  const parts = matches.map(m => `[${m.lorebookName}] ${m.entry.content}`);
  let result = parts.join('\n\n');
  const estimatedTokens = Math.ceil(result.length / 4);
  if (estimatedTokens > maxTokens) {
    result = parts.slice(0, Math.floor(maxTokens / (estimatedTokens / parts.length))).join('\n\n');
  }
  return result;
}
