import { META_TALENTS, type MetaTalentCategory, type MetaTalentDef, type MetaTalentRarity } from "../data/metaTalents";
import { MetaTalentProgress } from "../systems/MetaTalentProgress";

export type MetaTalentPanelAction = "back" | null;

type TalentFilter = "all" | MetaTalentCategory;

interface Rect { x: number; y: number; w: number; h: number }
interface FilterRect extends Rect { filter: TalentFilter; label: string }
interface TalentRect extends Rect { id: string }
interface SlotRect extends Rect { id?: string }

const FILTERS: { filter: TalentFilter; label: string }[] = [
  { filter: "all", label: "全部" },
  { filter: "offense", label: "进攻" },
  { filter: "survival", label: "生存" },
  { filter: "growth", label: "成长" },
  { filter: "summon", label: "召唤" },
  { filter: "tech", label: "机械" },
  { filter: "magic", label: "魔法" },
  { filter: "martial", label: "古武" },
  { filter: "risk", label: "风险" },
];

const RARITY_LABEL: Record<MetaTalentRarity, string> = {
  common: "普通",
  rare: "稀有",
  epic: "史诗",
  legendary: "传说",
};

export class MetaTalentPanel {
  private backRect: Rect = { x: 0, y: 0, w: 110, h: 36 };
  private actionRect: Rect = { x: 0, y: 0, w: 150, h: 38 };
  private filterRects: FilterRect[] = [];
  private talentRects: TalentRect[] = [];
  private slotRects: SlotRect[] = [];
  private selectedFilter: TalentFilter = "all";
  private selectedTalentId = META_TALENTS[0]?.id ?? "";
  private feedbackText = "";
  private feedbackColor = "#ffeb3b";

  handleClick(cx: number, cy: number, progress: MetaTalentProgress): MetaTalentPanelAction {
    if (this.inRect(cx, cy, this.backRect)) return "back";

    for (const filter of this.filterRects) {
      if (!this.inRect(cx, cy, filter)) continue;
      this.selectedFilter = filter.filter;
      this.selectedTalentId = this.visibleTalents()[0]?.id ?? "";
      return null;
    }

    for (const slot of this.slotRects) {
      if (!this.inRect(cx, cy, slot)) continue;
      if (slot.id) this.selectedTalentId = slot.id;
      return null;
    }

    for (const rect of this.talentRects) {
      if (!this.inRect(cx, cy, rect)) continue;
      this.selectedTalentId = rect.id;
      return null;
    }

    const talent = this.selectedTalent();
    if (talent && this.inRect(cx, cy, this.actionRect)) {
      if (!progress.isUnlocked(talent.id)) {
        const result = progress.unlockTalent(talent.id);
        this.feedbackText = result.ok ? `已解锁：${talent.name}` : (result.reason ?? "解锁失败");
        this.feedbackColor = result.ok ? "#81c784" : "#ffb74d";
        return null;
      }

      if (progress.isEquipped(talent.id)) {
        const result = progress.unequipTalent(talent.id);
        this.feedbackText = result.ok ? `已卸下：${talent.name}` : (result.reason ?? "卸下失败");
        this.feedbackColor = result.ok ? "#90caf9" : "#ffb74d";
        return null;
      }

      const result = progress.equipTalent(talent.id);
      this.feedbackText = result.ok ? `已装备：${talent.name}` : (result.reason ?? "装备失败");
      this.feedbackColor = result.ok ? "#81c784" : "#ffb74d";
    }

    return null;
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number, progress: MetaTalentProgress): void {
    this.filterRects = [];
    this.talentRects = [];
    this.slotRects = [];

    ctx.fillStyle = "#111118";
    ctx.fillRect(0, 0, w, h);

    this.backRect = { x: 22, y: 22, w: 110, h: 36 };
    this.drawButton(ctx, this.backRect, "返回", "rgba(255,255,255,0.08)", "rgba(255,255,255,0.2)", "#ddd");

    ctx.fillStyle = "#fff";
    ctx.font = "bold 28px monospace";
    ctx.textAlign = "center";
    ctx.fillText("天赋祭坛", w / 2, 58);

    ctx.fillStyle = "rgba(255,255,255,0.42)";
    ctx.font = "12px monospace";
    ctx.fillText("选择局外天赋，开局携带进入远征。天赋名称统一四个字。", w / 2, 86);

    this.renderSlots(ctx, w, progress);
    this.renderFilters(ctx, w);

    if (this.feedbackText) {
      ctx.fillStyle = this.feedbackColor;
      ctx.font = "bold 13px monospace";
      ctx.textAlign = "center";
      ctx.fillText(this.feedbackText, w / 2, 190);
    }

    const leftX = Math.max(28, w / 2 - 490);
    const topY = 210;
    const listW = 360;
    const detailX = leftX + listW + 22;
    const detailW = Math.min(580, w - detailX - 28);
    const panelH = Math.min(500, h - topY - 34);

    this.drawPanelBg(ctx, leftX, topY, listW, panelH, "天赋列表");
    this.drawPanelBg(ctx, detailX, topY, detailW, panelH, "天赋详情");
    this.renderTalentList(ctx, leftX, topY + 42, listW, panelH - 52, progress);
    this.renderTalentDetail(ctx, detailX, topY + 42, detailW, panelH - 52, progress);
  }

  private renderSlots(ctx: CanvasRenderingContext2D, w: number, progress: MetaTalentProgress): void {
    const state = progress.getState();
    const slotW = 116;
    const slotH = 34;
    const gap = 10;
    const count = Math.max(1, state.talentSlots);
    const totalW = count * slotW + (count - 1) * gap;
    let x = w / 2 - totalW / 2;
    const y = 104;

    ctx.textAlign = "center";
    for (let i = 0; i < count; i++) {
      const id = state.equippedTalentIds[i];
      const talent = id ? progress.getEquippedTalents().find((item) => item.id === id) : undefined;
      const rect: SlotRect = { x, y, w: slotW, h: slotH, id };
      this.slotRects.push(rect);
      this.drawButton(
        ctx,
        rect,
        talent ? talent.name : `空槽 ${i + 1}`,
        talent ? "rgba(129,199,132,0.16)" : "rgba(255,255,255,0.06)",
        talent ? "rgba(129,199,132,0.58)" : "rgba(255,255,255,0.16)",
        talent ? "#a5d6a7" : "#aaa",
        12,
      );
      x += slotW + gap;
    }
  }

  private renderFilters(ctx: CanvasRenderingContext2D, w: number): void {
    const tabY = 154;
    const tabW = 66;
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

  private renderTalentList(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, progress: MetaTalentProgress): void {
    const visible = this.visibleTalents();
    if (!visible.some((talent) => talent.id === this.selectedTalentId)) this.selectedTalentId = visible[0]?.id ?? "";

    const cardH = 62;
    const gap = 10;
    const maxCards = Math.floor((h + gap) / (cardH + gap));
    const talents = visible.slice(0, Math.max(0, maxCards));

    for (let i = 0; i < talents.length; i++) {
      const talent = talents[i];
      const cy = y + i * (cardH + gap);
      const selected = talent.id === this.selectedTalentId;
      const unlocked = progress.isUnlocked(talent.id);
      const equipped = progress.isEquipped(talent.id);
      const rect: TalentRect = { x: x + 14, y: cy, w: w - 28, h: cardH, id: talent.id };
      this.talentRects.push(rect);

      ctx.fillStyle = selected ? "rgba(66,165,245,0.18)" : "rgba(255,255,255,0.055)";
      ctx.strokeStyle = equipped ? "rgba(129,199,132,0.75)" : unlocked ? "rgba(255,255,255,0.24)" : "rgba(255,255,255,0.1)";
      ctx.lineWidth = selected || equipped ? 2 : 1;
      this.roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = "left";
      ctx.fillStyle = talent.color;
      ctx.font = "bold 15px monospace";
      ctx.fillText(talent.name, rect.x + 14, rect.y + 22);

      ctx.fillStyle = unlocked ? "rgba(255,255,255,0.62)" : "rgba(255,255,255,0.3)";
      ctx.font = "11px monospace";
      ctx.fillText(`${this.categoryLabel(talent.category)} · ${this.rarityLabel(talent.rarity)}${equipped ? " · 已装备" : unlocked ? " · 已解锁" : " · 未解锁"}`, rect.x + 14, rect.y + 44);
    }
  }

  private renderTalentDetail(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, progress: MetaTalentProgress): void {
    const talent = this.selectedTalent();
    if (!talent) return;

    const unlocked = progress.isUnlocked(talent.id);
    const equipped = progress.isEquipped(talent.id);
    const state = progress.getState();

    ctx.textAlign = "left";
    ctx.fillStyle = talent.color;
    ctx.font = "bold 24px monospace";
    ctx.fillText(talent.name, x + 18, y + 28);

    ctx.fillStyle = "rgba(255,255,255,0.66)";
    ctx.font = "bold 12px monospace";
    ctx.fillText(`${this.categoryLabel(talent.category)} · ${this.rarityLabel(talent.rarity)} · ${unlocked ? "已解锁" : "未解锁"}`, x + 18, y + 54);

    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = "12px monospace";
    this.wrapText(ctx, talent.description, x + 18, y + 86, w - 36, 18);

    let lineY = y + 146;
    if (talent.downside) {
      ctx.fillStyle = "#ffab91";
      ctx.font = "bold 13px monospace";
      ctx.fillText("负面代价", x + 18, lineY);
      lineY += 22;
      ctx.fillStyle = "rgba(255,255,255,0.68)";
      ctx.font = "12px monospace";
      this.wrapText(ctx, talent.downside, x + 24, lineY, w - 48, 18);
      lineY += 56;
    }

    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px monospace";
    ctx.fillText("解锁消耗", x + 18, lineY);
    lineY += 24;
    ctx.fillStyle = "rgba(255,255,255,0.62)";
    ctx.font = "12px monospace";
    for (const cost of talent.unlockCosts) {
      ctx.fillText(`${cost.itemId} x${cost.amount}`, x + 24, lineY);
      lineY += 20;
    }

    lineY += 10;
    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px monospace";
    ctx.fillText("标签", x + 18, lineY);
    lineY += 24;
    ctx.fillStyle = "rgba(255,255,255,0.62)";
    ctx.font = "12px monospace";
    ctx.fillText(talent.tags.join(" / "), x + 24, lineY);

    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,255,255,0.34)";
    ctx.font = "11px monospace";
    ctx.fillText(`槽位 ${state.equippedTalentIds.length}/${state.talentSlots}`, x + w - 20, y + h - 72);

    this.actionRect = { x: x + w - 176, y: y + h - 54, w: 150, h: 38 };
    const label = !unlocked ? "临时解锁" : equipped ? "卸下" : "装备";
    const enabled = !unlocked || equipped || state.equippedTalentIds.length < state.talentSlots;
    this.drawButton(
      ctx,
      this.actionRect,
      enabled ? label : "槽位不足",
      enabled ? "rgba(129,199,132,0.16)" : "rgba(255,255,255,0.06)",
      enabled ? "rgba(129,199,132,0.72)" : "rgba(255,255,255,0.16)",
      enabled ? "#a5d6a7" : "#777",
      13,
    );
  }

  private visibleTalents(): MetaTalentDef[] {
    if (this.selectedFilter === "all") return META_TALENTS;
    return META_TALENTS.filter((talent) => talent.category === this.selectedFilter);
  }

  private selectedTalent(): MetaTalentDef | undefined {
    return META_TALENTS.find((talent) => talent.id === this.selectedTalentId) ?? this.visibleTalents()[0];
  }

  private categoryLabel(category: MetaTalentCategory): string {
    return FILTERS.find((item) => item.filter === category)?.label ?? category;
  }

  private rarityLabel(rarity: MetaTalentRarity): string {
    return { common: "普通", rare: "稀有", epic: "史诗", legendary: "传说" }[rarity];
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
