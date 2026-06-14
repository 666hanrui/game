import { getQuest, QUESTS, type QuestDefinition, type QuestReward, type QuestTargetType } from "../data/quests";
import { EconomyInventory } from "./EconomyInventory";
import { MaterialInventory } from "./MaterialInventory";
import { MetaProgress } from "./MetaProgress";
import { MetaTalentProgress } from "./MetaTalentProgress";

export interface QuestTargetProgress {
  type: QuestTargetType;
  id?: string;
  value: number;
}

export interface QuestStateEntry {
  questId: string;
  claimed: boolean;
  progress: QuestTargetProgress[];
}

export interface QuestClaimResult {
  ok: boolean;
  quest?: QuestDefinition;
  reason?: string;
  reward?: QuestReward;
}

const QUEST_STATE_KEY = "game.questState";

export class QuestProgress {
  getAll(): QuestStateEntry[] {
    try {
      const raw = window.localStorage.getItem(QUEST_STATE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((entry) => this.cleanEntry(entry))
        .filter((entry): entry is QuestStateEntry => Boolean(entry));
    } catch {
      return [];
    }
  }

  setAll(entries: QuestStateEntry[]): void {
    const cleaned = entries
      .map((entry) => this.cleanEntry(entry))
      .filter((entry): entry is QuestStateEntry => Boolean(entry));
    try {
      window.localStorage.setItem(QUEST_STATE_KEY, JSON.stringify(cleaned));
    } catch {
      // localStorage 不可用时忽略。
    }
  }

  getEntry(questId: string): QuestStateEntry {
    const existing = this.getAll().find((entry) => entry.questId === questId);
    if (existing) return existing;

    const quest = getQuest(questId);
    return {
      questId,
      claimed: false,
      progress: quest?.targets.map((target) => ({ type: target.type, id: target.id, value: 0 })) ?? [],
    };
  }

  getVisibleQuests(): QuestDefinition[] {
    return QUESTS;
  }

  isCompleted(questId: string): boolean {
    const quest = getQuest(questId);
    if (!quest) return false;
    const entry = this.getEntry(questId);
    return quest.targets.every((target) => {
      const progress = entry.progress.find((item) => item.type === target.type && item.id === target.id);
      return (progress?.value ?? 0) >= target.required;
    });
  }

  isClaimed(questId: string): boolean {
    return this.getEntry(questId).claimed;
  }

  addProgress(type: QuestTargetType, value: number, id?: string): void {
    if (value <= 0) return;
    const entries = this.getAll();

    for (const quest of QUESTS) {
      let entry = entries.find((item) => item.questId === quest.id);
      if (!entry) {
        entry = this.getEntry(quest.id);
        entries.push(entry);
      }

      for (const target of quest.targets) {
        if (target.type !== type) continue;
        if (target.id && target.id !== id) continue;
        let progress = entry.progress.find((item) => item.type === target.type && item.id === target.id);
        if (!progress) {
          progress = { type: target.type, id: target.id, value: 0 };
          entry.progress.push(progress);
        }
        progress.value = Math.max(0, progress.value + value);
      }
    }

    this.setAll(entries);
  }

  setProgress(questId: string, type: QuestTargetType, value: number, id?: string): void {
    const entries = this.getAll();
    let entry = entries.find((item) => item.questId === questId);
    if (!entry) {
      entry = this.getEntry(questId);
      entries.push(entry);
    }

    let progress = entry.progress.find((item) => item.type === type && item.id === id);
    if (!progress) {
      progress = { type, id, value: 0 };
      entry.progress.push(progress);
    }
    progress.value = Math.max(0, Math.floor(value));
    this.setAll(entries);
  }

  claimReward(questId: string): QuestClaimResult {
    const quest = getQuest(questId);
    if (!quest) return { ok: false, reason: "未知任务" };
    if (!this.isCompleted(questId)) return { ok: false, quest, reason: "任务未完成" };

    const entries = this.getAll();
    let entry = entries.find((item) => item.questId === questId);
    if (!entry) {
      entry = this.getEntry(questId);
      entries.push(entry);
    }

    if (entry.claimed && quest.repeat === "once") return { ok: false, quest, reason: "奖励已领取" };

    this.applyReward(quest.rewards);
    entry.claimed = true;
    if (quest.repeat !== "once") {
      entry.progress = quest.targets.map((target) => ({ type: target.type, id: target.id, value: 0 }));
    }
    this.setAll(entries);
    return { ok: true, quest, reward: quest.rewards };
  }

  reset(): void {
    try {
      window.localStorage.removeItem(QUEST_STATE_KEY);
    } catch {
      // localStorage 不可用时忽略。
    }
  }

  storageKey(): string {
    return QUEST_STATE_KEY;
  }

  private applyReward(reward: QuestReward): void {
    if (reward.economy) {
      const economy = EconomyInventory.load();
      economy.addMany(reward.economy);
      economy.save();
    }

    if (reward.materials) {
      const meta = new MetaProgress();
      const materials = meta.getMaterials();
      materials.addMany(reward.materials);
      meta.setMaterials(materials);
    }

    if (reward.talentSlots) {
      new MetaTalentProgress().addTalentSlot(reward.talentSlots);
      new MetaProgress().addTalentSlot(reward.talentSlots);
    }

    if (reward.unlockTalentIds) {
      const talents = new MetaTalentProgress();
      for (const id of reward.unlockTalentIds) talents.unlockTalent(id);
    }

    if (reward.unlockRecipeIds) {
      const meta = new MetaProgress();
      for (const id of reward.unlockRecipeIds) meta.unlockRecipe(id);
    }
  }

  private cleanEntry(value: unknown): QuestStateEntry | null {
    if (!value || typeof value !== "object") return null;
    const raw = value as Partial<QuestStateEntry>;
    if (typeof raw.questId !== "string" || !getQuest(raw.questId)) return null;
    return {
      questId: raw.questId,
      claimed: Boolean(raw.claimed),
      progress: Array.isArray(raw.progress)
        ? raw.progress
            .filter((item): item is QuestTargetProgress => Boolean(item) && typeof item === "object" && typeof (item as QuestTargetProgress).type === "string")
            .map((item) => ({ type: item.type, id: item.id, value: Math.max(0, Math.floor(Number(item.value) || 0)) }))
        : [],
    };
  }
}
