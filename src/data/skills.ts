// 技能定义

export type SkillRarity = "common" | "rare" | "epic";
export type SkillSchool = "tech" | "martial" | "magic" | "neutral";

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

// ==================== 中立技能（所有体系可选）====================
const NEUTRAL_SKILLS: Skill[] = [
  {
    id: "vitality", name: "生命强化", description: "最大生命 +20", school: "neutral", rarity: "common", maxLevel: 3,
    mods: { maxHp: 20 },
  },
  {
    id: "quickshot", name: "快速射击", description: "攻速 +15%", school: "neutral", rarity: "common", maxLevel: 3,
    mods: { attackCooldown: -0.06 },
  },
  {
    id: "power_shot", name: "强力箭", description: "伤害 +10", school: "neutral", rarity: "common", maxLevel: 5,
    mods: { damage: 10 },
  },
  {
    id: "sprint", name: "疾跑", description: "移速 +10%", school: "neutral", rarity: "common", maxLevel: 3,
    mods: { speed: 26 },
  },
];

// ==================== 科技系 ====================
const TECH_SKILLS: Skill[] = [
  {
    id: "double_shot", name: "双发芯片", description: "额外射 1 支箭", school: "tech", rarity: "rare", maxLevel: 2,
    mods: { projectileCount: 1 },
  },
  {
    id: "drone", name: "无人机", description: "召唤 1 架浮游炮（自动攻击）", school: "tech", rarity: "epic", maxLevel: 3,
    mods: { damage: 5 },
    special: "drone",
  },
  {
    id: "emp", name: "电磁脉冲", description: "击杀敌人时释放范围电击", school: "tech", rarity: "rare", maxLevel: 1,
    mods: {},
    special: "emp_on_kill",
  },
  {
    id: "magazine", name: "弹夹扩容", description: "每波开始时额外 +3 支散射箭", school: "tech", rarity: "common", maxLevel: 3,
    mods: {},
    special: "burst_on_wave",
  },
  {
    id: "tracking", name: "追踪模组", description: "箭矢轻微追踪敌人", school: "tech", rarity: "rare", maxLevel: 1,
    mods: { damage: 5 },
    special: "tracking",
  },
  {
    id: "overcharge", name: "超载", description: "伤害 +25%，但子弹速度降低", school: "tech", rarity: "rare", maxLevel: 2,
    mods: { damage: 25, attackCooldown: 0.08 },
  },
  {
    id: "shrapnel", name: "破片弹", description: "命中敌人时向周围射出 3 枚碎片", school: "tech", rarity: "epic", maxLevel: 2,
    mods: { damage: 8 },
    special: "shrapnel",
  },
  {
    id: "laser_sight", name: "激光瞄准", description: "暴击率 +10%，暴击伤害 +50%", school: "tech", rarity: "common", maxLevel: 3,
    mods: { critChance: 0.1, critMultiplier: 0.5 },
  },
];

// ==================== 古武系 ====================
const MARTIAL_SKILLS: Skill[] = [
  {
    id: "iron_skin", name: "铁布衫", description: "受伤 -15%", school: "martial", rarity: "common", maxLevel: 3,
    mods: { maxHp: 15 },
  },
  {
    id: "one_inch", name: "寸拳", description: "敌人贴近时自动击退 + 伤害", school: "martial", rarity: "rare", maxLevel: 1,
    mods: {},
    special: "knockback",
  },
  {
    id: "mind_eye", name: "心眼", description: "暴击率 +15%，暴击伤害翻倍", school: "martial", rarity: "epic", maxLevel: 2,
    mods: { critChance: 0.15, critMultiplier: 1.0 },
  },
  {
    id: "chain_slash", name: "连斩", description: "击杀后 2 秒内攻速翻倍", school: "martial", rarity: "rare", maxLevel: 2,
    mods: {},
    special: "chain_slash",
  },
  {
    id: "berserk", name: "金刚体", description: "血量低于 30% 时无敌 3 秒（每波一次）", school: "martial", rarity: "epic", maxLevel: 1,
    mods: {},
    special: "berserk",
  },
  {
    id: "bloodlust", name: "嗜血", description: "击杀回复 8% 最大生命", school: "martial", rarity: "rare", maxLevel: 2,
    mods: {},
    special: "bloodlust",
  },
  {
    id: "heavy_blow", name: "重击", description: "伤害 +20%", school: "martial", rarity: "common", maxLevel: 3,
    mods: { damage: 20 },
  },
  {
    id: "adrenaline", name: "肾上腺素", description: "受伤后 3 秒内移速 +30%，伤害 +15%", school: "martial", rarity: "rare", maxLevel: 2,
    mods: {},
    special: "adrenaline",
  },
];

// ==================== 魔法系 ====================
const MAGIC_SKILLS: Skill[] = [
  {
    id: "frost_arrow", name: "冰霜箭", description: "命中减速敌人 40%，持续 1.5 秒", school: "magic", rarity: "rare", maxLevel: 1,
    mods: {},
    special: "frost",
  },
  {
    id: "fireball", name: "火球术", description: "命中时造成范围爆炸伤害", school: "magic", rarity: "rare", maxLevel: 2,
    mods: { damage: 10 },
    special: "fireball",
  },
  {
    id: "mana_shield", name: "法力盾", description: "消耗 20 经验值抵消一次致命伤害", school: "magic", rarity: "epic", maxLevel: 1,
    mods: {},
    special: "mana_shield",
  },
  {
    id: "arc_field", name: "电磁场", description: "每 2 秒释放环绕自身的电弧", school: "magic", rarity: "rare", maxLevel: 2,
    mods: {},
    special: "arc_field",
  },
  {
    id: "blink", name: "闪现", description: "受伤时瞬移一小段距离（CD 10 秒）", school: "magic", rarity: "epic", maxLevel: 2,
    mods: {},
    special: "blink",
  },
  {
    id: "chain_lightning", name: "连锁闪电", description: "击杀敌人时弹射到附近敌人", school: "magic", rarity: "epic", maxLevel: 2,
    mods: { damage: 12 },
    special: "chain_lightning",
  },
  {
    id: "arcane_power", name: "奥术强化", description: "伤害 +15%", school: "magic", rarity: "common", maxLevel: 3,
    mods: { damage: 15 },
  },
  {
    id: "ice_barrier", name: "冰霜护甲", description: "最大生命 +25", school: "magic", rarity: "common", maxLevel: 3,
    mods: { maxHp: 25 },
  },
];

// 按学校分组的技能池
export const SKILL_POOL: Record<SkillSchool, Skill[]> = {
  neutral: NEUTRAL_SKILLS,
  tech: TECH_SKILLS,
  martial: MARTIAL_SKILLS,
  magic: MAGIC_SKILLS,
};

// 全部技能扁平列表
export const ALL_SKILLS: Skill[] = Object.values(SKILL_POOL).flat();

export function getSkill(id: string): Skill | undefined {
  return ALL_SKILLS.find((s) => s.id === id);
}
