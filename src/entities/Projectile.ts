import { vec2, Vec2 } from "../utils/math";

export class Projectile {
  pos: Vec2;
  vel: Vec2;
  fromEnemy: boolean;
  damage: number;
  alive = true;
  private maxLife = 3;
  private life = 0;

  constructor(x: number, y: number, vx: number, vy: number, fromEnemy: boolean, damage: number) {
    this.pos = vec2(x, y);
    this.vel = vec2(vx, vy);
    this.fromEnemy = fromEnemy;
    this.damage = damage;
  }

  update(dt: number): void {
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    this.life += dt;
    if (this.life > this.maxLife) { this.alive = false; }
  }

  renderAt(ctx: CanvasRenderingContext2D, sx: number, sy: number): void {
    const angle = Math.atan2(this.vel.y, this.vel.x);
    const color = this.fromEnemy ? "#ef5350" : "#ffeb3b";

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(angle);

    // 箭身
    ctx.fillStyle = color;
    ctx.fillRect(-8, -1.5, 12, 3);

    // 箭头（三角形）
    ctx.fillStyle = this.fromEnemy ? "#ff8a80" : "#fff9c4";
    ctx.beginPath();
    ctx.moveTo(6, -3);
    ctx.lineTo(10, 0);
    ctx.lineTo(6, 3);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
