export type HubModuleId =
  | "expedition"
  | "talents"
  | "economyStorage"
  | "workshop"
  | "apothecary"
  | "quests"
  | "crafting"
  | "storage"
  | "loot"
  | "map"
  | "archive";

export interface HubModuleDef {
  id: HubModuleId;
  name: string;
  icon: string;
  description: string;
  unlockHint: string;
}

export const HUB_MODULES: HubModuleDef[] = [
  {
    id: "expedition",
    name: "远征城门",
    icon: "▲",
    description: "营地北侧的前线城门，穿过这里即可开始新的远征，进入种族、体系和武器选择。",
    unlockHint: "默认开放。",
  },
  {
    id: "talents",
    name: "天赋祭坛",
    icon: "✦",
    description: "供奉远征者天赋的古老祭坛，可以管理已解锁天赋、装备槽位和长期成长方向。",
    unlockHint: "默认 1 个天赋槽，后续槽位和天赋解锁走局外经济。",
  },
  {
    id: "economyStorage",
    name: "资源仓库",
    icon: "¤",
    description: "集中存放远征币、魂晶等通用资源，是购买天赋、工坊升级和营地建设的基础仓库。",
    unlockHint: "默认开放，用于查看天赋、工坊、药房、职业和区域消耗。",
  },
  {
    id: "workshop",
    name: "铁匠工坊",
    icon: "⚒",
    description: "铁砧、熔炉和武器架堆满角落，未来可在这里打造神话武器和核心装备。",
    unlockHint: "带回第一批工坊材料后开放。",
  },
  {
    id: "apothecary",
    name: "药剂屋",
    icon: "✚",
    description: "药香和魔力蒸汽弥漫的小屋，未来用于制作永久药剂和局外药剂。",
    unlockHint: "完成基础远征任务后开放。",
  },
  {
    id: "quests",
    name: "指挥公告栏",
    icon: "☰",
    description: "营地发布委托和战报的公告栏，未来可查看新手引导、区域收复、Boss 讨伐和材料任务。",
    unlockHint: "默认开放，任务奖励流向局外经济、材料仓库和天赋成长。",
  },
  {
    id: "crafting",
    name: "符文合成台",
    icon: "◇",
    description: "刻满符文的合成台，可以把远征带回的材料炼成天赋槽、神话武器和营地设施。",
    unlockHint: "获得第一份合成配方后开放。",
  },
  {
    id: "storage",
    name: "材料仓库",
    icon: "▣",
    description: "专门存放神话骨骼、古代符文、星陨金属等珍贵材料，方便查看来源和用途。",
    unlockHint: "默认开放，专门查看神话骨骼、古代符文、星陨金属等合成材料。",
  },
  {
    id: "loot",
    name: "宝箱陈列台",
    icon: "▤",
    description: "记录精英和 Boss 宝箱产出的战利品，用来回顾本局带出的材料、蓝图和稀有物。",
    unlockHint: "首次开启精英或 Boss 宝箱后开放。",
  },
  {
    id: "map",
    name: "收复沙盘",
    icon: "◎",
    description: "展示区域收复进度、Boss 据点和推荐难度，是规划下一次远征路线的作战沙盘。",
    unlockHint: "完成新手远征后开放。",
  },
  {
    id: "archive",
    name: "异种档案馆",
    icon: "?",
    description: "记录已遭遇的怪物、Boss、材料、职业路线和区域故事，帮助玩家理解世界观。",
    unlockHint: "首次击败异种后开放。",
  },
];

export function getHubModule(id: HubModuleId): HubModuleDef | undefined {
  return HUB_MODULES.find((module) => module.id === id);
}
