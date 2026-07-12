import type { ChatMessage, ChatPreset, Lorebook, GameVariables } from './types';
import { USER_ROLE, ASSISTANT_ROLE, SYSTEM_ROLE } from './types';
import { matchLorebooks, formatLorebookContext } from './lorebook-engine';

export interface AssembleOpts {
  userInput: string;
  history: ChatMessage[];
  preset: ChatPreset;
  lorebooks: Lorebook[];
  userName: string;
  characterName: string;
  variables: GameVariables;
}

export interface AssembleResult {
  messages: Array<{ role: string; content: string }>;
  lorebookContext: string;
}

export function assemblePrompt(opts: AssembleOpts): AssembleResult {
  const { userInput, history, preset, lorebooks, userName, characterName, variables } = opts;
  const s = preset.settings;

  // Match lorebooks against recent context
  const recentText = history.slice(-20).map(m => m.content).join('\n') + '\n' + userInput;
  const matches = matchLorebooks(lorebooks, recentText);
  const lorebookContext = formatLorebookContext(matches);

  // Substitute variables in templates
  const sub = (text: string) => substituteVariables(text, variables);

  const orderedItems = [...s.prompt_order].sort((a, b) => a.sortOrder - b.sortOrder);
  const finalMessages: Array<{ role: string; content: string }> = [];

  for (const item of orderedItems) {
    if (!item.enabled) continue;
    let content = '';
    if (item.templateKey) {
      switch (item.templateKey) {
        case 'system_prompt': content = sub(s.system_prompt); break;
        case 'jailbreak_prompt': content = sub(s.jailbreak_prompt); break;
        case 'character_prompt':
          content = sub(s.character_prompt)
            .replace(/\{\{char\}\}/g, characterName)
            .replace(/\{\{user\}\}/g, userName);
          break;
        case 'user_prompt_template': break; // handled per user message
        case 'assistant_prompt_template': break; // handled per assistant message
      }
    } else if (item.isCustom && item.customContent) {
      content = sub(item.customContent);
    }
    if (content) {
      finalMessages.push({ role: SYSTEM_ROLE, content });
    }
  }

  // Inject lorebook context before character prompt
  if (lorebookContext) {
    const charIdx = finalMessages.findIndex(m => m.content.includes(characterName));
    const insertIdx = charIdx >= 0 ? charIdx : finalMessages.length;
    finalMessages.splice(insertIdx, 0, {
      role: SYSTEM_ROLE,
      content: `[World Info]\n${lorebookContext}`,
    });
  }

  // Append conversation history
  for (const msg of history) {
    const template = msg.role === USER_ROLE ? sub(s.user_prompt_template || '{{input}}') : sub(s.assistant_prompt_template || '{{response}}');
    const formattedContent = template
      .replace(/\{\{input\}\}/g, msg.content)
      .replace(/\{\{response\}\}/g, msg.content)
      .replace(/\{\{char\}\}/g, characterName)
      .replace(/\{\{user\}\}/g, userName);
    finalMessages.push({ role: msg.role, content: formattedContent });
  }

  // Append current user input
  const userTemplate = sub(s.user_prompt_template || '{{input}}');
  finalMessages.push({
    role: 'user',
    content: userTemplate.replace(/\{\{input\}\}/g, userInput).replace(/\{\{user\}\}/g, userName),
  });

  return { messages: finalMessages, lorebookContext };
}

function substituteVariables(text: string, vars: GameVariables): string {
  return text.replace(/\{\{(\w+(?:\.\w+)?)\}\}/g, (_match, key) => {
    if (key.includes('.')) {
      const [parent, child] = key.split('.');
      return String(((vars as any)[parent]?.[child]) ?? `{{${key}}}`);
    }
    return String((vars as any)[key] ?? `{{${key}}}`);
  });
}
