export type PauseAction = "resume" | "main_menu" | "settle";

export interface PauseStats {
  wave: number;
  kills: number;
  level: number;
  bossKills: number;
  raceName?: string;
  schoolName?: string;
  weaponName?: string;
}

export class PausePanel {
  private resumeRect = { x: 0, y: 0, w: 220, h: 44 };
  private settleRect = { x: 0, y: 0, w: 220, h: 44 };
  private menuRect = { x: 0, y: 0, w: 220, h: 44 };

  handleClick(cx: number, cy: number): PauseAction | null {
    if (this.inRect(cx, cy, this.resumeRect)) return "resume";
    if (this.inRect(cx, cy, this.settleRect)) return "settle";
    if (this.inRect(cx, cy, this.menuRect)) return "main_menu";
    return null;
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number, stats: PauseStats): void {
    ctx.fillStyle = "rgba(0,0,0,0.72)";
    ctx.fillRect(0, 0, w, h);

    const panelW = 360;
    const panelH = 360;
    const x = w / 2 - panelW / 2;
    const y = h / 2 - panelH / 2;

    ctx.fillStyle = "#151525";
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 2;
    this.roundRect(ctx, x, y, panelW, panelH, 14);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffeb3b";
    ctx.font = "bold 28px monospace";
    ctx.fillText("暂停", w / 2, y + 48);

    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = "12px monospace";
    ctx.fillText("Esc 继续 / 暂停", w / 2, y + 72);

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    this.roundRect(ctx, x + 34, y + 92, panelW - 68, 86, 10);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.font = "12px monospace";
    ctx.fillStyle = "#ccc";
    ctx.fillText(`种族：${stats.raceName ?? "未选择"}`, x + 54, y + 118);
    ctx.fillText(`路线：${[stats.schoolName, stats.weaponName].filter(Boolean).join(" · ") || "未选择"}`, x + 54, y + 140);
    ctx.fillText(`波次 ${stats.wave}  ·  击杀 ${stats.kills}  ·  等级 ${stats.level}  ·  Boss ${stats.bossKills}`, x + 54, y + 162);

    this.resumeRect = { x: w / 2 - 110, y: y + 205, w: 220, h: 44 };
    this.settleRect = { x: w / 2 - 110, y: y + 260, w: 220, h: 44 };
    this.menuRect = { x: w / 2 - 110, y: y + 315, w: 220, h: 44 };

    this.drawButton(ctx, this.resumeRect, "继续游戏", "#42a5f5", "rgba(66,165,245,0.12)");
    this.drawButton(ctx, this.settleRect, "结算并结束", "#ffeb3b", "rgba(255,235,59,0.12)");
    this.drawButton(ctx, this.menuRect, "返回主菜单", "#ef9a9a", "rgba(239,83,80,0.10)");
  }

  private drawButton(ctx: CanvasRenderingContext2D, r: { x: number; y: number; w: number; h: number }, text: string, color: string, fill: string): void {
    ctx.fillStyle = fill;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, r.x, r.y, r.w, r.h, 9);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = "bold 15px monospace";
    ctx.textAlign = "center";
    ctx.fillText(text, r.x + r.w / 2, r.y + 28);
  }

  private inRect(cx: number, cy: number, r: { x: number; y: number; w: number; h: number }): boolean {
    return cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h;
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
