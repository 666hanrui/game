import type { EnemyRole } from "../entities/Enemy";
import { getCurrentDifficulty } from "./DifficultySystem";

// 波次管理器：控制每波敌人数、强度曲线和敌人组合
export class WaveSystem {
  getEnemyCount(wave: number): number {
    const difficulty = getCurrentDifficulty();
    const base = this.isBossWave(wave)
      ? 5 + Math.floor(wave / 5) * 3
      : 4 + (wave - 1) * 3 + Math.floor(wave / 4);
    return Math.max(1, Math.floor(base * difficulty.enemyCountMult));
  }

  // 血量倍率：由波次成长和难度共同决定
  getHPMultiplier(wave: number): number {
    const difficulty = getCurrentDifficulty();
    const base = Math.pow(1.15, wave) * (1 + Math.floor(wave / 6) * 0.08);
    return base * difficulty.hpMult;
  }

  // 速度倍率：让后期怪物推进更明显，但不过度失控
  getSpeedMultiplier(wave: number): number {
    const difficulty = getCurrentDifficulty();
    return (1.05 + (wave - 1) * 0.055) * difficulty.speedMult;
  }

  isBossWave(wave: number): boolean {
    return wave > 0 && wave % 5 === 0;
  }

  getRolesForWave(wave: number): EnemyRole[] {
    const difficulty = getCurrentDifficulty();
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
      if (wave >= 10 || difficulty.eliteBonus >= 0.12) roles.push("elite");
      if (difficulty.id === "hell") roles.push("elite", "ranged");
      return roles;
    }

    const count = this.getEnemyCount(wave);
    for (let i = 0; i < count; i++) {
      const roll = Math.random();
      let role: EnemyRole = "basic";
      const fastChance = 0.24 + difficulty.eliteBonus * 0.35;
      const tankChance = 0.42 + difficulty.eliteBonus * 0.45;
      const rangedChance = 0.62 + difficulty.rangedBonus;

      if (wave >= 2 && roll < fastChance) role = "fast";
      else if (wave >= 3 && roll < tankChance) role = "tank";
      else if (wave >= 4 && roll < rangedChance) role = "ranged";
      roles.push(role);
    }

    const eliteRoll = Math.random();
    const eliteChance = Math.max(0, 0.18 + difficulty.eliteBonus + wave * 0.01);
    if (wave >= 3 && (wave % 3 === 0 || eliteRoll < eliteChance)) roles.push("elite");
    if (wave >= 7 && (wave % 4 === 0 || eliteRoll < eliteChance * 0.8)) roles.push("elite");
    if (wave >= 9) roles.push(Math.random() < 0.5 + difficulty.rangedBonus ? "ranged" : "fast");
    if (difficulty.id === "nightmare" && wave >= 6) roles.push(Math.random() < 0.55 ? "ranged" : "fast");
    if (difficulty.id === "hell" && wave >= 5) roles.push("elite", Math.random() < 0.65 ? "ranged" : "tank");

    return roles;
  }
}
