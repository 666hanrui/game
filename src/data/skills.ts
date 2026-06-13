// 技能定义

export type SkillRarity = "common" | "rare" | "epic";
export type SkillSchool = "archer" | "blade" | "magic" | "neutral";

export interface Skill {
  id: string;
  name: string;
  description: string;
  school: SkillSchool;
  rarity: SkillRarity;
  // 可叠加次数（1 = 只能选一次，0 = 无限）
  maxLevel: number;
  // 属性修正（每次升级叠加）
  mods: {
    damage?: number;          // 伤害 +N
    maxHp?: number;           // 最大生命 +N
    speed?: number;           // 移速 +N
    attackCooldown?: number;  // 攻速（负值 = 更快）
    projectileCount?: number; // 额外弹射物
    xpBonus?: number;         // 经验倍率
    critChance?: number;      // 暴击率 (0-1)
    critMultiplier?: number;  // 暴击倍率
    lifesteal?: number;       // 吸血比例
    radius?: number;          // 体型
  };
  // 特殊效果标签（由 Game/Combat 层解析）
  special?: string;
}

// ==================== 通用成长（所有武器可选）====================
const NEUTRAL_SKILLS: Skill[] = [
  {
    id: "vitality", name: "生命强化", description: "最大生命 +20", school: "neutral", rarity: "common", maxLevel: 4,
    mods: { maxHp: 20 },
  },
  {
    id: "swift_feet", name: "轻盈步伐", description: "移速 +10%", school: "neutral", rarity: "common", maxLevel: 4,
    mods: { speed: 26 },
  },
  {
    id: "strong_arm", name: "强弓臂力", description: "基础伤害 +8", school: "neutral", rarity: "common", maxLevel: 6,
    mods: { damage: 8 },
  },
  {
    id: "focus", name: "专注射击", description: "暴击率 +6%，暴击伤害 +20%", school: "neutral", rarity: "rare", maxLevel: 4,
    mods: { critChance: 0.06, critMultiplier: 0.2 },
  },
];

// ==================== 弓箭手：核心流派，支持持续升级 ====================
const ARCHER_SKILLS: Skill[] = [
  {
    id: "multi_arrow", name: "多重箭", description: "每级额外射出 1 支箭；叠满后接近一次十发", school: "archer", rarity: "common", maxLevel: 9,
    mods: { projectileCount: 1 },
  },
  {
    id: "rapid_draw", name: "快速拉弓", description: "射击间隔缩短，箭雨更密", school: "archer", rarity: "common", maxLevel: 5,
    mods: { attackCooldown: -0.04 },
  },
  {
    id: "tracking", name: "追踪箭", description: "箭矢会轻微追踪附近敌人，可继续强化追踪手感", school: "archer", rarity: "rare", maxLevel: 3,
    mods: { damage: 3 },
    special: "tracking",
  },
  {
    id: "fireball", name: "爆炸箭", description: "命中后产生范围爆炸；升级提高爆炸范围", school: "archer", rarity: "rare", maxLevel: 3,
    mods: { damage: 5 },
    special: "fireball",
  },
  {
    id: "frost_arrow", name: "冰霜箭", description: "命中后减速敌人；升级延长控制时间", school: "archer", rarity: "rare", maxLevel: 2,
    mods: { damage: 4 },
    special: "frost",
  },
  {
    id: "magic_arrow", name: "魔法箭", description: "箭矢附魔，伤害和暴击率提升", school: "archer", rarity: "rare", maxLevel: 4,
    mods: { damage: 8, critChance: 0.05 },
    special: "magic_arrow",
  },
  {
    id: "eagle_eye", name: "鹰眼", description: "暴击率 +12%，暴击伤害 +40%", school: "archer", rarity: "epic", maxLevel: 3,
    mods: { critChance: 0.12, critMultiplier: 0.4 },
  },
  {
    id: "drone", name: "猎鹰助攻", description: "召唤猎鹰自动向附近敌人补射", school: "archer", rarity: "epic", maxLevel: 3,
    mods: { damage: 5 },
    special: "drone",
  },
];

// ==================== 飞刃使：后续扩展流派 ====================
const BLADE_SKILLS: Skill[] = [
  {
    id: "blade_count", name: "飞刃增殖", description: "额外发射 1 枚飞刃", school: "blade", rarity: "common", maxLevel: 6,
    mods: { projectileCount: 1 },
  },
  {
    id: "bloodlust", name: "嗜血", description: "击败敌人后回复生命", school: "blade", rarity: "rare", maxLevel: 3,
    mods: {},
    special: "bloodlust",
  },
  {
    id: "blade_mastery", name: "飞刃精通", description: "伤害 +12，攻速提升", school: "blade", rarity: "common", maxLevel: 5,
    mods: { damage: 12, attackCooldown: -0.03 },
  },
];

// ==================== 魔法师：后续扩展流派 ====================
const MAGIC_SKILLS: Skill[] = [
  {
    id: "chain_lightning", name: "连锁闪电", description: "击败敌人时弹射到附近敌人", school: "magic", rarity: "epic", maxLevel: 3,
    mods: { damage: 12 },
    special: "chain_lightning",
  },
  {
    id: "arcane_power", name: "奥术强化", description: "伤害 +15", school: "magic", rarity: "common", maxLevel: 5,
    mods: { damage: 15 },
  },
  {
    id: "ice_barrier", name: "冰霜护甲", description: "最大生命 +25", school: "magic", rarity: "common", maxLevel: 4,
    mods: { maxHp: 25 },
  },
];

// 按武器流派分组的技能池
export const SKILL_POOL: Record<SkillSchool, Skill[]> = {
  neutral: NEUTRAL_SKILLS,
  archer: ARCHER_SKILLS,
  blade: BLADE_SKILLS,
  magic: MAGIC_SKILLS,
};

// 全部技能扁平列表
export const ALL_SKILLS: Skill[] = Object.values(SKILL_POOL).flat();

export function getSkill(id: string): Skill | undefined {
  return ALL_SKILLS.find((s) => s.id === id);
}
