import type { ConstructId, RuntimeSupplyId } from "./runSupplyTypes";

export const RUN_SUPPLY_WORLD = {
  width: 2400,
  height: 2400,
};

const CLEAR_RUNTIME_PHASES = new Set(["menu", "meta_upgrade", "result"]);

export const SUPPLY_LABELS: Record<RuntimeSupplyId, string> = {
  magnet: "磁铁",
  shield: "护盾",
  haste_potion: "急速药剂",
  power_potion: "攻击药剂",
  health_pack: "血包",
  regen_dew: "回春露",
  crit_potion: "暴击药剂",
  frost_bomb: "冰霜炸弹",
  thunder_stone: "雷击符石",
  quake_stone: "地裂符石",
  decoy_doll: "诱饵人偶",
  turret_pack: "机械炮台",
};

export const SUPPLY_COLORS: Record<RuntimeSupplyId, string> = {
  magnet: "#42a5f5",
  shield: "#80deea",
  haste_potion: "#ffd54f",
  power_potion: "#ff8a65",
  health_pack: "#66bb6a",
  regen_dew: "#81c784",
  crit_potion: "#ffeb3b",
  frost_bomb: "#90caf9",
  thunder_stone: "#b388ff",
  quake_stone: "#bc8f5a",
  decoy_doll: "#ffcc80",
  turret_pack: "#4dd0e1",
};

export const BOSS_BONUS_SUPPLY_POOL: RuntimeSupplyId[] = [
  "haste_potion",
  "power_potion",
  "crit_potion",
  "frost_bomb",
  "regen_dew",
  "thunder_stone",
  "quake_stone",
  "turret_pack",
];

export function shouldClearRunSupplyOnPhase(phase: string): boolean {
  return CLEAR_RUNTIME_PHASES.has(phase);
}

export function getSupplyLabel(id: RuntimeSupplyId): string {
  return SUPPLY_LABELS[id];
}

export function getSupplyColor(id: RuntimeSupplyId | ConstructId): string {
  return SUPPLY_COLORS[id];
}

export function pickRuntimeSupplyId(hpRate: number, roll = Math.random()): RuntimeSupplyId {
  if (hpRate < 0.38) {
    if (roll < 0.28) return "health_pack";
    if (roll < 0.44) return "regen_dew";
    if (roll < 0.58) return "shield";
    if (roll < 0.7) return "decoy_doll";
  }

  if (roll < 0.14) return "magnet";
  if (roll < 0.27) return "haste_potion";
  if (roll < 0.4) return "power_potion";
  if (roll < 0.51) return "health_pack";
  if (roll < 0.61) return "regen_dew";
  if (roll < 0.7) return "crit_potion";
  if (roll < 0.78) return "shield";
  if (roll < 0.85) return "frost_bomb";
  if (roll < 0.91) return "thunder_stone";
  if (roll < 0.96) return "quake_stone";
  if (roll < 0.985) return "decoy_doll";
  return "turret_pack";
}

export function pickBossBonusSupplyId(roll = Math.random()): RuntimeSupplyId {
  return BOSS_BONUS_SUPPLY_POOL[Math.floor(roll * BOSS_BONUS_SUPPLY_POOL.length)] ?? "regen_dew";
}
