import type { Skill } from "../data/skills";
import type { Camera } from "../core/Camera";
import type { Vec2 } from "../utils/math";
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

    const p = data.camera.worldToScreen(data.player.pos.x, data.player.pos.y, data.screenW, data.screenH);
    const progress = buildBuildProgress(data.skills, data.weaponId);
    const score = Math.max(this.buildScore(data), progress.score);
    if (score < 2) return;

    ctx.save();
    this.renderBuildBadge(ctx, p.x, p.y, data, progress);
    this.renderHybridAura(ctx, p.x, p.y, data, progress);

    if (this.isMagic(data.weaponId)) this.renderMagic(ctx, p.x, p.y, data, score, progress);
    else if (data.weaponId === "mace") this.renderMace(ctx, p.x, p.y, data, score, progress);
    else if (this.isMartial(data.weaponId)) this.renderMartial(ctx, p.x, p.y, data, score, progress);
    else if (this.isTech(data.weaponId)) this.renderTech(ctx, p.x, p.y, data, score, progress);
    else if (data.weaponId === "bow") this.renderBow(ctx, p.x, p.y, data, score, progress);
    ctx.restore();
  }

  private buildScore(data: BuildEffectData): number {
    const diamond = data.skills.filter((s) => s.rarity === "diamond").length;
    return data.skills.length + data.player.projectileExtra * 1.4 + data.player.critChance * 10 + Math.max(0, data.player.damage - 40) / 18 + diamond * 3;
  }

  private renderBuildBadge(ctx: CanvasRenderingContext2D, x: number, y: number, data: BuildEffectData, progress: BuildProgressSnapshot): void {
    if (progress.primary.stage === "none" && !progress.hybrid) return;

    const t = data.time;
    const label = progress.label;
    const w = Math.max(112, Math.min(190, 22 + label.length * 14));
    const bx = x - w / 2;
    const by = y - 92 - Math.sin(t * 3) * 2;

    ctx.save();
    ctx.globalAlpha = progress.hybrid ? 0.92 : 0.74;
    ctx.fillStyle = progress.hybrid ? "rgba(8,8,18,0.72)" : "rgba(8,8,18,0.48)";
    ctx.strokeStyle = progress.color;
    ctx.lineWidth = progress.hybrid ? 2.2 : 1.4;
    this.roundRect(ctx, bx, by, w, 24, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = progress.color;
    ctx.font = progress.hybrid ? "bold 13px monospace" : "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.fillText(label, x, by + 16);

    if (progress.activeSynergyCount > 0) {
      ctx.fillStyle = "rgba(255,255,255,0.52)";
      ctx.font = "10px monospace";
      ctx.fillText(`联动 x${progress.activeSynergyCount}`, x, by + 38);
    }
    ctx.restore();
  }

  private renderHybridAura(ctx: CanvasRenderingContext2D, x: number, y: number, data: BuildEffectData, progress: BuildProgressSnapshot): void {
    if (!progress.hybrid) return;

    const t = data.time;
    const power = progress.hybrid.powerLevel;
    const radius = 72 + power * 16 + Math.sin(t * 4) * 5;

    ctx.save();
    ctx.globalAlpha = 0.24;
    ctx.strokeStyle = progress.hybrid.color;
    ctx.lineWidth = 3 + power;
    ctx.beginPath();
    ctx.ellipse(x, y, radius, radius * 0.5, Math.sin(t * 0.7) * 0.18, 0, Math.PI * 2);
    ctx.stroke();

    const sparks = 8 + power * 5;
    for (let i = 0; i < sparks; i++) {
      const a = t * (1.3 + power * 0.12) + i * (Math.PI * 2 / sparks);
      const r = radius + Math.sin(t * 2.4 + i) * 12;
      ctx.globalAlpha = 0.18 + power * 0.035;
      ctx.fillStyle = progress.hybrid.color;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.55, 2.2 + power * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private renderMagic(ctx: CanvasRenderingContext2D, x: number, y: number, data: BuildEffectData, score: number, progress: BuildProgressSnapshot): void {
    const t = data.time;
    const stageBoost = progress.primary.stage === "complete" ? 2 : progress.primary.stage === "formed" ? 1 : 0;
    const rings = Math.min(6, 1 + Math.floor(score / 5) + stageBoost);
    const baseR = 42 + Math.min(48, score * 2.5);

    for (let i = 0; i < rings; i++) {
      const r = baseR + i * 18 + Math.sin(t * 2 + i) * 3;
      ctx.globalAlpha = 0.16 + i * 0.03;
      ctx.strokeStyle = i % 2 === 0 ? progress.color : "#80deea";
      ctx.lineWidth = progress.primary.stage === "complete" ? 3 : 2;
      ctx.beginPath();
      ctx.arc(x, y, r, t * (0.3 + i * 0.08), t * (0.3 + i * 0.08) + Math.PI * 1.55);
      ctx.stroke();
    }

    const sparks = Math.min(24, 6 + Math.floor(score) + stageBoost * 3);
    for (let i = 0; i < sparks; i++) {
      const a = t * 1.7 + i * (Math.PI * 2 / sparks);
      const r = baseR + 20 + Math.sin(t * 3 + i) * 14;
      const sx = x + Math.cos(a) * r;
      const sy = y + Math.sin(a) * r * 0.72;
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = i % 3 === 0 ? progress.color : "#80deea";
      ctx.beginPath();
      ctx.arc(sx, sy, 2.2 + stageBoost * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    if (score >= 10 || progress.primary.stage === "complete") {
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = progress.color;
      ctx.lineWidth = 3;
      for (let i = 0; i < 6; i++) {
        const a = t * 0.9 + i * Math.PI / 3;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * 18, y + Math.sin(a) * 18);
        ctx.lineTo(x + Math.cos(a) * (baseR + 54), y + Math.sin(a) * (baseR + 54));
        ctx.stroke();
      }
    }

    ctx.globalAlpha = 1;
  }

  private renderMartial(ctx: CanvasRenderingContext2D, x: number, y: number, data: BuildEffectData, score: number, progress: BuildProgressSnapshot): void {
    const t = data.time;
    const stageBoost = progress.primary.stage === "complete" ? 2 : progress.primary.stage === "formed" ? 1 : 0;
    const count = Math.min(10, 2 + Math.floor(score / 4) + stageBoost);
    const length = 58 + Math.min(96, score * 5);

    for (let i = 0; i < count; i++) {
      const a = t * 1.15 + i * (Math.PI * 2 / count);
      const ox = Math.cos(a) * 34;
      const oy = Math.sin(a) * 20;
      ctx.globalAlpha = 0.14 + i * 0.01;
      ctx.strokeStyle = progress.color;
      ctx.lineWidth = progress.primary.stage === "complete" ? 4.5 : score >= 10 ? 4 : 2.4;
      ctx.beginPath();
      ctx.moveTo(x + ox - Math.cos(a) * length * 0.45, y + oy - Math.sin(a) * length * 0.45);
      ctx.lineTo(x + ox + Math.cos(a) * length, y + oy + Math.sin(a) * length);
      ctx.stroke();
    }

    if (score >= 9 || progress.primary.stage !== "none") {
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = progress.color;
      ctx.lineWidth = 2 + stageBoost;
      ctx.beginPath();
      ctx.ellipse(x, y, 92 + Math.sin(t * 4) * 5, 34 + stageBoost * 6, Math.sin(t) * 0.25, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  private renderMace(ctx: CanvasRenderingContext2D, x: number, y: number, data: BuildEffectData, score: number, progress: BuildProgressSnapshot): void {
    const t = data.time;
    const diamond = data.skills.filter((s) => s.rarity === "diamond").length;
    const quake = data.skills.filter((s) => s.special === "earthquake" || s.special === "armor_break" || s.special === "mace_shockwave").length;
    const stageBoost = progress.primary.stage === "complete" ? 2 : progress.primary.stage === "formed" ? 1 : 0;
    const rings = Math.min(7, 1 + quake + diamond + Math.floor(score / 8) + stageBoost);

    for (let i = 0; i < rings; i++) {
      const r = 42 + i * 24 + ((t * 42 + i * 18) % 34);
      ctx.globalAlpha = Math.max(0.06, 0.22 - i * 0.023);
      ctx.strokeStyle = i % 2 === 0 ? progress.color : "#d7a86e";
      ctx.lineWidth = diamond > 0 || progress.primary.stage === "complete" ? 4 : 3;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.46, Math.sin(t * 0.7) * 0.14, 0, Math.PI * 2);
      ctx.stroke();
    }

    const cracks = Math.min(14, 3 + Math.floor(score / 3) + stageBoost * 2);
    for (let i = 0; i < cracks; i++) {
      const a = t * 0.32 + i * (Math.PI * 2 / cracks);
      const len = 38 + Math.min(96, score * 5);
      const start = 20 + Math.sin(t * 2 + i) * 6;
      ctx.globalAlpha = 0.16;
      ctx.strokeStyle = progress.hybrid?.color ?? "#8d6e63";
      ctx.lineWidth = diamond > 0 || stageBoost > 0 ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * start, y + Math.sin(a) * start * 0.55);
      ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len * 0.55);
      ctx.stroke();
    }

    if (score >= 10 || diamond > 0 || progress.primary.stage === "complete") {
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = progress.hybrid ? progress.hybrid.color + "38" : "rgba(188,143,90,0.22)";
      ctx.beginPath();
      ctx.arc(x, y, 16 + Math.sin(t * 6) * 3 + stageBoost * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  private renderTech(ctx: CanvasRenderingContext2D, x: number, y: number, data: BuildEffectData, score: number, progress: BuildProgressSnapshot): void {
    const t = data.time;
    const stageBoost = progress.primary.stage === "complete" ? 2 : progress.primary.stage === "formed" ? 1 : 0;
    const drones = Math.min(14, 2 + data.player.projectileExtra + Math.floor(score / 5) + stageBoost * 2);
    const orbit = 54 + Math.min(52, score * 3);

    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = progress.color;
    ctx.lineWidth = 1 + stageBoost;
    ctx.beginPath();
    ctx.arc(x, y, orbit, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < drones; i++) {
      const a = t * 1.9 + i * (Math.PI * 2 / drones);
      const dx = x + Math.cos(a) * orbit;
      const dy = y + Math.sin(a) * orbit * 0.72;
      ctx.globalAlpha = 0.42;
      ctx.fillStyle = progress.color;
      ctx.strokeStyle = "#e0f7fa";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(dx - 4, dy - 4, 8, 8);
      ctx.fill();
      ctx.stroke();

      if ((score >= 8 || stageBoost > 0) && i % 2 === 0) {
        ctx.globalAlpha = 0.12 + stageBoost * 0.04;
        ctx.strokeStyle = progress.color;
        ctx.beginPath();
        ctx.moveTo(dx, dy);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }

    if (score >= 11 || progress.primary.stage === "complete") {
      ctx.globalAlpha = 0.12;
      ctx.strokeStyle = progress.color;
      ctx.lineWidth = 2;
      const scanY = y - 70 + ((t * 80) % 140);
      ctx.beginPath();
      ctx.moveTo(x - 130, scanY);
      ctx.lineTo(x + 130, scanY);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  private renderBow(ctx: CanvasRenderingContext2D, x: number, y: number, data: BuildEffectData, score: number, progress: BuildProgressSnapshot): void {
    const t = data.time;
    const stageBoost = progress.primary.stage === "complete" ? 3 : progress.primary.stage === "formed" ? 2 : progress.primary.stage === "starter" ? 1 : 0;
    const count = Math.min(22, 4 + Math.floor(score) + stageBoost * 2);
    const spread = 160 + Math.min(150, score * 8);

    for (let i = 0; i < count; i++) {
      const lane = (i / Math.max(1, count - 1) - 0.5) * spread;
      const fall = ((t * 180 + i * 37) % 170) - 85;
      ctx.globalAlpha = 0.16 + stageBoost * 0.025;
      ctx.strokeStyle = progress.color;
      ctx.lineWidth = 2 + stageBoost * 0.35;
      ctx.beginPath();
      ctx.moveTo(x + lane - 18, y + fall - 46);
      ctx.lineTo(x + lane + 18, y + fall + 10);
      ctx.stroke();
    }

    if (score >= 10 || stageBoost >= 2) {
      ctx.globalAlpha = 0.18 + stageBoost * 0.035;
      ctx.strokeStyle = progress.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, 86 + Math.sin(t * 3) * 5 + stageBoost * 8, -0.4, Math.PI * 1.35);
      ctx.stroke();
    }

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

  private isMagic(id: string): boolean {
    return id === "wand" || id === "staff" || id === "orb";
  }

  private isMartial(id: string): boolean {
    return id === "flying_blade" || id === "spear";
  }

  private isTech(id: string): boolean {
    return id === "drone_core" || id === "energy_core";
  }
}
