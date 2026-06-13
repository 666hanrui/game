import { Player } from "../entities/Player";
import { Enemy } from "../entities/Enemy";
import { Projectile, ProjectileKind } from "../entities/Projectile";
import { Pickup } from "../entities/Pickup";
import { Input } from "./Input";
import { Camera } from "./Camera";
import { AssetLoader } from "./AssetLoader";
import { WaveSystem } from "../systems/WaveSystem";
import { CombatSystem } from "../systems/CombatSystem";
import { XPLevelSystem } from "../systems/XPLevelSystem";
import { GoalSystem, GoalStats } from "../systems/GoalSystem";
import { MetaProgress } from "../systems/MetaProgress";
import { HUD } from "../ui/HUD";
import { UpgradePanel, RacePanel, SchoolPanel, WeaponPanel } from "../ui/UpgradePanel";
import { MetaUpgradePanel } from "../ui/MetaUpgradePanel";
import { PausePanel } from "../ui/PausePanel";
import { Minimap } from "../ui/Minimap";
import { Race, RACES } from "../data/races";
import { School } from "../data/schools";
import { Skill, SkillSchool } from "../data/skills";
import { Weapon } from "../data/weapons";
import { distance, randRange, vec2, Vec2 } from "../utils/math";

export type GamePhase = "menu" | "meta_upgrade" | "playing" | "paused" | "upgrade" | "school_choice" | "weapon_choice" | "result";

const WORLD_W = 2400;
const WORLD_H = 2400;

interface Particle {
  pos: Vec2;
  vel: Vec2;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface FloatingText {
  pos: Vec2;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  input: Input;
  camera: Camera;
  assets: AssetLoader;

  w = 0;
  h = 0;

  player: Player;
  enemies: Enemy[] = [];
  projectiles: Projectile[] = [];
  pickups: Pickup[] = [];
  particles: Particle[] = [];
  floatingTexts: FloatingText[] = [];

  wave: WaveSystem;
  combat: CombatSystem;
  xp: XPLevelSystem;
  goals: GoalSystem;
  meta: MetaProgress;
  hud: HUD;

  upgradePanel: UpgradePanel;
  racePanel: RacePanel;
  schoolPanel: SchoolPanel;
  weaponPanel: WeaponPanel;
  metaPanel: MetaUpgradePanel;
  pausePanel: PausePanel;
  minimap: Minimap;

  phase: GamePhase = "menu";

  selectedRace: Race | null = null;
  selectedSchool: School | null = null;
  selectedWeapon: Weapon | null = null;
  appliedSkills: Skill[] = [];
  appliedSkillIds: string[] = [];

  kills = 0;
  waveNum = 0;
  bossKills = 0;
  shootTimer = 0;
  gameTime = 0;
  runSoulGained = 0;
  totalSoulCrystals = 0;

  private xpSpawnTimer = 0;
  private xpSpawnInterval = 3.0;
  private bannerText = "";
  private bannerTimer = 0;
  private resultSettled = false;
  private goalCompleteBannerShown = false;
  private menuMetaButton = { x: 0, y: 0, w: 138, h: 38 };
  private wasEscapeDown = false;

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
    this.camera.snap(cx, cy);
    this.assets = new AssetLoader();

    this.player = new Player(cx, cy);
    this.wave = new WaveSystem();
    this.combat = new CombatSystem();
    this.xp = new XPLevelSystem();
    this.goals = new GoalSystem();
    this.meta = new MetaProgress();
    this.totalSoulCrystals = this.meta.getSoulCrystals();
    this.hud = new HUD();
    this.upgradePanel = new UpgradePanel();
    this.racePanel = new RacePanel();
    this.schoolPanel = new SchoolPanel();
    this.weaponPanel = new WeaponPanel();
    this.metaPanel = new MetaUpgradePanel();
    this.pausePanel = new PausePanel();
    this.minimap = new Minimap();
  }

  resize(): void {
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    this.canvas.style.width = `${this.w}px`;
    this.canvas.style.height = `${this.h}px`;
    this.canvas.width = Math.floor(this.w * dpr);
    this.canvas.height = Math.floor(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
  }

  private onClick(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    if (this.phase === "result") { this.restart(); return; }

    if (this.phase === "paused") {
      const action = this.pausePanel.handleClick(cx, cy);
      if (action === "resume") this.phase = "playing";
      if (action === "main_menu") this.restart();
      if (action === "settle") {
        this.settleRun();
        this.phase = "result";
      }
      return;
    }

    if (this.phase === "meta_upgrade") {
      const action = this.metaPanel.handleClick(cx, cy, this.meta);
      this.totalSoulCrystals = this.meta.getSoulCrystals();
      if (action === "back") this.phase = "menu";
      if (action === "buy") {
        this.bannerText = "强化已更新";
        this.bannerTimer = 0.9;
      }
      return;
    }

    if (this.phase === "menu") {
      if (this.hitMetaButton(cx, cy)) {
        this.totalSoulCrystals = this.meta.getSoulCrystals();
        this.phase = "meta_upgrade";
        return;
      }
      const race = this.racePanel.handleClick(cx, cy);
      if (race) this.selectRace(race);
      return;
    }

    if (this.phase === "school_choice") { const school = this.schoolPanel.handleClick(cx, cy); if (school) this.selectSchool(school); return; }
    if (this.phase === "weapon_choice") { const weapon = this.weaponPanel.handleClick(cx, cy); if (weapon) this.selectWeapon(weapon); return; }
    if (this.phase === "upgrade") { const skill = this.upgradePanel.handleClick(cx, cy); if (skill) this.applySkill(skill); return; }
  }

  private hitMetaButton(cx: number, cy: number): boolean {
    const r = this.menuMetaButton;
    return cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h;
  }

  private restart(): void {
    const cx = WORLD_W / 2;
    const cy = WORLD_H / 2;

    this.player = new Player(cx, cy);
    this.camera = new Camera(WORLD_W, WORLD_H);
    this.camera.snap(cx, cy);
    this.enemies = [];
    this.projectiles = [];
    this.pickups = [];
    this.particles = [];
    this.floatingTexts = [];
    this.selectedRace = null;
    this.selectedSchool = null;
    this.selectedWeapon = null;
    this.appliedSkills = [];
    this.appliedSkillIds = [];
    this.kills = 0;
    this.waveNum = 0;
    this.bossKills = 0;
    this.shootTimer = 0;
    this.gameTime = 0;
    this.runSoulGained = 0;
    this.totalSoulCrystals = this.meta.getSoulCrystals();
    this.xpSpawnTimer = 0;
    this.bannerText = "";
    this.bannerTimer = 0;
    this.resultSettled = false;
    this.goalCompleteBannerShown = false;
    this.wasEscapeDown = false;
    this.xp.reset();
    this.phase = "menu";
  }

  private selectRace(race: Race): void {
    this.selectedRace = race;
    this.applyAllMods();
    this.player.hp = this.player.maxHp;
    this.camera.snap(this.player.pos.x, this.player.pos.y);
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
    this.bannerText = `${weapon.name} 已就绪`;
    this.bannerTimer = 1.4;
    this.phase = "upgrade";
  }

  private applySkill(skill: Skill): void {
    this.appliedSkills.push(skill);
    this.appliedSkillIds.push(skill.id);
    this.applyAllMods();
    this.addText(this.player.pos.x, this.player.pos.y - 34, `获得：${skill.name}`, "#ffeb3b", 1.1);
    this.spawnParticles(this.player.pos.x, this.player.pos.y, "#ffeb3b", 18, 4, 210);
    this.phase = "playing";
  }

  private hasSkill(id: string): boolean {
    return this.appliedSkillIds.includes(id);
  }

  private skillCount(id: string): number {
    return this.appliedSkillIds.filter((skillId) => skillId === id).length;
  }

  private goalStats(): GoalStats {
    return { wave: this.waveNum, kills: this.kills, bossKills: this.bossKills };
  }

  private pauseStats() {
    return {
      wave: this.waveNum,
      kills: this.kills,
      level: this.xp.level,
      bossKills: this.bossKills,
      raceName: this.selectedRace?.name,
      schoolName: this.selectedSchool?.name,
      weaponName: this.selectedWeapon?.name,
    };
  }

  private settleRun(): void {
    if (this.resultSettled) return;
    const goalList = this.goals.getGoals(this.goalStats());
    const reward = this.meta.settleRun({
      wave: this.waveNum,
      kills: this.kills,
      level: this.xp.level,
      bossKills: this.bossKills,
      goalsCompleted: goalList.filter((g) => g.done).length,
    });
    this.runSoulGained = reward.gained;
    this.totalSoulCrystals = reward.total;
    this.resultSettled = true;
  }

  private addText(x: number, y: number, text: string, color: string, life = 0.75): void {
    this.floatingTexts.push({ pos: vec2(x, y), text, color, life, maxLife: life });
  }

  private spawnParticles(x: number, y: number, color: string, count = 10, size = 3, force = 140): void {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = randRange(force * 0.2, force);
      const life = randRange(0.22, 0.55);
      this.particles.push({
        pos: vec2(x, y),
        vel: vec2(Math.cos(a) * speed, Math.sin(a) * speed),
        life,
        maxLife: life,
        size: randRange(size * 0.55, size * 1.3),
        color,
      });
    }
  }

  private updateFeedback(dt: number): void {
    for (const p of this.particles) {
      p.life -= dt;
      p.pos.x += p.vel.x * dt;
      p.pos.y += p.vel.y * dt;
      p.vel.x *= 0.9;
      p.vel.y *= 0.9;
    }
    this.particles = this.particles.filter((p) => p.life > 0);

    for (const t of this.floatingTexts) {
      t.life -= dt;
      t.pos.y -= 34 * dt;
    }
    this.floatingTexts = this.floatingTexts.filter((t) => t.life > 0);
    if (this.bannerTimer > 0) this.bannerTimer -= dt;
  }

  private updatePauseToggle(): void {
    const esc = this.input.isKeyDown("escape");
    if (esc && !this.wasEscapeDown) {
      if (this.phase === "playing") this.phase = "paused";
      else if (this.phase === "paused") this.phase = "playing";
    }
    this.wasEscapeDown = esc;
  }

  private applyAllMods(): void {
    const race = this.selectedRace ?? RACES[0];
    const meta = this.meta.getBonuses();
    const raceLevel = Math.max(0, this.xp.level - 1);

    let hp = Math.floor((100 + race.hpGrowth * raceLevel) * race.hpMod) + meta.maxHp;
    let spd = Math.floor((260 + race.speedGrowth * raceLevel) * race.spdMod) + meta.speed;
    let dmg = Math.floor((25 + race.dmgGrowth * raceLevel) * race.dmgMod) + meta.damage;
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
    this.xp.xpPerKill = Math.floor(20 * race.xpMod * meta.xpMultiplier);
  }

  startNextWave(): void {
    this.waveNum++;
    const hpMult = this.wave.getHPMultiplier(this.waveNum);
    const spdMult = this.wave.getSpeedMultiplier(this.waveNum);
    const roles = this.wave.getRolesForWave(this.waveNum);
    for (const role of roles) this.enemies.push(new Enemy(WORLD_W, WORLD_H, hpMult, spdMult, role));
    if (this.wave.isBossWave(this.waveNum)) {
      this.bannerText = `Boss 来袭 · 第 ${this.waveNum} 波`;
      this.bannerTimer = 2.2;
    } else {
      this.addText(this.player.pos.x, this.player.pos.y - 52, `第 ${this.waveNum} 波`, "#90caf9", 1.1);
    }
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
    const swarm = this.skillCount("drone_swarm");
    if (count <= 0) return;
    const interval = Math.max(0.18, 1.15 - count * 0.14 - swarm * 0.07);
    const tick = Math.floor(this.gameTime / interval);
    const prev = Math.floor((this.gameTime - dt) / interval);
    if (tick === prev) return;

    for (let i = 0; i < count; i++) {
      const target = this.findNearestEnemy(this.player.pos.x, this.player.pos.y, 760);
      if (!target) break;
      const dx = target.pos.x - this.player.pos.x;
      const dy = target.pos.y - this.player.pos.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      this.projectiles.push(new Projectile(this.player.pos.x, this.player.pos.y, (dx / len) * 620, (dy / len) * 620, false, 12 + count * 5 + swarm * 4, "drone"));
    }
  }

  private updateEnemyShots(): void {
    for (const enemy of this.enemies) {
      if (!enemy.alive || !enemy.canShoot()) continue;
      const dx = this.player.pos.x - enemy.pos.x;
      const dy = this.player.pos.y - enemy.pos.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const speed = enemy.role === "boss" ? 330 : 280;
      const damage = enemy.role === "boss" ? 18 : 10;
      const kind: ProjectileKind = enemy.role === "boss" ? "heavy_magic" : "energy";

      this.projectiles.push(new Projectile(enemy.pos.x, enemy.pos.y, (dx / len) * speed, (dy / len) * speed, true, damage, kind));
      if (enemy.role === "boss") {
        for (const offset of [-0.28, 0.28]) {
          const cos = Math.cos(offset);
          const sin = Math.sin(offset);
          const x = (dx / len) * cos - (dy / len) * sin;
          const y = (dx / len) * sin + (dy / len) * cos;
          this.projectiles.push(new Projectile(enemy.pos.x, enemy.pos.y, x * speed, y * speed, true, 12, "energy"));
        }
      }
    }
  }

  private explodeAt(x: number, y: number, radius: number, damage: number, exclude: Enemy): void {
    for (const e of this.enemies) {
      if (!e.alive || e === exclude) continue;
      if (distance(vec2(x, y), e.pos) > radius) continue;
      const defeated = e.takeDamage(damage);
      this.addText(e.pos.x, e.pos.y - e.radius, `-${damage}`, "#ffb74d");
      this.spawnParticles(e.pos.x, e.pos.y, "#ff7043", 5, 2.5, 120);
      if (defeated) this.onKill(e);
    }
  }

  update(dt: number): void {
    this.updatePauseToggle();

    if (this.phase === "paused") return;
    this.updateFeedback(dt);
    if (this.phase === "menu" || this.phase === "meta_upgrade" || this.phase === "school_choice" || this.phase === "weapon_choice") return;

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
    this.updateEnemyShots();
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
          this.addText(e.pos.x, e.pos.y - e.radius, `${isCrit ? "暴击 " : ""}-${dmg}`, isCrit ? "#ffeb3b" : "#fff");
          this.spawnParticles(e.pos.x, e.pos.y, isCrit ? "#ffeb3b" : "#fff9c4", isCrit ? 12 : 7, isCrit ? 4 : 2.5, isCrit ? 180 : 110);

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
    for (const p of this.projectiles) {
      if (!p.alive || !p.fromEnemy) continue;
      if (distance(p.pos, this.player.pos) < this.player.radius + p.hitRadius) {
        this.combat.dealDamageToPlayer(this.player, p.damage, now);
        this.addText(this.player.pos.x, this.player.pos.y - 28, `-${p.damage}`, "#ef5350");
        this.spawnParticles(this.player.pos.x, this.player.pos.y, "#ef5350", 8, 3, 120);
        p.alive = false;
      }
    }

    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (this.combat.enemyTouchesPlayer(e, this.player)) {
        const before = this.player.hp;
        this.combat.dealDamageToPlayer(this.player, e.damage, now);
        if (this.player.hp < before) {
          this.addText(this.player.pos.x, this.player.pos.y - 28, `-${e.damage}`, "#ef5350");
          this.spawnParticles(this.player.pos.x, this.player.pos.y, "#ef5350", 10, 3, 140);
        }
      }
    }

    for (const pk of this.pickups) {
      if (!pk.alive) continue;
      if (distance(this.player.pos, pk.pos) < this.player.radius + 15) {
        if (pk.type === "xp") {
          this.xp.addXP(pk.value);
          this.addText(pk.pos.x, pk.pos.y - 12, `+${pk.value} XP`, "#42a5f5");
        } else {
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + pk.value);
          this.addText(pk.pos.x, pk.pos.y - 12, `+${pk.value} HP`, "#66bb6a");
        }
        pk.alive = false;
      }
    }

    if (this.xp.checkLevelUp()) {
      const oldMaxHp = this.player.maxHp;
      this.applyAllMods();
      if (this.player.maxHp > oldMaxHp) this.player.hp = Math.min(this.player.maxHp, this.player.hp + (this.player.maxHp - oldMaxHp));
      this.addText(this.player.pos.x, this.player.pos.y - 48, `升级 Lv.${this.xp.level}`, "#ffeb3b", 1.2);
      this.spawnParticles(this.player.pos.x, this.player.pos.y, "#ffeb3b", 28, 4, 240);

      if (!this.selectedSchool) this.phase = "school_choice";
      else if (!this.selectedWeapon) { this.weaponPanel.setSchool(this.selectedSchool.id as SkillSchool); this.phase = "weapon_choice"; }
      else { this.upgradePanel.generateChoices(this.selectedSchool.id as SkillSchool, this.appliedSkillIds, this.selectedWeapon.id); this.phase = "upgrade"; }
    }

    if (this.goals.allDone(this.goalStats()) && !this.goalCompleteBannerShown) {
      this.bannerText = "本局目标全部完成！";
      this.bannerTimer = 2.0;
      this.goalCompleteBannerShown = true;
    }

    this.camera.follow(this.player.pos.x, this.player.pos.y);
    this.camera.update();

    this.enemies = this.enemies.filter((e) => e.alive);
    if (this.enemies.length === 0) this.startNextWave();
    if (this.player.hp <= 0) {
      this.settleRun();
      this.phase = "result";
    }
  }

  private onKill(enemy: Enemy): void {
    this.kills++;
    if (enemy.role === "boss") this.bossKills++;

    const reward = enemy.rewardMultiplier;
    const xpValue = Math.floor(this.xp.xpPerKill * reward);
    this.xp.addXP(xpValue);
    this.addText(enemy.pos.x, enemy.pos.y - enemy.radius - 16, `+${xpValue} XP`, "#42a5f5");
    this.spawnParticles(enemy.pos.x, enemy.pos.y, enemy.role === "boss" ? "#ffd54f" : enemy.role === "elite" ? "#ef5350" : "#81c784", enemy.role === "boss" ? 45 : enemy.role === "elite" ? 26 : 14, enemy.role === "boss" ? 6 : 4, enemy.role === "boss" ? 320 : 210);
    this.pickups.push(new Pickup(enemy.pos.x, enemy.pos.y, "xp", Math.max(8, Math.floor(xpValue * 0.55)));

    const healChance = enemy.role === "boss" ? 1 : enemy.role === "elite" ? 0.55 : 0.12;
    if (Math.random() < healChance) this.pickups.push(new Pickup(enemy.pos.x + randRange(-18, 18), enemy.pos.y + randRange(-18, 18), "health", enemy.role === "boss" ? 55 : 18));

    if (enemy.role === "boss") {
      this.bannerText = "Boss 已击败！";
      this.bannerTimer = 2.0;
    }

    if (this.hasSkill("bloodlust")) {
      const heal = Math.max(1, Math.floor(this.player.maxHp * 0.08 * this.skillCount("bloodlust")));
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
      this.addText(this.player.pos.x, this.player.pos.y - 32, `嗜血 +${heal}`, "#66bb6a");
    }

    if (this.hasSkill("chain_lightning")) {
      const target = this.findNearestEnemy(enemy.pos.x, enemy.pos.y, 280);
      if (target) {
        const damage = 28 + this.skillCount("chain_lightning") * 12;
        const defeated = target.takeDamage(damage);
        this.addText(target.pos.x, target.pos.y - target.radius, `⚡-${damage}`, "#ce93d8");
        this.spawnParticles(target.pos.x, target.pos.y, "#ce93d8", 12, 3, 190);
        if (defeated) this.onKill(target);
      }
    }
  }

  render(): void {
    const ctx = this.ctx;
    ctx.fillStyle = "#111118";
    ctx.fillRect(0, 0, this.w, this.h);

    if (this.phase === "menu") {
      this.totalSoulCrystals = this.meta.getSoulCrystals();
      this.racePanel.render(ctx, this.w, this.h, this.assets);
      this.renderMetaButton();
      this.renderScreenFeedback();
      return;
    }
    if (this.phase === "meta_upgrade") {
      this.metaPanel.render(ctx, this.w, this.h, this.meta);
      this.renderScreenFeedback();
      return;
    }
    if (this.phase === "school_choice") { this.schoolPanel.render(ctx, this.w, this.h); return; }
    if (this.phase === "weapon_choice") { this.weaponPanel.render(ctx, this.w, this.h, this.assets); return; }
    if (this.phase === "upgrade") {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, 0, this.w, this.h);
      this.upgradePanel.render(ctx, this.w, this.h, this.assets);
      this.renderScreenFeedback();
      return;
    }
    if (this.phase === "result") {
      ctx.fillStyle = "rgba(0,0,0,0.8)";
      ctx.fillRect(0, 0, this.w, this.h);
      ctx.fillStyle = "#ef5350";
      ctx.font = "bold 32px monospace";
      ctx.textAlign = "center";
      ctx.fillText("你战败了", this.w / 2, this.h / 2 - 72);
      ctx.fillStyle = "#ccc";
      ctx.font = "14px monospace";
      ctx.fillText(`击杀 ${this.kills}  ·  波次 ${this.waveNum}  ·  等级 ${this.xp.level}  ·  Boss ${this.bossKills}`, this.w / 2, this.h / 2 - 34);

      const goalList = this.goals.getGoals(this.goalStats());
      const doneCount = goalList.filter((g) => g.done).length;
      ctx.fillStyle = "#ffeb3b";
      ctx.font = "bold 18px monospace";
      ctx.fillText(`本局获得魂晶 +${this.runSoulGained}`, this.w / 2, this.h / 2 + 4);
      ctx.fillStyle = "#ce93d8";
      ctx.font = "14px monospace";
      ctx.fillText(`魂晶总数 ${this.totalSoulCrystals}  ·  目标完成 ${doneCount}/${goalList.length}`, this.w / 2, this.h / 2 + 30);

      ctx.fillStyle = "rgba(255,255,255,0.42)";
      ctx.font = "12px monospace";
      ctx.fillText("魂晶已保存到本地，可在主菜单进入局外强化", this.w / 2, this.h / 2 + 58);
      ctx.fillText("点击任意位置重新开始", this.w / 2, this.h / 2 + 84);
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

    for (const pk of this.pickups) {
      const sp = toScreen(pk.pos.x, pk.pos.y);
      pk.renderAt(ctx, sp.x, sp.y, this.assets.get("pickups", pk.type));
    }
    for (const p of this.projectiles) {
      const sp = toScreen(p.pos.x, p.pos.y);
      p.renderAt(ctx, sp.x, sp.y, this.assets.get("projectiles", p.kind));
    }
    for (const e of this.enemies) {
      const sp = toScreen(e.pos.x, e.pos.y);
      e.renderAt(ctx, sp.x, sp.y, this.assets.get("enemies", e.assetId));
    }

    for (const fx of this.particles) {
      const sp = toScreen(fx.pos.x, fx.pos.y);
      const alpha = Math.max(0, fx.life / fx.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = fx.color;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, fx.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (const text of this.floatingTexts) {
      const sp = toScreen(text.pos.x, text.pos.y);
      const alpha = Math.max(0, text.life / text.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = text.color;
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.fillText(text.text, sp.x, sp.y);
    }
    ctx.globalAlpha = 1;

    const psp = toScreen(this.player.pos.x, this.player.pos.y);
    const color = this.selectedRace?.color ?? "#4fc3f7";
    this.player.renderAt(
      ctx,
      psp.x,
      psp.y,
      this.input.state.aimDir,
      color,
      this.selectedWeapon?.id,
      this.assets.get("races", this.selectedRace?.id),
      this.assets.get("weapons", this.selectedWeapon?.id),
    );

    this.input.renderSticks(ctx);

    this.hud.render(ctx, {
      hp: this.player.hp, maxHp: this.player.maxHp,
      xp: this.xp.xp, xpToNext: this.xp.xpToNext, level: this.xp.level,
      wave: this.waveNum, kills: this.kills,
      raceName: this.selectedRace?.name,
      schoolName: this.selectedWeapon ? `${this.selectedSchool?.name} · ${this.selectedWeapon.name}` : this.selectedSchool?.name,
      schoolIcon: this.selectedWeapon?.icon ?? this.selectedSchool?.icon,
      goals: this.goals.getGoals(this.goalStats()),
      soulCrystals: this.totalSoulCrystals,
    });

    this.minimap.render(ctx, {
      worldW: WORLD_W,
      worldH: WORLD_H,
      screenW: this.w,
      screenH: this.h,
      cameraPos: this.camera.pos,
      playerPos: this.player.pos,
      enemies: this.enemies,
      pickups: this.pickups,
    });
    this.minimap.renderBoundaryWarning(ctx, this.player.pos, WORLD_W, WORLD_H);

    if (this.appliedSkills.length > 0) {
      ctx.textAlign = "left";
      ctx.font = "10px monospace";
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.fillText(this.appliedSkills.map((s) => s.name).join(" · "), 16, this.h - 16);
    }
  }

  private renderMetaButton(): void {
    const x = this.w - 158;
    const y = 18;
    this.menuMetaButton = { x, y, w: 138, h: 38 };
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(206,147,216,0.16)";
    ctx.strokeStyle = "#ce93d8";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(x, y, 138, 38, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#e1bee7";
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`局外强化 ${this.totalSoulCrystals}`, x + 69, y + 24);
  }

  private renderScreenFeedback(): void {
    const ctx = this.ctx;
    if (this.bannerTimer > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, this.bannerTimer);
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.strokeStyle = "rgba(255,235,59,0.65)";
      ctx.lineWidth = 1;
      const w = Math.min(520, this.w - 80);
      const x = (this.w - w) / 2;
      const y = 24;
      ctx.beginPath();
      ctx.roundRect(x, y, w, 42, 12);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ffeb3b";
      ctx.font = "bold 18px monospace";
      ctx.textAlign = "center";
      ctx.fillText(this.bannerText, this.w / 2, y + 27);
      ctx.restore();
    }
  }
}
