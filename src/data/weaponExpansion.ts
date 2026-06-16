import type { Skill, SkillRarity, SkillSchool } from "./skills";
import type { Weapon, WeaponAttackMode } from "./weapons";

export type WeaponCategory = "martial" | "magic" | "tech";
export type WeaponVisualRole = "none" | "aura" | "burst" | "field" | "orbit" | "trail";

interface ExpandedWeaponSeed {
  id: string;
  school: SkillSchool;
  name: string;
  icon: string;
  color: string;
  description: string;
  theme: string;
  attackMode: WeaponAttackMode;
  category: WeaponCategory;
  subCategory: string;
  visualRole: WeaponVisualRole;
  tags: string[];
}

interface UpgradeSeed {
  suffix: string;
  name: string;
  description: string;
  rarity: SkillRarity;
  maxLevel: number;
  mods: Skill["mods"];
  specialTag: string;
  visualRole: WeaponVisualRole;
}

const MARTIAL_WEAPON_SEEDS: ExpandedWeaponSeed[] = [
  { id: "sword", school: "martial", name: "单手剑", icon: "⚔", color: "#e0e0e0", description: "中距离斩击 · 连斩 · 后期剑气", theme: "稳定斩击路线，先近战，后续用剑气扩展距离。", attackMode: "melee_slash", category: "martial", subCategory: "slash", visualRole: "trail", tags: ["blade", "slash"] },
  { id: "greatsword", school: "martial", name: "双手剑", icon: "▰", color: "#b0bec5", description: "慢速大范围横扫 · 蓄力重斩", theme: "高前摇高伤害，用扇形斩击清怪。", attackMode: "melee_slash", category: "martial", subCategory: "heavy_slash", visualRole: "burst", tags: ["blade", "heavy"] },
  { id: "dagger", school: "martial", name: "匕首", icon: "†", color: "#ff8a65", description: "高速贴身连击 · 暴击 · 背刺", theme: "短距离高频率，靠暴击和连击打爽感。", attackMode: "melee_thrust", category: "martial", subCategory: "combo", visualRole: "trail", tags: ["dagger", "crit"] },
  { id: "battle_axe", school: "martial", name: "战斧", icon: "⌁", color: "#ff7043", description: "扇形劈砍 · 流血 · 破甲", theme: "斩击和破甲并重，适合处理密集敌群。", attackMode: "melee_slam", category: "martial", subCategory: "cleave", visualRole: "burst", tags: ["axe", "armor_break"] },
  { id: "crossbow", school: "martial", name: "弩", icon: "⊹", color: "#d7a86e", description: "低攻速高穿透 · 重箭 · 连弩", theme: "比弓更慢更重，强调穿甲和直线压制。", attackMode: "ranged_projectile", category: "martial", subCategory: "pierce_ranged", visualRole: "trail", tags: ["bow", "pierce"] },
  { id: "chain_sickle", school: "martial", name: "锁链镰", icon: "☄", color: "#a1887f", description: "中距离拉扯 · 回旋控制", theme: "攻击范围介于近战和投掷之间，适合控场。", attackMode: "short_returning_blade", category: "martial", subCategory: "chain", visualRole: "trail", tags: ["chain", "control"] },
  { id: "claw", school: "martial", name: "拳爪", icon: "≋", color: "#ffcc80", description: "贴身连击 · 攻速成长 · 撕裂", theme: "快速短打，强化后变成贴身风暴。", attackMode: "melee_slash", category: "martial", subCategory: "combo", visualRole: "trail", tags: ["claw", "speed"] },
  { id: "shield_blade", school: "martial", name: "盾刃", icon: "◈", color: "#90a4ae", description: "防御反击 · 格挡后反击波", theme: "生存和反击路线，适合稳扎稳打。", attackMode: "melee_slam", category: "martial", subCategory: "counter", visualRole: "aura", tags: ["shield", "counter"] },
  { id: "katana", school: "martial", name: "太刀", icon: "╱", color: "#f48fb1", description: "居合斩 · 直线突进 · 斩痕", theme: "强调方向感和瞬间爆发。", attackMode: "melee_slash", category: "martial", subCategory: "dash_slash", visualRole: "trail", tags: ["slash", "dash"] },
  { id: "chakram", school: "martial", name: "轮刃", icon: "◎", color: "#ffb74d", description: "回旋轮刃 · 轨迹切割 · 折返", theme: "投掷回旋武器，适合走回旋和轨迹构筑。", attackMode: "short_returning_blade", category: "martial", subCategory: "returning", visualRole: "orbit", tags: ["blade", "return"] },
];

const MAGIC_WEAPON_SEEDS: ExpandedWeaponSeed[] = [
  { id: "rune_book", school: "magic", name: "符文书", icon: "▣", color: "#b39ddb", description: "放置法阵 · 范围持续伤害", theme: "真正的场域武器，只有它适合画大范围法阵。", attackMode: "ranged_projectile", category: "magic", subCategory: "field", visualRole: "field", tags: ["magic", "field"] },
  { id: "thunder_codex", school: "magic", name: "雷典", icon: "ϟ", color: "#90caf9", description: "连锁闪电 · 跳跃攻击", theme: "电弧跳跃路线，适合连锁清怪。", attackMode: "ranged_projectile", category: "magic", subCategory: "lightning", visualRole: "trail", tags: ["magic", "lightning"] },
  { id: "ice_crystal", school: "magic", name: "冰晶", icon: "❄", color: "#80deea", description: "减速 · 冻结 · 冰刺", theme: "控制和爆发兼具，偏冰霜控场。", attackMode: "ranged_projectile", category: "magic", subCategory: "ice", visualRole: "trail", tags: ["magic", "ice"] },
  { id: "flame_seal", school: "magic", name: "火印", icon: "◇", color: "#ff7043", description: "燃烧 · 爆裂 · 火墙", theme: "火焰爆发路线，强化命中和地面残留。", attackMode: "ranged_projectile", category: "magic", subCategory: "fire", visualRole: "burst", tags: ["magic", "fire"] },
  { id: "shadow_lantern", school: "magic", name: "暗影灯", icon: "◐", color: "#7e57c2", description: "诅咒 · 吸血 · 持续伤害", theme: "偏消耗和续航，视觉以低亮暗紫为主。", attackMode: "ranged_projectile", category: "magic", subCategory: "curse", visualRole: "aura", tags: ["magic", "curse"] },
  { id: "summoning_tome", school: "magic", name: "召唤书", icon: "☉", color: "#a5d6a7", description: "召唤物路线 · 仆从协同", theme: "魔法召唤路线，火力来自仆从而非大法阵常驻。", attackMode: "summon", category: "magic", subCategory: "summon", visualRole: "none", tags: ["magic", "summon"] },
  { id: "star_astrolabe", school: "magic", name: "星盘", icon: "✦", color: "#ce93d8", description: "轨道弹 · 星环 · 自动防御", theme: "轨道类武器，允许小半径环绕，不允许全屏大圈。", attackMode: "orbit", category: "magic", subCategory: "orbit", visualRole: "orbit", tags: ["magic", "orbit"] },
  { id: "vine_grimoire", school: "magic", name: "藤蔓秘典", icon: "♣", color: "#81c784", description: "缠绕 · 毒藤 · 区域减速", theme: "自然系控制，走缠绕和毒蚀联动。", attackMode: "ranged_projectile", category: "magic", subCategory: "nature", visualRole: "field", tags: ["magic", "poison", "control"] },
  { id: "time_sandglass", school: "magic", name: "时砂漏", icon: "⌛", color: "#ffd54f", description: "延迟爆发 · 时间减速", theme: "节奏型控制武器，强调延迟和时间窗。", attackMode: "ranged_projectile", category: "magic", subCategory: "time", visualRole: "burst", tags: ["magic", "slow"] },
  { id: "spirit_bell", school: "magic", name: "魂铃", icon: "◌", color: "#e1bee7", description: "魂波 · 回响 · 亡魂弹", theme: "回响类法器，命中后产生二段波纹。", attackMode: "ranged_projectile", category: "magic", subCategory: "echo", visualRole: "trail", tags: ["magic", "echo"] },
];

const TECH_WEAPON_SEEDS: ExpandedWeaponSeed[] = [
  { id: "railgun", school: "tech", name: "电磁枪", icon: "▸", color: "#4dd0e1", description: "高速直线弹 · 穿透 · 过载", theme: "高速科技枪械，弹道清晰，不能像魔法球。", attackMode: "ranged_projectile", category: "tech", subCategory: "gun", visualRole: "trail", tags: ["tech", "gun", "pierce"] },
  { id: "scatter_core", school: "tech", name: "散射炮", icon: "▵", color: "#ffab91", description: "近距离霰弹 · 扇形爆发", theme: "贴脸科技火力，强调扇形弹片。", attackMode: "ranged_projectile", category: "tech", subCategory: "shotgun", visualRole: "burst", tags: ["tech", "gun", "spread"] },
  { id: "laser_prism", school: "tech", name: "激光棱镜", icon: "◇", color: "#80deea", description: "持续光束 · 折射 · 聚焦", theme: "棱镜折射路线，用细线束而不是圆球。", attackMode: "ranged_projectile", category: "tech", subCategory: "laser", visualRole: "trail", tags: ["tech", "laser"] },
  { id: "grenade_core", school: "tech", name: "榴弹核心", icon: "●", color: "#ff8a65", description: "抛射爆弹 · 范围爆破", theme: "爆破科技路线，命中反馈重但不常驻光圈。", attackMode: "ranged_projectile", category: "tech", subCategory: "explosive", visualRole: "burst", tags: ["tech", "explode"] },
  { id: "turret_controller", school: "tech", name: "炮台控制器", icon: "▤", color: "#90caf9", description: "部署炮台 · 阵地火力", theme: "真正可显示范围提示的机械场地单位。", attackMode: "summon", category: "tech", subCategory: "turret", visualRole: "field", tags: ["tech", "summon", "turret"] },
  { id: "nano_swarm", school: "tech", name: "纳米蜂群", icon: "✶", color: "#b2ebf2", description: "自动追踪小单位 · 蜂群撕咬", theme: "小型自动单位，不用大圈，用粒子群表现。", attackMode: "summon", category: "tech", subCategory: "swarm", visualRole: "aura", tags: ["tech", "swarm"] },
  { id: "orbital_beacon", school: "tech", name: "轨道信标", icon: "⌖", color: "#64b5f6", description: "延迟轰炸 · 标记打击", theme: "先标记后落点打击，允许短暂目标圈。", attackMode: "ranged_projectile", category: "tech", subCategory: "beacon", visualRole: "field", tags: ["tech", "lockon"] },
  { id: "mechanical_crossbow", school: "tech", name: "机械弩", icon: "⊚", color: "#ffd180", description: "科技箭矢 · 精准连射", theme: "冷兵器和科技杂交，兼顾箭矢和机械感。", attackMode: "ranged_projectile", category: "tech", subCategory: "crossbow", visualRole: "trail", tags: ["tech", "bow"] },
  { id: "tesla_coil", school: "tech", name: "特斯拉线圈", icon: "ϟ", color: "#4fc3f7", description: "电弧链 · 近场放电", theme: "电系科技路线，小范围电弧，不常驻大圈。", attackMode: "ranged_projectile", category: "tech", subCategory: "lightning", visualRole: "aura", tags: ["tech", "lightning"] },
  { id: "plasma_blade", school: "tech", name: "等离子刃", icon: "╋", color: "#b388ff", description: "能量近战 · 切割波 · 过热", theme: "科技近战武器，手动攻击强化，不自动帮打。", attackMode: "melee_slash", category: "tech", subCategory: "energy_melee", visualRole: "trail", tags: ["tech", "blade"] },
];

export const EXTRA_WEAPONS: Weapon[] = [...MARTIAL_WEAPON_SEEDS, ...MAGIC_WEAPON_SEEDS, ...TECH_WEAPON_SEEDS];

const UPGRADE_TEMPLATE: UpgradeSeed[] = [
  { suffix: "core", name: "核心强化", description: "基础输出提升，是这把武器的稳定成长。", rarity: "common", maxLevel: 6, mods: { damage: 8 }, specialTag: "damage", visualRole: "none" },
  { suffix: "rhythm", name: "节奏优化", description: "攻击节奏改善，手感更顺。", rarity: "common", maxLevel: 5, mods: { attackCooldown: -0.025 }, specialTag: "speed", visualRole: "none" },
  { suffix: "multi", name: "副击模块", description: "增加副弹、连段或派生数量。", rarity: "rare", maxLevel: 4, mods: { projectileCount: 1 }, specialTag: "multishot", visualRole: "trail" },
  { suffix: "crit", name: "弱点打击", description: "提高暴击率和暴击伤害。", rarity: "rare", maxLevel: 4, mods: { critChance: 0.07, critMultiplier: 0.25 }, specialTag: "crit", visualRole: "burst" },
  { suffix: "pierce", name: "穿透结构", description: "强化直线压制或连续命中能力。", rarity: "rare", maxLevel: 3, mods: { damage: 6, critChance: 0.04 }, specialTag: "pierce", visualRole: "trail" },
  { suffix: "control", name: "控场改造", description: "提高牵制、减速或区域压制能力。", rarity: "rare", maxLevel: 3, mods: { damage: 5 }, specialTag: "control", visualRole: "field" },
  { suffix: "burst", name: "爆发窗口", description: "强化短时间爆发，命中反馈更重。", rarity: "epic", maxLevel: 3, mods: { damage: 12, attackCooldown: 0.015 }, specialTag: "burst", visualRole: "burst" },
  { suffix: "guard", name: "护身结构", description: "提高容错，适合贴身或站桩路线。", rarity: "common", maxLevel: 4, mods: { maxHp: 18, damage: 3 }, specialTag: "survival", visualRole: "aura" },
  { suffix: "mastery", name: "专精", description: "进入该武器的成型阶段，综合能力提升。", rarity: "epic", maxLevel: 3, mods: { damage: 10, critMultiplier: 0.35 }, specialTag: "mastery", visualRole: "trail" },
  { suffix: "apex", name: "大成式", description: "该武器的高阶质变方向，适合后期追构筑。", rarity: "legendary", maxLevel: 2, mods: { damage: 18, critChance: 0.08, critMultiplier: 0.45 }, specialTag: "apex", visualRole: "burst" },
];

export const EXTRA_SKILLS: Skill[] = EXTRA_WEAPONS.flatMap((weapon) =>
  UPGRADE_TEMPLATE.map((upgrade) => ({
    id: `${weapon.id}_${upgrade.suffix}`,
    name: `${weapon.name}·${upgrade.name}`,
    description: `${weapon.name}升级：${upgrade.description}视觉语义：${upgrade.visualRole}。`,
    school: weapon.school,
    weapon: weapon.id,
    rarity: upgrade.rarity,
    maxLevel: upgrade.maxLevel,
    mods: upgrade.mods,
    special: `${weapon.id}_${upgrade.specialTag}`,
    tags: [weapon.id, weapon.school, weapon.attackMode, weapon.category, weapon.subCategory, upgrade.specialTag, upgrade.visualRole, ...((weapon as ExpandedWeaponSeed).tags ?? [])] as string[],
  }))
);
