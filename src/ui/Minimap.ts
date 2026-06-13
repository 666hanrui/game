import type { Vec2 } from "../utils/math";

export interface MinimapEnemy {
  pos: Vec2;
  role?: string;
}

export interface MinimapPickup {
  pos: Vec2;
  type: string;
}

export interface MinimapData {
  worldW: number;
  worldH: number;
  screenW: number;
  screenH: number;
  cameraPos: Vec2;
  playerPos: Vec2;
  enemies: MinimapEnemy[];
  pickups: MinimapPickup[];
}

export class Minimap {
  render(ctx: CanvasRenderingContext2D, data: MinimapData): void {
    const size = 154;
    const pad = 16;
    const x = ctx.canvas.width - size - pad;
    const y = ctx.canvas.height - size - pad;
    const sx = size / data.worldW;
    const sy = size / data.worldH;

    ctx.save();

    ctx.fillStyle = "rgba(0,0,0,0.44)";
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    this.roundRect(ctx, x, y, size, size, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fillRect(x + 8, y + 8, size - 16, size - 16);

    // 当前屏幕视野框
    const viewLeft = data.cameraPos.x - data.screenW / 2;
    const viewTop = data.cameraPos.y - data.screenH / 2;
    ctx.strokeStyle = "rgba(255,255,255,0.42)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + viewLeft * sx, y + viewTop * sy, data.screenW * sx, data.screenH * sy);

    // 掉落物
    for (const p of data.pickups.slice(0, 80)) {
      const px = x + p.pos.x * sx;
      const py = y + p.pos.y * sy;
      ctx.fillStyle = p.type === "health" ? "#66bb6a" : "#42a5f5";
      ctx.globalAlpha = 0.78;
      ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
    }

    // 敌人
    ctx.globalAlpha = 0.95;
    for (const e of data.enemies.slice(0, 140)) {
      const px = x + e.pos.x * sx;
      const py = y + e.pos.y * sy;
      const boss = e.role === "boss";
      const elite = e.role === "elite";
      ctx.fillStyle = boss ? "#ffeb3b" : elite ? "#ef5350" : "#ff8a65";
      ctx.beginPath();
      ctx.arc(px, py, boss ? 3.4 : elite ? 2.7 : 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 玩家
    const playerX = x + data.playerPos.x * sx;
    const playerY = y + data.playerPos.y * sy;
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#4fc3f7";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(playerX, playerY, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.font = "10px monospace";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText("MAP", x + 10, y + 18);

    ctx.restore();
  }

  renderBoundaryWarning(ctx: CanvasRenderingContext2D, playerPos: Vec2, worldW: number, worldH: number): void {
    const margin = 180;
    const parts: string[] = [];
    if (playerPos.x < margin) parts.push("左侧边界");
    if (worldW - playerPos.x < margin) parts.push("右侧边界");
    if (playerPos.y < margin) parts.push("上方边界");
    if (worldH - playerPos.y < margin) parts.push("下方边界");
    if (parts.length <= 0) return;

    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "bold 13px monospace";
    ctx.fillStyle = "rgba(0,0,0,0.42)";
    ctx.fillRect(ctx.canvas.width / 2 - 150, 138, 300, 30);
    ctx.strokeStyle = "rgba(255,183,77,0.65)";
    ctx.strokeRect(ctx.canvas.width / 2 - 150, 138, 300, 30);
    ctx.fillStyle = "#ffb74d";
    ctx.fillText(`接近${parts.join(" / ")}`, ctx.canvas.width / 2, 158);
    ctx.restore();
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
}
