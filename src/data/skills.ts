// 技能定义

export type SkillRarity = "common" | "rare" | "epic";
export type SkillSchool = "martial" | "magic" | "tech" | "neutral";

export interface Skill {
  id: string;
  name: string;
  description: string;
  school: SkillSchool;
  weapon?: string; // 具体武器归属；通用技能不写
  rarity: SkillRarity;
  maxLevel: number;
  mods: {
    damage?: number;
    maxHp?: number;
    speed?: number;
    attackCooldown?: number;
    projectileCount?: number;
    xpBonus?: number;
    critChance?: number;
    critMultiplier?: number;
    lifesteal?: number;
    radius?: number;
  };
  special?: string;
}

const NEUTRAL_SKILLS: Skill[] = [
  { id: "vitality", name: "生命强化", description: "最大生命 +20", school: "neutral", rarity: "common", maxLevel: 4, mods: { maxHp: 20 } },
  { id: "swift_feet", name: "轻盈步伐", description: "移速 +10%", school: "neutral", rarity: "common", maxLevel: 4, mods: { speed: 26 } },
  { id: "battle_focus", name: "战斗专注", description: "暴击率 +6%，暴击伤害 +20%", school: "neutral", rarity: "rare", maxLevel: 4, mods: { critChance: 0.06, critMultiplier: 0.2 } },
];

// 古武体系：只能走传统器械路线。当前优先完善弓箭成长线。
const MARTIAL_SKILLS: Skill[] = [
  { id: "multi_arrow", name: "多重箭", description: "弓箭主线：每级额外射出 1 支箭，持续叠加到箭雨", school: "martial", weapon: "bow", rarity: "common", maxLevel: 9, mods: { projectileCount: 1 } },
  { id: "rapid_draw", name: "快速拉弓", description: "弓箭主线：射击间隔缩短，输出更密", school: "martial", weapon: "bow", rarity: "common", maxLevel: 5, mods: { attackCooldown: -0.04 } },
  { id: "strong_bow", name: "强弓", description: "弓箭主线：基础伤害 +10", school: "martial", weapon: "bow", rarity: "common", maxLevel: 6, mods: { damage: 10 } },
  { id: "tracking", name: "追踪箭", description: "弓箭分支：箭矢会轻微追踪附近敌人", school: "martial", weapon: "bow", rarity: "rare", maxLevel: 3, mods: { damage: 3 }, special: "tracking" },
  { id: "fireball", name: "爆裂箭", description: "弓箭分支：命中后产生范围冲击", school: "martial", weapon: "bow", rarity: "rare", maxLevel: 3, mods: { damage: 5 }, special: "fireball" },
  { id: "frost_arrow", name: "冰霜箭", description: "弓箭分支：命中后减速敌人", school: "martial", weapon: "bow", rarity: "rare", maxLevel: 2, mods: { damage: 4 }, special: "frost" },
  { id: "magic_arrow", name: "附魔箭", description: "弓箭分支：箭矢附加能量，提升伤害和暴击率", school: "martial", weapon: "bow", rarity: "rare", maxLevel: 4, mods: { damage: 8, critChance: 0.05 }, special: "magic_arrow" },
  { id: "eagle_eye", name: "鹰眼", description: "弓箭技巧：暴击率 +12%，暴击伤害 +40%", school: "martial", weapon: "bow", rarity: "epic", maxLevel: 3, mods: { critChance: 0.12, critMultiplier: 0.4 } },
  { id: "blade_count", name: "飞刃增殖", description: "飞刃主线：额外发出 1 枚飞刃", school: "martial", weapon: "flying_blade", rarity: "common", maxLevel: 6, mods: { projectileCount: 1 } },
  { id: "bloodlust", name: "嗜血战意", description: "冷兵器技巧：击败敌人后回复生命", school: "martial", rarity: "rare", maxLevel: 3, mods: {}, special: "bloodlust" },
];

// 魔法体系：只能用魔杖、法杖、法球、魔导书等魔法媒介。
const MAGIC_SKILLS: Skill[] = [
  { id: "arcane_bolt", name: "魔杖光弹", description: "魔杖主线：法术伤害 +12", school: "magic", weapon: "wand", rarity: "common", maxLevel: 6, mods: { damage: 12 } },
  { id: "wand_chain", name: "魔杖连发", description: "魔杖主线：额外发出 1 枚光弹", school: "magic", weapon: "wand", rarity: "common", maxLevel: 5, mods: { projectileCount: 1 } },
  { id: "staff_focus", name: "法杖专注", description: "法杖主线：施法间隔缩短", school: "magic", weapon: "staff", rarity: "common", maxLevel: 5, mods: { attackCooldown: -0.035 } },
  { id: "chain_lightning", name: "连锁闪电", description: "法杖分支：击败敌人时弹射到附近敌人", school: "magic", weapon: "staff", rarity: "epic", maxLevel: 3, mods: { damage: 12 }, special: "chain_lightning" },
  { id: "ice_barrier", name: "冰霜护盾", description: "法杖防御：最大生命 +25", school: "magic", rarity: "common", maxLevel: 4, mods: { maxHp: 25 } },
];

// 科技体系：使用机械装置、能量装置和自动单位。
const TECH_SKILLS: Skill[] = [
  { id: "drone", name: "无人机", description: "无人机核心：自动单位会协助攻击附近敌人", school: "tech", weapon: "drone_core", rarity: "epic", maxLevel: 3, mods: { damage: 5 }, special: "drone" },
  { id: "laser_sight", name: "激光瞄准", description: "能量核心：暴击率 +10%，暴击伤害 +40%", school: "tech", weapon: "energy_core", rarity: "common", maxLevel: 4, mods: { critChance: 0.1, critMultiplier: 0.4 } },
  { id: "energy_core", name: "能量核心", description: "能量核心：伤害 +15", school: "tech", weapon: "energy_core", rarity: "rare", maxLevel: 4, mods: { damage: 15 } },
];

export const SKILL_POOL: Record<SkillSchool, Skill[]> = {
  neutral: NEUTRAL_SKILLS,
  martial: MARTIAL_SKILLS,
  magic: MAGIC_SKILLS,
  tech: TECH_SKILLS,
};

export const ALL_SKILLS: Skill[] = Object.values(SKILL_POOL).flat();

export function getSkill(id: string): Skill | undefined {
  return ALL_SKILLS.find((s) => s.id === id);
}
