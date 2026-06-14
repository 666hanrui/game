import { ECONOMY_ITEMS, type EconomyItemDef, type EconomyItemKind, type EconomyItemTier, type EconomyItemUse } from "../data/economy";
import { EconomyInventory, type EconomyItemId } from "../systems/EconomyInventory";

export type EconomyStoragePanelAction = "back" | null;

type EconomyFilter = "all" | EconomyItemKind | EconomyItemTier | EconomyItemUse;

interface Rect { x: number; y: number; w: number; h: number }
interface FilterRect extends Rect { filter: EconomyFilter; label: string }
interface ItemRect extends Rect { id: string }

const FILTERS: { filter: EconomyFilter; label: string }[] = [
  { filter: "all", label: "全部" },
  { filter: "general", label: "通用" },
  { filter: "special", label: "特殊" },
  { filter: "talent", label: "天赋" },
  { filter: "slot", label: "槽位" },
  { filter: "workshop", label: "工坊" },
  { filter: "apothecary", label: "药房" },
  { filter: "crafting", label: "合成" },
  { filter: "class", label: "职业" },
  { filter: "weapon", label: "武器" },
  { filter: "region", label: "区域" },
];

const TIER_LABEL: Record<EconomyItemTier, string> = {
  common: "普通",
  uncommon: "优秀",
  rare: "稀有",
  epic: "史诗",
  legendary: "传说",
};

export class EconomyStoragePanel {
  private backRect: Rect = { x: 0, y: 0, w: 110, h: 36 };
  private filterRects: FilterRect[] = [];
  private itemRects: ItemRect[] = [];
  private selectedFilter: EconomyFilter = "all";
  private selectedItemId = ECONOMY_ITEMS[0]?.id ?? "";

  handleClick(cx: number, cy: number): EconomyStoragePanelAction {
    if (this.inRect(cx, cy, this.backRect)) return "back";

    for (const rect of this.filterRects) {
      if (!this.inRect(cx, cy, rect)) continue;
      this.selectedFilter = rect.filter;
      this.selectedItemId = this.visibleItems()[0]?.id ?? "";
      return null;
    }

    for (const rect of this.itemRects) {
      if (!this.inRect(cx, cy, rect)) continue;
      this.selectedItemId = rect.id;
      return null;
    }

    return null;
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number, inventory = EconomyInventory.load()): void {
    this.filterRects = [];
    this.itemRects = [];

    ctx.fillStyle = "#111118";
    ctx.fillRect(0, 0, w, h);

    this.backRect = { x: 22, y: 22, w: 110, h: 36 };
    this.drawButton(ctx, this.backRect, "返回", "rgba(255,255,255,0.08)", "rgba(255,255,255,0.2)", "#ddd");

    ctx.fillStyle = "#fff";
    ctx.font = "bold 28px monospace";
    ctx.textAlign = "center";
    ctx.fillText("资源仓库", w / 2, 58);

    ctx.fillStyle = "rgba(255,255,255,0.42)";
    ctx.font = "12px monospace";
    ctx.fillText("查看远征币、魂晶、职业材料和局外经济物品", w / 2, 86);

    this.renderSummary(ctx, w, inventory);
    this.renderFilters(ctx, w);

    const leftX = Math.max(28, w / 2 - 490);
    const topY = 210;
    const listW = 370;
    const detailX = leftX + listW + 22;
    const detailW = Math.min(590, w - detailX - 28);
    const panelH = Math.min(500, h - topY - 34);

    this.drawPanelBg(ctx, leftX, topY, listW, panelH, "经济物品");
    this.drawPanelBg(ctx, detailX, topY, detailW, panelH, "物品详情");
    this.renderItemList(ctx, leftX, topY + 42, listW, panelH - 52, inventory);
    this.renderItemDetail(ctx, detailX, topY + 42, detailW, panelH - 52, inventory);
  }

  private renderSummary(ctx: CanvasRenderingContext2D, w: number, inventory: EconomyInventory): void {
    const entries = inventory.entries();
    const ownedTotal = entries.reduce((sum, entry) => sum + entry.amount, 0);
    const ownedSpecial = entries.filter((entry) => entry.item.kind === "special").length;

    const x = w / 2 - 300;
    const y = 108;
    ctx.fillStyle = "rgba(255,255,255,0.055)";
    ctx.strokeStyle = "rgba(255,255,255,0.13)";
    this.roundRect(ctx, x, y, 600, 42, 10);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.font = "12px monospace";
    ctx.fillStyle = "#a5d6a7";
    ctx.fillText(`拥有种类 ${entries.length}`, x + 110, y + 26);
    ctx.fillStyle = "#90caf9";
    ctx.fillText(`特殊物品 ${ownedSpecial}`, x + 265, y + 26);
    ctx.fillStyle = "#ffcc80";
    ctx.fillText(`总数量 ${ownedTotal}`, x + 420, y + 26);
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillText(EconomyInventory.storageKey(), x + 540, y + 26);
  }

  private renderFilters(ctx: CanvasRenderingContext2D, w: number): void {
    const tabY = 162;
    const tabW = 62;
    const gap = 7;
    const totalW = FILTERS.length * tabW + (FILTERS.length - 1) * gap;
    let x = w / 2 - totalW / 2;

    for (const item of FILTERS) {
      const rect: FilterRect = { x, y: tabY, w: tabW, h: 28, filter: item.filter, label: item.label };
      this.filterRects.push(rect);
      const active = this.selectedFilter === item.filter;
      this.drawButton(ctx, rect, item.label, active ? "rgba(66,165,245,0.22)" : "rgba(255,255,255,0.06)", active ? "rgba(66,165,245,0.72)" : "rgba(255,255,255,0.16)", active ? "#bbdefb" : "#aaa", 11);
      x += tabW + gap;
    }
  }

  private renderItemList(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, inventory: EconomyInventory): void {
    const visible = this.visibleItems();
    if (!visible.some((item) => item.id === this.selectedItemId)) this.selectedItemId = visible[0]?.id ?? "";

    const cardH = 58;
    const gap = 9;
    const maxCards = Math.floor((h + gap) / (cardH + gap));
    const items = visible.slice(0, Math.max(0, maxCards));

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const amount = inventory.get(item.id as EconomyItemId);
      const cy = y + i * (cardH + gap);
      const selected = item.id === this.selectedItemId;
      const rect: ItemRect = { x: x + 14, y: cy, w: w - 28, h: cardH, id: item.id };
      this.itemRects.push(rect);

      ctx.fillStyle = selected ? "rgba(66,165,245,0.18)" : "rgba(255,255,255,0.055)";
      ctx.strokeStyle = selected ? "rgba(66,165,245,0.7)" : "rgba(255,255,255,0.12)";
      this.roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = "left";
      ctx.fillStyle = item.color;
      ctx.font = "bold 20px monospace";
      ctx.fillText(item.icon, rect.x + 14, rect.y + 34);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px monospace";
      ctx.fillText(item.name, rect.x + 48, rect.y + 23);
      ctx.fillStyle = item.color;
      ctx.font = "11px monospace";
      ctx.fillText(`${TIER_LABEL[item.tier]} · ${item.kind}`, rect.x + 48, rect.y + 44);

      ctx.textAlign = "right";
      ctx.fillStyle = amount > 0 ? "#a5d6a7" : "rgba(255,255,255,0.28)";
      ctx.font = "bold 13px monospace";
      ctx.fillText(`x${amount}`, rect.x + rect.w - 14, rect.y + 34);
    }
  }

  private renderItemDetail(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, inventory: EconomyInventory): void {
    const item = this.selectedItem();
    if (!item) return;

    const amount = inventory.get(item.id as EconomyItemId);
    ctx.textAlign = "left";
    ctx.fillStyle = item.color;
    ctx.font = "bold 34px monospace";
    ctx.fillText(item.icon, x + 18, y + 42);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 23px monospace";
    ctx.fillText(item.name, x + 72, y + 26);

    ctx.fillStyle = item.color;
    ctx.font = "bold 12px monospace";
    ctx.fillText(`${TIER_LABEL[item.tier]} · ${item.kind}`, x + 72, y + 52);

    ctx.textAlign = "right";
    ctx.fillStyle = amount > 0 ? "#a5d6a7" : "rgba(255,255,255,0.42)";
    ctx.font = "bold 18px monospace";
    ctx.fillText(`拥有 x${amount}`, x + w - 22, y + 34);

    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = "12px monospace";
    this.wrapText(ctx, item.description, x + 18, y + 92, w - 36, 18);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 15px monospace";
    ctx.fillText("来源", x + 18, y + 174);
    ctx.fillStyle = "rgba(255,255,255,0.66)";
    ctx.font = "12px monospace";
    this.wrapText(ctx, item.source.join(" / "), x + 24, y + 200, w - 48, 18);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 15px monospace";
    ctx.fillText("主要用途", x + 18, y + 282);
    ctx.fillStyle = "rgba(255,255,255,0.66)";
    ctx.font = "12px monospace";
    this.wrapText(ctx, item.primaryUses.join(" / "), x + 24, y + 308, w - 48, 18);

    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.font = "11px monospace";
    ctx.fillText("后续可由营地资源仓库、天赋祭坛和任务板共用。", x + 18, y + h - 18);
  }

  private visibleItems(): EconomyItemDef[] {
    if (this.selectedFilter === "all") return ECONOMY_ITEMS;
    return ECONOMY_ITEMS.filter((item) => item.kind === this.selectedFilter || item.tier === this.selectedFilter || item.primaryUses.includes(this.selectedFilter as EconomyItemUse));
  }

  private selectedItem(): EconomyItemDef | undefined {
    return ECONOMY_ITEMS.find((item) => item.id === this.selectedItemId) ?? this.visibleItems()[0];
  }

  private drawPanelBg(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, title: string): void {
    ctx.fillStyle = "rgba(255,255,255,0.055)";
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    this.roundRect(ctx, x, y, w, h, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "left";
    ctx.fillText(title, x + 16, y + 24);
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
