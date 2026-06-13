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

const SOUL_KEY = "game.soulCrystals";

export class MetaProgress {
  getSoulCrystals(): number {
    try {
      const raw = window.localStorage.getItem(SOUL_KEY);
      return raw ? Math.max(0, Number(raw) || 0) : 0;
    } catch {
      return 0;
    }
  }

  settleRun(input: RunRewardInput): RunRewardResult {
    const gained = this.calculateReward(input);
    const total = this.getSoulCrystals() + gained;
    try {
      window.localStorage.setItem(SOUL_KEY, String(total));
    } catch {
      // localStorage 不可用时，仍然返回本局结算结果，避免游戏崩溃。
    }
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
}
