import { Skill, SkillSchool, ALL_SKILLS } from "../data/skills";
import { School, SCHOOLS, getSchool } from "../data/schools";
import { Race, RACES } from "../data/races";

// 升级面板：显示 3 张技能卡，处理点击选择
export class UpgradePanel {
  cards: Skill[] = [];
  selected: Skill | null = null;

  private cardW = 190;
  private cardH = 250;
  private gap = 18;
  private cardRects: { x: number; y: number; w: number; h: number; skill: Skill }[] = [];
  private ownedIds: string[] = [];

  generateChoices(playerSchool: SkillSchool | null, ownedIds: string[]): Skill[] {
    this.ownedIds = [...ownedIds];

    const available = ALL_SKILLS.filter((s: Skill) => {
      const ownedCount = ownedIds.filter((id) => id === s.id).length;
      return ownedCount < s.maxLevel;
    });

    const weaponPool = available.filter((s: Skill) => s.school === playerSchool);
    const neutralPool = available.filter((s: Skill) => s.school === "neutral");
    const otherPool = available.filter((s: Skill) => s.school !== playerSchool && s.school !== "neutral");

    const result: Skill[] = [];
    const picked = new Set<string>();

    const pickFrom = (pool: Skill[]): Skill | null => {
      const usable = pool.filter((s) => !picked.has(s.id));
      if (usable.length <= 0) return null;
      return usable[Math.floor(Math.random() * usable.length)];
    };

    for (let i = 0; i < 3; i++) {
      const roll = Math.random();
      let pick: Skill | null = null;

      // 选定武器后，升级应围绕同一武器持续成长，而不是乱跳体系
      if (roll < 0.72) pick = pickFrom(weaponPool);
      if (!pick && roll < 0.92) pick = pickFrom(neutralPool);
      if (!pick) pick = pickFrom(otherPool);
      if (!pick) pick = pickFrom(available);

      if (pick) {
        result.push(pick);
        picked.add(pick.id);
      }
    }

    this.cards = result;
    this.selected = null;
    return this.cards;
  }

  handleClick(canvasX: number, canvasY: number): Skill | null {
    for (const rect of this.cardRects) {
      if (
        canvasX >= rect.x && canvasX <= rect.x + rect.w &&
        canvasY >= rect.y && canvasY <= rect.y + rect.h
      ) {
        this.selected = rect.skill;
        return rect.skill;
      }
    }
    return null;
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    this.cardRects = [];

    const totalW = 3 * this.cardW + 2 * this.gap;
    const startX = (w - totalW) / 2;
    const startY = h / 2 - this.cardH / 2;

    ctx.fillStyle = "#ffeb3b";
    ctx.font = "bold 22px monospace";
    ctx.textAlign = "center";
    ctx.fillText("⬆ 升级！选择一项强化", w / 2, startY - 34);

    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "11px monospace";
    ctx.fillText("同一武器可以反复升级，例如多重箭会从单发一路叠到箭雨", w / 2, startY - 14);

    for (let i = 0; i < this.cards.length; i++) {
      const skill = this.cards[i];
      const cx = startX + i * (this.cardW + this.gap);
      const cy = startY;
      const meta = this.getSchoolMeta(skill.school);
      const level = this.ownedIds.filter((id) => id === skill.id).length;
      const levelText = skill.maxLevel === 1 ? "唯一" : `Lv.${level + 1}/${skill.maxLevel}`;

      this.cardRects.push({ x: cx, y: cy, w: this.cardW, h: this.cardH, skill });

      ctx.fillStyle = "#151525";
      ctx.strokeStyle = this.getRarityColor(skill.rarity);
      ctx.lineWidth = 2;
      this.roundRect(ctx, cx, cy, this.cardW, this.cardH, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = this.getRarityColor(skill.rarity);
      ctx.fillRect(cx, cy, this.cardW, 5);

      ctx.fillStyle = meta.color;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(meta.icon + " " + meta.name, cx + 12, cy + 28);

      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillText(levelText, cx + this.cardW - 12, cy + 28);

      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "left";
      ctx.fillText(skill.name, cx + 12, cy + 56);

      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + 12, cy + 68);
      ctx.lineTo(cx + this.cardW - 12, cy + 68);
      ctx.stroke();

      ctx.fillStyle = "#aaa";
      ctx.font = "12px monospace";
      this.wrapText(ctx, skill.description, cx + 12, cy + 90, this.cardW - 24, 17);

      ctx.fillStyle = this.getRarityColor(skill.rarity);
      ctx.font = "11px monospace";
      ctx.textAlign = "right";
      const rarityLabel = skill.rarity === "epic" ? "史诗" : skill.rarity === "rare" ? "稀有" : "普通";
      ctx.fillText(rarityLabel, cx + this.cardW - 12, cy + this.cardH - 18);

      ctx.fillStyle = "#555";
      ctx.font = "bold 20px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${i + 1}`, cx + this.cardW / 2, cy + this.cardH + 24);
    }

    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    ctx.fillText("点击选择  ·  键盘 1/2/3 快速选择", w / 2, startY + this.cardH + 48);
  }

  private getSchoolMeta(school: SkillSchool): { name: string; icon: string; color: string } {
    if (school === "neutral") return { name: "通用强化", icon: "✦", color: "#b0bec5" };
    const s = getSchool(school);
    return { name: s.name, icon: s.icon, color: s.color };
  }

  private getRarityColor(rarity: string): string {
    switch (rarity) {
      case "epic": return "#ce93d8";
      case "rare": return "#42a5f5";
      default: return "#81c784";
    }
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

  private wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number): void {
    const words = text.split("");
    let line = "";
    let ly = y;
    for (let i = 0; i < words.length; i++) {
      const test = line + words[i];
      if (ctx.measureText(test).width > maxW && line.length > 0) {
        ctx.fillText(line, x, ly);
        line = words[i];
        ly += lineH;
      } else {
        line = test;
      }
    }
    ctx.fillText(line, x, ly);
  }
}

// ============ 种族选择面板 ============
export class RacePanel {
  private cardW = 160;
  private cardH = 200;
  private gap = 20;
  private cardRects: { x: number; y: number; w: number; h: number; race: Race }[] = [];

  handleClick(cx: number, cy: number): Race | null {
    for (const r of this.cardRects) {
      if (cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h) return r.race;
    }
    return null;
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    this.cardRects = [];
    const totalW = 3 * this.cardW + 2 * this.gap;
    const sx = (w - totalW) / 2;
    const sy = h / 2 - this.cardH / 2;

    ctx.fillStyle = "#fff";
    ctx.font = "bold 24px monospace";
    ctx.textAlign = "center";
    ctx.fillText("选择你的角色体质", w / 2, sy - 40);

    for (let i = 0; i < RACES.length; i++) {
      const race = RACES[i];
      const cx = sx + i * (this.cardW + this.gap);
      const cy = sy;
      this.cardRects.push({ x: cx, y: cy, w: this.cardW, h: this.cardH, race });

      ctx.fillStyle = "#1a1a2e";
      ctx.strokeStyle = race.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + 8, cy);
      ctx.lineTo(cx + this.cardW - 8, cy);
      ctx.arcTo(cx + this.cardW, cy, cx + this.cardW, cy + 8, 8);
      ctx.lineTo(cx + this.cardW, cy + this.cardH - 8);
      ctx.arcTo(cx + this.cardW, cy + this.cardH, cx + this.cardW - 8, cy + this.cardH, 8);
      ctx.lineTo(cx + 8, cy + this.cardH);
      ctx.arcTo(cx, cy + this.cardH, cx, cy + this.cardH - 8, 8);
      ctx.lineTo(cx, cy + 8);
      ctx.arcTo(cx, cy, cx + 8, cy, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = race.color;
      ctx.font = "bold 18px monospace";
      ctx.textAlign = "center";
      ctx.fillText(race.name, cx + this.cardW / 2, cy + 36);

      ctx.fillStyle = "#aaa";
      ctx.font = "11px monospace";
      ctx.fillText(race.description, cx + this.cardW / 2, cy + 60);

      ctx.fillStyle = "#888";
      ctx.font = "10px monospace";
      const lines = race.special.split("：");
      if (lines.length > 1) {
        ctx.fillText(lines[0], cx + this.cardW / 2, cy + 110);
        ctx.fillText(lines[1], cx + this.cardW / 2, cy + 128);
      }
    }

    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "12px monospace";
    ctx.fillText("点击选择", w / 2, sy + this.cardH + 40);
  }
}

// ============ 武器流派选择面板 ============
export class SchoolPanel {
  private cardW = 210;
  private cardH = 150;
  private gap = 16;
  private cardRects: { x: number; y: number; w: number; h: number; school: School }[] = [];

  handleClick(cx: number, cy: number): School | null {
    for (const r of this.cardRects) {
      if (cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h) return r.school;
    }
    return null;
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    this.cardRects = [];
    const totalW = 3 * this.cardW + 2 * this.gap;
    const sx = (w - totalW) / 2;
    const sy = h / 2 - this.cardH / 2;

    ctx.fillStyle = "#fff";
    ctx.font = "bold 24px monospace";
    ctx.textAlign = "center";
    ctx.fillText("选择你的武器流派", w / 2, sy - 44);

    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "11px monospace";
    ctx.fillText("首次升级锁定流派，后续升级会持续强化同一套武器", w / 2, sy - 22);

    for (let i = 0; i < SCHOOLS.length; i++) {
      const school = SCHOOLS[i];
      const cx = sx + i * (this.cardW + this.gap);
      const cy = sy;
      this.cardRects.push({ x: cx, y: cy, w: this.cardW, h: this.cardH, school });

      ctx.fillStyle = "#1a1a2e";
      ctx.strokeStyle = school.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + 8, cy);
      ctx.lineTo(cx + this.cardW - 8, cy);
      ctx.arcTo(cx + this.cardW, cy, cx + this.cardW, cy + 8, 8);
      ctx.lineTo(cx + this.cardW, cy + this.cardH - 8);
      ctx.arcTo(cx + this.cardW, cy + this.cardH, cx + this.cardW - 8, cy + this.cardH, 8);
      ctx.lineTo(cx + 8, cy + this.cardH);
      ctx.arcTo(cx, cy + this.cardH, cx, cy + this.cardH - 8, 8);
      ctx.lineTo(cx, cy + 8);
      ctx.arcTo(cx, cy, cx + 8, cy, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = school.color;
      ctx.font = "bold 18px monospace";
      ctx.fillText(school.icon + " " + school.name, cx + this.cardW / 2, cy + 34);

      ctx.fillStyle = "#aaa";
      ctx.font = "12px monospace";
      ctx.fillText(school.description, cx + this.cardW / 2, cy + 62);

      ctx.fillStyle = "#777";
      ctx.font = "10px monospace";
      this.wrapTextCenter(ctx, school.theme, cx + this.cardW / 2, cy + 90, this.cardW - 24, 15);
    }

    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "12px monospace";
    ctx.fillText("点击选择 · 当前优先完善弓箭手流派", w / 2, sy + this.cardH + 40);
  }

  private wrapTextCenter(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number): void {
    const words = text.split("");
    let line = "";
    let ly = y;
    for (let i = 0; i < words.length; i++) {
      const test = line + words[i];
      if (ctx.measureText(test).width > maxW && line.length > 0) {
        ctx.fillText(line, x, ly);
        line = words[i];
        ly += lineH;
      } else {
        line = test;
      }
    }
    ctx.fillText(line, x, ly);
  }
}
