# AI Dungeon RPG — SillyTavern-Powered Game Platform

**Date:** 2026-07-12
**Stack:** Vite + React + TypeScript + Tailwind CSS + Dexie (IndexedDB)
**Theme:** Dark Fantasy

---

## 1. Overview

A single-page React app combining AI Dungeon-style RPG gameplay with SillyTavern's ecosystem (lorebooks, presets, variables, streaming). The LLM acts as Game Master — narrating a story, tracking game state, and offering choices through structured XML-like tags parsed in real-time from SSE streams.

Two UI modes share one state layer: **ChatListView** (session manager) and **GameView** (immersive play). The SillyTavern core handles AI interaction, lorebook matching, variable tracking, and IndexedDB persistence.

## 2. Architecture

```
App (Mode Router)
├── ChatListView (session manager)
│   └── session CRUD, import/export, settings
├── GameView (play mode)
│   ├── MainTextPane (streaming narrative)
│   ├── OptionList (parsed choices + free input)
│   ├── ThinkingFold (AI reasoning, collapsible)
│   ├── VariablePanel (HP/MP/Inventory/Quests/Flags)
│   └── HistoryDrawer (timeline + rewind/branch)
├── Shared Hooks
│   ├── useSillytavern (main state)
│   ├── useStreamParser (SSE tag extraction)
│   └── useApiRouter (dual-API dispatch)
└── SillyTavern Core (framework-agnostic)
    ├── types.ts, database.ts (Dexie/IndexedDB)
    ├── lorebook-engine.ts (keyword matching)
    ├── prompt-assembler.ts (context injection)
    ├── stream-parser.ts (SSE + tag extraction)
    ├── api-router.ts (primary/secondary routing)
    ├── variables.ts (extraction/snapshot)
    ├── vars-merger.ts (floor backtracking)
    ├── importer.ts (ST preset import/export)
    └── editor-utils.ts (pure helpers)
```

## 3. Project Structure

```
D:\game/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css                    # Tailwind + fantasy theme variables
│   ├── sillytavern/
│   │   ├── types.ts
│   │   ├── database.ts
│   │   ├── lorebook-engine.ts
│   │   ├── prompt-assembler.ts
│   │   ├── stream-parser.ts
│   │   ├── api-router.ts
│   │   ├── variables.ts
│   │   ├── vars-merger.ts
│   │   ├── importer.ts
│   │   ├── editor-utils.ts
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useSillytavern.ts
│   │   ├── useStreamParser.ts
│   │   └── useApiRouter.ts
│   └── components/
│       └── SillyTavern/
│           ├── ChatListView.tsx
│           ├── GameView.tsx
│           ├── MainTextPane.tsx
│           ├── OptionList.tsx
│           ├── ThinkingFold.tsx
│           ├── HistoryDrawer.tsx
│           ├── VariablePanel.tsx
│           ├── Chat.tsx
│           ├── ChatModal.tsx
│           ├── SettingsModal.tsx
│           ├── LorebookModal.tsx
│           ├── LorebookEditorModal.tsx
│           ├── EntryForm.tsx
│           ├── PresetModal.tsx
│           └── PromptOrderEditor.tsx
```

## 4. Data Model

### GameVariables (per-session floor state)
```typescript
interface GameVariables {
  hp: number; mp: number;
  maxHp: number; maxMp: number;
  level: number; exp: number; gold: number;
  inventory: string[];
  location: string;
  quests: Record<string, 'active' | 'done'>;
  flags: Record<string, boolean>;
  [key: string]: any;
}
```

### ChatSession (one playthrough)
```typescript
interface ChatSession {
  id: string; name: string;
  characterName: string; userName: string;
  messages: ChatMessage[];
  variables: GameVariables;
  presetId: string; lorebookIds: string[];
  createdAt: number; updatedAt: number;
}
```

### ChatMessage (with variable snapshot)
```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  rawContent?: string;
  parsedTags?: ParsedTags;
  timestamp: number;
  variables: GameVariables;  // snapshot for backtracking
}
```

## 5. Streaming Tag Protocol

The AI GM outputs structured content via 6 custom tags:

| Tag | Purpose | UI Target |
|---|---|---|
| `<thinking>` | Visible AI reasoning | ThinkingFold (open by default) |
| `<think>` | Hidden AI reasoning | ThinkingFold (debug toggle) |
| `<maintext>` | Narrative body | MainTextPane (streaming) |
| `<sum>` | Turn summary | Subtle recap bar between turns |
| `<vars>` | Variable deltas | vars-merger → VariablePanel |
| `<option>` | Player choices | OptionList (clickable buttons) |

### Example AI Output
```
<thinking>Player is wounded, goblin is fleeing.</thinking>
<maintext>
The goblin scurries into the dark tunnel. Your arm throbs.
</maintext>
<sum>Goblin fled. Player -8 HP. Cave entrance.</sum>
<vars>
<hp:-8>
<location:cave_entrance_deep>
<flags.goblin_encounter:true>
</vars>
<option name="Chase the goblin">You plunge into the dark tunnel.</option>
<option name="Bandage wound">You tend to your bleeding arm.</option>
```

`stream-parser.ts` incrementally parses this as SSE chunks arrive, dispatching each tag's content to the appropriate UI component in real-time via callbacks.

## 6. Dual API Routing

`api-router.ts` selects the endpoint based on content heuristics:

- **Primary API** (full model): narrative generation, all standard turns
- **Secondary API** (cheaper/faster model): variable extraction, text summarization, lorebook matching re-ranks

Decision logic:
```
IF message contains <vars> tag content → secondary API
IF request is summary/compression → secondary API
ELSE → primary API
```

Both API configs (baseUrl, apiKey, model) stored in AppSettings. `useApiRouter.ts` hook provides `routeRequest()` that returns the correct fetch config.

## 7. Floor Variable Backtracking

`vars-merger.ts` implements snapshot-based rollback:

1. Each `ChatMessage` stores a full `variables` snapshot taken at message time
2. When player rewinds to message N:
   - Load `messages[N].variables` (the floor snapshot)
   - Walk forward N+1 → end, re-applying `<vars>` deltas from each message's `parsedTags`
   - Result: corrected state as if only messages 0..N existed
3. New messages from this branch use the corrected floor state
4. Branching creates a new ChatSession sharing history up to the branch point

## 8. World Book Management

- `lorebook-engine.ts`: keyword matching with primary/secondary key selective logic, constant-time activation checks, content injection ranking
- `LorebookModal.tsx`: list all world books, activate/deactivate, import/export individual books
- `LorebookEditorModal.tsx`: for a single book — entry list + add/edit/delete entries
- `EntryForm.tsx`: field editor for LorebookEntry (keys, content, priority, position, probability)
- Each ChatSession tracks its own `lorebookIds[]` for per-save activation preferences

## 9. SillyTavern Preset Import/Export

- `importer.ts`: handles `.json` files in SillyTavern format
  - Character cards (name, description, personality, first message, avatar)
  - World book bundles (multiple lorebooks + entries)
  - Chat presets (sampling params, prompt templates, prompt_order)
- Import flow: file picker → validate JSON structure → confirm dialog → write to IndexedDB
- Export flow: select sessions/books/presets → bundle to `.json` → download

## 10. UI Components Detail

### ChatListView
- Sidebar: session list with name, character, last-updated timestamp
- Quick actions per session: load, rename, delete, export
- Top bar: "New Game", "Import", gear icon for Settings
- Active lorebook/preset badges per session

### GameView
- Full-viewport dark fantasy layout
- MainTextPane: center stage, typewriter-animated streaming text
- OptionList: styled as glowing rune-stones, plus free-text input
- ThinkingFold: collapsible, shows `<thinking>` by default
- VariablePanel: slide-out drawer with HP/MP bars, inventory grid, quests, flags
- HistoryDrawer: timeline with per-message variable snapshot viewer, rewind/branch buttons

### SettingsModal
- Tab 1: Character & User names
- Tab 2: Primary API config (baseUrl, apiKey, model)
- Tab 3: Secondary API config (baseUrl, apiKey, model)
- Tab 4: UI preferences (mode, streaming toggle, typewriter speed)
- Tab 5: Default game variables (starting HP/MP, etc.)

### PresetModal
- Tab 1: Sampling parameters (temperature, top_p, max_tokens, frequency/presence penalty)
- Tab 2: Prompt text blocks (system prompt, jailbreak, character definition, etc.)
- Tab 3: Custom prompts (user-defined injections)
- Tab 4: prompt_order drag-sort + enable/disable

## 11. Styling — Dark Fantasy Theme

**Palette:**
- Background: deep obsidian `#0d0d0d` → dark parchment `#1a1410`
- Surface: aged leather `#2d2418`, scroll `#f4e4c1` (text backgrounds)
- Accent: arcane gold `#c9a84c`, ember `#d4652a`
- Text: parchment `#e8dcc8`, faded ink `#8b7355`
- RPG bars: HP crimson `#8b0000`, MP azure `#1e5fa8`

**Typography:**
- Headings: `"Cinzel", serif` (fantasy display)
- Body: `"Crimson Text", serif` (readable narrative)
- UI labels: `"Inter", sans-serif`

**Effects:**
- Scroll/paper textures via CSS gradients
- Glowing rune buttons with box-shadow animation
- Parchment card backgrounds with uneven edges (clip-path)
- Subtle floating particle overlay (CSS keyframes)

**Framework:** Tailwind CSS with custom theme extension for the fantasy palette.

## 12. Implementation Order

1. Scaffold Vite + React + TypeScript project
2. Install dependencies (dexie, tailwindcss, react-icons)
3. Write core `src/sillytavern/` modules (types → database → engine → assembler → parser → router → variables → merger → importer)
4. Write hooks (`useSillytavern`, `useStreamParser`, `useApiRouter`)
5. Build UI components bottom-up (utilities → modals → panels → views → App)
6. Apply dark fantasy styling
7. Integration testing with a real API endpoint
8. Polish animations and responsive layout

## 13. Verification Checklist

- [ ] `npm run dev` starts without errors
- [ ] TypeScript compiles clean (`tsc --noEmit`)
- [ ] Can create/load/delete game sessions
- [ ] Messages persist across page reloads (IndexedDB)
- [ ] Settings modal saves and loads API config
- [ ] Can create/edit/delete lorebooks and entries
- [ ] Can create/edit/delete presets with all tabs
- [ ] Import/export of SillyTavern JSON format works
- [ ] Game mode streams and parses all 6 tags in real-time
- [ ] Variable panel shows HP/MP/inventory/quests/flags
- [ ] Floor variable backtracking: rewind restores correct state
- [ ] Branching from any message creates a working fork
- [ ] Dual API routing sends appropriate requests to each endpoint
- [ ] Dark fantasy theme renders correctly in both modes
