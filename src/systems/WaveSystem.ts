import type { EnemyRole } from "../entities/Enemy";

// 波次管理器：控制每波敌人数、强度曲线和敌人组合
export class WaveSystem {
  getEnemyCount(wave: number): number {
    if (this.isBossWave(wave)) return 5 + Math.floor(wave / 5) * 3;
    return 4 + (wave - 1) * 3 + Math.floor(wave / 4);
  }

  // 血量倍率：比原型更快上涨，避免后期压力不足
  getHPMultiplier(wave: number): number {
    return Math.pow(1.15, wave) * (1 + Math.floor(wave / 6) * 0.08);
  }

  // 速度倍率：让后期怪物推进更明显，但不过度失控
  getSpeedMultiplier(wave: number): number {
    return 1.05 + (wave - 1) * 0.055;
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
        if (i % 5 === 0) roles.push("ranged");
        else if (i % 5 === 1) roles.push("fast");
        else if (i % 5 === 2) roles.push("tank");
        else roles.push("basic");
      }
      if (wave >= 10) roles.push("elite");
      return roles;
    }

    const count = this.getEnemyCount(wave);
    for (let i = 0; i < count; i++) {
      const roll = Math.random();
      let role: EnemyRole = "basic";

      if (wave >= 2 && roll < 0.24) role = "fast";
      else if (wave >= 3 && roll < 0.42) role = "tank";
      else if (wave >= 4 && roll < 0.62) role = "ranged";
      roles.push(role);
    }

    if (wave >= 3 && wave % 3 === 0) roles.push("elite");
    if (wave >= 7 && wave % 4 === 0) roles.push("elite");
    if (wave >= 9) roles.push(Math.random() < 0.5 ? "ranged" : "fast");

    return roles;
  }
}
