import { Projectile } from "../entities/Projectile";
import { Enemy } from "../entities/Enemy";
import { Player } from "../entities/Player";
import { distance } from "../utils/math";

export class CombatSystem {
  projectileHitsEnemy(p: Projectile, e: Enemy): boolean {
    if (!p.alive || !e.alive) return false;
    return p.hitsCircle(e.pos, e.radius);
  }

  dealDamage(enemy: Enemy, dmg: number): boolean {
    return enemy.takeDamage(dmg);
  }

  enemyTouchesPlayer(enemy: Enemy, player: Player): boolean {
    if (!enemy.alive) return false;
    return distance(enemy.pos, player.pos) < enemy.radius + player.radius;
  }

  dealDamageToPlayer(player: Player, dmg: number, now: number): void {
    if (now < player.invulnerableUntil) return;
    player.hp -= dmg;
    player.invulnerableUntil = now + 0.5;
    if (player.hp < 0) player.hp = 0;
  }
}
