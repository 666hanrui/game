// 种族模板：种族不是皮肤，而是身体底子、成长曲线和天赋
export type RaceGrowth = "balanced" | "early" | "late" | "agile" | "brute";

export interface Race {
  id: string;
  name: string;
  description: string;

  // 基础属性修正（人族 = 1.0 基准）
  hpMod: number;      // 血量倍率
  spdMod: number;     // 移动速度倍率
  dmgMod: number;     // 伤害倍率
  xpMod: number;      // 经验获取倍率
  radiusMod: number;  // 体型倍率，越大越容易被碰撞

  // 成长属性：升级时额外获得的身体成长
  hpGrowth: number;       // 每级额外最大生命
  dmgGrowth: number;      // 每级额外伤害
  speedGrowth: number;    // 每级额外速度

  growth: RaceGrowth;
  color: string;
  talentName: string;
  special: string;
}

export const RACES: Race[] = [
  {
    id: "human",
    name: "人族",
    description: "标准基准 · 稳定成长",
    hpMod: 1.0,
    spdMod: 1.0,
    dmgMod: 1.0,
    xpMod: 1.15,
    radiusMod: 1.0,
    hpGrowth: 6,
    dmgGrowth: 1.2,
    speedGrowth: 0.8,
    growth: "balanced",
    color: "#4fc3f7",
    talentName: "适应力",
    special: "适应力：经验获取 +15%，没有明显短板，适合作为基础模板",
  },
  {
    id: "goblin",
    name: "哥布林族",
    description: "前期强势 · 体魄好但敏捷差",
    hpMod: 1.25,
    spdMod: 0.88,
    dmgMod: 1.1,
    xpMod: 0.95,
    radiusMod: 1.12,
    hpGrowth: 7,
    dmgGrowth: 1.0,
    speedGrowth: 0.25,
    growth: "early",
    color: "#8bc34a",
    talentName: "蛮劲",
    special: "蛮劲：开局血量和伤害更高，但体型更大、敏捷成长较低，前期舒服后期靠装备补短板",
  },
  {
    id: "elf",
    name: "精灵族",
    description: "高敏低血 · 后期灵活",
    hpMod: 0.78,
    spdMod: 1.25,
    dmgMod: 0.92,
    xpMod: 1.0,
    radiusMod: 0.86,
    hpGrowth: 4,
    dmgGrowth: 1.0,
    speedGrowth: 1.4,
    growth: "agile",
    color: "#81c784",
    talentName: "疾风步",
    special: "疾风步：移速更快、体型更小，但血量偏低，适合走高操作和风筝路线",
  },
  {
    id: "orc",
    name: "兽人族",
    description: "厚重强攻 · 后期体魄成长高",
    hpMod: 1.45,
    spdMod: 0.82,
    dmgMod: 1.18,
    xpMod: 0.9,
    radiusMod: 1.22,
    hpGrowth: 10,
    dmgGrowth: 1.6,
    speedGrowth: 0.15,
    growth: "brute",
    color: "#ff7043",
    talentName: "强壮体魄",
    special: "强壮体魄：血量和伤害成长高，但体型大、速度慢，适合硬顶和高伤路线",
  },
  {
    id: "spirit",
    name: "灵族",
    description: "前期脆弱 · 后期成长强",
    hpMod: 0.72,
    spdMod: 1.05,
    dmgMod: 0.85,
    xpMod: 1.08,
    radiusMod: 0.92,
    hpGrowth: 5,
    dmgGrowth: 2.0,
    speedGrowth: 0.9,
    growth: "late",
    color: "#ce93d8",
    talentName: "灵能成长",
    special: "灵能成长：开局弱，但升级后伤害成长更高，适合后期爆发构筑",
  },
];

export function getRace(id: string): Race {
  return RACES.find((r) => r.id === id) ?? RACES[0];
}
