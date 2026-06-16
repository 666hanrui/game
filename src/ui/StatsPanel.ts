import type { Skill } from "../data/skills";
import { getCurrentDifficulty } from "../systems/DifficultySystem";
import { buildBuildProgress } from "../systems/BuildProgressRuntime";

interface PlayerLike {
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  attackCooldown: number;
  projectileExtra: number;
  critChance: number;
  critMultiplier: number;
}

interface NamedLike {
  name: string;
  color?: string;
  icon?: string;
  id?: string;
}

export interface StatsPanelData {
  player: PlayerLike;
  race?: NamedLike | null;
  school?: NamedLike | null;
  weapon?: NamedLike | null;
  level: number;
  wave: number;
  kills: number;
  bossKills: number;
  skills: Skill[];
}

export class StatsPanel {
  render(ctx: CanvasRenderingContext2D, data: StatsPanelData): void {
    const w = 254;
    const h = 292;
    const x = 16;
    const y = 118;
    const difficulty = getCurrentDifficulty();
    const p = data.player;
    const attacksPerSecond = 1 / Math.max(0.05, p.attackCooldown);
    const build = buildBuildProgress(data.skills, data.weapon?.id);

    ctx.save();
    ctx.fillStyle = "rgba(8,8,18,0.58)";
    ctx.strokeStyle = build.hybrid ? build.color : "rgba(255,255,255,0.16)";
    ctx.lineWidth = build.hybrid ? 2 : 1.5;
    this.roundRect(ctx, x, y, w, h, 12);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px monospace";
    ctx.fillText("角色属性", x + 14, y + 24);

    ctx.textAlign = "right";
    ctx.fillStyle = difficulty.color;
    ctx.font = "bold 12px monospace";
    ctx.fillText(`难度：${difficulty.name}`, x + w - 14, y + 24);

    this.drawLine(ctx, x + 14, y + 42, w - 28);

    const schoolText = data.weapon
      ? `${data.school?.name ?? "未定"} · ${data.weapon.name}`
      : data.school?.name ?? "未选体系";

    let cy = y + 62;
    cy = this.row(ctx, x, cy, "种族", data.race?.name ?? "未知", data.race?.color ?? "#90caf9", w);
    cy = this.row(ctx, x, cy, "路线", schoolText, data.weapon?.color ?? data.school?.color ?? "#b0bec5", w);
    cy = this.row(ctx, x, cy, "流派", build.label, build.color, w);
    cy = this.row(ctx, x, cy, "阶段点数", `${build.primary.points.toFixed(1)} / 7`, build.primary.color, w);
    cy = this.row(ctx, x, cy, "隐藏联动", `${build.activeSynergyCount}`, build.activeSynergyCount > 0 ? "#ffd54f" : "rgba(255,255,255,0.48)", w);

    this.drawLine(ctx, x + 14, cy + 4, w - 28);
    cy += 23;

    cy = this.row(ctx, x, cy, "生命", `${Math.ceil(p.hp)} / ${p.maxHp}`, "#66bb6a", w);
    cy = this.row(ctx, x, cy, "伤害", `${p.damage}`, "#ffb74d", w);
    cy = this.row(ctx, x, cy, "移速", `${Math.round(p.speed)}`, "#4fc3f7", w);
    cy = this.row(ctx, x, cy, "攻速", `${attacksPerSecond.toFixed(2)} 次/秒`, "#ffd54f", w);
    cy = this.row(ctx, x, cy, "额外弹体", `+${p.projectileExtra}`, "#ce93d8", w);
    cy = this.row(ctx, x, cy, "暴击", `${Math.round(p.critChance * 100)}% / x${p.critMultiplier.toFixed(2)}`, "#ffeb3b", w);

    this.drawLine(ctx, x + 14, cy + 4, w - 28);
    cy += 23;

    cy = this.row(ctx, x, cy, "等级/波次", `Lv.${data.level} / 第${data.wave}波`, "#90caf9", w);
    cy = this.row(ctx, x, cy, "击杀/Boss", `${data.kills} / ${data.bossKills}`, "#ef9a9a", w);
    cy = this.row(ctx, x, cy, "强化数量", `${data.skills.length}`, "#b39ddb", w);

    if (build.activeSynergyNames.length > 0) {
      const names = build.activeSynergyNames.slice(0, 2).join(" · ");
      ctx.fillStyle = "rgba(255,213,79,0.84)";
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(names, x + w / 2, y + h - 28);
    }

    ctx.fillStyle = build.hybrid ? build.color : "rgba(255,255,255,0.28)";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillText(build.hybrid ? build.hybrid.description : "后期爽感 = 流派成型 + 稀有强化 + 高阶特效", x + w / 2, y + h - 12);
    ctx.restore();
  }

  private row(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, value: string, color: string, width: number): number {
    ctx.textAlign = "left";
    ctx.font = "11px monospace";
    ctx.fillStyle = "rgba(255,255,255,0.48)";
    ctx.fillText(label, x + 14, y);

    ctx.textAlign = "right";
    ctx.font = "bold 11px monospace";
    ctx.fillStyle = color;
    ctx.fillText(value, x + width - 14, y);
    return y + 18;
  }

  private drawLine(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
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
}
