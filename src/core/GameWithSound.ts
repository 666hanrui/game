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
      this.projectiles.push(new Projectile(this.player.pos.x, this.player.pos.y, Math.cos(angle) * speed, Math.sin(angle) * speed, false, damage, spear ? "spear_beam" : "blade"));
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

    // 狼牙棒第一阶段已改成近战基础攻击；地裂 / 震荡波会生成 shockwave。
    // 这里不能再把所有新弹体强行改成 hammer，否则会覆盖地裂视觉和隐藏联动。
    const newHammerShots = playerShots.slice(-newCount).filter((p) => p.kind === "hammer");
    if (newHammerShots.length <= 0) return;

    const diamond = this.diamondCount();
    for (const p of newHammerShots) {
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
      this.releaseMaceQuakeFX(score);
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
    const count = Math.min(22, 8 + Math.floor(score / 1.5) + this.diamondCount() * 3);
    const speed = 760 + Math.min(160, score * 10);
    const damage = Math.max(5, Math.floor(this.player.damage * (0.32 + Math.min(0.26, score * 0.01))));
    const target = this.getPriorityTargets(1, 920)[0];
    const base = target ? Math.atan2(target.pos.y - this.player.pos.y, target.pos.x - this.player.pos.x) : Math.atan2(this.input.state.aimDir.y, this.input.state.aimDir.x);

    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * 0.045;
      const angle = base + offset + (Math.random() - 0.5) * 0.08;
      const sx = this.player.pos.x - Math.cos(base) * 40 + Math.cos(base + Math.PI / 2) * (i - count / 2) * 8;
      const sy = this.player.pos.y - Math.sin(base) * 40 + Math.sin(base + Math.PI / 2) * (i - count / 2) * 8;
      this.projectiles.push(new Projectile(sx, sy, Math.cos(angle) * speed, Math.sin(angle) * speed, false, damage, "arrow"));
    }
  }

  private releaseWeaponAura(score: number): void {
    const spear = this.selectedWeapon?.id === "spear";
    const count = Math.min(18, 6 + Math.floor(score / 1.8) + this.diamondCount() * 2);
    const speed = spear ? 820 : 650;
    const kind: ProjectileKind = spear ? "spear_beam" : "blade";
    const damage = Math.max(6, Math.floor(this.player.damage * (spear ? 0.42 : 0.34)));
    const target = this.getPriorityTargets(1, 760)[0];
    const base = target ? Math.atan2(target.pos.y - this.player.pos.y, target.pos.x - this.player.pos.x) : Math.atan2(this.input.state.aimDir.y, this.input.state.aimDir.x);

    for (let i = 0; i < count; i++) {
      const angle = spear ? base + (i - count / 2) * 0.06 : base + (i / count) * Math.PI * 2;
      this.projectiles.push(new Projectile(this.player.pos.x, this.player.pos.y, Math.cos(angle) * speed, Math.sin(angle) * speed, false, damage, kind));
    }
  }

  private releaseMaceQuakeFX(score: number): void {
    this.applyMaceShockwave(false);
    const count = Math.min(14, 5 + Math.floor(score / 2) + this.diamondCount() * 2);
    const speed = 360;
    const damage = Math.max(8, Math.floor(this.player.damage * (0.26 + Math.min(0.22, score * 0.008))));
    const base = Math.atan2(this.input.state.aimDir.y, this.input.state.aimDir.x);
    for (let i = 0; i < count; i++) {
      const angle = base + (i - (count - 1) / 2) * 0.18;
      this.projectiles.push(new Projectile(this.player.pos.x, this.player.pos.y, Math.cos(angle) * speed, Math.sin(angle) * speed, false, damage, "shockwave"));
    }
  }

  private fireTechVolley(score: number): void {
    const targets = this.getPriorityTargets(Math.min(8, 2 + Math.floor(score / 3)), 980);
    if (targets.length <= 0) return;
    const kind: ProjectileKind = this.selectedWeapon?.id === "drone_core" ? "drone" : "energy";
    const speed = kind === "drone" ? 700 : 780;
    const damage = Math.max(5, Math.floor(this.player.damage * (0.28 + Math.min(0.22, score * 0.01))));
    for (const target of targets) {
      const base = Math.atan2(target.pos.y - this.player.pos.y, target.pos.x - this.player.pos.x);
      for (const offset of [-0.05, 0.05]) {
        const angle = base + offset;
        this.projectiles.push(new Projectile(this.player.pos.x, this.player.pos.y, Math.cos(angle) * speed, Math.sin(angle) * speed, false, damage, kind));
      }
    }
  }

  private applyMaceShockwave(strong: boolean): void {
    const radius = strong ? 170 + this.diamondCount() * 22 : 118 + this.diamondCount() * 14;
    const damage = Math.max(5, Math.floor(this.player.damage * (strong ? 0.45 : 0.28)));
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const d = this.distToPlayer(enemy);
      if (d > radius + enemy.radius) continue;
      enemy.breakArmor(strong ? 4 + this.diamondCount() : 2 + Math.floor(this.diamondCount() / 2));
      const defeated = enemy.takeDamage(damage, strong ? 4 + this.diamondCount() : 2);
      enemy.applySlow(strong ? 0.45 : 0.62, strong ? 0.7 : 0.36);
      if (defeated) this.kills++;
    }
  }

  private updateBossPatterns(dt: number): void {
    if (this.phase !== "playing") return;
    for (const enemy of this.enemies) {
      if (!enemy.alive || enemy.role !== "boss") continue;
      const timers = this.getBossTimers(enemy);
      timers.fan -= dt;
      timers.triple -= dt;
      timers.ring -= dt;
      if (timers.fan <= 0) { this.fireBossFan(enemy); timers.fan = Math.max(1.8, 3.6 - this.waveNum * 0.03); }
      if (timers.triple <= 0) { this.fireBossTriple(enemy); timers.triple = Math.max(1.3, 2.7 - this.waveNum * 0.02); }
      if (timers.ring <= 0) { this.fireBossRing(enemy); timers.ring = Math.max(2.4, 5.2 - this.waveNum * 0.04); }
    }
    this.updateQueuedEnemyShots(dt);
  }

  private getBossTimers(enemy: Enemy): BossPatternTimers {
    let timers = this.bossTimers.get(enemy as object);
    if (!timers) {
      timers = { fan: 1.5, triple: 2.2, ring: 3.4 };
      this.bossTimers.set(enemy as object, timers);
    }
    return timers;
  }

  private fireBossFan(enemy: Enemy): void {
    const base = Math.atan2(this.player.pos.y - enemy.pos.y, this.player.pos.x - enemy.pos.x);
    for (let i = -3; i <= 3; i++) {
      const angle = base + i * 0.15;
      this.queuedEnemyShots.push({ x: enemy.pos.x, y: enemy.pos.y, vx: Math.cos(angle) * 300, vy: Math.sin(angle) * 300, damage: 12 + Math.floor(this.waveNum * 0.35), kind: "heavy_magic", delay: Math.abs(i) * 0.035 });
    }
  }

  private fireBossTriple(enemy: Enemy): void {
    const base = Math.atan2(this.player.pos.y - enemy.pos.y, this.player.pos.x - enemy.pos.x);
    for (let burst = 0; burst < 3; burst++) {
      for (const offset of [-0.09, 0, 0.09]) {
        const angle = base + offset;
        this.queuedEnemyShots.push({ x: enemy.pos.x, y: enemy.pos.y, vx: Math.cos(angle) * (330 + burst * 25), vy: Math.sin(angle) * (330 + burst * 25), damage: 10 + burst * 2, kind: burst === 2 ? "heavy_magic" : "energy", delay: burst * 0.18 });
      }
    }
  }

  private fireBossRing(enemy: Enemy): void {
    const count = 18;
    const speed = 250 + this.waveNum * 2;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      this.queuedEnemyShots.push({ x: enemy.pos.x, y: enemy.pos.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, damage: 11, kind: "energy", delay: i * 0.01 });
    }
  }

  private updateQueuedEnemyShots(dt: number): void {
    for (const shot of this.queuedEnemyShots) shot.delay -= dt;
    const ready = this.queuedEnemyShots.filter((shot) => shot.delay <= 0);
    this.queuedEnemyShots = this.queuedEnemyShots.filter((shot) => shot.delay > 0);
    for (const shot of ready) {
      this.projectiles.push(new Projectile(shot.x, shot.y, shot.vx, shot.vy, true, shot.damage, shot.kind));
    }
  }

  private updateSounds(before: GameSoundSnapshot, after: GameSoundSnapshot): void {
    if (after.phase !== "playing" && before.phase !== "playing") return;
    if (after.hp < before.hp) this.sound.playerHurt();
    if (after.level > before.level) this.sound.levelUp();
    if (after.kills > before.kills) this.sound.kill();
    if (after.playerShots > before.playerShots) this.sound.attack();
    if (after.bossCount > before.bossCount) this.sound.bossSpawn();
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
      bossCount: this.enemies.filter((e) => e.alive && e.role === "boss").length,
      phase: this.phase,
    };
  }

  private diamondCount(): number {
    return this.appliedSkills.filter((skill) => skill.rarity === "diamond").length;
  }

  private hasDiamondSkill(id: string): boolean {
    return this.appliedSkills.some((skill) => skill.id === id && skill.rarity === "diamond");
  }

  private hasDiamondSpecial(special: string): boolean {
    return this.appliedSkills.some((skill) => skill.special === special && skill.rarity === "diamond");
  }

  private isMagicWeapon(id: string): boolean {
    return id === "wand" || id === "staff" || id === "orb";
  }

  private isTechWeapon(id: string): boolean {
    return id === "drone_core" || id === "energy_core";
  }

  private isMartialWeapon(id: string): boolean {
    return id === "bow" || id === "flying_blade" || id === "spear" || id === "mace";
  }

  private getPriorityTargets(count: number, range: number): Enemy[] {
    return this.enemies
      .filter((enemy) => enemy.alive && this.distToPlayer(enemy) <= range)
      .sort((a, b) => this.targetScore(b) - this.targetScore(a))
      .slice(0, count);
  }

  private targetScore(enemy: Enemy): number {
    const roleScore = enemy.role === "boss" ? 1000 : enemy.role === "elite" ? 420 : enemy.role === "summoner" || enemy.role === "healer" ? 340 : enemy.role === "ranged" ? 260 : enemy.role === "tank" ? 160 : 80;
    return roleScore + enemy.hp * 0.04 - this.distToPlayer(enemy) * 0.12;
  }

  private distToPlayer(enemy: Enemy): number {
    return this.dist(this.player.pos.x, this.player.pos.y, enemy.pos.x, enemy.pos.y);
  }

  private dist(ax: number, ay: number, bx: number, by: number): number {
    const dx = ax - bx;
    const dy = ay - by;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  private handleDifficultyClick(e: MouseEvent): void {
    if (this.phase !== "menu") return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    for (const item of this.difficultyRects) {
      if (x >= item.x && x <= item.x + item.w && y >= item.y && y <= item.y + item.h) {
        setCurrentDifficulty(item.id);
        this.sound.click();
        break;
      }
    }
  }

  private renderDifficultySelector(): void {
    const ctx = this.ctx;
    const current = getCurrentDifficultyId();
    const items = DIFFICULTIES;
    const w = 86;
    const h = 28;
    const gap = 8;
    const total = items.length * w + (items.length - 1) * gap;
    const x0 = this.w / 2 - total / 2;
    const y = this.h - 58;
    this.difficultyRects = [];

    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "bold 12px monospace";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText("难度", this.w / 2, y - 10);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const x = x0 + i * (w + gap);
      const selected = item.id === current;
      this.difficultyRects.push({ x, y, w, h, id: item.id });
      ctx.fillStyle = selected ? "rgba(255,213,79,0.18)" : "rgba(255,255,255,0.06)";
      ctx.strokeStyle = selected ? "#ffd54f" : "rgba(255,255,255,0.18)";
      ctx.lineWidth = selected ? 2 : 1;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = selected ? "#ffd54f" : "rgba(255,255,255,0.7)";
      ctx.fillText(item.name, x + w / 2, y + 18);
    }
    ctx.restore();
  }
}
