import { vec2, Vec2 } from "../utils/math";

export type PickupType = "xp" | "health";

export class Pickup {
  pos: Vec2;
  type: PickupType;
  value: number;
  alive = true;
  private life = 0;

  constructor(x: number, y: number, type: PickupType, value: number) {
    this.pos = vec2(x, y);
    this.type = type;
    this.value = value;
  }

  update(dt: number): void {
    this.life += dt;
    if (this.life > 30) this.alive = false;
  }

  renderAt(ctx: CanvasRenderingContext2D, sx: number, sy: number): void {
    const bob = Math.sin(this.life * 4) * 2;
    const pulse = 1 + Math.sin(this.life * 5) * 0.08;
    const by = sy + bob;
    const main = this.type === "xp" ? "#42a5f5" : "#66bb6a";
    const light = this.type === "xp" ? "#e3f2fd" : "#e8f5e9";
    const stroke = this.type === "xp" ? "#90caf9" : "#a5d6a7";

    ctx.save();
    ctx.translate(sx, by);
    ctx.scale(pulse, pulse);

    // 光晕
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 18);
    glow.addColorStop(0, main + "aa");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();

    // 菱形主体
    ctx.fillStyle = main;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(7, 0);
    ctx.lineTo(0, 7);
    ctx.lineTo(-7, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();

    // 中心亮点
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.arc(0, 0, this.type === "xp" ? 2.3 : 2.6, 0, Math.PI * 2);
    ctx.fill();

    if (this.type === "health") {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-3.5, 0);
      ctx.lineTo(3.5, 0);
      ctx.moveTo(0, -3.5);
      ctx.lineTo(0, 3.5);
      ctx.stroke();
    }

    ctx.restore();
  }
}
