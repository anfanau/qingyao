// src/components/GameShell/GameShell.tsx
import { Sidebar } from './Sidebar';
import { ChatPanel } from './ChatPanel';
import { CharacterPanel } from './CharacterPanel';
import { SkillPanel } from './SkillPanel';
import { StarField } from '../Splash/StarField';
import { REALMS } from '../../data/character-data';
import { Settings } from 'lucide-react';
import type { SidebarTab, PlayerData } from '../../types/game';

interface GameShellProps {
  sectName: string;
  subsectName: string;
  activeTab: SidebarTab;
  player: PlayerData | null;
  onTabChange: (tab: SidebarTab) => void;
  onExit: () => void;
  onOpenSettings: () => void;
}

export function GameShell({ sectName, subsectName, activeTab, player, onTabChange, onExit, onOpenSettings }: GameShellProps) {
  const realmName = player ? (REALMS[player.realmIndex] ?? '未知') : '';
  return (
    <div className="flex flex-col h-screen bg-ink-black overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-faded-gold/40 bg-mystic-azure/60 shrink-0">
        <div>
          <h1 className="font-title text-lg text-celestial-gold tracking-wider leading-tight">{sectName} · {subsectName}</h1>
          {player && <p className="text-[11px] font-ui text-mist-gray/60">{player.daoName} · {realmName}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onOpenSettings} className="p-2 rounded text-mist-gray hover:text-celestial-gold hover:bg-faded-gold/30 transition-colors" title="设置">
            <Settings size={18} />
          </button>
          <button onClick={onExit} className="px-3 py-1.5 text-xs font-ui rounded border transition-colors border-faded-gold/40 text-mist-gray hover:text-scroll-white hover:border-celestial-gold/50 hover:bg-faded-gold/20">退出修炼</button>
        </div>
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
