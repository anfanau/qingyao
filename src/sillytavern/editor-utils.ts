import type { LorebookEntry, Lorebook, PromptOrderItem } from './types';

export function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function createDefaultEntry(overrides?: Partial<LorebookEntry>): LorebookEntry {
  return {
    id: crypto.randomUUID(),
    keys: [],
    secondaryKeys: [],
    content: '',
    enabled: true,
    priority: 10,
    position: 'before_char',
    probability: 100,
    useProbability: false,
    constant: false,
    selectiveLogic: 'AND_ANY',
    caseSensitive: false,
    matchWholeWords: false,
    ...overrides,
  };
}

export function applyEntryDefaults(entry: Partial<LorebookEntry>): LorebookEntry {
  return createDefaultEntry(entry);
}

export function updateEntry(
  entries: LorebookEntry[],
  id: string,
  updates: Partial<LorebookEntry>
): LorebookEntry[] {
  return entries.map(e => (e.id === id ? { ...e, ...updates } : e));
}

export function removeEntry(entries: LorebookEntry[], id: string): LorebookEntry[] {
  return entries.filter(e => e.id !== id);
}

export function createDefaultLorebook(name?: string): Lorebook {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    name: name || 'New World Book',
    description: '',
    entries: [],
    scanDepth: 50,
    tokenBudget: 500,
    recursiveScanning: false,
    allowRecursion: false,
    maxRecursionDepth: 1,
    createdAt: now,
    updatedAt: now,
  };
}

export function movePromptItem(
  items: PromptOrderItem[],
  fromIndex: number,
  toIndex: number
): PromptOrderItem[] {
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(clampNumber(toIndex, 0, next.length), 0, item);
  return next.map((p, i) => ({ ...p, sortOrder: i }));
}
