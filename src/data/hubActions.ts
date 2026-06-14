import type { HubModuleId } from "./hubModules";
import type { HubSubPanelId } from "../ui/HubSubPanelManager";

export type HubCampAction =
  | "start"
  | "open_crafting"
  | "open_material_storage"
  | "open_economy_storage"
  | "open_talents"
  | "open_quests"
  | "open_workshop"
  | "open_apothecary"
  | "open_loot"
  | "open_map"
  | "open_archive";

export interface HubActionDef {
  moduleId: HubModuleId;
  action: HubCampAction;
  label: string;
  description: string;
  subPanelId?: HubSubPanelId;
}

export const HUB_ACTIONS: HubActionDef[] = [
  {
    moduleId: "expedition",
    action: "start",
    label: "开始远征",
    description: "进入局内流程，随后选择种族、体系和武器。",
  },
  {
    moduleId: "talents",
    action: "open_talents",
    label: "打开天赋祭坛",
    description: "打开 MetaTalentPanel，管理局外天赋槽位、解锁和装备。",
    subPanelId: "talents",
  },
  {
    moduleId: "economyStorage",
    action: "open_economy_storage",
    label: "打开资源仓库",
    description: "打开 EconomyStoragePanel，查看远征币、魂晶和局外经济物品。",
    subPanelId: "economy_storage",
  },
  {
    moduleId: "quests",
    action: "open_quests",
    label: "打开任务板",
    description: "打开 QuestBoardPanel，查看任务进度并领取奖励。",
    subPanelId: "quests",
  },
  {
    moduleId: "crafting",
    action: "open_crafting",
    label: "打开合成台",
    description: "打开 CraftingPanel，消耗材料合成天赋槽、神话武器、药剂和营地设施。",
    subPanelId: "crafting",
  },
  {
    moduleId: "storage",
    action: "open_material_storage",
    label: "打开材料仓库",
    description: "打开 MaterialStoragePanel，查看可带出局材料、来源和用途。",
    subPanelId: "material_storage",
  },
  {
    moduleId: "workshop",
    action: "open_workshop",
    label: "打开铁匠工坊",
    description: "打开 WorkshopPanel，占位展示神话武器和装备工坊路线。",
    subPanelId: "workshop",
  },
  {
    moduleId: "apothecary",
    action: "open_apothecary",
    label: "打开药剂屋",
    description: "打开 ApothecaryPanel，占位展示永久药剂和局外药剂路线。",
    subPanelId: "apothecary",
  },
  {
    moduleId: "loot",
    action: "open_loot",
    label: "查看战利品",
    description: "打开 LootPanel，占位展示宝箱陈列台和本局带出物。",
    subPanelId: "loot",
  },
  {
    moduleId: "map",
    action: "open_map",
    label: "查看收复沙盘",
    description: "打开 RegionMapPanel，占位展示区域收复地图、Boss 和推荐难度。",
    subPanelId: "region_map",
  },
  {
    moduleId: "archive",
    action: "open_archive",
    label: "查看异种档案",
    description: "打开 ArchivePanel，占位展示怪物、Boss、材料和世界观档案。",
    subPanelId: "archive",
  },
];

export function getHubActionByModule(moduleId: HubModuleId): HubActionDef | undefined {
  return HUB_ACTIONS.find((item) => item.moduleId === moduleId);
}

export function getHubAction(action: HubCampAction): HubActionDef | undefined {
  return HUB_ACTIONS.find((item) => item.action === action);
}

export function getHubSubPanelId(action: HubCampAction): HubSubPanelId | undefined {
  return getHubAction(action)?.subPanelId;
}
