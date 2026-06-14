import type { MetaTalentDef } from "../data/metaTalents";
import { MetaTalentProgress } from "./MetaTalentProgress";

export interface MetaTalentRuntimeBonuses {
  damageMult: number;
  attackSpeedMult: number;
  moveSpeedMult: number;
  maxHpMult: number;
  maxHpFlat: number;
  forceMaxHp?: number;
  oneHitFail: boolean;

  healingMult: number;
  killHealFlat: number;
  shieldMult: number;
  shieldBreakDamageMult: number;

  chestRewardMult: number;
  eliteSpawnMult: number;
  eliteBossDamageMult: number;

  summonSkeletonChance: number;
  summonDurationMult: number;
  turretCountBonus: number;
  turretIntervalMult: number;

  magicProcChance: number;
  magicDamageMult: number;
  martialUpgradeBias: number;
  armorBreakMult: number;

  lowHpAttackSpeedMult: number;
  lowHpMoveSpeedMult: number;
}

export interface MetaTalentRuntimeSnapshot {
  equippedTalents: MetaTalentDef[];
  bonuses: MetaTalentRuntimeBonuses;
  notes: string[];
}

export function createDefaultMetaTalentBonuses(): MetaTalentRuntimeBonuses {
  return {
    damageMult: 1,
    attackSpeedMult: 1,
    moveSpeedMult: 1,
    maxHpMult: 1,
    maxHpFlat: 0,
    oneHitFail: false,

    healingMult: 1,
    killHealFlat: 0,
    shieldMult: 1,
    shieldBreakDamageMult: 1,

    chestRewardMult: 1,
    eliteSpawnMult: 1,
    eliteBossDamageMult: 1,

    summonSkeletonChance: 0,
    summonDurationMult: 1,
    turretCountBonus: 0,
    turretIntervalMult: 1,

    magicProcChance: 0,
    magicDamageMult: 1,
    martialUpgradeBias: 0,
    armorBreakMult: 1,

    lowHpAttackSpeedMult: 1,
    lowHpMoveSpeedMult: 1,
  };
}

export class MetaTalentRuntime {
  constructor(private readonly progress = new MetaTalentProgress()) {}

  buildSnapshot(): MetaTalentRuntimeSnapshot {
    return buildMetaTalentRuntimeSnapshot(this.progress.getEquippedTalents());
  }
}

export function buildMetaTalentRuntimeSnapshot(equippedTalents: MetaTalentDef[]): MetaTalentRuntimeSnapshot {
  const bonuses = createDefaultMetaTalentBonuses();
  const notes: string[] = [];

  for (const talent of equippedTalents) {
    applyTalentRuntimeBonus(talent, bonuses, notes);
  }

  return { equippedTalents, bonuses, notes };
}

function applyTalentRuntimeBonus(talent: MetaTalentDef, bonuses: MetaTalentRuntimeBonuses, notes: string[]): void {
  switch (talent.id) {
    case "combo_chase":
      bonuses.damageMult *= 1.08;
      bonuses.attackSpeedMult *= 1.12;
      notes.push("连斩追击：连续击杀路线获得伤害和攻速倾向。");
      return;

    case "blood_return":
      bonuses.killHealFlat += 1;
      bonuses.healingMult *= 1.12;
      notes.push("血影回流：击杀与暴击类回复效果增强。");
      return;

    case "solo_strike":
      bonuses.damageMult *= 2.15;
      bonuses.forceMaxHp = 1;
      bonuses.oneHitFail = true;
      notes.push("孤注一击：攻击力大幅提高，但最大生命固定为 1。");
      return;

    case "bone_array":
      bonuses.summonSkeletonChance += 0.12;
      bonuses.summonDurationMult *= 1.2;
      notes.push("亡骸归阵：击杀有概率转化为短时亡灵随从。");
      return;

    case "turret_matrix":
      bonuses.turretCountBonus += 1;
      bonuses.turretIntervalMult *= 0.85;
      notes.push("炮台矩阵：机械炮塔数量和部署频率提高。");
      return;

    case "treasure_greed":
      bonuses.chestRewardMult *= 1.25;
      bonuses.eliteSpawnMult *= 1.18;
      notes.push("贪宝成瘾：宝箱收益提高，但精英压力上升。");
      return;

    case "reverse_frenzy":
      bonuses.lowHpAttackSpeedMult *= 1.35;
      bonuses.lowHpMoveSpeedMult *= 1.25;
      bonuses.healingMult *= 0.65;
      notes.push("逆命狂热：低生命时速度和攻速提高，治疗效果降低。");
      return;

    case "shield_echo":
      bonuses.shieldMult *= 1.12;
      bonuses.shieldBreakDamageMult *= 1.45;
      bonuses.maxHpMult *= 0.92;
      notes.push("晶盾回响：护盾破裂反击增强，但最大生命降低。");
      return;

    case "element_surge":
      bonuses.magicProcChance += 0.16;
      bonuses.magicDamageMult *= 1.12;
      notes.push("元素涌动：魔法元素触发和爆发伤害提高。");
      return;

    case "martial_legacy":
      bonuses.martialUpgradeBias += 0.25;
      bonuses.armorBreakMult *= 1.2;
      notes.push("古武传承：冷兵器更容易走破甲、剑气、枪芒路线。");
      return;

    case "hunter_oath":
      bonuses.eliteBossDamageMult *= 1.25;
      notes.push("猎王誓印：对精英、特殊怪和 Boss 伤害提高。");
      return;

    default:
      applyCategoryFallback(talent, bonuses, notes);
  }
}

function applyCategoryFallback(talent: MetaTalentDef, bonuses: MetaTalentRuntimeBonuses, notes: string[]): void {
  switch (talent.category) {
    case "offense":
      bonuses.damageMult *= 1.05;
      notes.push(`${talent.name}：未定义专属效果，按进攻天赋给予伤害倾向。`);
      break;
    case "survival":
      bonuses.maxHpFlat += 5;
      notes.push(`${talent.name}：未定义专属效果，按生存天赋给予生命倾向。`);
      break;
    case "growth":
      bonuses.chestRewardMult *= 1.06;
      notes.push(`${talent.name}：未定义专属效果，按成长天赋给予收益倾向。`);
      break;
    case "summon":
      bonuses.summonSkeletonChance += 0.04;
      notes.push(`${talent.name}：未定义专属效果，按召唤天赋给予召唤倾向。`);
      break;
    case "tech":
      bonuses.turretIntervalMult *= 0.96;
      notes.push(`${talent.name}：未定义专属效果，按机械天赋给予部署倾向。`);
      break;
    case "magic":
      bonuses.magicProcChance += 0.04;
      notes.push(`${talent.name}：未定义专属效果，按魔法天赋给予触发倾向。`);
      break;
    case "martial":
      bonuses.armorBreakMult *= 1.06;
      notes.push(`${talent.name}：未定义专属效果，按古武天赋给予破甲倾向。`);
      break;
    case "risk":
      bonuses.damageMult *= 1.08;
      bonuses.maxHpMult *= 0.9;
      notes.push(`${talent.name}：未定义专属效果，按风险天赋给予高攻低生存倾向。`);
      break;
  }
}
