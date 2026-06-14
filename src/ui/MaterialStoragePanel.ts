import { MATERIALS, type MaterialDefinition, type MaterialKind, type MaterialRarity } from "../data/materials";
import { MetaProgress } from "../systems/MetaProgress";
import type { MaterialId } from "../data/materials";

export type MaterialStoragePanelAction = "back" | null;
type MaterialFilter = "all" | MaterialKind | MaterialRarity;

interface Rect { x: number; y: number; w: number; h: number }
interface FilterRect extends Rect { filter: MaterialFilter; label: string }
interface MaterialRect extends Rect { id: string }

const FILTERS: { filter: MaterialFilter; label: string }[] = [
  { filter: "all", label: "全部" },
  { filter: "currency", label: "货币" },
  { filter: "common", label: "通用" },
  { filter: "special", label: "特殊" },
  { filter: "rare", label: "稀有" },
  { filter: "epic", label: "史诗" },
  { filter: "mythic", label: "神话" },
];

const RARITY_LABEL: Record<MaterialRarity, string> = {
  common: "普通",
  uncommon: "优秀",
  rare: "稀有",
  epic: "史诗",
  mythic: "神话",
};

const RARITY_COLOR: Record<MaterialRarity, string> = {
  common: "#b0bec5",
  uncommon: "#a5d6a7",
  rare: "#90caf9",
  epic: "#ce93d8",
  mythic: "#ffcc80",
};

export class MaterialStoragePanel {
  private backRect: Rect = { x: 0, y: 0, w: 110, h: 36 };
  private filterRects: FilterRect[] = [];
  private materialRects: MaterialRect[] = [];
  private selectedFilter: MaterialFilter = "all";
  private selectedMaterialId = MATERIALS[0]?.id ?? "";

  handleClick(cx: number, cy: number): MaterialStoragePanelAction {
    if (this.inRect(cx, cy, this.backRect)) return "back";

    for (const rect of this.filterRects) {
      if (!this.inRect(cx, cy, rect)) continue;
      this.selectedFilter = rect.filter;
      this.selectedMaterialId = this.visibleMaterials()[0]?.id ?? "";
      return null;
    }

    for (const rect of this.materialRects) {
      if (!this.inRect(cx, cy, rect)) continue;
      this.selectedMaterialId = rect.id;
      return null;
    }

    return null;
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number, meta: MetaProgress): void {
    this.filterRects = [];
    this.materialRects = [];

    ctx.fillStyle = "#111118";
    ctx.fillRect(0, 0, w, h);

    this.backRect = { x: 22, y: 22, w: 110, h: 36 };
    this.drawButton(ctx, this.backRect, "返回", "rgba(255,255,255,0.08)", "rgba(255,255,255,0.2)", "#ddd");

    ctx.fillStyle = "#fff";
    ctx.font = "bold 28px monospace";
    ctx.textAlign = "center";
    ctx.fillText("材料仓库", w / 2, 58);

    ctx.fillStyle = "rgba(255,255,255,0.42)";
    ctx.font = "12px monospace";
    ctx.fillText("查看带出局的材料、用途和来源", w / 2, 86);

    this.renderSummary(ctx, w, meta);
    this.renderFilters(ctx, w);

    const leftX = Math.max(28, w / 2 - 470);
    const topY = 188;
    const listW = 360;
    const detailX = leftX + listW + 22;
    const detailW = Math.min(530, w - detailX - 28);
    const panelH = Math.min(520, h - topY - 34);

    this.drawPanelBg(ctx, leftX, topY, listW, panelH, "材料列表");
    this.drawPanelBg(ctx, detailX, topY, detailW, panelH, "材料详情");
    this.renderMaterialList(ctx, leftX, topY + 42, listW, panelH - 52, meta);
    this.renderMaterialDetail(ctx, detailX, topY + 42, detailW, panelH - 52, meta);
  }

  private renderSummary(ctx: CanvasRenderingContext2D, w: number, meta: MetaProgress): void {
    const entries = meta.getMaterials().entries();
    const ownedTotal = entries.reduce((sum, entry) => sum + entry.amount, 0);
    const ownedSpecial = entries.filter((entry) => entry.material.kind === "special").length;

    const x = w / 2 - 260;
    const y = 108;
    ctx.fillStyle = "rgba(255,255,255,0.055)";
    ctx.strokeStyle = "rgba(255,255,255,0.13)";
    this.roundRect(ctx, x, y, 520, 42, 10);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.font = "12px monospace";
    ctx.fillStyle = "#a5d6a7";
    ctx.fillText(`材料种类 ${entries.length}`, x + 110, y + 26);
    ctx.fillStyle = "#90caf9";
    ctx.fillText(`特殊材料 ${ownedSpecial}`, x + 260, y + 26);
    ctx.fillStyle = "#ffcc80";
    ctx.fillText(`总数量 ${ownedTotal}`, x + 410, y + 26);
  }

  private renderFilters(ctx: CanvasRenderingContext2D, w: number): void {
    const tabY = 160;
    const tabW = 74;
    const gap = 8;
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

  private renderMaterialList(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, meta: MetaProgress): void {
    const visible = this.visibleMaterials();
    if (!visible.some((material) => material.id === this.selectedMaterialId)) this.selectedMaterialId = visible[0]?.id ?? "";

    const inventory = meta.getMaterials();
    const cardH = 54;
    const gap = 9;
    const maxCards = Math.floor((h + gap) / (cardH + gap));
    const materials = visible.slice(0, Math.max(0, maxCards));

    for (let i = 0; i < materials.length; i++) {
      const material = materials[i];
      const amount = inventory.get(material.id as MaterialId);
      const cy = y + i * (cardH + gap);
      const selected = material.id === this.selectedMaterialId;
      const rect: MaterialRect = { x: x + 14, y: cy, w: w - 28, h: cardH, id: material.id };
      this.materialRects.push(rect);

      ctx.fillStyle = selected ? "rgba(66,165,245,0.18)" : "rgba(255,255,255,0.055)";
      ctx.strokeStyle = selected ? "rgba(66,165,245,0.7)" : "rgba(255,255,255,0.12)";
      this.roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = "left";
      ctx.fillStyle = RARITY_COLOR[material.rarity];
      ctx.font = "bold 20px monospace";
      ctx.fillText(material.icon, rect.x + 14, rect.y + 32);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px monospace";
      ctx.fillText(material.name, rect.x + 48, rect.y + 22);
      ctx.fillStyle = RARITY_COLOR[material.rarity];
      ctx.font = "11px monospace";
      ctx.fillText(`${RARITY_LABEL[material.rarity]} · ${material.kind}`, rect.x + 48, rect.y + 42);

      ctx.textAlign = "right";
      ctx.fillStyle = amount > 0 ? "#a5d6a7" : "rgba(255,255,255,0.28)";
      ctx.font = "bold 13px monospace";
      ctx.fillText(`x${amount}`, rect.x + rect.w - 14, rect.y + 32);
    }
  }

  private renderMaterialDetail(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, meta: MetaProgress): void {
    const material = this.selectedMaterial();
    if (!material) return;

    const amount = meta.getMaterials().get(material.id as MaterialId);
    ctx.textAlign = "left";
    ctx.fillStyle = RARITY_COLOR[material.rarity];
    ctx.font = "bold 34px monospace";
    ctx.fillText(material.icon, x + 18, y + 42);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 23px monospace";
    ctx.fillText(material.name, x + 72, y + 26);

    ctx.fillStyle = RARITY_COLOR[material.rarity];
    ctx.font = "bold 12px monospace";
    ctx.fillText(`${RARITY_LABEL[material.rarity]} · ${material.kind}`, x + 72, y + 52);

    ctx.textAlign = "right";
    ctx.fillStyle = amount > 0 ? "#a5d6a7" : "rgba(255,255,255,0.42)";
    ctx.font = "bold 18px monospace";
    ctx.fillText(`拥有 x${amount}`, x + w - 22, y + 34);

    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = "12px monospace";
    this.wrapText(ctx, material.description, x + 18, y + 92, w - 36, 18);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 15px monospace";
    ctx.fillText("来源", x + 18, y + 178);
    ctx.fillStyle = "rgba(255,255,255,0.66)";
    ctx.font = "12px monospace";
    this.wrapText(ctx, material.source, x + 24, y + 204, w - 48, 18);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 15px monospace";
    ctx.fillText("用途", x + 18, y + 286);
    ctx.fillStyle = "rgba(255,255,255,0.66)";
    ctx.font = "12px monospace";
    this.wrapText(ctx, material.use, x + 24, y + 312, w - 48, 18);

    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.font = "11px monospace";
    ctx.fillText("后续接入营地材料仓库建筑。", x + 18, y + h - 18);
  }

  private visibleMaterials(): MaterialDefinition[] {
    if (this.selectedFilter === "all") return MATERIALS;
    return MATERIALS.filter((material) => material.kind === this.selectedFilter || material.rarity === this.selectedFilter);
  }

  private selectedMaterial(): MaterialDefinition | undefined {
    return MATERIALS.find((material) => material.id === this.selectedMaterialId) ?? this.visibleMaterials()[0];
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
