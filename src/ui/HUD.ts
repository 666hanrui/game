import type { GoalProgress } from "../systems/GoalSystem";

export interface HUDData {
  hp: number;
  maxHp: number;
  xp: number;
  xpToNext: number;
  level: number;
  wave: number;
  kills: number;
  raceName?: string;
  schoolName?: string;
  schoolIcon?: string;
  goals?: GoalProgress[];
  soulCrystals?: number;
}

export class HUD {
  render(ctx: CanvasRenderingContext2D, data: HUDData): void {
    const pad = 16;
    const barW = 200;
    const barH = 12;

    // ===== 种族 + 体系标签 =====
    if (data.raceName) {
      ctx.textAlign = "left";
      ctx.font = "bold 12px monospace";
      ctx.fillStyle = "#aaa";
      ctx.fillText(
        (data.schoolIcon ?? "") + " " + data.raceName + (data.schoolName ? " · " + data.schoolName : ""),
        pad, pad + 12,
      );
    }

    const topY = data.raceName ? pad + 20 : pad;

    // ===== 血量 =====
    const hpPct = Math.max(0, data.hp / data.maxHp);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(pad, topY - 2, barW + 4, barH + 4);
    ctx.fillStyle = "#333";
    ctx.fillRect(pad + 2, topY, barW, barH);
    ctx.fillStyle = hpPct > 0.3 ? "#66bb6a" : "#ef5350";
    ctx.fillRect(pad + 2, topY, barW * hpPct, barH);
    ctx.fillStyle = "#fff";
    ctx.font = "11px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`HP ${Math.ceil(data.hp)} / ${data.maxHp}`, pad + 6, topY + 10);

    // ===== 经验 =====
    const xpY = topY + barH + 6;
    const xpPct = Math.min(1, data.xp / data.xpToNext);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(pad, xpY - 2, barW + 4, barH + 4);
    ctx.fillStyle = "#333";
    ctx.fillRect(pad + 2, xpY, barW, barH);
    ctx.fillStyle = "#42a5f5";
    ctx.fillRect(pad + 2, xpY, barW * xpPct, barH);
    ctx.fillStyle = "#fff";
    ctx.fillText(`Lv.${data.level}  XP ${data.xp} / ${data.xpToNext}`, pad + 6, xpY + 10);

    // ===== 右上角 =====
    const rx = ctx.canvas.width - pad;
    ctx.textAlign = "right";
    ctx.font = "13px monospace";
    ctx.fillStyle = "#ccc";
    ctx.fillText(`波次 ${data.wave}`, rx, pad + 14);
    ctx.fillText(`击杀 ${data.kills}`, rx, pad + 32);
    if (typeof data.soulCrystals === "number") {
      ctx.fillStyle = "#ce93d8";
      ctx.fillText(`魂晶 ${data.soulCrystals}`, rx, pad + 50);
    }

    if (data.goals && data.goals.length > 0) {
      const boxW = 210;
      const boxH = 22 + data.goals.length * 20;
      const bx = ctx.canvas.width - pad - boxW;
      const by = pad + 66;

      ctx.fillStyle = "rgba(0,0,0,0.42)";
      ctx.fillRect(bx, by, boxW, boxH);
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.strokeRect(bx, by, boxW, boxH);

      ctx.textAlign = "left";
      ctx.font = "bold 12px monospace";
      ctx.fillStyle = "#fff";
      ctx.fillText("本局目标", bx + 10, by + 16);

      ctx.font = "11px monospace";
      for (let i = 0; i < data.goals.length; i++) {
        const g = data.goals[i];
        const y = by + 38 + i * 20;
        ctx.fillStyle = g.done ? "#81c784" : "#aaa";
        ctx.fillText(`${g.done ? "✓" : "□"} ${g.title}`, bx + 10, y);
        ctx.textAlign = "right";
        ctx.fillText(`${g.current}/${g.target}`, bx + boxW - 10, y);
        ctx.textAlign = "left";
      }
    }

    // 操作提示
    ctx.textAlign = "center";
    ctx.font = "11px monospace";
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillText("WASD 移动 · 鼠标瞄准 · 左键/J/空格射击 · F 切换自动开火", ctx.canvas.width / 2, ctx.canvas.height - 16);
  }
}
