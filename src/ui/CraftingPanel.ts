import { getMaterial } from "../data/materials";
import { getRecipesByCategory, RECIPES, type RecipeCategory, type RecipeDefinition } from "../data/recipes";
import { MetaProgress } from "../systems/MetaProgress";

export type CraftingPanelAction = "back" | "crafted" | null;

interface RecipeRect {
  x: number;
  y: number;
  w: number;
  h: number;
  id: string;
}

interface TabRect {
  x: number;
  y: number;
  w: number;
  h: number;
  category: RecipeCategory | "all";
}

const CATEGORY_LABELS: Record<RecipeCategory | "all", string> = {
  all: "全部",
  talent: "天赋",
  weapon: "武器",
  potion: "药剂",
  building: "建筑",
  utility: "道具",
};

export class CraftingPanel {
  private backRect = { x: 0, y: 0, w: 110, h: 36 };
  private craftRect = { x: 0, y: 0, w: 150, h: 38 };
  private recipeRects: RecipeRect[] = [];
  private tabRects: TabRect[] = [];
  private selectedCategory: RecipeCategory | "all" = "all";
  private selectedRecipeId = RECIPES[0]?.id ?? "";
  private feedbackText = "";
  private feedbackColor = "#ffeb3b";

  handleClick(cx: number, cy: number, meta: MetaProgress): CraftingPanelAction {
    if (this.inRect(cx, cy, this.backRect)) return "back";

    for (const tab of this.tabRects) {
      if (!this.inRect(cx, cy, tab)) continue;
      this.selectedCategory = tab.category;
      const recipes = this.visibleRecipes();
      this.selectedRecipeId = recipes[0]?.id ?? "";
      return null;
    }

    for (const rect of this.recipeRects) {
      if (!this.inRect(cx, cy, rect)) continue;
      this.selectedRecipeId = rect.id;
      return null;
    }

    const recipe = this.selectedRecipe();
    if (recipe && this.inRect(cx, cy, this.craftRect)) {
      const result = meta.spendRecipeMaterials(recipe);
      if (result.ok) {
        this.feedbackText = `已合成：${recipe.result.label}`;
        this.feedbackColor = "#81c784";
        return "crafted";
      }
      const missing = Object.entries(result.missing)
        .map(([id, amount]) => `${getMaterial(id)?.name ?? id}x${amount}`)
        .join("，");
      this.feedbackText = missing ? `材料不足：${missing}` : "材料不足";
      this.feedbackColor = "#ffb74d";
      return null;
    }

    return null;
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number, meta: MetaProgress): void {
    this.recipeRects = [];
    this.tabRects = [];

    ctx.fillStyle = "#111118";
    ctx.fillRect(0, 0, w, h);

    this.backRect = { x: 22, y: 22, w: 110, h: 36 };
    this.drawButton(ctx, this.backRect, "返回", "rgba(255,255,255,0.08)", "rgba(255,255,255,0.2)", "#ddd");

    ctx.fillStyle = "#fff";
    ctx.font = "bold 28px monospace";
    ctx.textAlign = "center";
    ctx.fillText("合成台", w / 2, 58);

    ctx.fillStyle = "rgba(255,255,255,0.42)";
    ctx.font = "12px monospace";
    ctx.fillText("使用带出局的材料制作天赋槽、神话武器、永久药剂和营地设施", w / 2, 86);

    const tabY = 112;
    const tabW = 78;
    const tabGap = 10;
    const categories: (RecipeCategory | "all")[] = ["all", "talent", "weapon", "potion", "building", "utility"];
    const totalTabW = categories.length * tabW + (categories.length - 1) * tabGap;
    let tabX = w / 2 - totalTabW / 2;
    for (const category of categories) {
      const rect = { x: tabX, y: tabY, w: tabW, h: 30, category };
      this.tabRects.push(rect);
      const active = this.selectedCategory === category;
      this.drawButton(
        ctx,
        rect,
        CATEGORY_LABELS[category],
        active ? "rgba(66,165,245,0.22)" : "rgba(255,255,255,0.06)",
        active ? "rgba(66,165,245,0.72)" : "rgba(255,255,255,0.16)",
        active ? "#bbdefb" : "#aaa",
        12,
      );
      tabX += tabW + tabGap;
    }

    if (this.feedbackText) {
      ctx.fillStyle = this.feedbackColor;
      ctx.font = "bold 13px monospace";
      ctx.textAlign = "center";
      ctx.fillText(this.feedbackText, w / 2, 164);
    }

    const leftX = Math.max(28, w / 2 - 470);
    const topY = 186;
    const listW = 330;
    const detailX = leftX + listW + 22;
    const detailW = Math.min(560, w - detailX - 28);
    const panelH = Math.min(520, h - topY - 34);

    this.drawPanelBg(ctx, leftX, topY, listW, panelH, "配方列表");
    this.drawPanelBg(ctx, detailX, topY, detailW, panelH, "配方详情");

    this.renderRecipeList(ctx, leftX, topY + 42, listW, panelH - 52);
    this.renderRecipeDetail(ctx, detailX, topY + 42, detailW, panelH - 52, meta);
  }

  private renderRecipeList(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    const recipes = this.visibleRecipes();
    if (!recipes.some((recipe) => recipe.id === this.selectedRecipeId)) {
      this.selectedRecipeId = recipes[0]?.id ?? "";
    }

    const cardH = 62;
    const gap = 10;
    const maxCards = Math.floor((h + gap) / (cardH + gap));
    const visible = recipes.slice(0, Math.max(0, maxCards));

    ctx.textAlign = "left";
    for (let i = 0; i < visible.length; i++) {
      const recipe = visible[i];
      const cy = y + i * (cardH + gap);
      const selected = recipe.id === this.selectedRecipeId;
      const rect = { x: x + 14, y: cy, w: w - 28, h: cardH, id: recipe.id };
      this.recipeRects.push(rect);

      ctx.fillStyle = selected ? "rgba(66,165,245,0.18)" : "rgba(255,255,255,0.055)";
      ctx.strokeStyle = selected ? "rgba(66,165,245,0.7)" : "rgba(255,255,255,0.12)";
      ctx.lineWidth = selected ? 2 : 1;
      this.roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px monospace";
      ctx.fillText(recipe.name, rect.x + 14, rect.y + 22);

      ctx.fillStyle = recipe.tier === "legendary" ? "#ce93d8" : recipe.tier === "advanced" ? "#ffcc80" : "#90caf9";
      ctx.font = "11px monospace";
      ctx.fillText(`${CATEGORY_LABELS[recipe.category]} · ${recipe.tier}`, rect.x + 14, rect.y + 44);
    }

    if (recipes.length > visible.length) {
      ctx.fillStyle = "rgba(255,255,255,0.32)";
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`还有 ${recipes.length - visible.length} 个配方后续做滚动`, x + w / 2, y + h - 8);
    }
  }

  private renderRecipeDetail(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, meta: MetaProgress): void {
    const recipe = this.selectedRecipe();
    if (!recipe) {
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.font = "13px monospace";
      ctx.textAlign = "center";
      ctx.fillText("暂无可显示配方", x + w / 2, y + 80);
      return;
    }

    const inventory = meta.getMaterials();
    const afford = inventory.canAfford(recipe.costs);

    ctx.textAlign = "left";
    ctx.fillStyle = "#fff";
    ctx.font = "bold 22px monospace";
    ctx.fillText(recipe.name, x + 18, y + 26);

    ctx.fillStyle = recipe.tier === "legendary" ? "#ce93d8" : recipe.tier === "advanced" ? "#ffcc80" : "#90caf9";
    ctx.font = "bold 12px monospace";
    ctx.fillText(`${CATEGORY_LABELS[recipe.category]} · ${recipe.tier}`, x + 18, y + 52);

    ctx.fillStyle = "rgba(255,255,255,0.68)";
    ctx.font = "12px monospace";
    this.wrapText(ctx, recipe.description, x + 18, y + 82, w - 36, 18);

    let lineY = y + 142;
    ctx.fillStyle = "#fff";
    ctx.font = "bold 15px monospace";
    ctx.fillText("需要材料", x + 18, lineY);
    lineY += 24;

    for (const cost of recipe.costs) {
      const material = getMaterial(cost.materialId);
      const owned = inventory.get(cost.materialId);
      const ok = owned >= cost.amount;
      ctx.fillStyle = ok ? "#a5d6a7" : "#ef9a9a";
      ctx.font = "13px monospace";
      ctx.fillText(`${material?.icon ?? "?"} ${material?.name ?? cost.materialId}`, x + 24, lineY);
      ctx.textAlign = "right";
      ctx.fillText(`${owned}/${cost.amount}`, x + w - 26, lineY);
      ctx.textAlign = "left";
      lineY += 24;
    }

    lineY += 12;
    ctx.fillStyle = "#fff";
    ctx.font = "bold 15px monospace";
    ctx.fillText("合成结果", x + 18, lineY);
    lineY += 24;

    ctx.fillStyle = "#ffeb3b";
    ctx.font = "bold 14px monospace";
    ctx.fillText(recipe.result.label, x + 24, lineY);
    lineY += 26;

    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = "11px monospace";
    this.wrapText(ctx, `解锁提示：${recipe.unlockHint}`, x + 24, lineY, w - 48, 16);

    this.craftRect = { x: x + w - 176, y: y + h - 54, w: 150, h: 38 };
    this.drawButton(
      ctx,
      this.craftRect,
      afford.ok ? "合成" : "材料不足",
      afford.ok ? "rgba(129,199,132,0.16)" : "rgba(255,255,255,0.06)",
      afford.ok ? "rgba(129,199,132,0.72)" : "rgba(255,255,255,0.16)",
      afford.ok ? "#a5d6a7" : "#777",
      13,
    );
  }

  private visibleRecipes(): RecipeDefinition[] {
    if (this.selectedCategory === "all") return RECIPES;
    return getRecipesByCategory(this.selectedCategory);
  }

  private selectedRecipe(): RecipeDefinition | undefined {
    return RECIPES.find((recipe) => recipe.id === this.selectedRecipeId) ?? this.visibleRecipes()[0];
  }

  private drawPanelBg(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, title: string): void {
    ctx.fillStyle = "rgba(255,255,255,0.055)";
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.lineWidth = 1;
    this.roundRect(ctx, x, y, w, h, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "left";
    ctx.fillText(title, x + 16, y + 24);
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

  private wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number): void {
    let line = "";
    let lineY = y;
    for (const char of text) {
      const test = line + char;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, lineY);
        line = char;
        lineY += lineH;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, lineY);
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
