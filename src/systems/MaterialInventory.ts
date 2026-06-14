import { getMaterial, type MaterialDefinition, type MaterialId } from "../data/materials";
import type { RecipeDefinition } from "../data/recipes";

export type MaterialAmounts = Partial<Record<MaterialId, number>>;

export interface InventoryEntry {
  material: MaterialDefinition;
  amount: number;
}

export interface SpendResult {
  ok: boolean;
  missing: MaterialAmounts;
}

export class MaterialInventory {
  private amounts: MaterialAmounts;

  constructor(initial?: MaterialAmounts) {
    this.amounts = { ...(initial ?? {}) };
  }

  get(id: MaterialId): number {
    return this.amounts[id] ?? 0;
  }

  set(id: MaterialId, amount: number): void {
    this.amounts[id] = Math.max(0, Math.floor(amount));
  }

  add(id: MaterialId, amount: number): void {
    if (amount <= 0) return;
    this.set(id, this.get(id) + amount);
  }

  addMany(items: MaterialAmounts): void {
    for (const [id, amount] of Object.entries(items) as [MaterialId, number][]) {
      this.add(id, amount);
    }
  }

  canAfford(costs: RecipeDefinition["costs"]): SpendResult {
    const missing: MaterialAmounts = {};
    for (const cost of costs) {
      const owned = this.get(cost.materialId);
      if (owned < cost.amount) missing[cost.materialId] = cost.amount - owned;
    }
    return { ok: Object.keys(missing).length === 0, missing };
  }

  spend(costs: RecipeDefinition["costs"]): SpendResult {
    const check = this.canAfford(costs);
    if (!check.ok) return check;

    for (const cost of costs) {
      this.set(cost.materialId, this.get(cost.materialId) - cost.amount);
    }
    return { ok: true, missing: {} };
  }

  entries(): InventoryEntry[] {
    return (Object.entries(this.amounts) as [MaterialId, number][])
      .filter(([, amount]) => amount > 0)
      .map(([id, amount]) => ({ material: getMaterial(id), amount }))
      .filter((entry): entry is InventoryEntry => Boolean(entry.material));
  }

  toJSON(): MaterialAmounts {
    return { ...this.amounts };
  }

  static fromJSON(value: unknown): MaterialInventory {
    if (!value || typeof value !== "object") return new MaterialInventory();
    const result: MaterialAmounts = {};
    for (const [id, amount] of Object.entries(value as Record<string, unknown>)) {
      if (!getMaterial(id)) continue;
      if (typeof amount !== "number" || !Number.isFinite(amount)) continue;
      result[id as MaterialId] = Math.max(0, Math.floor(amount));
    }
    return new MaterialInventory(result);
  }
}
