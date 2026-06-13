import type { GameWithSound } from "../core/GameWithSound";
import { Projectile } from "../entities/Projectile";
import { getRunItem } from "../data/runItems";
import type { RunItemDef } from "../data/runItems";
import type {
  ConstructId,
  FloatingSupplyText,
  RuntimeConstruct,
  RuntimeEffect,
  RuntimeSupplyDrop,
  RuntimeSupplyId,
} from "./runSupplyTypes";
import {
  getSupplyColor,
  getSupplyLabel,
  pickBossBonusSupplyId,
  pickRuntimeSupplyId,
  RUN_SUPPLY_WORLD,
  shouldClearRunSupplyOnPhase,
} from "./runSupplyConfig";

export class RunSupplyRuntime {
  private drops: RuntimeSupplyDrop[] = [];
  private effects: RuntimeEffect[] = [];
  private constructs: RuntimeConstruct[] = [];
  private floatingTexts: FloatingSupplyText[] = [];
  private spawnTimer = 5.5;
  private lastKills = 0;
  private lastBossKills = 0;
  private hpBeforeUpdate = 0;
  private shieldCharges = 0;
  private regenHealBank = 0;
  private appliedDamageMult = 1;
  private appliedCooldownMult = 1;
  private appliedCritChanceBonus = 0;
  private appliedCritMultiplierBonus = 0;

  constructor(private game: GameWithSound) {}

  beforeGameUpdate(): void {
    this.hpBeforeUpdate = this.game.player.hp;
    this.removeTemporaryStatMods();
  }

  afterGameUpdate(dt: number): void {
    if (this.game.phase !== "playing") {
      if (this.shouldClearOnPhase()) this.clearRuntimeOnlyEffects();
      return;
    }

    this.blockDamageWithShield();
    this.updateTimers(dt);
    this.updateSpawning(dt);
    this.updateDrops(dt);
    this.updatePickupCollision();
    this.updateConstructs(dt);
    this.applyOngoingEffects(dt);
    this.applyTemporaryStatMods();
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.game.phase !== "playing") return;
    this.renderDrops(ctx);
    this.renderConstructs(ctx);
    this.renderPlayerAuras(ctx);
    this.renderEffectBar(ctx);
    this.renderFloatingTexts(ctx);
  }

  private shouldClearOnPhase(): boolean {
    return shouldClearRunSupplyOnPhase(this.game.phase);
  }

  private updateTimers(dt: number): void {
    for (const effect of this.effects) effect.remaining -= dt;
    this.effects = this.effects.filter((effect) => effect.remaining > 0);
    if (this.shieldCharges > 0 && !this.hasEffect("shield")) this.shieldCharges = 0;

    for (const t of this.floatingTexts) {
      t.life -= dt;
      t.y -= 24 * dt;
    }
    this.floatingTexts = this.floatingTexts.filter((t) => t.life > 0);
  }

  private updateSpawning(dt: number): void {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnNearPlayer(this.pickSpawnId(), 180, 520);
      this.spawnTimer = Math.max(3.0, 8.2 - this.game.waveNum * 0.18);
    }

    if (this.game.kills > this.lastKills) {
      const diff = this.game.kills - this.lastKills;
      for (let i = 0; i < diff; i++) {
        const chance = this.game.waveNum >= 6 ? 0.054 : 0.034;
        if (Math.random() < chance) this.spawnNearPlayer(this.pickSpawnId(), 120, 420);
      }
      this.lastKills = this.game.kills;
    }

    if (this.game.bossKills > this.lastBossKills) {
      this.spawnNearPlayer("shield", 80, 220);
      this.spawnNearPlayer(pickBossBonusSupplyId(), 100, 260);
      this.spawnNearPlayer(Math.random() < 0.55 ? "health_pack" : "regen_dew", 110, 280);
      this.spawnNearPlayer(Math.random() < 0.5 ? "turret_pack" : "decoy_doll", 120, 320);
      this.lastBossKills = this.game.bossKills;
    }
  }

  private updateDrops(dt: number): void {
    for (const drop of this.drops) drop.age += dt;
    this.drops = this.drops.filter((drop) => drop.age < drop.life);

    if (this.hasEffect("magnet")) this.pullAllPickups(dt, 760, 820);
  }

  private updatePickupCollision(): void {
    for (const drop of this.drops) {
      const dx = drop.x - this.game.player.pos.x;
      const dy = drop.y - this.game.player.pos.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > this.game.player.radius + 18) continue;
      this.activate(drop.id);
      drop.age = drop.life + 1;
    }
    this.drops = this.drops.filter((drop) => drop.age < drop.life);
  }

  private updateConstructs(dt: number): void {
    for (const construct of this.constructs) {
      construct.age += dt;
      if (construct.id === "decoy_doll") this.updateDecoy(construct, dt);
      if (construct.id === "turret_pack") this.updateTurret(construct, dt);
    }
    this.constructs = this.constructs.filter((construct) => construct.age < construct.life);
  }

  private updateDecoy(decoy: RuntimeConstruct, dt: number): void {
    const radius = 360;
    for (const enemy of this.game.enemies) {
      if (!enemy.alive) continue;
      const dx = decoy.x - enemy.pos.x;
      const dy = decoy.y - enemy.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      if (dist > radius) continue;

      const pull = (1 - dist / radius) * 145;
      enemy.pos.x += (dx / dist) * pull * dt;
      enemy.pos.y += (dy / dist) * pull * dt;
      if (dist < 92) enemy.applySlow(0.72, 0.22);
    }
  }

  private updateTurret(turret: RuntimeConstruct, dt: number): void {
    turret.fireTimer -= dt;
    if (turret.fireTimer > 0) return;

    const target = this.findNearestEnemy(turret.x, turret.y, 620);
    if (!target) {
      turret.fireTimer = 0.22;
      return;
    }

    const dx = target.pos.x - turret.x;
    const dy = target.pos.y - turret.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const speed = 700;
    const damage = 18 + Math.floor(this.game.waveNum * 1.2);
    this.game.projectiles.push(new Projectile(turret.x, turret.y, (dx / len) * speed, (dy / len) * speed, false, damage, "energy"));
    this.game.particles.push(...this.makeBurst(turret.x, turret.y, getSupplyColor("turret_pack"), 4, 2.4, 95));
    turret.fireTimer = Math.max(0.28, 0.62 - Math.min(0.22, this.game.waveNum * 0.006));
  }

  private activate(id: RuntimeSupplyId): void {
    const item = this.getItem(id);
    const label = item?.name ?? getSupplyLabel(id);
    const color = item?.color ?? getSupplyColor(id);

    if (id === "magnet") {
      this.addOrRefreshEffect(id, label, color, 8);
      this.floatText(this.game.player.pos.x, this.game.player.pos.y - 42, "磁铁启动", color);
      return;
    }

    if (id === "shield") {
      this.shieldCharges = Math.min(3, this.shieldCharges + 1);
      this.addOrRefreshEffect(id, `护盾 x${this.shieldCharges}`, color, 12);
      this.floatText(this.game.player.pos.x, this.game.player.pos.y - 42, `获得护盾 x${this.shieldCharges}`, color);
      return;
    }

    if (id === "haste_potion") {
      this.addOrRefreshEffect(id, label, color, 6);
      this.floatText(this.game.player.pos.x, this.game.player.pos.y - 42, "攻速提升", color);
      return;
    }

    if (id === "power_potion") {
      this.addOrRefreshEffect(id, label, color, 6);
      this.floatText(this.game.player.pos.x, this.game.player.pos.y - 42, "攻击提升", color);
      return;
    }

    if (id === "health_pack") {
      const heal = Math.max(18, Math.floor(this.game.player.maxHp * 0.24));
      this.game.player.hp = Math.min(this.game.player.maxHp, this.game.player.hp + heal);
      this.floatText(this.game.player.pos.x, this.game.player.pos.y - 42, `+${heal} HP`, color);
      this.game.particles.push(...this.makeBurst(this.game.player.pos.x, this.game.player.pos.y, color, 12, 3.4, 135));
      return;
    }

    if (id === "regen_dew") {
      this.regenHealBank = 0;
      this.addOrRefreshEffect(id, label, color, 7);
      this.floatText(this.game.player.pos.x, this.game.player.pos.y - 42, "持续回春", color);
      return;
    }

    if (id === "crit_potion") {
      this.addOrRefreshEffect(id, label, color, 7);
      this.floatText(this.game.player.pos.x, this.game.player.pos.y - 42, "暴击提升", color);
      return;
    }

    if (id === "frost_bomb") {
      this.triggerFrostBomb(color);
      return;
    }

    if (id === "thunder_stone") {
      this.triggerThunderStone(color);
      return;
    }

    if (id === "quake_stone") {
      this.triggerQuakeStone(color);
      return;
    }

    if (id === "decoy_doll") {
      this.spawnConstruct("decoy_doll", color, "诱饵部署", 7.5);
      return;
    }

    if (id === "turret_pack") {
      this.spawnConstruct("turret_pack", color, "炮台部署", 12);
    }
  }

  private blockDamageWithShield(): void {
    if (this.shieldCharges <= 0) return;
    if (this.game.player.hp >= this.hpBeforeUpdate) return;

    this.game.player.hp = this.hpBeforeUpdate;
    this.shieldCharges--;
    if (this.shieldCharges <= 0) this.effects = this.effects.filter((effect) => effect.id !== "shield");
    else this.addOrRefreshEffect("shield", `护盾 x${this.shieldCharges}`, getSupplyColor("shield"), 8);

    this.floatText(this.game.player.pos.x, this.game.player.pos.y - 46, "护盾抵挡", getSupplyColor("shield"));
    this.game.particles.push(...this.makeBurst(this.game.player.pos.x, this.game.player.pos.y, getSupplyColor("shield"), 16, 4, 170));

    if (this.game.phase === "result" && this.game.player.hp > 0) this.game.phase = "playing";
  }

  private pullAllPickups(dt: number, radius: number, speed: number): void {
    for (const pk of this.game.pickups) {
      if (!pk.alive) continue;
      const dx = this.game.player.pos.x - pk.pos.x;
      const dy = this.game.player.pos.y - pk.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      if (dist > radius) continue;
      const force = Math.min(speed, 220 + (radius - dist) * 1.35);
      pk.pos.x += (dx / dist) * force * dt;
      pk.pos.y += (dy / dist) * force * dt;
    }
  }

  private applyOngoingEffects(dt: number): void {
    if (!this.hasEffect("regen_dew")) return;
    const healPerSecond = Math.max(5, this.game.player.maxHp * 0.055);
    this.regenHealBank += healPerSecond * dt;
    const heal = Math.floor(this.regenHealBank);
    if (heal <= 0) return;
    this.regenHealBank -= heal;
    this.game.player.hp = Math.min(this.game.player.maxHp, this.game.player.hp + heal);
  }

  private triggerFrostBomb(color: string): void {
    const radius = 250 + Math.min(90, this.game.waveNum * 4);
    let affected = 0;
    for (const enemy of this.game.enemies) {
      if (!enemy.alive) continue;
      const dx = enemy.pos.x - this.game.player.pos.x;
      const dy = enemy.pos.y - this.game.player.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > radius + enemy.radius) continue;
      enemy.applySlow(0.12, 2.2);
      affected++;
    }

    this.game.particles.push(...this.makeBurst(this.game.player.pos.x, this.game.player.pos.y, color, 34, 4.5, 260));
    this.floatText(this.game.player.pos.x, this.game.player.pos.y - 46, `冰霜爆发 ${affected}`, color);
  }

  private triggerThunderStone(color: string): void {
    const targets = this.getNearestEnemies(this.game.player.pos.x, this.game.player.pos.y, 720, 8);
    const damage = 24 + Math.floor(this.game.waveNum * 1.35);
    const speed = 860;

    for (const target of targets) {
      const dx = target.pos.x - this.game.player.pos.x;
      const dy = target.pos.y - this.game.player.pos.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      this.game.projectiles.push(new Projectile(this.game.player.pos.x, this.game.player.pos.y, (dx / len) * speed, (dy / len) * speed, false, damage, "energy"));
      this.game.particles.push(...this.makeBurst(target.pos.x, target.pos.y, color, 4, 2.2, 110));
    }

    this.game.particles.push(...this.makeBurst(this.game.player.pos.x, this.game.player.pos.y, color, 24, 3.4, 230));
    this.floatText(this.game.player.pos.x, this.game.player.pos.y - 46, `雷击锁定 ${targets.length}`, color);
  }

  private triggerQuakeStone(color: string): void {
    const radius = 235 + Math.min(85, this.game.waveNum * 3.2);
    const breakAmount = 7 + Math.floor(this.game.waveNum * 0.8);
    const projectileCount = 12;
    let affected = 0;

    for (const enemy of this.game.enemies) {
      if (!enemy.alive) continue;
      const dx = enemy.pos.x - this.game.player.pos.x;
      const dy = enemy.pos.y - this.game.player.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      if (dist > radius + enemy.radius) continue;

      enemy.breakArmor(breakAmount);
      enemy.applySlow(0.62, 0.9);
      const push = 80 * (1 - Math.min(1, dist / radius));
      enemy.pos.x += (dx / dist) * push;
      enemy.pos.y += (dy / dist) * push;
      affected++;
    }

    for (let i = 0; i < projectileCount; i++) {
      const angle = (i / projectileCount) * Math.PI * 2;
      this.game.projectiles.push(new Projectile(this.game.player.pos.x, this.game.player.pos.y, Math.cos(angle) * 360, Math.sin(angle) * 360, false, 8 + Math.floor(this.game.waveNum * 0.4), "hammer"));
    }

    this.game.particles.push(...this.makeBurst(this.game.player.pos.x, this.game.player.pos.y, color, 32, 5, 260));
    this.floatText(this.game.player.pos.x, this.game.player.pos.y - 46, `地裂破甲 ${affected}`, color);
  }

  private spawnConstruct(id: ConstructId, color: string, text: string, life: number): void {
    const angle = Math.random() * Math.PI * 2;
    const dist = 46 + Math.random() * 34;
    const x = this.clamp(this.game.player.pos.x + Math.cos(angle) * dist, 45, RUN_SUPPLY_WORLD.width - 45);
    const y = this.clamp(this.game.player.pos.y + Math.sin(angle) * dist, 45, RUN_SUPPLY_WORLD.height - 45);
    this.constructs.push({ id, x, y, age: 0, life, fireTimer: 0.15, seed: Math.random() * 1000 });
    this.floatText(x, y - 32, text, color);
    this.game.particles.push(...this.makeBurst(x, y, color, 18, 3.2, 150));
  }

  private addOrRefreshEffect(id: RuntimeSupplyId, label: string, color: string, duration: number): void {
    const existing = this.effects.find((effect) => effect.id === id);
    if (existing) {
      existing.label = label;
      existing.remaining = Math.max(existing.remaining, duration);
      existing.duration = Math.max(existing.duration, duration);
      return;
    }
    this.effects.push({ id, label, color, duration, remaining: duration });
  }

  private applyTemporaryStatMods(): void {
    let damageMult = 1;
    let cooldownMult = 1;
    let critChanceBonus = 0;
    let critMultiplierBonus = 0;

    if (this.hasEffect("power_potion")) damageMult *= 1.42;
    if (this.hasEffect("haste_potion")) cooldownMult *= 0.58;
    if (this.hasEffect("crit_potion")) {
      critChanceBonus += 0.22;
      critMultiplierBonus += 0.65;
    }

    if (damageMult !== 1) this.game.player.damage = Math.max(1, Math.floor(this.game.player.damage * damageMult));
    if (cooldownMult !== 1) this.game.player.attackCooldown = Math.max(0.05, this.game.player.attackCooldown * cooldownMult);
    if (critChanceBonus !== 0) this.game.player.critChance += critChanceBonus;
    if (critMultiplierBonus !== 0) this.game.player.critMultiplier += critMultiplierBonus;

    this.appliedDamageMult = damageMult;
    this.appliedCooldownMult = cooldownMult;
    this.appliedCritChanceBonus = critChanceBonus;
    this.appliedCritMultiplierBonus = critMultiplierBonus;
  }

  private removeTemporaryStatMods(): void {
    if (this.appliedDamageMult !== 1) {
      this.game.player.damage = Math.max(1, Math.round(this.game.player.damage / this.appliedDamageMult));
      this.appliedDamageMult = 1;
    }
    if (this.appliedCooldownMult !== 1) {
      this.game.player.attackCooldown = Math.max(0.05, this.game.player.attackCooldown / this.appliedCooldownMult);
      this.appliedCooldownMult = 1;
    }
    if (this.appliedCritChanceBonus !== 0) {
      this.game.player.critChance = Math.max(0, this.game.player.critChance - this.appliedCritChanceBonus);
      this.appliedCritChanceBonus = 0;
    }
    if (this.appliedCritMultiplierBonus !== 0) {
      this.game.player.critMultiplier = Math.max(1, this.game.player.critMultiplier - this.appliedCritMultiplierBonus);
      this.appliedCritMultiplierBonus = 0;
    }
  }

  private clearRuntimeOnlyEffects(): void {
    this.removeTemporaryStatMods();
    this.drops = [];
    this.effects = [];
    this.constructs = [];
    this.floatingTexts = [];
    this.shieldCharges = 0;
    this.regenHealBank = 0;
    this.lastKills = this.game.kills;
    this.lastBossKills = this.game.bossKills;
    this.spawnTimer = 5.5;
  }

  private spawnNearPlayer(id: RuntimeSupplyId, minDist: number, maxDist: number): void {
    const angle = Math.random() * Math.PI * 2;
    const dist = minDist + Math.random() * (maxDist - minDist);
    const x = this.clamp(this.game.player.pos.x + Math.cos(angle) * dist, 48, RUN_SUPPLY_WORLD.width - 48);
    const y = this.clamp(this.game.player.pos.y + Math.sin(angle) * dist, 48, RUN_SUPPLY_WORLD.height - 48);
    this.drops.push({ id, x, y, age: 0, life: 18, seed: Math.random() * 1000 });
  }

  private pickSpawnId(): RuntimeSupplyId {
    const hpRate = this.game.player.hp / Math.max(1, this.game.player.maxHp);
    return pickRuntimeSupplyId(hpRate);
  }

  private findNearestEnemy(x: number, y: number, maxDist: number) {
    return this.getNearestEnemies(x, y, maxDist, 1)[0] ?? null;
  }

  private getNearestEnemies(x: number, y: number, maxDist: number, limit: number) {
    return this.game.enemies
      .filter((enemy) => enemy.alive)
      .map((enemy) => {
        const dx = enemy.pos.x - x;
        const dy = enemy.pos.y - y;
        return { enemy, dist: Math.sqrt(dx * dx + dy * dy) };
      })
      .filter((item) => item.dist <= maxDist)
      .sort((a, b) => this.targetPriority(a.enemy.role) - this.targetPriority(b.enemy.role) || a.dist - b.dist)
      .slice(0, limit)
      .map((item) => item.enemy);
  }

  private targetPriority(role: string): number {
    switch (role) {
      case "healer": return 0;
      case "summoner": return 1;
      case "bomber": return 2;
      case "boss": return 3;
      case "elite": return 4;
      case "ranged": return 5;
      default: return 10;
    }
  }

  private renderDrops(ctx: CanvasRenderingContext2D): void {
    for (const drop of this.drops) {
      const sp = this.game.camera.worldToScreen(drop.x, drop.y, this.game.w, this.game.h);
      const item = this.getItem(drop.id);
      const color = item?.color ?? getSupplyColor(drop.id);
      const icon = item?.icon ?? "◆";
      const pulse = 1 + Math.sin((drop.age + drop.seed) * 5) * 0.08;
      const fade = Math.min(1, Math.max(0.18, (drop.life - drop.age) / 4));

      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(sp.x, sp.y + Math.sin((drop.age + drop.seed) * 2.8) * 2);
      ctx.scale(pulse, pulse);

      const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 24);
      glow.addColorStop(0, color + "aa");
      glow.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(10,10,18,0.78)";
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = "bold 15px monospace";
      ctx.textAlign = "center";
      ctx.fillText(icon, 0, 5);
      ctx.restore();
    }
  }

  private renderConstructs(ctx: CanvasRenderingContext2D): void {
    for (const construct of this.constructs) {
      const sp = this.game.camera.worldToScreen(construct.x, construct.y, this.game.w, this.game.h);
      const color = getSupplyColor(construct.id);
      const pct = Math.max(0, 1 - construct.age / construct.life);
      const pulse = 1 + Math.sin((construct.age + construct.seed) * 5) * 0.06;

      ctx.save();
      ctx.translate(sp.x, sp.y);
      ctx.scale(pulse, pulse);

      ctx.globalAlpha = 0.16 * pct;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, construct.id === "decoy_doll" ? 68 : 48, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(10,10,18,0.82)";
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.2;
      this.roundRect(ctx, -15, -16, 30, 30, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "center";
      ctx.fillText(construct.id === "decoy_doll" ? "◎" : "▣", 0, 5);

      ctx.globalAlpha = 0.7;
      ctx.fillStyle = color;
      ctx.fillRect(-18, 21, 36 * pct, 3);
      ctx.restore();
    }
  }

  private renderPlayerAuras(ctx: CanvasRenderingContext2D): void {
    const sp = this.game.camera.worldToScreen(this.game.player.pos.x, this.game.player.pos.y, this.game.w, this.game.h);
    ctx.save();

    if (this.hasEffect("magnet")) {
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = getSupplyColor("magnet");
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 72 + Math.sin(this.game.gameTime * 5) * 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (this.hasEffect("regen_dew")) {
      ctx.globalAlpha = 0.2;
      ctx.strokeStyle = getSupplyColor("regen_dew");
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, this.game.player.radius + 22 + Math.sin(this.game.gameTime * 4) * 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (this.hasEffect("crit_potion")) {
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = getSupplyColor("crit_potion");
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, this.game.player.radius + 27, this.game.gameTime * 2, this.game.gameTime * 2 + Math.PI * 1.35);
      ctx.stroke();
    }

    if (this.shieldCharges > 0) {
      ctx.globalAlpha = 0.36;
      ctx.strokeStyle = getSupplyColor("shield");
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, this.game.player.radius + 13 + Math.sin(this.game.gameTime * 6) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderEffectBar(ctx: CanvasRenderingContext2D): void {
    if (this.effects.length <= 0) return;
    const x = Math.max(270, this.game.w - 250);
    let y = 110;

    ctx.save();
    ctx.textAlign = "left";
    for (const effect of this.effects) {
      const pct = Math.max(0, Math.min(1, effect.remaining / effect.duration));
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.strokeStyle = effect.color;
      ctx.lineWidth = 1;
      this.roundRect(ctx, x, y, 218, 24, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = effect.color + "66";
      this.roundRect(ctx, x + 4, y + 17, 210 * pct, 3, 2);
      ctx.fill();
      ctx.fillStyle = effect.color;
      ctx.font = "bold 11px monospace";
      ctx.fillText(effect.label, x + 10, y + 15);
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.textAlign = "right";
      ctx.fillText(`${effect.remaining.toFixed(1)}s`, x + 206, y + 15);
      ctx.textAlign = "left";
      y += 30;
    }
    ctx.restore();
  }

  private renderFloatingTexts(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "bold 12px monospace";
    for (const t of this.floatingTexts) {
      const sp = this.game.camera.worldToScreen(t.x, t.y, this.game.w, this.game.h);
      ctx.globalAlpha = Math.max(0, t.life / t.maxLife);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, sp.x, sp.y);
    }
    ctx.restore();
  }

  private makeBurst(x: number, y: number, color: string, count: number, size: number, force: number) {
    const particles = [];
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = force * (0.25 + Math.random() * 0.75);
      const life = 0.25 + Math.random() * 0.35;
      particles.push({
        pos: { x, y },
        vel: { x: Math.cos(a) * speed, y: Math.sin(a) * speed },
        life,
        maxLife: life,
        size: size * (0.65 + Math.random() * 0.8),
        color,
      });
    }
    return particles;
  }

  private floatText(x: number, y: number, text: string, color: string): void {
    this.floatingTexts.push({ x, y, text, color, life: 1, maxLife: 1 });
  }

  private getItem(id: RuntimeSupplyId): RunItemDef | undefined {
    return getRunItem(id);
  }

  private hasEffect(id: RuntimeSupplyId): boolean {
    return this.effects.some((effect) => effect.id === id && effect.remaining > 0);
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
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
