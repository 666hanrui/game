import { Input } from "../core/Input";
import { HUB_MODULES } from "../data/hubModules";
import type { HubModuleId } from "../data/hubModules";
import { getHubActionByModule, getHubSubPanelId } from "../data/hubActions";
import type { HubCampAction } from "../data/hubActions";
import { ASSET_MANIFEST } from "../data/assetManifest";
import {
  CAMP_BUILDINGS,
  CAMP_COLLIDERS,
  CAMP_H,
  CAMP_PLAY_BOUNDS,
  CAMP_W,
  DEBUG_HUB_COLLIDERS,
  DEBUG_HUB_FOOTPRINT,
  HUB_ART_PATHS,
  MODULE_ACCENT,
  PLAYER_COLLISION_R,
} from "../data/hubCampLayout";
import type { CampBuilding, HubArtKey, HubAvatarDirection, Rect } from "../data/hubCampLayout";

export type { HubCampAction } from "../data/hubActions";

type HubCampInteraction = HubCampAction;

interface CampView {
  scale: number;
  ox: number;
  oy: number;
  toScreen: (x: number, y: number) => { x: number; y: number };
  toWorld: (x: number, y: number) => { x: number; y: number };
}

interface SceneItem {
  depth: number;
  draw: () => void;
}

export class HubCampPanel {
  selectedModule: HubModuleId = "expedition";
  private player = { x: CAMP_W / 2, y: CAMP_H / 2 + 160 };
  private camera = { x: CAMP_W / 2, y: CAMP_H / 2 };
  private startButtonRect: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private activeBuilding: CampBuilding | null = null;
  private wasInteractDown = false;
  private interactDown = false;
  private interactFlash = 0;
  private lastView: CampView | null = null;
  private readonly hubImages = new Map<HubArtKey, HTMLImageElement>();
  private readonly cleanedHubImages = new Map<HubArtKey, CanvasImageSource>();
  private readonly humanWalkSheet = new Image();
  private avatarDirection: HubAvatarDirection = "down";
  private avatarMoving = false;
  private avatarAnimTime = 0;

  constructor() {
    this.loadHubImages();
    this.humanWalkSheet.src = ASSET_MANIFEST.raceWalkSheets.human;

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
    window.addEventListener("blur", () => {
      this.interactDown = false;
      this.wasInteractDown = false;
    });
  }

  update(input: Input, dt: number, _w: number, _h: number): HubCampInteraction | null {
    input.update();
    const move = input.state.moveDir;
    const speed = 245;

    this.avatarMoving = Math.abs(move.x) > 0.01 || Math.abs(move.y) > 0.01;
    if (this.avatarMoving) {
      this.avatarAnimTime += dt;
      if (Math.abs(move.x) > Math.abs(move.y)) this.avatarDirection = move.x > 0 ? "right" : "left";
      else this.avatarDirection = move.y > 0 ? "down" : "up";
    } else {
      this.avatarAnimTime = 0;
    }

    this.tryMove(move.x * speed * dt, 0);
    this.tryMove(0, move.y * speed * dt);
    this.camera.x += (this.player.x - this.camera.x) * 0.14;
    this.camera.y += (this.player.y - this.camera.y) * 0.14;

    this.activeBuilding = this.findNearbyBuilding();
    if (this.activeBuilding) this.selectedModule = this.activeBuilding.id;
    if (this.interactFlash > 0) this.interactFlash -= dt;

    const pressed = this.interactDown && !this.wasInteractDown;
    this.wasInteractDown = this.interactDown;
    if (pressed && this.activeBuilding) {
      this.interactFlash = 0.5;
      return this.getBuildingInteraction(this.activeBuilding);
    }
    return null;
  }

  handleClick(x: number, y: number): HubCampInteraction | null {
    if (this.inRect(x, y, this.startButtonRect)) return this.getModuleInteraction("expedition");
    const clicked = this.findBuildingAtScreen(x, y);
    if (!clicked) return null;
    this.selectedModule = clicked.id;
    this.activeBuilding = clicked;
    this.interactFlash = 0.28;
    return this.getBuildingInteraction(clicked);
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number, _game?: unknown): void {
    this.startButtonRect = { x: w - 194, y: h - 80, w: 164, h: 54 };
    const view = this.getView(w, h);
    this.lastView = view;

    ctx.save();
    this.drawGroundLayer(ctx, view, w, h);
    this.drawSceneLayer(ctx, view);
    this.drawFrontOverlayLayer(ctx, view);
    this.drawInteractionHints(ctx, view);
    this.drawDebugFootprints(ctx, view);
    this.drawEdgeFogOverlay(ctx, w, h);
    this.drawHud(ctx, w);
    this.drawInteractionPanel(ctx, w, h);
    this.drawStartFallback(ctx, w, h);
    ctx.restore();
  }

  private loadHubImages(): void {
    for (const [key, src] of Object.entries(HUB_ART_PATHS) as [HubArtKey, string][]) {
      const img = new Image();
      img.src = src;
      this.hubImages.set(key, img);
    }
  }

  private getHubImage(key: HubArtKey): HTMLImageElement | null {
    const img = this.hubImages.get(key);
    if (!img || !img.complete || img.naturalWidth <= 0) return null;
    return img;
  }

  private getHubDrawable(key: HubArtKey): CanvasImageSource | null {
    const img = this.getHubImage(key);
    if (!img) return null;
    if (key === "campGround") return img;

    const cached = this.cleanedHubImages.get(key);
    if (cached) return cached;

    const cleaned = this.buildCleanedSprite(img);
    this.cleanedHubImages.set(key, cleaned);
    return cleaned;
  }

  private buildCleanedSprite(img: HTMLImageElement): CanvasImageSource {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const cx = canvas.getContext("2d", { willReadFrequently: true });
    if (!cx) return img;

    cx.drawImage(img, 0, 0);
    const data = cx.getImageData(0, 0, canvas.width, canvas.height);
    const arr = data.data;
    const w = canvas.width;
    const h = canvas.height;
    const seen = new Uint8Array(w * h);
    const stack: number[] = [];

    const isNearWhite = (idx: number) => {
      const i = idx * 4;
      return arr[i + 3] > 0 && arr[i] > 238 && arr[i + 1] > 238 && arr[i + 2] > 238;
    };

    const isCheckerPollution = (idx: number) => {
      const i = idx * 4;
      const r = arr[i];
      const g = arr[i + 1];
      const b = arr[i + 2];
      const a = arr[i + 3];
      if (a === 0) return true;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const neutral = max - min <= 18;
      return neutral && (max > 186 || max < 74);
    };

    const isEdgeGarbage = (idx: number) => isNearWhite(idx) || isCheckerPollution(idx);
    const pushIf = (idx: number) => {
      if (idx < 0 || idx >= seen.length || seen[idx]) return;
      if (!isEdgeGarbage(idx)) return;
      seen[idx] = 1;
      stack.push(idx);
    };

    for (let x = 0; x < w; x++) {
      pushIf(x);
      pushIf((h - 1) * w + x);
    }
    for (let y = 0; y < h; y++) {
      pushIf(y * w);
      pushIf(y * w + w - 1);
    }

    while (stack.length > 0) {
      const idx = stack.pop()!;
      const x = idx % w;
      const y = Math.floor(idx / w);
      if (x > 0) pushIf(idx - 1);
      if (x < w - 1) pushIf(idx + 1);
      if (y > 0) pushIf(idx - w);
      if (y < h - 1) pushIf(idx + w);
    }

    for (let idx = 0; idx < seen.length; idx++) {
      const i = idx * 4;
      if (seen[idx] || isNearWhite(idx)) arr[i + 3] = 0;
      else if (arr[i + 3] > 0 && arr[i + 3] < 252 && arr[i] > 224 && arr[i + 1] > 224 && arr[i + 2] > 224) {
        arr[i + 3] = Math.max(0, arr[i + 3] - 180);
      }
    }

    cx.putImageData(data, 0, 0);
    return canvas;
  }

  private getView(w: number, h: number): CampView {
    const coverScale = Math.max(w / CAMP_W, h / CAMP_H);
    const comfortableScale = Math.min(w / 1220, h / 800);
    const scale = Math.max(0.72, Math.min(1.45, Math.max(coverScale, comfortableScale)));
    const visibleW = w / scale;
    const visibleH = h / scale;
    const camX = visibleW >= CAMP_W ? CAMP_W / 2 : this.clamp(this.camera.x, visibleW / 2, CAMP_W - visibleW / 2);
    const camY = visibleH >= CAMP_H ? CAMP_H / 2 : this.clamp(this.camera.y, visibleH / 2, CAMP_H - visibleH / 2);
    const ox = w / 2 - camX * scale;
    const oy = h / 2 - camY * scale;

    return {
      scale,
      ox,
      oy,
      toScreen: (x, y) => ({ x: x * scale + ox, y: y * scale + oy }),
      toWorld: (x, y) => ({ x: (x - ox) / scale, y: (y - oy) / scale }),
    };
  }

  private drawGroundLayer(ctx: CanvasRenderingContext2D, view: CampView, w: number, h: number): void {
    ctx.fillStyle = "#172915";
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(view.ox, view.oy);
    ctx.scale(view.scale, view.scale);
    const oldSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    const ground = this.getHubDrawable("campGround");
    if (ground) ctx.drawImage(ground, 0, 0, CAMP_W, CAMP_H);
    else this.drawFallbackGround(ctx);
    ctx.imageSmoothingEnabled = oldSmoothing;
    ctx.restore();
  }

  private drawFallbackGround(ctx: CanvasRenderingContext2D): void {
    const g = ctx.createLinearGradient(0, 0, 0, CAMP_H);
    g.addColorStop(0, "#74a85a");
    g.addColorStop(0.58, "#66954f");
    g.addColorStop(1, "#4d7d47");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CAMP_W, CAMP_H);
  }

  private drawSceneLayer(ctx: CanvasRenderingContext2D, view: CampView): void {
    const items: SceneItem[] = CAMP_BUILDINGS.map((b) => ({
      depth: b.depthY,
      draw: () => this.drawBuildingBack(ctx, view, b),
    }));
    items.push({ depth: this.player.y + 12, draw: () => this.drawPlayer(ctx, view) });
    items.sort((a, b) => a.depth - b.depth);
    for (const item of items) item.draw();
  }

  private drawFrontOverlayLayer(ctx: CanvasRenderingContext2D, view: CampView): void {
    for (const building of CAMP_BUILDINGS) this.drawBuildingFront(ctx, view, building);
  }

  private drawBuildingBack(ctx: CanvasRenderingContext2D, view: CampView, b: CampBuilding): void {
    const p = view.toScreen(b.x, b.y);
    const active = this.activeBuilding?.id === b.id;
    const selected = this.selectedModule === b.id;
    this.drawBuildingShadow(ctx, view, b, active);
    const img = this.getHubDrawable(b.art.back);
    if (img) this.drawImage(ctx, img, p.x, p.y, b.w * view.scale, b.h * view.scale, active || selected ? b.color : null);
    else this.drawFallbackBuilding(ctx, view, b, active, selected);
    if (active || selected) this.drawBuildingName(ctx, view, b);
  }

  private drawBuildingFront(ctx: CanvasRenderingContext2D, view: CampView, b: CampBuilding): void {
    const img = this.getHubDrawable(b.art.front);
    if (!img) return;
    const p = view.toScreen(b.x, b.y);
    this.drawImage(ctx, img, p.x, p.y, b.w * view.scale, b.h * view.scale, null);
  }

  private drawImage(ctx: CanvasRenderingContext2D, img: CanvasImageSource, x: number, y: number, w: number, h: number, glow: string | null): void {
    const oldSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    if (glow) {
      ctx.shadowColor = glow;
      ctx.shadowBlur = 14;
    }
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();
    ctx.imageSmoothingEnabled = oldSmoothing;
  }

  private drawFallbackBuilding(ctx: CanvasRenderingContext2D, view: CampView, b: CampBuilding, active: boolean, selected: boolean): void {
    const p = view.toScreen(b.x, b.y);
    const w = b.w * view.scale;
    const h = b.h * view.scale;
    ctx.save();
    ctx.fillStyle = active ? this.rgba(b.color, 0.42) : selected ? this.rgba(b.color, 0.28) : "rgba(92, 67, 44, 0.95)";
    ctx.strokeStyle = active ? b.color : "rgba(78, 48, 25, 0.9)";
    ctx.lineWidth = active ? 3 : 1.5;
    this.roundRect(ctx, p.x + w * 0.15, p.y + h * 0.33, w * 0.7, h * 0.45, 10 * view.scale);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = this.rgba(b.color, 0.65);
    ctx.beginPath();
    ctx.moveTo(p.x + w * 0.06, p.y + h * 0.36);
    ctx.lineTo(p.x + w * 0.5, p.y + h * 0.08);
    ctx.lineTo(p.x + w * 0.94, p.y + h * 0.36);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff8e1";
    ctx.font = `bold ${Math.max(14, 24 * view.scale)}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText(b.icon, p.x + w / 2, p.y + h * 0.62);
    ctx.restore();
  }

  private drawBuildingShadow(ctx: CanvasRenderingContext2D, view: CampView, b: CampBuilding, active: boolean): void {
    const fp = b.footprint;
    const p = view.toScreen(fp.x + fp.w / 2, fp.y + fp.h / 2);
    ctx.fillStyle = active ? "rgba(0,0,0,0.28)" : "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, fp.w * view.scale * 0.56, fp.h * view.scale * 0.58, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, view: CampView): void {
    const p = view.toScreen(this.player.x, this.player.y);
    const s = view.scale;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.32)";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 9 * s, 15 * s, 6 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    if (this.humanWalkSheet.complete && this.humanWalkSheet.naturalWidth > 0) this.drawHumanWalkSheet(ctx, this.humanWalkSheet, p.x, p.y, s);
    else this.drawFallbackPlayer(ctx, p.x, p.y, s);
    ctx.restore();
  }

  private drawHumanWalkSheet(ctx: CanvasRenderingContext2D, sheet: HTMLImageElement, x: number, y: number, scale: number): void {
    const cols = 4;
    const rows = 4;
    const frameW = sheet.naturalWidth / cols;
    const frameH = sheet.naturalHeight / rows;
    const rowMap: Record<HubAvatarDirection, number> = { down: 0, up: 1, left: 2, right: 3 };
    const row = rowMap[this.avatarDirection];
    const frame = this.avatarMoving ? Math.floor(this.avatarAnimTime * 8) % 4 : 0;
    const drawW = 58 * scale;
    const drawH = 58 * scale;
    const oldSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sheet, frame * frameW, row * frameH, frameW, frameH, x - drawW / 2, y - drawH + 18 * scale, drawW, drawH);
    ctx.imageSmoothingEnabled = oldSmoothing;
  }

  private drawFallbackPlayer(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
    ctx.fillStyle = "#ffcc80";
    ctx.strokeStyle = "rgba(68,42,28,0.95)";
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.ellipse(x, y - 8 * s, 11 * s, 17 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#6d4c41";
    ctx.beginPath();
    ctx.arc(x, y - 30 * s, 12 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${Math.max(10, 12 * s)}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText("你", x, y + 30 * s);
  }

  private drawInteractionHints(ctx: CanvasRenderingContext2D, view: CampView): void {
    if (!this.activeBuilding) return;
    const p = view.toScreen(this.activeBuilding.interactPoint.x, this.activeBuilding.interactPoint.y - 44);
    const w = 92 * view.scale;
    const h = 28 * view.scale;
    ctx.fillStyle = "rgba(53, 34, 20, 0.86)";
    ctx.strokeStyle = this.activeBuilding.color;
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, p.x - w / 2, p.y - h / 2, w, h, 10 * view.scale);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = this.interactFlash > 0 ? "#ffffff" : "#ffeb3b";
    ctx.font = `bold ${Math.max(10, 12 * view.scale)}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText("E 交互", p.x, p.y + 4 * view.scale);
  }

  private drawDebugFootprints(ctx: CanvasRenderingContext2D, view: CampView): void {
    if (!DEBUG_HUB_FOOTPRINT && !DEBUG_HUB_COLLIDERS) return;
    ctx.save();
    ctx.translate(view.ox, view.oy);
    ctx.scale(view.scale, view.scale);

    if (DEBUG_HUB_COLLIDERS) {
      ctx.strokeStyle = "rgba(255,82,82,0.9)";
      ctx.lineWidth = 2;
      for (const c of CAMP_COLLIDERS) ctx.strokeRect(c.x, c.y, c.w, c.h);
    }

    if (DEBUG_HUB_FOOTPRINT) {
      for (const b of CAMP_BUILDINGS) {
        ctx.strokeStyle = "rgba(255,235,59,0.9)";
        ctx.lineWidth = 2;
        ctx.strokeRect(b.footprint.x, b.footprint.y, b.footprint.w, b.footprint.h);
        if (b.solidRects) for (const r of b.solidRects) ctx.strokeRect(r.x, r.y, r.w, r.h);
        ctx.fillStyle = "rgba(255,64,64,0.95)";
        ctx.beginPath();
        ctx.arc(b.interactPoint.x, b.interactPoint.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  private drawEdgeFogOverlay(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const fog = Math.max(110, Math.min(220, Math.min(w, h) * 0.16));
    const color = "18,35,18";
    ctx.save();

    let g = ctx.createLinearGradient(0, 0, fog, 0);
    g.addColorStop(0, `rgba(${color},0.88)`);
    g.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, fog, h);

    g = ctx.createLinearGradient(w - fog, 0, w, 0);
    g.addColorStop(0, `rgba(${color},0)`);
    g.addColorStop(1, `rgba(${color},0.92)`);
    ctx.fillStyle = g;
    ctx.fillRect(w - fog, 0, fog, h);

    g = ctx.createLinearGradient(0, 0, 0, fog);
    g.addColorStop(0, `rgba(${color},0.72)`);
    g.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, fog);

    g = ctx.createLinearGradient(0, h - fog, 0, h);
    g.addColorStop(0, `rgba(${color},0)`);
    g.addColorStop(1, `rgba(${color},0.82)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, h - fog, w, fog);

    g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.32, w / 2, h / 2, Math.max(w, h) * 0.72);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.28)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  private drawBuildingName(ctx: CanvasRenderingContext2D, view: CampView, b: CampBuilding): void {
    const p = view.toScreen(b.interactPoint.x, b.interactPoint.y + 18);
    const w = Math.max(86, b.name.length * 16) * view.scale;
    const h = 24 * view.scale;
    ctx.fillStyle = "rgba(47, 31, 18, 0.82)";
    ctx.strokeStyle = this.rgba(b.color, 0.82);
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, p.x - w / 2, p.y - h / 2, w, h, 8 * view.scale);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff8e1";
    ctx.font = `bold ${Math.max(10, 13 * view.scale)}px monospace`;
    ctx.textAlign = "center";
    ctx.fillText(b.name, p.x, p.y + 4 * view.scale);
  }

  private drawHud(ctx: CanvasRenderingContext2D, w: number): void {
    this.panel(ctx, 20, 20, Math.min(540, w - 40), 76, 18, "rgba(39, 27, 17, 0.72)", "rgba(255,224,130,0.34)");
    ctx.fillStyle = "#ffca28";
    ctx.font = "bold 26px monospace";
    ctx.textAlign = "left";
    ctx.fillText("远征营地", 44, 54);
    ctx.fillStyle = "rgba(255,255,255,0.68)";
    ctx.font = "12px monospace";
    ctx.fillText("WASD 移动 · 靠近建筑门口按 E 交互 · 远征城门开始战斗", 46, 79);
  }

  private drawInteractionPanel(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const module = HUB_MODULES.find((m) => m.id === this.selectedModule) ?? HUB_MODULES[0];
    const building = CAMP_BUILDINGS.find((b) => b.id === this.selectedModule);
    const panelW = Math.min(448, w - 40);
    const panelH = 140;
    const x = 20;
    const y = h - panelH - 22;
    const color = MODULE_ACCENT[this.selectedModule];

    this.panel(ctx, x, y, panelW, panelH, 18, "rgba(39, 27, 17, 0.84)", this.rgba(color, 0.52));
    ctx.textAlign = "left";
    ctx.fillStyle = color;
    ctx.font = "bold 20px monospace";
    ctx.fillText(`${building?.icon ?? module.icon} ${building?.name ?? module.name}`, x + 20, y + 34);
    ctx.fillStyle = "rgba(255,255,255,0.76)";
    ctx.font = "12px monospace";
    this.wrapText(ctx, module.description, x + 20, y + 60, panelW - 40, 18, 3);

    if (building) {
      const actionDef = getHubActionByModule(building.id);
      const subPanelId = actionDef ? getHubSubPanelId(actionDef.action) : undefined;
      ctx.fillStyle = this.interactFlash > 0 ? "#ffeb3b" : "rgba(255,255,255,0.6)";
      ctx.font = "bold 12px monospace";
      ctx.fillText(`${building.npc}：${building.line} ${actionDef?.action ?? "未配置"}${subPanelId ? ` → ${subPanelId}` : ""}`, x + 20, y + panelH - 22);
    }
  }

  private drawStartFallback(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const r = this.startButtonRect;
    const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
    g.addColorStop(0, "rgba(255,202,40,0.36)");
    g.addColorStop(1, "rgba(121,85,72,0.68)");
    this.panel(ctx, r.x, r.y, r.w, r.h, 18, g, "rgba(255,202,40,0.88)", 2.4);
    ctx.fillStyle = "#fff8e1";
    ctx.font = "bold 18px monospace";
    ctx.textAlign = "center";
    ctx.fillText("开始远征", r.x + r.w / 2, r.y + 33);
    if (w > 960) {
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "11px monospace";
      ctx.fillText("也可以走到远征城门按 E", r.x + r.w / 2, h - 11);
    }
  }

  private tryMove(dx: number, dy: number): void {
    if (dx === 0 && dy === 0) return;
    const nextX = this.clamp(this.player.x + dx, CAMP_PLAY_BOUNDS.x + 16, CAMP_PLAY_BOUNDS.x + CAMP_PLAY_BOUNDS.w - 16);
    const nextY = this.clamp(this.player.y + dy, CAMP_PLAY_BOUNDS.y + 16, CAMP_PLAY_BOUNDS.y + CAMP_PLAY_BOUNDS.h - 16);
    const currentPressure = this.collisionPressure(this.player.x, this.player.y);
    const nextPressure = this.collisionPressure(nextX, nextY);
    if (nextPressure <= 0 || (currentPressure > 0 && nextPressure < currentPressure)) {
      this.player.x = nextX;
      this.player.y = nextY;
    }
  }

  private collisionPressure(px: number, py: number): number {
    let pressure = 0;
    for (const c of CAMP_COLLIDERS) {
      const nearestX = this.clamp(px, c.x, c.x + c.w);
      const nearestY = this.clamp(py, c.y, c.y + c.h);
      const dx = px - nearestX;
      const dy = py - nearestY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      pressure += Math.max(0, PLAYER_COLLISION_R - dist);
    }
    return pressure;
  }

  private findNearbyBuilding(): CampBuilding | null {
    let best: CampBuilding | null = null;
    let bestDist = Infinity;
    for (const b of CAMP_BUILDINGS) {
      const dx = this.player.x - b.interactPoint.x;
      const dy = this.player.y - b.interactPoint.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < b.interactRadius && dist < bestDist) {
        best = b;
        bestDist = dist;
      }
    }
    return best;
  }

  private findBuildingAtScreen(x: number, y: number): CampBuilding | null {
    if (!this.lastView) return null;
    const world = this.lastView.toWorld(x, y);
    const ordered = [...CAMP_BUILDINGS].sort((a, b) => b.depthY - a.depthY);
    return ordered.find((b) => this.inRect(world.x, world.y, { x: b.x, y: b.y, w: b.w, h: b.h })) ?? null;
  }

  private getModuleInteraction(moduleId: HubModuleId): HubCampInteraction | null {
    return getHubActionByModule(moduleId)?.action ?? null;
  }

  private getBuildingInteraction(building: CampBuilding): HubCampInteraction | null {
    return this.getModuleInteraction(building.id);
  }

  private panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string | CanvasGradient, stroke: string, lineWidth = 1): void {
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    this.roundRect(ctx, x, y, w, h, r);
    ctx.fill();
    ctx.stroke();
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
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

  private clamp(value: number, min: number, max: number): number {
    if (min > max) return value;
    return Math.max(min, Math.min(max, value));
  }

  private rgba(hex: string, alpha: number): string {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number, maxLines: number): void {
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
