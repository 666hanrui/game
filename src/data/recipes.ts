import type { MaterialId } from "./materials";

export type RecipeCategory = "talent" | "weapon" | "potion" | "building" | "utility";
export type RecipeTier = "basic" | "advanced" | "legendary";

export interface RecipeCost {
  materialId: MaterialId;
  amount: number;
}

export interface RecipeDefinition {
  id: string;
  name: string;
  category: RecipeCategory;
  tier: RecipeTier;
  description: string;
  costs: RecipeCost[];
  unlockHint: string;
  result: {
    type: "talent_slot" | "talent" | "weapon" | "permanent_potion" | "building_upgrade" | "consumable";
    id: string;
    label: string;
  };
}

export const RECIPES: RecipeDefinition[] = [
  {
    id: "talent_slot_02",
    name: "第二天赋槽",
    category: "talent",
    tier: "basic",
    description: "让玩家开局可以额外携带 1 个天赋。",
    costs: [
      { materialId: "gold_leaf", amount: 180 },
      { materialId: "soul_crystal", amount: 12 },
    ],
    unlockHint: "完成新手引导后出现。",
    result: { type: "talent_slot", id: "slot_02", label: "天赋槽位 +1" },
  },
  {
    id: "talent_blood_combo",
    name: "连击嗜血",
    category: "talent",
    tier: "advanced",
    description: "四字天赋示例：连击数越高，击杀回复越明显。",
    costs: [
      { materialId: "gold_leaf", amount: 320 },
      { materialId: "blood_amber", amount: 3 },
      { materialId: "soul_crystal", amount: 20 },
    ],
    unlockHint: "击败兽类精英后出现。",
    result: { type: "talent", id: "combo_lifesteal", label: "连击嗜血" },
  },
  {
    id: "myth_weapon_bone_mace",
    name: "裂骨狼牙",
    category: "weapon",
    tier: "legendary",
    description: "狼牙棒神话路线，强化破甲、震地和击退。",
    costs: [
      { materialId: "myth_bone", amount: 4 },
      { materialId: "blood_amber", amount: 6 },
      { materialId: "alien_core", amount: 2 },
      { materialId: "soul_crystal", amount: 60 },
    ],
    unlockHint: "使用狼牙棒击败 Boss 后出现。",
    result: { type: "weapon", id: "bone_mace", label: "神话武器：裂骨狼牙" },
  },
  {
    id: "myth_weapon_rune_staff",
    name: "星纹法杖",
    category: "weapon",
    tier: "legendary",
    description: "法杖神话路线，强化法阵、连锁和大范围爆发。",
    costs: [
      { materialId: "ancient_rune", amount: 5 },
      { materialId: "spirit_shard", amount: 6 },
      { materialId: "star_metal", amount: 1 },
      { materialId: "soul_crystal", amount: 80 },
    ],
    unlockHint: "魔法体系通关第三个区域后出现。",
    result: { type: "weapon", id: "rune_staff", label: "神话武器：星纹法杖" },
  },
  {
    id: "myth_weapon_drone_hive",
    name: "蜂巢中枢",
    category: "weapon",
    tier: "legendary",
    description: "无人机核心神话路线，强化编队、炮塔和自动单位上限。",
    costs: [
      { materialId: "machine_core", amount: 6 },
      { materialId: "alien_core", amount: 3 },
      { materialId: "star_metal", amount: 1 },
      { materialId: "soul_crystal", amount: 80 },
    ],
    unlockHint: "科技体系击败机械 Boss 后出现。",
    result: { type: "weapon", id: "drone_hive", label: "神话武器：蜂巢中枢" },
  },
  {
    id: "permanent_potion_vital_root",
    name: "固本药剂",
    category: "potion",
    tier: "advanced",
    description: "永久提升少量最大生命，属于局外成长药。",
    costs: [
      { materialId: "spirit_shard", amount: 2 },
      { materialId: "blood_amber", amount: 2 },
      { materialId: "gold_leaf", amount: 260 },
    ],
    unlockHint: "药房建成后出现。",
    result: { type: "permanent_potion", id: "max_hp_small", label: "永久最大生命 +3" },
  },
  {
    id: "building_forge_02",
    name: "工坊扩建",
    category: "building",
    tier: "advanced",
    description: "升级道具工坊，解锁高阶武器合成。",
    costs: [
      { materialId: "rift_mark", amount: 5 },
      { materialId: "machine_core", amount: 2 },
      { materialId: "gold_leaf", amount: 500 },
    ],
    unlockHint: "收复第一区域后出现。",
    result: { type: "building_upgrade", id: "forge_lv2", label: "道具工坊 Lv.2" },
  },
  {
    id: "utility_land_purifier",
    name: "净土装置",
    category: "utility",
    tier: "advanced",
    description: "用于收复被异种污染的土地，推进世界地图进度。",
    costs: [
      { materialId: "rift_mark", amount: 8 },
      { materialId: "alien_core", amount: 2 },
      { materialId: "ancient_rune", amount: 1 },
    ],
    unlockHint: "完成任务板的区域收复任务后出现。",
    result: { type: "consumable", id: "land_purifier", label: "净土装置" },
  },
];

export function getRecipe(id: string): RecipeDefinition | undefined {
  return RECIPES.find((recipe) => recipe.id === id);
}

export function getRecipesByCategory(category: RecipeCategory): RecipeDefinition[] {
  return RECIPES.filter((recipe) => recipe.category === category);
}

export function getRecipesByTier(tier: RecipeTier): RecipeDefinition[] {
  return RECIPES.filter((recipe) => recipe.tier === tier);
}
