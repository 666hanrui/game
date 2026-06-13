import type { EconomyItemDef } from "./economy";

export type CraftingRecipeCategory = "weapon" | "permanent" | "class" | "slot" | "workshop" | "apothecary" | "region";

export interface CraftingCost {
  itemId: EconomyItemDef["id"];
  amount: number;
}

export interface CraftingRecipeDef {
  id: string;
  name: string;
  category: CraftingRecipeCategory;
  resultName: string;
  description: string;
  costs: CraftingCost[];
  unlockHint: string;
}

// 合成配方：特殊物品的主要出口。
// 普通天赋不要大量消耗特殊物品，特殊物品主要用于神话武器、永久药剂、职业核心、高阶槽位等。
export const CRAFTING_RECIPES: CraftingRecipeDef[] = [
  {
    id: "myth_bow_seed",
    name: "合成神弓胚",
    category: "weapon",
    resultName: "神话弓胚",
    description: "用于后续打造神话级弓箭路线武器。",
    costs: [
      { itemId: "myth_bone", amount: 2 },
      { itemId: "hunter_badge", amount: 1 },
      { itemId: "king_core", amount: 2 },
      { itemId: "expedition_coin", amount: 1200 },
    ],
    unlockHint: "击败区域 Boss 后解锁。",
  },
  {
    id: "ancient_martial_core",
    name: "合成古武核",
    category: "weapon",
    resultName: "古武核心",
    description: "用于长枪、飞刃、狼牙棒等古武高阶路线。",
    costs: [
      { itemId: "ancient_part", amount: 3 },
      { itemId: "myth_bone", amount: 1 },
      { itemId: "king_core", amount: 1 },
      { itemId: "soul_crystal", amount: 260 },
    ],
    unlockHint: "获得古代兵装残片后解锁。",
  },
  {
    id: "arcane_focus",
    name: "合成奥术源",
    category: "weapon",
    resultName: "奥术源核",
    description: "用于魔杖、法杖、法球等魔法高阶路线。",
    costs: [
      { itemId: "element_page", amount: 2 },
      { itemId: "star_marrow", amount: 1 },
      { itemId: "king_core", amount: 1 },
      { itemId: "soul_crystal", amount: 300 },
    ],
    unlockHint: "获得元素残页后解锁。",
  },
  {
    id: "tech_reactor_core",
    name: "合成反应核",
    category: "weapon",
    resultName: "科技反应核",
    description: "用于无人机核心、能量核心和机械组高阶路线。",
    costs: [
      { itemId: "turret_plan", amount: 2 },
      { itemId: "star_marrow", amount: 2 },
      { itemId: "soul_crystal", amount: 320 },
    ],
    unlockHint: "获得炮塔蓝图后解锁。",
  },
  {
    id: "permanent_body_elixir",
    name: "炼制体魄药",
    category: "permanent",
    resultName: "永久体魄药",
    description: "永久提高少量最大生命或体魄成长。",
    costs: [
      { itemId: "myth_bone", amount: 1 },
      { itemId: "king_core", amount: 1 },
      { itemId: "camp_supply", amount: 180 },
      { itemId: "expedition_coin", amount: 800 },
    ],
    unlockHint: "药房达到指定等级后解锁。",
  },
  {
    id: "permanent_speed_elixir",
    name: "炼制迅捷药",
    category: "permanent",
    resultName: "永久迅捷药",
    description: "永久提高少量移动速度或敏捷成长。",
    costs: [
      { itemId: "star_marrow", amount: 1 },
      { itemId: "land_mark", amount: 12 },
      { itemId: "soul_crystal", amount: 240 },
      { itemId: "expedition_coin", amount: 700 },
    ],
    unlockHint: "药房研究急速类药剂后解锁。",
  },
  {
    id: "necromancer_mark",
    name: "合成亡骸印",
    category: "class",
    resultName: "亡骸印记",
    description: "用于解锁死灵法师相关天赋和职业路线。",
    costs: [
      { itemId: "crown_shard", amount: 2 },
      { itemId: "myth_bone", amount: 1 },
      { itemId: "soul_crystal", amount: 220 },
    ],
    unlockHint: "首次获得亡者冠片后解锁。",
  },
  {
    id: "mechanic_core",
    name: "合成炮台核",
    category: "class",
    resultName: "炮台核心",
    description: "用于解锁机械组炮塔路线。",
    costs: [
      { itemId: "turret_plan", amount: 2 },
      { itemId: "star_marrow", amount: 1 },
      { itemId: "camp_supply", amount: 220 },
    ],
    unlockHint: "首次获得炮塔蓝图后解锁。",
  },
  {
    id: "element_scroll",
    name: "合成元素卷",
    category: "class",
    resultName: "元素秘卷",
    description: "用于解锁元素术士路线。",
    costs: [
      { itemId: "element_page", amount: 3 },
      { itemId: "star_marrow", amount: 1 },
      { itemId: "soul_crystal", amount: 240 },
    ],
    unlockHint: "首次获得元素残页后解锁。",
  },
  {
    id: "talent_slot_token_1",
    name: "扩展天赋槽",
    category: "slot",
    resultName: "天赋槽扩展券",
    description: "用于购买中期天赋槽。前期槽位主要消耗通用货币，后期槽位才逐渐吃特殊物品。",
    costs: [
      { itemId: "expedition_coin", amount: 1200 },
      { itemId: "land_mark", amount: 12 },
      { itemId: "king_core", amount: 1 },
    ],
    unlockHint: "新手引导赠送第一个槽位后解锁。",
  },
  {
    id: "workshop_turret_project",
    name: "研发炮台包",
    category: "workshop",
    resultName: "机械炮台补给项目",
    description: "让机械炮台进入局内补给池。",
    costs: [
      { itemId: "turret_plan", amount: 1 },
      { itemId: "camp_supply", amount: 260 },
      { itemId: "expedition_coin", amount: 600 },
    ],
    unlockHint: "道具工坊开放后解锁。",
  },
  {
    id: "apothecary_power_project",
    name: "研发强攻药",
    category: "apothecary",
    resultName: "攻击药剂研究",
    description: "让更高阶的攻击药剂进入局内补给池。",
    costs: [
      { itemId: "soul_crystal", amount: 180 },
      { itemId: "mutant_core", amount: 24 },
      { itemId: "expedition_coin", amount: 520 },
    ],
    unlockHint: "药房开放后解锁。",
  },
  {
    id: "region_key_plain",
    name: "修复界标石",
    category: "region",
    resultName: "破碎平原界标",
    description: "用于推进破碎平原的区域收复关键节点。",
    costs: [
      { itemId: "land_mark", amount: 20 },
      { itemId: "king_core", amount: 1 },
      { itemId: "camp_supply", amount: 300 },
    ],
    unlockHint: "破碎平原收复进度达到指定阶段后解锁。",
  },
];

export function getCraftingRecipe(id: string): CraftingRecipeDef | undefined {
  return CRAFTING_RECIPES.find((recipe) => recipe.id === id);
}

export function getCraftingRecipesByCategory(category: CraftingRecipeCategory): CraftingRecipeDef[] {
  return CRAFTING_RECIPES.filter((recipe) => recipe.category === category);
}
