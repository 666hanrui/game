import type { HubModuleId } from "./hubModules";

export type HubAvatarDirection = "down" | "up" | "left" | "right";

export type HubArtKey =
  | "campGround"
  | "expeditionBack"
  | "expeditionFront"
  | "talentsBack"
  | "talentsFront"
  | "economyStorageBack"
  | "economyStorageFront"
  | "workshopBack"
  | "workshopFront"
  | "apothecaryBack"
  | "apothecaryFront"
  | "questsBack"
  | "questsFront"
  | "craftingBack"
  | "craftingFront"
  | "materialStorageBack"
  | "materialStorageFront"
  | "lootBack"
  | "lootFront"
  | "regionMapBack"
  | "regionMapFront"
  | "archiveBack"
  | "archiveFront";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CampBuilding {
  id: HubModuleId;
  name: string;
  icon: string;
  x: number;
  y: number;
  w: number;
  h: number;
  footprint: Rect;
  solidRects?: Rect[];
  interactPoint: { x: number; y: number };
  interactRadius: number;
  depthY: number;
  art: { back: HubArtKey; front: HubArtKey };
  color: string;
  npc: string;
  line: string;
}

export const CAMP_W = 1320;
export const CAMP_H = 860;
export const PLAYER_COLLISION_R = 10;
export const DEBUG_HUB_FOOTPRINT = false;
export const DEBUG_HUB_COLLIDERS = false;
export const CAMP_PLAY_BOUNDS: Rect = { x: 28, y: 28, w: CAMP_W - 56, h: CAMP_H - 56 };

export const HUB_ART_PATHS: Record<HubArtKey, string> = {
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

export const MODULE_ACCENT: Record<HubModuleId, string> = {
  expedition: "#ffca28",
  talents: "#ce93d8",
  economyStorage: "#ffd54f",
  workshop: "#ffcc80",
  apothecary: "#81c784",
  quests: "#e1f5fe",
  crafting: "#b3e5fc",
  storage: "#90caf9",
  loot: "#ffd54f",
  map: "#ff8a65",
  archive: "#b0bec5",
};

export const CAMP_BUILDINGS: CampBuilding[] = [
  { id: "expedition", name: "远征城门", icon: "▲", x: 540, y: 56, w: 260, h: 196, footprint: { x: 596, y: 190, w: 150, h: 46 }, solidRects: [{ x: 566, y: 88, w: 220, h: 118 }], interactPoint: { x: 671, y: 258 }, interactRadius: 86, depthY: 236, art: { back: "expeditionBack", front: "expeditionFront" }, color: MODULE_ACCENT.expedition, npc: "前线队长", line: "开始局内战斗。" },
  { id: "talents", name: "天赋祭坛", icon: "✦", x: 236, y: 130, w: 246, h: 184, footprint: { x: 294, y: 252, w: 132, h: 44 }, solidRects: [{ x: 256, y: 154, w: 206, h: 110 }, { x: 284, y: 236, w: 152, h: 38 }], interactPoint: { x: 360, y: 326 }, interactRadius: 84, depthY: 296, art: { back: "talentsBack", front: "talentsFront" }, color: MODULE_ACCENT.talents, npc: "天赋导师", line: "管理局外天赋。" },
  { id: "economyStorage", name: "资源仓库", icon: "¤", x: 70, y: 282, w: 236, h: 176, footprint: { x: 118, y: 396, w: 140, h: 46 }, solidRects: [{ x: 90, y: 306, w: 198, h: 102 }, { x: 112, y: 386, w: 150, h: 32 }], interactPoint: { x: 188, y: 470 }, interactRadius: 84, depthY: 442, art: { back: "economyStorageBack", front: "economyStorageFront" }, color: MODULE_ACCENT.economyStorage, npc: "资源管理员", line: "查看远征币和魂晶。" },
  { id: "workshop", name: "铁匠工坊", icon: "⚒", x: 826, y: 160, w: 282, h: 206, footprint: { x: 892, y: 302, w: 152, h: 48 }, solidRects: [{ x: 850, y: 184, w: 238, h: 122 }, { x: 872, y: 288, w: 196, h: 40 }], interactPoint: { x: 968, y: 376 }, interactRadius: 88, depthY: 350, art: { back: "workshopBack", front: "workshopFront" }, color: MODULE_ACCENT.workshop, npc: "工坊老板", line: "装备和神话武器路线。" },
  { id: "storage", name: "材料仓库", icon: "▣", x: 78, y: 468, w: 246, h: 184, footprint: { x: 128, y: 590, w: 144, h: 46 }, solidRects: [{ x: 102, y: 494, w: 202, h: 106 }, { x: 122, y: 574, w: 154, h: 40 }], interactPoint: { x: 200, y: 662 }, interactRadius: 86, depthY: 636, art: { back: "materialStorageBack", front: "materialStorageFront" }, color: MODULE_ACCENT.storage, npc: "仓库管理员", line: "查看带出局材料。" },
  { id: "archive", name: "异种档案馆", icon: "?", x: 552, y: 310, w: 226, h: 172, footprint: { x: 602, y: 424, w: 128, h: 42 }, solidRects: [{ x: 576, y: 332, w: 178, h: 104 }, { x: 596, y: 410, w: 138, h: 36 }], interactPoint: { x: 666, y: 496 }, interactRadius: 82, depthY: 466, art: { back: "archiveBack", front: "archiveFront" }, color: MODULE_ACCENT.archive, npc: "档案员", line: "查看怪物与世界观档案。" },
  { id: "map", name: "收复沙盘", icon: "◎", x: 1048, y: 362, w: 236, h: 156, footprint: { x: 1098, y: 458, w: 136, h: 38 }, solidRects: [{ x: 1070, y: 386, w: 192, h: 84 }, { x: 1092, y: 448, w: 148, h: 30 }], interactPoint: { x: 1166, y: 528 }, interactRadius: 84, depthY: 496, art: { back: "regionMapBack", front: "regionMapFront" }, color: MODULE_ACCENT.map, npc: "测绘员", line: "查看区域收复地图。" },
  { id: "crafting", name: "符文合成台", icon: "◇", x: 862, y: 510, w: 250, h: 176, footprint: { x: 914, y: 622, w: 150, h: 44 }, solidRects: [{ x: 890, y: 536, w: 198, h: 100 }, { x: 908, y: 606, w: 160, h: 38 }], interactPoint: { x: 989, y: 694 }, interactRadius: 86, depthY: 666, art: { back: "craftingBack", front: "craftingFront" }, color: MODULE_ACCENT.crafting, npc: "合成匠", line: "打开局外合成。" },
  { id: "apothecary", name: "药剂屋", icon: "✚", x: 242, y: 636, w: 248, h: 182, footprint: { x: 294, y: 756, w: 144, h: 46 }, solidRects: [{ x: 266, y: 660, w: 202, h: 108 }, { x: 288, y: 740, w: 154, h: 38 }], interactPoint: { x: 366, y: 828 }, interactRadius: 88, depthY: 802, art: { back: "apothecaryBack", front: "apothecaryFront" }, color: MODULE_ACCENT.apothecary, npc: "药房老板", line: "永久药剂和局外药。" },
  { id: "quests", name: "指挥公告栏", icon: "☰", x: 560, y: 648, w: 230, h: 158, footprint: { x: 610, y: 750, w: 130, h: 40 }, solidRects: [{ x: 584, y: 674, w: 182, h: 86 }, { x: 604, y: 738, w: 140, h: 34 }], interactPoint: { x: 675, y: 824 }, interactRadius: 84, depthY: 790, art: { back: "questsBack", front: "questsFront" }, color: MODULE_ACCENT.quests, npc: "任务书记", line: "任务、讨伐和材料委托。" },
  { id: "loot", name: "宝箱陈列台", icon: "▤", x: 1064, y: 646, w: 228, h: 158, footprint: { x: 1114, y: 750, w: 134, h: 40 }, solidRects: [{ x: 1088, y: 672, w: 180, h: 86 }, { x: 1108, y: 738, w: 146, h: 34 }], interactPoint: { x: 1181, y: 824 }, interactRadius: 86, depthY: 790, art: { back: "lootBack", front: "lootFront" }, color: MODULE_ACCENT.loot, npc: "战利品记录员", line: "查看宝箱和本局带出物。" },
];

export const HARD_SCENERY_COLLIDERS: Rect[] = [
  { x: 0, y: 0, w: CAMP_W, h: 24 },
  { x: 0, y: CAMP_H - 24, w: CAMP_W, h: 24 },
  { x: 0, y: 0, w: 24, h: CAMP_H },
  { x: CAMP_W - 24, y: 0, w: 24, h: CAMP_H },
  { x: 1118, y: 110, w: 128, h: 430 },
  { x: 1034, y: 746, w: 220, h: 54 },
];

export const BUILDING_SOLID_COLLIDERS: Rect[] = CAMP_BUILDINGS.flatMap((b) => b.solidRects ?? []);
export const CAMP_COLLIDERS: Rect[] = [
  ...HARD_SCENERY_COLLIDERS,
  ...BUILDING_SOLID_COLLIDERS,
  ...CAMP_BUILDINGS.map((b) => b.footprint),
];
