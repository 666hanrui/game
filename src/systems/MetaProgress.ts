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

const SOUL_KEY = "game.soulCrystals";
const UPGRADE_KEY = "game.metaUpgrades";

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
    return Math.max(1, waveReward + killReward + levelReward + bossReward + goalReward);
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
}
