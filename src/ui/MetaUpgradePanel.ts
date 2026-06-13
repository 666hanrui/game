import { MetaProgress, META_UPGRADES, MetaUpgradeDef, MetaUpgradeId } from "../systems/MetaProgress";

export class MetaUpgradePanel {
  private cardW = 230;
  private cardH = 126;
  private gap = 16;
  private cardRects: { x: number; y: number; w: number; h: number; id: MetaUpgradeId }[] = [];
  private backRect = { x: 0, y: 0, w: 110, h: 36 };
  private resetRect = { x: 0, y: 0, w: 118, h: 34 };
  private grant100Rect = { x: 0, y: 0, w: 118, h: 34 };
  private grant1000Rect = { x: 0, y: 0, w: 118, h: 34 };
  private feedbackText = "";
  private feedbackColor = "#ffeb3b";

  handleClick(cx: number, cy: number, meta: MetaProgress): "back" | "buy" | null {
    if (this.inRect(cx, cy, this.backRect)) return "back";

    if (this.inRect(cx, cy, this.grant100Rect)) {
      const total = meta.addSoulCrystals(100);
      this.feedbackText = `调试：已赠送 100 魂晶，当前 ${total}`;
      this.feedbackColor = "#81c784";
      return "buy";
    }

    if (this.inRect(cx, cy, this.grant1000Rect)) {
      const total = meta.addSoulCrystals(1000);
      this.feedbackText = `调试：已赠送 1000 魂晶，当前 ${total}`;
      this.feedbackColor = "#81c784";
      return "buy";
    }

    if (this.inRect(cx, cy, this.resetRect)) {
      meta.resetAll();
      this.feedbackText = "已清空本地存档";
      this.feedbackColor = "#ef9a9a";
      return "buy";
    }

    for (const r of this.cardRects) {
      if (!this.inRect(cx, cy, r)) continue;
      const result = meta.purchaseUpgrade(r.id);
      if (result.ok) {
        this.feedbackText = `${result.name} 升到 Lv.${result.level}，花费 ${result.spent}`;
        this.feedbackColor = "#81c784";
        return "buy";
      }

      if (result.reason === "魂晶不足") {
        this.feedbackText = `${result.name} 魂晶不足，还差 ${result.lack}`;
        this.feedbackColor = "#ffb74d";
      } else if (result.reason === "已满级") {
        this.feedbackText = `${result.name} 已经满级`;
        this.feedbackColor = "#81c784";
      } else {
        this.feedbackText = result.reason ?? "购买失败";
        this.feedbackColor = "#ef5350";
      }
      return null;
    }
    return null;
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number, meta: MetaProgress): void {
    this.cardRects = [];
    const soul = meta.getSoulCrystals();
    const levels = meta.getUpgradeLevels();
    const bonuses = meta.getBonuses();

    ctx.fillStyle = "#111118";
    ctx.fillRect(0, 0, w, h);

    this.backRect = { x: 22, y: 22, w: 110, h: 36 };
    this.drawButton(ctx, this.backRect, "返回", "rgba(255,255,255,0.08)", "rgba(255,255,255,0.2)", "#ddd");

    this.grant100Rect = { x: w - 142, y: 22, w: 120, h: 30 };
    this.grant1000Rect = { x: w - 142, y: 58, w: 120, h: 30 };
    this.resetRect = { x: w - 142, y: 94, w: 120, h: 30 };
    this.drawButton(ctx, this.grant100Rect, "+100 魂晶", "rgba(129,199,132,0.08)", "rgba(129,199,132,0.42)", "#a5d6a7", 11);
    this.drawButton(ctx, this.grant1000Rect, "+1000 魂晶", "rgba(129,199,132,0.08)", "rgba(129,199,132,0.42)", "#a5d6a7", 11);
    this.drawButton(ctx, this.resetRect, "清空存档", "rgba(239,83,80,0.08)", "rgba(239,83,80,0.42)", "#ef9a9a", 11);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 28px monospace";
    ctx.textAlign = "center";
    ctx.fillText("局外强化", w / 2, 58);

    ctx.fillStyle = "#ce93d8";
    ctx.font = "bold 16px monospace";
    ctx.fillText(`魂晶 ${soul}`, w / 2, 86);

    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "12px monospace";
    ctx.fillText("每次战败结算获得魂晶，用于永久强化下一局开局属性", w / 2, 112);

    if (this.feedbackText) {
      ctx.fillStyle = this.feedbackColor;
      ctx.font = "bold 13px monospace";
      ctx.fillText(this.feedbackText, w / 2, 134);
    }

    const cols = 2;
    const rows = Math.ceil(META_UPGRADES.length / cols);
    const totalW = cols * this.cardW + (cols - 1) * this.gap;
    const totalH = rows * this.cardH + (rows - 1) * this.gap;
    const sx = (w - totalW) / 2;
    const sy = Math.max(156, h / 2 - totalH / 2 + 30);

    for (let i = 0; i < META_UPGRADES.length; i++) {
      const def = META_UPGRADES[i];
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = sx + col * (this.cardW + this.gap);
      const y = sy + row * (this.cardH + this.gap);
      this.cardRects.push({ x, y, w: this.cardW, h: this.cardH, id: def.id });
      this.drawUpgradeCard(ctx, x, y, def, levels[def.id], meta.getUpgradeCost(def.id), soul);
    }

    const by = sy + totalH + 48;
    ctx.fillStyle = "rgba(255,255,255,0.09)";
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    this.roundRect(ctx, w / 2 - 250, by - 22, 500, 72, 10);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.font = "12px monospace";
    ctx.fillStyle = "#aaa";
    ctx.fillText(`当前永久加成：生命 +${bonuses.maxHp}`, w / 2 - 226, by);
    ctx.fillText(`伤害 +${bonuses.damage}`, w / 2 - 60, by);
    ctx.fillText(`移速 +${bonuses.speed}`, w / 2 + 60, by);
    ctx.fillText(`经验 x${bonuses.xpMultiplier.toFixed(2)}`, w / 2 + 172, by);

    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    ctx.fillText("右上角为开发调试按钮；点击强化卡片购买", w / 2, by + 28);
  }

  private drawUpgradeCard(ctx: CanvasRenderingContext2D, x: number, y: number, def: MetaUpgradeDef, level: number, cost: number, soul: number): void {
    const full = level >= def.maxLevel;
    const affordable = !full && soul >= cost;
    const color = full ? "#81c784" : affordable ? "#ffeb3b" : "#777";

    ctx.fillStyle = "#1a1a2e";
    ctx.strokeStyle = color;
    ctx.lineWidth = affordable ? 2.2 : 1.4;
    this.roundRect(ctx, x, y, this.cardW, this.cardH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px monospace";
    ctx.fillText(def.name, x + 16, y + 28);

    ctx.fillStyle = "#aaa";
    ctx.font = "12px monospace";
    ctx.fillText(def.description, x + 16, y + 52);

    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "11px monospace";
    ctx.fillText(`等级 ${level}/${def.maxLevel}`, x + 16, y + 78);

    const barX = x + 16;
    const barY = y + 90;
    const barW = this.cardW - 32;
    ctx.fillStyle = "#333";
    ctx.fillRect(barX, barY, barW, 7);
    ctx.fillStyle = full ? "#81c784" : "#42a5f5";
    ctx.fillRect(barX, barY, barW * (level / def.maxLevel), 7);

    ctx.textAlign = "right";
    ctx.font = "bold 12px monospace";
    ctx.fillStyle = color;
    ctx.fillText(full ? "已满级" : affordable ? `花费 ${cost}` : `缺 ${cost - soul}`, x + this.cardW - 16, y + 112);
  }

  private drawButton(ctx: CanvasRenderingContext2D, rect: { x: number; y: number; w: number; h: number }, text: string, fill: string, stroke: string, color: string, fontSize = 13): void {
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    this.roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText(text, rect.x + rect.w / 2, rect.y + rect.h / 2 + fontSize * 0.35);
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
