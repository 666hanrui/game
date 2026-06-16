import { vec2, Vec2 } from "../utils/math";

export type ProjectileKind =
  | "arrow"
  | "magic"
  | "heavy_magic"
  | "energy"
  | "blade"
  | "drone"
  | "hammer"
  | "spear_beam"
  | "sword_wave"
  | "shockwave";

export type ProjectileHitShape = "circle" | "capsule" | "wide_wave";

export interface ProjectileHitProfile {
  shape: ProjectileHitShape;
  radius: number;
  length: number;
  width: number;
}

export class Projectile {
  pos: Vec2;
  vel: Vec2;
  fromEnemy: boolean;
  damage: number;
  kind: ProjectileKind;
  alive = true;
  private maxLife = 3;
  private life = 0;

  constructor(x: number, y: number, vx: number, vy: number, fromEnemy: boolean, damage: number, kind: ProjectileKind = "arrow") {
    this.pos = vec2(x, y);
    this.vel = vec2(vx, vy);
    this.fromEnemy = fromEnemy;
    this.damage = damage;
    this.kind = kind;
    if (kind === "hammer" || kind === "shockwave") this.maxLife = 1.15;
    if (kind === "blade") this.maxLife = 0.95;
    if (kind === "spear_beam" || kind === "sword_wave") this.maxLife = 1.25;
  }

  get hitRadius(): number {
    return this.hitProfile.radius;
  }

  get hitProfile(): ProjectileHitProfile {
    switch (this.kind) {
      case "arrow": return { shape: "capsule", radius: 8, length: 44, width: 9 };
      case "energy": return { shape: "capsule", radius: 10, length: 42, width: 13 };
      case "drone": return { shape: "capsule", radius: 8, length: 34, width: 11 };
      case "blade": return { shape: "circle", radius: 15, length: 30, width: 30 };
      case "magic": return { shape: "capsule", radius: 10, length: 36, width: 14 };
      case "heavy_magic": return { shape: "circle", radius: 16, length: 32, width: 32 };
      case "hammer": return { shape: "circle", radius: 20 + this.life * 46, length: 0, width: 0 };
      case "spear_beam": return { shape: "capsule", radius: 18, length: 112, width: 26 };
      case "sword_wave": return { shape: "capsule", radius: 20, length: 58, width: 34 };
      case "shockwave": return { shape: "wide_wave", radius: 24 + this.life * 62, length: 92 + this.life * 112, width: 34 + this.life * 48 };
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
    const ax = this.pos.x - dir.x * back;
    const ay = this.pos.y - dir.y * back;
    const bx = this.pos.x + dir.x * front;
    const by = this.pos.y + dir.y * front;
    const capsuleRadius = profile.shape === "wide_wave" ? profile.width * 0.5 : profile.width * 0.5;
    return distToSegmentSq(center.x, center.y, ax, ay, bx, by) <= square(capsuleRadius + radius);
  }

  update(dt: number): void {
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    this.life += dt;
    if (this.life > this.maxLife) this.alive = false;
  }

  renderAt(ctx: CanvasRenderingContext2D, sx: number, sy: number, sprite?: HTMLImageElement | null): void {
    const angle = Math.atan2(this.vel.y, this.vel.x);
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

  private renderArrow(ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number): void {
    const color = this.fromEnemy ? "#ef5350" : "#ffd54f";
    const headColor = this.fromEnemy ? "#ff8a80" : "#fffde7";
    const shaftColor = this.fromEnemy ? "#ffcdd2" : "#f6d179";
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(angle);
    const trail = ctx.createLinearGradient(-34, 0, 4, 0);
    trail.addColorStop(0, "rgba(255,255,255,0)"); trail.addColorStop(0.65, color + "66"); trail.addColorStop(1, color + "aa");
    ctx.fillStyle = trail; ctx.beginPath(); ctx.moveTo(-34, -3.4); ctx.lineTo(3, -1.35); ctx.lineTo(3, 1.35); ctx.lineTo(-34, 3.4); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(59,37,14,0.9)"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(9, 0); ctx.stroke();
    ctx.strokeStyle = shaftColor; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(8, 0); ctx.stroke();
    ctx.fillStyle = headColor; ctx.strokeStyle = "rgba(80,55,25,0.9)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(6, -5); ctx.lineTo(8, 0); ctx.lineTo(6, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = this.fromEnemy ? "#ef9a9a" : "#fff8c6"; ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(-25, -5); ctx.lineTo(-21, 0); ctx.lineTo(-25, 5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.65)"; ctx.fillRect(-2, -0.6, 8, 1.2); ctx.restore();
  }

  private renderArcaneBolt(ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number): void {
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(angle);
    const trail = ctx.createLinearGradient(-26, 0, 6, 0);
    trail.addColorStop(0, "rgba(156,39,176,0)"); trail.addColorStop(1, "rgba(206,147,216,0.78)");
    ctx.fillStyle = trail; ctx.beginPath(); ctx.moveTo(-26, -4); ctx.quadraticCurveTo(-8, -1.5, 8, -2.5); ctx.lineTo(8, 2.5); ctx.quadraticCurveTo(-8, 1.5, -26, 4); ctx.closePath(); ctx.fill();
    ctx.shadowColor = "#ce93d8"; ctx.shadowBlur = 12; ctx.fillStyle = "#ce93d8"; ctx.beginPath(); ctx.ellipse(3, 0, 9, 5.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#f3e5f5"; ctx.beginPath(); ctx.arc(6, -1.6, 2.4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  private renderRuneBolt(ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number): void {
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(angle);
    ctx.shadowColor = "#ab47bc"; ctx.shadowBlur = 18; ctx.strokeStyle = "rgba(225,190,231,0.72)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.stroke();
    ctx.rotate(this.life * 5); ctx.fillStyle = "#ab47bc"; ctx.strokeStyle = "#f3e5f5"; ctx.lineWidth = 1.2; ctx.beginPath();
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; const r = i % 2 === 0 ? 12 : 6; const x = Math.cos(a) * r; const y = Math.sin(a) * r; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(0, 0, 3.2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  private renderEnergy(ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number): void {
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(angle);
    const trail = ctx.createLinearGradient(-28, 0, 12, 0);
    trail.addColorStop(0, "rgba(77,208,225,0)"); trail.addColorStop(0.8, "rgba(77,208,225,0.66)"); trail.addColorStop(1, "rgba(224,247,250,0.94)");
    ctx.fillStyle = trail; ctx.beginPath(); ctx.moveTo(-28, -5); ctx.lineTo(9, 0); ctx.lineTo(-28, 5); ctx.closePath(); ctx.fill();
    ctx.shadowColor = "#4dd0e1"; ctx.shadowBlur = 10; ctx.fillStyle = "#4dd0e1"; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(2, -8); ctx.lineTo(-11, 0); ctx.lineTo(2, 8); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#e0f7fa"; ctx.lineWidth = 1.2; ctx.stroke(); ctx.globalAlpha = 0.75; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 0.8;
    for (const x of [-8, -3, 2]) { ctx.beginPath(); ctx.moveTo(x, -7); ctx.lineTo(x + 7, 7); ctx.stroke(); }
    ctx.restore();
  }

  private renderDronePulse(ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number): void {
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(angle);
    ctx.shadowColor = "#42a5f5"; ctx.shadowBlur = 10; ctx.fillStyle = "rgba(66,165,245,0.72)"; ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(-8, -8); ctx.lineTo(-4, 0); ctx.lineTo(-8, 8); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#e3f2fd"; ctx.lineWidth = 1.2; ctx.stroke(); ctx.globalAlpha = 0.55; ctx.strokeStyle = "#90caf9"; ctx.beginPath(); ctx.moveTo(-22, -5); ctx.lineTo(-8, 0); ctx.lineTo(-22, 5); ctx.stroke(); ctx.restore();
  }

  private renderBlade(ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number): void {
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(angle + this.life * 18);
    ctx.shadowColor = "#cfd8dc"; ctx.shadowBlur = 8; ctx.fillStyle = "#cfd8dc"; ctx.strokeStyle = "#607d8b"; ctx.lineWidth = 1.5;
    for (let i = 0; i < 2; i++) { ctx.rotate(Math.PI); ctx.beginPath(); ctx.moveTo(0, -13); ctx.quadraticCurveTo(10, -2, 2, 13); ctx.lineTo(-4, 5); ctx.quadraticCurveTo(2, 0, -4, -5); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  private renderSpearBeam(ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number): void {
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(angle); ctx.shadowColor = "#ffb74d"; ctx.shadowBlur = 12;
    const alpha = Math.max(0.15, 1 - this.life / this.maxLife); ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(255,183,77,0.72)"; ctx.beginPath(); ctx.moveTo(64, 0); ctx.lineTo(-46, -11); ctx.lineTo(-28, 0); ctx.lineTo(-46, 11); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#fff3e0"; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-52, 0); ctx.lineTo(68, 0); ctx.stroke(); ctx.restore();
  }

  private renderSwordWave(ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number): void {
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(angle); const alpha = Math.max(0.18, 1 - this.life / this.maxLife); ctx.globalAlpha = alpha;
    ctx.shadowColor = "#90caf9"; ctx.shadowBlur = 14; ctx.strokeStyle = "#e3f2fd"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 24, -0.95, 0.95); ctx.stroke();
    ctx.strokeStyle = "#42a5f5"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 17, -0.85, 0.85); ctx.stroke(); ctx.restore();
  }

  private renderShockwave(ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number): void {
    const alpha = Math.max(0, 1 - this.life / this.maxLife); ctx.save(); ctx.translate(sx, sy); ctx.rotate(angle);
    ctx.globalAlpha = 0.72 * alpha; ctx.strokeStyle = "#bc8f5a"; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(0, 0, 24 + this.life * 74, 11 + this.life * 32, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 0.28 * alpha; ctx.fillStyle = "#8d6e63"; ctx.beginPath(); ctx.ellipse(0, 0, 21 + this.life * 68, 8 + this.life * 26, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  private renderHammerShock(ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number, sprite?: HTMLImageElement | null): void {
    const alpha = Math.max(0, 1 - this.life / this.maxLife); ctx.save();
    ctx.globalAlpha = 0.18 * alpha; ctx.strokeStyle = "#bc8f5a"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(sx, sy, 12 + this.life * 46, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 0.9; ctx.translate(sx, sy); ctx.rotate(angle + this.life * 4);
    if (sprite) ctx.drawImage(sprite, -15, -15, 30, 30);
    else { ctx.fillStyle = "#9e9e9e"; ctx.strokeStyle = "#4e342e"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#6d4c41"; ctx.fillRect(-3, 4, 6, 18); }
    ctx.restore();
  }
}

function square(n: number): number { return n * n; }

function distanceSq(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

function distToSegmentSq(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const vx = bx - ax;
  const vy = by - ay;
  const wx = px - ax;
  const wy = py - ay;
  const lenSq = vx * vx + vy * vy || 1;
  const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / lenSq));
  const cx = ax + vx * t;
  const cy = ay + vy * t;
  return distanceSq(px, py, cx, cy);
}
