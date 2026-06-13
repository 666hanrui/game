import { Game } from "./Game";
import { SoundSystem } from "../systems/SoundSystem";
import { Projectile, ProjectileKind } from "../entities/Projectile";
import type { Enemy } from "../entities/Enemy";

interface GameSoundSnapshot {
  hp: number;
  maxHp: number;
  level: number;
  xp: number;
  kills: number;
  bossKills: number;
  playerShots: number;
  bossCount: number;
  phase: string;
}

interface BossPatternTimers {
  fan: number;
  triple: number;
  ring: number;
}

interface QueuedEnemyShot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  kind: ProjectileKind;
  delay: number;
}

export class GameWithSound extends Game {
  private sound = new SoundSystem();
  private muted = false;
  private bossTimers = new WeakMap<object, BossPatternTimers>();
  private queuedEnemyShots: QueuedEnemyShot[] = [];

  constructor(canvas: HTMLCanvasElement) {
    super(canvas);

    const unlock = () => this.sound.unlock();
    canvas.addEventListener("pointerdown", unlock);
    canvas.addEventListener("touchstart", unlock, { passive: true });
    window.addEventListener("keydown", (e) => {
      this.sound.unlock();
      if (e.key.toLowerCase() === "m") {
        this.muted = !this.muted;
        this.sound.setEnabled(!this.muted);
      }
    });
  }

  update(dt: number): void {
    const before = this.snapshot();
    super.update(dt);
    this.updateBossPatterns(dt);
    const after = this.snapshot();
    this.updateSounds(before, after);
  }

  private snapshot(): GameSoundSnapshot {
    return {
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      level: this.xp.level,
      xp: this.xp.xp,
      kills: this.kills,
      bossKills: this.bossKills,
      playerShots: this.projectiles.filter((p) => !p.fromEnemy).length,
      bossCount: this.enemies.filter((e) => e.role === "boss").length,
      phase: this.phase,
    };
  }

  private updateSounds(before: GameSoundSnapshot, after: GameSoundSnapshot): void {
    if (this.muted) return;

    const enteredGameplay = before.phase !== after.phase && after.phase === "playing";
    const inOrEnteringGameplay = after.phase === "playing" || enteredGameplay;

    if (after.bossCount > before.bossCount) {
      this.sound.bossSpawn();
    }

    if (after.bossKills > before.bossKills) {
      this.sound.bossDefeated();
      return;
    }

    if (after.level > before.level) {
      this.sound.levelUp();
    }

    if (after.hp < before.hp) {
      this.sound.playerHurt();
    }

    if (after.hp > before.hp && after.hp <= after.maxHp && after.level === before.level) {
      this.sound.pickupHP();
    }

    if (after.kills > before.kills) {
      this.sound.kill();
    }

    if (after.xp > before.xp && after.kills === before.kills && after.level === before.level) {
      this.sound.pickupXP();
    }

    if (inOrEnteringGameplay && after.playerShots > before.playerShots) {
      this.sound.attack();
    }
  }

  private updateBossPatterns(dt: number): void {
    this.updateQueuedEnemyShots(dt);
    if (this.phase !== "playing") return;

    const bosses = this.enemies.filter((e) => e.alive && e.role === "boss");
    for (const boss of bosses) {
      const timers = this.getBossTimers(boss);
      const hpPressure = Math.max(0, 1 - boss.hp / Math.max(1, boss.maxHp));

      timers.fan -= dt;
      timers.triple -= dt;
      timers.ring -= dt;

      if (timers.fan <= 0) {
        this.fireBossFan(boss, 7 + Math.floor(hpPressure * 4));
        timers.fan = 2.35 - hpPressure * 0.42;
      }

      if (timers.triple <= 0) {
        this.queueBossTriple(boss);
        timers.triple = 1.72 - hpPressure * 0.28;
      }

      if (timers.ring <= 0) {
        this.fireBossRing(boss, 14 + Math.floor(hpPressure * 8));
        timers.ring = 5.2 - hpPressure * 0.9;
      }
    }
  }

  private getBossTimers(boss: Enemy): BossPatternTimers {
    let timers = this.bossTimers.get(boss as object);
    if (!timers) {
      timers = {
        fan: 0.75,
        triple: 1.25,
        ring: 2.8,
      };
      this.bossTimers.set(boss as object, timers);
    }
    return timers;
  }

  private updateQueuedEnemyShots(dt: number): void {
    if (this.queuedEnemyShots.length <= 0) return;

    for (const shot of this.queuedEnemyShots) shot.delay -= dt;

    const ready = this.queuedEnemyShots.filter((shot) => shot.delay <= 0);
    this.queuedEnemyShots = this.queuedEnemyShots.filter((shot) => shot.delay > 0);

    for (const shot of ready) {
      this.projectiles.push(new Projectile(shot.x, shot.y, shot.vx, shot.vy, true, shot.damage, shot.kind));
    }
  }

  private fireBossFan(boss: Enemy, count: number): void {
    const base = this.angleToPlayer(boss);
    const spread = 1.08;
    const speed = 330;
    const damage = 12;

    for (let i = 0; i < count; i++) {
      const t = count <= 1 ? 0 : i / (count - 1);
      const angle = base - spread / 2 + spread * t;
      this.spawnEnemyShot(boss.pos.x, boss.pos.y, angle, speed, damage, "energy");
    }
  }

  private queueBossTriple(boss: Enemy): void {
    const base = this.angleToPlayer(boss);
    const speed = 380;
    const damage = 15;
    const offsets = [-0.08, 0.02, 0.1];

    for (let i = 0; i < 3; i++) {
      const angle = base + offsets[i];
      this.queuedEnemyShots.push({
        x: boss.pos.x,
        y: boss.pos.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        damage,
        kind: "heavy_magic",
        delay: i * 0.13,
      });
    }
  }

  private fireBossRing(boss: Enemy, count: number): void {
    const speed = 245;
    const damage = 10;
    const offset = (performance.now() / 1000) % Math.PI;

    for (let i = 0; i < count; i++) {
      const angle = offset + (i / count) * Math.PI * 2;
      this.spawnEnemyShot(boss.pos.x, boss.pos.y, angle, speed, damage, "energy");
    }
  }

  private spawnEnemyShot(x: number, y: number, angle: number, speed: number, damage: number, kind: ProjectileKind): void {
    this.projectiles.push(new Projectile(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, true, damage, kind));
  }

  private angleToPlayer(enemy: Enemy): number {
    const dx = this.player.pos.x - enemy.pos.x;
    const dy = this.player.pos.y - enemy.pos.y;
    return Math.atan2(dy, dx);
  }
}
