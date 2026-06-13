import type { GameWithSound } from "../core/GameWithSound";
import { RUN_ITEMS } from "../data/runItems";
import type { RunItemDef } from "../data/runItems";

export type RuntimeSupplyId =
  | "magnet"
  | "shield"
  | "haste_potion"
  | "power_potion"
  | "health_pack"
  | "regen_dew"
  | "crit_potion"
  | "frost_bomb";

interface RuntimeSupplyDrop {
  id: RuntimeSupplyId;
  x: number;
  y: number;
  age: number;
  life: number;
  seed: number;
}

interface RuntimeEffect {
  id: RuntimeSupplyId;
  label: string;
  color: string;
  duration: number;
  remaining: number;
}

interface FloatingSupplyText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

interface SupplyParticle {
  pos: { x: number; y: number };
  vel: { x: number; y: number };
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface SupplyVisual {
  shortLabel: string;
  hint: string;
  shape: "diamond" | "hex" | "bolt" | "triangle" | "cross" | "circle" | "star" | "snow";
}

const WORLD_W = 2400;
const WORLD_H = 2400;

const SUPPLY_VISUALS: Record<RuntimeSupplyId, SupplyVisual> = {
  magnet: { shortLabel: "吸", hint: "吸取", shape: "diamond" },
  shield: { shortLabel: "盾", hint: "护盾", shape: "hex" },
  haste_potion: { shortLabel: "速", hint: "急速", shape: "bolt" },
  power_potion: { shortLabel: "攻", hint: "攻击", shape: "triangle" },
  health_pack: { shortLabel: "血", hint: "回血", shape: "cross" },
  regen_dew: { shortLabel: "春", hint: "回春", shape: "circle" },
  crit_potion: { shortLabel: "暴", hint: "暴击", shape: "star" },
  frost_bomb: { shortLabel: "冰", hint: "冰霜", shape: "snow" },
};

export class RunSupplyRuntime {
  private drops: RuntimeSupplyDrop[] = [];
  private effects: RuntimeEffect[] = [];
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
    this.applyOngoingEffects(dt);
    this.applyTemporaryStatMods();
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.game.phase !== "playing") return;
    this.renderDrops(ctx);
    this.renderPlayerAuras(ctx);
    this.renderEffectBar(ctx);
    this.renderFloatingTexts(ctx);
  }

  private shouldClearOnPhase(): boolean {
    return this.game.phase === "menu" || this.game.phase === "meta_upgrade" || this.game.phase === "result";
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
        const chance = this.game.waveNum >= 6 ? 0.052 : 0.034;
        if (Math.random() < chance) this.spawnNearPlayer(this.pickSpawnId(), 120, 420);
      }
      this.lastKills = this.game.kills;
    }

    if (this.game.bossKills > this.lastBossKills) {
      this.spawnNearPlayer("shield", 80, 220);
      this.spawnNearPlayer(this.pickBossBonusId(), 100, 260);
      this.spawnNearPlayer(Math.random() < 0.55 ? "health_pack" : "regen_dew", 110, 280);
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

  private activate(id: RuntimeSupplyId): void {
    const item = this.getItem(id);
    const label = item?.name ?? this.labelFor(id);
    const color = item?.color ?? this.colorFor(id);

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
    }
  }

  private blockDamageWithShield(): void {
    if (this.shieldCharges <= 0) return;
    if (this.game.player.hp >= this.hpBeforeUpdate) return;

    this.game.player.hp = this.hpBeforeUpdate;
    this.shieldCharges--;
    if (this.shieldCharges <= 0) this.effects = this.effects.filter((effect) => effect.id !== "shield");
    else this.addOrRefreshEffect("shield", `护盾 x${this.shieldCharges}`, this.colorFor("shield"), 8);

    this.floatText(this.game.player.pos.x, this.game.player.pos.y - 46, "护盾抵挡", this.colorFor("shield"));
    this.game.particles.push(...this.makeBurst(this.game.player.pos.x, this.game.player.pos.y, this.colorFor("shield"), 16, 4, 170));

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
    const x = this.clamp(this.game.player.pos.x + Math.cos(angle) * dist, 48, WORLD_W - 48);
    const y = this.clamp(this.game.player.pos.y + Math.sin(angle) * dist, 48, WORLD_H - 48);
    this.drops.push({ id, x, y, age: 0, life: 18, seed: Math.random() * 1000 });
  }

  private pickSpawnId(): RuntimeSupplyId {
    const hpRate = this.game.player.hp / Math.max(1, this.game.player.maxHp);
    const roll = Math.random();

    if (hpRate < 0.38) {
      if (roll < 0.32) return "health_pack";
      if (roll < 0.48) return "regen_dew";
      if (roll < 0.62) return "shield";
    }

    if (roll < 0.18) return "magnet";
    if (roll < 0.34) return "haste_potion";
    if (roll < 0.5) return "power_potion";
    if (roll < 0.63) return "health_pack";
    if (roll < 0.74) return "regen_dew";
    if (roll < 0.84) return "crit_potion";
    if (roll < 0.93) return "shield";
    return "frost_bomb";
  }

  private pickBossBonusId(): RuntimeSupplyId {
    const pool: RuntimeSupplyId[] = ["haste_potion", "power_potion", "crit_potion", "frost_bomb", "regen_dew"];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private renderDrops(ctx: CanvasRenderingContext2D): void {
    for (const drop of this.drops) {
      const sp = this.game.camera.worldToScreen(drop.x, drop.y, this.game.w, this.game.h);
      const item = this.getItem(drop.id);
      const color = item?.color ?? this.colorFor(drop.id);
      const visual = SUPPLY_VISUALS[drop.id];
      const pulse = 1 + Math.sin((drop.age + drop.seed) * 5) * 0.08;
      const fade = Math.min(1, Math.max(0.18, (drop.life - drop.age) / 4));
      const bob = Math.sin((drop.age + drop.seed) * 2.8) * 2;

      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(sp.x, sp.y + bob);
      ctx.scale(pulse, pulse);

      this.drawDropGlow(ctx, color);
      this.drawDropPlate(ctx, color, visual.shape, drop.age + drop.seed);

      ctx.fillStyle = "#07101f";
      ctx.font = "bold 13px monospace";
      ctx.textAlign = "center";
      ctx.fillText(visual.shortLabel, 0, 5);

      ctx.fillStyle = this.rgba(color, 0.95);
      ctx.font = "bold 10px monospace";
      ctx.fillText(visual.hint, 0, 30);
      ctx.restore();
    }
  }

  private drawDropGlow(ctx: CanvasRenderingContext2D, color: string): void {
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 30);
    glow.addColorStop(0, this.rgba(color, 0.76));
    glow.addColorStop(0.5, this.rgba(color, 0.22));
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawDropPlate(ctx: CanvasRenderingContext2D, color: string, shape: SupplyVisual["shape"], time: number): void {
    ctx.fillStyle = "rgba(8,13,24,0.86)";
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.4;
    ctx.beginPath();

    if (shape === "diamond") {
      ctx.moveTo(0, -17);
      ctx.lineTo(17, 0);
      ctx.lineTo(0, 17);
      ctx.lineTo(-17, 0);
      ctx.closePath();
    } else if (shape === "hex") {
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i / 6) * Math.PI * 2;
        const x = Math.cos(a) * 18;
        const y = Math.sin(a) * 18;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    } else if (shape === "triangle") {
      ctx.moveTo(0, -18);
      ctx.lineTo(17, 14);
      ctx.lineTo(-17, 14);
      ctx.closePath();
    } else if (shape === "bolt") {
      ctx.moveTo(-7, -19);
      ctx.lineTo(10, -3);
      ctx.lineTo(2, -2);
      ctx.lineTo(9, 19);
      ctx.lineTo(-10, 2);
      ctx.lineTo(-2, 1);
      ctx.closePath();
    } else if (shape === "cross") {
      ctx.moveTo(-6, -18);
      ctx.lineTo(6, -18);
      ctx.lineTo(6, -6);
      ctx.lineTo(18, -6);
      ctx.lineTo(18, 6);
      ctx.lineTo(6, 6);
      ctx.lineTo(6, 18);
      ctx.lineTo(-6, 18);
      ctx.lineTo(-6, 6);
      ctx.lineTo(-18, 6);
      ctx.lineTo(-18, -6);
      ctx.lineTo(-6, -6);
      ctx.closePath();
    } else {
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
    }

    ctx.fill();
    ctx.stroke();

    if (shape === "star" || shape === "snow") {
      ctx.strokeStyle = this.rgba(color, 0.72);
      ctx.lineWidth = 1.4;
      for (let i = 0; i < (shape === "star" ? 5 : 6); i++) {
        const a = time * 0.35 + (i / (shape === "star" ? 5 : 6)) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 5, Math.sin(a) * 5);
        ctx.lineTo(Math.cos(a) * 24, Math.sin(a) * 24);
        ctx.stroke();
      }
    }

    ctx.strokeStyle = this.rgba(color, 0.42);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, 23 + Math.sin(time * 2.5) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  private renderPlayerAuras(ctx: CanvasRenderingContext2D): void {
    const sp = this.game.camera.worldToScreen(this.game.player.pos.x, this.game.player.pos.y, this.game.w, this.game.h);
    ctx.save();

    if (this.hasEffect("magnet")) this.renderMagnetAura(ctx, sp.x, sp.y);
    if (this.hasEffect("regen_dew")) this.renderRegenAura(ctx, sp.x, sp.y);
    if (this.hasEffect("crit_potion")) this.renderCritAura(ctx, sp.x, sp.y);
    if (this.shieldCharges > 0) this.renderShieldAura(ctx, sp.x, sp.y);

    ctx.restore();
  }

  private renderMagnetAura(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const color = this.colorFor("magnet");
    const t = this.game.gameTime;
    const radius = 78 + Math.sin(t * 5) * 5;

    const glow = ctx.createRadialGradient(x, y, 12, x, y, radius + 26);
    glow.addColorStop(0, this.rgba(color, 0.06));
    glow.addColorStop(0.7, this.rgba(color, 0.13));
    glow.addColorStop(1, "rgba(66,165,245,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, radius + 26, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = this.rgba(color, 0.36);
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = this.rgba(color, 0.22);
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 10; i++) {
      const a = t * 1.4 + (i / 10) * Math.PI * 2;
      const outer = radius + 12;
      const inner = radius - 12;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * outer, y + Math.sin(a) * outer);
      ctx.lineTo(x + Math.cos(a) * inner, y + Math.sin(a) * inner);
      ctx.stroke();
    }
  }

  private renderRegenAura(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const color = this.colorFor("regen_dew");
    ctx.strokeStyle = this.rgba(color, 0.34);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, this.game.player.radius + 24 + Math.sin(this.game.gameTime * 4) * 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  private renderCritAura(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const color = this.colorFor("crit_potion");
    ctx.strokeStyle = this.rgba(color, 0.34);
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(x, y, this.game.player.radius + 29, this.game.gameTime * 2, this.game.gameTime * 2 + Math.PI * 1.35);
    ctx.stroke();
  }

  private renderShieldAura(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const color = this.colorFor("shield");
    const r = this.game.player.radius + 15 + Math.sin(this.game.gameTime * 6) * 2;

    ctx.strokeStyle = this.rgba(color, 0.58);
    ctx.lineWidth = 3.4;
    this.hexPath(ctx, x, y, r + 3);
    ctx.stroke();

    ctx.strokeStyle = this.rgba("#ffffff", 0.28);
    ctx.lineWidth = 1.4;
    this.hexPath(ctx, x, y, r + 8);
    ctx.stroke();

    ctx.fillStyle = this.rgba(color, 0.9);
    for (let i = 0; i < this.shieldCharges; i++) {
      const a = -Math.PI / 2 + (i - (this.shieldCharges - 1) / 2) * 0.28;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * (r + 17), y + Math.sin(a) * (r + 17), 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderEffectBar(ctx: CanvasRenderingContext2D): void {
    if (this.effects.length <= 0) return;
    const panelW = Math.min(242, Math.max(196, this.game.w * 0.24));
    const x = Math.max(12, this.game.w - panelW - 16);
    let y = 104;

    ctx.save();
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(0,0,0,0.36)";
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    this.roundRect(ctx, x, y - 27, panelW, 22, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.62)";
    ctx.font = "bold 11px monospace";
    ctx.fillText("局内补给", x + 10, y - 12);

    for (const effect of this.effects) {
      const pct = Math.max(0, Math.min(1, effect.remaining / effect.duration));
      const visual = SUPPLY_VISUALS[effect.id];
      const rowH = 32;

      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.strokeStyle = this.rgba(effect.color, 0.76);
      ctx.lineWidth = 1.2;
      this.roundRect(ctx, x, y, panelW, rowH, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = this.rgba(effect.color, 0.16);
      this.roundRect(ctx, x + 4, y + 4, 26, 24, 8);
      ctx.fill();
      ctx.strokeStyle = this.rgba(effect.color, 0.56);
      ctx.lineWidth = 1;
      this.roundRect(ctx, x + 4, y + 4, 26, 24, 8);
      ctx.stroke();

      ctx.fillStyle = effect.color;
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.fillText(visual.shortLabel, x + 17, y + 21);

      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(255,255,255,0.82)";
      ctx.font = "bold 11px monospace";
      ctx.fillText(effect.label, x + 38, y + 14);

      ctx.fillStyle = this.rgba(effect.color, 0.72);
      this.roundRect(ctx, x + 38, y + 22, (panelW - 84) * pct, 4, 2);
      ctx.fill();

      if (effect.id === "shield") this.drawShieldChargePips(ctx, x + panelW - 70, y + 16, effect.color);

      ctx.fillStyle = "rgba(255,255,255,0.62)";
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`${effect.remaining.toFixed(1)}s`, x + panelW - 8, y + 19);
      y += rowH + 7;
    }
    ctx.restore();
  }

  private drawShieldChargePips(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < this.shieldCharges ? color : "rgba(255,255,255,0.12)";
      ctx.beginPath();
      ctx.arc(x + i * 8, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderFloatingTexts(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "bold 12px monospace";
    for (const t of this.floatingTexts) {
      const sp = this.game.camera.worldToScreen(t.x, t.y, this.game.w, this.game.h);
      ctx.globalAlpha = Math.max(0, t.life / t.maxLife);
      ctx.fillStyle = "rgba(0,0,0,0.42)";
      ctx.fillText(t.text, sp.x + 1, sp.y + 1);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, sp.x, sp.y);
    }
    ctx.restore();
  }

  private makeBurst(x: number, y: number, color: string, count: number, size: number, force: number): SupplyParticle[] {
    const particles: SupplyParticle[] = [];
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
    return RUN_ITEMS.find((item) => item.id === id);
  }

  private hasEffect(id: RuntimeSupplyId): boolean {
    return this.effects.some((effect) => effect.id === id && effect.remaining > 0);
  }

  private labelFor(id: RuntimeSupplyId): string {
    switch (id) {
      case "magnet": return "磁铁";
      case "shield": return "护盾";
      case "haste_potion": return "急速药剂";
      case "power_potion": return "攻击药剂";
      case "health_pack": return "血包";
      case "regen_dew": return "回春露";
      case "crit_potion": return "暴击药剂";
      case "frost_bomb": return "冰霜炸弹";
    }
  }

  private colorFor(id: RuntimeSupplyId): string {
    switch (id) {
      case "magnet": return "#42a5f5";
      case "shield": return "#80deea";
      case "haste_potion": return "#ffd54f";
      case "power_potion": return "#ff8a65";
      case "health_pack": return "#66bb6a";
      case "regen_dew": return "#81c784";
      case "crit_potion": return "#ffeb3b";
      case "frost_bomb": return "#90caf9";
    }
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  private rgba(hex: string, alpha: number): string {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  private hexPath(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i / 6) * Math.PI * 2;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    if (w <= 0 || h <= 0) return;
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.arcTo(x + w, y, x + w, y + rr, rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
    ctx.lineTo(x + rr, y + h);
    ctx.arcTo(x, y + h, x, y + h - rr, rr);
    ctx.lineTo(x, y + rr);
    ctx.arcTo(x, y, x + rr, y, rr);
    ctx.closePath();
  }
}
