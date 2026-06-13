export type DifficultyId = "rookie" | "normal" | "hard" | "nightmare" | "hell";

export interface DifficultyDef {
  id: DifficultyId;
  name: string;
  subtitle: string;
  description: string;
  color: string;
  enemyCountMult: number;
  hpMult: number;
  speedMult: number;
  damageMult: number;
  eliteBonus: number;
  rangedBonus: number;
  bossPatternMult: number;
  soulRewardMult: number;
}

const KEY = "game.difficulty";

export const DIFFICULTIES: DifficultyDef[] = [
  {
    id: "rookie",
    name: "新手",
    subtitle: "轻松熟悉",
    description: "敌人少、成长慢，适合测试和熟悉流派。",
    color: "#81c784",
    enemyCountMult: 0.72,
    hpMult: 0.72,
    speedMult: 0.88,
    damageMult: 0.72,
    eliteBonus: -0.12,
    rangedBonus: -0.12,
    bossPatternMult: 0.72,
    soulRewardMult: 0.75,
  },
  {
    id: "normal",
    name: "正常",
    subtitle: "标准体验",
    description: "默认难度，适合大多数局内成长体验。",
    color: "#42a5f5",
    enemyCountMult: 1,
    hpMult: 1,
    speedMult: 1,
    damageMult: 1,
    eliteBonus: 0,
    rangedBonus: 0,
    bossPatternMult: 1,
    soulRewardMult: 1,
  },
  {
    id: "hard",
    name: "困难",
    subtitle: "压力上升",
    description: "怪更多、更硬，精英和远程出现更早。",
    color: "#ffb74d",
    enemyCountMult: 1.22,
    hpMult: 1.22,
    speedMult: 1.08,
    damageMult: 1.12,
    eliteBonus: 0.08,
    rangedBonus: 0.08,
    bossPatternMult: 1.18,
    soulRewardMult: 1.25,
  },
  {
    id: "nightmare",
    name: "噩梦",
    subtitle: "压迫围杀",
    description: "怪物数量和强度大幅提高，Boss 弹幕更密。",
    color: "#ef5350",
    enemyCountMult: 1.48,
    hpMult: 1.52,
    speedMult: 1.18,
    damageMult: 1.28,
    eliteBonus: 0.16,
    rangedBonus: 0.14,
    bossPatternMult: 1.42,
    soulRewardMult: 1.6,
  },
  {
    id: "hell",
    name: "地狱",
    subtitle: "成型挑战",
    description: "为后期成型流派准备，敌潮密集且 Boss 极具压迫。",
    color: "#d500f9",
    enemyCountMult: 1.82,
    hpMult: 1.95,
    speedMult: 1.3,
    damageMult: 1.48,
    eliteBonus: 0.28,
    rangedBonus: 0.22,
    bossPatternMult: 1.72,
    soulRewardMult: 2.15,
  },
];

export function getDifficulty(id: DifficultyId): DifficultyDef {
  return DIFFICULTIES.find((d) => d.id === id) ?? DIFFICULTIES[1];
}

export function getCurrentDifficultyId(): DifficultyId {
  try {
    const raw = window.localStorage.getItem(KEY) as DifficultyId | null;
    if (raw && DIFFICULTIES.some((d) => d.id === raw)) return raw;
  } catch {
    // localStorage 不可用时使用默认难度。
  }
  return "normal";
}

export function getCurrentDifficulty(): DifficultyDef {
  return getDifficulty(getCurrentDifficultyId());
}

export function setCurrentDifficulty(id: DifficultyId): DifficultyDef {
  const def = getDifficulty(id);
  try {
    window.localStorage.setItem(KEY, def.id);
  } catch {
    // localStorage 不可用时只返回选择结果。
  }
  return def;
}
