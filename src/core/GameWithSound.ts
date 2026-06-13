import { Game } from "./Game";
import { SoundSystem } from "../systems/SoundSystem";
import { Projectile, ProjectileKind } from "../entities/Projectile";
import type { Enemy } from "../entities/Enemy";
import { DIFFICULTIES, DifficultyId, getCurrentDifficulty, getCurrentDifficultyId, setCurrentDifficulty } from "../systems/DifficultySystem";
import { LuckyUpgradePanel } from "../ui/LuckyUpgradePanel";

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
  private difficultyRects: { x: number; y: number; w: number; h: number; id: DifficultyId }[] = [];

  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
    this.upgradePanel = new LuckyUpgradePanel() as unknown as typeof this.upgradePanel;

    const unlock = () => this.sound.unlock();
    canvas.addEventListener("pointerdown", unlock);
    canvas.addEventListener("touchstart", unlock, { passive: true });
    canvas.addEventListener("click", (e) => this.handleDifficultyClick(e));
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

  render(): void {
    super.render();
    if (this.phase === "menu") this.renderDifficultySelector();
  }

  private handleDifficultyClick(e: MouseEvent): void {
    if (this.phase !== "menu") return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (const r of this.difficultyRects) {
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        const def = setCurrentDifficulty(r.id);
        this.sound.unlock();
        this.sound.pickupXP();
        this.addDifficultyToast(`难度：${def.name}`);
        return;
      }
    }
  }

  private addDifficultyToast(text: string): void {
    console.log(text);
  }

  private renderDifficultySelector(): void {
    const ctx = this.ctx;
    const selected = getCurrentDifficultyId();
    const cardW = 104;
    const cardH = 46;
    const gap = 8;
    const totalW = DIFFICULTIES.length * cardW + (DIFFICULTIES.length - 1) * gap;
    const startX = this.w / 2 - totalW / 2;
    const y = Math.max(66, this.h * 0.12);
    this.difficultyRects = [];

    ctx.save();
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.48)";
    ctx.font = "bold 12px monospace";
    ctx.fillText("选择难度", this.w / 2, y - 12);

    for (let i = 0; i < DIFFICULTIES.length; i++) {
      const d = DIFFICULTIES[i];
      const x = startX + i * (cardW + gap);
      this.difficultyRects.push({ x, y, w: cardW, h: cardH, id: d.id });

      const active = selected === d.id;
      ctx.fillStyle = active ? `${d.color}26` : "rgba(255,255,255,0.055)";
      ctx.strokeStyle = active ? d.color : "rgba(255,255,255,0.18)";
      ctx.lineWidth = active ? 2.2 : 1;
      this.roundRect(ctx, x, y, cardW, cardH, 9);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = d.color;
      ctx.font = "bold 14px monospace";
      ctx.fillText(d.name, x + cardW / 2, y + 19);
      ctx.fillStyle = "rgba(255,255,255,0.48)";
      ctx.font = "9px monospace";
      ctx.fillText(d.subtitle, x + cardW / 2, y + 35);
    }

    const current = getCurrentDifficulty();
    ctx.fillStyle = "rgba(255,255,255,0.36)";
    ctx.font = "10px monospace";
    ctx.fillText(current.description, this.w / 2, y + cardH + 18);
    ctx.restore();
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

    if (after.bossCount > before.bossCount) this.sound.bossSpawn();
    if (after.bossKills > before.bossKills) { this.sound.bossDefeated(); return; }
    if (after.level > before.level) this.sound.levelUp();
    if (after.hp < before.hp) this.sound.playerHurt();
    if (after.hp > before.hp && after.hp <= after.maxHp && after.level === before.level) this.sound.pickupHP();
    if (after.kills > before.kills) this.sound.kill();
    if (after.xp > before.xp && after.kills === before.kills && after.level === before.level) this.sound.pickupXP();
    if (inOrEnteringGameplay && after.playerShots > before.playerShots) this.sound.attack();
  }

  private updateBossPatterns(dt: number): void {
    this.updateQueuedEnemyShots(dt);
    if (this.phase !== "playing") return;

    const bosses = this.enemies.filter((e) => e.alive && e.role === "boss");
    for (const boss of bosses) {
      const timers = this.getBossTimers(boss);
      const hpPressure = Math.max(0, 1 - boss.hp / Math.max(1, boss.maxHp));
      const difficulty = getCurrentDifficulty();
      const pattern = difficulty.bossPatternMult;

      timers.fan -= dt;
      timers.triple -= dt;
      timers.ring -= dt;

      if (timers.fan <= 0) {
        this.fireBossFan(boss, Math.floor((7 + Math.floor(hpPressure * 4)) * pattern));
        timers.fan = Math.max(0.62, (2.35 - hpPressure * 0.42) / pattern);
      }
      if (timers.triple <= 0) {
        this.queueBossTriple(boss, pattern);
        timers.triple = Math.max(0.48, (1.72 - hpPressure * 0.28) / pattern);
      }
      if (timers.ring <= 0) {
        this.fireBossRing(boss, Math.floor((14 + Math.floor(hpPressure * 8)) * pattern));
        timers.ring = Math.max(1.25, (5.2 - hpPressure * 0.9) / pattern);
      }
    }
  }

  private getBossTimers(boss: Enemy): BossPatternTimers {
    let timers = this.bossTimers.get(boss as object);
    if (!timers) {
      timers = { fan: 0.75, triple: 1.25, ring: 2.8 };
      this.bossTimers.set(boss as object, timers);
    }
    return timers;
  }

  private updateQueuedEnemyShots(dt: number): void {
    if (this.queuedEnemyShots.length <= 0) return;
    for (const shot of this.queuedEnemyShots) shot.delay -= dt;
    const ready = this.queuedEnemyShots.filter((shot) => shot.delay <= 0);
    this.queuedEnemyShots = this.queuedEnemyShots.filter((shot) => shot.delay > 0);
    for (const shot of ready) this.projectiles.push(new Projectile(shot.x, shot.y, shot.vx, shot.vy, true, shot.damage, shot.kind));
  }

  private fireBossFan(boss: Enemy, count: number): void {
    const base = this.angleToPlayer(boss);
    const spread = 1.08;
    const speed = 330;
    const damage = 12 * getCurrentDifficulty().damageMult;
    for (let i = 0; i < count; i++) {
      const t = count <= 1 ? 0 : i / (count - 1);
      const angle = base - spread / 2 + spread * t;
      this.spawnEnemyShot(boss.pos.x, boss.pos.y, angle, speed, Math.floor(damage), "energy");
    }
  }

  private queueBossTriple(boss: Enemy, patternMult: number): void {
    const base = this.angleToPlayer(boss);
    const speed = 380;
    const damage = Math.floor(15 * getCurrentDifficulty().damageMult);
    const offsets = patternMult >= 1.55 ? [-0.16, -0.08, 0.02, 0.1, 0.18] : [-0.08, 0.02, 0.1];
    for (let i = 0; i < offsets.length; i++) {
      const angle = base + offsets[i];
      this.queuedEnemyShots.push({ x: boss.pos.x, y: boss.pos.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, damage, kind: "heavy_magic", delay: i * 0.13 });
    }
  }

  private fireBossRing(boss: Enemy, count: number): void {
    const speed = 245;
    const damage = Math.floor(10 * getCurrentDifficulty().damageMult);
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

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
}
