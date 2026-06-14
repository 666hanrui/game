import { getChestLootTable, getChestTierForSource, type ChestSource, type ChestTier, type LootEntry } from "../data/chestLoot";
import type { MaterialId } from "../data/materials";
import type { MaterialAmounts } from "./MaterialInventory";

export interface ChestDropConfig {
  eliteSmallChestChance: number;
  bossLargeChestChance: number;
  mythicChestChance: number;
}

export interface ChestDropContext {
  source: ChestSource;
  wave: number;
  difficulty?: "novice" | "normal" | "hard" | "nightmare" | "hell";
  luck?: number;
}

export interface ChestReward {
  tier: ChestTier;
  name: string;
  materials: MaterialAmounts;
}

const DEFAULT_CONFIG: ChestDropConfig = {
  eliteSmallChestChance: 0.28,
  bossLargeChestChance: 1,
  mythicChestChance: 0.04,
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function randInt(min: number, max: number): number {
  const a = Math.ceil(min);
  const b = Math.floor(max);
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

function weightedPick(entries: LootEntry[]): LootEntry | null {
  const total = entries.reduce((sum, item) => sum + Math.max(0, item.weight), 0);
  if (total <= 0) return null;

  let roll = Math.random() * total;
  for (const entry of entries) {
    roll -= Math.max(0, entry.weight);
    if (roll <= 0) return entry;
  }
  return entries[entries.length - 1] ?? null;
}

function addMaterial(target: MaterialAmounts, id: MaterialId, amount: number): void {
  target[id] = (target[id] ?? 0) + amount;
}

export class ChestDropSystem {
  private config: ChestDropConfig;

  constructor(config?: Partial<ChestDropConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...(config ?? {}) };
  }

  shouldDropChest(context: ChestDropContext): boolean {
    const luck = Math.max(0, context.luck ?? 0);
    const luckBonus = Math.min(0.35, luck * 0.01);

    if (context.source === "boss") return Math.random() < clamp01(this.config.bossLargeChestChance);
    if (context.source === "reclaim") return true;
    if (context.source === "event") return true;
    return Math.random() < clamp01(this.config.eliteSmallChestChance + luckBonus);
  }

  rollChest(context: ChestDropContext): ChestReward | null {
    if (!this.shouldDropChest(context)) return null;

    const baseTier = getChestTierForSource(context.source);
    const tier = this.upgradeTierByContext(baseTier, context);
    const table = getChestLootTable(tier);
    const materials: MaterialAmounts = {};

    for (const entry of table.guaranteed) {
      addMaterial(materials, entry.materialId, randInt(entry.min, entry.max));
    }

    for (let i = 0; i < table.rolls; i++) {
      const entry = weightedPick(table.pool);
      if (!entry) continue;
      addMaterial(materials, entry.materialId, randInt(entry.min, entry.max));
    }

    return { tier, name: table.name, materials };
  }

  private upgradeTierByContext(tier: ChestTier, context: ChestDropContext): ChestTier {
    const luck = Math.max(0, context.luck ?? 0);
    const difficulty = context.difficulty ?? "normal";
    const difficultyBonus = difficulty === "hell" ? 0.08 : difficulty === "nightmare" ? 0.05 : difficulty === "hard" ? 0.02 : 0;
    const waveBonus = Math.min(0.12, Math.max(0, context.wave - 10) * 0.004);
    const chance = clamp01(this.config.mythicChestChance + difficultyBonus + waveBonus + luck * 0.003);

    if ((tier === "large" || tier === "mythic") && Math.random() < chance) return "mythic";
    return tier;
  }
}
