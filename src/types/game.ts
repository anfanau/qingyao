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
