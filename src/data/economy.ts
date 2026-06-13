export type EconomyItemTier = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type EconomyItemKind = "general" | "special";
export type EconomyItemUse =
  | "talent"
  | "slot"
  | "workshop"
  | "apothecary"
  | "crafting"
  | "class"
  | "weapon"
  | "permanent"
  | "region";

export interface EconomyItemDef {
  id: string;
  name: string;
  kind: EconomyItemKind;
  tier: EconomyItemTier;
  color: string;
  icon: string;
  description: string;
  source: string[];
  primaryUses: EconomyItemUse[];
}

export const ECONOMY_ITEMS: EconomyItemDef[] = [
  {
    id: "expedition_coin",
    name: "远征币",
    kind: "general",
    tier: "common",
    color: "#f6c65b",
    icon: "◎",
    description: "远征营地最基础的通用货币。",
    source: ["波次结算", "普通任务", "区域收复基础奖励"],
    primaryUses: ["talent", "slot", "workshop", "apothecary"],
  },
  {
    id: "soul_crystal",
    name: "魂晶",
    kind: "general",
    tier: "common",
    color: "#80deea",
    icon: "◇",
    description: "从异种身上回收的能量晶体。",
    source: ["清剿奖励", "小宝箱", "任务奖励"],
    primaryUses: ["talent", "workshop", "apothecary", "crafting"],
  },
  {
    id: "mutant_core",
    name: "异种残核",
    kind: "general",
    tier: "uncommon",
    color: "#b0bec5",
    icon: "●",
    description: "普通异种体内留下的残余核心。",
    source: ["普通异种", "小宝箱", "分解低级材料"],
    primaryUses: ["talent", "workshop", "crafting"],
  },
  {
    id: "camp_supply",
    name: "营地物资",
    kind: "general",
    tier: "common",
    color: "#a5d6a7",
    icon: "▣",
    description: "远征营地建设和维护用的普通物资。",
    source: ["任务系统", "区域收复", "普通宝箱奖励"],
    primaryUses: ["workshop", "apothecary", "region"],
  },
  {
    id: "land_mark",
    name: "裂土印记",
    kind: "general",
    tier: "rare",
    color: "#bc8f5a",
    icon: "⬟",
    description: "清理污染土地后留下的区域印记，可作为前中期进阶材料。",
    source: ["精英怪", "小宝箱", "区域事件"],
    primaryUses: ["slot", "region", "talent"],
  },
  {
    id: "myth_bone",
    name: "神话生物骨骼",
    kind: "special",
    tier: "legendary",
    color: "#f5f5f5",
    icon: "✦",
    description: "疑似神话生物遗骸的一部分，适合参与高阶合成。",
    source: ["Boss 大宝箱", "封印宝箱", "特殊区域事件"],
    primaryUses: ["weapon", "permanent", "class", "crafting"],
  },
  {
    id: "king_core",
    name: "王骸晶核",
    kind: "special",
    tier: "epic",
    color: "#ffd54f",
    icon: "◆",
    description: "Boss 级异种体内凝结的高能核心。",
    source: ["Boss 大宝箱", "高难度任务"],
    primaryUses: ["slot", "class", "weapon", "region"],
  },
  {
    id: "star_marrow",
    name: "星陨晶髓",
    kind: "special",
    tier: "legendary",
    color: "#4fc3f7",
    icon: "✧",
    description: "陨星晶体内部流动的稀有能量物质。",
    source: ["晶化区域", "特殊 Boss", "大宝箱"],
    primaryUses: ["weapon", "permanent", "apothecary", "crafting"],
  },
  {
    id: "ancient_part",
    name: "古代兵装残片",
    kind: "special",
    tier: "epic",
    color: "#d7a86e",
    icon: "▲",
    description: "古代武装破碎后留下的残片。",
    source: ["遗迹事件", "大宝箱", "古武区域"],
    primaryUses: ["weapon", "class", "crafting"],
  },
  {
    id: "crown_shard",
    name: "亡者冠片",
    kind: "special",
    tier: "epic",
    color: "#cfd8dc",
    icon: "♜",
    description: "与亡灵力量相关的职业材料。",
    source: ["骸骨区域", "Boss 大宝箱", "职业任务"],
    primaryUses: ["class", "talent", "crafting"],
  },
  {
    id: "turret_plan",
    name: "炮塔蓝图",
    kind: "special",
    tier: "epic",
    color: "#4dd0e1",
    icon: "▤",
    description: "记录自动炮塔结构的残缺蓝图。",
    source: ["机械遗迹", "封印宝箱", "职业任务"],
    primaryUses: ["class", "workshop", "crafting"],
  },
  {
    id: "element_page",
    name: "元素残页",
    kind: "special",
    tier: "epic",
    color: "#ce93d8",
    icon: "✶",
    description: "记录元素术式的残缺书页。",
    source: ["法术遗迹", "封印宝箱", "职业任务"],
    primaryUses: ["class", "talent", "crafting"],
  },
  {
    id: "hunter_badge",
    name: "猎王徽记",
    kind: "special",
    tier: "epic",
    color: "#aed581",
    icon: "⌖",
    description: "猎杀强大异种后获得的徽记。",
    source: ["Boss 挑战", "区域任务", "大宝箱"],
    primaryUses: ["class", "talent", "crafting"],
  },
];

export function getEconomyItem(id: string): EconomyItemDef | undefined {
  return ECONOMY_ITEMS.find((item) => item.id === id);
}

export function getEconomyItemsByKind(kind: EconomyItemKind): EconomyItemDef[] {
  return ECONOMY_ITEMS.filter((item) => item.kind === kind);
}

export function isGeneralItem(id: string): boolean {
  return getEconomyItem(id)?.kind === "general";
}

export function isSpecialItem(id: string): boolean {
  return getEconomyItem(id)?.kind === "special";
}
