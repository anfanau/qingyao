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
