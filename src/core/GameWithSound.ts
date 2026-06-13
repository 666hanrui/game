import { Game } from "./Game";
import { SoundSystem } from "../systems/SoundSystem";
import { Projectile, ProjectileKind } from "../entities/Projectile";
import type { Enemy } from "../entities/Enemy";
import { DIFFICULTIES, DifficultyId, getCurrentDifficulty, getCurrentDifficultyId, setCurrentDifficulty } from "../systems/DifficultySystem";
import { LuckyUpgradePanel } from "../ui/LuckyUpgradePanel";
import { StatsPanel } from "../ui/StatsPanel";
import { BuildEffectOverlay } from "../ui/BuildEffectOverlay";

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
  private statsPanel = new StatsPanel();
  private buildEffects = new BuildEffectOverlay();
  private buildPowerTimer = 0;

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
    this.updateBuildPower(dt);
    const after = this.snapshot();
    this.updateSounds(before, after);
  }

  render(): void {
    super.render();
    if (this.phase === "playing") this.renderBuildEffects();
    if (this.phase === "playing" || this.phase === "paused") this.renderStatsPanel();
    if (this.phase === "menu") this.renderDifficultySelector();
  }

  private renderBuildEffects(): void {
    this.buildEffects.render(this.ctx, {
      camera: this.camera,
      player: this.player,
      weaponId: this.selectedWeapon?.id,
      skills: this.appliedSkills,
      screenW: this.w,
      screenH: this.h,
      time: this.gameTime,
    });
  }

  private renderStatsPanel(): void {
    this.statsPanel.render(this.ctx, {
      player: this.player,
      race: this.selectedRace,
      school: this.selectedSchool,
      weapon: this.selectedWeapon,
      level: this.xp.level,
      wave: this.waveNum,
      kills: this.kills,
      bossKills: this.bossKills,
      skills: this.appliedSkills,
    });
  }

  private updateBuildPower(dt: number): void {
    if (this.phase !== "playing" || !this.selectedWeapon) return;
    const score = this.getBuildPowerScore();
    if (score < 7) return;

    this.buildPowerTimer -= dt;
    if (this.buildPowerTimer > 0) return;

    const weaponId = this.selectedWeapon.id;
    if (this.isMagicWeapon(weaponId)) {
      this.castArcaneNova(score);
      this.buildPowerTimer = Math.max(0.42, 1.55 - score * 0.055);
    } else if (weaponId === "bow") {
      this.fireArrowRain(score);
      this.buildPowerTimer = Math.max(0.36, 1.25 - score * 0.045);
    } else if (this.isMartialWeapon(weaponId)) {
      this.releaseWeaponAura(score);
      this.buildPowerTimer = Math.max(0.36, 1.18 - score * 0.045);
    } else if (this.isTechWeapon(weaponId)) {
      this.fireTechVolley(score);
      this.buildPowerTimer = Math.max(0.32, 1.05 - score * 0.04);
    }
  }

  private getBuildPowerScore(): number {
    return this.appliedSkills.length + this.player.projectileExtra * 1.6 + this.player.critChance * 10 + Math.max(0, this.player.damage - 45) / 18;
  }

  private castArcaneNova(score: number): void {
    const count = Math.min(20, 6 + Math.floor(score / 1.6));
    const kind: ProjectileKind = this.selectedWeapon?.id === "staff" ? "heavy_magic" : "magic";
    const speed = this.selectedWeapon?.id === "orb" ? 380 : 460;
    const damage = Math.max(6, Math.floor(this.player.damage * (0.32 + Math.min(0.28, score * 0.012))));
    const offset = performance.now() / 1000;

    for (let i = 0; i < count; i++) {
      const angle = offset + (i / count) * Math.PI * 2;
      this.projectiles.push(new Projectile(this.player.pos.x, this.player.pos.y, Math.cos(angle) * speed, Math.sin(angle) * speed, false, damage, kind));
    }
  }

  private fireArrowRain(score: number): void {
    const target = this.findBuildTarget();
    const base = target ? Math.atan2(target.pos.y - this.player.pos.y, target.pos.x - this.player.pos.x) : Math.random() * Math.PI * 2;
    const count = Math.min(12, 3 + this.player.projectileExtra + Math.floor(score / 4));
    const spread = 0.95;
    const speed = 720;
    const damage = Math.max(5, Math.floor(this.player.damage * 0.42));

    for (let i = 0; i < count; i++) {
      const t = count <= 1 ? 0.5 : i / (count - 1);
      const angle = base - spread / 2 + spread * t;
      const sx = this.player.pos.x - Math.cos(angle) * 36 + (Math.random() - 0.5) * 36;
      const sy = this.player.pos.y - Math.sin(angle) * 36 + (Math.random() - 0.5) * 36;
      this.projectiles.push(new Projectile(sx, sy, Math.cos(angle) * speed, Math.sin(angle) * speed, false, damage, "arrow"));
    }
  }

  private releaseWeaponAura(score: number): void {
    const spear = this.selectedWeapon?.id === "spear";
    const count = spear ? Math.min(8, 3 + Math.floor(score / 4)) : Math.min(12, 4 + Math.floor(score / 3));
    const speed = spear ? 790 : 610;
    const damage = Math.max(6, Math.floor(this.player.damage * (spear ? 0.54 : 0.42)));
    const base = Math.atan2(this.input.state.aimDir.y, this.input.state.aimDir.x);

    for (let i = 0; i < count; i++) {
      const angle = spear
        ? base + (i - (count - 1) / 2) * 0.18
        : base + (i / count) * Math.PI * 2;
      this.projectiles.push(new Projectile(this.player.pos.x, this.player.pos.y, Math.cos(angle) * speed, Math.sin(angle) * speed, false, damage, spear ? "arrow" : "blade"));
    }
  }

  private fireTechVolley(score: number): void {
    const targets = this.enemies
      .filter((e) => e.alive)
      .sort((a, b) => this.dist2(a.pos.x, a.pos.y) - this.dist2(b.pos.x, b.pos.y))
      .slice(0, Math.min(8, 2 + Math.floor(score / 4)));

    if (targets.length <= 0) return;

    const kind: ProjectileKind = this.selectedWeapon?.id === "drone_core" ? "drone" : "energy";
    const speed = kind === "drone" ? 660 : 760;
    const damage = Math.max(5, Math.floor(this.player.damage * (kind === "drone" ? 0.34 : 0.46)));
    const shots = Math.min(10, targets.length + this.player.projectileExtra);

    for (let i = 0; i < shots; i++) {
      const target = targets[i % targets.length];
      const dx = target.pos.x - this.player.pos.x;
      const dy = target.pos.y - this.player.pos.y;
      const base = Math.atan2(dy, dx) + (i - shots / 2) * 0.035;
      this.projectiles.push(new Projectile(this.player.pos.x, this.player.pos.y, Math.cos(base) * speed, Math.sin(base) * speed, false, damage, kind));
    }
  }

  private findBuildTarget(): Enemy | null {
    let best: Enemy | null = null;
    let bestD = Infinity;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const d = this.dist2(e.pos.x, e.pos.y);
      const weight = e.role === "boss" ? d * 0.35 : e.role === "elite" ? d * 0.55 : d;
      if (weight < bestD) {
        bestD = weight;
        best = e;
      }
    }
    return best;
  }

  private dist2(x: number, y: number): number {
    const dx = x - this.player.pos.x;
    const dy = y - this.player.pos.y;
    return dx * dx + dy * dy;
  }

  private isMagicWeapon(id: string): boolean {
    return id === "wand" || id === "staff" || id === "orb";
  }

  private isMartialWeapon(id: string): boolean {
    return id === "flying_blade" || id === "spear";
  }

  private isTechWeapon(id: string): boolean {
    return id === "drone_core" || id === "energy_core";
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
