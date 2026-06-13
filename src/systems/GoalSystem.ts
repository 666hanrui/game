export interface GoalProgress {
  id: string;
  title: string;
  current: number;
  target: number;
  done: boolean;
}

export interface GoalStats {
  wave: number;
  kills: number;
  bossKills: number;
}

export class GoalSystem {
  getGoals(stats: GoalStats): GoalProgress[] {
    return [
      {
        id: "wave_5",
        title: "生存到第 5 波",
        current: Math.min(stats.wave, 5),
        target: 5,
        done: stats.wave >= 5,
      },
      {
        id: "kill_50",
        title: "击杀 50 个敌人",
        current: Math.min(stats.kills, 50),
        target: 50,
        done: stats.kills >= 50,
      },
      {
        id: "boss_1",
        title: "击败 1 个 Boss",
        current: Math.min(stats.bossKills, 1),
        target: 1,
        done: stats.bossKills >= 1,
      },
    ];
  }

  allDone(stats: GoalStats): boolean {
    return this.getGoals(stats).every((g) => g.done);
  }
}
