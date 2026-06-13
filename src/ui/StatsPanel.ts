import type { Skill } from "../data/skills";
import { getCurrentDifficulty } from "../systems/DifficultySystem";

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
    const w = 238;
    const h = 258;
    const x = 16;
    const y = 118;
    const difficulty = getCurrentDifficulty();
    const p = data.player;
    const attacksPerSecond = 1 / Math.max(0.05, p.attackCooldown);
    const build = this.getBuildLabel(data);

    ctx.save();
    ctx.fillStyle = "rgba(8,8,18,0.58)";
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = 1.5;
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
    cy = this.row(ctx, x, cy, "种族", data.race?.name ?? "未知", data.race?.color ?? "#90caf9");
    cy = this.row(ctx, x, cy, "路线", schoolText, data.weapon?.color ?? data.school?.color ?? "#b0bec5");
    cy = this.row(ctx, x, cy, "流派", build.label, build.color);

    this.drawLine(ctx, x + 14, cy + 4, w - 28);
    cy += 23;

    cy = this.row(ctx, x, cy, "生命", `${Math.ceil(p.hp)} / ${p.maxHp}`, "#66bb6a");
    cy = this.row(ctx, x, cy, "伤害", `${p.damage}`, "#ffb74d");
    cy = this.row(ctx, x, cy, "移速", `${Math.round(p.speed)}`, "#4fc3f7");
    cy = this.row(ctx, x, cy, "攻速", `${attacksPerSecond.toFixed(2)} 次/秒`, "#ffd54f");
    cy = this.row(ctx, x, cy, "额外弹体", `+${p.projectileExtra}`, "#ce93d8");
    cy = this.row(ctx, x, cy, "暴击", `${Math.round(p.critChance * 100)}% / x${p.critMultiplier.toFixed(2)}`, "#ffeb3b");

    this.drawLine(ctx, x + 14, cy + 4, w - 28);
    cy += 23;

    cy = this.row(ctx, x, cy, "等级/波次", `Lv.${data.level} / 第${data.wave}波`, "#90caf9");
    cy = this.row(ctx, x, cy, "击杀/Boss", `${data.kills} / ${data.bossKills}`, "#ef9a9a");
    cy = this.row(ctx, x, cy, "强化数量", `${data.skills.length}`, "#b39ddb");

    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillText("后期爽感 = 流派成型 + 稀有强化 + 高阶特效", x + w / 2, y + h - 12);
    ctx.restore();
  }

  private getBuildLabel(data: StatsPanelData): { label: string; color: string } {
    const weaponId = data.weapon?.id;
    const skillCount = data.skills.length;
    const projectile = data.player.projectileExtra;
    const damage = data.player.damage;
    const crit = data.player.critChance;

    if (!weaponId) return { label: "待成型", color: "#90a4ae" };

    if (weaponId === "wand" || weaponId === "staff" || weaponId === "orb") {
      if (skillCount >= 8 || projectile >= 5) return { label: "魔法暴走", color: "#ce93d8" };
      if (skillCount >= 4) return { label: "奥术成型", color: "#ba68c8" };
      return { label: "法术起步", color: "#9575cd" };
    }

    if (weaponId === "bow") {
      if (projectile >= 7) return { label: "箭雨成型", color: "#81c784" };
      if (projectile >= 3) return { label: "多重射击", color: "#aed581" };
      return { label: "弓术起步", color: "#c5e1a5" };
    }

    if (weaponId === "flying_blade" || weaponId === "spear") {
      if (damage >= 120 || crit >= 0.35) return { label: "剑气/枪芒", color: "#ffb74d" };
      if (skillCount >= 5) return { label: "武技成型", color: "#ffcc80" };
      return { label: "冷兵器起步", color: "#ffe0b2" };
    }

    if (weaponId === "drone_core" || weaponId === "energy_core") {
      if (skillCount >= 8 || projectile >= 5) return { label: "科技军团", color: "#4dd0e1" };
      if (skillCount >= 4) return { label: "自动火力", color: "#80deea" };
      return { label: "科技起步", color: "#b2ebf2" };
    }

    return { label: "成长中", color: "#eeeeee" };
  }

  private row(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, value: string, color: string): number {
    ctx.textAlign = "left";
    ctx.font = "11px monospace";
    ctx.fillStyle = "rgba(255,255,255,0.48)";
    ctx.fillText(label, x + 14, y);

    ctx.textAlign = "right";
    ctx.font = "bold 11px monospace";
    ctx.fillStyle = color;
    ctx.fillText(value, x + 224, y);
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
