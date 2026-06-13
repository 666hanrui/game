import { HUB_MODULES, HubModuleDef, HubModuleId } from "../data/hubModules";
import { ECONOMY_ITEMS, EconomyItemDef } from "../data/economy";
import { META_TALENTS, MetaTalentDef } from "../data/metaTalents";
import { CRAFTING_RECIPES, CraftingRecipeDef } from "../data/craftingRecipes";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface ModuleRect extends Rect {
  module: HubModuleDef;
}

const MODULE_ACCENT: Record<HubModuleId, string> = {
  expedition: "#ffca28",
  talents: "#ce93d8",
  workshop: "#ffcc80",
  apothecary: "#81c784",
  quests: "#e1f5fe",
  crafting: "#b3e5fc",
  storage: "#90caf9",
  map: "#ff8a65",
  archive: "#b0bec5",
};

const MODULE_NOTE: Record<HubModuleId, string> = {
  expedition: "选择区域 / 难度 / 天赋槽后开始远征",
  talents: "四字天赋，第一槽新手赠送，后续购买",
  workshop: "强化局内补给池，不改变宝箱奖励池",
  apothecary: "研究药剂补给，也可解锁永久药剂方向",
  quests: "阶段目标，奖励材料、残页、蓝图和区域进度",
  crafting: "特殊物品主要出口：神话、职业、槽位、区域",
  storage: "只放可带出局资源，不放血包和磁铁等补给",
  map: "区域收复、推荐难度、Boss 与关键材料",
  archive: "怪物、材料、职业路线和区域故事记录",
};

export class HubCampPanel {
  selectedModule: HubModuleId = "expedition";
  private moduleRects: ModuleRect[] = [];
  private startButtonRect: Rect = { x: 0, y: 0, w: 0, h: 0 };

  handleClick(x: number, y: number): HubModuleId | "start" | null {
    if (this.inRect(x, y, this.startButtonRect)) return "start";

    for (const rect of this.moduleRects) {
      if (this.inRect(x, y, rect)) {
        this.selectedModule = rect.module.id;
        return rect.module.id;
      }
    }

    return null;
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    this.moduleRects = [];

    ctx.save();
    ctx.fillStyle = "#07101f";
    ctx.fillRect(0, 0, w, h);
    this.drawBackground(ctx, w, h);

    const pad = 22;
    const topH = 62;
    const leftW = 288;
    const rightW = 360;
    const bottomH = 70;
    const mainY = pad + topH + 18;
    const mainH = h - mainY - bottomH - pad;
    const centerX = pad + leftW + 18;
    const centerW = w - pad * 2 - leftW - rightW - 36;
    const rightX = centerX + centerW + 18;

    this.drawTopBar(ctx, pad, pad, w - pad * 2, topH);
    this.drawModuleNav(ctx, pad, mainY, leftW, mainH);
    this.drawCampScene(ctx, centerX, mainY, centerW, mainH);
    this.drawInfoPanel(ctx, rightX, mainY, rightW, mainH);
    this.drawBottomBar(ctx, pad, h - bottomH - pad, w - pad * 2, bottomH);

    ctx.restore();
  }

  private drawTopBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    this.panel(ctx, x, y, w, h, 18, "rgba(16,24,39,0.94)", "rgba(255,255,255,0.14)");

    ctx.textAlign = "left";
    ctx.fillStyle = "#ffca28";
    ctx.font = "bold 26px monospace";
    ctx.fillText("远征营地", x + 26, y + 39);

    const general = ECONOMY_ITEMS.filter((item) => item.kind === "general").slice(0, 4);
    let rx = x + 220;
    for (const item of general) {
      this.drawResourceChip(ctx, rx, y + 14, item, "通用");
      rx += 165;
    }

    const special = ECONOMY_ITEMS.filter((item) => item.kind === "special").slice(0, 3);
    for (const item of special) {
      this.drawResourceChip(ctx, rx, y + 14, item, "特殊");
      rx += 164;
    }
  }

  private drawModuleNav(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    this.panel(ctx, x, y, w, h, 22, "rgba(13,22,38,0.92)", "rgba(255,255,255,0.12)");

    ctx.fillStyle = "#e1f5fe";
    ctx.font = "bold 21px monospace";
    ctx.textAlign = "left";
    ctx.fillText("营地模块", x + 24, y + 38);

    const itemH = Math.min(50, (h - 86) / HUB_MODULES.length);
    let cy = y + 62;
    for (const module of HUB_MODULES) {
      const active = module.id === this.selectedModule;
      const color = MODULE_ACCENT[module.id];
      const rect = { x: x + 18, y: cy, w: w - 36, h: itemH - 8, module };
      this.moduleRects.push(rect);

      this.panel(
        ctx,
        rect.x,
        rect.y,
        rect.w,
        rect.h,
        13,
        active ? this.alpha(color, 0.18) : "rgba(255,255,255,0.045)",
        active ? color : "rgba(255,255,255,0.1)",
        active ? 2 : 1,
      );

      ctx.fillStyle = color;
      ctx.font = "bold 17px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`${module.icon} ${module.name}`, rect.x + 16, rect.y + 27);
      cy += itemH;
    }

    ctx.fillStyle = "rgba(255,255,255,0.42)";
    ctx.font = "12px monospace";
    ctx.fillText("补给 ≠ 宝箱材料", x + 24, y + h - 44);
    ctx.fillText("宝箱只进入长期成长", x + 24, y + h - 22);
  }

  private drawCampScene(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    this.panel(ctx, x, y, w, h, 26, "rgba(7,16,31,0.7)", "rgba(255,255,255,0.12)");

    const fireX = x + w * 0.52;
    const fireY = y + h * 0.56;
    const glow = ctx.createRadialGradient(fireX, fireY, 20, fireX, fireY, Math.min(w, h) * 0.38);
    glow.addColorStop(0, "rgba(255,243,224,0.72)");
    glow.addColorStop(0.34, "rgba(255,202,40,0.28)");
    glow.addColorStop(1, "rgba(255,112,67,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(fireX, fireY, Math.min(w, h) * 0.38, 0, Math.PI * 2);
    ctx.fill();

    this.drawBuilding(ctx, x + w * 0.18, y + h * 0.2, 150, 82, "天赋殿堂", "✦", MODULE_ACCENT.talents);
    this.drawBuilding(ctx, x + w * 0.43, y + h * 0.14, 160, 82, "道具工坊", "⚒", MODULE_ACCENT.workshop);
    this.drawBuilding(ctx, x + w * 0.68, y + h * 0.2, 150, 82, "药房", "✚", MODULE_ACCENT.apothecary);
    this.drawBuilding(ctx, x + w * 0.2, y + h * 0.72, 170, 82, "材料仓库", "▣", MODULE_ACCENT.storage);
    this.drawBuilding(ctx, x + w * 0.47, y + h * 0.76, 170, 82, "合成系统", "◇", MODULE_ACCENT.crafting);
    this.drawBuilding(ctx, x + w * 0.72, y + h * 0.72, 170, 82, "收复地图", "◎", MODULE_ACCENT.map);

    ctx.fillStyle = "rgba(255,202,40,0.2)";
    ctx.strokeStyle = "#ffca28";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(fireX, fireY, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ff8f00";
    ctx.beginPath();
    ctx.moveTo(fireX - 24, fireY + 32);
    ctx.quadraticCurveTo(fireX - 44, fireY - 18, fireX - 8, fireY - 58);
    ctx.quadraticCurveTo(fireX + 42, fireY - 18, fireX + 18, fireY + 34);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#fff3e0";
    ctx.beginPath();
    ctx.moveTo(fireX - 4, fireY + 28);
    ctx.quadraticCurveTo(fireX - 18, fireY - 8, fireX + 9, fireY - 36);
    ctx.quadraticCurveTo(fireX + 30, fireY - 3, fireX + 13, fireY + 30);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ffca28";
    ctx.font = "bold 20px monospace";
    ctx.textAlign = "center";
    ctx.fillText("营地篝火 · 局外成长中枢", fireX, fireY + 120);
  }

  private drawInfoPanel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    this.panel(ctx, x, y, w, h, 22, "rgba(13,22,38,0.94)", "rgba(255,255,255,0.13)");

    const module = HUB_MODULES.find((item) => item.id === this.selectedModule) ?? HUB_MODULES[0];
    const color = MODULE_ACCENT[module.id];

    ctx.fillStyle = color;
    ctx.font = "bold 22px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`${module.icon} ${module.name}`, x + 24, y + 42);

    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = "13px monospace";
    this.wrapText(ctx, module.description, x + 24, y + 74, w - 48, 19, 4);

    ctx.fillStyle = "rgba(255,255,255,0.42)";
    ctx.font = "12px monospace";
    this.wrapText(ctx, `解锁：${module.unlockHint}`, x + 24, y + 154, w - 48, 18, 2);

    this.drawModuleDetail(ctx, module.id, x + 24, y + 205, w - 48, h - 230);
  }

  private drawModuleDetail(ctx: CanvasRenderingContext2D, id: HubModuleId, x: number, y: number, w: number, h: number): void {
    switch (id) {
      case "expedition":
        this.drawExpeditionDetail(ctx, x, y, w);
        break;
      case "talents":
        this.drawTalentDetail(ctx, x, y, w);
        break;
      case "crafting":
        this.drawCraftingDetail(ctx, x, y, w);
        break;
      case "storage":
        this.drawStorageDetail(ctx, x, y, w);
        break;
      case "workshop":
      case "apothecary":
        this.drawSupplyResearchDetail(ctx, id, x, y, w);
        break;
      case "quests":
        this.drawListBlock(ctx, x, y, w, "任务方向", ["清剿任务：给通用资源", "Boss 任务：给特殊物品", "区域任务：推进收复进度", "体系试炼：给职业蓝图或残页"]);
        break;
      case "map":
        this.drawListBlock(ctx, x, y, w, "区域信息", ["破碎平原：推荐正常", "腐化林地：特殊补给事件", "骸骨荒原：亡者冠片", "晶化废土：星陨晶髓"]);
        break;
      case "archive":
        this.drawListBlock(ctx, x, y, w, "档案分类", ["异种图鉴", "Boss 档案", "材料来源", "职业路线", "区域故事"]);
        break;
    }

    if (h > 0) {
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("提示：这是静态 UI 骨架，暂不接入存档和主循环。", x, y + h - 8);
    }
  }

  private drawExpeditionDetail(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
    this.drawListBlock(ctx, x, y, w, "下一次远征", ["当前区域：破碎平原", "推荐难度：正常", "特殊怪：爆炸怪 / 治疗怪", "可能材料：异种残核 / 裂土印记", "可携带天赋槽：1 / 3"]);
  }

  private drawTalentDetail(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
    ctx.fillStyle = "#ce93d8";
    ctx.font = "bold 15px monospace";
    ctx.fillText("四字天赋预览", x, y);

    let cy = y + 24;
    for (const talent of META_TALENTS.slice(0, 4)) {
      this.drawTalentRow(ctx, talent, x, cy, w);
      cy += 64;
    }
  }

  private drawCraftingDetail(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
    ctx.fillStyle = "#b3e5fc";
    ctx.font = "bold 15px monospace";
    ctx.fillText("合成配方预览", x, y);

    let cy = y + 24;
    for (const recipe of CRAFTING_RECIPES.slice(0, 4)) {
      this.drawRecipeRow(ctx, recipe, x, cy, w);
      cy += 62;
    }
  }

  private drawStorageDetail(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
    const general = ECONOMY_ITEMS.filter((item) => item.kind === "general").slice(0, 4);
    const special = ECONOMY_ITEMS.filter((item) => item.kind === "special").slice(0, 4);

    ctx.fillStyle = "#90caf9";
    ctx.font = "bold 15px monospace";
    ctx.fillText("通用物品", x, y);
    let cy = y + 24;
    for (const item of general) {
      this.drawEconomyRow(ctx, item, x, cy, w);
      cy += 34;
    }

    ctx.fillStyle = "#ffd54f";
    ctx.font = "bold 15px monospace";
    ctx.fillText("特殊物品", x, cy + 12);
    cy += 36;
    for (const item of special) {
      this.drawEconomyRow(ctx, item, x, cy, w);
      cy += 34;
    }
  }

  private drawSupplyResearchDetail(ctx: CanvasRenderingContext2D, id: HubModuleId, x: number, y: number, w: number): void {
    const title = id === "workshop" ? "工坊研究方向" : "药房研究方向";
    const items = id === "workshop"
      ? ["磁铁范围：通用资源升级", "护盾强度：通用资源升级", "诱饵人偶：需要特殊蓝图", "机械炮台：炮塔蓝图合成项目"]
      : ["血包效率：通用资源升级", "急速药剂：药房基础研究", "永久药剂：特殊物品 + 配方", "净化符：后续区域异常状态预留"];
    this.drawListBlock(ctx, x, y, w, title, items);
  }

  private drawBottomBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    this.panel(ctx, x, y, w, h, 18, "rgba(0,0,0,0.28)", "rgba(255,255,255,0.1)");

    const btnW = 240;
    const btnH = 46;
    this.startButtonRect = { x: x + w - btnW - 18, y: y + 12, w: btnW, h: btnH };
    this.panel(ctx, this.startButtonRect.x, this.startButtonRect.y, btnW, btnH, 18, "rgba(255,202,40,0.18)", "#ffca28", 2.4);
    ctx.fillStyle = "#ffca28";
    ctx.font = "bold 20px monospace";
    ctx.textAlign = "center";
    ctx.fillText("开始远征", this.startButtonRect.x + btnW / 2, this.startButtonRect.y + 30);

    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,0.52)";
    ctx.font = "13px monospace";
    ctx.fillText("局内补给用于本局战斗；宝箱只产出可带出资源，用于天赋、合成、职业和区域收复。", x + 20, y + 31);
  }

  private drawResourceChip(ctx: CanvasRenderingContext2D, x: number, y: number, item: EconomyItemDef, label: string): void {
    this.panel(ctx, x, y, 148, 34, 12, this.alpha(item.color, 0.1), this.alpha(item.color, 0.35));
    ctx.fillStyle = item.color;
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`${item.icon} ${item.name}`, x + 10, y + 22);
    ctx.fillStyle = "rgba(255,255,255,0.38)";
    ctx.font = "10px monospace";
    ctx.textAlign = "right";
    ctx.fillText(label, x + 138, y + 22);
  }

  private drawBuilding(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, name: string, icon: string, color: string): void {
    this.panel(ctx, x, y, w, h, 18, this.alpha(color, 0.11), this.alpha(color, 0.65), 1.5);
    ctx.fillStyle = color;
    ctx.font = "bold 24px monospace";
    ctx.textAlign = "center";
    ctx.fillText(icon, x + w / 2, y + 34);
    ctx.font = "bold 14px monospace";
    ctx.fillText(name, x + w / 2, y + 62);
  }

  private drawListBlock(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, title: string, items: string[]): void {
    ctx.fillStyle = "#e1f5fe";
    ctx.font = "bold 15px monospace";
    ctx.textAlign = "left";
    ctx.fillText(title, x, y);

    let cy = y + 26;
    for (const item of items) {
      this.panel(ctx, x, cy - 16, w, 28, 9, "rgba(255,255,255,0.04)", "rgba(255,255,255,0.08)");
      ctx.fillStyle = "rgba(255,255,255,0.68)";
      ctx.font = "12px monospace";
      ctx.fillText(`· ${item}`, x + 10, cy + 3);
      cy += 34;
    }
  }

  private drawTalentRow(ctx: CanvasRenderingContext2D, talent: MetaTalentDef, x: number, y: number, w: number): void {
    this.panel(ctx, x, y, w, 52, 12, this.alpha(talent.color, 0.08), this.alpha(talent.color, 0.35));
    ctx.fillStyle = talent.color;
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "left";
    ctx.fillText(talent.name, x + 12, y + 22);
    ctx.fillStyle = "rgba(255,255,255,0.52)";
    ctx.font = "11px monospace";
    ctx.fillText(talent.tags.slice(0, 3).join(" / "), x + 12, y + 40);
  }

  private drawRecipeRow(ctx: CanvasRenderingContext2D, recipe: CraftingRecipeDef, x: number, y: number, w: number): void {
    this.panel(ctx, x, y, w, 50, 12, "rgba(179,229,252,0.06)", "rgba(179,229,252,0.22)");
    ctx.fillStyle = "#b3e5fc";
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "left";
    ctx.fillText(recipe.resultName, x + 12, y + 21);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "11px monospace";
    ctx.fillText(`${recipe.category} · ${recipe.costs.length} 种材料`, x + 12, y + 39);
  }

  private drawEconomyRow(ctx: CanvasRenderingContext2D, item: EconomyItemDef, x: number, y: number, w: number): void {
    this.panel(ctx, x, y, w, 26, 8, this.alpha(item.color, 0.08), this.alpha(item.color, 0.24));
    ctx.fillStyle = item.color;
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`${item.icon} ${item.name}`, x + 10, y + 17);
    ctx.fillStyle = "rgba(255,255,255,0.42)";
    ctx.textAlign = "right";
    ctx.fillText(item.kind === "general" ? "通用" : "特殊", x + w - 10, y + 17);
  }

  private drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const grad = ctx.createRadialGradient(w * 0.52, h * 0.56, 20, w * 0.52, h * 0.56, Math.max(w, h) * 0.56);
    grad.addColorStop(0, "rgba(255,143,0,0.18)");
    grad.addColorStop(0.35, "rgba(41,121,255,0.08)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  private panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string, stroke: string, lineWidth = 1): void {
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    this.roundRect(ctx, x, y, w, h, r);
    ctx.fill();
    ctx.stroke();
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number, maxLines = 4): void {
    const chars = text.split("");
    let line = "";
    let lines = 0;
    let ly = y;

    for (const ch of chars) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxW && line.length > 0) {
        ctx.fillText(line, x, ly);
        lines++;
        if (lines >= maxLines) return;
        line = ch;
        ly += lineH;
      } else {
        line = test;
      }
    }

    if (line && lines < maxLines) ctx.fillText(line, x, ly);
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

  private alpha(hex: string, amount: number): string {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${amount})`;
  }

  private inRect(x: number, y: number, rect: Rect): boolean {
    return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
  }
}
