import { getEconomyItem } from "../data/economy";
import { getMaterial } from "../data/materials";
import { QUESTS, type QuestCategory, type QuestDefinition, type QuestDifficulty, type QuestRepeat } from "../data/quests";
import { QuestProgress } from "../systems/QuestProgress";

export type QuestBoardPanelAction = "back" | "claimed" | null;

type QuestFilter = "all" | QuestCategory;

interface Rect { x: number; y: number; w: number; h: number }
interface FilterRect extends Rect { filter: QuestFilter; label: string }
interface QuestRect extends Rect { id: string }

const FILTERS: { filter: QuestFilter; label: string }[] = [
  { filter: "all", label: "全部" },
  { filter: "tutorial", label: "引导" },
  { filter: "reclaim", label: "收复" },
  { filter: "boss", label: "讨伐" },
  { filter: "material", label: "材料" },
  { filter: "elite", label: "精英" },
  { filter: "camp", label: "营地" },
  { filter: "challenge", label: "挑战" },
];

const DIFFICULTY_LABEL: Record<QuestDifficulty, string> = {
  easy: "简单",
  normal: "普通",
  hard: "困难",
  nightmare: "噩梦",
};

const REPEAT_LABEL: Record<QuestRepeat, string> = {
  once: "一次性",
  daily: "每日",
  weekly: "每周",
  repeatable: "可重复",
};

export class QuestBoardPanel {
  private backRect: Rect = { x: 0, y: 0, w: 110, h: 36 };
  private claimRect: Rect = { x: 0, y: 0, w: 150, h: 38 };
  private filterRects: FilterRect[] = [];
  private questRects: QuestRect[] = [];
  private selectedFilter: QuestFilter = "all";
  private selectedQuestId = QUESTS[0]?.id ?? "";
  private feedbackText = "";
  private feedbackColor = "#ffeb3b";

  handleClick(cx: number, cy: number, progress: QuestProgress): QuestBoardPanelAction {
    if (this.inRect(cx, cy, this.backRect)) return "back";

    for (const filter of this.filterRects) {
      if (!this.inRect(cx, cy, filter)) continue;
      this.selectedFilter = filter.filter;
      this.selectedQuestId = this.visibleQuests(progress)[0]?.id ?? "";
      return null;
    }

    for (const rect of this.questRects) {
      if (!this.inRect(cx, cy, rect)) continue;
      this.selectedQuestId = rect.id;
      return null;
    }

    const quest = this.selectedQuest(progress);
    if (quest && this.inRect(cx, cy, this.claimRect)) {
      const result = progress.claimReward(quest.id);
      this.feedbackText = result.ok ? `已领取：${quest.name}` : (result.reason ?? "领取失败");
      this.feedbackColor = result.ok ? "#81c784" : "#ffb74d";
      return result.ok ? "claimed" : null;
    }

    return null;
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number, progress: QuestProgress): void {
    this.filterRects = [];
    this.questRects = [];

    ctx.fillStyle = "#111118";
    ctx.fillRect(0, 0, w, h);

    this.backRect = { x: 22, y: 22, w: 110, h: 36 };
    this.drawButton(ctx, this.backRect, "返回", "rgba(255,255,255,0.08)", "rgba(255,255,255,0.2)", "#ddd");

    ctx.fillStyle = "#fff";
    ctx.font = "bold 28px monospace";
    ctx.textAlign = "center";
    ctx.fillText("任务板", w / 2, 58);

    ctx.fillStyle = "rgba(255,255,255,0.42)";
    ctx.font = "12px monospace";
    ctx.fillText("接取区域收复、Boss 讨伐、材料收集和营地建设任务", w / 2, 86);

    this.renderSummary(ctx, w, progress);
    this.renderFilters(ctx, w);

    if (this.feedbackText) {
      ctx.fillStyle = this.feedbackColor;
      ctx.font = "bold 13px monospace";
      ctx.textAlign = "center";
      ctx.fillText(this.feedbackText, w / 2, 190);
    }

    const leftX = Math.max(28, w / 2 - 500);
    const topY = 210;
    const listW = 370;
    const detailX = leftX + listW + 22;
    const detailW = Math.min(610, w - detailX - 28);
    const panelH = Math.min(500, h - topY - 34);

    this.drawPanelBg(ctx, leftX, topY, listW, panelH, "任务列表");
    this.drawPanelBg(ctx, detailX, topY, detailW, panelH, "任务详情");
    this.renderQuestList(ctx, leftX, topY + 42, listW, panelH - 52, progress);
    this.renderQuestDetail(ctx, detailX, topY + 42, detailW, panelH - 52, progress);
  }

  private renderSummary(ctx: CanvasRenderingContext2D, w: number, progress: QuestProgress): void {
    const quests = progress.getVisibleQuests();
    const completed = quests.filter((quest) => progress.isCompleted(quest.id)).length;
    const claimed = quests.filter((quest) => progress.isClaimed(quest.id)).length;

    const x = w / 2 - 280;
    const y = 108;
    this.roundRect(ctx, x, y, 560, 42, 10);
    ctx.fillStyle = "rgba(255,255,255,0.055)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.13)";
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.font = "12px monospace";
    ctx.fillStyle = "#90caf9";
    ctx.fillText(`任务总数 ${quests.length}`, x + 110, y + 26);
    ctx.fillStyle = "#a5d6a7";
    ctx.fillText(`可领取 ${completed - claimed}`, x + 260, y + 26);
    ctx.fillStyle = "#ffcc80";
    ctx.fillText(`已领取 ${claimed}`, x + 410, y + 26);
  }

  private renderFilters(ctx: CanvasRenderingContext2D, w: number): void {
    const tabY = 162;
    const tabW = 72;
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

  private renderQuestList(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, progress: QuestProgress): void {
    const visible = this.visibleQuests(progress);
    if (!visible.some((quest) => quest.id === this.selectedQuestId)) this.selectedQuestId = visible[0]?.id ?? "";

    const cardH = 64;
    const gap = 10;
    const maxCards = Math.floor((h + gap) / (cardH + gap));
    const quests = visible.slice(0, Math.max(0, maxCards));

    for (let i = 0; i < quests.length; i++) {
      const quest = quests[i];
      const cy = y + i * (cardH + gap);
      const selected = quest.id === this.selectedQuestId;
      const completed = progress.isCompleted(quest.id);
      const claimed = progress.isClaimed(quest.id);
      const rect: QuestRect = { x: x + 14, y: cy, w: w - 28, h: cardH, id: quest.id };
      this.questRects.push(rect);

      ctx.fillStyle = selected ? "rgba(66,165,245,0.18)" : "rgba(255,255,255,0.055)";
      ctx.strokeStyle = completed && !claimed ? "rgba(129,199,132,0.75)" : selected ? "rgba(66,165,245,0.7)" : "rgba(255,255,255,0.12)";
      ctx.lineWidth = selected || (completed && !claimed) ? 2 : 1;
      this.roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = "left";
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px monospace";
      ctx.fillText(quest.name, rect.x + 14, rect.y + 23);

      ctx.fillStyle = completed ? (claimed ? "rgba(255,255,255,0.35)" : "#a5d6a7") : "#90caf9";
      ctx.font = "11px monospace";
      ctx.fillText(`${this.categoryLabel(quest.category)} · ${DIFFICULTY_LABEL[quest.difficulty]} · ${claimed ? "已领取" : completed ? "可领取" : "进行中"}`, rect.x + 14, rect.y + 46);
    }
  }

  private renderQuestDetail(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, progress: QuestProgress): void {
    const quest = this.selectedQuest(progress);
    if (!quest) return;

    const entry = progress.getEntry(quest.id);
    const completed = progress.isCompleted(quest.id);
    const claimed = progress.isClaimed(quest.id);

    ctx.textAlign = "left";
    ctx.fillStyle = "#fff";
    ctx.font = "bold 23px monospace";
    ctx.fillText(quest.name, x + 18, y + 28);

    ctx.fillStyle = completed ? (claimed ? "rgba(255,255,255,0.45)" : "#a5d6a7") : "#90caf9";
    ctx.font = "bold 12px monospace";
    ctx.fillText(`${this.categoryLabel(quest.category)} · ${DIFFICULTY_LABEL[quest.difficulty]} · ${REPEAT_LABEL[quest.repeat]}`, x + 18, y + 54);

    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = "12px monospace";
    this.wrapText(ctx, quest.story, x + 18, y + 86, w - 36, 18);
    this.wrapText(ctx, quest.description, x + 18, y + 132, w - 36, 18);

    let lineY = y + 190;
    ctx.fillStyle = "#fff";
    ctx.font = "bold 15px monospace";
    ctx.fillText("任务目标", x + 18, lineY);
    lineY += 24;

    for (const target of quest.targets) {
      const item = entry.progress.find((p) => p.type === target.type && p.id === target.id);
      const value = Math.min(target.required, item?.value ?? 0);
      const ok = value >= target.required;
      ctx.fillStyle = ok ? "#a5d6a7" : "rgba(255,255,255,0.66)";
      ctx.font = "12px monospace";
      ctx.fillText(`${ok ? "✓" : "·"} ${target.label}`, x + 24, lineY);
      ctx.textAlign = "right";
      ctx.fillText(`${value}/${target.required}`, x + w - 28, lineY);
      ctx.textAlign = "left";
      lineY += 22;
    }

    lineY += 14;
    ctx.fillStyle = "#fff";
    ctx.font = "bold 15px monospace";
    ctx.fillText("任务奖励", x + 18, lineY);
    lineY += 24;

    for (const reward of this.rewardLines(quest)) {
      ctx.fillStyle = "#ffcc80";
      ctx.font = "12px monospace";
      ctx.fillText(reward, x + 24, lineY);
      lineY += 20;
    }

    ctx.fillStyle = "rgba(255,255,255,0.36)";
    ctx.font = "11px monospace";
    this.wrapText(ctx, `解锁提示：${quest.unlockHint}`, x + 18, y + h - 92, w - 36, 16);

    this.claimRect = { x: x + w - 176, y: y + h - 54, w: 150, h: 38 };
    const canClaim = completed && (!claimed || quest.repeat !== "once");
    this.drawButton(
      ctx,
      this.claimRect,
      claimed && quest.repeat === "once" ? "已领取" : canClaim ? "领取奖励" : "未完成",
      canClaim ? "rgba(129,199,132,0.16)" : "rgba(255,255,255,0.06)",
      canClaim ? "rgba(129,199,132,0.72)" : "rgba(255,255,255,0.16)",
      canClaim ? "#a5d6a7" : "#777",
      13,
    );
  }

  private rewardLines(quest: QuestDefinition): string[] {
    const lines: string[] = [];
    for (const [id, amount] of Object.entries(quest.rewards.economy ?? {})) {
      const item = getEconomyItem(id);
      lines.push(`${item?.icon ?? "◎"} ${item?.name ?? id} x${amount}`);
    }
    for (const [id, amount] of Object.entries(quest.rewards.materials ?? {})) {
      const material = getMaterial(id);
      lines.push(`${material?.icon ?? "◆"} ${material?.name ?? id} x${amount}`);
    }
    if (quest.rewards.talentSlots) lines.push(`✦ 天赋槽 +${quest.rewards.talentSlots}`);
    for (const id of quest.rewards.unlockTalentIds ?? []) lines.push(`✦ 解锁天赋：${id}`);
    for (const id of quest.rewards.unlockRecipeIds ?? []) lines.push(`✦ 解锁配方：${id}`);
    return lines.length ? lines : ["暂无奖励"];
  }

  private visibleQuests(progress: QuestProgress): QuestDefinition[] {
    const quests = progress.getVisibleQuests();
    if (this.selectedFilter === "all") return quests;
    return quests.filter((quest) => quest.category === this.selectedFilter);
  }

  private selectedQuest(progress: QuestProgress): QuestDefinition | undefined {
    return this.visibleQuests(progress).find((quest) => quest.id === this.selectedQuestId) ?? this.visibleQuests(progress)[0];
  }

  private categoryLabel(category: QuestCategory): string {
    return FILTERS.find((filter) => filter.filter === category)?.label ?? category;
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
