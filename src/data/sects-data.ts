import type { LucideIcon } from 'lucide-react';
import { CloudLightning, Sparkles, Flame, Swords, Compass, Sprout, Ghost, Flower2, MoonStar } from 'lucide-react';

export interface SubsectData {
  name: string;
  desc: string;
}

export interface SectData {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  glow: string;
  type: '正道' | '邪道';
  desc: string;
  subs: SubsectData[];
}

export const SECTS_DATA: SectData[] = [
  { id: 'qingyun', name: '青云门', icon: CloudLightning, color: 'from-cyan-400 to-blue-600', glow: 'shadow-cyan-500/50', type: '正道', desc: '天下正道之首，主修太极玄清道，剑法通神，御雷而行。', subs: [{name: '天枢宗', desc: '执掌宗门机要枢纽'}, {name: '落霞宗', desc: '功法如晚霞绚烂莫测'}, {name: '凌云宗', desc: '剑意凌厉，直冲云霄'}] },
  { id: 'liuli', name: '琉璃宫', icon: Sparkles, color: 'from-blue-300 to-indigo-500', glow: 'shadow-blue-500/50', type: '正道', desc: '避世清修之地，功法轻灵飘逸，擅长冰系与幻术。', subs: [{name: '水月宗', desc: '心如止水，主修冰心诀'}, {name: '飞仙宗', desc: '剑术超群，追求飞升大道'}, {name: '冰心宗', desc: '疗愈圣地，炼制无上仙丹'}] },
  { id: 'fenxiang', name: '焚香谷', icon: Flame, color: 'from-orange-500 to-red-600', glow: 'shadow-orange-500/50', type: '正道', desc: '镇守南疆，修炼八荒玄火，功法刚猛无匹。', subs: [{name: '烬炎宗', desc: '火系功法极致，炎阳真气'}, {name: '离火宗', desc: '炼器宗师聚集地'}, {name: '南明宗', desc: '掌控南明离火，焚尽万物'}] },
  { id: 'shushan', name: '蜀山剑派', icon: Swords, color: 'from-zinc-300 to-slate-500', glow: 'shadow-slate-400/50', type: '正道', desc: '剑修圣地，以剑入道，万剑归宗。', subs: [{name: '纯阳剑宗', desc: '主修阳刚剑气，破邪显正'}, {name: '太乙剑宗', desc: '剑法轻灵，变化万千'}, {name: '玄元剑宗', desc: '剑气绵长，生生不息'}] },
  { id: 'xuantian', name: '玄天宗', icon: Compass, color: 'from-amber-300 to-yellow-600', glow: 'shadow-amber-500/50', type: '正道', desc: '观星测命，参悟天地造化，功法暗合天道。', subs: [{name: '太虚宗', desc: '参悟太虚幻境，虚实难测'}, {name: '北斗宗', desc: '研习周天星斗大阵'}, {name: '紫微宗', desc: '掌门一脉，推演天机'}] },
  { id: 'yaowang', name: '药王谷', icon: Sprout, color: 'from-green-400 to-emerald-600', glow: 'shadow-green-500/50', type: '正道', desc: '悬壶济世，炼丹术天下无双，掌握生死人肉白骨之术。', subs: [{name: '百草宗', desc: '培育天下灵草奇药'}, {name: '青囊宗', desc: '精研医理，救死扶伤'}, {name: '济世宗', desc: '云游天下，悬壶济世'}] },
  { id: 'tianmo', name: '天魔宗', icon: Ghost, color: 'from-purple-700 to-gray-900', glow: 'shadow-purple-700/50', type: '邪道', desc: '魔道巨擘，行事狠辣，功法诡异莫测，吸纳天地戾气。', subs: [{name: '血魂宗', desc: '主修血道功法，嗜血好战'}, {name: '幽冥宗', desc: '沟通幽冥，修炼鬼道神魂'}, {name: '万魔宗', desc: '海纳百川，聚集天下魔修'}] },
  { id: 'hehuan', name: '合欢派', icon: Flower2, color: 'from-pink-400 to-rose-600', glow: 'shadow-pink-500/50', type: '邪道', desc: '阴阳双修，擅长魅惑与采补，门下弟子皆容貌妖冶。', subs: [{name: '绮罗宗', desc: '修炼幻术，织梦成真'}, {name: '幻情宗', desc: '红尘历练，玩弄人心'}, {name: '极乐宗', desc: '双修圣地，亦是销金窟'}] },
  { id: 'yinsha', name: '阴煞宗', icon: MoonStar, color: 'from-teal-700 to-gray-800', glow: 'shadow-teal-600/50', type: '邪道', desc: '炼尸御魂，常年隐没于极阴之地，令人闻风丧胆。', subs: [{name: '白骨宗', desc: '收集天地奇异骸骨炼制法宝'}, {name: '万魂宗', desc: '聚集极阴之气，孕育强大怨灵'}, {name: '尸王宗', desc: '炼制刀枪不入的高阶金甲尸'}] },
];

export function findSectBySubsect(subsectName: string): { sect: SectData; sub: SubsectData } | null {
  for (const sect of SECTS_DATA) {
    const sub = sect.subs.find(s => s.name === subsectName);
    if (sub) return { sect, sub };
  }
  return null;
}
