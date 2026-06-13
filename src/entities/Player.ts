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

    // 外圈光晕，让角色从深色背景里跳出来
    const glow = ctx.createRadialGradient(sx, sy, 2, sx, sy, this.radius + 18);
    glow.addColorStop(0, color + "aa");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sx, sy, this.radius + 18, 0, Math.PI * 2);
    ctx.fill();

    // 瞄准辅助线
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx + Math.cos(angle) * (this.radius + 5), sy + Math.sin(angle) * (this.radius + 5));
    ctx.lineTo(sx + Math.cos(angle) * 48, sy + Math.sin(angle) * 48);
    ctx.stroke();

    // 弓
    ctx.strokeStyle = "#c8a96e";
    ctx.lineWidth = 3;
    ctx.beginPath();
    const bowR = this.radius + 6;
    const bowStart = angle - Math.PI + 0.55;
    const bowEnd = angle - Math.PI - 0.55;
    ctx.arc(sx, sy, bowR, bowStart, bowEnd, true);
    ctx.stroke();

    // 弓弦
    ctx.strokeStyle = "#f5f5f5";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx + Math.cos(bowStart) * bowR, sy + Math.sin(bowStart) * bowR);
    ctx.lineTo(sx + Math.cos(bowEnd) * bowR, sy + Math.sin(bowEnd) * bowR);
    ctx.stroke();

    // 箭搭在弓上
    ctx.strokeStyle = "#fff9c4";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx - Math.cos(angle) * 6, sy - Math.sin(angle) * 6);
    ctx.lineTo(sx + Math.cos(angle) * 24, sy + Math.sin(angle) * 24);
    ctx.stroke();

    // 身体
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 内部高光
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.beginPath();
    ctx.arc(sx - this.radius * 0.35, sy - this.radius * 0.35, this.radius * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // 方向指示器
    const tipX = sx + Math.cos(angle) * (this.radius + 3);
    const tipY = sy + Math.sin(angle) * (this.radius + 3);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(
      sx + Math.cos(angle - 2.25) * 10,
      sy + Math.sin(angle - 2.25) * 10,
    );
    ctx.lineTo(
      sx + Math.cos(angle + 2.25) * 10,
      sy + Math.sin(angle + 2.25) * 10,
    );
    ctx.closePath();
    ctx.fill();
  }
}
