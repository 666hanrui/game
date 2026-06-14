import { Input } from "../core/Input";
import { HUB_MODULES, HubModuleId } from "../data/hubModules";
import { ECONOMY_ITEMS } from "../data/economy";
import type { EconomyItemDef } from "../data/economy";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface CampView {
  scale: number;
  ox: number;
  oy: number;
  toScreen: (x: number, y: number) => { x: number; y: number };
}

type BuildingKind = "gate" | "temple" | "forge" | "apothecary" | "board" | "rune" | "warehouse" | "loot" | "map" | "archive";

interface CampBuilding {
  id: HubModuleId;
  name: string;
  icon: string;
  kind: BuildingKind;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  bossName: string;
  line: string;
  radius: number;
}

interface MaterialMarker {
  label: string;
  color: string;
  name: string;
}

const CAMP_W = 1320;
const CAMP_H = 860;

const MODULE_ACCENT: Record<HubModuleId, string> = {
  expedition: "#ffca28",
  talents: "#ce93d8",
  workshop: "#ffcc80",
  apothecary: "#81c784",
  quests: "#e1f5fe",
  crafting: "#b3e5fc",
  storage: "#90caf9",
  loot: "#ffd54f",
  map: "#ff8a65",
  archive: "#b0bec5",
};

const MATERIAL_MARKERS: MaterialMarker[] = [
  { label: "金", color: "#f6c65b", name: "金叶" },
  { label: "魂", color: "#80deea", name: "魂晶" },
  { label: "核", color: "#b0bec5", name: "异种残核" },
  { label: "骨", color: "#f5f5dc", name: "神话生物骨骼" },
  { label: "符", color: "#ce93d8", name: "古代符文" },
  { label: "机", color: "#90caf9", name: "机械遗芯" },
  { label: "土", color: "#bc8f5a", name: "裂土印记" },
  { label: "星", color: "#ffcc80", name: "星陨金属" },
];

const CAMP_BUILDINGS: CampBuilding[] = [
  { id: "expedition", name: "远征城门", icon: "▲", kind: "gate", x: 585, y: 78, w: 188, h: 138, color: MODULE_ACCENT.expedition, bossName: "前线队长", line: "开始局内战斗，不碰材料系统。", radius: 126 },
  { id: "talents", name: "天赋殿堂", icon: "✦", kind: "temple", x: 218, y: 170, w: 188, h: 132, color: MODULE_ACCENT.talents, bossName: "天赋导师", line: "第一个槽位会由新手引导赠送。", radius: 116 },
  { id: "workshop", name: "铁匠工坊", icon: "⚒", kind: "forge", x: 872, y: 195, w: 206, h: 138, color: MODULE_ACCENT.workshop, bossName: "工坊老板", line: "预留神话武器和装备合成。", radius: 120 },
  { id: "apothecary", name: "药剂屋", icon: "✚", kind: "apothecary", x: 252, y: 560, w: 180, h: 126, color: MODULE_ACCENT.apothecary, bossName: "药房老板", line: "预留永久药剂和局外药剂。", radius: 112 },
  { id: "quests", name: "任务告示牌", icon: "☰", kind: "board", x: 568, y: 615, w: 176, h: 112, color: MODULE_ACCENT.quests, bossName: "任务书记", line: "区域收复、Boss 讨伐、材料任务。", radius: 108 },
  { id: "crafting", name: "符文合成台", icon: "◇", kind: "rune", x: 900, y: 545, w: 180, h: 124, color: MODULE_ACCENT.crafting, bossName: "合成匠", line: "未来读取 RECIPES + meta.spendRecipeMaterials(recipe)。", radius: 116 },
  { id: "storage", name: "材料仓库", icon: "▣", kind: "warehouse", x: 82, y: 365, w: 182, h: 124, color: MODULE_ACCENT.storage, bossName: "仓库管理员", line: "未来读取 meta.getMaterials()。", radius: 110 },
  { id: "loot", name: "宝箱陈列台", icon: "▤", kind: "loot", x: 1088, y: 610, w: 178, h: 116, color: MODULE_ACCENT.loot, bossName: "战利品记录员", line: "未来展示 ChestDropSystem 产物。", radius: 112 },
  { id: "map", name: "收复沙盘", icon: "◎", kind: "map", x: 1092, y: 360, w: 176, h: 120, color: MODULE_ACCENT.map, bossName: "测绘员", line: "最终目标不是刷怪，是收复土地。", radius: 112 },
  { id: "archive", name: "异种档案馆", icon: "?", kind: "archive", x: 590, y: 340, w: 160, h: 112, color: MODULE_ACCENT.archive, bossName: "档案员", line: "见过的怪物、材料和路线都会记录。", radius: 100 },
];

export class HubCampPanel {
  selectedModule: HubModuleId = "expedition";
  private player = { x: CAMP_W / 2, y: CAMP_H / 2 + 160 };
  private camera = { x: CAMP_W / 2, y: CAMP_H / 2 };
  private startButtonRect: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private activeBuilding: CampBuilding | null = null;
  private wasInteractDown = false;
  private interactFlash = 0;
  private interactDown = false;
  private lastView: CampView | null = null;

  constructor() {
    const syncKey = (e: KeyboardEvent, down: boolean) => {
      const key = e.key?.toLowerCase?.() ?? "";
      const code = e.code?.toLowerCase?.() ?? "";
      if (key === "e" || code === "keye") {
        this.interactDown = down;
        if (down) e.preventDefault();
      }
    };
    window.addEventListener("keydown", (e) => syncKey(e, true), { capture: true });
    window.addEventListener("keyup", (e) => syncKey(e, false), { capture: true });
    window.addEventListener("blur", () => { this.interactDown = false; this.wasInteractDown = false; });
  }

  update(input: Input, dt: number, _w: number, _h: number): HubModuleId | "start" | null {
    input.update();

    const move = input.state.moveDir;
    const speed = 245;
    this.player.x += move.x * speed * dt;
    this.player.y += move.y * speed * dt;
    this.player.x = Math.max(46, Math.min(CAMP_W - 46, this.player.x));
    this.player.y = Math.max(72, Math.min(CAMP_H - 48, this.player.y));

    this.camera.x += (this.player.x - this.camera.x) * 0.14;
    this.camera.y += (this.player.y - this.camera.y) * 0.14;

    this.activeBuilding = this.findNearbyBuilding();
    if (this.activeBuilding) this.selectedModule = this.activeBuilding.id;

    if (this.interactFlash > 0) this.interactFlash -= dt;

    const interactPressed = this.interactDown && !this.wasInteractDown;
    this.wasInteractDown = this.interactDown;

    if (interactPressed && this.activeBuilding) {
      this.interactFlash = 0.55;
      this.selectedModule = this.activeBuilding.id;
      if (this.activeBuilding.id === "expedition") return "start";
      return this.activeBuilding.id;
    }

    return null;
  }

  handleClick(x: number, y: number): HubModuleId | "start" | null {
    if (this.inRect(x, y, this.startButtonRect)) return "start";

    const clicked = this.findBuildingAtScreen(x, y);
    if (clicked) {
      this.selectedModule = clicked.id;
      this.activeBuilding = clicked;
      this.interactFlash = 0.28;
      return clicked.id;
    }

    return null;
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    this.startButtonRect = { x: w - 194, y: h - 80, w: 164, h: 54 };

    ctx.save();
    ctx.fillStyle = "#07101f";
    ctx.fillRect(0, 0, w, h);

    const view = this.getView(w, h);
    this.lastView = view;
    this.drawWorldBackground(ctx, view, w, h);
    this.drawRoads(ctx, view);
    this.drawDistrictLabels(ctx, view);
    for (const b of CAMP_BUILDINGS) this.drawBuilding(ctx, view, b);
    this.drawCampPlayer(ctx, view);
    this.drawHud(ctx, w, h);
    this.drawInteractionPanel(ctx, w, h);
    this.drawStartFallback(ctx, w, h);

    ctx.restore();
  }

  private getView(w: number, h: number): CampView {
    const scale = Math.max(0.76, Math.min(1.16, Math.min(w / 1180, h / 760)));
    const camX = Math.max(w / (2 * scale), Math.min(CAMP_W - w / (2 * scale), this.camera.x));
    const camY = Math.max(h / (2 * scale), Math.min(CAMP_H - h / (2 * scale), this.camera.y));
    const ox = w / 2 - camX * scale;
    const oy = h / 2 - camY * scale;
    return { scale, ox, oy, toScreen: (x: number, y: number) => ({ x: x * scale + ox, y: y * scale + oy }) };
  }

  private drawWorldBackground(ctx: CanvasRenderingContext2D, view: CampView, w: number, h: number): void {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#081320");
    g.addColorStop(0.52, "#0b1828");
    g.addColorStop(1, "#15141d");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(view.ox, view.oy);
    ctx.scale(view.scale, view.scale);

    ctx.fillStyle = "rgba(255,255,255,0.02)";
    for (let x = 0; x <= CAMP_W; x += 80) ctx.fillRect(x, 0, 1, CAMP_H);
    for (let y = 0; y <= CAMP_H; y += 80) ctx.fillRect(0, y, CAMP_W, 1);

    const campGlow = ctx.createRadialGradient(CAMP_W / 2, CAMP_H / 2 + 52, 22, CAMP_W / 2, CAMP_H / 2 + 52, 360);
    campGlow.addColorStop(0, "rgba(255,202,40,0.22)");
    campGlow.addColorStop(0.45, "rgba(79,195,247,0.08)");
    campGlow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = campGlow;
    ctx.beginPath();
    ctx.arc(CAMP_W / 2, CAMP_H / 2 + 52, 360, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,202,40,0.22)";
    ctx.lineWidth = 4;
    this.roundRect(ctx, 30, 52, CAMP_W - 60, CAMP_H - 94, 28);
    ctx.stroke();

    this.drawBonfireWorld(ctx, CAMP_W / 2, CAMP_H / 2 + 60);
    ctx.restore();
  }

  private drawBonfireWorld(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.fillStyle = "rgba(255,202,40,0.14)";
    ctx.beginPath();
    ctx.arc(x, y, 92, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,202,40,0.36)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, 66, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#5d4037";
    ctx.fillRect(x - 48, y + 38, 96, 12);
    ctx.fillStyle = "#ff8f00";
    ctx.beginPath();
    ctx.moveTo(x - 20, y + 40);
    ctx.quadraticCurveTo(x - 54, y - 14, x - 8, y - 70);
    ctx.quadraticCurveTo(x + 54, y - 8, x + 18, y + 42);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff3e0";
    ctx.beginPath();
    ctx.moveTo(x + 2, y + 32);
    ctx.quadraticCurveTo(x - 24, y - 8, x + 12, y - 44);
    ctx.quadraticCurveTo(x + 38, y - 4, x + 14, y + 34);
    ctx.closePath();
    ctx.fill();
  }

  private drawRoads(ctx: CanvasRenderingContext2D, view: CampView): void {
    ctx.save();
    ctx.translate(view.ox, view.oy);
    ctx.scale(view.scale, view.scale);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const b of CAMP_BUILDINGS) {
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      ctx.strokeStyle = "rgba(180,210,255,0.13)";
      ctx.lineWidth = 20;
      ctx.beginPath();
      ctx.moveTo(CAMP_W / 2, CAMP_H / 2 + 70);
      ctx.quadraticCurveTo((CAMP_W / 2 + cx) / 2, (CAMP_H / 2 + 70 + cy) / 2 + 16, cx, cy);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawDistrictLabels(ctx: CanvasRenderingContext2D, view: CampView): void {
    const labels = [
      { text: "前线区", x: 646, y: 62, color: MODULE_ACCENT.expedition },
      { text: "工坊区", x: 985, y: 176, color: MODULE_ACCENT.workshop },
      { text: "材料区", x: 156, y: 348, color: MODULE_ACCENT.storage },
      { text: "符文研究区", x: 666, y: 328, color: MODULE_ACCENT.archive },
      { text: "战利品区", x: 1180, y: 594, color: MODULE_ACCENT.loot },
    ];

    ctx.save();
    ctx.textAlign = "center";
    for (const label of labels) {
      const p = view.toScreen(label.x, label.y);
      ctx.fillStyle = this.alpha(label.color, 0.42);
      ctx.font = `bold ${Math.max(10, 12 * view.scale)}px monospace`;
      ctx.fillText(label.text, p.x, p.y);
    }
    ctx.restore();
  }

  private drawBuilding(ctx: CanvasRenderingContext2D, view: CampView, b: CampBuilding): void {
    const p = view.toScreen(b.x, b.y);
    const w = b.w * view.scale;
    const h = b.h * view.scale;
    const active = this.activeBuilding?.id === b.id;
    const selected = this.selectedModule === b.id;

    ctx.save();
    this.drawBuildingShadow(ctx, p.x + w / 2, p.y + h + 8 * view.scale, w * 0.62, h * 0.16, active ? b.color : "#000000", active ? 0.28 : 0.2);

    if (b.kind === "gate") this.drawGate(ctx, p.x, p.y, w, h, b, active, selected);
    else if (b.kind === "temple") this.drawTemple(ctx, p.x, p.y, w, h, b, active, selected);
    else if (b.kind === "forge") this.drawForge(ctx, p.x, p.y, w, h, b, active, selected);
    else if (b.kind === "apothecary") this.drawApothecary(ctx, p.x, p.y, w, h, b, active, selected);
    else if (b.kind === "board") this.drawQuestBoard(ctx, p.x, p.y, w, h, b, active, selected);
    else if (b.kind === "rune") this.drawRuneTable(ctx, p.x, p.y, w, h, b, active, selected);
    else if (b.kind === "warehouse") this.drawWarehouse(ctx, p.x, p.y, w, h, b, active, selected);
    else if (b.kind === "loot") this.drawLootStand(ctx, p.x, p.y, w, h, b, active, selected);
    else if (b.kind === "map") this.drawMapTable(ctx, p.x, p.y, w, h, b, active, selected);
    else this.drawArchive(ctx, p.x, p.y, w, h, b, active, selected);

    this.drawBuildingName(ctx, p.x, p.y, w, h, b, active, selected, view.scale);
    if (active) this.drawInteractPrompt(ctx, p.x + w / 2, p.y - 22 * view.scale, b.color, view.scale);
    ctx.restore();
  }

  private drawBuildingShadow(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string, alpha: number): void {
    ctx.save();
    ctx.fillStyle = this.rgba(color, alpha);
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawBuildingBase(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, b: CampBuilding, active: boolean, selected: boolean): void {
    ctx.fillStyle = active ? this.alpha(b.color, 0.24) : selected ? this.alpha(b.color, 0.14) : "rgba(12,22,39,0.92)";
    ctx.strokeStyle = active ? b.color : selected ? this.alpha(b.color, 0.72) : "rgba(255,255,255,0.16)";
    ctx.lineWidth = active ? 3 : 1.4;
    this.roundRect(ctx, x, y + h * 0.2, w, h * 0.78, 16);
    ctx.fill();
    ctx.stroke();
  }

  private drawGate(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, b: CampBuilding, active: boolean, selected: boolean): void {
    this.drawBuildingBase(ctx, x, y, w, h, b, active, selected);
    const portal = ctx.createRadialGradient(x + w / 2, y + h * 0.58, 4, x + w / 2, y + h * 0.58, w * 0.33);
    portal.addColorStop(0, "rgba(255,255,255,0.92)");
    portal.addColorStop(0.4, this.alpha(b.color, 0.68));
    portal.addColorStop(1, this.alpha(b.color, 0.08));
    ctx.fillStyle = portal;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h * 0.58, w * 0.26, h * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * 0.58, w * 0.32, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = "rgba(10,10,18,0.92)";
    this.roundRect(ctx, x + w * 0.12, y + h * 0.18, w * 0.16, h * 0.72, 8);
    ctx.fill();
    this.roundRect(ctx, x + w * 0.72, y + h * 0.18, w * 0.16, h * 0.72, 8);
    ctx.fill();
    ctx.fillStyle = b.color;
    ctx.fillRect(x + w * 0.08, y + h * 0.12, w * 0.84, h * 0.1);
  }

  private drawTemple(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, b: CampBuilding, active: boolean, selected: boolean): void {
    this.drawBuildingBase(ctx, x, y, w, h, b, active, selected);
    ctx.fillStyle = this.alpha(b.color, 0.24);
    ctx.beginPath();
    ctx.moveTo(x + w * 0.08, y + h * 0.34);
    ctx.lineTo(x + w * 0.5, y - h * 0.02);
    ctx.lineTo(x + w * 0.92, y + h * 0.34);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = b.color;
    ctx.stroke();
    ctx.fillStyle = this.alpha("#ffffff", 0.18);
    for (let i = 0; i < 4; i++) {
      this.roundRect(ctx, x + w * (0.18 + i * 0.18), y + h * 0.42, w * 0.08, h * 0.36, 5);
      ctx.fill();
    }
    ctx.fillStyle = b.color;
    ctx.font = `bold ${Math.max(14, w * 0.18)}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText("✦", x + w / 2, y + h * 0.67);
  }

  private drawForge(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, b: CampBuilding, active: boolean, selected: boolean): void {
    this.drawBuildingBase(ctx, x, y, w, h, b, active, selected);
    ctx.fillStyle = this.alpha("#5d4037", 0.9);
    this.roundRect(ctx, x + w * 0.66, y + h * 0.04, w * 0.15, h * 0.35, 6);
    ctx.fill();
    ctx.fillStyle = this.alpha(b.color, 0.26);
    ctx.beginPath();
    ctx.moveTo(x + w * 0.1, y + h * 0.38);
    ctx.lineTo(x + w * 0.5, y + h * 0.08);
    ctx.lineTo(x + w * 0.92, y + h * 0.38);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = b.color;
    ctx.stroke();
    ctx.fillStyle = "#ff7043";
    ctx.beginPath();
    ctx.moveTo(x + w * 0.25, y + h * 0.72);
    ctx.quadraticCurveTo(x + w * 0.34, y + h * 0.42, x + w * 0.42, y + h * 0.72);
    ctx.fill();
    ctx.strokeStyle = "#cfd8dc";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.56, y + h * 0.68);
    ctx.lineTo(x + w * 0.78, y + h * 0.68);
    ctx.moveTo(x + w * 0.64, y + h * 0.52);
    ctx.lineTo(x + w * 0.72, y + h * 0.82);
    ctx.stroke();
  }

  private drawApothecary(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, b: CampBuilding, active: boolean, selected: boolean): void {
    this.drawBuildingBase(ctx, x, y, w, h, b, active, selected);
    ctx.fillStyle = this.alpha(b.color, 0.22);
    ctx.beginPath();
    ctx.moveTo(x + w * 0.12, y + h * 0.38);
    ctx.lineTo(x + w * 0.5, y + h * 0.1);
    ctx.lineTo(x + w * 0.88, y + h * 0.38);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = b.color;
    ctx.stroke();
    ctx.fillStyle = this.alpha("#ffffff", 0.12);
    this.roundRect(ctx, x + w * 0.24, y + h * 0.48, w * 0.18, h * 0.22, 6);
    ctx.fill();
    this.roundRect(ctx, x + w * 0.58, y + h * 0.48, w * 0.18, h * 0.22, 6);
    ctx.fill();
    ctx.fillStyle = this.alpha(b.color, 0.42);
    ctx.fillRect(x + w * 0.25, y + h * 0.62, w * 0.16, h * 0.06);
    ctx.fillRect(x + w * 0.59, y + h * 0.58, w * 0.16, h * 0.08);
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x + w * 0.5, y + h * 0.68, w * 0.13, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = b.color;
    ctx.font = `bold ${Math.max(12, w * 0.12)}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText("✚", x + w * 0.5, y + h * 0.72);
  }

  private drawQuestBoard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, b: CampBuilding, active: boolean, selected: boolean): void {
    ctx.strokeStyle = "#8d6e63";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.22, y + h * 0.26);
    ctx.lineTo(x + w * 0.22, y + h * 0.95);
    ctx.moveTo(x + w * 0.78, y + h * 0.26);
    ctx.lineTo(x + w * 0.78, y + h * 0.95);
    ctx.stroke();
    ctx.fillStyle = active ? this.alpha(b.color, 0.24) : "rgba(57,45,36,0.94)";
    ctx.strokeStyle = active ? b.color : "rgba(255,255,255,0.18)";
    ctx.lineWidth = active ? 3 : 1.4;
    this.roundRect(ctx, x + w * 0.08, y + h * 0.2, w * 0.84, h * 0.52, 8);
    ctx.fill();
    ctx.stroke();
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i === 1 ? this.alpha(b.color, 0.7) : "rgba(255,255,255,0.28)";
      ctx.fillRect(x + w * 0.22, y + h * (0.34 + i * 0.12), w * 0.56, h * 0.035);
    }
  }

  private drawRuneTable(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, b: CampBuilding, active: boolean, selected: boolean): void {
    this.drawBuildingShadow(ctx, x + w / 2, y + h * 0.76, w * 0.48, h * 0.12, b.color, active ? 0.28 : 0.16);
    ctx.fillStyle = active ? this.alpha(b.color, 0.2) : "rgba(10,18,32,0.9)";
    ctx.strokeStyle = active ? b.color : this.alpha(b.color, 0.54);
    ctx.lineWidth = active ? 3 : 1.8;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h * 0.55, w * 0.38, h * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h * 0.55, w * 0.24, h * 0.18, 0, 0, Math.PI * 2);
    ctx.stroke();
    this.drawMaterialRing(ctx, x + w / 2, y + h * 0.55, Math.min(w, h) * 0.28, MATERIAL_MARKERS.slice(2, 8));
    ctx.fillStyle = b.color;
    ctx.font = `bold ${Math.max(14, w * 0.16)}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText("◇", x + w / 2, y + h * 0.61);
  }

  private drawWarehouse(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, b: CampBuilding, active: boolean, selected: boolean): void {
    this.drawBuildingBase(ctx, x, y, w, h, b, active, selected);
    ctx.fillStyle = this.alpha(b.color, 0.2);
    ctx.beginPath();
    ctx.moveTo(x + w * 0.08, y + h * 0.38);
    ctx.lineTo(x + w * 0.5, y + h * 0.08);
    ctx.lineTo(x + w * 0.92, y + h * 0.38);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = b.color;
    ctx.stroke();
    this.drawStorageCrates(ctx, x, y, w, h);
    ctx.fillStyle = b.color;
    ctx.font = `bold ${Math.max(12, w * 0.12)}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText("▣", x + w * 0.5, y + h * 0.86);
  }

  private drawLootStand(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, b: CampBuilding, active: boolean, selected: boolean): void {
    ctx.fillStyle = active ? this.alpha(b.color, 0.22) : selected ? this.alpha(b.color, 0.14) : "rgba(29,22,10,0.9)";
    ctx.strokeStyle = active ? b.color : this.alpha(b.color, 0.5);
    ctx.lineWidth = active ? 3 : 1.6;
    this.roundRect(ctx, x + w * 0.08, y + h * 0.42, w * 0.84, h * 0.42, 12);
    ctx.fill();
    ctx.stroke();

    const chests = [
      { label: "小", color: "#80deea", scale: 0.82 },
      { label: "大", color: "#ffcc80", scale: 1 },
      { label: "神", color: "#ce93d8", scale: 1.1 },
    ];
    for (let i = 0; i < chests.length; i++) {
      const chest = chests[i];
      const cw = w * 0.18 * chest.scale;
      const ch = h * 0.28 * chest.scale;
      const cx = x + w * (0.25 + i * 0.25) - cw / 2;
      const cy = y + h * (0.42 - i * 0.03);
      ctx.fillStyle = this.alpha(chest.color, 0.2);
      ctx.strokeStyle = chest.color;
      ctx.lineWidth = 2;
      this.roundRect(ctx, cx, cy, cw, ch, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = this.alpha("#000000", 0.35);
      ctx.fillRect(cx, cy + ch * 0.42, cw, ch * 0.14);
      ctx.fillStyle = chest.color;
      ctx.font = `bold ${Math.max(10, w * 0.07)}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText(chest.label, cx + cw / 2, cy + ch * 0.78);
    }

    ctx.strokeStyle = this.alpha(b.color, 0.5);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.14, y + h * 0.84);
    ctx.lineTo(x + w * 0.86, y + h * 0.84);
    ctx.stroke();
    ctx.fillStyle = b.color;
    ctx.font = `bold ${Math.max(11, w * 0.09)}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText("▤", x + w * 0.5, y + h * 0.7);
  }

  private drawMapTable(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, b: CampBuilding, active: boolean, selected: boolean): void {
    this.drawBuildingBase(ctx, x, y, w, h, b, active, selected);
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    this.roundRect(ctx, x + w * 0.16, y + h * 0.32, w * 0.68, h * 0.42, 8);
    ctx.fill();
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = this.alpha(b.color, 0.68);
    ctx.beginPath();
    ctx.moveTo(x + w * 0.26, y + h * 0.56);
    ctx.lineTo(x + w * 0.42, y + h * 0.46);
    ctx.lineTo(x + w * 0.58, y + h * 0.6);
    ctx.lineTo(x + w * 0.74, y + h * 0.42);
    ctx.stroke();
    ctx.fillStyle = b.color;
    for (const p of [[0.26, 0.56], [0.42, 0.46], [0.58, 0.6], [0.74, 0.42]]) {
      ctx.beginPath(); ctx.arc(x + w * p[0], y + h * p[1], 4, 0, Math.PI * 2); ctx.fill();
    }
  }

  private drawArchive(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, b: CampBuilding, active: boolean, selected: boolean): void {
    this.drawBuildingBase(ctx, x, y, w, h, b, active, selected);
    ctx.fillStyle = this.alpha(b.color, 0.2);
    this.roundRect(ctx, x + w * 0.2, y + h * 0.18, w * 0.6, h * 0.22, 9);
    ctx.fill();
    ctx.strokeStyle = b.color;
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i % 2 === 0 ? this.alpha(b.color, 0.66) : "rgba(255,255,255,0.32)";
      this.roundRect(ctx, x + w * (0.24 + i * 0.13), y + h * 0.5, w * 0.08, h * 0.28, 3);
      ctx.fill();
    }
    ctx.fillStyle = b.color;
    ctx.font = `bold ${Math.max(12, w * 0.12)}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText("?", x + w * 0.5, y + h * 0.34);
  }

  private drawStorageCrates(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    const markers = MATERIAL_MARKERS.slice(0, 6);
    ctx.textAlign = "center";
    for (let i = 0; i < markers.length; i++) {
      const marker = markers[i];
      const col = i % 3;
      const row = Math.floor(i / 3);
      const bx = x + w * (0.19 + col * 0.23);
      const by = y + h * (0.5 + row * 0.18);
      const bw = w * 0.16;
      const bh = h * 0.14;
      ctx.fillStyle = this.alpha(marker.color, 0.16);
      ctx.strokeStyle = this.alpha(marker.color, 0.52);
      ctx.lineWidth = 1.5;
      this.roundRect(ctx, bx, by, bw, bh, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = marker.color;
      ctx.font = `bold ${Math.max(9, w * 0.045)}px monospace`;
      ctx.fillText(marker.label, bx + bw / 2, by + bh * 0.72);
    }
  }

  private drawMaterialRing(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, markers: MaterialMarker[]): void {
    ctx.save();
    ctx.textAlign = "center";
    for (let i = 0; i < markers.length; i++) {
      const marker = markers[i];
      const a = -Math.PI / 2 + (i / markers.length) * Math.PI * 2;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      ctx.fillStyle = this.alpha(marker.color, 0.18);
      ctx.strokeStyle = this.alpha(marker.color, 0.6);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(7, r * 0.13), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = marker.color;
      ctx.font = `bold ${Math.max(8, r * 0.16)}px monospace`;
      ctx.fillText(marker.label, x, y + Math.max(3, r * 0.05));
    }
    ctx.restore();
  }

  private drawBuildingName(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, b: CampBuilding, active: boolean, selected: boolean, scale: number): void {
    ctx.textAlign = "center";
    ctx.fillStyle = active ? "#ffffff" : selected ? this.alpha("#ffffff", 0.86) : "rgba(255,255,255,0.72)";
    ctx.font = `bold ${Math.max(10, 13 * scale)}px monospace`;
    ctx.fillText(b.name, x + w / 2, y + h + 17 * scale);
  }

  private drawInteractPrompt(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, scale: number): void {
    const promptW = 96 * scale;
    const promptH = 26 * scale;
    ctx.fillStyle = "rgba(0,0,0,0.68)";
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    this.roundRect(ctx, x - promptW / 2, y - promptH / 2, promptW, promptH, 10 * scale);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = this.interactFlash > 0 ? "#ffffff" : "#ffeb3b";
    ctx.font = `bold ${Math.max(10, 12 * scale)}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText("E 交互", x, y + 4 * scale);
  }

  private drawCampPlayer(ctx: CanvasRenderingContext2D, view: CampView): void {
    const p = view.toScreen(this.player.x, this.player.y);
    const r = 18 * view.scale;
    ctx.save();
    const glow = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, r * 2.4);
    glow.addColorStop(0, "rgba(79,195,247,0.82)");
    glow.addColorStop(1, "rgba(79,195,247,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 2.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#4fc3f7";
    ctx.strokeStyle = "rgba(255,255,255,0.92)";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + r * 0.28, r * 0.72, r * 0.92, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(p.x, p.y - r * 0.62, r * 0.56, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath(); ctx.arc(p.x - r * 0.16, p.y - r * 0.68, r * 0.08, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(p.x + r * 0.18, p.y - r * 0.68, r * 0.08, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${Math.max(10, 12 * view.scale)}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText("你", p.x, p.y + r * 1.75);
    ctx.restore();
  }

  private drawHud(ctx: CanvasRenderingContext2D, w: number, _h: number): void {
    this.panel(ctx, 20, 20, Math.min(540, w - 40), 76, 18, "rgba(8,15,28,0.76)", "rgba(255,255,255,0.14)");
    ctx.fillStyle = "#ffca28";
    ctx.font = "bold 26px monospace";
    ctx.textAlign = "left";
    ctx.fillText("远征营地", 44, 54);
    ctx.fillStyle = "rgba(255,255,255,0.52)";
    ctx.font = "12px monospace";
    ctx.fillText("WASD 移动 · 靠近建筑按 E 交互 · 远征城门开始战斗", 46, 79);

    const general = ECONOMY_ITEMS.filter((item) => item.kind === "general").slice(0, 4);
    const special = ECONOMY_ITEMS.filter((item) => item.kind === "special").slice(0, 4);
    this.drawResourceChips(ctx, w - 528, 20, "通用", general, "#80deea");
    this.drawResourceChips(ctx, w - 528, 58, "特殊", special, "#ffd54f");
  }

  private drawResourceChips(ctx: CanvasRenderingContext2D, x: number, y: number, title: string, items: EconomyItemDef[], color: string): void {
    if (x < 560) return;
    ctx.fillStyle = "rgba(8,15,28,0.72)";
    ctx.strokeStyle = this.alpha(color, 0.34);
    ctx.lineWidth = 1;
    this.roundRect(ctx, x, y, 508, 28, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "left";
    ctx.fillText(title, x + 12, y + 18);
    let ix = x + 64;
    for (const item of items) {
      ctx.fillStyle = item.color;
      ctx.font = "bold 12px monospace";
      ctx.fillText(`${item.icon} ${item.name}`, ix, y + 18);
      ix += 98;
    }
  }

  private drawInteractionPanel(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const module = HUB_MODULES.find((m) => m.id === this.selectedModule) ?? HUB_MODULES[0];
    const building = CAMP_BUILDINGS.find((b) => b.id === this.selectedModule);
    const panelW = Math.min(448, w - 40);
    const panelH = 140;
    const x = 20;
    const y = h - panelH - 22;
    const color = MODULE_ACCENT[this.selectedModule];

    this.panel(ctx, x, y, panelW, panelH, 18, "rgba(8,15,28,0.84)", this.alpha(color, 0.46));
    ctx.textAlign = "left";
    ctx.fillStyle = color;
    ctx.font = "bold 20px monospace";
    ctx.fillText(`${building?.icon ?? module.icon} ${building?.name ?? module.name}`, x + 20, y + 34);
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = "12px monospace";
    this.wrapText(ctx, module.description, x + 20, y + 60, panelW - 40, 18, 3);

    if (building) {
      ctx.fillStyle = this.interactFlash > 0 ? "#ffeb3b" : "rgba(255,255,255,0.54)";
      ctx.font = "bold 12px monospace";
      ctx.fillText(`${building.bossName}：${building.line}`, x + 20, y + panelH - 22);
    }
  }

  private drawStartFallback(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const r = this.startButtonRect;
    const glow = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
    glow.addColorStop(0, "rgba(255,202,40,0.3)");
    glow.addColorStop(1, "rgba(255,143,0,0.18)");
    ctx.fillStyle = glow;
    ctx.strokeStyle = "rgba(255,202,40,0.88)";
    ctx.lineWidth = 2.4;
    this.roundRect(ctx, r.x, r.y, r.w, r.h, 18);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff8e1";
    ctx.font = "bold 18px monospace";
    ctx.textAlign = "center";
    ctx.fillText("开始远征", r.x + r.w / 2, r.y + 33);

    if (w > 960) {
      ctx.fillStyle = "rgba(255,255,255,0.38)";
      ctx.font = "11px monospace";
      ctx.fillText("也可以走到远征城门按 E", r.x + r.w / 2, h - 11);
    }
  }

  private findNearbyBuilding(): CampBuilding | null {
    let result: CampBuilding | null = null;
    let best = Infinity;
    for (const b of CAMP_BUILDINGS) {
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      const dx = this.player.x - cx;
      const dy = this.player.y - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < b.radius && d < best) {
        best = d;
        result = b;
      }
    }
    return result;
  }

  private findBuildingAtScreen(x: number, y: number): CampBuilding | null {
    if (!this.lastView) return null;
    for (const b of CAMP_BUILDINGS) {
      const p = this.lastView.toScreen(b.x, b.y);
      const w = b.w * this.lastView.scale;
      const h = b.h * this.lastView.scale;
      if (this.inRect(x, y, { x: p.x - 10, y: p.y - 20, w: w + 20, h: h + 52 })) return b;
    }
    return null;
  }

  private panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string, stroke: string, lineWidth = 1): void {
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    this.roundRect(ctx, x, y, w, h, r);
    ctx.fill();
    ctx.stroke();
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    if (w <= 0 || h <= 0) return;
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.arcTo(x + w, y, x + w, y + rr, rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
    ctx.lineTo(x + rr, y + h);
    ctx.arcTo(x, y + h, x, y + h - rr, rr);
    ctx.lineTo(x, y + rr);
    ctx.arcTo(x, y, x + rr, y, rr);
    ctx.closePath();
  }

  private inRect(x: number, y: number, r: Rect): boolean {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  private alpha(hex: string, alpha: number): string {
    return this.rgba(hex, alpha);
  }

  private rgba(hex: string, alpha: number): string {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number, maxLines = 4): void {
    let line = "";
    let cy = y;
    let lines = 0;
    for (const char of text) {
      const test = line + char;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, cy);
        lines++;
        if (lines >= maxLines) return;
        line = char;
        cy += lineH;
      } else {
        line = test;
      }
    }
    if (line && lines < maxLines) ctx.fillText(line, x, cy);
  }
}
