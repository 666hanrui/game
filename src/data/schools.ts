// 武器流派定义：第一次升级时锁定，后续升级主要围绕同一武器持续成长
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
    id: "archer",
    name: "弓箭手",
    description: "多重箭 · 追踪箭 · 爆炸箭",
    icon: "🏹",
    color: "#ffd54f",
    theme: "从单发成长到满屏箭雨，核心参考《弓箭手大作战》的升级爽感",
  },
  {
    id: "blade",
    name: "飞刃使",
    description: "回旋刃 · 环绕刃 · 吸血",
    icon: "🗡️",
    color: "#ef5350",
    theme: "偏近中距离，靠飞刃数量、回旋轨迹和吸血生存滚雪球",
  },
  {
    id: "magic",
    name: "魔法师",
    description: "法球 · 元素 · 连锁爆发",
    icon: "🔮",
    color: "#ab47bc",
    theme: "偏技能流，用元素控制和范围爆发处理怪群",
  },
];

export function getSchool(id: string): School {
  return SCHOOLS.find((s) => s.id === id) ?? SCHOOLS[0];
}
