import { EnemyRole } from "../entities/Enemy";

// 波次管理器：控制每波敌人数和强度曲线
export class WaveSystem {
  // 第 n 波敌人数：基础 3 + (n-1) * 2，Boss 波减少杂兵
  getEnemyCount(wave: number): number {
    if (this.isBossWave(wave)) return 4 + Math.floor(wave / 5) * 2;
    return 3 + (wave - 1) * 2;
  }

  // 血量倍率：缓慢上涨
  getHPMultiplier(wave: number): number {
    return Math.pow(1.12, wave);
  }

  // 速度倍率：缓增
  getSpeedMultiplier(wave: number): number {
    return 1.0 + (wave - 1) * 0.04;
  }

  isBossWave(wave: number): boolean {
    return wave > 0 && wave % 5 === 0;
  }

  getRolesForWave(wave: number): EnemyRole[] {
    const roles: EnemyRole[] = [];

    if (this.isBossWave(wave)) {
      roles.push("boss");
      const adds = this.getEnemyCount(wave);
      for (let i = 0; i < adds; i++) {
        roles.push(i % 3 === 0 ? "ranged" : i % 3 === 1 ? "fast" : "basic");
      }
      return roles;
    }

    const count = this.getEnemyCount(wave);
    for (let i = 0; i < count; i++) {
      const roll = Math.random();
      let role: EnemyRole = "basic";

      if (wave >= 2 && roll < 0.18) role = "fast";
      if (wave >= 3 && roll >= 0.18 && roll < 0.32) role = "tank";
      if (wave >= 4 && roll >= 0.32 && roll < 0.46) role = "ranged";
      roles.push(role);
    }

    if (wave >= 3 && wave % 3 === 0) roles.push("elite");
    return roles;
  }
}
