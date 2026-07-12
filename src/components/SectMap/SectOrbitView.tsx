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

      <div className="flex-1 flex overflow-hidden min-h-0">
        <SectInfoPanel sect={displaySect} onEnterDetail={() => { if (hoveredSectId) onSelectSect(hoveredSectId); }} />

        <div className="flex-1 relative flex items-center justify-center overflow-hidden min-w-0">
          <StarField count={60} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(30,20,50,0.4)_0%,transparent_60%)]" />

          <OrbitRing radius={ORBIT_RADIUS} color="gold" animationClass="animate-orbit-60" />
          <OrbitRing radius={ORBIT_RADIUS + 30} color="cyan" animationClass="animate-orbit-80" />

          {/* Static node container — nodes are positioned in a circle, not rotating */}
          <div className="absolute" style={{ left: '50%', top: '50%', width: 0, height: 0 }}>
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
