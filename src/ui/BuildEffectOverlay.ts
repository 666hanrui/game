import type { Skill } from "../data/skills";
import type { Camera } from "../core/Camera";
import type { Vec2 } from "../utils/math";

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
    const score = this.buildScore(data);
    if (score < 2) return;

    ctx.save();
    if (this.isMagic(data.weaponId)) this.renderMagic(ctx, p.x, p.y, data, score);
    else if (data.weaponId === "mace") this.renderMace(ctx, p.x, p.y, data, score);
    else if (this.isMartial(data.weaponId)) this.renderMartial(ctx, p.x, p.y, data, score);
    else if (this.isTech(data.weaponId)) this.renderTech(ctx, p.x, p.y, data, score);
    else if (data.weaponId === "bow") this.renderBow(ctx, p.x, p.y, data, score);
    ctx.restore();
  }

  private buildScore(data: BuildEffectData): number {
    const diamond = data.skills.filter((s) => s.rarity === "diamond").length;
    return data.skills.length + data.player.projectileExtra * 1.4 + data.player.critChance * 10 + Math.max(0, data.player.damage - 40) / 18 + diamond * 3;
  }

  private renderMagic(ctx: CanvasRenderingContext2D, x: number, y: number, data: BuildEffectData, score: number): void {
    const t = data.time;
    const rings = Math.min(4, 1 + Math.floor(score / 5));
    const baseR = 42 + Math.min(36, score * 2.5);

    for (let i = 0; i < rings; i++) {
      const r = baseR + i * 18 + Math.sin(t * 2 + i) * 3;
      ctx.globalAlpha = 0.16 + i * 0.035;
      ctx.strokeStyle = i % 2 === 0 ? "#ce93d8" : "#80deea";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, r, t * (0.3 + i * 0.08), t * (0.3 + i * 0.08) + Math.PI * 1.55);
      ctx.stroke();
    }

    const sparks = Math.min(18, 6 + Math.floor(score));
    for (let i = 0; i < sparks; i++) {
      const a = t * 1.7 + i * (Math.PI * 2 / sparks);
      const r = baseR + 20 + Math.sin(t * 3 + i) * 14;
      const sx = x + Math.cos(a) * r;
      const sy = y + Math.sin(a) * r * 0.72;
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = i % 3 === 0 ? "#e1bee7" : "#80deea";
      ctx.beginPath();
      ctx.arc(sx, sy, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    if (score >= 10) {
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = "#b388ff";
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

  private renderMartial(ctx: CanvasRenderingContext2D, x: number, y: number, data: BuildEffectData, score: number): void {
    const t = data.time;
    const count = Math.min(7, 2 + Math.floor(score / 4));
    const length = 58 + Math.min(82, score * 5);

    for (let i = 0; i < count; i++) {
      const a = t * 1.15 + i * (Math.PI * 2 / count);
      const ox = Math.cos(a) * 34;
      const oy = Math.sin(a) * 20;
      ctx.globalAlpha = 0.14 + i * 0.012;
      ctx.strokeStyle = data.weaponId === "spear" ? "#90caf9" : "#ffcc80";
      ctx.lineWidth = score >= 10 ? 4 : 2.4;
      ctx.beginPath();
      ctx.moveTo(x + ox - Math.cos(a) * length * 0.45, y + oy - Math.sin(a) * length * 0.45);
      ctx.lineTo(x + ox + Math.cos(a) * length, y + oy + Math.sin(a) * length);
      ctx.stroke();
    }

    if (score >= 9) {
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = data.weaponId === "spear" ? "#e3f2fd" : "#ffe0b2";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, y, 92 + Math.sin(t * 4) * 5, 34, Math.sin(t) * 0.25, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  private renderMace(ctx: CanvasRenderingContext2D, x: number, y: number, data: BuildEffectData, score: number): void {
    const t = data.time;
    const diamond = data.skills.filter((s) => s.rarity === "diamond").length;
    const quake = data.skills.filter((s) => s.special === "earthquake" || s.special === "armor_break").length;
    const rings = Math.min(5, 1 + quake + diamond + Math.floor(score / 8));

    for (let i = 0; i < rings; i++) {
      const r = 42 + i * 24 + ((t * 42 + i * 18) % 34);
      ctx.globalAlpha = Math.max(0.06, 0.2 - i * 0.025);
      ctx.strokeStyle = i % 2 === 0 ? "#bc8f5a" : "#d7a86e";
      ctx.lineWidth = diamond > 0 ? 4 : 3;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.46, Math.sin(t * 0.7) * 0.14, 0, Math.PI * 2);
      ctx.stroke();
    }

    const cracks = Math.min(10, 3 + Math.floor(score / 3));
    for (let i = 0; i < cracks; i++) {
      const a = t * 0.32 + i * (Math.PI * 2 / cracks);
      const len = 38 + Math.min(80, score * 5);
      const start = 20 + Math.sin(t * 2 + i) * 6;
      ctx.globalAlpha = 0.16;
      ctx.strokeStyle = "#8d6e63";
      ctx.lineWidth = diamond > 0 ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * start, y + Math.sin(a) * start * 0.55);
      ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len * 0.55);
      ctx.stroke();
    }

    if (score >= 10 || diamond > 0) {
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "rgba(188,143,90,0.22)";
      ctx.beginPath();
      ctx.arc(x, y, 16 + Math.sin(t * 6) * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  private renderTech(ctx: CanvasRenderingContext2D, x: number, y: number, data: BuildEffectData, score: number): void {
    const t = data.time;
    const drones = Math.min(10, 2 + data.player.projectileExtra + Math.floor(score / 5));
    const orbit = 54 + Math.min(42, score * 3);

    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = "#4dd0e1";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, orbit, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < drones; i++) {
      const a = t * 1.9 + i * (Math.PI * 2 / drones);
      const dx = x + Math.cos(a) * orbit;
      const dy = y + Math.sin(a) * orbit * 0.72;
      ctx.globalAlpha = 0.42;
      ctx.fillStyle = "#80deea";
      ctx.strokeStyle = "#e0f7fa";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(dx - 4, dy - 4, 8, 8);
      ctx.fill();
      ctx.stroke();

      if (score >= 8 && i % 2 === 0) {
        ctx.globalAlpha = 0.12;
        ctx.strokeStyle = "#00e5ff";
        ctx.beginPath();
        ctx.moveTo(dx, dy);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }

    if (score >= 11) {
      ctx.globalAlpha = 0.12;
      ctx.strokeStyle = "#00e5ff";
      ctx.lineWidth = 2;
      const scanY = y - 70 + ((t * 80) % 140);
      ctx.beginPath();
      ctx.moveTo(x - 130, scanY);
      ctx.lineTo(x + 130, scanY);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  private renderBow(ctx: CanvasRenderingContext2D, x: number, y: number, data: BuildEffectData, score: number): void {
    const t = data.time;
    const count = Math.min(14, 4 + Math.floor(score));
    const spread = 160 + Math.min(120, score * 8);

    for (let i = 0; i < count; i++) {
      const lane = (i / Math.max(1, count - 1) - 0.5) * spread;
      const fall = ((t * 180 + i * 37) % 170) - 85;
      ctx.globalAlpha = 0.16;
      ctx.strokeStyle = "#c5e1a5";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + lane - 18, y + fall - 46);
      ctx.lineTo(x + lane + 18, y + fall + 10);
      ctx.stroke();
    }

    if (score >= 10) {
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = "#aed581";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, 86 + Math.sin(t * 3) * 5, -0.4, Math.PI * 1.35);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
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
