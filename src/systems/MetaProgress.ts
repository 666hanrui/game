import { getCurrentDifficulty } from "./DifficultySystem";
import { MaterialInventory, type MaterialAmounts, type SpendResult } from "./MaterialInventory";
import type { MaterialId } from "../data/materials";
import type { RecipeDefinition } from "../data/recipes";

export interface RunRewardInput {
  wave: number;
  kills: number;
  level: number;
  bossKills: number;
  goalsCompleted: number;
}

export interface RunRewardResult {
  gained: number;
  total: number;
}

export type MetaUpgradeId = "max_hp" | "damage" | "speed" | "xp_gain";

export interface MetaUpgradeDef {
  id: MetaUpgradeId;
  name: string;
  description: string;
  maxLevel: number;
  baseCost: number;
  costStep: number;
}

export type MetaUpgradeLevels = Record<MetaUpgradeId, number>;

export interface MetaBonuses {
  maxHp: number;
  damage: number;
  speed: number;
  xpMultiplier: number;
}

export interface PurchaseResult {
  ok: boolean;
  id?: MetaUpgradeId;
  name?: string;
  level?: number;
  reason?: string;
  spent?: number;
  need?: number;
  lack?: number;
  total?: number;
}

export interface MetaUnlockState {
  unlockedRecipes: string[];
  craftedItems: string[];
  talentSlots: number;
}

export interface CraftResult {
  ok: boolean;
  recipe?: RecipeDefinition;
  unlocks?: MetaUnlockState;
  spend?: SpendResult;
  reason?: string;
}

const SOUL_KEY = "game.soulCrystals";
const UPGRADE_KEY = "game.metaUpgrades";
const MATERIAL_KEY = "game.materials";
const UNLOCK_KEY = "game.metaUnlocks";

export const META_UPGRADES: MetaUpgradeDef[] = [
  { id: "max_hp", name: "生命根基", description: "每级初始生命 +10", maxLevel: 10, baseCost: 8, costStep: 5 },
  { id: "damage", name: "武器打磨", description: "每级初始伤害 +3", maxLevel: 10, baseCost: 10, costStep: 6 },
  { id: "speed", name: "疾行训练", description: "每级初始移速 +8", maxLevel: 8, baseCost: 8, costStep: 5 },
  { id: "xp_gain", name: "经验领悟", description: "每级击杀经验 +5%", maxLevel: 8, baseCost: 12, costStep: 7 },
];

const DEFAULT_LEVELS: MetaUpgradeLevels = {
  max_hp: 0,
  damage: 0,
  speed: 0,
  xp_gain: 0,
};

const DEFAULT_UNLOCKS: MetaUnlockState = {
  unlockedRecipes: [],
  craftedItems: [],
  talentSlots: 1,
};

export class MetaProgress {
  getSoulCrystals(): number {
    try {
      const raw = window.localStorage.getItem(SOUL_KEY);
      return raw ? Math.max(0, Number(raw) || 0) : 0;
    } catch {
      return 0;
    }
  }

  setSoulCrystals(value: number): void {
    try {
      window.localStorage.setItem(SOUL_KEY, String(Math.max(0, Math.floor(value))));
    } catch {
      // localStorage 不可用时忽略，游戏仍可继续运行。
    }
  }

  addSoulCrystals(amount: number): number {
    const total = this.getSoulCrystals() + Math.max(0, Math.floor(amount));
    this.setSoulCrystals(total);
    return total;
  }

  getMaterials(): MaterialInventory {
    try {
      const raw = window.localStorage.getItem(MATERIAL_KEY);
      return MaterialInventory.fromJSON(raw ? JSON.parse(raw) : undefined);
    } catch {
      return new MaterialInventory();
    }
  }

  setMaterials(inventory: MaterialInventory): void {
    try {
      window.localStorage.setItem(MATERIAL_KEY, JSON.stringify(inventory.toJSON()));
    } catch {
      // localStorage 不可用时忽略。
    }
  }

  getMaterialAmount(id: MaterialId): number {
    return this.getMaterials().get(id);
  }

  addMaterial(id: MaterialId, amount: number): MaterialInventory {
    const inventory = this.getMaterials();
    inventory.add(id, amount);
    this.setMaterials(inventory);
    return inventory;
  }

  addMaterials(items: MaterialAmounts): MaterialInventory {
    const inventory = this.getMaterials();
    inventory.addMany(items);
    this.setMaterials(inventory);
    return inventory;
  }

  spendRecipeMaterials(recipe: RecipeDefinition): SpendResult {
    const inventory = this.getMaterials();
    const result = inventory.spend(recipe.costs);
    if (result.ok) this.setMaterials(inventory);
    return result;
  }

  craftRecipe(recipe: RecipeDefinition): CraftResult {
    const spend = this.spendRecipeMaterials(recipe);
    if (!spend.ok) return { ok: false, recipe, spend, reason: "材料不足" };
    const unlocks = this.applyRecipeResult(recipe);
    return { ok: true, recipe, spend, unlocks };
  }

  getUnlockState(): MetaUnlockState {
    try {
      const raw = window.localStorage.getItem(UNLOCK_KEY);
      if (!raw) return { ...DEFAULT_UNLOCKS };
      const parsed = JSON.parse(raw) as Partial<MetaUnlockState>;
      return {
        unlockedRecipes: this.cleanStringList(parsed.unlockedRecipes),
        craftedItems: this.cleanStringList(parsed.craftedItems),
        talentSlots: Math.max(1, Math.floor(Number(parsed.talentSlots) || DEFAULT_UNLOCKS.talentSlots)),
      };
    } catch {
      return { ...DEFAULT_UNLOCKS };
    }
  }

  setUnlockState(state: MetaUnlockState): void {
    try {
      window.localStorage.setItem(UNLOCK_KEY, JSON.stringify({
        unlockedRecipes: this.uniqueStrings(state.unlockedRecipes),
        craftedItems: this.uniqueStrings(state.craftedItems),
        talentSlots: Math.max(1, Math.floor(state.talentSlots)),
      }));
    } catch {
      // localStorage 不可用时忽略。
    }
  }

  hasCraftedItem(id: string): boolean {
    return this.getUnlockState().craftedItems.includes(id);
  }

  hasUnlockedRecipe(id: string): boolean {
    return this.getUnlockState().unlockedRecipes.includes(id);
  }

  getTalentSlots(): number {
    return this.getUnlockState().talentSlots;
  }

  unlockRecipe(id: string): MetaUnlockState {
    const state = this.getUnlockState();
    state.unlockedRecipes = this.uniqueStrings([...state.unlockedRecipes, id]);
    this.setUnlockState(state);
    return state;
  }

  addCraftedItem(id: string): MetaUnlockState {
    const state = this.getUnlockState();
    state.craftedItems = this.uniqueStrings([...state.craftedItems, id]);
    this.setUnlockState(state);
    return state;
  }

  addTalentSlot(amount = 1): MetaUnlockState {
    const state = this.getUnlockState();
    state.talentSlots = Math.max(1, state.talentSlots + Math.max(0, Math.floor(amount)));
    this.setUnlockState(state);
    return state;
  }

  applyRecipeResult(recipe: RecipeDefinition): MetaUnlockState {
    const state = this.getUnlockState();
    state.unlockedRecipes = this.uniqueStrings([...state.unlockedRecipes, recipe.id]);

    if (recipe.result.type === "talent_slot") {
      state.talentSlots = Math.max(state.talentSlots, 1) + 1;
    } else {
      state.craftedItems = this.uniqueStrings([...state.craftedItems, recipe.result.id]);
    }

    this.setUnlockState(state);
    return state;
  }

  getUpgradeLevels(): MetaUpgradeLevels {
    try {
      const raw = window.localStorage.getItem(UPGRADE_KEY);
      if (!raw) return { ...DEFAULT_LEVELS };
      const parsed = JSON.parse(raw) as Partial<MetaUpgradeLevels>;
      return {
        max_hp: this.clampLevel("max_hp", parsed.max_hp ?? 0),
        damage: this.clampLevel("damage", parsed.damage ?? 0),
        speed: this.clampLevel("speed", parsed.speed ?? 0),
        xp_gain: this.clampLevel("xp_gain", parsed.xp_gain ?? 0),
      };
    } catch {
      return { ...DEFAULT_LEVELS };
    }
  }

  getUpgradeCost(id: MetaUpgradeId): number {
    const def = META_UPGRADES.find((u) => u.id === id)!;
    const level = this.getUpgradeLevels()[id];
    if (level >= def.maxLevel) return 0;
    return def.baseCost + level * def.costStep;
  }

  purchaseUpgrade(id: MetaUpgradeId): PurchaseResult {
    const def = META_UPGRADES.find((u) => u.id === id);
    if (!def) return { ok: false, id, reason: "未知强化" };

    const levels = this.getUpgradeLevels();
    const level = levels[id];
    if (level >= def.maxLevel) {
      return { ok: false, id, name: def.name, level, reason: "已满级" };
    }

    const cost = this.getUpgradeCost(id);
    const soul = this.getSoulCrystals();
    if (soul < cost) {
      return { ok: false, id, name: def.name, level, reason: "魂晶不足", need: cost, lack: cost - soul, total: soul };
    }

    levels[id] = level + 1;
    const total = soul - cost;
    this.saveUpgradeLevels(levels);
    this.setSoulCrystals(total);
    return { ok: true, id, name: def.name, level: levels[id], spent: cost, total };
  }

  resetAll(): void {
    try {
      window.localStorage.removeItem(SOUL_KEY);
      window.localStorage.removeItem(UPGRADE_KEY);
      window.localStorage.removeItem(MATERIAL_KEY);
      window.localStorage.removeItem(UNLOCK_KEY);
    } catch {
      // localStorage 不可用时忽略。
    }
  }

  getBonuses(): MetaBonuses {
    const lv = this.getUpgradeLevels();
    return {
      maxHp: lv.max_hp * 10,
      damage: lv.damage * 3,
      speed: lv.speed * 8,
      xpMultiplier: 1 + lv.xp_gain * 0.05,
    };
  }

  settleRun(input: RunRewardInput): RunRewardResult {
    const gained = this.calculateReward(input);
    const total = this.getSoulCrystals() + gained;
    this.setSoulCrystals(total);
    return { gained, total };
  }

  calculateReward(input: RunRewardInput): number {
    const waveReward = Math.max(0, input.wave - 1) * 2;
    const killReward = Math.floor(input.kills / 8);
    const levelReward = Math.max(0, input.level - 1) * 2;
    const bossReward = input.bossKills * 18;
    const goalReward = input.goalsCompleted * 10;
    const base = Math.max(1, waveReward + killReward + levelReward + bossReward + goalReward);
    return Math.max(1, Math.floor(base * getCurrentDifficulty().soulRewardMult));
  }

  private saveUpgradeLevels(levels: MetaUpgradeLevels): void {
    try {
      window.localStorage.setItem(UPGRADE_KEY, JSON.stringify(levels));
    } catch {
      // localStorage 不可用时忽略。
    }
  }

  private clampLevel(id: MetaUpgradeId, level: number): number {
    const def = META_UPGRADES.find((u) => u.id === id)!;
    return Math.max(0, Math.min(def.maxLevel, Math.floor(Number(level) || 0)));
  }

  private cleanStringList(value: unknown): string[] {
    return Array.isArray(value) ? this.uniqueStrings(value.filter((item): item is string => typeof item === "string" && item.length > 0)) : [];
  }

  private uniqueStrings(value: string[]): string[] {
    return [...new Set(value)];
  }
}
