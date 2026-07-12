import { useState } from 'react';
import { Settings, BookOpen, ScrollText, Layers } from 'lucide-react';
import { SECTS_DATA } from '../../data/sects-data';
import type { SectData, SubsectData } from '../../data/sects-data';

interface SectMapViewProps {
  onOpenSettings: () => void;
  onOpenLorebooks: () => void;
  onOpenPresets: () => void;
  onOpenSessions: () => void;
  onEnterSubsect: (sectName: string, subsectName: string) => void;
}

export function SectMapView({
  onOpenSettings,
  onOpenLorebooks,
  onOpenPresets,
  onOpenSessions,
  onEnterSubsect,
}: SectMapViewProps) {
  const [selectedSectId, setSelectedSectId] = useState<string | null>(null);

  const selectedSect: SectData | null = selectedSectId
    ? SECTS_DATA.find((s) => s.id === selectedSectId) ?? null
    : null;

  const handleSectClick = (id: string) => {
    setSelectedSectId((prev) => (prev === id ? null : id));
  };

  const handleSubsectClick = (sect: SectData, sub: SubsectData) => {
    onEnterSubsect(sect.name, sub.name);
  };

  return (
    <div className="flex flex-col h-screen bg-ink-black">
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-faded-gold/40 bg-mystic-azure/50">
        <h1 className="font-title text-2xl text-celestial-gold tracking-widest drop-shadow-[0_0_6px_rgba(212,168,67,0.3)]">
          仙途
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSessions}
            className="p-2 rounded text-mist-gray hover:text-celestial-gold hover:bg-faded-gold/30 transition-colors"
            title="修练历程"
          >
            <Layers size={18} />
          </button>
          <button
            onClick={onOpenLorebooks}
            className="p-2 rounded text-mist-gray hover:text-celestial-gold hover:bg-faded-gold/30 transition-colors"
            title="典籍"
          >
            <BookOpen size={18} />
          </button>
          <button
            onClick={onOpenPresets}
            className="p-2 rounded text-mist-gray hover:text-celestial-gold hover:bg-faded-gold/30 transition-colors"
            title="法门"
          >
            <ScrollText size={18} />
          </button>
          <button
            onClick={onOpenSettings}
            className="p-2 rounded text-mist-gray hover:text-celestial-gold hover:bg-faded-gold/30 transition-colors"
            title="设置"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* 3x3 Sect Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {SECTS_DATA.map((sect) => {
            const isSelected = selectedSectId === sect.id;
            const Icon = sect.icon;
            return (
              <div
                key={sect.id}
                onClick={() => handleSectClick(sect.id)}
                className={`
                  relative group cursor-pointer rounded-lg overflow-hidden
                  bg-gradient-to-br ${sect.color}
                  transition-all duration-300 ease-out
                  hover:scale-[1.03]
                  ${isSelected
                    ? 'scale-[1.03] ring-2 ring-celestial-gold/60 shadow-celestial-glow'
                    : sect.glow
                  }
                `}
              >
                {/* Dark overlay for readability */}
                <div className="absolute inset-0 bg-ink-black/40 group-hover:bg-ink-black/20 transition-colors duration-300" />

                {/* Content */}
                <div className="relative z-10 p-5 flex flex-col items-center text-center gap-2">
                  <div className="p-2 rounded-full bg-ink-black/40 backdrop-blur-sm">
                    <Icon size={28} className="text-scroll-white drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]" />
                  </div>
                  <h2 className="font-title text-xl text-scroll-white tracking-wider">
                    {sect.name}
                  </h2>
                  <span
                    className={`
                      inline-block px-2.5 py-0.5 text-[11px] font-ui tracking-wider rounded-full border
                      ${sect.type === '正道'
                        ? 'border-celestial-gold/60 text-celestial-gold'
                        : 'border-vermil-red/60 text-vermil-red'
                      }
                    `}
                  >
                    {sect.type}
                  </span>
                  <p className="text-xs text-mist-gray/80 font-body leading-relaxed line-clamp-2">
                    {sect.desc}
                  </p>
                </div>

                {/* Bottom accent line */}
                <div
                  className={`
                    absolute bottom-0 left-0 right-0 h-0.5
                    ${sect.type === '正道'
                      ? 'bg-celestial-gold/60'
                      : 'bg-vermil-red/60'
                    }
                    scale-x-0 group-hover:scale-x-100 transition-transform duration-300
                    ${isSelected ? 'scale-x-100' : ''}
                  `}
                />
              </div>
            );
          })}
        </div>

        {/* Subsect cards — animate in when a sect is selected */}
        <div className="overflow-hidden transition-all duration-400">
          {selectedSect && (
            <div className="max-w-5xl mx-auto mt-8 animate-slide-up">
              <div className="mb-4 text-center">
                <span className="font-title text-base text-celestial-gold/70 tracking-wider">
                  — {selectedSect.name} 下属宗门 —
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {selectedSect.subs.map((sub) => (
                  <button
                    key={sub.name}
                    onClick={() => handleSubsectClick(selectedSect, sub)}
                    className={`
                      text-left p-4 rounded-lg border transition-all duration-300
                      bg-mystic-azure/60 border-faded-gold/30
                      hover:border-celestial-gold/50 hover:shadow-spirit-glow
                      hover:scale-[1.02] group/sub
                    `}
                  >
                    <h3 className="font-title text-base text-scroll-white mb-1 group-hover/sub:text-celestial-gold transition-colors">
                      {sub.name}
                    </h3>
                    <p className="text-xs text-mist-gray/70 font-body leading-relaxed">
                      {sub.desc}
                    </p>
                    <div className="mt-2 text-[10px] font-ui text-celestial-gold/50 group-hover/sub:text-celestial-gold transition-colors">
                      进入神识交流 →
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
