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
    description: "营地北侧的前线城门。靠近后按 E 返回 start，开始局内战斗，再进入种族、体系和武器选择。",
    unlockHint: "默认开放。",
  },
  {
    id: "talents",
    name: "天赋祭坛",
    icon: "✦",
    description: "返回 open_talents，由 HubSubPanelManager 打开 MetaTalentPanel，管理 game.metaTalentState；进入战斗前由 MetaTalentRuntime 汇总已装备天赋。",
    unlockHint: "默认 1 个天赋槽，后续槽位和天赋解锁走局外经济。",
  },
  {
    id: "economyStorage",
    name: "资源仓库",
    icon: "¤",
    description: "返回 open_economy_storage，由 HubSubPanelManager 打开 EconomyStoragePanel，查看 game.economyItems 中的远征币、魂晶和局外经济物品。",
    unlockHint: "默认开放，用于查看天赋、工坊、药房、职业和区域消耗。",
  },
  {
    id: "workshop",
    name: "铁匠工坊",
    icon: "⚒",
    description: "返回 open_workshop，由 HubSubPanelManager 打开 WorkshopPanel，展示神话武器和装备工坊路线。",
    unlockHint: "带回第一批工坊材料后开放。",
  },
  {
    id: "apothecary",
    name: "药剂屋",
    icon: "✚",
    description: "返回 open_apothecary，由 HubSubPanelManager 打开 ApothecaryPanel，展示永久药剂和局外药剂路线；不出售宝箱材料奖励。",
    unlockHint: "完成基础远征任务后开放。",
  },
  {
    id: "quests",
    name: "指挥公告栏",
    icon: "☰",
    description: "返回 open_quests，由 HubSubPanelManager 打开 QuestBoardPanel，展示新手引导、区域收复、Boss 讨伐、材料收集和营地建设任务。",
    unlockHint: "默认开放，任务奖励流向 EconomyInventory、MaterialInventory、MetaTalentProgress 或 MetaProgress。",
  },
  {
    id: "crafting",
    name: "符文合成台",
    icon: "◇",
    description: "返回 open_crafting，由 HubSubPanelManager 打开 CraftingPanel，调用 meta.craftRecipe(recipe) 完成材料扣除、结果应用和持久化。",
    unlockHint: "获得第一份合成配方后开放。",
  },
  {
    id: "storage",
    name: "材料仓库",
    icon: "▣",
    description: "返回 open_material_storage，由 HubSubPanelManager 打开 MaterialStoragePanel，展示可带出局材料、来源、用途和数量。",
    unlockHint: "默认开放，专门查看神话骨骼、古代符文、星陨金属等合成材料。",
  },
  {
    id: "loot",
    name: "宝箱陈列台",
    icon: "▤",
    description: "返回 open_loot，由 HubSubPanelManager 打开 LootPanel，展示宝箱陈列台和本局带出物。",
    unlockHint: "首次开启精英或 Boss 宝箱后开放。",
  },
  {
    id: "map",
    name: "收复沙盘",
    icon: "◎",
    description: "返回 open_map，由 HubSubPanelManager 打开 RegionMapPanel，展示区域收复地图、Boss 和推荐难度。",
    unlockHint: "完成新手远征后开放。",
  },
  {
    id: "archive",
    name: "异种档案馆",
    icon: "?",
    description: "返回 open_archive，由 HubSubPanelManager 打开 ArchivePanel，记录已遭遇的怪物、Boss、材料、职业路线和区域故事。",
    unlockHint: "首次击败异种后开放。",
  },
];

export function getHubModule(id: HubModuleId): HubModuleDef | undefined {
  return HUB_MODULES.find((module) => module.id === id);
}
