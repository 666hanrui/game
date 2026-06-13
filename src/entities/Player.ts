import { vec2, Vec2 } from "../utils/math";
import { Input } from "../core/Input";
import { Projectile } from "./Projectile";

export class Player {
  pos: Vec2;
  radius = 16;
  speed = 260;
  hp = 100;
  maxHp = 100;
  damage = 25;
  attackCooldown = 0.4;
  invulnerableUntil = 0;
  projectileExtra = 0;
  critChance = 0;
  critMultiplier = 1.5;

  constructor(x: number, y: number) {
    this.pos = vec2(x, y);
  }

  update(dt: number, input: Input, worldW: number, worldH: number): void {
    const move = input.state.moveDir;
    this.pos.x += move.x * this.speed * dt;
    this.pos.y += move.y * this.speed * dt;
    this.pos.x = Math.max(this.radius, Math.min(worldW - this.radius, this.pos.x));
    this.pos.y = Math.max(this.radius, Math.min(worldH - this.radius, this.pos.y));
  }

  shoot(aimDir: Vec2): Projectile {
    return new Projectile(this.pos.x, this.pos.y, aimDir.x * 600, aimDir.y * 600, false, this.damage);
  }

  renderAt(
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    aimDir: Vec2,
    color: string,
    weaponId = "bow",
    raceSprite?: HTMLImageElement | null,
    weaponSprite?: HTMLImageElement | null,
  ): void {
    const angle = Math.atan2(aimDir.y, aimDir.x);

    const glow = ctx.createRadialGradient(sx, sy, 2, sx, sy, this.radius + 18);
    glow.addColorStop(0, color + "aa");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sx, sy, this.radius + 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx + Math.cos(angle) * (this.radius + 5), sy + Math.sin(angle) * (this.radius + 5));
    ctx.lineTo(sx + Math.cos(angle) * 48, sy + Math.sin(angle) * 48);
    ctx.stroke();

    this.renderWeapon(ctx, sx, sy, angle, weaponId, weaponSprite);

    if (raceSprite) {
      const size = this.radius * 2.65;
      ctx.drawImage(raceSprite, sx - size / 2, sy - size / 2, size, size);
    } else {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.28)";
      ctx.beginPath();
      ctx.arc(sx - this.radius * 0.35, sy - this.radius * 0.35, this.radius * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    const tipX = sx + Math.cos(angle) * (this.radius + 3);
    const tipY = sy + Math.sin(angle) * (this.radius + 3);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(sx + Math.cos(angle - 2.25) * 10, sy + Math.sin(angle - 2.25) * 10);
    ctx.lineTo(sx + Math.cos(angle + 2.25) * 10, sy + Math.sin(angle + 2.25) * 10);
    ctx.closePath();
    ctx.fill();
  }

  private renderWeapon(ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number, weaponId: string, weaponSprite?: HTMLImageElement | null): void {
    if (weaponSprite) {
      const x = sx + Math.cos(angle) * (this.radius + 12);
      const y = sy + Math.sin(angle) * (this.radius + 12);
      const size = weaponId === "staff" ? 30 : weaponId === "spear" ? 34 : 26;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.drawImage(weaponSprite, -size / 2, -size / 2, size, size);
      ctx.restore();
      return;
    }

    if (weaponId === "wand") return this.renderWand(ctx, sx, sy, angle, 18, "#ce93d8");
    if (weaponId === "staff") return this.renderWand(ctx, sx, sy, angle, 28, "#ab47bc");
    if (weaponId === "flying_blade") return this.renderBladeHands(ctx, sx, sy, angle);
    if (weaponId === "energy_core" || weaponId === "drone_core") return this.renderCore(ctx, sx, sy, angle, weaponId);
    return this.renderBow(ctx, sx, sy, angle);
  }

  private renderBow(ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number): void {
    ctx.strokeStyle = "#c8a96e";
    ctx.lineWidth = 3;
    ctx.beginPath();
    const bowR = this.radius + 6;
    const bowStart = angle - Math.PI + 0.55;
    const bowEnd = angle - Math.PI - 0.55;
    ctx.arc(sx, sy, bowR, bowStart, bowEnd, true);
    ctx.stroke();

    ctx.strokeStyle = "#f5f5f5";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx + Math.cos(bowStart) * bowR, sy + Math.sin(bowStart) * bowR);
    ctx.lineTo(sx + Math.cos(bowEnd) * bowR, sy + Math.sin(bowEnd) * bowR);
    ctx.stroke();

    ctx.strokeStyle = "#fff9c4";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx - Math.cos(angle) * 6, sy - Math.sin(angle) * 6);
    ctx.lineTo(sx + Math.cos(angle) * 24, sy + Math.sin(angle) * 24);
    ctx.stroke();
  }

  private renderWand(ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number, len: number, color: string): void {
    const x1 = sx - Math.cos(angle) * 6;
    const y1 = sy - Math.sin(angle) * 6;
    const x2 = sx + Math.cos(angle) * len;
    const y2 = sy + Math.sin(angle) * len;
    ctx.strokeStyle = "#6d4c41";
    ctx.lineWidth = len > 20 ? 4 : 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    const glow = ctx.createRadialGradient(x2, y2, 1, x2, y2, 14);
    glow.addColorStop(0, color + "ee");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x2, y2, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x2, y2, len > 20 ? 5 : 4, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderBladeHands(ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number): void {
    for (const side of [-1, 1]) {
      const px = sx + Math.cos(angle + side * 1.7) * (this.radius + 4);
      const py = sy + Math.sin(angle + side * 1.7) * (this.radius + 4);
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle + side * 0.6);
      ctx.fillStyle = "#cfd8dc";
      ctx.strokeStyle = "#78909c";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(0, -5);
      ctx.lineTo(-8, 0);
      ctx.lineTo(0, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  private renderCore(ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number, weaponId: string): void {
    const x = sx + Math.cos(angle) * (this.radius + 10);
    const y = sy + Math.sin(angle) * (this.radius + 10);
    const color = weaponId === "drone_core" ? "#42a5f5" : "#4dd0e1";
    const glow = ctx.createRadialGradient(x, y, 1, x, y, 18);
    glow.addColorStop(0, color + "cc");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#e0f7fa";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
