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
    const by = sy + bob;

    ctx.save();
    ctx.translate(sx, by);

    if (this.type === "xp") {
      // 蓝色菱形
      ctx.fillStyle = "#42a5f5";
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(6, 0);
      ctx.lineTo(0, 6);
      ctx.lineTo(-6, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#90caf9";
      ctx.lineWidth = 1;
      ctx.stroke();
      // 中心亮点
      ctx.fillStyle = "#e3f2fd";
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 绿色菱形（血包）
      ctx.fillStyle = "#66bb6a";
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(6, 0);
      ctx.lineTo(0, 6);
      ctx.lineTo(-6, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#a5d6a7";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
  }
}
