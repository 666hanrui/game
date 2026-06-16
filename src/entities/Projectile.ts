import { vec2, Vec2 } from "../utils/math";

export type ProjectileKind = "arrow" | "magic" | "heavy_magic" | "energy" | "blade" | "drone" | "hammer" | "spear_beam" | "sword_wave" | "shockwave";
export type ProjectileHitShape = "circle" | "capsule" | "wide_wave";
export type ProjectileRenderQuality = "full" | "simple" | "minimal";

export interface ProjectileHitProfile { shape: ProjectileHitShape; radius: number; length: number; width: number; }

export class Projectile {
  private static frameId = -1;
  private static frameDraws = 0;
  private static tokenAt = 0;
  private static tokens = 120;
  private static shockAt = 0;
  private static shockCount = 0;

  static perf = { fullDraws: 120, simpleDraws: 240, maxEnemyTokens: 150, enemyRefill: 90, shockWindowMs: 320, shockFull: 24 };

  pos: Vec2;
  vel: Vec2;
  fromEnemy: boolean;
  damage: number;
  kind: ProjectileKind;
  alive = true;
  nextTrackAt = 0;
  cachedTargetIndex = -1;
  private maxLife = 3;
  private life = 0;
  private forcedQuality: ProjectileRenderQuality | null = null;

  constructor(x: number, y: number, vx: number, vy: number, fromEnemy: boolean, damage: number, kind: ProjectileKind = "arrow") {
    this.pos = vec2(x, y);
    this.vel = vec2(vx, vy);
    this.fromEnemy = fromEnemy;
    this.damage = damage;
    this.kind = kind;
    if (fromEnemy && !Projectile.takeSpawnToken()) this.alive = false;
    if (kind === "hammer" || kind === "shockwave") this.maxLife = 0.78;
    if (kind === "blade") this.maxLife = 0.95;
    if (kind === "spear_beam" || kind === "sword_wave") this.maxLife = 1.05;
    if (kind === "shockwave" && !Projectile.takeShockVisualSlot()) this.forcedQuality = "minimal";
  }

  get hitRadius(): number { return this.hitProfile.radius; }
  get lifeRatio(): number { return Math.max(0, Math.min(1, this.life / this.maxLife)); }

  get hitProfile(): ProjectileHitProfile {
    switch (this.kind) {
      case "arrow": return { shape: "capsule", radius: 8, length: 44, width: 9 };
      case "energy": return { shape: "capsule", radius: 10, length: 42, width: 13 };
      case "drone": return { shape: "capsule", radius: 8, length: 34, width: 11 };
      case "blade": return { shape: "circle", radius: 15, length: 30, width: 30 };
      case "magic": return { shape: "capsule", radius: 10, length: 36, width: 14 };
      case "heavy_magic": return { shape: "circle", radius: 16, length: 32, width: 32 };
      case "hammer": return { shape: "circle", radius: 18 + this.life * 34, length: 0, width: 0 };
      case "spear_beam": return { shape: "capsule", radius: 18, length: 112, width: 26 };
      case "sword_wave": return { shape: "capsule", radius: 20, length: 58, width: 34 };
      case "shockwave": return { shape: "wide_wave", radius: 22 + this.life * 52, length: 86 + this.life * 92, width: 30 + this.life * 38 };
      default: return { shape: "circle", radius: 8, length: 0, width: 0 };
    }
  }

  get direction(): Vec2 {
    const len = Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y) || 1;
    return vec2(this.vel.x / len, this.vel.y / len);
  }

  hitsCircle(center: Vec2, radius: number): boolean {
    const profile = this.hitProfile;
    if (profile.shape === "circle") return distanceSq(this.pos.x, this.pos.y, center.x, center.y) <= square(profile.radius + radius);
    const dir = this.direction;
    const half = profile.length / 2;
    const back = profile.shape === "wide_wave" ? half * 0.35 : half;
    const front = profile.shape === "wide_wave" ? half * 1.05 : half;
    return distToSegmentSq(center.x, center.y, this.pos.x - dir.x * back, this.pos.y - dir.y * back, this.pos.x + dir.x * front, this.pos.y + dir.y * front) <= square(profile.width * 0.5 + radius);
  }

  update(dt: number): void {
    if (!this.alive) return;
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    this.life += dt;
    if (this.life > this.maxLife) this.alive = false;
  }

  renderAt(ctx: CanvasRenderingContext2D, sx: number, sy: number, sprite?: HTMLImageElement | null): void {
    const angle = Math.atan2(this.vel.y, this.vel.x);
    const quality = this.renderQuality();
    if (quality !== "full") return this.renderCheap(ctx, sx, sy, angle, quality);
    if (this.kind === "magic") return this.renderArcaneBolt(ctx, sx, sy, angle);
    if (this.kind === "heavy_magic") return this.renderRuneBolt(ctx, sx, sy, angle);
    if (this.kind === "energy") return this.renderEnergy(ctx, sx, sy, angle);
    if (this.kind === "blade") return this.renderBlade(ctx, sx, sy, angle);
    if (this.kind === "drone") return this.renderDronePulse(ctx, sx, sy, angle);
    if (this.kind === "hammer") return this.renderHammerShock(ctx, sx, sy, angle, sprite);
    if (this.kind === "shockwave") return this.renderShockwave(ctx, sx, sy, angle);
    if (this.kind === "spear_beam") return this.renderSpearBeam(ctx, sx, sy, angle);
    if (this.kind === "sword_wave") return this.renderSwordWave(ctx, sx, sy, angle);
    return this.renderArrow(ctx, sx, sy, angle);
  }

  private renderQuality(): ProjectileRenderQuality {
    if (this.forcedQuality) return this.forcedQuality;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const frame = Math.floor(now / 16.7);
    if (frame !== Projectile.frameId) { Projectile.frameId = frame; Projectile.frameDraws = 0; }
    Projectile.frameDraws++;
    if (Projectile.frameDraws > Projectile.perf.simpleDraws) return "minimal";
    if (Projectile.frameDraws > Projectile.perf.fullDraws || (this.kind === "shockwave" && Projectile.frameDraws > 60)) return "simple";
    return "full";
  }

  private renderCheap(ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number, quality: ProjectileRenderQuality): void {
    const color = this.colorForKind();
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(angle); ctx.globalAlpha = quality === "minimal" ? 0.42 : 0.78; ctx.strokeStyle = color; ctx.fillStyle = color;
    if (this.kind === "shockwave" || this.kind === "hammer") { const r = this.hitProfile.radius; ctx.lineWidth = quality === "minimal" ? 1.5 : 2.6; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke(); }
    else if (this.kind === "sword_wave") { ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 22, -0.9, 0.9); ctx.stroke(); }
    else if (this.kind === "spear_beam") { ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-44, 0); ctx.lineTo(68, 0); ctx.stroke(); }
    else { ctx.fillRect(-8, -2, 16, 4); }
    ctx.restore();
  }

  private renderArrow(ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number): void { ctx.save(); ctx.translate(sx, sy); ctx.rotate(angle); ctx.strokeStyle = this.fromEnemy ? "#ff8a80" : "#fffde7"; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(14, 0); ctx.stroke(); ctx.fillStyle = this.fromEnemy ? "#ef5350" : "#ffd54f"; ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(5, -5); ctx.lineTo(7, 0); ctx.lineTo(5, 5); ctx.closePath(); ctx.fill(); ctx.restore(); }
  private renderArcaneBolt(ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number): void { this.renderGlowDot(ctx, sx, sy, angle, "#ce93d8", 9, 22); }
  private renderRuneBolt(ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number): void { this.renderGlowDot(ctx, sx, sy, angle, "#ab47bc", 13, 18); }
  private renderEnergy(ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number): void { ctx.save(); ctx.translate(sx, sy); ctx.rotate(angle); ctx.shadowColor = "#4dd0e1"; ctx.shadowBlur = 8; ctx.fillStyle = "#4dd0e1"; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(2, -8); ctx.lineTo(-11, 0); ctx.lineTo(2, 8); ctx.closePath(); ctx.fill(); ctx.restore(); }
  private renderDronePulse(ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number): void { ctx.save(); ctx.translate(sx, sy); ctx.rotate(angle); ctx.fillStyle = "rgba(66,165,245,0.72)"; ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(-8, -8); ctx.lineTo(-4, 0); ctx.lineTo(-8, 8); ctx.closePath(); ctx.fill(); ctx.restore(); }
  private renderBlade(ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number): void { ctx.save(); ctx.translate(sx, sy); ctx.rotate(angle + this.life * 18); ctx.fillStyle = "#cfd8dc"; ctx.strokeStyle = "#607d8b"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -13); ctx.quadraticCurveTo(10, -2, 2, 13); ctx.lineTo(-4, 5); ctx.quadraticCurveTo(2, 0, -4, -5); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
  private renderSpearBeam(ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number): void { ctx.save(); ctx.translate(sx, sy); ctx.rotate(angle); ctx.globalAlpha = Math.max(0.15, 1 - this.lifeRatio); ctx.strokeStyle = "#fff3e0"; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-52, 0); ctx.lineTo(68, 0); ctx.stroke(); ctx.strokeStyle = "rgba(255,183,77,0.65)"; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(-42, 0); ctx.lineTo(58, 0); ctx.stroke(); ctx.restore(); }
  private renderSwordWave(ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number): void { ctx.save(); ctx.translate(sx, sy); ctx.rotate(angle); ctx.globalAlpha = Math.max(0.18, 1 - this.lifeRatio); ctx.strokeStyle = "#90caf9"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 24, -0.95, 0.95); ctx.stroke(); ctx.restore(); }
  private renderShockwave(ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number): void { const a = Math.max(0, 1 - this.lifeRatio); ctx.save(); ctx.translate(sx, sy); ctx.rotate(angle); ctx.globalAlpha = 0.4 * a; ctx.strokeStyle = "#bc8f5a"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 0, 22 + this.life * 58, 9 + this.life * 24, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
  private renderHammerShock(ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number, sprite?: HTMLImageElement | null): void { ctx.save(); ctx.globalAlpha = Math.max(0, 1 - this.lifeRatio) * 0.22; ctx.strokeStyle = "#bc8f5a"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(sx, sy, 10 + this.life * 34, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 0.9; ctx.translate(sx, sy); ctx.rotate(angle + this.life * 4); if (sprite) ctx.drawImage(sprite, -15, -15, 30, 30); else { ctx.fillStyle = "#9e9e9e"; ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill(); } ctx.restore(); }
  private renderGlowDot(ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number, color: string, r: number, tail: number): void { ctx.save(); ctx.translate(sx, sy); ctx.rotate(angle); ctx.shadowColor = color; ctx.shadowBlur = 10; ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(3, 0, r, r * 0.62, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 0.45; ctx.fillRect(-tail, -2, tail, 4); ctx.restore(); }
  private colorForKind(): string { if (this.fromEnemy) return "#ef5350"; if (this.kind === "energy") return "#4dd0e1"; if (this.kind === "magic" || this.kind === "heavy_magic") return "#ce93d8"; if (this.kind === "shockwave" || this.kind === "hammer") return "#bc8f5a"; if (this.kind === "spear_beam") return "#ffb74d"; if (this.kind === "sword_wave") return "#90caf9"; return "#ffd54f"; }

  private static takeSpawnToken(): boolean { const now = typeof performance !== "undefined" ? performance.now() : Date.now(); if (Projectile.tokenAt <= 0) Projectile.tokenAt = now; const dt = Math.max(0, (now - Projectile.tokenAt) / 1000); Projectile.tokenAt = now; Projectile.tokens = Math.min(Projectile.perf.maxEnemyTokens, Projectile.tokens + dt * Projectile.perf.enemyRefill); if (Projectile.tokens < 1) return false; Projectile.tokens -= 1; return true; }
  private static takeShockVisualSlot(): boolean { const now = typeof performance !== "undefined" ? performance.now() : Date.now(); if (now - Projectile.shockAt > Projectile.perf.shockWindowMs) { Projectile.shockAt = now; Projectile.shockCount = 0; } Projectile.shockCount++; return Projectile.shockCount <= Projectile.perf.shockFull; }
}

function square(n: number): number { return n * n; }
function distanceSq(ax: number, ay: number, bx: number, by: number): number { const dx = ax - bx; const dy = ay - by; return dx * dx + dy * dy; }
function distToSegmentSq(px: number, py: number, ax: number, ay: number, bx: number, by: number): number { const vx = bx - ax; const vy = by - ay; const wx = px - ax; const wy = py - ay; const lenSq = vx * vx + vy * vy || 1; const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / lenSq)); return distanceSq(px, py, ax + vx * t, ay + vy * t); }
