import { vec2, Vec2 } from "../utils/math";

export type ProjectileKind = "arrow" | "magic" | "heavy_magic" | "energy" | "blade" | "drone" | "hammer";

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
    if (kind === "hammer") this.maxLife = 1.15;
  }

  get hitRadius(): number {
    switch (this.kind) {
      case "hammer": return 15;
      case "heavy_magic": return 11;
      case "energy": return 8;
      case "blade": return 9;
      case "magic": return 7;
      case "drone": return 6;
      default: return 5;
    }
  }

  update(dt: number): void {
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    this.life += dt;
    if (this.life > this.maxLife) this.alive = false;
  }

  renderAt(ctx: CanvasRenderingContext2D, sx: number, sy: number, sprite?: HTMLImageElement | null): void {
    const angle = Math.atan2(this.vel.y, this.vel.x);
    if (sprite && this.kind !== "hammer") return this.renderSprite(ctx, sx, sy, angle, sprite);
    if (this.kind === "magic") return this.renderOrb(ctx, sx, sy, "#ce93d8", "#f3e5f5", 6);
    if (this.kind === "heavy_magic") return this.renderOrb(ctx, sx, sy, "#ab47bc", "#e1bee7", 9);
    if (this.kind === "energy") return this.renderEnergy(ctx, sx, sy, angle);
    if (this.kind === "blade") return this.renderBlade(ctx, sx, sy, angle);
    if (this.kind === "drone") return this.renderOrb(ctx, sx, sy, "#42a5f5", "#e3f2fd", 5);
    if (this.kind === "hammer") return this.renderHammerShock(ctx, sx, sy, angle, sprite);
    return this.renderArrow(ctx, sx, sy, angle);
  }

  private renderSprite(ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number, sprite: HTMLImageElement): void {
    const size = Math.max(16, this.hitRadius * 3.4);
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(angle);
    if (this.fromEnemy) ctx.globalAlpha = 0.9;
    ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
    ctx.restore();
  }

  private renderArrow(ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number): void {
    const color = this.fromEnemy ? "#ef5350" : "#ffeb3b";
    const headColor = this.fromEnemy ? "#ff8a80" : "#fff9c4";

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(angle);

    const trail = ctx.createLinearGradient(-28, 0, 6, 0);
    trail.addColorStop(0, "rgba(255,255,255,0)");
    trail.addColorStop(1, color + "aa");
    ctx.fillStyle = trail;
    ctx.beginPath();
    ctx.moveTo(-28, -3);
    ctx.lineTo(4, -1.5);
    ctx.lineTo(4, 1.5);
    ctx.lineTo(-28, 3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = color;
    ctx.fillRect(-9, -1.5, 14, 3);

    ctx.fillStyle = headColor;
    ctx.beginPath();
    ctx.moveTo(7, -4);
    ctx.lineTo(13, 0);
    ctx.lineTo(7, 4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillRect(-4, -0.6, 8, 1.2);
    ctx.restore();
  }

  private renderOrb(ctx: CanvasRenderingContext2D, sx: number, sy: number, color: string, core: string, radius: number): void {
    const pulse = 1 + Math.sin(this.life * 18) * 0.08;
    const glow = ctx.createRadialGradient(sx, sy, 1, sx, sy, radius * 4);
    glow.addColorStop(0, color + "bb");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sx, sy, radius * 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(sx, sy, radius * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(sx - radius * 0.25, sy - radius * 0.25, radius * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderEnergy(ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number): void {
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(angle);

    const trail = ctx.createLinearGradient(-24, 0, 10, 0);
    trail.addColorStop(0, "rgba(77,208,225,0)");
    trail.addColorStop(1, "rgba(77,208,225,0.9)");
    ctx.fillStyle = trail;
    ctx.beginPath();
    ctx.moveTo(-24, -5);
    ctx.lineTo(10, 0);
    ctx.lineTo(-24, 5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#4dd0e1";
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(0, -7);
    ctx.lineTo(-10, 0);
    ctx.lineTo(0, 7);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#e0f7fa";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  private renderBlade(ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number): void {
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(angle + this.life * 16);

    ctx.fillStyle = "#cfd8dc";
    ctx.strokeStyle = "#78909c";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(7, 0);
    ctx.lineTo(0, 10);
    ctx.lineTo(-7, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private renderHammerShock(ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number, sprite?: HTMLImageElement | null): void {
    const alpha = Math.max(0, 1 - this.life / this.maxLife);
    ctx.save();

    ctx.globalAlpha = 0.18 * alpha;
    ctx.strokeStyle = "#bc8f5a";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(sx, sy, 12 + this.life * 46, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = 0.9;
    ctx.translate(sx, sy);
    ctx.rotate(angle + this.life * 4);

    if (sprite) {
      ctx.drawImage(sprite, -15, -15, 30, 30);
    } else {
      ctx.fillStyle = "#9e9e9e";
      ctx.strokeStyle = "#4e342e";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#6d4c41";
      ctx.fillRect(-3, 4, 6, 18);
    }

    ctx.restore();
  }
}
