// 波次管理器：控制每波敌人数和强度曲线
export class WaveSystem {
  // 第 n 波敌人数：基础 3 + (n-1) * 2
  getEnemyCount(wave: number): number {
    return 3 + (wave - 1) * 2;
  }

  // 血量倍率：1.0 → 1.15^wave
  getHPMultiplier(wave: number): number {
    return Math.pow(1.12, wave);
  }

  // 速度倍率：1.0 → 缓增
  getSpeedMultiplier(wave: number): number {
    return 1.0 + (wave - 1) * 0.04;
  }
}
