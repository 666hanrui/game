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

interface CampLayout {
  pad: number;
  topH: number;
  bottomH: number;
  mainY: number;
  mainH: number;
  leftW: number;
  centerX: number;
  centerW: number;
  rightX: number;
  rightW: number;
  compact: boolean;
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
  expedition: "选择区域、难度、天赋槽后开始远征",
  talents: "四字天赋；第一个槽位新手赠送，后续购买",
  workshop: "强化局内补给池，不改变宝箱奖励池",
  apothecary: "药剂进入局内补给池；永久药剂走合成线",
  quests: "阶段目标奖励材料、残页、蓝图和区域进度",
  crafting: "特殊物品主要出口：神话、职业、槽位、区域",
  storage: "只展示可带出局资源，不放血包和磁铁等补给",
  map: "区域收复、推荐难度、Boss 与关键材料",
  archive: "记录怪物、材料、职业路线和区域故事",
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
    this.startButtonRect = { x: 0, y: 0, w: 0, h: 0 };

    const layout = this.getLayout(w, h);

    ctx.save();
    ctx.fillStyle = "#07101f";
    ctx.fillRect(0, 0, w, h);
    this.drawBackground(ctx, w, h);

    this.drawTopBar(ctx, layout.pad, layout.pad, w - layout.pad * 2, layout.topH, layout.compact);
    this.drawModuleNav(ctx, layout.pad, layout.mainY, layout.leftW, layout.mainH, layout.compact);
    this.drawCampScene(ctx, layout.centerX, layout.mainY, layout.centerW, layout.mainH, layout.compact);
    this.drawInfoPanel(ctx, layout.rightX, layout.mainY, layout.rightW, layout.mainH, layout.compact);
    this.drawBottomBar(ctx, layout.pad, h - layout.bottomH - layout.pad, w - layout.pad * 2, layout.bottomH, layout.compact);

    ctx.restore();
  }

  private getLayout(w: number, h: number): CampLayout {
    const compact = w < 1180 || h < 720;
    const pad = compact ? 12 : 22;
    const topH = compact ? 86 : 76;
    const bottomH = compact ? 64 : 74;
    const mainY = pad + topH + (compact ? 10 : 18);
    const mainH = Math.max(360, h - mainY - bottomH - pad);
    const leftW = Math.max(210, Math.min(compact ? 244 : 288, w * 0.23));
    let rightW = Math.max(270, Math.min(compact ? 318 : 370, w * 0.28));
    const gap = compact ? 10 : 18;
    let centerW = w - pad * 2 - leftW - rightW - gap * 2;

    if (centerW < 330) {
      rightW = Math.max(250, rightW + centerW - 330);
      centerW = w - pad * 2 - leftW - rightW - gap * 2;
    }

    centerW = Math.max(300, centerW);

    return {
      pad,
      topH,
      bottomH,
      mainY,
      mainH,
      leftW,
      centerX: pad + leftW + gap,
      centerW,
      rightX: pad + leftW + gap + centerW + gap,
      rightW,
      compact,
    };
  }

  private drawTopBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, compact: boolean): void {
    this.panel(ctx, x, y, w, h, 18, "rgba(16,24,39,0.94)", "rgba(255,255,255,0.14)");

    ctx.textAlign = "left";
    ctx.fillStyle = "#ffca28";
    ctx.font = compact ? "bold 22px monospace" : "bold 26px monospace";
    ctx.fillText("远征营地", x + 22, y + (compact ? 32 : 34));

    ctx.fillStyle = "rgba(255,255,255,0.42)";
    ctx.font = compact ? "11px monospace" : "12px monospace";
    ctx.fillText("局外成长据点", x + 24, y + (compact ? 58 : 58));

    const general = ECONOMY_ITEMS.filter((item) => item.kind === "general");
    const special = ECONOMY_ITEMS.filter((item) => item.kind === "special");
    const groupY = y + (compact ? 12 : 16);
    const groupW = Math.max(170, Math.min(330, (w - (compact ? 210 : 250)) / 2 - 12));
    const generalX = x + (compact ? 188 : 230);
    const specialX = generalX + groupW + 14;

    this.drawResourceGroup(ctx, generalX, groupY, groupW, compact ? 58 : 46, "通用物品", general, "基础成长 / 每局反馈", "general", compact);
    this.drawResourceGroup(ctx, specialX, groupY, groupW, compact ? 58 : 46, "特殊物品", special, "神话 / 职业 / 高阶槽位", "special", compact);
  }

  private drawResourceGroup(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    title: string,
    items: EconomyItemDef[],
    note: string,
    kind: "general" | "special",
    compact: boolean,
  ): void {
    const baseColor = kind === "general" ? "#80deea" : "#ffd54f";
    this.panel(ctx, x, y, w, h, 14, this.alpha(baseColor, kind === "general" ? 0.08 : 0.11), this.alpha(baseColor, 0.38));

    ctx.textAlign = "left";
    ctx.fillStyle = baseColor;
    ctx.font = compact ? "bold 12px monospace" : "bold 13px monospace";
    ctx.fillText(title, x + 12, y + 19);

    ctx.fillStyle = "rgba(255,255,255,0.42)";
    ctx.font = "10px monospace";
    ctx.fillText(note, x + 12, y + 36);

    const icons = items.slice(0, compact ? 3 : 4);
    let ix = x + w - icons.length * 24 - 10;
    for (const item of icons) {
      ctx.fillStyle = this.alpha(item.color, 0.18);
      ctx.strokeStyle = this.alpha(item.color, 0.62);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(ix + 10, y + h / 2, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = item.color;
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.fillText(item.icon, ix + 10, y + h / 2 + 4);
      ix += 24;
    }
  }

  private drawModuleNav(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, compact: boolean): void {
    this.panel(ctx, x, y, w, h, 22, "rgba(13,22,38,0.92)", "rgba(255,255,255,0.12)");

    ctx.fillStyle = "#e1f5fe";
    ctx.font = compact ? "bold 18px monospace" : "bold 21px monospace";
    ctx.textAlign = "left";
    ctx.fillText("营地模块", x + 20, y + 34);

    const itemH = Math.min(compact ? 43 : 50, Math.max(34, (h - 82) / HUB_MODULES.length));
    let cy = y + (compact ? 52 : 62);
    for (const module of HUB_MODULES) {
      const active = module.id === this.selectedModule;
      const color = MODULE_ACCENT[module.id];
      const rect = { x: x + 14, y: cy, w: w - 28, h: itemH - 7, module };
      this.moduleRects.push(rect);

      this.panel(
        ctx,
        rect.x,
        rect.y,
        rect.w,
        rect.h,
        13,
        active ? this.alpha(color, 0.2) : "rgba(255,255,255,0.045)",
        active ? color : "rgba(255,255,255,0.1)",
        active ? 2 : 1,
      );

      if (active) {
        ctx.fillStyle = color;
        ctx.fillRect(rect.x + 6, rect.y + 8, 4, rect.h - 16);
      }

      ctx.fillStyle = color;
      ctx.font = compact ? "bold 14px monospace" : "bold 16px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`${module.icon} ${module.name}`, rect.x + 17, rect.y + rect.h / 2 + 5);
      cy += itemH;
    }

    ctx.fillStyle = "rgba(255,255,255,0.42)";
    ctx.font = compact ? "10px monospace" : "12px monospace";
    ctx.fillText("补给 ≠ 宝箱材料", x + 20, y + h - 42);
    ctx.fillText("宝箱只进入长期成长", x + 20, y + h - 21);
  }

  private drawCampScene(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, compact: boolean): void {
    this.panel(ctx, x, y, w, h, 26, "rgba(7,16,31,0.72)", "rgba(255,255,255,0.12)");

    const fireX = x + w * 0.5;
    const fireY = y + h * 0.55;
    const glow = ctx.createRadialGradient(fireX, fireY, 20, fireX, fireY, Math.min(w, h) * 0.42);
    glow.addColorStop(0, "rgba(255,243,224,0.72)");
    glow.addColorStop(0.34, "rgba(255,202,40,0.28)");
    glow.addColorStop(1, "rgba(255,112,67,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(fireX, fireY, Math.min(w, h) * 0.42, 0, Math.PI * 2);
    ctx.fill();

    this.drawCampWalls(ctx, x, y, w, h);

    const buildingW = compact ? 116 : 148;
    const buildingH = compact ? 64 : 76;
    this.drawBuilding(ctx, x + w * 0.16, y + h * 0.18, buildingW, buildingH, "天赋殿堂", "✦", MODULE_ACCENT.talents, compact);
    this.drawBuilding(ctx, x + w * 0.42, y + h * 0.13, buildingW, buildingH, "道具工坊", "⚒", MODULE_ACCENT.workshop, compact);
    this.drawBuilding(ctx, x + w * 0.68, y + h * 0.18, buildingW, buildingH, "药房", "✚", MODULE_ACCENT.apothecary, compact);
    this.drawBuilding(ctx, x + w * 0.16, y + h * 0.72, buildingW, buildingH, "材料仓库", "▣", MODULE_ACCENT.storage, compact);
    this.drawBuilding(ctx, x + w * 0.43, y + h * 0.78, buildingW, buildingH, "合成系统", "◇", MODULE_ACCENT.crafting, compact);
    this.drawBuilding(ctx, x + w * 0.69, y + h * 0.72, buildingW, buildingH, "收复地图", "◎", MODULE_ACCENT.map, compact);

    this.drawBonfire(ctx, fireX, fireY, compact ? 52 : 68);

    ctx.fillStyle = "#ffca28";
    ctx.font = compact ? "bold 15px monospace" : "bold 20px monospace";
    ctx.textAlign = "center";
    ctx.fillText("前线据点 · 局外成长中枢", fireX, fireY + (compact ? 92 : 116));
  }

  private drawCampWalls(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    ctx.save();
    ctx.strokeStyle = "rgba(255,202,40,0.18)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.12, y + h * 0.38);
    ctx.lineTo(x + w * 0.22, y + h * 0.2);
    ctx.lineTo(x + w * 0.5, y + h * 0.1);
    ctx.lineTo(x + w * 0.78, y + h * 0.2);
    ctx.lineTo(x + w * 0.88, y + h * 0.38);
    ctx.stroke();

    ctx.strokeStyle = "rgba(144,202,249,0.16)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.12, y + h * 0.64);
    ctx.lineTo(x + w * 0.24, y + h * 0.82);
    ctx.lineTo(x + w * 0.5, y + h * 0.9);
    ctx.lineTo(x + w * 0.76, y + h * 0.82);
    ctx.lineTo(x + w * 0.88, y + h * 0.64);
    ctx.stroke();
    ctx.restore();
  }

  private drawBonfire(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
    ctx.fillStyle = "rgba(255,202,40,0.2)";
    ctx.strokeStyle = "#ffca28";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(90,55,22,0.9)";
    ctx.fillRect(x - r * 0.62, y + r * 0.28, r * 1.24, r * 0.16);

    ctx.fillStyle = "#ff8f00";
    ctx.beginPath();
    ctx.moveTo(x - r * 0.34, y + r * 0.45);
    ctx.quadraticCurveTo(x - r * 0.65, y - r * 0.24, x - r * 0.12, y - r * 0.82);
    ctx.quadraticCurveTo(x + r * 0.62, y - r * 0.24, x + r * 0.26, y + r * 0.48);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#fff3e0";
    ctx.beginPath();
    ctx.moveTo(x - r * 0.08, y + r * 0.36);
    ctx.quadraticCurveTo(x - r * 0.27, y - r * 0.12, x + r * 0.13, y - r * 0.55);
    ctx.quadraticCurveTo(x + r * 0.45, y - r * 0.06, x + r * 0.2, y + r * 0.4);
    ctx.closePath();
    ctx.fill();
  }

  private drawInfoPanel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, compact: boolean): void {
    this.panel(ctx, x, y, w, h, 22, "rgba(13,22,38,0.94)", "rgba(255,255,255,0.13)");

    const module = HUB_MODULES.find((item) => item.id === this.selectedModule) ?? HUB_MODULES[0];
    const color = MODULE_ACCENT[module.id];

    ctx.fillStyle = color;
    ctx.font = compact ? "bold 18px monospace" : "bold 22px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`${module.icon} ${module.name}`, x + 22, y + (compact ? 34 : 42));

    this.drawModuleNote(ctx, x + 20, y + (compact ? 48 : 58), w - 40, MODULE_NOTE[module.id], color, compact);

    ctx.fillStyle = "rgba(255,255,255,0.66)";
    ctx.font = compact ? "12px monospace" : "13px monospace";
    const descY = y + (compact ? 94 : 112);
    this.wrapText(ctx, module.description, x + 22, descY, w - 44, compact ? 17 : 19, compact ? 3 : 4);

    ctx.fillStyle = "rgba(255,255,255,0.38)";
    ctx.font = "11px monospace";
    this.wrapText(ctx, `解锁：${module.unlockHint}`, x + 22, descY + (compact ? 60 : 82), w - 44, 16, 2);

    this.drawModuleDetail(ctx, module.id, x + 22, descY + (compact ? 104 : 132), w - 44, h - (compact ? 128 : 156));
  }

  private drawModuleNote(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, text: string, color: string, compact: boolean): void {
    this.panel(ctx, x, y, w, compact ? 32 : 38, 12, this.alpha(color, 0.1), this.alpha(color, 0.34));
    ctx.fillStyle = color;
    ctx.font = compact ? "bold 11px monospace" : "bold 12px monospace";
    ctx.textAlign = "left";
    this.wrapText(ctx, text, x + 12, y + (compact ? 20 : 24), w - 24, 15, compact ? 1 : 2);
  }

  private drawModuleDetail(ctx: CanvasRenderingContext2D, id: HubModuleId, x: number, y: number, w: number, h: number): void {
    switch (id) {
      case "expedition":
        this.drawExpeditionDetail(ctx, x, y, w);
        break;
      case "talents":
        this.drawTalentDetail(ctx, x, y, w, h);
        break;
      case "crafting":
        this.drawCraftingDetail(ctx, x, y, w, h);
        break;
      case "storage":
        this.drawStorageDetail(ctx, x, y, w, h);
        break;
      case "workshop":
      case "apothecary":
        this.drawSupplyResearchDetail(ctx, id, x, y, w);
        break;
      case "quests":
        this.drawListBlock(ctx, x, y, w, "任务方向", ["清剿任务：给通用资源", "Boss 任务：给特殊物品", "区域任务：推进收复进度", "体系试炼：给职业蓝图或残页"], 4);
        break;
      case "map":
        this.drawListBlock(ctx, x, y, w, "区域信息", ["破碎平原：推荐正常", "腐化林地：特殊补给事件", "骸骨荒原：亡者冠片", "晶化废土：星陨晶髓"], 4);
        break;
      case "archive":
        this.drawListBlock(ctx, x, y, w, "档案分类", ["异种图鉴", "Boss 档案", "材料来源", "职业路线", "区域故事"], 5);
        break;
    }

    if (h > 0) {
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText("静态 UI 骨架：模块切换只影响营地面板内部状态。", x, y + Math.max(0, h - 8));
    }
  }

  private drawExpeditionDetail(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
    this.drawListBlock(ctx, x, y, w, "下一次远征", ["当前区域：破碎平原", "推荐难度：正常", "特殊怪：爆炸怪 / 治疗怪", "可能材料：异种残核 / 裂土印记", "可携带天赋槽：1 / 3"], 5);
  }

  private drawTalentDetail(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    ctx.fillStyle = "#ce93d8";
    ctx.font = "bold 15px monospace";
    ctx.fillText("四字天赋预览", x, y);

    const maxRows = h < 250 ? 3 : 4;
    let cy = y + 24;
    for (const talent of META_TALENTS.slice(0, maxRows)) {
      this.drawTalentRow(ctx, talent, x, cy, w);
      cy += 58;
    }
  }

  private drawCraftingDetail(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    ctx.fillStyle = "#b3e5fc";
    ctx.font = "bold 15px monospace";
    ctx.fillText("合成配方预览", x, y);

    const maxRows = h < 250 ? 3 : 4;
    let cy = y + 24;
    for (const recipe of CRAFTING_RECIPES.slice(0, maxRows)) {
      this.drawRecipeRow(ctx, recipe, x, cy, w);
      cy += 56;
    }
  }

  private drawStorageDetail(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    const maxGeneral = h < 280 ? 3 : 4;
    const maxSpecial = h < 280 ? 3 : 4;
    const general = ECONOMY_ITEMS.filter((item) => item.kind === "general").slice(0, maxGeneral);
    const special = ECONOMY_ITEMS.filter((item) => item.kind === "special").slice(0, maxSpecial);

    ctx.fillStyle = "#80deea";
    ctx.font = "bold 15px monospace";
    ctx.fillText("通用物品", x, y);
    let cy = y + 24;
    for (const item of general) {
      this.drawEconomyRow(ctx, item, x, cy, w, "通用");
      cy += 32;
    }

    cy += 8;
    ctx.fillStyle = "#ffd54f";
    ctx.font = "bold 15px monospace";
    ctx.fillText("特殊物品", x, cy);
    cy += 24;
    for (const item of special) {
      this.drawEconomyRow(ctx, item, x, cy, w, "特殊");
      cy += 32;
    }
  }

  private drawSupplyResearchDetail(ctx: CanvasRenderingContext2D, id: HubModuleId, x: number, y: number, w: number): void {
    const title = id === "workshop" ? "工坊研究方向" : "药房研究方向";
    const items = id === "workshop"
      ? ["磁铁范围：通用资源升级", "护盾强度：通用资源升级", "诱饵人偶：需要特殊蓝图", "机械炮台：炮塔蓝图合成项目"]
      : ["血包效率：通用资源升级", "急速药剂：药房基础研究", "永久药剂：特殊物品 + 配方", "净化符：后续区域异常状态预留"];
    this.drawListBlock(ctx, x, y, w, title, items, 4);
  }

  private drawBottomBar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, compact: boolean): void {
    this.panel(ctx, x, y, w, h, 18, "rgba(0,0,0,0.3)", "rgba(255,255,255,0.1)");

    const btnW = compact ? 210 : 260;
    const btnH = compact ? 44 : 50;
    this.startButtonRect = { x: x + w - btnW - 16, y: y + (h - btnH) / 2, w: btnW, h: btnH };

    const glow = ctx.createLinearGradient(this.startButtonRect.x, this.startButtonRect.y, this.startButtonRect.x + btnW, this.startButtonRect.y + btnH);
    glow.addColorStop(0, "rgba(255,202,40,0.3)");
    glow.addColorStop(0.55, "rgba(255,143,0,0.22)");
    glow.addColorStop(1, "rgba(255,202,40,0.12)");
    this.panel(ctx, this.startButtonRect.x - 5, this.startButtonRect.y - 5, btnW + 10, btnH + 10, 22, "rgba(255,202,40,0.08)", "rgba(255,202,40,0.28)");
    this.panel(ctx, this.startButtonRect.x, this.startButtonRect.y, btnW, btnH, 18, glow, "#ffca28", 2.8);

    ctx.fillStyle = "#fff3e0";
    ctx.font = compact ? "bold 18px monospace" : "bold 22px monospace";
    ctx.textAlign = "center";
    ctx.fillText("开始远征", this.startButtonRect.x + btnW / 2, this.startButtonRect.y + btnH / 2 + 7);

    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = compact ? "11px monospace" : "13px monospace";
    const text = compact ? "补给用于本局；宝箱只产出可带出资源。" : "局内补给用于本局战斗；宝箱只产出可带出资源，用于天赋、合成、职业和区域收复。";
    ctx.fillText(text, x + 18, y + h / 2 + 5);
  }

  private drawBuilding(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, name: string, icon: string, color: string, compact: boolean): void {
    this.panel(ctx, x, y, w, h, 18, this.alpha(color, 0.12), this.alpha(color, 0.66), 1.6);
    ctx.fillStyle = this.alpha(color, 0.18);
    ctx.beginPath();
    ctx.moveTo(x + 14, y + h);
    ctx.lineTo(x + w / 2, y - 16);
    ctx.lineTo(x + w - 14, y + h);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = color;
    ctx.font = compact ? "bold 19px monospace" : "bold 24px monospace";
    ctx.textAlign = "center";
    ctx.fillText(icon, x + w / 2, y + (compact ? 28 : 32));
    ctx.font = compact ? "bold 11px monospace" : "bold 13px monospace";
    ctx.fillText(name, x + w / 2, y + (compact ? 50 : 58));
  }

  private drawListBlock(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, title: string, items: string[], maxItems: number): void {
    ctx.fillStyle = "#e1f5fe";
    ctx.font = "bold 15px monospace";
    ctx.textAlign = "left";
    ctx.fillText(title, x, y);

    let cy = y + 26;
    for (const item of items.slice(0, maxItems)) {
      this.panel(ctx, x, cy - 16, w, 28, 9, "rgba(255,255,255,0.04)", "rgba(255,255,255,0.08)");
      ctx.fillStyle = "rgba(255,255,255,0.68)";
      ctx.font = "12px monospace";
      ctx.fillText(`· ${item}`, x + 10, cy + 3);
      cy += 34;
    }
  }

  private drawTalentRow(ctx: CanvasRenderingContext2D, talent: MetaTalentDef, x: number, y: number, w: number): void {
    this.panel(ctx, x, y, w, 48, 12, this.alpha(talent.color, 0.08), this.alpha(talent.color, 0.35));
    ctx.fillStyle = talent.color;
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "left";
    ctx.fillText(talent.name, x + 12, y + 20);
    ctx.fillStyle = "rgba(255,255,255,0.52)";
    ctx.font = "11px monospace";
    ctx.fillText(talent.tags.slice(0, 3).join(" / "), x + 12, y + 37);
  }

  private drawRecipeRow(ctx: CanvasRenderingContext2D, recipe: CraftingRecipeDef, x: number, y: number, w: number): void {
    this.panel(ctx, x, y, w, 48, 12, "rgba(179,229,252,0.06)", "rgba(179,229,252,0.22)");
    ctx.fillStyle = "#b3e5fc";
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "left";
    ctx.fillText(recipe.resultName, x + 12, y + 20);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "11px monospace";
    ctx.fillText(`${recipe.category} · ${recipe.costs.length} 种材料`, x + 12, y + 37);
  }

  private drawEconomyRow(ctx: CanvasRenderingContext2D, item: EconomyItemDef, x: number, y: number, w: number, label: string): void {
    const borderColor = label === "通用" ? "#80deea" : "#ffd54f";
    this.panel(ctx, x, y, w, 26, 8, this.alpha(item.color, 0.08), this.alpha(borderColor, 0.24));
    ctx.fillStyle = item.color;
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`${item.icon} ${item.name}`, x + 10, y + 17);
    ctx.fillStyle = this.alpha(borderColor, 0.8);
    ctx.textAlign = "right";
    ctx.fillText(label, x + w - 10, y + 17);
  }

  private drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const grad = ctx.createRadialGradient(w * 0.52, h * 0.56, 20, w * 0.52, h * 0.56, Math.max(w, h) * 0.56);
    grad.addColorStop(0, "rgba(255,143,0,0.18)");
    grad.addColorStop(0.35, "rgba(41,121,255,0.08)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  private panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string | CanvasGradient, stroke: string, lineWidth = 1): void {
    if (w <= 0 || h <= 0) return;
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    this.roundRect(ctx, x, y, w, h, Math.min(r, w / 2, h / 2));
    ctx.fill();
    ctx.stroke();
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number, maxLines = 4): void {
    if (maxW <= 0 || maxLines <= 0) return;
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
    if (rect.w <= 0 || rect.h <= 0) return false;
    return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
  }
}
