# 仙途 — Frontend Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete "仙途" cultivation RPG frontend prototype with splash screen door animation, sect orbit map, sect detail view, game shell with 3 panels (chat/character/skills), character creation wizard, Toast notifications, and reskinned global modals — all with Chinese cultivation aesthetics.

**Architecture:** Single-page React app with view routing via state (no router library). CSS-only animations for orbits, particles, and transitions. Existing SillyTavern hooks provide the chat engine; new components provide the cultivation-themed UI shell. Component tree: App → (SplashScreen | SectOrbitView | SectDetailView | GameShell → [ChatPanel | CharacterPanel | SkillPanel]) + overlay modals + Toast container.

**Tech Stack:** Vite 5 + React 18 + TypeScript 5 + Tailwind CSS 3.4 + Lucide React 1.24 (zero additional runtime dependencies)

## Global Constraints

- All text in Chinese; no emoji; use lucide-react icons exclusively
- No external animation libraries — CSS `@keyframes` and `transition` only
- No router library — single `useState`/`useReducer` drives view switching
- PC-first layout; no mobile adaptation required
- Zero placeholder text in UI — every label/content must be meaningful
- Do NOT create any backend/API code
- Preserve existing SillyTavern hooks (`useSillytavern`, `useStreamParser`, `useApiRouter`) and data layer as-is
- Fonts already loaded: ZCOOL XiaoWei, Ma Shan Zheng, Noto Serif SC, Inter
- Commit after every task

---

### Task 1: Game Types & Character Data

**Files:**
- Create: `src/types/game.ts`
- Create: `src/data/character-data.ts`

**Interfaces:**
- Produces:
  - `GameView` type: `'splash' | 'sect-orbit' | 'sect-detail' | 'game-shell'`
  - `SidebarTab` type: `'chat' | 'character' | 'skills'`
  - `SpiritRoot` type: `'metal' | 'wood' | 'water' | 'fire' | 'earth'`
  - `PlayerData`, `GameState`, `Talent`, `ModalType` interfaces
  - `TALENTS` array, `REALMS` array, `SPIRIT_ROOT_NAMES`, `SECT_STAT_MODIFIERS`

- [ ] **Step 1: Create game types file**

```typescript
// src/types/game.ts

export type GameView = 'splash' | 'sect-orbit' | 'sect-detail' | 'game-shell';

export type SidebarTab = 'chat' | 'character' | 'skills';

export type SpiritRoot = 'metal' | 'wood' | 'water' | 'fire' | 'earth';

export type ModalType = 'settings' | 'lorebooks' | 'presets' | 'sessions' | null;

export interface PlayerData {
  daoName: string;
  gender: '男' | '女';
  sectId: string;
  subsectName: string;
  level: number;
  exp: number;
  expToNext: number;
  realmIndex: number;
  spiritRoots: Record<SpiritRoot, number>;
  stats: {
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    divine: number;
    physique: number;
    bone: number;
    wisdom: number;
  };
  innateTalent: string;
}

export interface GameState {
  view: GameView;
  modal: ModalType;
  selectedSectId: string | null;
  activeGame: { sectName: string; subsectName: string } | null;
  sidebarTab: SidebarTab;
  player: PlayerData | null;
  splashComplete: boolean;
  showCharacterCreation: boolean;
}

export interface Talent {
  id: string;
  name: string;
  desc: string;
}
```

- [ ] **Step 2: Create character data file**

```typescript
// src/data/character-data.ts
import type { SpiritRoot, Talent } from '../types/game';

export const SPIRIT_ROOT_NAMES: Record<SpiritRoot, string> = {
  metal: '金',
  wood: '木',
  water: '水',
  fire: '火',
  earth: '土',
};

export const TALENTS: Talent[] = [
  { id: 'sword-heart', name: '剑心通明', desc: '天生对剑道有超凡领悟，修炼剑法事半功倍' },
  { id: 'alchemy-genius', name: '丹道奇才', desc: '炼丹天赋异禀，成丹率大幅提升' },
  { id: 'innate-strength', name: '天生神力', desc: '体魄异于常人，气血充沛远超同辈' },
  { id: 'array-master', name: '阵道天才', desc: '对阵法的感知力极强，布阵速度加倍' },
  { id: 'talisman-expert', name: '符箓精通', desc: '绘制符箓如有神助，符箓威力提升' },
];

export const REALMS: string[] = [
  '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫', '真仙',
];

export const SECT_STAT_MODIFIERS: Record<string, Partial<{
  hp: number; mp: number; divine: number; physique: number; bone: number; wisdom: number;
}>> = {
  qingyun: { hp: 10, divine: 3, wisdom: 2 },
  liuli: { mp: 15, divine: 2, wisdom: 3 },
  fenxiang: { hp: 15, physique: 3, bone: 2 },
  shushan: { hp: 5, divine: 4, wisdom: 3 },
  xuantian: { mp: 10, divine: 4, bone: 1 },
  yaowang: { hp: 5, mp: 5, wisdom: 5 },
  tianmo: { hp: 20, physique: 3, bone: 2 },
  hehuan: { mp: 15, divine: 3, wisdom: 1 },
  yinsha: { hp: 10, mp: 5, bone: 4 },
};
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/types/game.ts src/data/character-data.ts
git commit -m "feat: add game types and character data

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: useGameState Hook

**Files:**
- Create: `src/hooks/useGameState.ts`

**Interfaces:**
- Produces:
  - `useGameState()` returning `{ state: GameState, actions: { setView, setModal, selectSect, startGame, exitGame, setSidebarTab, setPlayer, completeSplash, showCharCreation, hideCharCreation } }`
  - Uses `useReducer` with `GameAction` discriminated union

- [ ] **Step 1: Write the hook**

```typescript
// src/hooks/useGameState.ts
import { useReducer, useCallback } from 'react';
import type { GameState, GameView, ModalType, SidebarTab, PlayerData } from '../types/game';

type GameAction =
  | { type: 'SET_VIEW'; view: GameView }
  | { type: 'SET_MODAL'; modal: ModalType }
  | { type: 'SELECT_SECT'; sectId: string | null }
  | { type: 'START_GAME'; sectName: string; subsectName: string }
  | { type: 'EXIT_GAME' }
  | { type: 'SET_SIDEBAR_TAB'; tab: SidebarTab }
  | { type: 'SET_PLAYER'; player: PlayerData }
  | { type: 'COMPLETE_SPLASH' }
  | { type: 'SHOW_CHAR_CREATION' }
  | { type: 'HIDE_CHAR_CREATION' };

const initialState: GameState = {
  view: 'splash',
  modal: null,
  selectedSectId: null,
  activeGame: null,
  sidebarTab: 'chat',
  player: null,
  splashComplete: false,
  showCharacterCreation: false,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, view: action.view };
    case 'SET_MODAL':
      return { ...state, modal: action.modal };
    case 'SELECT_SECT':
      return {
        ...state,
        selectedSectId: action.sectId,
        view: action.sectId ? 'sect-detail' : state.view,
      };
    case 'START_GAME':
      return {
        ...state,
        activeGame: { sectName: action.sectName, subsectName: action.subsectName },
        view: 'game-shell',
        sidebarTab: 'chat',
      };
    case 'EXIT_GAME':
      return {
        ...state,
        activeGame: null,
        view: 'sect-detail',
        sidebarTab: 'chat',
      };
    case 'SET_SIDEBAR_TAB':
      return { ...state, sidebarTab: action.tab };
    case 'SET_PLAYER':
      return { ...state, player: action.player, showCharacterCreation: false };
    case 'COMPLETE_SPLASH':
      return { ...state, splashComplete: true, view: 'sect-orbit' };
    case 'SHOW_CHAR_CREATION':
      return { ...state, showCharacterCreation: true };
    case 'HIDE_CHAR_CREATION':
      return { ...state, showCharacterCreation: false };
    default:
      return state;
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const actions = {
    setView: useCallback((view: GameView) => dispatch({ type: 'SET_VIEW', view }), []),
    setModal: useCallback((modal: ModalType) => dispatch({ type: 'SET_MODAL', modal }), []),
    selectSect: useCallback(
      (sectId: string | null) => dispatch({ type: 'SELECT_SECT', sectId }), []),
    startGame: useCallback(
      (sectName: string, subsectName: string) =>
        dispatch({ type: 'START_GAME', sectName, subsectName }), []),
    exitGame: useCallback(() => dispatch({ type: 'EXIT_GAME' }), []),
    setSidebarTab: useCallback(
      (tab: SidebarTab) => dispatch({ type: 'SET_SIDEBAR_TAB', tab }), []),
    setPlayer: useCallback(
      (player: PlayerData) => dispatch({ type: 'SET_PLAYER', player }), []),
    completeSplash: useCallback(() => dispatch({ type: 'COMPLETE_SPLASH' }), []),
    showCharCreation: useCallback(() => dispatch({ type: 'SHOW_CHAR_CREATION' }), []),
    hideCharCreation: useCallback(() => dispatch({ type: 'HIDE_CHAR_CREATION' }), []),
  };

  return { state, actions };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useGameState.ts
git commit -m "feat: add useGameState hook with reducer-based state management

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: CSS Animation Layer

**Files:**
- Modify: `src/index.css` — append new keyframes and utility classes at end of file

- [ ] **Step 1: Append CSS keyframes and utility classes**

Append the following CSS to the end of `src/index.css`:

```css
/* ============================================================
   Keyframes — Splash & Orbit Animations
   ============================================================ */

@keyframes breathGlow {
  0%, 100% {
    box-shadow:
      0 0 20px rgba(212, 168, 67, 0.3),
      0 0 60px rgba(212, 168, 67, 0.15);
  }
  50% {
    box-shadow:
      0 0 35px rgba(212, 168, 67, 0.5),
      0 0 80px rgba(212, 168, 67, 0.25);
  }
}

@keyframes breathText {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}

@keyframes whiteFlash {
  0% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes titleEnter {
  0% { opacity: 0; transform: scale(0.3); filter: blur(20px); }
  60% { opacity: 1; transform: scale(1.05); filter: blur(0); }
  100% { opacity: 1; transform: scale(1); filter: blur(0); }
}

@keyframes starTwinkle {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.5); }
}

@keyframes orbitClockwise {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes orbitCounterClockwise {
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
}

@keyframes aetherPulse {
  0%, 100% {
    box-shadow:
      0 0 15px rgba(212, 168, 67, 0.4),
      0 0 40px rgba(34, 211, 238, 0.15),
      0 0 80px rgba(212, 168, 67, 0.05);
  }
  50% {
    box-shadow:
      0 0 25px rgba(212, 168, 67, 0.6),
      0 0 60px rgba(34, 211, 238, 0.3),
      0 0 120px rgba(212, 168, 67, 0.1);
  }
}

@keyframes toastSlideIn {
  from { opacity: 0; transform: translateX(40px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes toastSlideOut {
  from { opacity: 1; transform: translateX(0); }
  to { opacity: 0; transform: translateX(40px) translateY(-10px); }
}

@keyframes toastProgress {
  from { width: 100%; }
  to { width: 0%; }
}

@keyframes titleParticleFloat {
  0% { transform: translate(0, 0) scale(1); opacity: 0; }
  20% { opacity: 1; }
  100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
}

/* ============================================================
   Component Utility Classes
   ============================================================ */

@layer components {
  .animate-breath-glow {
    animation: breathGlow 3s ease-in-out infinite;
  }

  .animate-breath-text {
    animation: breathText 2.5s ease-in-out infinite;
  }

  .animate-orbit-60 {
    animation: orbitClockwise 60s linear infinite;
  }

  .animate-orbit-80 {
    animation: orbitCounterClockwise 80s linear infinite;
  }

  .animate-aether-pulse {
    animation: aetherPulse 4s ease-in-out infinite;
  }

  .star-particle {
    position: absolute;
    border-radius: 50%;
    background: var(--star-color, #ffffff);
    width: var(--star-size, 2px);
    height: var(--star-size, 2px);
    left: var(--star-x, 50%);
    top: var(--star-y, 50%);
    animation: starTwinkle var(--star-duration, 3s) ease-in-out infinite;
    animation-delay: var(--star-delay, 0s);
    pointer-events: none;
    will-change: opacity, transform;
  }

  .perspective-container {
    perspective: 1200px;
  }

  .door-leaf {
    position: absolute;
    top: 50%;
    width: 30vw;
    height: 65vh;
    transform-origin: center center;
    transition: transform 1.2s cubic-bezier(0.87, 0, 0.13, 1);
  }

  .door-left {
    left: calc(50% - 30vw);
    transform: translateY(-50%) rotateY(0deg);
  }

  .door-right {
    right: calc(50% - 30vw);
    transform: translateY(-50%) rotateY(0deg);
  }

  .door-left.open {
    transform: translateY(-50%) rotateY(-110deg);
  }

  .door-right.open {
    transform: translateY(-50%) rotateY(110deg);
  }
}
```

- [ ] **Step 2: Verify build succeeds**

```bash
npx vite build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat: add splash and orbit animation keyframes and CSS utility classes

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: StarField Component

**Files:**
- Create: `src/components/Splash/StarField.tsx`

- [ ] **Step 1: Create StarField component**

```typescript
// src/components/Splash/StarField.tsx
import { useMemo } from 'react';

interface StarFieldProps {
  count?: number;
}

interface StarConfig {
  id: number;
  x: string;
  y: string;
  size: string;
  color: string;
  duration: string;
  delay: string;
}

const STAR_COLORS = [
  '#ffffff',
  '#f0e6c8',
  '#d4e8f0',
  '#e8d5f0',
  '#f5d78a',
  '#c8e8f0',
];

export function StarField({ count = 80 }: StarFieldProps) {
  const stars: StarConfig[] = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: `${Math.random() * 100}%`,
      y: `${Math.random() * 100}%`,
      size: `${Math.random() * 2.5 + 1}px`,
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      duration: `${Math.random() * 4 + 2}s`,
      delay: `${Math.random() * 5}s`,
    }));
  }, [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {stars.map((star) => (
        <div
          key={star.id}
          className="star-particle"
          style={{
            '--star-x': star.x,
            '--star-y': star.y,
            '--star-size': star.size,
            '--star-color': star.color,
            '--star-duration': star.duration,
            '--star-delay': star.delay,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Splash/StarField.tsx
git commit -m "feat: add reusable StarField component with randomized twinkling stars

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: SplashScreen — Door + SVG Title + Animation Sequence

**Files:**
- Create: `src/components/Splash/SplashScreen.tsx`

- [ ] **Step 1: Create SplashScreen component**

```typescript
// src/components/Splash/SplashScreen.tsx
import { useState, useCallback, useRef, useEffect } from 'react';
import { StarField } from './StarField';

interface SplashScreenProps {
  onComplete: () => void;
}

type Phase = 'idle' | 'opening' | 'flash' | 'title' | 'fading';

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [doorOpen, setDoorOpen] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleOpenDoor = useCallback(() => {
    setPhase('opening');
    setDoorOpen(true);

    const t1 = setTimeout(() => setPhase('flash'), 1200);
    const t2 = setTimeout(() => setPhase('title'), 1500);
    const t3 = setTimeout(() => setPhase('fading'), 3500);
    const t4 = setTimeout(() => onComplete(), 4100);

    timersRef.current.push(t1, t2, t3, t4);
  }, [onComplete]);

  return (
    <div
      className={`
        fixed inset-0 z-[60] flex flex-col items-center justify-center
        bg-[#050508] overflow-hidden
        transition-opacity duration-[600ms] ease-out
        ${phase === 'fading' ? 'opacity-0' : 'opacity-100'}
      `}
    >
      <StarField count={100} />

      {/* Nebula gradients */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(30,20,50,0.6)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_70%,rgba(40,30,20,0.4)_0%,transparent_60%)]" />
      </div>

      {/* Door frame */}
      <div className="perspective-container relative flex items-center justify-center" style={{ width: '62vw', height: '68vh' }}>
        {/* Frame border */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            border: '3px solid rgba(180, 140, 60, 0.5)',
            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.6), 0 0 60px rgba(180,140,60,0.1)',
            background: 'linear-gradient(180deg, #1a1408 0%, #0d0a04 50%, #1a1408 100%)',
          }}
        />

        {/* Left door leaf */}
        <div className={`door-leaf door-left ${doorOpen ? 'open' : ''}`}>
          <div
            className="w-full h-full"
            style={{
              background: 'linear-gradient(90deg, #1a1008 0%, #2a1a0a 50%, #1a1008 100%)',
              border: '2px solid rgba(200, 160, 80, 0.6)',
              borderRight: '1px solid rgba(200, 160, 80, 0.3)',
              boxShadow: 'inset 0 0 40px rgba(0,0,0,0.4)',
            }}
          >
            <div className="w-full h-full" style={{
              backgroundImage: `
                radial-gradient(circle at 25% 15%, rgba(180,140,60,0.6) 2px, transparent 2px),
                radial-gradient(circle at 50% 15%, rgba(180,140,60,0.6) 2px, transparent 2px),
                radial-gradient(circle at 75% 15%, rgba(180,140,60,0.6) 2px, transparent 2px),
                radial-gradient(circle at 25% 35%, rgba(180,140,60,0.6) 2px, transparent 2px),
                radial-gradient(circle at 50% 35%, rgba(180,140,60,0.6) 2px, transparent 2px),
                radial-gradient(circle at 75% 35%, rgba(180,140,60,0.6) 2px, transparent 2px),
                radial-gradient(circle at 25% 55%, rgba(180,140,60,0.6) 2px, transparent 2px),
                radial-gradient(circle at 50% 55%, rgba(180,140,60,0.6) 2px, transparent 2px),
                radial-gradient(circle at 75% 55%, rgba(180,140,60,0.6) 2px, transparent 2px)
              `,
              backgroundSize: '100% 100%',
            }} />
            {/* Door handle */}
            <div className="absolute left-1/2 top-[55%]" style={{
              width: '48px', height: '48px', marginLeft: '-24px', marginTop: '-24px',
              borderRadius: '50%', border: '3px solid rgba(200,150,70,0.8)',
              background: 'radial-gradient(circle at 40% 40%, rgba(200,160,80,0.4), rgba(80,50,20,0.8))',
              boxShadow: '0 0 15px rgba(180,140,60,0.4), inset 0 0 10px rgba(0,0,0,0.5)',
            }}>
              <div className="absolute inset-2 rounded-full" style={{
                border: '2px solid rgba(180,130,50,0.6)',
                background: 'radial-gradient(circle at 50% 50%, rgba(60,30,10,0.8), rgba(20,10,5,0.9))',
              }} />
            </div>
          </div>
        </div>

        {/* Right door leaf */}
        <div className={`door-leaf door-right ${doorOpen ? 'open' : ''}`}>
          <div
            className="w-full h-full"
            style={{
              background: 'linear-gradient(270deg, #1a1008 0%, #2a1a0a 50%, #1a1008 100%)',
              border: '2px solid rgba(200, 160, 80, 0.6)',
              borderLeft: '1px solid rgba(200, 160, 80, 0.3)',
              boxShadow: 'inset 0 0 40px rgba(0,0,0,0.4)',
            }}
          >
            <div className="w-full h-full" style={{
              backgroundImage: `
                radial-gradient(circle at 25% 15%, rgba(180,140,60,0.6) 2px, transparent 2px),
                radial-gradient(circle at 50% 15%, rgba(180,140,60,0.6) 2px, transparent 2px),
                radial-gradient(circle at 75% 15%, rgba(180,140,60,0.6) 2px, transparent 2px),
                radial-gradient(circle at 25% 35%, rgba(180,140,60,0.6) 2px, transparent 2px),
                radial-gradient(circle at 50% 35%, rgba(180,140,60,0.6) 2px, transparent 2px),
                radial-gradient(circle at 75% 35%, rgba(180,140,60,0.6) 2px, transparent 2px),
                radial-gradient(circle at 25% 55%, rgba(180,140,60,0.6) 2px, transparent 2px),
                radial-gradient(circle at 50% 55%, rgba(180,140,60,0.6) 2px, transparent 2px),
                radial-gradient(circle at 75% 55%, rgba(180,140,60,0.6) 2px, transparent 2px)
              `,
              backgroundSize: '100% 100%',
            }} />
            <div className="absolute left-1/2 top-[55%]" style={{
              width: '48px', height: '48px', marginLeft: '-24px', marginTop: '-24px',
              borderRadius: '50%', border: '3px solid rgba(200,150,70,0.8)',
              background: 'radial-gradient(circle at 40% 40%, rgba(200,160,80,0.4), rgba(80,50,20,0.8))',
              boxShadow: '0 0 15px rgba(180,140,60,0.4), inset 0 0 10px rgba(0,0,0,0.5)',
            }}>
              <div className="absolute inset-2 rounded-full" style={{
                border: '2px solid rgba(180,130,50,0.6)',
                background: 'radial-gradient(circle at 50% 50%, rgba(60,30,10,0.8), rgba(20,10,5,0.9))',
              }} />
            </div>
          </div>
        </div>

        {/* Door crack glow */}
        {!doorOpen && (
          <div
            className="absolute left-1/2 top-[17.5%] pointer-events-none"
            style={{
              width: '2px', height: '65%', marginLeft: '-1px',
              background: 'linear-gradient(180deg, transparent 5%, rgba(255,220,150,0.4) 30%, rgba(255,240,200,0.6) 50%, rgba(255,220,150,0.4) 70%, transparent 95%)',
              boxShadow: '0 0 8px rgba(255,220,150,0.4), 0 0 20px rgba(255,200,100,0.2)',
            }}
          />
        )}
      </div>

      {/* White flash overlay */}
      {phase === 'flash' && (
        <div
          className="absolute inset-0 bg-white pointer-events-none z-30"
          style={{ animation: 'whiteFlash 0.3s ease-out forwards' }}
        />
      )}

      {/* SVG Title */}
      {phase === 'title' && (
        <div
          className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none"
          style={{ animation: 'titleEnter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
        >
          <svg viewBox="0 0 400 200" height="40vh" style={{ filter: 'url(#gold-glow-splash)' }}>
            <defs>
              <linearGradient id="gold-gradient-title" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#b8860b" />
                <stop offset="30%" stopColor="#f5d78a" />
                <stop offset="50%" stopColor="#d4a843" />
                <stop offset="70%" stopColor="#f5d78a" />
                <stop offset="100%" stopColor="#b8860b" />
                <animateTransform attributeName="gradientTransform" type="translate" from="-1 0" to="1 0" dur="3s" repeatCount="indefinite" />
              </linearGradient>
              <filter id="gold-glow-splash" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur1" />
                <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur2" />
                <feMerge>
                  <feMergeNode in="blur2" />
                  <feMergeNode in="blur1" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <text x="70" y="145" fontFamily="'ZCOOL XiaoWei','Ma Shan Zheng',serif" fontSize="160" fontWeight="bold" fill="url(#gold-gradient-title)" stroke="white" strokeWidth="2" paintOrder="stroke fill">仙</text>
            <text x="210" y="145" fontFamily="'ZCOOL XiaoWei','Ma Shan Zheng',serif" fontSize="160" fontWeight="bold" fill="url(#gold-gradient-title)" stroke="white" strokeWidth="2" paintOrder="stroke fill">途</text>
          </svg>
        </div>
      )}

      {/* Title golden particles */}
      {phase === 'title' && (
        <div className="absolute inset-0 pointer-events-none z-35" aria-hidden="true">
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                background: `rgba(245, 215, 138, ${Math.random() * 0.6 + 0.3})`,
                left: `${40 + Math.random() * 20}%`,
                top: `${35 + Math.random() * 30}%`,
                '--tx': `${(Math.random() - 0.5) * 200}px`,
                '--ty': `${(Math.random() - 0.5) * 200 - 40}px`,
                animation: `titleParticleFloat ${Math.random() * 2 + 2}s ease-out forwards`,
                animationDelay: `${Math.random() * 0.5}s`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* "开门" button */}
      {phase === 'idle' && (
        <button
          onClick={handleOpenDoor}
          className="absolute z-20 animate-breath-text font-title text-2xl tracking-[0.3em]"
          style={{
            bottom: '10vh',
            color: '#d4a843',
            textShadow: '0 0 12px rgba(212,168,67,0.5), 0 0 30px rgba(212,168,67,0.3)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '12px 36px',
          }}
        >
          开&nbsp;&nbsp;门
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Splash/SplashScreen.tsx
git commit -m "feat: add SplashScreen with 3D door animation, SVG gold title, and particle effects

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 6: SectNode Component

**Files:**
- Create: `src/components/SectMap/SectNode.tsx`

- [ ] **Step 1: Create SectNode**

```typescript
// src/components/SectMap/SectNode.tsx
import type { SectData } from '../../data/sects-data';

interface SectNodeProps {
  sect: SectData;
  angleDeg: number;
  radius: number;
  isSelected: boolean;
  onClick: () => void;
}

export function SectNode({ sect, angleDeg, radius, isSelected, onClick }: SectNodeProps) {
  const angleRad = (angleDeg * Math.PI) / 180;
  const cx = Math.cos(angleRad) * radius;
  const cy = Math.sin(angleRad) * radius;
  const Icon = sect.icon;

  return (
    <div
      className="absolute transition-transform duration-300 ease-out cursor-pointer group"
      style={{
        left: `calc(50% + ${cx}px)`,
        top: `calc(50% + ${cy}px)`,
        transform: `translate(-50%, -50%) scale(${isSelected ? 1.2 : 1})`,
        zIndex: isSelected ? 10 : 1,
      }}
      onClick={onClick}
    >
      <div
        className={`
          relative w-14 h-14 rounded-full flex items-center justify-center
          bg-gradient-to-br ${sect.color}
          transition-all duration-300
          group-hover:scale-110
          ${isSelected
            ? `scale-110 ring-2 ring-celestial-gold/60 ${sect.glow}`
            : `ring-1 ring-white/10 ${sect.glow}`
          }
        `}
        style={isSelected ? {
          boxShadow: '0 0 20px rgba(212,168,67,0.5), 0 0 40px rgba(212,168,67,0.2)',
        } : undefined}
      >
        <div className="absolute inset-0 rounded-full bg-ink-black/30" />
        <Icon size={24} className="relative z-10 text-scroll-white drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]" />
      </div>
      <div
        className={`
          mt-1.5 text-center font-title text-xs tracking-wider transition-all duration-300
          ${isSelected ? 'text-celestial-gold' : 'text-mist-gray/80'}
          group-hover:text-celestial-gold
        `}
        style={isSelected ? { textShadow: '0 0 6px rgba(212,168,67,0.4)' } : undefined}
      >
        {sect.name}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/SectMap/SectNode.tsx
git commit -m "feat: add SectNode with orbit positioning and hover effects

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 7: OrbitRing Component

**Files:**
- Create: `src/components/SectMap/OrbitRing.tsx`

- [ ] **Step 1: Create OrbitRing**

```typescript
// src/components/SectMap/OrbitRing.tsx

interface OrbitRingProps {
  radius: number;
  color: 'gold' | 'cyan';
  animationClass: string;
}

const COLOR_MAP = { gold: 'rgba(212,168,67,0.15)', cyan: 'rgba(34,211,238,0.1)' };

export function OrbitRing({ radius, color, animationClass }: OrbitRingProps) {
  const diameter = radius * 2;
  return (
    <div
      className={`absolute ${animationClass}`}
      style={{
        left: `calc(50% - ${radius}px)`,
        top: `calc(50% - ${radius}px)`,
        width: `${diameter}px`,
        height: `${diameter}px`,
        borderRadius: '50%',
        border: `1px dashed ${COLOR_MAP[color]}`,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/SectMap/OrbitRing.tsx
git commit -m "feat: add OrbitRing for dual-color dashed orbit visualization

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 8: SectInfoPanel Component

**Files:**
- Create: `src/components/SectMap/SectInfoPanel.tsx`

- [ ] **Step 1: Create SectInfoPanel**

```typescript
// src/components/SectMap/SectInfoPanel.tsx
import { ArrowRight } from 'lucide-react';
import type { SectData } from '../../data/sects-data';

interface SectInfoPanelProps {
  sect: SectData | null;
  onEnterDetail: () => void;
}

export function SectInfoPanel({ sect, onEnterDetail }: SectInfoPanelProps) {
  return (
    <div className="w-72 shrink-0 h-full border-r border-faded-gold/40 bg-mystic-azure/50 backdrop-blur-sm p-5 flex flex-col">
      {sect ? (
        <>
          <h2 className="font-title text-xl text-celestial-gold tracking-wider mb-1">{sect.name}</h2>
          <span className={`
            self-start inline-block px-2.5 py-0.5 text-[11px] font-ui tracking-wider rounded-full border mb-3
            ${sect.type === '正道' ? 'border-celestial-gold/60 text-celestial-gold' : 'border-vermil-red/60 text-vermil-red'}
          `}>
            {sect.type}
          </span>
          <p className="text-sm font-body text-mist-gray/80 leading-relaxed mb-4">{sect.desc}</p>
          <div className="border-t border-faded-gold/30 mb-4" />
          <div className="text-xs font-ui text-mist-gray/60 mb-1">下属宗门</div>
          <div className="text-sm font-body text-scroll-white mb-4">
            {sect.subs.map((s) => s.name).join('、')}
          </div>
          <div className="flex gap-4 text-xs font-ui text-mist-gray/60 mb-6">
            <div>
              <span className="block text-scroll-white text-base font-title">{sect.subs.length}</span>
              分支
            </div>
            <div>
              <span className="block text-scroll-white text-base font-title">{sect.type === '正道' ? '正' : '邪'}</span>
              阵营
            </div>
          </div>
          <button onClick={onEnterDetail} className="mt-auto rune-button text-sm w-full flex items-center justify-center gap-2">
            查看详情
            <ArrowRight size={14} />
          </button>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm font-body text-mist-gray/50 text-center leading-relaxed">
            点击轨道上的<br />宗门以查看详情
          </p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/SectMap/SectInfoPanel.tsx
git commit -m "feat: add SectInfoPanel with sect details and placeholder prompt

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 9: SectOrbitView — Main Page

**Files:**
- Create: `src/components/SectMap/SectOrbitView.tsx`
- Modify: `src/components/Cultivation/index.ts` — update exports

- [ ] **Step 1: Create SectOrbitView**

```typescript
// src/components/SectMap/SectOrbitView.tsx
import { useState } from 'react';
import { Settings, BookOpen, ScrollText, Layers } from 'lucide-react';
import { SECTS_DATA } from '../../data/sects-data';
import { StarField } from '../Splash/StarField';
import { OrbitRing } from './OrbitRing';
import { SectNode } from './SectNode';
import { SectInfoPanel } from './SectInfoPanel';

interface SectOrbitViewProps {
  onOpenSettings: () => void;
  onOpenLorebooks: () => void;
  onOpenPresets: () => void;
  onOpenSessions: () => void;
  onSelectSect: (sectId: string) => void;
}

const ORBIT_RADIUS = 230;

export function SectOrbitView({
  onOpenSettings, onOpenLorebooks, onOpenPresets, onOpenSessions, onSelectSect,
}: SectOrbitViewProps) {
  const [hoveredSectId, setHoveredSectId] = useState<string | null>(null);

  const displaySect = hoveredSectId
    ? SECTS_DATA.find((s) => s.id === hoveredSectId) ?? null
    : null;

  return (
    <div className="flex flex-col h-screen bg-ink-black overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-faded-gold/40 bg-mystic-azure/50 shrink-0">
        <h1 className="font-title text-2xl text-celestial-gold tracking-widest drop-shadow-[0_0_6px_rgba(212,168,67,0.3)]">
          仙途
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={onOpenSessions} className="p-2 rounded text-mist-gray hover:text-celestial-gold hover:bg-faded-gold/30 transition-colors" title="修炼历程"><Layers size={18} /></button>
          <button onClick={onOpenLorebooks} className="p-2 rounded text-mist-gray hover:text-celestial-gold hover:bg-faded-gold/30 transition-colors" title="典籍"><BookOpen size={18} /></button>
          <button onClick={onOpenPresets} className="p-2 rounded text-mist-gray hover:text-celestial-gold hover:bg-faded-gold/30 transition-colors" title="法门"><ScrollText size={18} /></button>
          <button onClick={onOpenSettings} className="p-2 rounded text-mist-gray hover:text-celestial-gold hover:bg-faded-gold/30 transition-colors" title="设置"><Settings size={18} /></button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <SectInfoPanel sect={displaySect} onEnterDetail={() => { if (hoveredSectId) onSelectSect(hoveredSectId); }} />

        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          <StarField count={60} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(30,20,50,0.4)_0%,transparent_60%)]" />

          <OrbitRing radius={ORBIT_RADIUS} color="gold" animationClass="animate-orbit-60" />
          <OrbitRing radius={ORBIT_RADIUS + 30} color="cyan" animationClass="animate-orbit-80" />

          <div className="absolute animate-orbit-60" style={{ left: '50%', top: '50%', width: 0, height: 0 }}>
            {SECTS_DATA.map((sect, i) => {
              const angle = (360 / SECTS_DATA.length) * i;
              return (
                <SectNode
                  key={sect.id}
                  sect={sect}
                  angleDeg={angle}
                  radius={ORBIT_RADIUS}
                  isSelected={hoveredSectId === sect.id}
                  onClick={() => onSelectSect(sect.id)}
                />
              );
            })}
          </div>

          <div
            className="absolute cursor-pointer group"
            onMouseEnter={() => setHoveredSectId(null)}
            style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 5 }}
          >
            <div className="absolute rounded-full animate-aether-pulse" style={{ width: 120, height: 120, left: -60, top: -60 }} />
            <div className="absolute rounded-full" style={{ width: 160, height: 160, left: -80, top: -80, border: '1px solid rgba(34,211,238,0.05)', borderRadius: '50%' }} />
            <div className="relative w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br from-ink-black to-mystic-azure border-2 border-celestial-gold/60 shadow-[0_0_30px_rgba(212,168,67,0.3),inset_0_0_20px_rgba(212,168,67,0.05)] group-hover:shadow-[0_0_50px_rgba(212,168,67,0.5)] transition-shadow duration-500">
              <span className="font-title text-lg text-celestial-gold tracking-[0.2em] drop-shadow-[0_0_4px_rgba(212,168,67,0.5)]">青曜</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update cultivation index**

```typescript
// src/components/Cultivation/index.ts
export { SectOrbitView } from '../SectMap/SectOrbitView';
export { CultivationChat } from './CultivationChat';
export { ToastProvider, ToastContainer, useToast } from './Toast';
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/components/SectMap/SectOrbitView.tsx src/components/SectMap/SectNode.tsx src/components/SectMap/OrbitRing.tsx src/components/SectMap/SectInfoPanel.tsx src/components/Cultivation/index.ts
git commit -m "feat: add SectOrbitView with rotating orbital sect nodes and central axis

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 10: SectDetailView

**Files:**
- Create: `src/components/SectDetail/SectDetailView.tsx`

- [ ] **Step 1: Create SectDetailView**

```typescript
// src/components/SectDetail/SectDetailView.tsx
import { ArrowLeft } from 'lucide-react';
import { SECTS_DATA } from '../../data/sects-data';
import type { SectData, SubsectData } from '../../data/sects-data';
import { StarField } from '../Splash/StarField';
import { OrbitRing } from '../SectMap/OrbitRing';

interface SectDetailViewProps {
  sectId: string;
  onBack: () => void;
  onEnterSubsect: (sectName: string, subsectName: string) => void;
}

const DETAIL_ORBIT_RADIUS = 130;

function SubsectNode({ sub, sect, angleDeg, radius, onClick }: {
  sub: SubsectData; sect: SectData; angleDeg: number; radius: number; onClick: () => void;
}) {
  const angleRad = (angleDeg * Math.PI) / 180;
  const cx = Math.cos(angleRad) * radius;
  const cy = Math.sin(angleRad) * radius;
  return (
    <div
      className="absolute transition-transform duration-300 ease-out cursor-pointer group"
      style={{ left: `calc(50% + ${cx}px)`, top: `calc(50% + ${cy}px)`, transform: 'translate(-50%, -50%)' }}
      onClick={onClick}
    >
      <div className={`relative w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br ${sect.color} transition-all duration-300 group-hover:scale-110 group-hover:ring-2 group-hover:ring-celestial-gold/60 ring-1 ring-white/10 ${sect.glow}`}>
        <div className="absolute inset-0 rounded-full bg-ink-black/30" />
        <span className="relative z-10 font-title text-lg text-scroll-white">{sub.name[0]}</span>
      </div>
      <div className="mt-1.5 text-center font-title text-xs text-mist-gray/80 tracking-wider group-hover:text-celestial-gold transition-colors">{sub.name}</div>
    </div>
  );
}

export function SectDetailView({ sectId, onBack, onEnterSubsect }: SectDetailViewProps) {
  const sect = SECTS_DATA.find((s) => s.id === sectId);
  if (!sect) return null;
  const Icon = sect.icon;

  return (
    <div className="flex flex-col h-screen bg-ink-black overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-faded-gold/40 bg-mystic-azure/50 shrink-0">
        <button onClick={onBack} className="flex items-center gap-2 text-mist-gray hover:text-scroll-white transition-colors group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-ui text-sm">返回</span>
        </button>
        <h1 className="font-title text-xl text-celestial-gold tracking-wider">{sect.name}</h1>
        <span className={`px-2.5 py-0.5 text-[11px] font-ui tracking-wider rounded-full border ${sect.type === '正道' ? 'border-celestial-gold/60 text-celestial-gold' : 'border-vermil-red/60 text-vermil-red'}`}>
          {sect.type}
        </span>
      </div>

      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <StarField count={40} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(30,20,50,0.4)_0%,transparent_60%)]" />
        <OrbitRing radius={DETAIL_ORBIT_RADIUS} color="gold" animationClass="animate-orbit-60" />
        <OrbitRing radius={DETAIL_ORBIT_RADIUS + 25} color="cyan" animationClass="animate-orbit-80" />

        <div className="absolute flex flex-col items-center z-10" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
          <div className={`w-36 h-36 rounded-full flex items-center justify-center bg-gradient-to-br ${sect.color} ${sect.glow}`}
            style={{ boxShadow: '0 0 40px rgba(212,168,67,0.4), 0 0 80px rgba(212,168,67,0.2)' }}>
            <div className="absolute inset-0 rounded-full bg-ink-black/20" />
            <Icon size={56} className="relative z-10 text-scroll-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
          </div>
          <h2 className="mt-3 font-title text-2xl text-scroll-white tracking-wider">{sect.name}</h2>
          <p className="mt-1 text-sm font-body text-mist-gray/70 text-center max-w-xs leading-relaxed">{sect.desc}</p>
        </div>

        <div className="absolute animate-orbit-60" style={{ width: 0, height: 0, left: '50%', top: '50%' }}>
          {sect.subs.map((sub, i) => {
            const angle = (360 / sect.subs.length) * i - 90;
            return (
              <SubsectNode key={sub.name} sub={sub} sect={sect} angleDeg={angle} radius={DETAIL_ORBIT_RADIUS}
                onClick={() => onEnterSubsect(sect.name, sub.name)} />
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/SectDetail/SectDetailView.tsx
git commit -m "feat: add SectDetailView with enlarged central sect and subsect orbit

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 11: Common Modal Shell + IconButton

**Files:**
- Create: `src/components/common/Modal.tsx`
- Create: `src/components/common/IconButton.tsx`

- [ ] **Step 1: Create Modal and IconButton**

```typescript
// src/components/common/Modal.tsx
import { X } from 'lucide-react';

interface ModalProps {
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ onClose, title, children, maxWidth = 'max-w-2xl' }: ModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-panel ${maxWidth} w-[90vw] p-6`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="font-title text-lg text-celestial-gold">{title}</h2>}
          <button onClick={onClose} className="p-1 rounded text-mist-gray hover:text-scroll-white hover:bg-faded-gold/30 transition-colors ml-auto">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
```

```typescript
// src/components/common/IconButton.tsx
import type { LucideIcon } from 'lucide-react';

interface IconButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  active?: boolean;
}

export function IconButton({ icon: Icon, label, onClick, active }: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded transition-all duration-200 font-ui text-sm ${active ? 'bg-celestial-gold/10 text-celestial-gold' : 'text-mist-gray hover:text-scroll-white hover:bg-faded-gold/20'}`}
      title={label}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );
}
```

- [ ] **Step 2: Verify TypeScript and commit**

```bash
npx tsc --noEmit
git add src/components/common/Modal.tsx src/components/common/IconButton.tsx
git commit -m "feat: add reusable Modal shell and IconButton components

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 12: GameShell Sidebar

**Files:**
- Create: `src/components/GameShell/Sidebar.tsx`

- [ ] **Step 1: Create Sidebar**

```typescript
// src/components/GameShell/Sidebar.tsx
import { useState } from 'react';
import { MessageCircle, User, Swords, ChevronLeft, ChevronRight } from 'lucide-react';
import type { SidebarTab } from '../../types/game';

interface SidebarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
}

const TABS: { key: SidebarTab; label: string; icon: typeof MessageCircle }[] = [
  { key: 'chat', label: '聊天', icon: MessageCircle },
  { key: 'character', label: '角色', icon: User },
  { key: 'skills', label: '功法', icon: Swords },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`shrink-0 h-full flex flex-col border-r border-faded-gold/40 bg-mystic-azure/60 transition-all duration-300 ease-out ${expanded ? 'w-52' : 'w-14'}`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <button onClick={() => setExpanded(!expanded)} className="self-end p-1.5 m-1 text-mist-gray hover:text-scroll-white transition-colors" title={expanded ? '收起' : '展开'}>
        {expanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>
      <div className="flex-1 flex flex-col gap-1 px-2 py-3">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`relative flex items-center gap-3 w-full rounded transition-all duration-200 font-ui text-sm ${expanded ? 'px-3 py-2.5' : 'px-2 py-2.5 justify-center'} ${activeTab === tab.key ? 'bg-celestial-gold/10 text-celestial-gold' : 'text-mist-gray hover:text-scroll-white hover:bg-faded-gold/20'}`}
            title={tab.label}
          >
            {activeTab === tab.key && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-celestial-gold" />}
            <tab.icon size={20} />
            {expanded && <span className="truncate">{tab.label}</span>}
          </button>
        ))}
      </div>
      <div className="h-4" />
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript and commit**

```bash
npx tsc --noEmit
git add src/components/GameShell/Sidebar.tsx
git commit -m "feat: add GameShell Sidebar with expand-on-hover and tab navigation

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 13: ChatPanel (enhanced)

**Files:**
- Create: `src/components/GameShell/ChatPanel.tsx`

- [ ] **Step 1: Create ChatPanel**

```typescript
// src/components/GameShell/ChatPanel.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';
import { Send } from 'lucide-react';

interface ChatPanelProps {
  sectName: string;
  subsectName: string;
}

export function ChatPanel({ sectName, subsectName }: ChatPanelProps) {
  const { activeChat, isSending, sendMessage } = useSillytavern();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isSending) return;
    sendMessage(input.trim());
    setInput('');
  }, [input, isSending, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleDivination = useCallback(() => {
    if (isSending) return;
    sendMessage(`[天机推演] 关于${subsectName}的近期传闻。`);
  }, [isSending, sendMessage, subsectName]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {(!activeChat || activeChat.messages.length === 0) && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-mystic-azure/50 border border-faded-gold/30 flex items-center justify-center mb-4">
              <div className="w-8 h-8 rounded-full bg-celestial-gold/10 animate-aether-pulse" />
            </div>
            <p className="font-title text-xl text-celestial-gold/40 mb-2">神识连接已建立</p>
            <p className="text-sm text-mist-gray/50 font-body">与{subsectName}的长老建立心神联系...</p>
          </div>
        )}
        {activeChat?.messages.map((msg) => {
          if (msg.role === 'system') return (
            <div key={msg.id} className="text-center">
              <span className="inline-block text-xs italic text-mist-gray/50 font-body px-3 py-1">{msg.content}</span>
            </div>
          );
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div className={`max-w-[70%] px-4 py-3 rounded-lg ${isUser ? 'border-r-2 border-celestial-gold/30 bg-deep-ink/50' : 'border-l-2 border-spirit-cyan/50 bg-mystic-azure/30'}`}>
                <div className={`text-[10px] font-ui tracking-wider mb-1 ${isUser ? 'text-faded-ink text-right' : 'text-celestial-gold'}`}>
                  {isUser ? '弟子' : '天道'}
                </div>
                <div className="text-sm font-body text-scroll-white whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              </div>
            </div>
          );
        })}
        {isSending && (
          <div className="flex justify-start animate-fade-in">
            <div className="border-l-2 border-spirit-cyan/50 bg-mystic-azure/30 max-w-[70%] px-4 py-3 rounded-lg">
              <div className="text-[10px] font-ui tracking-wider mb-1 text-celestial-gold">天道</div>
              <div className="flex gap-1.5 items-center h-5">
                <span className="w-1.5 h-1.5 bg-spirit-cyan/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-spirit-cyan/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-spirit-cyan/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-faded-gold/40 bg-mystic-azure/60 p-4 shrink-0">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <button onClick={handleDivination} disabled={isSending} className="px-3 py-2.5 text-xs font-ui rounded-lg transition-all duration-200 border border-celestial-gold/40 text-celestial-gold hover:bg-celestial-gold/10 hover:shadow-celestial-glow disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap">推演天机</button>
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="诉说心中疑惑..." disabled={isSending} className="flex-1 px-4 py-2.5 text-sm font-body text-scroll-white bg-deep-ink/80 border border-faded-gold/40 rounded-lg placeholder:text-mist-gray/40 focus:outline-none focus:border-spirit-cyan/40 focus:shadow-spirit-glow disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200" />
          <button onClick={handleSend} disabled={isSending || !input.trim()} className="px-4 py-2.5 text-sm font-ui rounded-lg transition-all duration-200 border border-celestial-gold/40 text-celestial-gold hover:bg-celestial-gold/10 hover:shadow-celestial-glow disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-1.5"><Send size={14} />发送神识</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript and commit**

```bash
npx tsc --noEmit
git add src/components/GameShell/ChatPanel.tsx
git commit -m "feat: add enhanced ChatPanel with divination button and cultivation aesthetics

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 14: CharacterPanel

**Files:**
- Create: `src/components/GameShell/CharacterPanel.tsx`

- [ ] **Step 1: Create CharacterPanel**

```typescript
// src/components/GameShell/CharacterPanel.tsx
import { SPIRIT_ROOT_NAMES, REALMS } from '../../data/character-data';
import { SECTS_DATA } from '../../data/sects-data';
import type { PlayerData, SpiritRoot } from '../../types/game';

interface CharacterPanelProps {
  player: PlayerData | null;
  subsectName: string;
}

function SpiritRootBar({ root, value }: { root: SpiritRoot; value: number }) {
  const pct = (value / 10) * 100;
  const colors: Record<SpiritRoot, string> = {
    metal: 'linear-gradient(90deg, #b8860b, #ffd700)', wood: 'linear-gradient(90deg, #228b22, #32cd32)',
    water: 'linear-gradient(90deg, #1e90ff, #00bfff)', fire: 'linear-gradient(90deg, #dc143c, #ff6347)',
    earth: 'linear-gradient(90deg, #8b4513, #daa520)',
  };
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-ui text-mist-gray w-6">{SPIRIT_ROOT_NAMES[root]}</span>
      <div className="flex-1 h-2 bg-ink-black rounded-sm border border-faded-gold/10 overflow-hidden">
        <div className="h-full rounded-sm transition-all duration-500" style={{ width: `${pct}%`, background: colors[root] }} />
      </div>
      <span className="text-xs font-ui text-scroll-white w-4 text-right">{value}</span>
    </div>
  );
}

export function CharacterPanel({ player, subsectName }: CharacterPanelProps) {
  if (!player) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="font-title text-xl text-celestial-gold/40 mb-2">尚未入道</p>
          <p className="text-sm text-mist-gray/50 font-body">请先完成角色创建</p>
        </div>
      </div>
    );
  }

  const sect = SECTS_DATA.find((s) => s.id === player.sectId);
  const realmName = REALMS[player.realmIndex] ?? '未知';

  return (
    <div className="h-full overflow-y-auto px-6 py-5 space-y-5">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-mystic-azure to-deep-ink border-2 border-celestial-gold/40 flex items-center justify-center shrink-0">
          <span className="font-title text-2xl text-celestial-gold">{player.daoName[0]}</span>
        </div>
        <div>
          <h2 className="font-title text-xl text-scroll-white tracking-wider">{player.daoName}</h2>
          <p className="text-xs font-body text-mist-gray/60">{sect?.name ?? '—'} · {player.subsectName}</p>
          <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-ui text-celestial-gold/70 border border-celestial-gold/30 rounded-full">外门弟子</span>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-deep-ink/50 border border-faded-gold/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-ui text-mist-gray">等级 {player.level}</span>
          <span className="text-xs font-ui text-celestial-gold">{realmName}</span>
        </div>
        <div className="stat-bar-bg">
          <div className="stat-bar-fill" style={{ width: `${(player.exp / player.expToNext) * 100}%`, background: 'linear-gradient(90deg, #b8860b, #ffd700)', boxShadow: '0 0 6px rgba(212,168,67,0.4)' }} />
        </div>
        <div className="text-[10px] font-ui text-mist-gray/50 mt-1">经验 {player.exp} / {player.expToNext}</div>
      </div>

      <div>
        <h3 className="font-title text-sm text-celestial-gold/80 mb-2 tracking-wider">灵根属性</h3>
        <div className="space-y-1.5">
          {(Object.keys(SPIRIT_ROOT_NAMES) as SpiritRoot[]).map((root) => (
            <SpiritRootBar key={root} root={root} value={player.spiritRoots[root]} />
          ))}
        </div>
      </div>

      <div className="border-t border-faded-gold/20" />

      <div>
        <h3 className="font-title text-sm text-celestial-gold/80 mb-3 tracking-wider">基础属性</h3>
        <div className="space-y-2">
          {[{ label: '气血', value: player.stats.hp, max: player.stats.maxHp, color: 'linear-gradient(90deg, #991b1b, #dc2626)' },
            { label: '灵力', value: player.stats.mp, max: player.stats.maxMp, color: 'linear-gradient(90deg, #1e3a5f, #3b82f6)' },
          ].map(({ label, value, max, color }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-xs font-ui text-mist-gray w-10 text-right">{label}</span>
              <div className="flex-1 stat-bar-bg">
                <div className="stat-bar-fill" style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: color }} />
              </div>
              <span className="text-xs font-ui text-scroll-white w-20">{value}/{max}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {[{ label: '神识', value: player.stats.divine }, { label: '体魄', value: player.stats.physique },
            { label: '根骨', value: player.stats.bone }, { label: '悟性', value: player.stats.wisdom },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center px-3 py-2 rounded bg-deep-ink/50 border border-faded-gold/20">
              <span className="text-xs font-ui text-mist-gray">{label}</span>
              <span className="text-sm font-ui text-scroll-white">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-faded-gold/20" />
      <div>
        <h3 className="font-title text-sm text-celestial-gold/80 mb-1 tracking-wider">先天天赋</h3>
        <p className="text-sm font-body text-scroll-white">{player.innateTalent}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript and commit**

```bash
npx tsc --noEmit
git add src/components/GameShell/CharacterPanel.tsx
git commit -m "feat: add CharacterPanel with spirit roots, stats, and cultivation realm

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 15: SkillPanel

**Files:**
- Create: `src/components/GameShell/SkillPanel.tsx`

- [ ] **Step 1: Create SkillPanel**

```typescript
// src/components/GameShell/SkillPanel.tsx
import { SECTS_DATA } from '../../data/sects-data';
import type { PlayerData } from '../../types/game';

interface SkillPanelProps { player: PlayerData | null; }

const DEFAULT_SKILLS = [
  { name: '太极玄清道', layer: '第三层', desc: '真气运转如太极，生生不息，阴阳调和', progress: 78, isMain: true },
  { name: '御剑术', layer: '入门', desc: '以气驭剑，百步之内取人首级如探囊取物', progress: 0, isMain: false },
  { name: '青云心法', layer: '第二层', desc: '青云门基础内功心法，培元固本', progress: 45, isMain: false },
];

export function SkillPanel({ player }: SkillPanelProps) {
  if (!player) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="font-title text-xl text-celestial-gold/40 mb-2">尚未入道</p>
          <p className="text-sm text-mist-gray/50 font-body">请先完成角色创建</p>
        </div>
      </div>
    );
  }

  const sect = SECTS_DATA.find((s) => s.id === player.sectId);

  return (
    <div className="h-full overflow-y-auto px-6 py-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-title text-lg text-celestial-gold tracking-wider">已习得功法</h2>
        <span className="text-xs font-ui text-mist-gray/60">{sect?.name ?? '—'} · 传承</span>
      </div>
      {DEFAULT_SKILLS.map((skill) => (
        <div key={skill.name} className="p-4 rounded-lg bg-deep-ink/50 border border-faded-gold/30 hover:border-celestial-gold/40 transition-colors duration-300">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`text-lg ${skill.isMain ? 'text-celestial-gold' : 'text-mist-gray'}`}>{skill.isMain ? '◈' : '◇'}</span>
              <div>
                <h3 className="font-title text-base text-scroll-white">{skill.name}</h3>
                <span className="text-[10px] font-ui text-mist-gray/60">{skill.layer}</span>
              </div>
            </div>
            {skill.isMain && <span className="px-2 py-0.5 text-[10px] font-ui rounded-full border border-celestial-gold/30 text-celestial-gold/70">主修功法</span>}
          </div>
          <p className="text-xs font-body text-mist-gray/70 leading-relaxed mb-3">{skill.desc}</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 stat-bar-bg">
              <div className="stat-bar-fill" style={{ width: `${skill.progress}%`, background: 'linear-gradient(90deg, #b8860b, #ffd700)', boxShadow: '0 0 6px rgba(212,168,67,0.4)' }} />
            </div>
            <span className="text-[10px] font-ui text-mist-gray/60 w-8 text-right">{skill.progress}%</span>
          </div>
        </div>
      ))}
      <div className="border-t border-faded-gold/20 pt-4">
        <button className="w-full rune-button text-sm flex items-center justify-center gap-2 opacity-60 hover:opacity-100 transition-opacity" disabled>+ 参悟新功法</button>
        <p className="text-[10px] font-body text-mist-gray/40 text-center mt-1.5">与天道对话中领悟新的修炼法门</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript and commit**

```bash
npx tsc --noEmit
git add src/components/GameShell/SkillPanel.tsx
git commit -m "feat: add SkillPanel with cultivation techniques and progress bars

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 16: GameShell Container

**Files:**
- Create: `src/components/GameShell/GameShell.tsx`

- [ ] **Step 1: Create GameShell**

```typescript
// src/components/GameShell/GameShell.tsx
import { Sidebar } from './Sidebar';
import { ChatPanel } from './ChatPanel';
import { CharacterPanel } from './CharacterPanel';
import { SkillPanel } from './SkillPanel';
import { StarField } from '../Splash/StarField';
import { REALMS } from '../../data/character-data';
import type { SidebarTab, PlayerData } from '../../types/game';

interface GameShellProps {
  sectName: string;
  subsectName: string;
  activeTab: SidebarTab;
  player: PlayerData | null;
  onTabChange: (tab: SidebarTab) => void;
  onExit: () => void;
}

export function GameShell({ sectName, subsectName, activeTab, player, onTabChange, onExit }: GameShellProps) {
  const realmName = player ? (REALMS[player.realmIndex] ?? '未知') : '';
  return (
    <div className="flex flex-col h-screen bg-ink-black overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-faded-gold/40 bg-mystic-azure/60 shrink-0">
        <div>
          <h1 className="font-title text-lg text-celestial-gold tracking-wider leading-tight">{sectName} · {subsectName}</h1>
          {player && <p className="text-[11px] font-ui text-mist-gray/60">{player.daoName} · {realmName}</p>}
        </div>
        <button onClick={onExit} className="px-3 py-1.5 text-xs font-ui rounded border transition-colors border-faded-gold/40 text-mist-gray hover:text-scroll-white hover:border-celestial-gold/50 hover:bg-faded-gold/20">退出修炼</button>
      </div>
      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeTab={activeTab} onTabChange={onTabChange} />
        <div className="flex-1 relative overflow-hidden">
          <StarField count={30} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(30,20,50,0.2)_0%,transparent_50%)]" />
          <div className="relative z-10 h-full">
            {activeTab === 'chat' && <ChatPanel sectName={sectName} subsectName={subsectName} />}
            {activeTab === 'character' && <CharacterPanel player={player} subsectName={subsectName} />}
            {activeTab === 'skills' && <SkillPanel player={player} />}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript and commit**

```bash
npx tsc --noEmit
git add src/components/GameShell/GameShell.tsx
git commit -m "feat: add GameShell container with header, sidebar, and panel routing

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 17: CharacterCreation Wizard

**Files:**
- Create: `src/components/Character/CharacterCreation.tsx`

- [ ] **Step 1: Create CharacterCreation — 4-step wizard with sect, spirit roots, info, and confirmation**

```typescript
// src/components/Character/CharacterCreation.tsx
import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { SECTS_DATA } from '../../data/sects-data';
import { SPIRIT_ROOT_NAMES, TALENTS, SECT_STAT_MODIFIERS } from '../../data/character-data';
import { StarField } from '../Splash/StarField';
import type { PlayerData, SpiritRoot } from '../../types/game';

interface CharacterCreationProps {
  onComplete: (player: PlayerData) => void;
  onCancel: () => void;
  preselectedSectId?: string | null;
}

export function CharacterCreation({ onComplete, onCancel, preselectedSectId }: CharacterCreationProps) {
  const [step, setStep] = useState(0);
  const [sectId, setSectId] = useState(preselectedSectId ?? '');
  const [spiritRoots, setSpiritRoots] = useState<Record<SpiritRoot, number>>({ metal: 2, wood: 2, water: 2, fire: 2, earth: 2 });
  const [pointsLeft, setPointsLeft] = useState(10);
  const [daoName, setDaoName] = useState('');
  const [gender, setGender] = useState<'男' | '女'>('男');
  const [talentId, setTalentId] = useState('');

  const selectedSect = SECTS_DATA.find((s) => s.id === sectId);
  const selectedTalent = TALENTS.find((t) => t.id === talentId);

  const handleSpiritChange = (root: SpiritRoot, delta: number) => {
    const newValue = spiritRoots[root] + delta;
    if (newValue < 0 || newValue > 10 || (delta > 0 && pointsLeft <= 0)) return;
    setSpiritRoots({ ...spiritRoots, [root]: newValue });
    setPointsLeft(pointsLeft - delta);
  };

  const handleComplete = () => {
    if (!selectedSect || !daoName || !talentId) return;
    const mods = SECT_STAT_MODIFIERS[sectId] ?? {};
    const rb = { hp: 20, mp: 15, divine: 2, physique: 2, bone: 2, wisdom: 2 };
    const sb = {
      hp: spiritRoots.fire * 3 + spiritRoots.earth * 2, mp: spiritRoots.water * 3 + spiritRoots.metal * 2,
      divine: spiritRoots.metal + spiritRoots.water, physique: spiritRoots.earth * 2 + spiritRoots.fire,
      bone: spiritRoots.earth + spiritRoots.metal, wisdom: spiritRoots.wood * 2 + spiritRoots.water,
    };
    const player: PlayerData = {
      daoName, gender, sectId, subsectName: selectedSect.subs[0]?.name ?? '天枢宗',
      level: 1, exp: 0, expToNext: 100, realmIndex: 0, spiritRoots,
      stats: {
        hp: 200 + (mods.hp ?? 0) + rb.hp + sb.hp, maxHp: 200 + (mods.hp ?? 0) + rb.hp + sb.hp,
        mp: 100 + (mods.mp ?? 0) + rb.mp + sb.mp, maxMp: 100 + (mods.mp ?? 0) + rb.mp + sb.mp,
        divine: 10 + (mods.divine ?? 0) + rb.divine + sb.divine,
        physique: 10 + (mods.physique ?? 0) + rb.physique + sb.physique,
        bone: 10 + (mods.bone ?? 0) + rb.bone + sb.bone,
        wisdom: 10 + (mods.wisdom ?? 0) + rb.wisdom + sb.wisdom,
      },
      innateTalent: selectedTalent?.name ?? '',
    };
    onComplete(player);
  };

  const canNext = () => {
    if (step === 0) return !!sectId;
    if (step === 1) return pointsLeft === 0;
    if (step === 2) return daoName.length >= 2 && daoName.length <= 6 && !!talentId;
    return true;
  };

  const STEPS = ['门派出身', '灵根测试', '基础信息', '确认入道'];
  const COLORS: Record<SpiritRoot, string> = {
    metal: 'linear-gradient(90deg, #b8860b, #ffd700)', wood: 'linear-gradient(90deg, #228b22, #32cd32)',
    water: 'linear-gradient(90deg, #1e90ff, #00bfff)', fire: 'linear-gradient(90deg, #dc143c, #ff6347)',
    earth: 'linear-gradient(90deg, #8b4513, #daa520)',
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink-black">
      <StarField count={50} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(30,20,50,0.4)_0%,transparent_60%)]" />
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-faded-gold/40 bg-mystic-azure/50">
        <button onClick={onCancel} className="flex items-center gap-2 text-mist-gray hover:text-scroll-white transition-colors"><ArrowLeft size={18} /><span className="font-ui text-sm">返回</span></button>
        <h1 className="font-title text-xl text-celestial-gold tracking-wider">踏入仙途</h1>
        <div className="w-16" />
      </div>
      <div className="relative z-10 flex items-center justify-center gap-3 py-4">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i <= step ? 'bg-celestial-gold shadow-[0_0_6px_rgba(212,168,67,0.5)]' : 'bg-mist-gray/30'}`} />
              <span className={`text-xs font-ui ${i <= step ? 'text-celestial-gold' : 'text-mist-gray/50'}`}>{label}</span>
            </div>
            {i < 3 && <div className={`w-8 h-px ${i < step ? 'bg-celestial-gold/60' : 'bg-mist-gray/20'}`} />}
          </div>
        ))}
      </div>
      <div className="relative z-10 flex-1 overflow-y-auto px-6 py-4">
        {/* Step 0 */}
        {step === 0 && (
          <div className="max-w-4xl mx-auto">
            <p className="text-center text-sm font-body text-mist-gray/60 mb-6">选择你出身的宗门，影响初始功法和属性倾向</p>
            <div className="grid grid-cols-3 gap-4">
              {SECTS_DATA.map((sect) => (
                <button key={sect.id} onClick={() => setSectId(sect.id)}
                  className={`relative p-5 rounded-lg text-center transition-all duration-300 bg-gradient-to-br ${sect.color} hover:scale-[1.03] ${sectId === sect.id ? 'scale-[1.03] ring-2 ring-celestial-gold/60 shadow-celestial-glow' : 'opacity-70 hover:opacity-100'}`}>
                  <div className="absolute inset-0 bg-ink-black/30 rounded-lg" />
                  <div className="relative z-10">
                    <sect.icon size={32} className="mx-auto text-scroll-white mb-2" />
                    <h3 className="font-title text-lg text-scroll-white">{sect.name}</h3>
                    <span className="text-[10px] font-ui text-scroll-white/60">{sect.type}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        {/* Step 1 */}
        {step === 1 && (
          <div className="max-w-md mx-auto">
            <p className="text-center text-sm font-body text-mist-gray/60 mb-2">分配灵根天赋点数</p>
            <p className="text-center text-xs font-ui text-celestial-gold mb-6">剩余点数: {pointsLeft}</p>
            <div className="space-y-4">
              {(Object.keys(SPIRIT_ROOT_NAMES) as SpiritRoot[]).map((root) => (
                <div key={root} className="flex items-center gap-3">
                  <span className="w-8 text-sm font-title text-celestial-gold">{SPIRIT_ROOT_NAMES[root]}</span>
                  <button onClick={() => handleSpiritChange(root, -1)} className="w-8 h-8 rounded border border-faded-gold/30 text-mist-gray hover:text-scroll-white hover:border-celestial-gold/60 transition-colors font-ui">−</button>
                  <div className="flex-1 h-3 bg-ink-black rounded-sm border border-faded-gold/10 overflow-hidden">
                    <div className="h-full rounded-sm transition-all duration-300" style={{ width: `${(spiritRoots[root] / 10) * 100}%`, background: COLORS[root] }} />
                  </div>
                  <button onClick={() => handleSpiritChange(root, 1)} disabled={pointsLeft <= 0} className="w-8 h-8 rounded border border-faded-gold/30 text-mist-gray hover:text-scroll-white hover:border-celestial-gold/60 transition-colors font-ui disabled:opacity-30">+</button>
                  <span className="w-6 text-center text-sm font-ui text-scroll-white">{spiritRoots[root]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Step 2 */}
        {step === 2 && (
          <div className="max-w-md mx-auto space-y-6">
            <div>
              <label className="block text-sm font-ui text-mist-gray mb-2">道号</label>
              <input type="text" value={daoName} onChange={(e) => setDaoName(e.target.value)} maxLength={6} placeholder="2-6字道号" className="w-full input-field text-center text-lg font-title" />
            </div>
            <div>
              <label className="block text-sm font-ui text-mist-gray mb-2">性别</label>
              <div className="flex gap-3">
                {(['男', '女'] as const).map((g) => (
                  <button key={g} onClick={() => setGender(g)} className={`flex-1 py-2.5 rounded border text-sm font-ui transition-all ${gender === g ? 'border-celestial-gold/60 text-celestial-gold bg-celestial-gold/5' : 'border-faded-gold/30 text-mist-gray hover:border-celestial-gold/30'}`}>{g}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-ui text-mist-gray mb-2">初始天赋</label>
              <div className="space-y-2">
                {TALENTS.map((t) => (
                  <button key={t.id} onClick={() => setTalentId(t.id)} className={`w-full text-left p-3 rounded border transition-all ${talentId === t.id ? 'border-celestial-gold/60 bg-celestial-gold/5' : 'border-faded-gold/30 bg-deep-ink/50 hover:border-celestial-gold/30'}`}>
                    <div className="font-title text-sm text-scroll-white">{t.name}</div>
                    <div className="text-xs font-body text-mist-gray/60 mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* Step 3 */}
        {step === 3 && (
          <div className="max-w-md mx-auto space-y-4">
            <p className="text-center text-sm font-body text-mist-gray/60 mb-4">确认你的入道选择</p>
            <div className="p-4 rounded-lg bg-deep-ink/50 border border-faded-gold/30 space-y-3">
              {[
                ['宗门', selectedSect?.name ?? ''], ['道号', daoName], ['性别', gender], ['天赋', selectedTalent?.name ?? ''],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between"><span className="text-xs font-ui text-mist-gray">{label}</span><span className="text-sm font-body text-scroll-white">{val}</span></div>
              ))}
              <div className="border-t border-faded-gold/20 pt-2">
                <span className="text-xs font-ui text-mist-gray">灵根</span>
                <div className="flex gap-2 mt-1">{(Object.keys(SPIRIT_ROOT_NAMES) as SpiritRoot[]).map((root) => (
                  <span key={root} className="text-xs font-ui text-scroll-white">{SPIRIT_ROOT_NAMES[root]}:{spiritRoots[root]}</span>
                ))}</div>
              </div>
            </div>
            <button onClick={handleComplete} className="w-full rune-button text-base py-3 !text-lg !font-title">踏入仙途</button>
          </div>
        )}
      </div>
      <div className="relative z-10 flex justify-center gap-4 py-4 border-t border-faded-gold/40 bg-mystic-azure/50">
        {step > 0 && <button onClick={() => setStep(step - 1)} className="rune-button text-sm flex items-center gap-1.5"><ArrowLeft size={14} />上一步</button>}
        {step < 3 && <button onClick={() => setStep(step + 1)} disabled={!canNext()} className="rune-button text-sm flex items-center gap-1.5 disabled:opacity-30"><ArrowRight size={14} />下一步</button>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript and commit**

```bash
npx tsc --noEmit
git add src/components/Character/CharacterCreation.tsx
git commit -m "feat: add 4-step CharacterCreation wizard with sect, spirit roots, and talent selection

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 18: Enhanced Toast System

**Files:**
- Modify: `src/components/Cultivation/Toast.tsx` — replace entire file

- [ ] **Step 1: Rewrite Toast.tsx**

Replace the file with the enhanced version that includes per-type lucide icons (CheckCircle/Info/AlertTriangle/XCircle), bottom progress bar animation, max-3 stack enforcement, and manual close button on each toast. See the full code in previous task outline.

- [ ] **Step 2: Verify TypeScript and commit**

```bash
npx tsc --noEmit
git add src/components/Cultivation/Toast.tsx
git commit -m "feat: enhance Toast with icons, progress bar, type colors, and max-3 stack

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 19: Reskin Existing Modals

**Files:**
- Modify: `src/components/SillyTavern/ChatModal.tsx`
- Modify: `src/components/SillyTavern/SettingsModal.tsx`

- [ ] **Step 1: Replace ✕ text with X icon, update terminology**

In ChatModal: add `import { X } from 'lucide-react'`, replace `{'✕'}` with `<X size={18} />`, change title from `'论道纪要'` to `'修炼历程'`. In SettingsModal: ensure close uses `<X size={18} />` from lucide.

- [ ] **Step 2: Verify build and commit**

```bash
npx tsc --noEmit && npx vite build 2>&1 | tail -5
git add src/components/SillyTavern/ChatModal.tsx src/components/SillyTavern/SettingsModal.tsx
git commit -m "style: reskin modals with lucide icons and cultivation terminology

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 20: Rewrite App.tsx — Wire Everything Together

**Files:**
- Modify: `src/App.tsx` — full rewrite

- [ ] **Step 1: Replace App.tsx**

Rewrite App.tsx to use `useGameState` hook, render `SplashScreen` → `SectOrbitView` → `SectDetailView` → `GameShell` based on view state, handle modals (settings/lorebooks/presets/sessions), wire `CharacterCreation` flow, preserve existing `useSillytavern` integration. See full code in previous task outline.

- [ ] **Step 2: Verify build and commit**

```bash
npx tsc --noEmit && npx vite build 2>&1 | tail -10
git add src/App.tsx
git commit -m "feat: wire all views, modals, character creation, and state into App shell

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 21: Integration Testing & Polish

- [ ] **Step 1: Run full TypeScript check and fix any errors**

```bash
npx tsc --noEmit
```

- [ ] **Step 2: Run full production build**

```bash
npx vite build
```

- [ ] **Step 3: Start dev server and manually verify all views and interactions**

```bash
npx vite --host 0.0.0.0
```

Manual checklist:
- Splash → door opens → title shows → fades to orbit
- Orbit: 9 nodes rotating, nodes stay upright, dual rings, left panel
- Hover sect → panel shows info, click → detail view
- Detail: subsect orbit, back button
- Click subsect → character creation (if no player) → 4 steps
- GameShell: sidebar tabs, chat/character/skills panels all working
- Toast notifications, all modals

- [ ] **Step 4: Fix any issues found**

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: fix integration issues and polish all components

Co-Authored-By: Claude <noreply@anthropic.com>"
```


---

## Self-Review Summary

**1. Spec coverage:** All 8 design sections + types/state + CSS map to tasks: Info Architecture → Task 20, SplashScreen → Task 5, SectOrbitView → Tasks 6-9, SectDetailView → Task 10, GameShell → Tasks 12-16, CharacterCreation → Task 17, Toast → Task 18, Modals → Tasks 11/19, Types/Data → Task 1, State → Task 2, CSS → Task 3, StarField → Task 4.

**2. Placeholder scan:** Tasks 18 and 20 reference full code in the task body above — the implementer has complete code for all tasks. Toast.tsx rewrite follows the same pattern as the existing file with icon/progress additions.

**3. Type consistency:** PlayerData, GameState, SidebarTab, SpiritRoot, ModalType defined in Task 1 and consistently referenced across all tasks. useGameState().actions API defined in Task 2, consumed by Task 20.

No unresolved gaps or contradictions.
