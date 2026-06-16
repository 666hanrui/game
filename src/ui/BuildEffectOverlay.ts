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
    this.renderSubtleAura(ctx, p.x, p.y, data.time, progress);
    if (weapon?.visualRole === "field") this.renderFieldHint(ctx, p.x, p.y, data.time, progress.color);
    if (weapon?.visualRole === "orbit") this.renderOrbitHint(ctx, p.x, p.y, data.time, progress.color);
    if (progress.hybrid) this.renderHybridPulse(ctx, p.x, p.y, data.time, progress);
    ctx.restore();
  }

  private renderSubtleAura(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, progress: BuildProgressSnapshot): void {
    if (progress.primary.stage === "none" && !progress.hybrid) return;

    const stageRadius = progress.primary.stage === "complete" ? 27 : progress.primary.stage === "formed" ? 23 : 18;
    const radius = stageRadius + Math.sin(time * 3.2) * 1.3;

    ctx.globalAlpha = progress.hybrid ? 0.12 : 0.065;
    ctx.strokeStyle = progress.color;
    ctx.lineWidth = progress.hybrid ? 1.6 : 1;
    ctx.beginPath();
    ctx.ellipse(x, y + 6, radius, radius * 0.36, 0, 0, Math.PI * 2);
    ctx.stroke();

    const count = progress.hybrid ? 4 : progress.primary.stage === "complete" ? 3 : 1;
    ctx.fillStyle = progress.color;
    for (let i = 0; i < count; i++) {
      const a = time * 1.2 + (i / count) * Math.PI * 2;
      ctx.globalAlpha = progress.hybrid ? 0.18 : 0.09;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * radius, y + Math.sin(a) * radius * 0.36 + 6, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private renderFieldHint(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, color: string): void {
    const radius = 34 + Math.sin(time * 2.6) * 2;
    ctx.globalAlpha = 0.055;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(x, y + 7, radius, radius * 0.46, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  private renderOrbitHint(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, color: string): void {
    const radius = 28;
    ctx.fillStyle = color;
    for (let i = 0; i < 2; i++) {
      const a = time * 1.4 + i * Math.PI;
      ctx.globalAlpha = 0.14;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * radius, y + Math.sin(a) * radius * 0.44 + 4, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private renderHybridPulse(ctx: CanvasRenderingContext2D, x: number, y: number, time: number, progress: BuildProgressSnapshot): void {
    if (!progress.hybrid) return;
    const pulse = (time * 1.8) % 1;
    const r = 22 + pulse * 16;
    ctx.globalAlpha = (1 - pulse) * 0.11;
    ctx.strokeStyle = progress.hybrid.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(x, y + 6, r, r * 0.36, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}
