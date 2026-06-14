export type HubModuleId =
  | "expedition"
  | "talents"
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
    description: "营地北侧的前线城门。靠近后按 E 开始局内战斗，再进入种族、体系和武器选择。",
    unlockHint: "默认开放。",
  },
  {
    id: "talents",
    name: "天赋祭坛",
    icon: "✦",
    description: "未来打开 src/ui/MetaTalentPanel.ts，由 MetaTalentPanel 读取 game.metaTalentState；解锁时调用 purchaseUnlockTalent(id)，通过 EconomyInventory 扣除并保存 game.economyItems。",
    unlockHint: "默认 1 个天赋槽，后续槽位和天赋解锁走局外经济。",
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
    name: "任务告示牌",
    icon: "☰",
    description: "预留区域收复、Boss 讨伐、材料收集任务入口，是营地目标导向的任务板。",
    unlockHint: "默认开放。",
  },
  {
    id: "crafting",
    name: "符文合成台",
    icon: "◇",
    description: "未来打开 src/ui/CraftingPanel.ts，由 CraftingPanel 调用 meta.craftRecipe(recipe)，完成材料扣除、合成结果应用和 game.metaUnlocks 持久化。",
    unlockHint: "获得第一份合成配方后开放。",
  },
  {
    id: "storage",
    name: "材料仓库",
    icon: "▣",
    description: "未来打开 src/ui/MaterialStoragePanel.ts，并由 MaterialStoragePanel 读取 meta.getMaterials() 展示可带出局材料、来源、用途和数量。",
    unlockHint: "默认开放。",
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
