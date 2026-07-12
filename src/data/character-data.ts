import type { SpiritRoot, Talent } from '../types/game';

export const SPIRIT_ROOT_NAMES: Record<SpiritRoot, string> = {
  metal: '金',
  wood: '木',
  water: '水',
  fire: '火',
  earth: '土',
};

export const TALENTS: Talent[] = [
  { id: 'sword-heart', name: '剑心通明', desc: '天生对剑道有超凡领悟，修炼剑法事半功倍' },
  { id: 'alchemy-genius', name: '丹道奇才', desc: '炼丹天赋异禀，成丹率大幅提升' },
  { id: 'innate-strength', name: '天生神力', desc: '体魄异于常人，气血充沛远超同辈' },
  { id: 'array-master', name: '阵道天才', desc: '对阵法的感知力极强，布阵速度加倍' },
  { id: 'talisman-expert', name: '符箓精通', desc: '绘制符箓如有神助，符箓威力提升' },
];

export const REALMS: string[] = [
  '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫', '真仙',
];

export const SECT_STAT_MODIFIERS: Record<string, Partial<{
  hp: number; mp: number; divine: number; physique: number; bone: number; wisdom: number;
}>> = {
  qingyun: { hp: 10, divine: 3, wisdom: 2 },
  liuli: { mp: 15, divine: 2, wisdom: 3 },
  fenxiang: { hp: 15, physique: 3, bone: 2 },
  shushan: { hp: 5, divine: 4, wisdom: 3 },
  xuantian: { mp: 10, divine: 4, bone: 1 },
  yaowang: { hp: 5, mp: 5, wisdom: 5 },
  tianmo: { hp: 20, physique: 3, bone: 2 },
  hehuan: { mp: 15, divine: 3, wisdom: 1 },
  yinsha: { hp: 10, mp: 5, bone: 4 },
};
