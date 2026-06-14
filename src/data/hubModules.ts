export type HubModuleId =
  | "expedition"
  | "talents"
  | "workshop"
  | "apothecary"
  | "quests"
  | "crafting"
  | "storage"
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
    description: "营地北侧的前线城门。靠近后按 E 开始远征，再进入种族、体系和武器选择。",
    unlockHint: "默认开放。",
  },
  {
    id: "talents",
    name: "天赋殿堂",
    icon: "✦",
    description: "查看、解锁、购买、装备天赋。新手引导会赠送第一个天赋槽，后续槽位需要带出局资源购买。",
    unlockHint: "完成新手引导后开放。",
  },
  {
    id: "workshop",
    name: "铁匠工坊",
    icon: "⚒",
    description: "强化局内补给池和战术装置，例如磁铁范围、护盾强度、诱饵人偶、机械炮台和工坊扩建。",
    unlockHint: "带回第一批工坊材料后开放。",
  },
  {
    id: "apothecary",
    name: "药剂屋",
    icon: "✚",
    description: "研究药剂类局内补给，例如血包、回春露、急速药剂、攻击药剂、暴击药剂；永久药剂走合成线。",
    unlockHint: "完成基础远征任务后开放。",
  },
  {
    id: "quests",
    name: "任务告示牌",
    icon: "☰",
    description: "领取清剿、精英、Boss、材料、体系试炼和区域收复任务，是营地目标导向的入口。",
    unlockHint: "默认开放。",
  },
  {
    id: "crafting",
    name: "符文合成台",
    icon: "◇",
    description: "使用异种残核、神话生物骨骼、古代符文、机械遗芯、星陨金属等材料合成高阶物品。",
    unlockHint: "获得第一份合成配方后开放。",
  },
  {
    id: "storage",
    name: "材料仓库",
    icon: "▣",
    description: "查看所有可以带出局的材料、来源、用途、数量和可合成目标，通用物品与特殊材料分区存放。",
    unlockHint: "默认开放。",
  },
  {
    id: "map",
    name: "收复沙盘",
    icon: "◎",
    description: "查看被异种占领的区域、收复进度、区域 Boss、特殊材料和推荐难度。",
    unlockHint: "完成新手远征后开放。",
  },
  {
    id: "archive",
    name: "异种档案馆",
    icon: "?",
    description: "记录已遭遇的怪物、Boss、材料、职业路线和区域故事。",
    unlockHint: "首次击败异种后开放。",
  },
];

export function getHubModule(id: HubModuleId): HubModuleDef | undefined {
  return HUB_MODULES.find((module) => module.id === id);
}
