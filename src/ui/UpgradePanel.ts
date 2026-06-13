import { Skill, SkillSchool, getSkill, ALL_SKILLS, SKILL_POOL } from "../data/skills";
import { School, SCHOOLS, getSchool } from "../data/schools";
import { Race, RACES, getRace } from "../data/races";

// 升级面板：显示 3 张技能卡，处理点击选择
export class UpgradePanel {
  cards: Skill[] = [];
  selected: Skill | null = null;

  private cardW = 180;
  private cardH = 240;
  private gap = 16;
  private cardRects: { x: number; y: number; w: number; h: number; skill: Skill }[] = [];

  generateChoices(playerSchool: SkillSchool | null, ownedIds: string[]): Skill[] {
    
    // 构建可用池：60% 概率出体系卡，40% 出中立/其他
    const pool: Skill[] = [];
    
    // 过滤已拥有的技能
    const available = ALL_SKILLS.filter((s: Skill) => {
      // 检查叠加上限
      const ownedCount = ownedIds.filter((id) => id === s.id).length;
      return ownedCount < s.maxLevel;
    });

    // 按学校分
    const schoolPool = available.filter((s: Skill) => s.school === playerSchool);
    const neutralPool = available.filter((s: Skill) => s.school === "neutral");
    const otherPool = available.filter((s: Skill) => s.school !== playerSchool && s.school !== "neutral");

    // 生成 3 张卡
    const result: Skill[] = [];
    for (let i = 0; i < 3; i++) {
      const roll = Math.random();
      let pick: Skill;
      if (roll < 0.55 && schoolPool.length > 0) {
        pick = schoolPool[Math.floor(Math.random() * schoolPool.length)];
      } else if (roll < 0.8 && neutralPool.length > 0) {
        pick = neutralPool[Math.floor(Math.random() * neutralPool.length)];
      } else if (otherPool.length > 0) {
        pick = otherPool[Math.floor(Math.random() * otherPool.length)];
      } else {
        pick = available[Math.floor(Math.random() * available.length)];
      }
      if (!pick) {
        // 兜底
        pick = available[Math.floor(Math.random() * available.length)];
      }
      if (pick) result.push(pick);
    }

    this.cards = result.filter((s) => s !== undefined);
    this.selected = null;
    return this.cards;
  }

  // 处理画布点击
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

  // 渲染
  render(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    this.cardRects = [];

    const totalW = 3 * this.cardW + 2 * this.gap;
    const startX = (w - totalW) / 2;
    const startY = h / 2 - this.cardH / 2;

    // 标题
    ctx.fillStyle = "#ffeb3b";
    ctx.font = "bold 22px monospace";
    ctx.textAlign = "center";
    ctx.fillText("⬆ 升级！选择一项技能", w / 2, startY - 30);

    for (let i = 0; i < this.cards.length; i++) {
      const skill = this.cards[i];
      const cx = startX + i * (this.cardW + this.gap);
      const cy = startY;

      this.cardRects.push({ x: cx, y: cy, w: this.cardW, h: this.cardH, skill });

      // 卡牌背景
      ctx.fillStyle = "#1a1a2e";
      ctx.strokeStyle = this.getRarityColor(skill.rarity);
      ctx.lineWidth = 2;
      this.roundRect(ctx, cx, cy, this.cardW, this.cardH, 8);
      ctx.fill();
      ctx.stroke();

      // 稀有度顶条
      ctx.fillStyle = this.getRarityColor(skill.rarity);
      ctx.fillRect(cx, cy, this.cardW, 4);

      // 学校标签
      const school = getSchool(skill.school);
      ctx.fillStyle = school.color;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(school.icon + " " + school.name, cx + 12, cy + 28);

      // 技能名
      ctx.fillStyle = "#fff";
      ctx.font = "bold 15px monospace";
      ctx.fillText(skill.name, cx + 12, cy + 52);

      // 分割线
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + 12, cy + 62);
      ctx.lineTo(cx + this.cardW - 12, cy + 62);
      ctx.stroke();

      // 描述
      ctx.fillStyle = "#aaa";
      ctx.font = "12px monospace";
      this.wrapText(ctx, skill.description, cx + 12, cy + 80, this.cardW - 24, 16);

      // 稀有度文字
      ctx.fillStyle = this.getRarityColor(skill.rarity);
      ctx.font = "11px monospace";
      ctx.textAlign = "right";
      const rarityLabel = skill.rarity === "epic" ? "史诗" : skill.rarity === "rare" ? "稀有" : "普通";
      ctx.fillText(rarityLabel, cx + this.cardW - 12, cy + this.cardH - 16);

      // 序号提示
      ctx.fillStyle = "#555";
      ctx.font = "bold 20px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${i + 1}`, cx + this.cardW / 2, cy + this.cardH + 24);
    }

    // PC 端键盘提示
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    ctx.fillText("点击选择  ·  键盘 1/2/3 快速选择", w / 2, startY + this.cardH + 48);
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
    ctx.fillText("选择你的种族", w / 2, sy - 40);

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

      // 种族名
      ctx.fillStyle = race.color;
      ctx.font = "bold 18px monospace";
      ctx.textAlign = "center";
      ctx.fillText(race.name, cx + this.cardW / 2, cy + 36);

      // 描述
      ctx.fillStyle = "#aaa";
      ctx.font = "11px monospace";
      ctx.fillText(race.description, cx + this.cardW / 2, cy + 60);

      // 特性
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

// ============ 体系选择面板 ============
export class SchoolPanel {
  private cardW = 200;
  private cardH = 140;
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
    ctx.fillText("选择你的体系路线", w / 2, sy - 40);

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
      ctx.fillText(school.description, cx + this.cardW / 2, cy + 58);

      ctx.fillStyle = "#777";
      ctx.font = "10px monospace";
      ctx.fillText(school.theme, cx + this.cardW / 2, cy + 82);
    }

    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "12px monospace";
    ctx.fillText("点击选择 · 第 1 次升级时触发 · 不可更改", w / 2, sy + this.cardH + 40);
  }
}
