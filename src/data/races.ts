import { Vec2 } from "../utils/math";

// 种族模板：定义基础属性修正和特殊能力
export interface Race {
  id: string;
  name: string;
  description: string;
  // 基础属性修正（相对于默认值）
  hpMod: number;      // 血量倍率
  spdMod: number;     // 速度倍率
  dmgMod: number;     // 伤害倍率
  xpMod: number;      // 经验获取倍率
  color: string;      // 渲染颜色
  special: string;    // 种族特性描述
}

export const RACES: Race[] = [
  {
    id: "human",
    name: "人类",
    description: "平衡全能 · 经验获取 +20%",
    hpMod: 1.0,
    spdMod: 1.0,
    dmgMod: 1.0,
    xpMod: 1.2,
    color: "#4fc3f7",
    special: "经验加成：击杀经验 +20%，升级更快",
  },
  {
    id: "elf",
    name: "精灵",
    description: "高敏低血 · 攻速/移速 +25%",
    hpMod: 0.75,
    spdMod: 1.25,
    dmgMod: 0.9,
    xpMod: 1.0,
    color: "#81c784",
    special: "疾风步：移速更快，体型更小 (半径 -3)",
  },
  {
    id: "orc",
    name: "兽人",
    description: "血厚攻高 · 生命 +40%，伤害 +15%",
    hpMod: 1.4,
    spdMod: 0.85,
    dmgMod: 1.15,
    xpMod: 0.9,
    color: "#ff7043",
    special: "狂暴体质：受伤后 2 秒内伤害 +30%",
  },
];

// 获取种族
export function getRace(id: string): Race {
  return RACES.find((r) => r.id === id) ?? RACES[0];
}
