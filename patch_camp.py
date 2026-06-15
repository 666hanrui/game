import re

with open("src/ui/HubCampPanel.ts", "r") as f:
    content = f.read()

# 1. Add HubArtKey and HUB_ART_PATHS
new_types = """type HubArtKey =
  | "campGround"
  | "expeditionBack" | "expeditionFront"
  | "talentsBack" | "talentsFront"
  | "economyStorageBack" | "economyStorageFront"
  | "workshopBack" | "workshopFront"
  | "apothecaryBack" | "apothecaryFront"
  | "questsBack" | "questsFront"
  | "craftingBack" | "craftingFront"
  | "materialStorageBack" | "materialStorageFront"
  | "lootBack" | "lootFront"
  | "regionMapBack" | "regionMapFront"
  | "archiveBack" | "archiveFront";

const HUB_ART_PATHS: Record<HubArtKey, string> = {
  campGround: "/assets/sprites/hub/camp-ground.png",
  expeditionBack: "/assets/sprites/hub/expedition_back.png",
  expeditionFront: "/assets/sprites/hub/expedition_front.png",
  talentsBack: "/assets/sprites/hub/talents_back.png",
  talentsFront: "/assets/sprites/hub/talents_front.png",
  economyStorageBack: "/assets/sprites/hub/economy_storage_back.png",
  economyStorageFront: "/assets/sprites/hub/economy_storage_front.png",
  workshopBack: "/assets/sprites/hub/workshop_back.png",
  workshopFront: "/assets/sprites/hub/workshop_front.png",
  apothecaryBack: "/assets/sprites/hub/apothecary_back.png",
  apothecaryFront: "/assets/sprites/hub/apothecary_front.png",
  questsBack: "/assets/sprites/hub/quests_back.png",
  questsFront: "/assets/sprites/hub/quests_front.png",
  craftingBack: "/assets/sprites/hub/crafting_back.png",
  craftingFront: "/assets/sprites/hub/crafting_front.png",
  materialStorageBack: "/assets/sprites/hub/material_storage_back.png",
  materialStorageFront: "/assets/sprites/hub/material_storage_front.png",
  lootBack: "/assets/sprites/hub/loot_back.png",
  lootFront: "/assets/sprites/hub/loot_front.png",
  regionMapBack: "/assets/sprites/hub/region_map_back.png",
  regionMapFront: "/assets/sprites/hub/region_map_front.png",
  archiveBack: "/assets/sprites/hub/archive_back.png",
  archiveFront: "/assets/sprites/hub/archive_front.png",
};

"""
content = re.sub(r'type BuildingKind = [^\n]+;\n', lambda m: m.group(0) + '\n' + new_types, content)

# 2. Update CampBuilding interface
old_interface = """interface CampBuilding {
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
}"""

new_interface = """interface CampBuilding {
  id: HubModuleId;
  name: string;
  icon: string;
  kind: BuildingKind;
  x: number;
  y: number;
  w: number;
  h: number;
  footprint: Rect;
  interactPoint: { x: number; y: number };
  radius: number;
  depthY: number;
  art: { back: HubArtKey; front?: HubArtKey };
  color: string;
  bossName: string;
  line: string;
}"""
content = content.replace(old_interface, new_interface)

# 3. Update CAMP_BUILDINGS array
old_array = """const CAMP_BUILDINGS: CampBuilding[] = [
  { id: "expedition", name: "远征城门", icon: "▲", kind: "gate", x: 585, y: 78, w: 188, h: 138, color: MODULE_ACCENT.expedition, bossName: "前线队长", line: "开始局内战斗。", radius: 126 },
  { id: "talents", name: "天赋祭坛", icon: "✦", kind: "temple", x: 218, y: 170, w: 188, h: 132, color: MODULE_ACCENT.talents, bossName: "天赋导师", line: "交给天赋子面板处理。", radius: 116 },
  { id: "economyStorage", name: "资源仓库", icon: "¤", kind: "warehouse", x: 72, y: 230, w: 170, h: 112, color: MODULE_ACCENT.economyStorage, bossName: "资源管理员", line: "交给资源仓库子面板处理。", radius: 108 },
  { id: "workshop", name: "铁匠工坊", icon: "⚒", kind: "forge", x: 872, y: 195, w: 206, h: 138, color: MODULE_ACCENT.workshop, bossName: "工坊老板", line: "交给工坊子面板处理。", radius: 120 },
  { id: "apothecary", name: "药剂屋", icon: "✚", kind: "apothecary", x: 252, y: 560, w: 180, h: 126, color: MODULE_ACCENT.apothecary, bossName: "药房老板", line: "交给药剂屋子面板处理。", radius: 112 },
  { id: "quests", name: "指挥公告栏", icon: "☰", kind: "board", x: 568, y: 615, w: 176, h: 112, color: MODULE_ACCENT.quests, bossName: "任务书记", line: "交给任务子面板处理。", radius: 108 },
  { id: "crafting", name: "符文合成台", icon: "◇", kind: "rune", x: 900, y: 545, w: 180, h: 124, color: MODULE_ACCENT.crafting, bossName: "合成匠", line: "交给合成子面板处理。", radius: 116 },
  { id: "storage", name: "材料仓库", icon: "▣", kind: "warehouse", x: 82, y: 365, w: 182, h: 124, color: MODULE_ACCENT.storage, bossName: "仓库管理员", line: "交给材料仓库子面板处理。", radius: 110 },
  { id: "loot", name: "宝箱陈列台", icon: "▤", kind: "loot", x: 1088, y: 610, w: 178, h: 116, color: MODULE_ACCENT.loot, bossName: "战利品记录员", line: "交给战利品子面板处理。", radius: 112 },
  { id: "map", name: "收复沙盘", icon: "◎", kind: "map", x: 1092, y: 360, w: 176, h: 120, color: MODULE_ACCENT.map, bossName: "测绘员", line: "交给区域地图子面板处理。", radius: 112 },
  { id: "archive", name: "异种档案馆", icon: "?", kind: "archive", x: 590, y: 340, w: 160, h: 112, color: MODULE_ACCENT.archive, bossName: "档案员", line: "交给档案子面板处理。", radius: 100 },
];"""

new_array = """const CAMP_BUILDINGS: CampBuilding[] = [
  { id: "expedition", name: "远征城门", icon: "▲", kind: "gate", x: 585, y: 78, w: 188, h: 138, footprint: {x: 605, y: 168, w: 148, h: 40}, interactPoint: {x: 679, y: 226}, radius: 80, depthY: 208, art: {back: "expeditionBack", front: "expeditionFront"}, color: MODULE_ACCENT.expedition, bossName: "前线队长", line: "开始局内战斗。" },
  { id: "talents", name: "天赋祭坛", icon: "✦", kind: "temple", x: 218, y: 170, w: 188, h: 132, footprint: {x: 238, y: 250, w: 148, h: 40}, interactPoint: {x: 312, y: 310}, radius: 80, depthY: 290, art: {back: "talentsBack", front: "talentsFront"}, color: MODULE_ACCENT.talents, bossName: "天赋导师", line: "交给天赋子面板处理。" },
  { id: "economyStorage", name: "资源仓库", icon: "¤", kind: "warehouse", x: 72, y: 230, w: 170, h: 112, footprint: {x: 92, y: 300, w: 130, h: 30}, interactPoint: {x: 157, y: 350}, radius: 80, depthY: 330, art: {back: "economyStorageBack", front: "economyStorageFront"}, color: MODULE_ACCENT.economyStorage, bossName: "资源管理员", line: "交给资源仓库子面板处理。" },
  { id: "workshop", name: "铁匠工坊", icon: "⚒", kind: "forge", x: 872, y: 195, w: 206, h: 138, footprint: {x: 892, y: 285, w: 166, h: 38}, interactPoint: {x: 975, y: 345}, radius: 80, depthY: 323, art: {back: "workshopBack", front: "workshopFront"}, color: MODULE_ACCENT.workshop, bossName: "工坊老板", line: "交给工坊子面板处理。" },
  { id: "apothecary", name: "药剂屋", icon: "✚", kind: "apothecary", x: 252, y: 560, w: 180, h: 126, footprint: {x: 272, y: 646, w: 140, h: 30}, interactPoint: {x: 342, y: 700}, radius: 80, depthY: 676, art: {back: "apothecaryBack", front: "apothecaryFront"}, color: MODULE_ACCENT.apothecary, bossName: "药房老板", line: "交给药剂屋子面板处理。" },
  { id: "quests", name: "指挥公告栏", icon: "☰", kind: "board", x: 568, y: 615, w: 176, h: 112, footprint: {x: 588, y: 685, w: 136, h: 30}, interactPoint: {x: 656, y: 740}, radius: 80, depthY: 715, art: {back: "questsBack", front: "questsFront"}, color: MODULE_ACCENT.quests, bossName: "任务书记", line: "交给任务子面板处理。" },
  { id: "crafting", name: "符文合成台", icon: "◇", kind: "rune", x: 900, y: 545, w: 180, h: 124, footprint: {x: 920, y: 625, w: 140, h: 30}, interactPoint: {x: 990, y: 680}, radius: 80, depthY: 655, art: {back: "craftingBack", front: "craftingFront"}, color: MODULE_ACCENT.crafting, bossName: "合成匠", line: "交给合成子面板处理。" },
  { id: "storage", name: "材料仓库", icon: "▣", kind: "warehouse", x: 82, y: 365, w: 182, h: 124, footprint: {x: 102, y: 445, w: 142, h: 34}, interactPoint: {x: 173, y: 500}, radius: 80, depthY: 479, art: {back: "materialStorageBack", front: "materialStorageFront"}, color: MODULE_ACCENT.storage, bossName: "仓库管理员", line: "交给材料仓库子面板处理。" },
  { id: "loot", name: "宝箱陈列台", icon: "▤", kind: "loot", x: 1088, y: 610, w: 178, h: 116, footprint: {x: 1108, y: 686, w: 138, h: 30}, interactPoint: {x: 1177, y: 740}, radius: 80, depthY: 716, art: {back: "lootBack", front: "lootFront"}, color: MODULE_ACCENT.loot, bossName: "战利品记录员", line: "交给战利品子面板处理。" },
  { id: "map", name: "收复沙盘", icon: "◎", kind: "map", x: 1092, y: 360, w: 176, h: 120, footprint: {x: 1112, y: 440, w: 136, h: 30}, interactPoint: {x: 1180, y: 495}, radius: 80, depthY: 470, art: {back: "regionMapBack", front: "regionMapFront"}, color: MODULE_ACCENT.map, bossName: "测绘员", line: "交给区域地图子面板处理。" },
  { id: "archive", name: "异种档案馆", icon: "?", kind: "archive", x: 590, y: 340, w: 160, h: 112, footprint: {x: 610, y: 410, w: 120, h: 30}, interactPoint: {x: 670, y: 465}, radius: 80, depthY: 440, art: {back: "archiveBack", front: "archiveFront"}, color: MODULE_ACCENT.archive, bossName: "档案员", line: "交给档案子面板处理。" },
];"""
content = content.replace(old_array, new_array)

# 4. Add loadHubImages to HubCampPanel
old_constructor = """export class HubCampPanel {
  selectedModule: HubModuleId = "expedition";
  private player = { x: CAMP_W / 2, y: CAMP_H / 2 + 160 };
  private camera = { x: CAMP_W / 2, y: CAMP_H / 2 };
  private startButtonRect: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private activeBuilding: CampBuilding | null = null;
  private wasInteractDown = false;
  private interactFlash = 0;
  private interactDown = false;
  private lastView: CampView | null = null;

  constructor() {"""

new_constructor = """export class HubCampPanel {
  selectedModule: HubModuleId = "expedition";
  private player = { x: CAMP_W / 2, y: CAMP_H / 2 + 160 };
  private camera = { x: CAMP_W / 2, y: CAMP_H / 2 };
  private startButtonRect: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private activeBuilding: CampBuilding | null = null;
  private wasInteractDown = false;
  private interactFlash = 0;
  private interactDown = false;
  private lastView: CampView | null = null;
  
  private hubImages = new Map<HubArtKey, HTMLImageElement>();

  private loadHubImages(): void {
    for (const [key, src] of Object.entries(HUB_ART_PATHS) as [HubArtKey, string][]) {
      const img = new Image();
      img.src = src;
      this.hubImages.set(key as HubArtKey, img);
    }
  }

  private getHubImage(key: HubArtKey): HTMLImageElement | null {
    const img = this.hubImages.get(key);
    if (!img || !img.complete || img.naturalWidth <= 0) return null;
    return img;
  }

  constructor() {
    this.loadHubImages();"""
content = content.replace(old_constructor, new_constructor)

# 5. Fix findNearbyBuilding
old_find_nearby = """  private findNearbyBuilding(): CampBuilding | null {
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
  }"""

new_find_nearby = """  private findNearbyBuilding(): CampBuilding | null {
    let result: CampBuilding | null = null;
    let best = Infinity;

    for (const b of CAMP_BUILDINGS) {
      const dx = this.player.x - b.interactPoint.x;
      const dy = this.player.y - b.interactPoint.y;
      const d = Math.sqrt(dx * dx + dy * dy);

      if (d < b.radius && d < best) {
        best = d;
        result = b;
      }
    }

    return result;
  }"""
content = content.replace(old_find_nearby, new_find_nearby)

# 6. Replace Render completely
# First, remove old drawing methods
methods_to_remove = [
    r'  private drawWorldBackground[\s\S]*?this\.drawBonfireWorld[^}]*\}\n  \}\n',
]
for m in methods_to_remove:
    content = re.sub(m, '', content)

# Now replace render itself
old_render = """  render(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    this.startButtonRect = { x: w - 194, y: h - 80, w: 164, h: 54 };

    ctx.save();
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
  }"""

new_render = """  render(ctx: CanvasRenderingContext2D, w: number, h: number, game?: any): void {
    this.startButtonRect = { x: w - 194, y: h - 80, w: 164, h: 54 };

    ctx.save();
    const view = this.getView(w, h);
    this.lastView = view;

    this.drawGroundLayer(ctx, view, w, h);
    this.drawSceneLayer(ctx, view, game);
    this.drawFrontOverlayLayer(ctx, view);
    this.drawInteractionHints(ctx, view);
    this.drawDebugFootprints(ctx, view);

    this.drawHud(ctx, w, h);
    this.drawInteractionPanel(ctx, w, h);
    this.drawStartFallback(ctx, w, h);

    ctx.restore();
  }

  private drawGroundLayer(ctx: CanvasRenderingContext2D, view: CampView, w: number, h: number): void {
    ctx.fillStyle = "#07101f";
    ctx.fillRect(0, 0, w, h);

    const ground = this.getHubImage("campGround");

    ctx.save();
    ctx.translate(view.ox, view.oy);
    ctx.scale(view.scale, view.scale);

    const oldSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;

    if (ground) {
      ctx.drawImage(ground, 0, 0, CAMP_W, CAMP_H);
    } else {
      this.drawFallbackGroundWorld(ctx);
      // Optional: uncomment these for debug
      // this.drawRoads(ctx, view);
      // this.drawDistrictLabels(ctx, view);
    }

    ctx.imageSmoothingEnabled = oldSmoothing;
    ctx.restore();
  }

  private drawFallbackGroundWorld(ctx: CanvasRenderingContext2D): void {
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
  }

  private drawSceneLayer(ctx: CanvasRenderingContext2D, view: CampView, game?: any): void {
    const objects: { depth: number; draw: () => void }[] = [];

    for (const building of CAMP_BUILDINGS) {
      objects.push({
        depth: building.depthY,
        draw: () => this.drawBuildingBack(ctx, view, building),
      });
    }

    objects.push({
      depth: this.player.y + 12,
      draw: () => this.drawCampPlayer(ctx, view, game),
    });

    objects.sort((a, b) => a.depth - b.depth);

    for (const obj of objects) {
      obj.draw();
    }
  }

  private drawBuildingBack(ctx: CanvasRenderingContext2D, view: CampView, b: CampBuilding): void {
    const p = view.toScreen(b.x, b.y);
    const w = b.w * view.scale;
    const h = b.h * view.scale;
    const active = this.activeBuilding?.id === b.id;
    const selected = this.selectedModule === b.id;
    const img = this.getHubImage(b.art.back);

    ctx.save();
    this.drawBuildingGroundShadow(ctx, view, b);

    if (img) {
      this.drawSpriteImage(ctx, img, p.x, p.y, w, h, active, selected, b.color);
    } else {
      // Use original drawBuilding as fallback (but skip shadow since we already drew it)
      this.drawBuilding(ctx, view, b);
    }
    ctx.restore();
  }

  private drawFrontOverlayLayer(ctx: CanvasRenderingContext2D, view: CampView): void {
    for (const b of CAMP_BUILDINGS) {
      if (!b.art.front) continue;
      this.drawBuildingFront(ctx, view, b);
    }
  }

  private drawBuildingFront(ctx: CanvasRenderingContext2D, view: CampView, b: CampBuilding): void {
    if (!b.art.front) return;
    const img = this.getHubImage(b.art.front);
    if (!img) return;

    const p = view.toScreen(b.x, b.y);
    const w = b.w * view.scale;
    const h = b.h * view.scale;

    const oldSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, p.x, p.y, w, h);
    ctx.imageSmoothingEnabled = oldSmoothing;
  }

  private drawSpriteImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, active: boolean, selected: boolean, color: string): void {
    const oldSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    if (active || selected) {
      ctx.shadowColor = color;
      ctx.shadowBlur = active ? 18 : 9;
    }
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();
    ctx.imageSmoothingEnabled = oldSmoothing;
  }

  private drawBuildingGroundShadow(ctx: CanvasRenderingContext2D, view: CampView, b: CampBuilding): void {
    const fp = b.footprint;
    const p = view.toScreen(fp.x + fp.w / 2, fp.y + fp.h / 2);
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, (fp.w / 2) * view.scale, (fp.h / 2) * view.scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawInteractionHints(ctx: CanvasRenderingContext2D, view: CampView): void {
    if (!this.activeBuilding) return;
    const b = this.activeBuilding;
    const p = view.toScreen(b.interactPoint.x, b.interactPoint.y - 46);
    this.drawInteractPrompt(ctx, p.x, p.y, b.color, view.scale);
  }

  private drawDebugFootprints(ctx: CanvasRenderingContext2D, view: CampView): void {
    const DEBUG_HUB_FOOTPRINT = true;
    if (!DEBUG_HUB_FOOTPRINT) return;

    ctx.save();
    ctx.translate(view.ox, view.oy);
    ctx.scale(view.scale, view.scale);

    for (const b of CAMP_BUILDINGS) {
      ctx.strokeStyle = "rgba(255, 255, 0, 0.8)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(b.footprint.x, b.footprint.y, b.footprint.w, b.footprint.h);

      ctx.fillStyle = "rgba(255, 0, 0, 0.9)";
      ctx.beginPath();
      ctx.arc(b.interactPoint.x, b.interactPoint.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }"""
content = content.replace(old_render, new_render)

# Now, we also need to change the function signature of `drawCampPlayer` since we pass `game` to it now.
old_draw_camp_player = "private drawCampPlayer(ctx: CanvasRenderingContext2D, view: CampView): void {"
new_draw_camp_player = "private drawCampPlayer(ctx: CanvasRenderingContext2D, view: CampView, game?: any): void {"
content = content.replace(old_draw_camp_player, new_draw_camp_player)

with open("src/ui/HubCampPanel.ts", "w") as f:
    f.write(content)
