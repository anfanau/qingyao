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
