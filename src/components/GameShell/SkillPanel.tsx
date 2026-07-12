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
