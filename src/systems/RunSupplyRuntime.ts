import type { GameWithSound } from "../core/GameWithSound";
import { RUN_ITEMS, RunItemDef } from "../data/runItems";

export type RuntimeSupplyId = "magnet" | "shield" | "haste_potion" | "power_potion";

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

const WORLD_W = 2400;
const WORLD_H = 2400;

export class RunSupplyRuntime {
  private drops: RuntimeSupplyDrop[] = [];
  private effects: RuntimeEffect[] = [];
  private floatingTexts: FloatingSupplyText[] = [];
  private spawnTimer = 5.5;
  private lastKills = 0;
  private lastBossKills = 0;
  private hpBeforeUpdate = 0;
  private shieldCharges = 0;
  private appliedDamageMult = 1;
  private appliedCooldownMult = 1;

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
      this.spawnTimer = Math.max(3.2, 8.5 - this.game.waveNum * 0.18);
    }

    if (this.game.kills > this.lastKills) {
      const diff = this.game.kills - this.lastKills;
      for (let i = 0; i < diff; i++) {
        const chance = this.game.waveNum >= 6 ? 0.045 : 0.03;
        if (Math.random() < chance) this.spawnNearPlayer(this.pickSpawnId(), 120, 420);
      }
      this.lastKills = this.game.kills;
    }

    if (this.game.bossKills > this.lastBossKills) {
      this.spawnNearPlayer("shield", 80, 220);
      this.spawnNearPlayer(Math.random() < 0.5 ? "haste_potion" : "power_potion", 100, 260);
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

    if (this.hasEffect("power_potion")) damageMult *= 1.42;
    if (this.hasEffect("haste_potion")) cooldownMult *= 0.58;

    if (damageMult !== 1) this.game.player.damage = Math.max(1, Math.floor(this.game.player.damage * damageMult));
    if (cooldownMult !== 1) this.game.player.attackCooldown = Math.max(0.05, this.game.player.attackCooldown * cooldownMult);

    this.appliedDamageMult = damageMult;
    this.appliedCooldownMult = cooldownMult;
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
  }

  private clearRuntimeOnlyEffects(): void {
    this.removeTemporaryStatMods();
    this.drops = [];
    this.effects = [];
    this.floatingTexts = [];
    this.shieldCharges = 0;
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
    const roll = Math.random();
    if (roll < 0.34) return "magnet";
    if (roll < 0.57) return "haste_potion";
    if (roll < 0.8) return "power_potion";
    return "shield";
  }

  private renderDrops(ctx: CanvasRenderingContext2D): void {
    for (const drop of this.drops) {
      const sp = this.game.camera.worldToScreen(drop.x, drop.y, this.game.w, this.game.h);
      const item = this.getItem(drop.id);
      const color = item?.color ?? this.colorFor(drop.id);
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

  private renderPlayerAuras(ctx: CanvasRenderingContext2D): void {
    const sp = this.game.camera.worldToScreen(this.game.player.pos.x, this.game.player.pos.y, this.game.w, this.game.h);
    ctx.save();

    if (this.hasEffect("magnet")) {
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = this.colorFor("magnet");
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 72 + Math.sin(this.game.gameTime * 5) * 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (this.shieldCharges > 0) {
      ctx.globalAlpha = 0.36;
      ctx.strokeStyle = this.colorFor("shield");
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
    }
  }

  private colorFor(id: RuntimeSupplyId): string {
    switch (id) {
      case "magnet": return "#42a5f5";
      case "shield": return "#80deea";
      case "haste_potion": return "#ffd54f";
      case "power_potion": return "#ff8a65";
    }
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
