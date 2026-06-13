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

  renderAt(ctx: CanvasRenderingContext2D, sx: number, sy: number, aimDir: Vec2, color: string): void {
    const angle = Math.atan2(aimDir.y, aimDir.x);

    // 弓（身体后方的弧形）
    ctx.strokeStyle = "#c8a96e";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const bowR = this.radius + 4;
    const bowStart = angle - Math.PI + 0.5;
    const bowEnd = angle - Math.PI - 0.5;
    ctx.arc(sx, sy, bowR, bowStart, bowEnd);
    ctx.stroke();

    // 弓弦
    ctx.strokeStyle = "#ddd";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(sx + Math.cos(bowStart) * bowR, sy + Math.sin(bowStart) * bowR);
    ctx.lineTo(sx + Math.cos(bowEnd) * bowR, sy + Math.sin(bowEnd) * bowR);
    ctx.stroke();

    // 身体（种族颜色圆形）
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 方向指示器（三角形指向瞄准方向）
    const tipX = sx + Math.cos(angle) * (this.radius + 2);
    const tipY = sy + Math.sin(angle) * (this.radius + 2);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(
      sx + Math.cos(angle - 2.2) * 10,
      sy + Math.sin(angle - 2.2) * 10,
    );
    ctx.lineTo(
      sx + Math.cos(angle + 2.2) * 10,
      sy + Math.sin(angle + 2.2) * 10,
    );
    ctx.closePath();
    ctx.fill();
  }
}
