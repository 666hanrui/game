import { ECONOMY_ITEMS, getEconomyItem, type EconomyItemDef } from "../data/economy";
import type { MetaTalentCost } from "../data/metaTalents";

export type EconomyItemId = EconomyItemDef["id"];
export type EconomyAmounts = Partial<Record<EconomyItemId, number>>;

export interface EconomyEntry {
  item: EconomyItemDef;
  amount: number;
}

export interface EconomySpendResult {
  ok: boolean;
  missing: EconomyAmounts;
}

const ECONOMY_KEY = "game.economyItems";

export class EconomyInventory {
  private amounts: EconomyAmounts;

  constructor(initial?: EconomyAmounts) {
    this.amounts = { ...(initial ?? {}) };
  }

  get(id: EconomyItemId): number {
    return this.amounts[id] ?? 0;
  }

  set(id: EconomyItemId, amount: number): void {
    if (!getEconomyItem(id)) return;
    this.amounts[id] = Math.max(0, Math.floor(amount));
  }

  add(id: EconomyItemId, amount: number): void {
    if (amount <= 0) return;
    this.set(id, this.get(id) + amount);
  }

  addMany(items: EconomyAmounts): void {
    for (const [id, amount] of Object.entries(items) as [EconomyItemId, number][]) {
      this.add(id, amount);
    }
  }

  canAfford(costs: MetaTalentCost[]): EconomySpendResult {
    const missing: EconomyAmounts = {};
    for (const cost of costs) {
      const owned = this.get(cost.itemId);
      if (owned < cost.amount) missing[cost.itemId] = cost.amount - owned;
    }
    return { ok: Object.keys(missing).length === 0, missing };
  }

  spend(costs: MetaTalentCost[]): EconomySpendResult {
    const check = this.canAfford(costs);
    if (!check.ok) return check;

    for (const cost of costs) {
      this.set(cost.itemId, this.get(cost.itemId) - cost.amount);
    }
    return { ok: true, missing: {} };
  }

  entries(): EconomyEntry[] {
    return (Object.entries(this.amounts) as [EconomyItemId, number][])
      .filter(([, amount]) => amount > 0)
      .map(([id, amount]) => ({ item: getEconomyItem(id), amount }))
      .filter((entry): entry is EconomyEntry => Boolean(entry.item));
  }

  toJSON(): EconomyAmounts {
    return { ...this.amounts };
  }

  save(): void {
    try {
      window.localStorage.setItem(ECONOMY_KEY, JSON.stringify(this.toJSON()));
    } catch {
      // localStorage 不可用时忽略。
    }
  }

  static load(): EconomyInventory {
    try {
      const raw = window.localStorage.getItem(ECONOMY_KEY);
      return EconomyInventory.fromJSON(raw ? JSON.parse(raw) : undefined);
    } catch {
      return new EconomyInventory();
    }
  }

  static save(inventory: EconomyInventory): void {
    inventory.save();
  }

  static fromJSON(value: unknown): EconomyInventory {
    if (!value || typeof value !== "object") return new EconomyInventory();
    const result: EconomyAmounts = {};
    for (const [id, amount] of Object.entries(value as Record<string, unknown>)) {
      if (!getEconomyItem(id)) continue;
      if (typeof amount !== "number" || !Number.isFinite(amount)) continue;
      result[id as EconomyItemId] = Math.max(0, Math.floor(amount));
    }
    return new EconomyInventory(result);
  }

  static allItems(): EconomyItemDef[] {
    return ECONOMY_ITEMS;
  }

  static storageKey(): string {
    return ECONOMY_KEY;
  }
}
