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
