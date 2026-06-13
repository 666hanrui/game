// 体系定义：三条路线，决定技能池
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
    id: "tech",
    name: "科技系",
    description: "远程火力 · 召唤 · AOE",
    icon: "⚙️",
    color: "#42a5f5",
    theme: "无人机组、追踪导弹、电磁脉冲——用科技碾压一切",
  },
  {
    id: "martial",
    name: "古武系",
    description: "近战强化 · 暴击 · 生存",
    icon: "👊",
    color: "#ef5350",
    theme: "铁布衫、寸拳、连斩——贴身肉搏，刀刀见血",
  },
  {
    id: "magic",
    name: "魔法系",
    description: "元素效果 · 控制 · 爆发",
    icon: "🔮",
    color: "#ab47bc",
    theme: "冰霜、火球、闪现——驾驭元素之力的法师",
  },
];

export function getSchool(id: string): School {
  return SCHOOLS.find((s) => s.id === id) ?? SCHOOLS[0];
}
