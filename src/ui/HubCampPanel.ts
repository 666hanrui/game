import { Input } from "../core/Input";
import { HUB_MODULES, HubModuleId } from "../data/hubModules";
import { ECONOMY_ITEMS } from "../data/economy";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface CampBuilding {
  id: HubModuleId;
  name: string;
  icon: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  bossName: string;
  line: string;
}

const CAMP_W = 1200;
const CAMP_H = 760;

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

const CAMP_BUILDINGS: CampBuilding[] = [
  { id: "expedition", name: "远征门", icon: "▲", x: 610, y: 128, w: 150, h: 96, color: MODULE_ACCENT.expedition, bossName: "前线队长", line: "准备好了就按 E 出发。" },
  { id: "talents", name: "天赋殿堂", icon: "✦", x: 230, y: 180, w: 160, h: 112, color: MODULE_ACCENT.talents, bossName: "天赋导师", line: "第一个槽位会由新手引导赠送。" },
  { id: "workshop", name: "道具工坊", icon: "⚒", x: 790, y: 220, w: 170, h: 112, color: MODULE_ACCENT.workshop, bossName: "工坊老板", line: "补给池归我管，宝箱材料别往我这塞。" },
  { id: "apothecary", name: "药房", icon: "✚", x: 255, y: 480, w: 160, h: 104, color: MODULE_ACCENT.apothecary, bossName: "药房老板", line: "药剂是局内补给，永久药剂要靠合成。" },
  { id: "quests", name: "任务板", icon: "☰", x: 525, y: 540, w: 150, h: 90, color: MODULE_ACCENT.quests, bossName: "任务书记", line: "清剿、材料、Boss、区域收复，都在这里记账。" },
  { id: "crafting", name: "合成台", icon: "◇", x: 810, y: 495, w: 150, h: 96, color: MODULE_ACCENT.crafting, bossName: "合成匠", line: "神话骨骼这种珍贵材料，应该合大东西。" },
  { id: "storage", name: "材料仓库", icon: "▣", x: 85, y: 330, w: 150, h: 96, color: MODULE_ACCENT.storage, bossName: "仓库管理员", line: "通用物品和特殊物品分开放。" },
  { id: "map", name: "收复地图", icon: "◎", x: 1000, y: 330, w: 150, h: 96, color: MODULE_ACCENT.map, bossName: "测绘员", line: "最终目标不是刷怪，是收复土地。" },
  { id: "archive", name: "异种档案", icon: "?", x: 545, y: 300, w: 116, h: 86, color: MODULE_ACCENT.archive, bossName: "档案员", line: "你见过的异种、材料和路线都会记录。" },
];

export class HubCampPanel {
  selectedModule: HubModuleId = "expedition";
  private player = { x: CAMP_W / 2, y: CAMP_H / 2 + 135 };
  private camera = { x: CAMP_W / 2, y: CAMP_H / 2 };
  private startButtonRect: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private activeBuilding: CampBuilding | null = null;
  private wasInteractDown = false;
  private interactFlash = 0;

  update(input: Input, dt: number, w: number, h: number): HubModuleId | "start" | null {
    input.update();

    const move = input.state.moveDir;
    const speed = 235;
    this.player.x += move.x * speed * dt;
    this.player.y += move.y * speed * dt;
    this.player.x = Math.max(44, Math.min(CAMP_W - 44, this.player.x));
    this.player.y = Math.max(72, Math.min(CAMP_H - 44, this.player.y));

    const targetCamX = this.player.x;
    const targetCamY = this.player.y;
    this.camera.x += (targetCamX - this.camera.x) * 0.14;
    this.camera.y += (targetCamY - this.camera.y) * 0.14;

    this.activeBuilding = this.findNearbyBuilding();
    if (this.activeBuilding) this.selectedModule = this.activeBuilding.id;

    if (this.interactFlash > 0) this.interactFlash -= dt;

    const interactDown = input.isKeyDown("e") || input.isKeyDown(" ");
    if (interactDown && !this.wasInteractDown && this.activeBuilding) {
      this.interactFlash = 0.55;
      this.selectedModule = this.activeBuilding.id;
      this.wasInteractDown = interactDown;
      if (this.activeBuilding.id === "expedition") return "start";
      return this.activeBuilding.id;
    }
    this.wasInteractDown = interactDown;

    return null;
  }

  handleClick(x: number, y: number): HubModuleId | "start" | null {
    if (this.inRect(x, y, this.startButtonRect)) return "start";
    return null;
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    this.startButtonRect = { x: w - 190, y: h - 78, w: 158, h: 52 };

    ctx.save();
    ctx.fillStyle = "#07101f";
    ctx.fillRect(0, 0, w, h);

    const view = this.getView(w, h);
    this.drawWorldBackground(ctx, view, w, h);
    this.drawRoads(ctx, view);
    for (const b of CAMP_BUILDINGS) this.drawBuilding(ctx, view, b);
    this.drawCampPlayer(ctx, view);
    this.drawHud(ctx, w, h);
    this.drawInteractionPanel(ctx, w, h);
    this.drawStartFallback(ctx, w, h);

    ctx.restore();
  }

  private getView(w: number, h: number) {
    const scale = Math.max(0.82, Math.min(1.15, Math.min(w / 1180, h / 760)));
    const camX = Math.max(w / (2 * scale), Math.min(CAMP_W - w / (2 * scale), this.camera.x));
    const camY = Math.max(h / (2 * scale), Math.min(CAMP_H - h / (2 * scale), this.camera.y));
    return {
      scale,
      ox: w / 2 - camX * scale,
      oy: h / 2 - camY * scale,
      toScreen: (x: number, y: number) => ({ x: x * scale + w / 2 - camX * scale, y: y * scale + h / 2 - camY * scale }),
    };
  }

  private drawWorldBackground(ctx: CanvasRenderingContext2D, view: ReturnType<HubCampPanel["getView"]>, w: number, h: number): void {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#081320");
    g.addColorStop(0.55, "#0b1828");
    g.addColorStop(1, "#11131b");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(view.ox, view.oy);
    ctx.scale(view.scale, view.scale);

    ctx.fillStyle = "rgba(255,255,255,0.025)";
    for (let x = 0; x <= CAMP_W; x += 80) {
      ctx.fillRect(x, 0, 1, CAMP_H);
    }
    for (let y = 0; y <= CAMP_H; y += 80) {
      ctx.fillRect(0, y, CAMP_W, 1);
    }

    ctx.strokeStyle = "rgba(255,202,40,0.22)";
    ctx.lineWidth = 3;
    ctx.strokeRect(28, 48, CAMP_W - 56, CAMP_H - 86);

    ctx.fillStyle = "rgba(255,202,40,0.18)";
    ctx.beginPath();
    ctx.arc(CAMP_W / 2, CAMP_H / 2 + 30, 86, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ff8f00";
    ctx.beginPath();
    ctx.moveTo(CAMP_W / 2, CAMP_H / 2 - 22);
    ctx.quadraticCurveTo(CAMP_W / 2 - 42, CAMP_H / 2 + 45, CAMP_W / 2, CAMP_H / 2 + 68);
    ctx.quadraticCurveTo(CAMP_W / 2 + 42, CAMP_H / 2 + 45, CAMP_W / 2, CAMP_H / 2 - 22);
    ctx.fill();
    ctx.fillStyle = "#fff3e0";
    ctx.beginPath();
    ctx.moveTo(CAMP_W / 2 + 10, CAMP_H / 2 - 8);
    ctx.quadraticCurveTo(CAMP_W / 2 - 18, CAMP_H / 2 + 32, CAMP_W / 2 + 10, CAMP_H / 2 + 52);
    ctx.quadraticCurveTo(CAMP_W / 2 + 34, CAMP_H / 2 + 26, CAMP_W / 2 + 10, CAMP_H / 2 - 8);
    ctx.fill();

    ctx.restore();
  }

  private drawRoads(ctx: CanvasRenderingContext2D, view: ReturnType<HubCampPanel["getView"]>): void {
    ctx.save();
    ctx.translate(view.ox, view.oy);
    ctx.scale(view.scale, view.scale);
    ctx.strokeStyle = "rgba(180,210,255,0.14)";
    ctx.lineWidth = 18;
    ctx.lineCap = "round";
    for (const b of CAMP_BUILDINGS) {
      ctx.beginPath();
      ctx.moveTo(CAMP_W / 2, CAMP_H / 2 + 38);
      ctx.lineTo(b.x + b.w / 2, b.y + b.h / 2);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 2;
    for (const b of CAMP_BUILDINGS) {
      ctx.beginPath();
      ctx.moveTo(CAMP_W / 2, CAMP_H / 2 + 38);
      ctx.lineTo(b.x + b.w / 2, b.y + b.h / 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawBuilding(ctx: CanvasRenderingContext2D, view: ReturnType<HubCampPanel["getView"]>, b: CampBuilding): void {
    const p = view.toScreen(b.x, b.y);
    const w = b.w * view.scale;
    const h = b.h * view.scale;
    const active = this.activeBuilding?.id === b.id;
    const selected = this.selectedModule === b.id;

    ctx.save();
    ctx.fillStyle = active ? this.alpha(b.color, 0.28) : selected ? this.alpha(b.color, 0.18) : "rgba(13,22,38,0.92)";
    ctx.strokeStyle = active ? b.color : selected ? this.alpha(b.color, 0.72) : "rgba(255,255,255,0.16)";
    ctx.lineWidth = active ? 3 : 1.5;
    this.roundRect(ctx, p.x, p.y, w, h, 16 * view.scale);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = this.alpha(b.color, 0.2);
    ctx.beginPath();
    ctx.moveTo(p.x + w * 0.12, p.y + h * 0.36);
    ctx.lineTo(p.x + w * 0.5, p.y - h * 0.18);
    ctx.lineTo(p.x + w * 0.88, p.y + h * 0.36);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = this.alpha(b.color, 0.54);
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = b.color;
    ctx.font = `bold ${Math.max(15, 22 * view.scale)}px monospace`;
    ctx.fillText(b.icon, p.x + w / 2, p.y + h * 0.46);
    ctx.fillStyle = active ? "#ffffff" : "rgba(255,255,255,0.78)";
    ctx.font = `bold ${Math.max(10, 14 * view.scale)}px monospace`;
    ctx.fillText(b.name, p.x + w / 2, p.y + h * 0.72);

    if (active) {
      ctx.fillStyle = "rgba(0,0,0,0.62)";
      this.roundRect(ctx, p.x + w * 0.08, p.y - 30, w * 0.84, 24, 9);
      ctx.fill();
      ctx.fillStyle = "#ffeb3b";
      ctx.font = `bold ${Math.max(10, 12 * view.scale)}px monospace`;
      ctx.fillText("按 E 交互", p.x + w / 2, p.y - 13);
    }

    ctx.restore();
  }

  private drawCampPlayer(ctx: CanvasRenderingContext2D, view: ReturnType<HubCampPanel["getView"]>): void {
    const p = view.toScreen(this.player.x, this.player.y);
    const r = 18 * view.scale;
    ctx.save();
    const glow = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, r * 2.2);
    glow.addColorStop(0, "rgba(79,195,247,0.8)");
    glow.addColorStop(1, "rgba(79,195,247,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 2.2, 0, Math.PI * 2);
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

  private drawHud(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    this.panel(ctx, 20, 20, Math.min(500, w - 40), 74, 18, "rgba(8,15,28,0.72)", "rgba(255,255,255,0.14)");
    ctx.fillStyle = "#ffca28";
    ctx.font = "bold 26px monospace";
    ctx.textAlign = "left";
    ctx.fillText("远征营地", 44, 54);
    ctx.fillStyle = "rgba(255,255,255,0.52)";
    ctx.font = "12px monospace";
    ctx.fillText("WASD 移动 · 靠近建筑按 E 交互 · 去远征门开始战斗", 46, 78);

    const general = ECONOMY_ITEMS.filter((item) => item.kind === "general").slice(0, 4);
    const special = ECONOMY_ITEMS.filter((item) => item.kind === "special").slice(0, 4);
    this.drawResourceChips(ctx, w - 520, 20, "通用", general, "#80deea");
    this.drawResourceChips(ctx, w - 520, 58, "特殊", special, "#ffd54f");
  }

  private drawResourceChips(ctx: CanvasRenderingContext2D, x: number, y: number, title: string, items: typeof ECONOMY_ITEMS, color: string): void {
    if (x < 540) return;
    ctx.fillStyle = "rgba(8,15,28,0.72)";
    ctx.strokeStyle = this.alpha(color, 0.34);
    ctx.lineWidth = 1;
    this.roundRect(ctx, x, y, 500, 28, 12);
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
      ix += 96;
    }
  }

  private drawInteractionPanel(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const module = HUB_MODULES.find((m) => m.id === this.selectedModule) ?? HUB_MODULES[0];
    const building = CAMP_BUILDINGS.find((b) => b.id === this.selectedModule);
    const panelW = Math.min(420, w - 40);
    const panelH = 132;
    const x = 20;
    const y = h - panelH - 22;
    const color = MODULE_ACCENT[this.selectedModule];

    this.panel(ctx, x, y, panelW, panelH, 18, "rgba(8,15,28,0.82)", this.alpha(color, 0.42));
    ctx.textAlign = "left";
    ctx.fillStyle = color;
    ctx.font = "bold 20px monospace";
    ctx.fillText(`${module.icon} ${module.name}`, x + 20, y + 34);
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = "12px monospace";
    this.wrapText(ctx, module.description, x + 20, y + 60, panelW - 40, 18);

    if (building) {
      ctx.fillStyle = this.interactFlash > 0 ? "#ffeb3b" : "rgba(255,255,255,0.52)";
      ctx.font = "bold 12px monospace";
      ctx.fillText(`${building.bossName}：${building.line}`, x + 20, y + panelH - 20);
    }
  }

  private drawStartFallback(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const r = this.startButtonRect;
    this.panel(ctx, r.x, r.y, r.w, r.h, 18, "rgba(255,202,40,0.2)", "rgba(255,202,40,0.8)", 2.4);
    ctx.fillStyle = "#fff8e1";
    ctx.font = "bold 18px monospace";
    ctx.textAlign = "center";
    ctx.fillText("开始远征", r.x + r.w / 2, r.y + 32);
  }

  private findNearbyBuilding(): CampBuilding | null {
    let result: CampBuilding | null = null;
    let best = 96;
    for (const b of CAMP_BUILDINGS) {
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      const dx = this.player.x - cx;
      const dy = this.player.y - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < best) {
        best = d;
        result = b;
      }
    }
    return result;
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

  private inRect(x: number, y: number, r: Rect): boolean {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  private alpha(hex: string, alpha: number): string {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number): void {
    let line = "";
    let cy = y;
    for (const char of text) {
      const test = line + char;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, cy);
        line = char;
        cy += lineH;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, cy);
  }
}
