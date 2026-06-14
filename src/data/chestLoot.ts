import type { MaterialId } from "./materials";

export type ChestTier = "small" | "large" | "mythic";
export type ChestSource = "elite" | "boss" | "event" | "reclaim";

export interface LootEntry {
  materialId: MaterialId;
  min: number;
  max: number;
  weight: number;
}

export interface ChestLootTable {
  tier: ChestTier;
  name: string;
  description: string;
  rolls: number;
  guaranteed: LootEntry[];
  pool: LootEntry[];
}

export const CHEST_LOOT_TABLES: ChestLootTable[] = [
  {
    tier: "small",
    name: "小宝箱",
    description: "精英怪概率掉落，主要提供少量可带出资源和中低阶材料。",
    rolls: 2,
    guaranteed: [
      { materialId: "soul_crystal", min: 2, max: 5, weight: 1 },
    ],
    pool: [
      { materialId: "gold_leaf", min: 40, max: 90, weight: 28 },
      { materialId: "alien_core", min: 1, max: 2, weight: 16 },
      { materialId: "rift_mark", min: 1, max: 2, weight: 14 },
      { materialId: "blood_amber", min: 1, max: 1, weight: 10 },
      { materialId: "spirit_shard", min: 1, max: 1, weight: 10 },
      { materialId: "ancient_rune", min: 1, max: 1, weight: 4 },
      { materialId: "machine_core", min: 1, max: 1, weight: 4 },
    ],
  },
  {
    tier: "large",
    name: "大宝箱",
    description: "Boss 必定掉落，主要提供稀有材料和高阶合成资源。",
    rolls: 4,
    guaranteed: [
      { materialId: "soul_crystal", min: 8, max: 18, weight: 1 },
      { materialId: "alien_core", min: 1, max: 3, weight: 1 },
    ],
    pool: [
      { materialId: "gold_leaf", min: 120, max: 260, weight: 22 },
      { materialId: "myth_bone", min: 1, max: 2, weight: 10 },
      { materialId: "ancient_rune", min: 1, max: 2, weight: 10 },
      { materialId: "machine_core", min: 1, max: 2, weight: 10 },
      { materialId: "rift_mark", min: 2, max: 5, weight: 12 },
      { materialId: "spirit_shard", min: 1, max: 3, weight: 12 },
      { materialId: "blood_amber", min: 1, max: 3, weight: 12 },
      { materialId: "star_metal", min: 1, max: 1, weight: 2 },
    ],
  },
  {
    tier: "mythic",
    name: "神话宝箱",
    description: "高难 Boss、噩梦以上难度或稀有事件产出，偏向神话合成线。",
    rolls: 5,
    guaranteed: [
      { materialId: "soul_crystal", min: 20, max: 42, weight: 1 },
      { materialId: "star_metal", min: 1, max: 1, weight: 1 },
    ],
    pool: [
      { materialId: "myth_bone", min: 2, max: 4, weight: 14 },
      { materialId: "ancient_rune", min: 2, max: 4, weight: 14 },
      { materialId: "machine_core", min: 2, max: 4, weight: 14 },
      { materialId: "alien_core", min: 3, max: 6, weight: 12 },
      { materialId: "rift_mark", min: 5, max: 10, weight: 10 },
      { materialId: "spirit_shard", min: 3, max: 6, weight: 10 },
      { materialId: "blood_amber", min: 3, max: 6, weight: 10 },
      { materialId: "star_metal", min: 1, max: 2, weight: 4 },
    ],
  },
];

export function getChestLootTable(tier: ChestTier): ChestLootTable {
  return CHEST_LOOT_TABLES.find((table) => table.tier === tier) ?? CHEST_LOOT_TABLES[0];
}

export function getChestTierForSource(source: ChestSource): ChestTier {
  switch (source) {
    case "boss": return "large";
    case "event": return "small";
    case "reclaim": return "large";
    case "elite":
    default:
      return "small";
  }
}
