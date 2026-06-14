export type PlaceholderHubPanelAction = "back" | null;

interface Rect { x: number; y: number; w: number; h: number }

export interface PlaceholderHubPanelConfig {
  title: string;
  subtitle: string;
  icon: string;
  sections: {
    title: string;
    lines: string[];
  }[];
}

export class PlaceholderHubPanel {
  private backRect: Rect = { x: 0, y: 0, w: 110, h: 36 };

  constructor(private readonly config: PlaceholderHubPanelConfig) {}

  handleClick(cx: number, cy: number): PlaceholderHubPanelAction {
    if (this.inRect(cx, cy, this.backRect)) return "back";
    return null;
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.fillStyle = "#111118";
    ctx.fillRect(0, 0, w, h);

    this.backRect = { x: 22, y: 22, w: 110, h: 36 };
    this.drawButton(ctx, this.backRect, "返回", "rgba(255,255,255,0.08)", "rgba(255,255,255,0.2)", "#ddd");

    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.font = "bold 28px monospace";
    ctx.fillText(this.config.title, w / 2, 58);

    ctx.fillStyle = "rgba(255,255,255,0.42)";
    ctx.font = "12px monospace";
    ctx.fillText(this.config.subtitle, w / 2, 86);

    const panelW = Math.min(760, w - 64);
    const panelH = Math.min(520, h - 150);
    const x = w / 2 - panelW / 2;
    const y = 126;

    ctx.fillStyle = "rgba(255,255,255,0.055)";
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    this.roundRect(ctx, x, y, panelW, panelH, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.font = "bold 86px monospace";
    ctx.textAlign = "center";
    ctx.fillText(this.config.icon, x + panelW - 86, y + 108);

    let lineY = y + 48;
    ctx.textAlign = "left";
    for (const section of this.config.sections) {
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px monospace";
      ctx.fillText(section.title, x + 34, lineY);
      lineY += 28;

      ctx.fillStyle = "rgba(255,255,255,0.68)";
      ctx.font = "12px monospace";
      for (const line of section.lines) {
        this.wrapText(ctx, `· ${line}`, x + 44, lineY, panelW - 110, 18);
        lineY += Math.max(22, Math.ceil(ctx.measureText(line).width / Math.max(1, panelW - 110)) * 18);
      }
      lineY += 18;
    }

    ctx.fillStyle = "rgba(255,255,255,0.32)";
    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    ctx.fillText("这是营地建筑占位界面，后续会逐步替换成完整功能。", w / 2, y + panelH - 24);
  }

  private drawButton(ctx: CanvasRenderingContext2D, rect: Rect, text: string, fill: string, stroke: string, color: string, fontSize = 13): void {
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    this.roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText(text, rect.x + rect.w / 2, rect.y + rect.h / 2 + fontSize * 0.35);
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number): void {
    let line = "";
    let lineY = y;
    for (const char of text) {
      const test = line + char;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, lineY);
        line = char;
        lineY += lineH;
      } else line = test;
    }
    if (line) ctx.fillText(line, x, lineY);
  }

  private inRect(cx: number, cy: number, r: Rect): boolean {
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
