import type { Skill } from "../data/skills";
import type { Camera } from "../core/Camera";
import type { Vec2 } from "../utils/math";
import { getWeapon } from "../data/weapons";
import { buildBuildProgress, BuildProgressSnapshot } from "../systems/BuildProgressRuntime";

interface PlayerLike {
  pos: Vec2;
  damage: number;
  projectileExtra: number;
  critChance: number;
}

export interface BuildEffectData {
  camera: Camera;
  player: PlayerLike;
  weaponId?: string | null;
  skills: Skill[];
  screenW: number;
  screenH: number;
  time: number;
}

export class BuildEffectOverlay {
  render(ctx: CanvasRenderingContext2D, data: BuildEffectData): void {
    if (!data.weaponId) return;

    const weapon = getWeapon(data.weaponId);
    const progress = buildBuildProgress(data.skills, data.weaponId);
    const p = data.camera.worldToScreen(data.player.pos.x, data.player.pos.y, data.screenW, data.screenH);

    ctx.save();
    this.renderBuildBadge(ctx, p.x, p.y, data.time, progress);
    this.renderSubtleAura(ctx, p.x, p.y, data.time, progress);

    if (weapon?.visualRole === "field") this.renderFieldHint(ctx, p.x, p.y, data.time, progress.color);
    if (weapon?.visualRole === "orbit") this.renderOrbitHint(ctx, p.x, p.y, data.time, progress.color);
    if (progress.hybrid) this.renderHybridPulse(ctx, p.x, p.y, data.time, progress);
    ctx.restore();
  }

  private renderBuildBadge(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, progress: BuildProgressSnapshot): void {
    if (progress.primary.stage === "none" && !progress.hybrid) return;

    const label = progress.label;
    const w = Math.max(104, Math.min(178, 24 + label.length * 13));
    const bx = x - w / 2;
    const by = y - 78 - Math.sin(time * 2.4) * 1.5;

    ctx.globalAlpha = progress.hybrid ? 0.82 : 0.58;
    ctx.fillStyle = "rgba(8,8,18,0.56)";
    ctx.strokeStyle = progress.color;
    ctx.lineWidth = progress.hybrid ? 1.8 : 1.1;
    this.roundRect(ctx, bx, by, w, 22, 11);
    ctx.fill();
    ctx.stroke();

    ctx.globalAlpha = progress.hybrid ? 0.95 : 0.78;
    ctx.fillStyle = progress.color;
    ctx.font = progress.hybrid ? "bold 12px monospace" : "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.fillText(label, x, by + 15);

    if (progress.activeSynergyCount > 0) {
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = "#ffffff";
      ctx.font = "9px monospace";
      ctx.fillText(`联动 x${progress.activeSynergyCount}`, x, by + 32);
    }
    ctx.globalAlpha = 1;
  }

  private renderSubtleAura(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, progress: BuildProgressSnapshot): void {
    if (progress.primary.stage === "none" && !progress.hybrid) return;

    const stageRadius = progress.primary.stage === "complete" ? 30 : progress.primary.stage === "formed" ? 25 : 20;
    const radius = stageRadius + Math.sin(time * 3.2) * 1.6;

    ctx.globalAlpha = progress.hybrid ? 0.16 : 0.09;
    ctx.strokeStyle = progress.color;
    ctx.lineWidth = progress.hybrid ? 2 : 1.2;
    ctx.beginPath();
    ctx.ellipse(x, y + 4, radius, radius * 0.42, 0, 0, Math.PI * 2);
    ctx.stroke();

    const count = progress.hybrid ? 5 : progress.primary.stage === "complete" ? 4 : 2;
    ctx.fillStyle = progress.color;
    for (let i = 0; i < count; i++) {
      const a = time * 1.2 + (i / count) * Math.PI * 2;
      ctx.globalAlpha = progress.hybrid ? 0.22 : 0.12;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * radius, y + Math.sin(a) * radius * 0.42 + 4, 1.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private renderFieldHint(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, color: string): void {
    const radius = 38 + Math.sin(time * 2.6) * 2;
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(x, y + 5, radius, radius * 0.52, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  private renderOrbitHint(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, color: string): void {
    const radius = 32;
    ctx.fillStyle = color;
    for (let i = 0; i < 2; i++) {
      const a = time * 1.4 + i * Math.PI;
      ctx.globalAlpha = 0.18;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * radius, y + Math.sin(a) * radius * 0.5, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private renderHybridPulse(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, progress: BuildProgressSnapshot): void {
    if (!progress.hybrid) return;
    const pulse = (time * 1.8) % 1;
    const r = 24 + pulse * 18;
    ctx.globalAlpha = (1 - pulse) * 0.16;
    ctx.strokeStyle = progress.hybrid.color;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(x, y + 4, r, r * 0.42, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
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
