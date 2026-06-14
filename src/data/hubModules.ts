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

export type HubModuleAction =
  | "start"
  | "open_crafting"
  | "open_material_storage"
  | "open_economy_storage"
  | "open_talents"
  | "open_quests";

export interface HubModuleDef {
  id: HubModuleId;
  name: string;
  icon: string;
  description: string;
  unlockHint: string;
  action?: HubModuleAction;
}

export const HUB_MODULES: HubModuleDef[] = [
  {
    id: "expedition",
    name: "远征城门",
    icon: "▲",
    action: "start",
    description: "营地北侧的前线城门。靠近后按 E 开始局内战斗，再进入种族、体系和武器选择。",
    unlockHint: "默认开放。",
  },
  {
    id: "talents",
    name: "天赋祭坛",
    icon: "✦",
    action: "open_talents",
    description: "未来打开 src/ui/MetaTalentPanel.ts 管理 game.metaTalentState；进入战斗前由 new MetaTalentRuntime().buildSnapshot() 汇总已装备天赋为统一战斗修正。",
    unlockHint: "默认 1 个天赋槽，后续槽位和天赋解锁走局外经济。",
  },
  {
    id: "economyStorage",
    name: "资源仓库",
    icon: "¤",
    action: "open_economy_storage",
    description: "未来打开 src/ui/EconomyStoragePanel.ts，并由 EconomyStoragePanel 读取 EconomyInventory.load() 展示 game.economyItems 中的远征币、魂晶和局外经济物品。",
    unlockHint: "默认开放，用于查看天赋、工坊、药房、职业和区域消耗。",
  },
  {
    id: "workshop",
    name: "铁匠工坊",
    icon: "⚒",
    description: "预留神话武器和装备合成入口，后续可接裂骨狼牙、星纹法杖、蜂巢中枢等神话路线。",
    unlockHint: "带回第一批工坊材料后开放。",
  },
  {
    id: "apothecary",
    name: "药剂屋",
    icon: "✚",
    description: "预留永久药剂和局外药剂入口，不出售宝箱材料奖励，也不把宝箱产物混成局内临时补给。",
    unlockHint: "完成基础远征任务后开放。",
  },
  {
    id: "quests",
    name: "指挥公告栏",
    icon: "☰",
    action: "open_quests",
    description: "未来打开 src/ui/QuestBoardPanel.ts，并由 QuestBoardPanel 读取 QuestProgress / game.questState，展示新手引导、区域收复、Boss 讨伐、材料收集和营地建设任务。",
    unlockHint: "默认开放，任务奖励流向 EconomyInventory、MaterialInventory、MetaTalentProgress 或 MetaProgress。",
  },
  {
    id: "crafting",
    name: "符文合成台",
    icon: "◇",
    action: "open_crafting",
    description: "未来打开 src/ui/CraftingPanel.ts，由 CraftingPanel 调用 meta.craftRecipe(recipe)，完成材料扣除、合成结果应用和 game.metaUnlocks 持久化。",
    unlockHint: "获得第一份合成配方后开放。",
  },
  {
    id: "storage",
    name: "材料仓库",
    icon: "▣",
    action: "open_material_storage",
    description: "未来打开 src/ui/MaterialStoragePanel.ts，并由 MaterialStoragePanel 读取 meta.getMaterials() 展示可带出局材料、来源、用途和数量。",
    unlockHint: "默认开放，专门查看神话骨骼、古代符文、星陨金属等合成材料。",
  },
  {
    id: "loot",
    name: "宝箱陈列台",
    icon: "▤",
    description: "未来展示 ChestDropSystem 产物：小宝箱、大宝箱、神话宝箱，以及本局带出的材料奖励。",
    unlockHint: "首次开启精英或 Boss 宝箱后开放。",
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
