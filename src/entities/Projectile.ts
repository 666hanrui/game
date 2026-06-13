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
    const headColor = this.fromEnemy ? "#ff8a80" : "#fff9c4";

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(angle);

    // 拖尾
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

    // 箭身
    ctx.fillStyle = color;
    ctx.fillRect(-9, -1.5, 14, 3);

    // 箭头
    ctx.fillStyle = headColor;
    ctx.beginPath();
    ctx.moveTo(7, -4);
    ctx.lineTo(13, 0);
    ctx.lineTo(7, 4);
    ctx.closePath();
    ctx.fill();

    // 中心亮点
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillRect(-4, -0.6, 8, 1.2);

    ctx.restore();
  }
}
