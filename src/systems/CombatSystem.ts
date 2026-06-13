import { Projectile } from "../entities/Projectile";
import { Enemy } from "../entities/Enemy";
import { Player } from "../entities/Player";
import { distance } from "../utils/math";

export class CombatSystem {
  // 弹射物命中敌人
  projectileHitsEnemy(p: Projectile, e: Enemy): boolean {
    if (!p.alive || !e.alive) return false;
    return distance(p.pos, e.pos) < e.radius + 5;
  }

  // 对敌人造成伤害，返回是否击杀
  dealDamage(enemy: Enemy, dmg: number): boolean {
    return enemy.takeDamage(dmg);
  }

  // 敌人接触玩家
  enemyTouchesPlayer(enemy: Enemy, player: Player): boolean {
    if (!enemy.alive) return false;
    return distance(enemy.pos, player.pos) < enemy.radius + player.radius;
  }

  // 对玩家造成伤害（含无敌帧）
  dealDamageToPlayer(player: Player, dmg: number, now: number): void {
    if (now < player.invulnerableUntil) return;
    player.hp -= dmg;
    // 0.5 秒无敌帧
    player.invulnerableUntil = now + 0.5;
    // 最小保留 0 便于死亡判定
    if (player.hp < 0) player.hp = 0;
  }
}
