import { MetaProgress, META_UPGRADES, MetaUpgradeDef, MetaUpgradeId } from "../systems/MetaProgress";

export class MetaUpgradePanel {
  private cardW = 230;
  private cardH = 126;
  private gap = 16;
  private cardRects: { x: number; y: number; w: number; h: number; id: MetaUpgradeId }[] = [];
  private backRect = { x: 0, y: 0, w: 110, h: 36 };

  handleClick(cx: number, cy: number, meta: MetaProgress): "back" | "buy" | null {
    if (cx >= this.backRect.x && cx <= this.backRect.x + this.backRect.w && cy >= this.backRect.y && cy <= this.backRect.y + this.backRect.h) {
      return "back";
    }

    for (const r of this.cardRects) {
      if (cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h) {
        meta.purchaseUpgrade(r.id);
        return "buy";
      }
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
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1;
    this.roundRect(ctx, this.backRect.x, this.backRect.y, this.backRect.w, this.backRect.h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ddd";
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "center";
    ctx.fillText("返回", this.backRect.x + this.backRect.w / 2, this.backRect.y + 23);

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

    const cols = 2;
    const rows = Math.ceil(META_UPGRADES.length / cols);
    const totalW = cols * this.cardW + (cols - 1) * this.gap;
    const totalH = rows * this.cardH + (rows - 1) * this.gap;
    const sx = (w - totalW) / 2;
    const sy = Math.max(142, h / 2 - totalH / 2 + 24);

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
    ctx.fillText("点击强化卡片购买；满级后不可继续购买", w / 2, by + 28);
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
    ctx.fillText(full ? "已满级" : `花费 ${cost}`, x + this.cardW - 16, y + 112);
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
