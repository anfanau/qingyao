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
