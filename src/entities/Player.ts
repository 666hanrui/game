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
    raceId = "human",
  ): void {
    const angle = Math.atan2(aimDir.y, aimDir.x);
    const visualRaceId = this.resolveRaceId(raceId, color);

    const glow = ctx.createRadialGradient(sx, sy, 2, sx, sy, this.radius + 28);
    glow.addColorStop(0, color + "cc");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sx, sy, this.radius + 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx + Math.cos(angle) * (this.radius + 6), sy + Math.sin(angle) * (this.radius + 6));
    ctx.lineTo(sx + Math.cos(angle) * 54, sy + Math.sin(angle) * 54);
    ctx.stroke();

    this.renderRaceBody(ctx, sx, sy, angle, color, visualRaceId, raceSprite);
    this.renderWeapon(ctx, sx, sy, angle, weaponId, weaponSprite);

    const tipX = sx + Math.cos(angle) * (this.radius + 18);
    const tipY = sy + Math.sin(angle) * (this.radius + 18);
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(sx + Math.cos(angle - 2.25) * 9, sy + Math.sin(angle - 2.25) * 9);
    ctx.lineTo(sx + Math.cos(angle + 2.25) * 9, sy + Math.sin(angle + 2.25) * 9);
    ctx.closePath();
    ctx.fill();
  }

  private resolveRaceId(raceId: string, color: string): string {
    if (raceId !== "human") return raceId;
    switch (color.toLowerCase()) {
      case "#8bc34a": return "goblin";
      case "#81c784": return "elf";
      case "#ff7043": return "orc";
      case "#ce93d8": return "spirit";
      default: return "human";
    }
  }

  private renderRaceBody(
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    angle: number,
    color: string,
    raceId: string,
    raceSprite?: HTMLImageElement | null,
  ): void {
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(angle);

    const body = this.radius;
    const outline = "rgba(255,255,255,0.82)";
    const dark = "rgba(8,10,18,0.72)";

    if (raceId === "spirit") {
      ctx.globalAlpha = 0.82;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, -body * 0.35, body * 0.72, Math.PI, 0);
      ctx.lineTo(body * 0.55, body * 0.52);
      ctx.quadraticCurveTo(body * 0.25, body * 0.28, 0, body * 0.58);
      ctx.quadraticCurveTo(-body * 0.25, body * 0.28, -body * 0.55, body * 0.52);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = outline;
      ctx.lineWidth = 2;
      ctx.stroke();
      this.drawEyePair(ctx, body, "#ffffff");
      ctx.restore();
      return;
    }

    ctx.fillStyle = dark;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(0, body * 0.2, body * 0.72, body * 0.92, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, body * 0.16, body * 0.54, body * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();

    const headScale = raceId === "orc" ? 0.72 : raceId === "goblin" ? 0.62 : 0.58;
    ctx.fillStyle = color;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(body * 0.18, -body * 0.62, body * headScale, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (raceId === "elf") this.renderElfMarks(ctx, body, color);
    else if (raceId === "goblin") this.renderGoblinMarks(ctx, body, color);
    else if (raceId === "orc") this.renderOrcMarks(ctx, body, color);
    else this.renderHumanMarks(ctx, body);

    this.drawEyePair(ctx, body, raceId === "orc" ? "#fff3e0" : "#ffffff");

    if (raceSprite) {
      ctx.save();
      ctx.rotate(-angle);
      const size = Math.max(12, body * 0.95);
      ctx.globalAlpha = 0.36;
      ctx.drawImage(raceSprite, -size / 2, -size / 2 + body * 0.18, size, size);
      ctx.restore();
    }

    ctx.restore();
  }

  private renderHumanMarks(ctx: CanvasRenderingContext2D, body: number): void {
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-body * 0.4, body * 0.05);
    ctx.lineTo(body * 0.45, body * 0.05);
    ctx.stroke();
  }

  private renderElfMarks(ctx: CanvasRenderingContext2D, body: number, color: string): void {
    ctx.fillStyle = color;
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 1.8;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(-body * 0.12, -body * 0.62 + side * body * 0.08);
      ctx.lineTo(-body * 0.72, -body * 0.88 + side * body * 0.22);
      ctx.lineTo(-body * 0.24, -body * 0.34 + side * body * 0.04);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.strokeStyle = "#dcedc8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-body * 0.16, body * 0.08, body * 0.46, -0.8, 0.8);
    ctx.stroke();
  }

  private renderGoblinMarks(ctx: CanvasRenderingContext2D, body: number, color: string): void {
    ctx.fillStyle = color;
    ctx.strokeStyle = "rgba(255,255,255,0.72)";
    ctx.lineWidth = 1.8;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(-body * 0.1, -body * 0.6);
      ctx.lineTo(-body * 0.86, -body * 0.54 + side * body * 0.36);
      ctx.lineTo(-body * 0.16, -body * 0.2 + side * body * 0.12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(0,0,0,0.32)";
    ctx.fillRect(-body * 0.48, body * 0.36, body * 0.9, body * 0.18);
  }

  private renderOrcMarks(ctx: CanvasRenderingContext2D, body: number, color: string): void {
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(body * 0.36, -body * 0.36 + side * body * 0.2);
      ctx.lineTo(body * 0.72, -body * 0.24 + side * body * 0.18);
      ctx.lineTo(body * 0.36, -body * 0.16 + side * body * 0.12);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-body * 0.54, body * 0.12);
    ctx.lineTo(body * 0.48, body * 0.12);
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  private drawEyePair(ctx: CanvasRenderingContext2D, body: number, eyeColor: string): void {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath();
    ctx.arc(body * 0.34, -body * 0.76, body * 0.13, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(body * 0.46, -body * 0.48, body * 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.arc(body * 0.36, -body * 0.77, body * 0.055, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(body * 0.48, -body * 0.49, body * 0.045, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderWeapon(ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number, weaponId: string, weaponSprite?: HTMLImageElement | null): void {
    if (weaponSprite) {
      const x = sx + Math.cos(angle) * (this.radius + 17);
      const y = sy + Math.sin(angle) * (this.radius + 17);
      const size = weaponId === "staff" ? 36 : weaponId === "spear" ? 40 : 30;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.drawImage(weaponSprite, -size / 2, -size / 2, size, size);
      ctx.restore();
      return;
    }

    if (weaponId === "wand") return this.renderWand(ctx, sx, sy, angle, 22, "#ce93d8");
    if (weaponId === "staff") return this.renderWand(ctx, sx, sy, angle, 34, "#ab47bc");
    if (weaponId === "flying_blade") return this.renderBladeHands(ctx, sx, sy, angle);
    if (weaponId === "energy_core" || weaponId === "drone_core") return this.renderCore(ctx, sx, sy, angle, weaponId);
    return this.renderBow(ctx, sx, sy, angle);
  }

  private renderBow(ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number): void {
    ctx.strokeStyle = "#c8a96e";
    ctx.lineWidth = 3;
    ctx.beginPath();
    const bowR = this.radius + 9;
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
    ctx.lineTo(sx + Math.cos(angle) * 30, sy + Math.sin(angle) * 30);
    ctx.stroke();
  }

  private renderWand(ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number, len: number, color: string): void {
    const x1 = sx - Math.cos(angle) * 6;
    const y1 = sy - Math.sin(angle) * 6;
    const x2 = sx + Math.cos(angle) * len;
    const y2 = sy + Math.sin(angle) * len;
    ctx.strokeStyle = "#6d4c41";
    ctx.lineWidth = len > 24 ? 4 : 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    const glow = ctx.createRadialGradient(x2, y2, 1, x2, y2, 16);
    glow.addColorStop(0, color + "ee");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x2, y2, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x2, y2, len > 24 ? 5 : 4, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderBladeHands(ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number): void {
    for (const side of [-1, 1]) {
      const px = sx + Math.cos(angle + side * 1.7) * (this.radius + 7);
      const py = sy + Math.sin(angle + side * 1.7) * (this.radius + 7);
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle + side * 0.6);
      ctx.fillStyle = "#cfd8dc";
      ctx.strokeStyle = "#78909c";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(0, -6);
      ctx.lineTo(-10, 0);
      ctx.lineTo(0, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  private renderCore(ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number, weaponId: string): void {
    const x = sx + Math.cos(angle) * (this.radius + 16);
    const y = sy + Math.sin(angle) * (this.radius + 16);
    const color = weaponId === "drone_core" ? "#42a5f5" : "#4dd0e1";
    const glow = ctx.createRadialGradient(x, y, 1, x, y, 20);
    glow.addColorStop(0, color + "cc");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#e0f7fa";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
