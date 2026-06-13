import { SkillSchool } from "./skills";

export interface Weapon {
  id: string;
  school: SkillSchool;
  name: string;
  icon: string;
  color: string;
  description: string;
  theme: string;
}

export const WEAPONS: Weapon[] = [
  {
    id: "bow",
    school: "martial",
    name: "弓箭",
    icon: "🏹",
    color: "#ffd54f",
    description: "多重箭 · 追踪箭 · 爆裂箭",
    theme: "参考《弓箭手大作战》的核心爽点：从单发成长到满屏箭雨",
  },
  {
    id: "flying_blade",
    school: "martial",
    name: "飞刃",
    icon: "✦",
    color: "#ef5350",
    description: "飞刃增殖 · 回旋 · 近身爆发",
    theme: "偏近中距离，靠数量和回旋轨迹处理怪群",
  },
  {
    id: "spear",
    school: "martial",
    name: "长枪",
    icon: "◆",
    color: "#ffb74d",
    description: "穿刺 · 冲锋 · 击退",
    theme: "直线穿透和距离控制，适合硬朗的古武路线",
  },
  {
    id: "wand",
    school: "magic",
    name: "魔杖",
    icon: "✧",
    color: "#ce93d8",
    description: "光弹 · 连发 · 元素附着",
    theme: "轻量施法媒介，弹体密集，成长平滑",
  },
  {
    id: "staff",
    school: "magic",
    name: "法杖",
    icon: "🔮",
    color: "#ab47bc",
    description: "法阵 · 连锁 · 范围爆发",
    theme: "重型施法媒介，偏控制和大范围清怪",
  },
  {
    id: "orb",
    school: "magic",
    name: "法球",
    icon: "●",
    color: "#90caf9",
    description: "环绕 · 护盾 · 自动释放",
    theme: "偏自动化和防守反击，适合后期成型",
  },
  {
    id: "drone_core",
    school: "tech",
    name: "无人机核心",
    icon: "⚙️",
    color: "#42a5f5",
    description: "自动单位 · 编队 · 协同攻击",
    theme: "用机械单位补足火力，后期靠数量和频率压制怪群",
  },
  {
    id: "energy_core",
    school: "tech",
    name: "能量核心",
    icon: "◇",
    color: "#4dd0e1",
    description: "能量弹 · 过载 · 折射",
    theme: "偏未来感的能量装置路线，强调弹道变化和爆发窗口",
  },
];

export function getWeaponsBySchool(school: SkillSchool | null): Weapon[] {
  if (!school || school === "neutral") return [];
  return WEAPONS.filter((w) => w.school === school);
}

export function getWeapon(id: string): Weapon | undefined {
  return WEAPONS.find((w) => w.id === id);
}
