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

    const schoolPool = available.filter((s: Skill) => s.school === playerSchool);
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

      // 选定体系后，升级优先围绕该体系允许的武器路线继续成长
      if (roll < 0.72) pick = pickFrom(schoolPool);
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
    ctx.fillText("体系决定武器大类，同一武器路线可以持续叠加成长", w / 2, startY - 14);

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
  private cardW = 150;
  private cardH = 178;
  private gap = 18;
  private cardRects: { x: number; y: number; w: number; h: number; race: Race }[] = [];

  handleClick(cx: number, cy: number): Race | null {
    for (const r of this.cardRects) {
      if (cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h) return r.race;
    }
    return null;
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    this.cardRects = [];
    const cols = Math.min(3, RACES.length);
    const rows = Math.ceil(RACES.length / cols);
    const totalH = rows * this.cardH + (rows - 1) * this.gap;
    const sy = h / 2 - totalH / 2 + 18;

    ctx.fillStyle = "#fff";
    ctx.font = "bold 24px monospace";
    ctx.textAlign = "center";
    ctx.fillText("选择你的种族", w / 2, sy - 52);

    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "11px monospace";
    ctx.fillText("种族决定身体底子、体型、前后期成长和天赋", w / 2, sy - 30);

    for (let i = 0; i < RACES.length; i++) {
      const race = RACES[i];
      const row = Math.floor(i / cols);
      const col = i % cols;
      const countInRow = Math.min(cols, RACES.length - row * cols);
      const rowW = countInRow * this.cardW + (countInRow - 1) * this.gap;
      const cx = (w - rowW) / 2 + col * (this.cardW + this.gap);
      const cy = sy + row * (this.cardH + this.gap);
      this.cardRects.push({ x: cx, y: cy, w: this.cardW, h: this.cardH, race });

      ctx.fillStyle = "#1a1a2e";
      ctx.strokeStyle = race.color;
      ctx.lineWidth = 2;
      this.roundRect(ctx, cx, cy, this.cardW, this.cardH, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = race.color;
      ctx.font = "bold 17px monospace";
      ctx.textAlign = "center";
      ctx.fillText(race.name, cx + this.cardW / 2, cy + 30);

      ctx.fillStyle = "#aaa";
      ctx.font = "10px monospace";
      ctx.fillText(race.description, cx + this.cardW / 2, cy + 52);

      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = "10px monospace";
      ctx.fillText(`成长：${this.growthLabel(race.growth)}`, cx + this.cardW / 2, cy + 76);

      ctx.textAlign = "left";
      ctx.fillStyle = "#888";
      ctx.font = "9px monospace";
      ctx.fillText(`生命 x${race.hpMod}`, cx + 12, cy + 102);
      ctx.fillText(`速度 x${race.spdMod}`, cx + 12, cy + 118);
      ctx.fillText(`伤害 x${race.dmgMod}`, cx + 12, cy + 134);
      ctx.fillText(`体型 x${race.radiusMod}`, cx + 12, cy + 150);

      ctx.textAlign = "right";
      ctx.fillStyle = race.color;
      ctx.font = "9px monospace";
      ctx.fillText(race.talentName, cx + this.cardW - 12, cy + 150);
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "12px monospace";
    ctx.fillText("点击选择", w / 2, sy + totalH + 34);
  }

  private growthLabel(growth: Race["growth"]): string {
    switch (growth) {
      case "early": return "前期强";
      case "late": return "后期强";
      case "agile": return "敏捷";
      case "brute": return "体魄";
      default: return "均衡";
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
}

// ============ 体系选择面板 ============
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
    ctx.fillText("选择你的体系", w / 2, sy - 44);

    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "11px monospace";
    ctx.fillText("体系决定可用武器类型：古武用冷兵器，魔法用魔法媒介，科技用装置", w / 2, sy - 22);

    for (let i = 0; i < SCHOOLS.length; i++) {
      const school = SCHOOLS[i];
      const cx = sx + i * (this.cardW + this.gap);
      const cy = sy;
      this.cardRects.push({ x: cx, y: cy, w: this.cardW, h: this.cardH, school });

      ctx.fillStyle = "#1a1a2e";
      ctx.strokeStyle = school.color;
      ctx.lineWidth = 2;
      this.roundRect(ctx, cx, cy, this.cardW, this.cardH, 8);
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
    ctx.fillText("点击选择 · 当前优先完善古武体系下的弓箭路线", w / 2, sy + this.cardH + 40);
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
