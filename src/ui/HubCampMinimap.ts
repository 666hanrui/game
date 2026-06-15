import type { HubModuleId } from "../data/hubModules";
import { CAMP_BUILDINGS, CAMP_H, CAMP_W, MODULE_ACCENT } from "../data/hubCampLayout";

interface Point {
  x: number;
  y: number;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface HubCampMinimapState {
  player: Point;
  selectedModule: HubModuleId;
  activeModule?: HubModuleId | null;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function worldToMini(rect: Rect, point: Point): Point {
  return {
    x: rect.x + (point.x / CAMP_W) * rect.w,
    y: rect.y + (point.y / CAMP_H) * rect.h,
  };
}

export function drawHubCampMinimap(ctx: CanvasRenderingContext2D, canvasW: number, canvasH: number, state: HubCampMinimapState): void {
  if (canvasW < 920 || canvasH < 560) return;

  const panelW = 214;
  const panelH = 158;
  const x = canvasW - panelW - 22;
  const y = 22;
  const map: Rect = { x: x + 14, y: y + 34, w: panelW - 28, h: panelH - 52 };

  ctx.save();
  ctx.fillStyle = "rgba(33, 24, 16, 0.74)";
  ctx.strokeStyle = "rgba(255, 224, 130, 0.36)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, panelW, panelH, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(20, 45, 22, 0.84)";
  ctx.strokeStyle = "rgba(190, 255, 150, 0.28)";
  ctx.lineWidth = 1;
  roundRect(ctx, map.x, map.y, map.w, map.h, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#ffecb3";
  ctx.font = "bold 13px monospace";
  ctx.textAlign = "left";
  ctx.fillText("营地方位", x + 14, y + 21);

  for (const building of CAMP_BUILDINGS) {
    const center = {
      x: building.x + building.w / 2,
      y: building.y + building.h / 2,
    };
    const p = worldToMini(map, center);
    const selected = building.id === state.selectedModule;
    const active = building.id === state.activeModule;
    const color = MODULE_ACCENT[building.id];
    const radius = active ? 5.4 : selected ? 4.8 : 3.5;

    ctx.save();
    if (active || selected) {
      ctx.shadowColor = color;
      ctx.shadowBlur = active ? 12 : 7;
    }
    ctx.fillStyle = color;
    ctx.strokeStyle = active ? "#ffffff" : "rgba(0,0,0,0.58)";
    ctx.lineWidth = active ? 2 : 1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  const player = worldToMini(map, {
    x: clamp(state.player.x, 0, CAMP_W),
    y: clamp(state.player.y, 0, CAMP_H),
  });
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#263238";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(player.x, player.y, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.62)";
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.fillText("白点=你  彩点=建筑", x + 14, y + panelH - 13);
  ctx.restore();
}
