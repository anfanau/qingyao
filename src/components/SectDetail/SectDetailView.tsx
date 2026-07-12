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

        <div className="absolute" style={{ width: 0, height: 0, left: '50%', top: '50%' }}>
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
