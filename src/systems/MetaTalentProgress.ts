import { getMetaTalent, META_TALENTS, type MetaTalentDef } from "../data/metaTalents";
import { EconomyInventory, type EconomySpendResult } from "./EconomyInventory";

export interface MetaTalentState {
  unlockedTalentIds: string[];
  equippedTalentIds: string[];
  talentSlots: number;
}

export interface TalentEquipResult {
  ok: boolean;
  state: MetaTalentState;
  reason?: string;
  talent?: MetaTalentDef;
}

export interface TalentPurchaseResult extends TalentEquipResult {
  spend?: EconomySpendResult;
}

const TALENT_STATE_KEY = "game.metaTalentState";

const DEFAULT_TALENT_STATE: MetaTalentState = {
  unlockedTalentIds: [],
  equippedTalentIds: [],
  talentSlots: 1,
};

export class MetaTalentProgress {
  getState(): MetaTalentState {
    try {
      const raw = window.localStorage.getItem(TALENT_STATE_KEY);
      if (!raw) return { ...DEFAULT_TALENT_STATE };
      const parsed = JSON.parse(raw) as Partial<MetaTalentState>;
      const unlockedTalentIds = this.cleanTalentIds(parsed.unlockedTalentIds);
      const equippedTalentIds = this.cleanTalentIds(parsed.equippedTalentIds)
        .filter((id) => unlockedTalentIds.includes(id));
      const talentSlots = Math.max(1, Math.floor(Number(parsed.talentSlots) || DEFAULT_TALENT_STATE.talentSlots));
      return {
        unlockedTalentIds,
        equippedTalentIds: equippedTalentIds.slice(0, talentSlots),
        talentSlots,
      };
    } catch {
      return { ...DEFAULT_TALENT_STATE };
    }
  }

  setState(state: MetaTalentState): void {
    const cleaned: MetaTalentState = {
      unlockedTalentIds: this.cleanTalentIds(state.unlockedTalentIds),
      equippedTalentIds: this.cleanTalentIds(state.equippedTalentIds)
        .filter((id) => state.unlockedTalentIds.includes(id))
        .slice(0, Math.max(1, Math.floor(state.talentSlots))),
      talentSlots: Math.max(1, Math.floor(state.talentSlots)),
    };

    try {
      window.localStorage.setItem(TALENT_STATE_KEY, JSON.stringify(cleaned));
    } catch {
      // localStorage 不可用时忽略。
    }
  }

  getUnlockedTalents(): MetaTalentDef[] {
    const state = this.getState();
    return state.unlockedTalentIds
      .map((id) => getMetaTalent(id))
      .filter((talent): talent is MetaTalentDef => Boolean(talent));
  }

  getEquippedTalents(): MetaTalentDef[] {
    const state = this.getState();
    return state.equippedTalentIds
      .map((id) => getMetaTalent(id))
      .filter((talent): talent is MetaTalentDef => Boolean(talent));
  }

  isUnlocked(id: string): boolean {
    return this.getState().unlockedTalentIds.includes(id);
  }

  isEquipped(id: string): boolean {
    return this.getState().equippedTalentIds.includes(id);
  }

  unlockTalent(id: string): TalentEquipResult {
    const talent = getMetaTalent(id);
    const state = this.getState();
    if (!talent) return { ok: false, state, reason: "未知天赋" };
    if (!state.unlockedTalentIds.includes(id)) {
      state.unlockedTalentIds.push(id);
      this.setState(state);
    }
    return { ok: true, state: this.getState(), talent };
  }

  purchaseUnlockTalent(id: string, inventory = EconomyInventory.load()): TalentPurchaseResult {
    const talent = getMetaTalent(id);
    const state = this.getState();
    if (!talent) return { ok: false, state, reason: "未知天赋" };
    if (state.unlockedTalentIds.includes(id)) return { ok: true, state, talent };

    const spend = inventory.spend(talent.unlockCosts);
    if (!spend.ok) return { ok: false, state, reason: "资源不足", talent, spend };

    inventory.save();
    return this.unlockTalent(id);
  }

  equipTalent(id: string): TalentEquipResult {
    const talent = getMetaTalent(id);
    const state = this.getState();
    if (!talent) return { ok: false, state, reason: "未知天赋" };
    if (!state.unlockedTalentIds.includes(id)) return { ok: false, state, reason: "尚未解锁", talent };
    if (state.equippedTalentIds.includes(id)) return { ok: true, state, talent };
    if (state.equippedTalentIds.length >= state.talentSlots) return { ok: false, state, reason: "天赋槽不足", talent };

    state.equippedTalentIds.push(id);
    this.setState(state);
    return { ok: true, state: this.getState(), talent };
  }

  unequipTalent(id: string): TalentEquipResult {
    const talent = getMetaTalent(id);
    const state = this.getState();
    state.equippedTalentIds = state.equippedTalentIds.filter((talentId) => talentId !== id);
    this.setState(state);
    return { ok: true, state: this.getState(), talent };
  }

  setTalentSlots(slots: number): MetaTalentState {
    const state = this.getState();
    state.talentSlots = Math.max(1, Math.floor(slots));
    state.equippedTalentIds = state.equippedTalentIds.slice(0, state.talentSlots);
    this.setState(state);
    return this.getState();
  }

  addTalentSlot(amount = 1): MetaTalentState {
    const state = this.getState();
    return this.setTalentSlots(state.talentSlots + Math.max(0, Math.floor(amount)));
  }

  getAvailableTalents(): MetaTalentDef[] {
    const state = this.getState();
    return META_TALENTS.filter((talent) => !state.unlockedTalentIds.includes(talent.id));
  }

  reset(): void {
    try {
      window.localStorage.removeItem(TALENT_STATE_KEY);
    } catch {
      // localStorage 不可用时忽略。
    }
  }

  private cleanTalentIds(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    const validIds = new Set(META_TALENTS.map((talent) => talent.id));
    return [...new Set(value.filter((id): id is string => typeof id === "string" && validIds.has(id)))];
  }
}
