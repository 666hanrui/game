import { Player } from "../entities/Player";
import { Enemy } from "../entities/Enemy";
import { Projectile, ProjectileKind } from "../entities/Projectile";
import { Pickup } from "../entities/Pickup";
import { Input } from "./Input";
import { Camera } from "./Camera";
import { WaveSystem } from "../systems/WaveSystem";
import { CombatSystem } from "../systems/CombatSystem";
import { XPLevelSystem } from "../systems/XPLevelSystem";
import { HUD } from "../ui/HUD";
import { UpgradePanel, RacePanel, SchoolPanel, WeaponPanel } from "../ui/UpgradePanel";
import { Race, RACES } from "../data/races";
import { School } from "../data/schools";
import { Skill, SkillSchool } from "../data/skills";
import { Weapon } from "../data/weapons";
import { distance, randRange, vec2, Vec2 } from "../utils/math";

export type GamePhase = "menu" | "playing" | "upgrade" | "school_choice" | "weapon_choice" | "result";

const WORLD_W = 2400;
const WORLD_H = 2400;

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  input: Input;
  camera: Camera;

  w = 0;
  h = 0;

  player: Player;
  enemies: Enemy[] = [];
  projectiles: Projectile[] = [];
  pickups: Pickup[] = [];

  wave: WaveSystem;
  combat: CombatSystem;
  xp: XPLevelSystem;
  hud: HUD;

  upgradePanel: UpgradePanel;
  racePanel: RacePanel;
  schoolPanel: SchoolPanel;
  weaponPanel: WeaponPanel;

  phase: GamePhase = "menu";

  selectedRace: Race | null = null;
  selectedSchool: School | null = null;
  selectedWeapon: Weapon | null = null;
  appliedSkills: Skill[] = [];
  appliedSkillIds: string[] = [];

  kills = 0;
  waveNum = 0;
  shootTimer = 0;
  gameTime = 0;

  private xpSpawnTimer = 0;
  private xpSpawnInterval = 3.0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;

    this.resize();
    window.addEventListener("resize", () => this.resize());

    this.input = new Input(canvas);
    this.canvas.addEventListener("click", (e) => this.onClick(e));

    const cx = WORLD_W / 2;
    const cy = WORLD_H / 2;

    this.camera = new Camera(WORLD_W, WORLD_H);
    this.camera.follow(cx, cy);

    this.player = new Player(cx, cy);
    this.wave = new WaveSystem();
    this.combat = new CombatSystem();
    this.xp = new XPLevelSystem();
    this.hud = new HUD();
    this.upgradePanel = new UpgradePanel();
    this.racePanel = new RacePanel();
    this.schoolPanel = new SchoolPanel();
    this.weaponPanel = new WeaponPanel();
  }

  resize(): void {
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = this.w;
    this.canvas.height = this.h;
  }

  private onClick(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    if (this.phase === "result") { this.restart(); return; }
    if (this.phase === "menu") { const race = this.racePanel.handleClick(cx, cy); if (race) this.selectRace(race); return; }
    if (this.phase === "school_choice") { const school = this.schoolPanel.handleClick(cx, cy); if (school) this.selectSchool(school); return; }
    if (this.phase === "weapon_choice") { const weapon = this.weaponPanel.handleClick(cx, cy); if (weapon) this.selectWeapon(weapon); return; }
    if (this.phase === "upgrade") { const skill = this.upgradePanel.handleClick(cx, cy); if (skill) this.applySkill(skill); return; }
  }

  private restart(): void {
    const cx = WORLD_W / 2;
    const cy = WORLD_H / 2;

    this.player = new Player(cx, cy);
    this.camera = new Camera(WORLD_W, WORLD_H);
    this.camera.follow(cx, cy);
    this.enemies = [];
    this.projectiles = [];
    this.pickups = [];
    this.selectedRace = null;
    this.selectedSchool = null;
    this.selectedWeapon = null;
    this.appliedSkills = [];
    this.appliedSkillIds = [];
    this.kills = 0;
    this.waveNum = 0;
    this.shootTimer = 0;
    this.gameTime = 0;
    this.xpSpawnTimer = 0;
    this.xp.reset();
    this.phase = "menu";
  }

  private selectRace(race: Race): void {
    this.selectedRace = race;
    this.applyAllMods();
    this.player.hp = this.player.maxHp;
    this.xp.xpPerKill = Math.floor(20 * race.xpMod);
    this.startNextWave();
    this.phase = "playing";
  }

  private selectSchool(school: School): void {
    this.selectedSchool = school;
    this.selectedWeapon = null;
    this.weaponPanel.setSchool(school.id as SkillSchool);
    this.phase = "weapon_choice";
  }

  private selectWeapon(weapon: Weapon): void {
    this.selectedWeapon = weapon;
    this.upgradePanel.generateChoices(this.selectedSchool?.id as SkillSchool, this.appliedSkillIds, this.selectedWeapon.id);
    this.phase = "upgrade";
  }

  private applySkill(skill: Skill): void {
    this.appliedSkills.push(skill);
    this.appliedSkillIds.push(skill.id);
    this.applyAllMods();
    this.phase = "playing";
  }

  private hasSkill(id: string): boolean {
    return this.appliedSkillIds.includes(id);
  }

  private skillCount(id: string): number {
    return this.appliedSkillIds.filter((skillId) => skillId === id).length;
  }

  private applyAllMods(): void {
    const race = this.selectedRace ?? RACES[0];
    const raceLevel = Math.max(0, this.xp.level - 1);

    let hp = Math.floor((100 + race.hpGrowth * raceLevel) * race.hpMod);
    let spd = Math.floor((260 + race.speedGrowth * raceLevel) * race.spdMod);
    let dmg = Math.floor((25 + race.dmgGrowth * raceLevel) * race.dmgMod);
    let cooldown = 0.4;
    let projExtra = 0;
    let critChance = 0;
    let critMult = 1.5;

    const weaponId = this.selectedWeapon?.id;
    if (weaponId === "staff") { dmg += 10; cooldown += 0.08; }
    if (weaponId === "wand") { cooldown -= 0.03; }
    if (weaponId === "flying_blade") { dmg -= 3; cooldown -= 0.05; }
    if (weaponId === "energy_core") { dmg += 6; }
    if (weaponId === "spear") { dmg += 12; cooldown += 0.04; }
    if (weaponId === "orb") { dmg += 4; cooldown += 0.04; }

    for (const skill of this.appliedSkills) {
      if (skill.mods.maxHp) hp += skill.mods.maxHp;
      if (skill.mods.speed) spd += skill.mods.speed;
      if (skill.mods.damage) dmg += skill.mods.damage;
      if (skill.mods.attackCooldown) cooldown += skill.mods.attackCooldown;
      if (skill.mods.projectileCount) projExtra += skill.mods.projectileCount;
      if (skill.mods.critChance) critChance += skill.mods.critChance;
      if (skill.mods.critMultiplier) critMult += skill.mods.critMultiplier;
    }

    this.player.maxHp = hp;
    this.player.hp = Math.min(this.player.hp, hp);
    this.player.speed = spd;
    this.player.damage = Math.max(1, dmg);
    this.player.radius = Math.max(10, Math.floor(16 * race.radiusMod));
    this.player.attackCooldown = Math.max(0.08, cooldown);
    this.player.projectileExtra = projExtra;
    this.player.critChance = critChance;
    this.player.critMultiplier = critMult;
    this.xp.xpPerKill = Math.floor(20 * race.xpMod);
  }

  startNextWave(): void {
    this.waveNum++;
    const count = this.wave.getEnemyCount(this.waveNum);
    const hpMult = this.wave.getHPMultiplier(this.waveNum);
    const spdMult = this.wave.getSpeedMultiplier(this.waveNum);
    for (let i = 0; i < count; i++) this.enemies.push(new Enemy(WORLD_W, WORLD_H, hpMult, spdMult));
  }

  private spawnMapXP(): void {
    const x = randRange(60, WORLD_W - 60);
    const y = randRange(60, WORLD_H - 60);
    this.pickups.push(new Pickup(x, y, "xp", 30));
  }

  private findNearestEnemy(x: number, y: number, maxDist: number): Enemy | null {
    let result: Enemy | null = null;
    let best = maxDist;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const d = distance(vec2(x, y), e.pos);
      if (d < best) { best = d; result = e; }
    }
    return result;
  }

  private projectileKind(): ProjectileKind {
    switch (this.selectedWeapon?.id) {
      case "wand": return "magic";
      case "staff": return "heavy_magic";
      case "energy_core": return "energy";
      case "flying_blade": return "blade";
      case "drone_core": return "energy";
      case "orb": return "magic";
      default: return "arrow";
    }
  }

  private projectileSpeed(): number {
    switch (this.selectedWeapon?.id) {
      case "staff": return 500;
      case "wand": return 560;
      case "flying_blade": return 520;
      case "energy_core": return 650;
      case "spear": return 760;
      case "orb": return 460;
      default: return 600;
    }
  }

  private createProjectile(dir: Vec2, angleOffset = 0, damage = this.player.damage, kind = this.projectileKind(), speedOverride?: number): Projectile {
    const cos = Math.cos(angleOffset);
    const sin = Math.sin(angleOffset);
    const x = dir.x * cos - dir.y * sin;
    const y = dir.x * sin + dir.y * cos;
    const speed = speedOverride ?? this.projectileSpeed();
    return new Projectile(this.player.pos.x, this.player.pos.y, x * speed, y * speed, false, damage, kind);
  }

  private fireWeapon(): void {
    const baseDir = this.input.state.aimDir;
    const weaponId = this.selectedWeapon?.id;

    if (weaponId === "orb") {
      const count = 3 + this.player.projectileExtra;
      for (let i = 0; i < count; i++) {
        const offset = (i - (count - 1) / 2) * 0.32;
        this.projectiles.push(this.createProjectile(baseDir, offset, Math.floor(this.player.damage * 0.75), "magic", 460));
      }
      return;
    }

    if (weaponId === "spear") {
      this.projectiles.push(this.createProjectile(baseDir, 0, this.player.damage, "arrow", 760));
      for (let i = 0; i < this.player.projectileExtra; i++) {
        const offset = (i + 1) * 0.07 * (i % 2 === 0 ? 1 : -1);
        this.projectiles.push(this.createProjectile(baseDir, offset, Math.floor(this.player.damage * 0.78), "arrow", 760));
      }
      return;
    }

    this.projectiles.push(this.createProjectile(baseDir));

    const spreadStep = weaponId === "flying_blade" ? 0.24 : 0.15;
    for (let i = 0; i < this.player.projectileExtra; i++) {
      const angle = (i + 1) * spreadStep * (i % 2 === 0 ? 1 : -1);
      this.projectiles.push(this.createProjectile(baseDir, angle));
    }

    if (weaponId === "staff") {
      this.projectiles.push(this.createProjectile(baseDir, 0.28, Math.floor(this.player.damage * 0.7), "heavy_magic"));
      this.projectiles.push(this.createProjectile(baseDir, -0.28, Math.floor(this.player.damage * 0.7), "heavy_magic"));
    }

    if (weaponId === "energy_core" && this.hasSkill("energy_refraction")) {
      const count = this.skillCount("energy_refraction");
      this.projectiles.push(this.createProjectile(baseDir, 0.34, Math.floor(this.player.damage * (0.55 + count * 0.08)), "energy", 640));
      this.projectiles.push(this.createProjectile(baseDir, -0.34, Math.floor(this.player.damage * (0.55 + count * 0.08)), "energy", 640));
    }
  }

  private updateTrackingArrows(dt: number): void {
    if (!this.hasSkill("tracking")) return;
    for (const p of this.projectiles) {
      if (!p.alive || p.fromEnemy) continue;
      const target = this.findNearestEnemy(p.pos.x, p.pos.y, 420);
      if (!target) continue;
      const dx = target.pos.x - p.pos.x;
      const dy = target.pos.y - p.pos.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const speed = Math.sqrt(p.vel.x * p.vel.x + p.vel.y * p.vel.y) || 600;
      const blend = Math.min(1, dt * (5 + this.skillCount("tracking") * 1.5));
      p.vel.x += ((dx / len) * speed - p.vel.x) * blend;
      p.vel.y += ((dy / len) * speed - p.vel.y) * blend;
    }
  }

  private updateDrone(dt: number): void {
    const count = this.skillCount("drone") + (this.selectedWeapon?.id === "drone_core" ? 1 : 0);
    if (count <= 0) return;

    const swarm = this.skillCount("drone_swarm");
    const rate = 1.4 + count * 0.35 + swarm * 0.28;
    const gate = Math.floor(this.gameTime * rate);
    const prevGate = Math.floor((this.gameTime - dt) * rate);
    if (gate === prevGate) return;

    for (let i = 0; i < count; i++) {
      const target = this.findNearestEnemy(this.player.pos.x, this.player.pos.y, 760);
      if (!target) break;
      const dx = target.pos.x - this.player.pos.x;
      const dy = target.pos.y - this.player.pos.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      this.projectiles.push(new Projectile(this.player.pos.x, this.player.pos.y, (dx / len) * 620, (dy / len) * 620, false, 12 + count * 5 + swarm * 4, "drone"));
    }
  }

  private explodeAt(x: number, y: number, radius: number, damage: number, exclude: Enemy): void {
    for (const e of this.enemies) {
      if (!e.alive || e === exclude) continue;
      if (distance(vec2(x, y), e.pos) > radius) continue;
      const defeated = e.takeDamage(damage);
      if (defeated) this.onKill(e);
    }
  }

  update(dt: number): void {
    if (this.phase === "menu" || this.phase === "school_choice" || this.phase === "weapon_choice") return;

    if (this.phase === "upgrade") {
      if (this.input.isKeyDown("1") && this.upgradePanel.cards.length >= 1) this.applySkill(this.upgradePanel.cards[0]);
      else if (this.input.isKeyDown("2") && this.upgradePanel.cards.length >= 2) this.applySkill(this.upgradePanel.cards[1]);
      else if (this.input.isKeyDown("3") && this.upgradePanel.cards.length >= 3) this.applySkill(this.upgradePanel.cards[2]);
      return;
    }

    if (this.phase !== "playing") return;

    this.gameTime += dt;
    this.input.update();
    this.player.update(dt, this.input, WORLD_W, WORLD_H);

    this.xpSpawnTimer -= dt;
    if (this.xpSpawnTimer <= 0) { this.spawnMapXP(); this.xpSpawnTimer = this.xpSpawnInterval; }

    this.shootTimer -= dt;
    if (this.input.state.shooting && this.shootTimer <= 0) {
      this.fireWeapon();
      this.shootTimer = this.player.attackCooldown;
    }

    this.updateDrone(dt);
    this.updateTrackingArrows(dt);

    for (const p of this.projectiles) p.update(dt);
    this.projectiles = this.projectiles.filter((p) => p.alive);
    for (const e of this.enemies) e.update(dt, this.player.pos);
    for (const pk of this.pickups) pk.update(dt);
    this.pickups = this.pickups.filter((pk) => pk.alive);

    for (const p of this.projectiles) {
      if (!p.alive || p.fromEnemy) continue;
      for (const e of this.enemies) {
        if (!e.alive) continue;
        if (this.combat.projectileHitsEnemy(p, e)) {
          const isCrit = this.player.critChance > 0 && Math.random() < this.player.critChance;
          const dmg = isCrit ? Math.floor(p.damage * this.player.critMultiplier) : p.damage;
          const defeated = this.combat.dealDamage(e, dmg);
          p.alive = false;

          if (this.hasSkill("frost_arrow")) e.applySlow(0.45, 1.5 + this.skillCount("frost_arrow") * 0.4);
          if (this.hasSkill("fireball")) this.explodeAt(e.pos.x, e.pos.y, 90 + this.skillCount("fireball") * 25, Math.max(4, Math.floor(dmg * 0.5)), e);

          if (this.selectedWeapon?.id === "staff") {
            const bloom = this.skillCount("spell_bloom");
            this.explodeAt(e.pos.x, e.pos.y, 70 + bloom * 26, Math.max(3, Math.floor(dmg * (0.35 + bloom * 0.12))), e);
          }

          if (this.selectedWeapon?.id === "flying_blade" && this.hasSkill("whirl_blade")) {
            const whirl = this.skillCount("whirl_blade");
            this.explodeAt(e.pos.x, e.pos.y, 38 + whirl * 10, Math.max(2, Math.floor(dmg * (0.22 + whirl * 0.06))), e);
          }

          if (this.selectedWeapon?.id === "spear" && this.hasSkill("pierce")) {
            const pierce = this.skillCount("pierce");
            this.explodeAt(e.pos.x, e.pos.y, 45 + pierce * 12, Math.max(3, Math.floor(dmg * (0.25 + pierce * 0.08))), e);
          }

          if (defeated) this.onKill(e);
          break;
        }
      }
    }

    const now = performance.now() / 1000;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (this.combat.enemyTouchesPlayer(e, this.player)) this.combat.dealDamageToPlayer(this.player, e.damage, now);
    }

    for (const pk of this.pickups) {
      if (!pk.alive) continue;
      if (distance(this.player.pos, pk.pos) < this.player.radius + 15) {
        if (pk.type === "xp") this.xp.addXP(pk.value);
        else this.player.hp = Math.min(this.player.maxHp, this.player.hp + pk.value);
        pk.alive = false;
      }
    }

    if (this.xp.checkLevelUp()) {
      const oldMaxHp = this.player.maxHp;
      this.applyAllMods();
      if (this.player.maxHp > oldMaxHp) this.player.hp = Math.min(this.player.maxHp, this.player.hp + (this.player.maxHp - oldMaxHp));

      if (!this.selectedSchool) this.phase = "school_choice";
      else if (!this.selectedWeapon) { this.weaponPanel.setSchool(this.selectedSchool.id as SkillSchool); this.phase = "weapon_choice"; }
      else { this.upgradePanel.generateChoices(this.selectedSchool.id as SkillSchool, this.appliedSkillIds, this.selectedWeapon.id); this.phase = "upgrade"; }
    }

    this.camera.follow(this.player.pos.x, this.player.pos.y);
    this.camera.update();

    this.enemies = this.enemies.filter((e) => e.alive);
    if (this.enemies.length === 0) this.startNextWave();
    if (this.player.hp <= 0) this.phase = "result";
  }

  private onKill(enemy: Enemy): void {
    this.kills++;
    const xpValue = this.xp.xpPerKill;
    this.xp.addXP(xpValue);
    this.pickups.push(new Pickup(enemy.pos.x, enemy.pos.y, "xp", Math.max(8, Math.floor(xpValue * 0.55))));
    if (Math.random() < 0.12) this.pickups.push(new Pickup(enemy.pos.x + randRange(-18, 18), enemy.pos.y + randRange(-18, 18), "health", 18));

    if (this.hasSkill("bloodlust")) {
      const heal = Math.max(1, Math.floor(this.player.maxHp * 0.08 * this.skillCount("bloodlust")));
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
    }

    if (this.hasSkill("chain_lightning")) {
      const target = this.findNearestEnemy(enemy.pos.x, enemy.pos.y, 280);
      if (target) {
        const defeated = target.takeDamage(28 + this.skillCount("chain_lightning") * 12);
        if (defeated) this.onKill(target);
      }
    }
  }

  render(): void {
    const ctx = this.ctx;
    ctx.fillStyle = "#111118";
    ctx.fillRect(0, 0, this.w, this.h);

    if (this.phase === "menu") { this.racePanel.render(ctx, this.w, this.h); return; }
    if (this.phase === "school_choice") { this.schoolPanel.render(ctx, this.w, this.h); return; }
    if (this.phase === "weapon_choice") { this.weaponPanel.render(ctx, this.w, this.h); return; }
    if (this.phase === "upgrade") {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, 0, this.w, this.h);
      this.upgradePanel.render(ctx, this.w, this.h);
      return;
    }
    if (this.phase === "result") {
      ctx.fillStyle = "rgba(0,0,0,0.8)";
      ctx.fillRect(0, 0, this.w, this.h);
      ctx.fillStyle = "#ef5350";
      ctx.font = "bold 32px monospace";
      ctx.textAlign = "center";
      ctx.fillText("你战败了", this.w / 2, this.h / 2 - 20);
      ctx.fillStyle = "#ccc";
      ctx.font = "14px monospace";
      ctx.fillText(`击杀 ${this.kills}  ·  波次 ${this.waveNum}  ·  等级 ${this.xp.level}`, this.w / 2, this.h / 2 + 20);
      ctx.fillText("点击任意位置重新开始", this.w / 2, this.h / 2 + 44);
      return;
    }

    const toScreen = (wx: number, wy: number) => this.camera.worldToScreen(wx, wy, this.w, this.h);

    ctx.strokeStyle = "#1c1c28";
    ctx.lineWidth = 0.5;
    const gridSize = 60;
    const visLeft = this.camera.pos.x - this.w / 2;
    const visTop = this.camera.pos.y - this.h / 2;
    const sx = Math.floor(visLeft / gridSize) * gridSize;
    const sy = Math.floor(visTop / gridSize) * gridSize;
    for (let wx = sx; wx < visLeft + this.w + gridSize; wx += gridSize) {
      const p1 = toScreen(wx, visTop);
      const p2 = toScreen(wx, visTop + this.h + gridSize);
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    }
    for (let wy = sy; wy < visTop + this.h + gridSize; wy += gridSize) {
      const p1 = toScreen(visLeft, wy);
      const p2 = toScreen(visLeft + this.w + gridSize, wy);
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    }

    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    const tl = toScreen(0, 0);
    const br = toScreen(WORLD_W, WORLD_H);
    ctx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);

    for (const pk of this.pickups) { const sp = toScreen(pk.pos.x, pk.pos.y); pk.renderAt(ctx, sp.x, sp.y); }
    for (const p of this.projectiles) { const sp = toScreen(p.pos.x, p.pos.y); p.renderAt(ctx, sp.x, sp.y); }
    for (const e of this.enemies) { const sp = toScreen(e.pos.x, e.pos.y); e.renderAt(ctx, sp.x, sp.y); }

    const psp = toScreen(this.player.pos.x, this.player.pos.y);
    const color = this.selectedRace?.color ?? "#4fc3f7";
    this.player.renderAt(ctx, psp.x, psp.y, this.input.state.aimDir, color, this.selectedWeapon?.id);

    this.input.renderSticks(ctx);

    this.hud.render(ctx, {
      hp: this.player.hp, maxHp: this.player.maxHp,
      xp: this.xp.xp, xpToNext: this.xp.xpToNext, level: this.xp.level,
      wave: this.waveNum, kills: this.kills,
      raceName: this.selectedRace?.name,
      schoolName: this.selectedWeapon ? `${this.selectedSchool?.name} · ${this.selectedWeapon.name}` : this.selectedSchool?.name,
      schoolIcon: this.selectedWeapon?.icon ?? this.selectedSchool?.icon,
    });

    if (this.appliedSkills.length > 0) {
      ctx.textAlign = "left";
      ctx.font = "10px monospace";
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.fillText(this.appliedSkills.map((s) => s.name).join(" · "), 16, this.h - 16);
    }
  }
}
