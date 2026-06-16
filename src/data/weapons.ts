import { SkillSchool } from "./skills";
import { WeaponVisualRole, EXTRA_WEAPONS } from "./weaponExpansion";

export type WeaponAttackMode =
  | "ranged_projectile"
  | "melee_thrust"
  | "melee_slash"
  | "melee_slam"
  | "short_returning_blade"
  | "orbit"
  | "summon";

export interface Weapon {
  id: string;
  school: SkillSchool;
  name: string;
  icon: string;
  color: string;
  description: string;
  theme: string;
  attackMode: WeaponAttackMode;
  category?: "martial" | "magic" | "tech";
  subCategory?: string;
  visualRole?: WeaponVisualRole;
  tags?: string[];
}

const CORE_WEAPONS: Weapon[] = [
  {
    id: "bow",
    school: "martial",
    name: "弓箭",
    icon: "🏹",
    color: "#ffd54f",
    description: "远程箭矢 · 多重箭 · 追踪箭 · 爆裂箭",
    theme: "参考《弓箭手大作战》的核心爽点：从单发成长到满屏箭雨",
    attackMode: "ranged_projectile",
    category: "martial",
    subCategory: "bow",
    visualRole: "trail",
    tags: ["bow", "projectile"],
  },
  {
    id: "flying_blade",
    school: "martial",
    name: "飞刃",
    icon: "✦",
    color: "#ef5350",
    description: "短距飞刃 · 回旋 · 近身爆发",
    theme: "偏近中距离，靠数量和回旋轨迹处理怪群，不作为普通远程圆球",
    attackMode: "short_returning_blade",
    category: "martial",
    subCategory: "returning",
    visualRole: "orbit",
    tags: ["blade", "return"],
  },
  {
    id: "spear",
    school: "martial",
    name: "长枪",
    icon: "◆",
    color: "#ffb74d",
    description: "近战刺击 · 枪芒成长 · 直线穿透",
    theme: "前期是近距离刺击，拿到枪芒类升级后才获得远程派生能力",
    attackMode: "melee_thrust",
    category: "martial",
    subCategory: "pierce",
    visualRole: "trail",
    tags: ["spear", "melee"],
  },
  {
    id: "mace",
    school: "martial",
    name: "狼牙棒",
    icon: "✹",
    color: "#bc8f5a",
    description: "近战重击 · 破甲 · 震地",
    theme: "慢攻速高冲击的钝器路线，前期靠近身重击，后续通过地裂和震荡波扩展范围",
    attackMode: "melee_slam",
    category: "martial",
    subCategory: "mace",
    visualRole: "burst",
    tags: ["mace", "slam"],
  },
  {
    id: "wand",
    school: "magic",
    name: "魔杖",
    icon: "✧",
    color: "#ce93d8",
    description: "奥术光弹 · 连发 · 元素联动",
    theme: "轻量施法媒介，弹体密集，成长平滑",
    attackMode: "ranged_projectile",
    category: "magic",
    subCategory: "bolt",
    visualRole: "trail",
    tags: ["magic", "bolt"],
  },
  {
    id: "staff",
    school: "magic",
    name: "法杖",
    icon: "🔮",
    color: "#ab47bc",
    description: "符文飞弹 · 法阵 · 范围爆发",
    theme: "重型施法媒介，偏控制和大范围清怪",
    attackMode: "ranged_projectile",
    category: "magic",
    subCategory: "rune",
    visualRole: "burst",
    tags: ["magic", "rune"],
  },
  {
    id: "orb",
    school: "magic",
    name: "法球",
    icon: "●",
    color: "#90caf9",
    description: "法球环绕 · 护盾 · 自动释放",
    theme: "偏自动化和防守反击，适合后期成型",
    attackMode: "orbit",
    category: "magic",
    subCategory: "orb",
    visualRole: "orbit",
    tags: ["magic", "orb"],
  },
  {
    id: "drone_core",
    school: "tech",
    name: "无人机核心",
    icon: "⚙️",
    color: "#42a5f5",
    description: "无人机单位 · 编队 · 协同攻击",
    theme: "用机械单位补足火力，后期靠数量和频率压制怪群",
    attackMode: "summon",
    category: "tech",
    subCategory: "drone",
    visualRole: "none",
    tags: ["tech", "drone"],
  },
  {
    id: "energy_core",
    school: "tech",
    name: "能量核心",
    icon: "◇",
    color: "#4dd0e1",
    description: "科技能量弹 · 过载 · 折射",
    theme: "偏未来感的能量装置路线，强调弹道变化和爆发窗口",
    attackMode: "ranged_projectile",
    category: "tech",
    subCategory: "energy",
    visualRole: "trail",
    tags: ["tech", "energy"],
  },
];

export const WEAPONS: Weapon[] = [...CORE_WEAPONS, ...EXTRA_WEAPONS];

export function getWeaponsBySchool(school: SkillSchool | null): Weapon[] {
  if (!school || school === "neutral") return [];
  return WEAPONS.filter((w) => w.school === school);
}

export function getWeapon(id: string): Weapon | undefined {
  return WEAPONS.find((w) => w.id === id);
}
