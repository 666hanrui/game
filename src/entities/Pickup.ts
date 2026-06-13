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

  renderAt(ctx: CanvasRenderingContext2D, sx: number, sy: number, sprite?: HTMLImageElement | null): void {
    if (this.type === "xp") {
      this.renderXP(ctx, sx, sy, sprite);
      return;
    }

    this.renderHealth(ctx, sx, sy, sprite);
  }

  private renderXP(ctx: CanvasRenderingContext2D, sx: number, sy: number, sprite?: HTMLImageElement | null): void {
    const bob = Math.sin(this.life * 3.2) * 0.8;
    const by = sy + bob;

    ctx.save();
    ctx.translate(sx, by);

    if (sprite) {
      ctx.drawImage(sprite, -6, -6, 12, 12);
      ctx.restore();
      return;
    }

    // 经验只做成小蓝色菱形晶体，不做大光圈，避免和怪物混淆。
    ctx.fillStyle = "#2196f3";
    ctx.strokeStyle = "#90caf9";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(5, 0);
    ctx.lineTo(0, 6);
    ctx.lineTo(-5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "rgba(227,242,253,0.55)";
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(0, -4.5);
    ctx.lineTo(0, 4.5);
    ctx.moveTo(-3.5, 0);
    ctx.lineTo(3.5, 0);
    ctx.stroke();

    ctx.restore();
  }

  private renderHealth(ctx: CanvasRenderingContext2D, sx: number, sy: number, sprite?: HTMLImageElement | null): void {
    const bob = Math.sin(this.life * 4) * 1.4;
    const pulse = 1 + Math.sin(this.life * 5) * 0.04;
    const by = sy + bob;

    ctx.save();
    ctx.translate(sx, by);
    ctx.scale(pulse, pulse);

    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 14);
    glow.addColorStop(0, "#66bb6aaa");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();

    if (sprite) {
      ctx.drawImage(sprite, -9, -9, 18, 18);
      ctx.restore();
      return;
    }

    ctx.fillStyle = "#66bb6a";
    ctx.strokeStyle = "#a5d6a7";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(8, 0);
    ctx.lineTo(0, 8);
    ctx.lineTo(-8, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-3.5, 0);
    ctx.lineTo(3.5, 0);
    ctx.moveTo(0, -3.5);
    ctx.lineTo(0, 3.5);
    ctx.stroke();

    ctx.restore();
  }
}
