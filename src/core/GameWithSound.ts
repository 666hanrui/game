import { Game } from "./Game";
import { SoundSystem } from "../systems/SoundSystem";
import { Projectile, ProjectileKind } from "../entities/Projectile";
import { Enemy } from "../entities/Enemy";
import { DIFFICULTIES, DifficultyId, getCurrentDifficulty, getCurrentDifficultyId, setCurrentDifficulty } from "../systems/DifficultySystem";
import { LuckyUpgradePanel } from "../ui/LuckyUpgradePanel";
import { StatsPanel } from "../ui/StatsPanel";
import { BuildEffectOverlay } from "../ui/BuildEffectOverlay";

const WORLD_W = 2400;
const WORLD_H = 2400;

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

interface SpecialEnemyTimers {
  summon: number;
  heal: number;
}

export class GameWithSound extends Game {
  private sound = new SoundSystem();
  private muted = false;
  private bossTimers = new WeakMap<object, BossPatternTimers>();
  private specialTimers = new WeakMap<object, SpecialEnemyTimers>();
  private explodedBombers = new WeakSet<object>();
  private queuedEnemyShots: QueuedEnemyShot[] = [];
  private difficultyRects: { x: number; y: number; w: number; h: number; id: DifficultyId }[] = [];
  private statsPanel = new StatsPanel();
  private buildEffects = new BuildEffectOverlay();
  private buildPowerTimer = 0;
  private maceImpactTimer = 0;
  private diamondPowerTimer = 0;

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
    this.applyMaceRuntimeTuning();
    super.update(dt);
    this.updateMaceShots(before.playerShots, dt);
    this.updateSpecialEnemies(dt);
    this.updateBossPatterns(dt);
    this.updateDiamondPowers(dt);
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

  private updateDiamondPowers(dt: number): void {
    if (this.phase !== "playing" || !this.selectedWeapon) return;
    const diamond = this.diamondCount();
    if (diamond <= 0) return;

    this.applyDiamondPassiveAuras(diamond);
    this.diamondPowerTimer -= dt;
    if (this.diamondPowerTimer > 0) return;

    const weaponId = this.selectedWeapon.id;
    if (weaponId === "bow") {
      this.triggerDiamondBow(diamond);
      this.diamondPowerTimer = Math.max(0.48, 1.05 - diamond * 0.09);
    } else if (this.isMagicWeapon(weaponId)) {
      this.triggerDiamondMagic(diamond);
      this.diamondPowerTimer = Math.max(0.5, 1.18 - diamond * 0.08);
    } else if (this.isTechWeapon(weaponId)) {
      this.triggerDiamondTech(diamond);
      this.diamondPowerTimer = Math.max(0.42, 0.95 - diamond * 0.07);
    } else if (weaponId === "mace") {
      this.triggerDiamondMace(diamond);
      this.diamondPowerTimer = Math.max(0.62, 1.35 - diamond * 0.08);
    } else if (this.isMartialWeapon(weaponId)) {
      this.triggerDiamondMartial(diamond);
      this.diamondPowerTimer = Math.max(0.46, 1.02 - diamond * 0.07);
    }
  }

  private applyDiamondPassiveAuras(diamond: number): void {
    if (this.hasDiamondSkill("frost_arrow")) {
      const radius = 190 + diamond * 28;
      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        if (this.distToPlayer(enemy) <= radius + enemy.radius) enemy.applySlow(0.72 - Math.min(0.22, diamond * 0.03), 0.34);
      }
    }

    if (this.hasDiamondSpecial("armor_break") || this.hasDiamondSkill("bone_crusher")) {
      const radius = 150 + diamond * 24;
      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        if (this.distToPlayer(enemy) <= radius + enemy.radius) enemy.breakArmor(1 + diamond);
      }
    }
  }

  private triggerDiamondBow(diamond: number): void {
    const targets = this.getPriorityTargets(2 + diamond, 980);
    const spread = this.hasDiamondSkill("multi_arrow") ? 0.38 : 0.24;
    const perTarget = 3 + diamond + (this.hasDiamondSkill("multi_arrow") ? 2 : 0);
    const speed = 820 + diamond * 25;
    const damage = Math.max(6, Math.floor(this.player.damage * (0.48 + diamond * 0.035)));

    if (targets.length <= 0) {
      this.fireArrowRain(8 + diamond * 3);
      return;
    }

    for (const target of targets) {
      const base = Math.atan2(target.pos.y - this.player.pos.y, target.pos.x - this.player.pos.x);
      for (let i = 0; i < perTarget; i++) {
        const offset = (i - (perTarget - 1) / 2) * spread / Math.max(1, perTarget - 1);
        const angle = base + offset;
        const sx = this.player.pos.x + Math.cos(angle + Math.PI / 2) * (i - perTarget / 2) * 4;
        const sy = this.player.pos.y + Math.sin(angle + Math.PI / 2) * (i - perTarget / 2) * 4;
        this.projectiles.push(new Projectile(sx, sy, Math.cos(angle) * speed, Math.sin(angle) * speed, false, damage, "arrow"));
      }

      if (this.hasDiamondSkill("fireball")) {
        const angle = base + 0.06;
        this.projectiles.push(new Projectile(this.player.pos.x, this.player.pos.y, Math.cos(angle) * 650, Math.sin(angle) * 650, false, Math.floor(damage * 1.15), "heavy_magic"));
      }
    }
  }

  private triggerDiamondMagic(diamond: number): void {
    const targets = this.getPriorityTargets(2 + diamond, 900);
    const count = 10 + diamond * 4 + (this.hasDiamondSkill("wand_chain") || this.hasDiamondSkill("orb_count") ? 4 : 0);
    const kind: ProjectileKind = this.selectedWeapon?.id === "staff" || this.hasDiamondSkill("staff_power") ? "heavy_magic" : "magic";
    const speed = kind === "heavy_magic" ? 500 : 610;
    const damage = Math.max(7, Math.floor(this.player.damage * (0.42 + diamond * 0.045)));
    const offset = this.gameTime * 0.8;

    for (let i = 0; i < count; i++) {
      const angle = offset + (i / count) * Math.PI * 2;
      this.projectiles.push(new Projectile(this.player.pos.x, this.player.pos.y, Math.cos(angle) * speed, Math.sin(angle) * speed, false, damage, kind));
    }

    for (const target of targets) {
      const base = Math.atan2(target.pos.y - this.player.pos.y, target.pos.x - this.player.pos.x);
      for (const offsetAngle of [-0.18, 0, 0.18]) {
        const angle = base + offsetAngle;
        this.projectiles.push(new Projectile(this.player.pos.x, this.player.pos.y, Math.cos(angle) * (speed + 80), Math.sin(angle) * (speed + 80), false, Math.floor(damage * 0.9), kind));
      }
    }
  }

  private triggerDiamondTech(diamond: number): void {
    const targets = this.getPriorityTargets(3 + diamond, 1050);
    if (targets.length <= 0) return;

    const kind: ProjectileKind = this.selectedWeapon?.id === "drone_core" || this.hasDiamondSkill("drone") ? "drone" : "energy";
    const speed = kind === "drone" ? 780 : 880;
    const damage = Math.max(6, Math.floor(this.player.damage * (0.38 + diamond * 0.05)));
    const shots = Math.min(18, targets.length * (2 + diamond));

    for (let i = 0; i < shots; i++) {
      const target = targets[i % targets.length];
      const dx = target.pos.x - this.player.pos.x;
      const dy = target.pos.y - this.player.pos.y;
      const base = Math.atan2(dy, dx) + (i - shots / 2) * 0.018;
      this.projectiles.push(new Projectile(this.player.pos.x, this.player.pos.y, Math.cos(base) * speed, Math.sin(base) * speed, false, damage, kind));
    }
  }

  private triggerDiamondMace(diamond: number): void {
    this.applyMaceShockwave(true);
    const count = 10 + diamond * 4 + (this.hasDiamondSpecial("earthquake") ? 4 : 0);
    const speed = 420;
    const damage = Math.max(9, Math.floor(this.player.damage * (0.32 + diamond * 0.055)));
    const offset = this.gameTime * 1.4;
    for (let i = 0; i < count; i++) {
      const angle = offset + (i / count) * Math.PI * 2;
      this.projectiles.push(new Projectile(this.player.pos.x, this.player.pos.y, Math.cos(angle) * speed, Math.sin(angle) * speed, false, damage, "hammer"));
    }
  }

  private triggerDiamondMartial(diamond: number): void {
    const targets = this.getPriorityTargets(1 + diamond, 860);
    const spear = this.selectedWeapon?.id === "spear";
    const count = spear ? 4 + diamond : 8 + diamond * 2;
    const speed = spear ? 900 : 720;
    const damage = Math.max(7, Math.floor(this.player.damage * (spear ? 0.55 : 0.42)));
    const base = targets[0]
      ? Math.atan2(targets[0].pos.y - this.player.pos.y, targets[0].pos.x - this.player.pos.x)
      : Math.atan2(this.input.state.aimDir.y, this.input.state.aimDir.x);

    for (let i = 0; i < count; i++) {
      const angle = spear
        ? base + (i - (count - 1) / 2) * 0.11
        : base + (i / count) * Math.PI * 2;
      this.projectiles.push(new Projectile(this.player.pos.x, this.player.pos.y, Math.cos(angle) * speed, Math.sin(angle) * speed, false, damage, spear ? "arrow" : "blade"));
    }
  }

  private updateSpecialEnemies(dt: number): void {
    if (this.phase !== "playing") return;

    for (const enemy of [...this.enemies]) {
      if (!enemy.alive) continue;

      if (enemy.role === "bomber") {
        const trigger = enemy.radius + this.player.radius + 38;
        if (this.distToPlayer(enemy) <= trigger) this.detonateBomber(enemy);
        continue;
      }

      if (enemy.role !== "summoner" && enemy.role !== "healer") continue;
      const timers = this.getSpecialTimers(enemy);
      timers.summon -= dt;
      timers.heal -= dt;

      if (enemy.role === "summoner" && timers.summon <= 0) {
        this.summonAdds(enemy);
        timers.summon = Math.max(2.2, 4.8 - this.waveNum * 0.08 - getCurrentDifficulty().eliteBonus * 3.2);
      }

      if (enemy.role === "healer" && timers.heal <= 0) {
        this.healNearbyEnemies(enemy);
        timers.heal = Math.max(1.35, 2.75 - this.waveNum * 0.035 - getCurrentDifficulty().eliteBonus * 1.8);
      }
    }
  }

  private getSpecialTimers(enemy: Enemy): SpecialEnemyTimers {
    let timers = this.specialTimers.get(enemy as object);
    if (!timers) {
      timers = {
        summon: 1.8 + Math.random() * 1.8,
        heal: 0.8 + Math.random() * 1.2,
      };
      this.specialTimers.set(enemy as object, timers);
    }
    return timers;
  }

  private detonateBomber(enemy: Enemy): void {
    if (this.explodedBombers.has(enemy as object)) return;
    this.explodedBombers.add(enemy as object);

    const difficulty = getCurrentDifficulty();
    const radius = 92 + Math.min(56, this.waveNum * 3.5) + difficulty.eliteBonus * 75;
    const damage = Math.floor((18 + this.waveNum * 2.25) * difficulty.damageMult);
    const now = performance.now() / 1000;

    if (this.distToPlayer(enemy) <= radius + this.player.radius) {
      this.combat.dealDamageToPlayer(this.player, damage, now);
      this.sound.playerHurt();
    }

    // 爆炸怪会伤到其他敌人，但这里控制为“非致死削血”，避免绕过原本击杀/经验结算。
    for (const other of this.enemies) {
      if (!other.alive || other === enemy) continue;
      const d = this.dist(enemy.pos.x, enemy.pos.y, other.pos.x, other.pos.y);
      if (d > radius + other.radius) continue;
      const splash = Math.min(Math.max(0, other.hp - 1), Math.floor(damage * 0.72));
      if (splash > 0) other.takeDamage(splash, Math.floor(damage * 0.3));
      other.applySlow(0.58, 0.8);
      const push = 36 * (1 - Math.min(1, d / Math.max(1, radius)));
      if (push > 0) {
        const dx = (other.pos.x - enemy.pos.x) / Math.max(1, d);
        const dy = (other.pos.y - enemy.pos.y) / Math.max(1, d);
        other.pos.x += dx * push;
        other.pos.y += dy * push;
      }
    }

    enemy.alive = false;
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      this.queuedEnemyShots.push({
        x: enemy.pos.x,
        y: enemy.pos.y,
        vx: Math.cos(angle) * 250,
        vy: Math.sin(angle) * 250,
        damage: Math.max(1, Math.floor(damage * 0.18)),
        kind: "energy",
        delay: i * 0.012,
      });
    }
  }

  private summonAdds(enemy: Enemy): void {
    const difficulty = getCurrentDifficulty();
    const cap = difficulty.id === "hell" ? 120 : difficulty.id === "nightmare" ? 98 : 82;
    if (this.enemies.length >= cap) return;

    const hpMult = Math.max(0.45, this.wave.getHPMultiplier(this.waveNum) * 0.48);
    const spdMult = this.wave.getSpeedMultiplier(this.waveNum) * 1.02;
    const count = Math.min(4, 2 + Math.floor(this.waveNum / 12) + (difficulty.id === "hell" ? 1 : 0));

    for (let i = 0; i < count; i++) {
      const roll = Math.random();
      const role = roll < 0.62 ? "basic" : roll < 0.88 ? "fast" : "bomber";
      const add = new Enemy(WORLD_W, WORLD_H, hpMult, spdMult, role);
      const angle = Math.random() * Math.PI * 2;
      const dist = 34 + Math.random() * 42;
      add.pos.x = this.clamp(enemy.pos.x + Math.cos(angle) * dist, 40, WORLD_W - 40);
      add.pos.y = this.clamp(enemy.pos.y + Math.sin(angle) * dist, 40, WORLD_H - 40);
      add.radius = Math.max(9, Math.floor(add.radius * 0.82));
      add.maxHp = Math.max(12, Math.floor(add.maxHp * 0.68));
      add.hp = add.maxHp;
      add.maxArmor = Math.floor(add.maxArmor * 0.45);
      add.armor = add.maxArmor;
      this.enemies.push(add);
    }
  }

  private healNearbyEnemies(healer: Enemy): void {
    const difficulty = getCurrentDifficulty();
    const radius = difficulty.id === "hell" ? 285 : difficulty.id === "nightmare" ? 255 : 230;
    const amount = Math.floor(18 + this.waveNum * 2.1 + difficulty.eliteBonus * 35);
    const injured = this.enemies
      .filter((e) => e.alive && e !== healer && e.hp < e.maxHp && this.dist(e.pos.x, e.pos.y, healer.pos.x, healer.pos.y) <= radius)
      .sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))
      .slice(0, difficulty.id === "hell" ? 6 : 4);

    for (const target of injured) {
      target.heal(amount);
    }

    if (healer.hp < healer.maxHp * 0.85) healer.heal(Math.floor(amount * 0.55));
  }

  private applyMaceRuntimeTuning(): void {
    if (this.selectedWeapon?.id !== "mace") return;
    const diamond = this.diamondCount();
    const floor = Math.max(0.5, 0.68 - diamond * 0.045);
    this.player.attackCooldown = Math.max(this.player.attackCooldown, floor);
  }

  private updateMaceShots(beforePlayerShots: number, dt: number): void {
    this.maceImpactTimer = Math.max(0, this.maceImpactTimer - dt);
    if (this.selectedWeapon?.id !== "mace") return;

    const playerShots = this.projectiles.filter((p) => !p.fromEnemy);
    const newCount = Math.max(0, playerShots.length - beforePlayerShots);
    if (newCount <= 0) return;

    const newShots = playerShots.slice(-newCount);
    const diamond = this.diamondCount();
    for (const p of newShots) {
      p.kind = "hammer";
      p.damage = Math.floor(p.damage * (1.35 + diamond * 0.18));
      const len = Math.sqrt(p.vel.x * p.vel.x + p.vel.y * p.vel.y) || 1;
      const speed = 410 + diamond * 24;
      p.vel.x = (p.vel.x / len) * speed;
      p.vel.y = (p.vel.y / len) * speed;
    }

    if (this.maceImpactTimer <= 0) {
      this.applyMaceShockwave(false);
      this.maceImpactTimer = Math.max(0.22, this.player.attackCooldown * 0.68);
    }
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
    } else if (weaponId === "mace") {
      this.releaseMaceQuake(score);
      this.buildPowerTimer = Math.max(0.5, 1.45 - score * 0.045 - this.diamondCount() * 0.08);
    } else if (this.isMartialWeapon(weaponId)) {
      this.releaseWeaponAura(score);
      this.buildPowerTimer = Math.max(0.36, 1.18 - score * 0.045);
    } else if (this.isTechWeapon(weaponId)) {
      this.fireTechVolley(score);
      this.buildPowerTimer = Math.max(0.32, 1.05 - score * 0.04);
    }
  }

  private getBuildPowerScore(): number {
    return this.appliedSkills.length + this.player.projectileExtra * 1.6 + this.player.critChance * 10 + Math.max(0, this.player.damage - 45) / 18 + this.diamondCount() * 3.5;
  }

  private castArcaneNova(score: number): void {
    const count = Math.min(20, 6 + Math.floor(score / 1.6) + this.diamondCount() * 2);
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
    const count = Math.min(14, 3 + this.player.projectileExtra + Math.floor(score / 4) + this.diamondCount() * 2);
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

  private releaseMaceQuake(score: number): void {
    this.applyMaceShockwave(true);
    const count = Math.min(16, 6 + Math.floor(score / 3) + this.diamondCount() * 3);
    const damage = Math.max(8, Math.floor(this.player.damage * (0.34 + this.diamondCount() * 0.04)));
    const speed = 360;
    const offset = performance.now() / 700;

    for (let i = 0; i < count; i++) {
      const angle = offset + (i / count) * Math.PI * 2;
      this.projectiles.push(new Projectile(this.player.pos.x, this.player.pos.y, Math.cos(angle) * speed, Math.sin(angle) * speed, false, damage, "hammer"));
    }
  }

  private applyMaceShockwave(empowered: boolean): void {
    const score = this.getBuildPowerScore();
    const diamond = this.diamondCount();
    const armorBreakSkill = this.countSpecial("armor_break");
    const quakeSkill = this.countSpecial("earthquake");
    const radius = 74 + quakeSkill * 22 + this.player.projectileExtra * 8 + diamond * 26 + (empowered ? 48 : 0);
    const damage = Math.floor(this.player.damage * (empowered ? 0.34 : 0.18) + score * (empowered ? 1.2 : 0.55));
    const armorBreak = 3 + armorBreakSkill * 7 + diamond * 9 + (empowered ? 8 : 0);
    const knock = 28 + quakeSkill * 10 + diamond * 12 + (empowered ? 26 : 0);

    for (const e of this.enemies) {
      if (!e.alive) continue;
      const dx = e.pos.x - this.player.pos.x;
      const dy = e.pos.y - this.player.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      if (dist > radius + e.radius) continue;

      e.breakArmor(armorBreak);
      const safeDamage = Math.min(Math.max(0, e.hp - 1), damage);
      if (safeDamage > 0) e.takeDamage(safeDamage, armorBreak);
      const push = knock * (1 - Math.min(1, dist / Math.max(1, radius)));
      e.pos.x += (dx / dist) * push;
      e.pos.y += (dy / dist) * push;
    }
  }

  private fireTechVolley(score: number): void {
    const targets = this.enemies
      .filter((e) => e.alive)
      .sort((a, b) => this.dist2(a.pos.x, a.pos.y) - this.dist2(b.pos.x, b.pos.y))
      .slice(0, Math.min(8, 2 + Math.floor(score / 4) + this.diamondCount()));

    if (targets.length <= 0) return;

    const kind: ProjectileKind = this.selectedWeapon?.id === "drone_core" ? "drone" : "energy";
    const speed = kind === "drone" ? 660 : 760;
    const damage = Math.max(5, Math.floor(this.player.damage * (kind === "drone" ? 0.34 : 0.46)));
    const shots = Math.min(12, targets.length + this.player.projectileExtra + this.diamondCount() * 2);

    for (let i = 0; i < shots; i++) {
      const target = targets[i % targets.length];
      const dx = target.pos.x - this.player.pos.x;
      const dy = target.pos.y - this.player.pos.y;
      const base = Math.atan2(dy, dx) + (i - shots / 2) * 0.035;
      this.projectiles.push(new Projectile(this.player.pos.x, this.player.pos.y, Math.cos(base) * speed, Math.sin(base) * speed, false, damage, kind));
    }
  }

  private findBuildTarget(): Enemy | null {
    return this.getPriorityTargets(1, 1200)[0] ?? null;
  }

  private getPriorityTargets(limit: number, maxDist: number): Enemy[] {
    return this.enemies
      .filter((e) => e.alive && this.distToPlayer(e) <= maxDist)
      .sort((a, b) => this.targetWeight(a) - this.targetWeight(b))
      .slice(0, limit);
  }

  private targetWeight(enemy: Enemy): number {
    const d = this.dist2(enemy.pos.x, enemy.pos.y);
    if (enemy.role === "healer" || enemy.role === "summoner") return d * 0.26;
    if (enemy.role === "bomber") return d * 0.42;
    if (enemy.role === "boss") return d * 0.35;
    if (enemy.role === "elite") return d * 0.55;
    if (enemy.role === "ranged") return d * 0.7;
    return d;
  }

  private distToPlayer(enemy: Enemy): number {
    return this.dist(enemy.pos.x, enemy.pos.y, this.player.pos.x, this.player.pos.y);
  }

  private dist2(x: number, y: number): number {
    const dx = x - this.player.pos.x;
    const dy = y - this.player.pos.y;
    return dx * dx + dy * dy;
  }

  private dist(ax: number, ay: number, bx: number, by: number): number {
    const dx = ax - bx;
    const dy = ay - by;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  private countSpecial(special: string): number {
    return this.appliedSkills.filter((s) => s.special === special).length;
  }

  private hasDiamondSkill(id: string): boolean {
    return this.appliedSkills.some((s) => s.id === id && s.rarity === "diamond");
  }

  private hasDiamondSpecial(special: string): boolean {
    return this.appliedSkills.some((s) => s.special === special && s.rarity === "diamond");
  }

  private diamondCount(): number {
    return this.appliedSkills.filter((s) => s.rarity === "diamond").length;
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
