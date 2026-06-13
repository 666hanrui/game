// 技能定义

export type SkillRarity = "common" | "rare" | "epic" | "legendary" | "diamond";
export type SkillSchool = "martial" | "magic" | "tech" | "neutral";

export interface Skill {
  id: string;
  name: string;
  description: string;
  school: SkillSchool;
  weapon?: string;
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
  { id: "tough_body", name: "体魄锻炼", description: "最大生命 +12，基础伤害 +4", school: "neutral", rarity: "common", maxLevel: 5, mods: { maxHp: 12, damage: 4 } },
];

const MARTIAL_SKILLS: Skill[] = [
  // 弓箭
  { id: "multi_arrow", name: "多重箭", description: "弓箭主线：每级额外射出 1 支箭，持续叠加到箭雨", school: "martial", weapon: "bow", rarity: "common", maxLevel: 9, mods: { projectileCount: 1 } },
  { id: "rapid_draw", name: "快速拉弓", description: "弓箭主线：射击间隔缩短，输出更密", school: "martial", weapon: "bow", rarity: "common", maxLevel: 5, mods: { attackCooldown: -0.04 } },
  { id: "strong_bow", name: "强弓", description: "弓箭主线：基础伤害 +10", school: "martial", weapon: "bow", rarity: "common", maxLevel: 6, mods: { damage: 10 } },
  { id: "tracking", name: "追踪箭", description: "弓箭分支：箭矢会轻微追踪附近敌人", school: "martial", weapon: "bow", rarity: "rare", maxLevel: 3, mods: { damage: 3 }, special: "tracking" },
  { id: "fireball", name: "爆裂箭", description: "弓箭分支：命中后产生范围冲击", school: "martial", weapon: "bow", rarity: "rare", maxLevel: 3, mods: { damage: 5 }, special: "fireball" },
  { id: "frost_arrow", name: "冰霜箭", description: "弓箭分支：命中后减速敌人", school: "martial", weapon: "bow", rarity: "rare", maxLevel: 2, mods: { damage: 4 }, special: "frost" },
  { id: "magic_arrow", name: "附魔箭", description: "弓箭分支：箭矢附加能量，提升伤害和暴击率", school: "martial", weapon: "bow", rarity: "rare", maxLevel: 4, mods: { damage: 8, critChance: 0.05 }, special: "magic_arrow" },
  { id: "eagle_eye", name: "鹰眼", description: "弓箭技巧：暴击率 +12%，暴击伤害 +40%", school: "martial", weapon: "bow", rarity: "epic", maxLevel: 3, mods: { critChance: 0.12, critMultiplier: 0.4 } },

  // 飞刃
  { id: "blade_count", name: "飞刃增殖", description: "飞刃主线：额外发出 1 枚飞刃", school: "martial", weapon: "flying_blade", rarity: "common", maxLevel: 6, mods: { projectileCount: 1 } },
  { id: "blade_mastery", name: "利刃精通", description: "飞刃主线：伤害 +9，攻速提升", school: "martial", weapon: "flying_blade", rarity: "common", maxLevel: 5, mods: { damage: 9, attackCooldown: -0.025 } },
  { id: "whirl_blade", name: "回旋飞刃", description: "飞刃分支：飞刃更利于贴身清怪，伤害与暴击提升", school: "martial", weapon: "flying_blade", rarity: "rare", maxLevel: 3, mods: { damage: 8, critChance: 0.06 }, special: "whirl_blade" },
  { id: "bloodlust", name: "嗜血战意", description: "冷兵器技巧：击败敌人后回复生命", school: "martial", rarity: "rare", maxLevel: 3, mods: {}, special: "bloodlust" },

  // 长枪
  { id: "spear_shadow", name: "枪影", description: "长枪主线：额外刺出一道枪影", school: "martial", weapon: "spear", rarity: "common", maxLevel: 5, mods: { projectileCount: 1 } },
  { id: "spear_force", name: "破阵枪", description: "长枪主线：基础伤害 +14", school: "martial", weapon: "spear", rarity: "common", maxLevel: 5, mods: { damage: 14 } },
  { id: "pierce", name: "贯穿", description: "长枪分支：强化直线穿刺手感，伤害和暴击提升", school: "martial", weapon: "spear", rarity: "rare", maxLevel: 3, mods: { damage: 8, critChance: 0.08 }, special: "pierce" },
];

const MAGIC_SKILLS: Skill[] = [
  // 魔杖
  { id: "arcane_bolt", name: "魔杖光弹", description: "魔杖主线：法术伤害 +12", school: "magic", weapon: "wand", rarity: "common", maxLevel: 6, mods: { damage: 12 } },
  { id: "wand_chain", name: "魔杖连发", description: "魔杖主线：额外发出 1 枚光弹", school: "magic", weapon: "wand", rarity: "common", maxLevel: 5, mods: { projectileCount: 1 } },
  { id: "arcane_charge", name: "奥术充能", description: "魔杖分支：攻速提升，暴击率 +8%", school: "magic", weapon: "wand", rarity: "rare", maxLevel: 3, mods: { attackCooldown: -0.035, critChance: 0.08 }, special: "arcane_charge" },

  // 法杖
  { id: "staff_focus", name: "法杖专注", description: "法杖主线：施法间隔缩短", school: "magic", weapon: "staff", rarity: "common", maxLevel: 5, mods: { attackCooldown: -0.035 } },
  { id: "staff_power", name: "法杖威能", description: "法杖主线：法术伤害 +18", school: "magic", weapon: "staff", rarity: "common", maxLevel: 5, mods: { damage: 18 } },
  { id: "chain_lightning", name: "连锁闪电", description: "法杖分支：击败敌人时弹射到附近敌人", school: "magic", weapon: "staff", rarity: "epic", maxLevel: 3, mods: { damage: 12 }, special: "chain_lightning" },
  { id: "spell_bloom", name: "法阵扩散", description: "法杖分支：范围溅射更强，伤害提升", school: "magic", weapon: "staff", rarity: "rare", maxLevel: 3, mods: { damage: 10 }, special: "spell_bloom" },

  // 法球
  { id: "orb_count", name: "环绕法球", description: "法球主线：额外释放 1 枚法球弹体", school: "magic", weapon: "orb", rarity: "common", maxLevel: 5, mods: { projectileCount: 1 } },
  { id: "orb_guard", name: "护体法球", description: "法球防御：最大生命 +20，伤害 +6", school: "magic", weapon: "orb", rarity: "common", maxLevel: 5, mods: { maxHp: 20, damage: 6 } },
  { id: "ice_barrier", name: "冰霜护盾", description: "魔法防御：最大生命 +25", school: "magic", rarity: "common", maxLevel: 4, mods: { maxHp: 25 } },
];

const TECH_SKILLS: Skill[] = [
  // 无人机核心
  { id: "drone", name: "无人机", description: "无人机核心：自动单位会协助攻击附近敌人", school: "tech", weapon: "drone_core", rarity: "epic", maxLevel: 3, mods: { damage: 5 }, special: "drone" },
  { id: "drone_swarm", name: "编队核心", description: "无人机核心：自动单位射击频率提高，伤害 +6", school: "tech", weapon: "drone_core", rarity: "rare", maxLevel: 4, mods: { damage: 6, attackCooldown: -0.02 }, special: "drone_swarm" },
  { id: "auto_calibration", name: "自动校准", description: "无人机核心：暴击率 +8%", school: "tech", weapon: "drone_core", rarity: "common", maxLevel: 4, mods: { critChance: 0.08 } },

  // 能量核心
  { id: "laser_sight", name: "激光瞄准", description: "能量核心：暴击率 +10%，暴击伤害 +40%", school: "tech", weapon: "energy_core", rarity: "common", maxLevel: 4, mods: { critChance: 0.1, critMultiplier: 0.4 } },
  { id: "energy_core", name: "能量强化", description: "能量核心：伤害 +15", school: "tech", weapon: "energy_core", rarity: "rare", maxLevel: 4, mods: { damage: 15 } },
  { id: "energy_refraction", name: "能量折射", description: "能量核心：额外发出 1 道能量弹，伤害提升", school: "tech", weapon: "energy_core", rarity: "rare", maxLevel: 4, mods: { projectileCount: 1, damage: 6 }, special: "energy_refraction" },
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
