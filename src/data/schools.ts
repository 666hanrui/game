// 体系定义：体系决定可用武器类型，武器再决定后续升级路线
export interface School {
  id: string;
  name: string;
  description: string;
  icon: string;     // 图标文字（emoji 或简写）
  color: string;    // UI 颜色
  theme: string;    // 一句话定位
}

export const SCHOOLS: School[] = [
  {
    id: "martial",
    name: "古武体系",
    description: "弓箭 · 飞刀 · 剑枪等冷兵器",
    icon: "🏹",
    color: "#ffd54f",
    theme: "以冷兵器为核心，当前先做弓箭成长线：多重箭、追踪箭、爆炸箭",
  },
  {
    id: "magic",
    name: "魔法体系",
    description: "魔杖 · 法杖 · 法球 · 魔导书",
    icon: "🔮",
    color: "#ab47bc",
    theme: "只能使用魔法媒介，靠元素、法球、法阵和范围爆发成长",
  },
  {
    id: "tech",
    name: "科技体系",
    description: "枪械 · 无人机 · 激光 · 炮台",
    icon: "⚙️",
    color: "#42a5f5",
    theme: "使用现代/未来武器，靠自动火力、追踪模块和机械单位压制怪群",
  },
];

export function getSchool(id: string): School {
  return SCHOOLS.find((s) => s.id === id) ?? SCHOOLS[0];
}
