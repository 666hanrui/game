import { Skill, SkillSchool, ALL_SKILLS } from "../data/skills";
import { School, SCHOOLS, getSchool } from "../data/schools";
import { Race, RACES } from "../data/races";
import { Weapon, getWeaponsBySchool, getWeapon } from "../data/weapons";
import { getWeaponWeightLabel } from "../systems/WeaponStatRuntime";

interface AssetLike {
  get(group: string, id: string | null | undefined): HTMLImageElement | null;
}

interface CardMeta {
  name: string;
  icon: string;
  color: string;
  assetGroup?: string;
  assetId?: string;
}

export class UpgradePanel {
  cards: Skill[] = [];
  selected: Skill | null = null;

  private cardW = 198;
  private cardH = 272;
  private gap = 18;
  private cardRects: { x: number; y: number; w: number; h: number; skill: Skill }[] = [];
  private ownedIds: string[] = [];

  generateChoices(playerSchool: SkillSchool | null, ownedIds: string[], weaponId: string | null = null): Skill[] {
    this.ownedIds = [...ownedIds];
    const available = ALL_SKILLS.filter((s: Skill) => ownedIds.filter((id) => id === s.id).length < s.maxLevel);
    const weaponPool = available.filter((s: Skill) => s.school === playerSchool && s.weapon === weaponId);
    const schoolPool = available.filter((s: Skill) => s.school === playerSchool && !s.weapon);
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
      if (roll < 0.72) pick = pickFrom(weaponPool);
      if (!pick && roll < 0.84) pick = pickFrom(schoolPool);
      if (!pick && roll < 0.94) pick = pickFrom(neutralPool);
      if (!pick) pick = pickFrom(otherPool);
      if (!pick) pick = pickFrom(available);
      if (pick) { result.push(pick); picked.add(pick.id); }
    }

    this.cards = result;
    this.selected = null;
    return this.cards;
  }

  handleClick(canvasX: number, canvasY: number): Skill | null {
    for (const rect of this.cardRects) {
      if (canvasX >= rect.x && canvasX <= rect.x + rect.w && canvasY >= rect.y && canvasY <= rect.y + rect.h) {
        this.selected = rect.skill;
        return rect.skill;
      }
    }
    return null;
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number, assets?: AssetLike): void {
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
    ctx.fillText("同一武器路线可以持续升级，例如弓箭从单发一路成长到箭雨", w / 2, startY - 14);

    for (let i = 0; i < this.cards.length; i++) {
      const skill = this.cards[i];
      const cx = startX + i * (this.cardW + this.gap);
      const cy = startY;
      const meta = this.getSkillMeta(skill);
      const level = this.ownedIds.filter((id) => id === skill.id).length;
      const levelText = skill.maxLevel === 1 ? "唯一" : `Lv.${level + 1}/${skill.maxLevel}`;
      const sprite = assets?.get(meta.assetGroup ?? "", meta.assetId);
      this.cardRects.push({ x: cx, y: cy, w: this.cardW, h: this.cardH, skill });

      ctx.fillStyle = "#151525";
      ctx.strokeStyle = this.getRarityColor(skill.rarity);
      ctx.lineWidth = 2;
      this.roundRect(ctx, cx, cy, this.cardW, this.cardH, 10);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = this.getRarityColor(skill.rarity);
      ctx.fillRect(cx, cy, this.cardW, 5);
      ctx.fillStyle = meta.color;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(meta.icon + " " + meta.name, cx + 12, cy + 28);
      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillText(levelText, cx + this.cardW - 12, cy + 28);
      this.drawIconBubble(ctx, cx + this.cardW / 2, cy + 65, 43, meta.color, sprite, meta.icon);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "center";
      ctx.fillText(skill.name, cx + this.cardW / 2, cy + 108);
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx + 12, cy + 122); ctx.lineTo(cx + this.cardW - 12, cy + 122); ctx.stroke();
      ctx.fillStyle = "#aaa";
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      this.wrapText(ctx, skill.description, cx + 12, cy + 145, this.cardW - 24, 17);
      ctx.fillStyle = this.getRarityColor(skill.rarity);
      ctx.font = "11px monospace";
      ctx.textAlign = "right";
      const rarityLabel = skill.rarity === "diamond" ? "钻石" : skill.rarity === "legendary" ? "传说" : skill.rarity === "epic" ? "史诗" : skill.rarity === "rare" ? "稀有" : "普通";
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

  private getSkillMeta(skill: Skill): CardMeta {
    if (skill.weapon) {
      const weapon = getWeapon(skill.weapon);
      if (weapon) return { name: weapon.name, icon: weapon.icon, color: weapon.color, assetGroup: "weapons", assetId: weapon.id };
    }
    if (skill.school === "neutral") return { name: "通用强化", icon: "✦", color: "#b0bec5" };
    const s = getSchool(skill.school);
    return { name: s.name, icon: s.icon, color: s.color };
  }

  private getRarityColor(rarity: string): string {
    switch (rarity) {
      case "diamond": return "#b3e5fc";
      case "legendary": return "#ffca28";
      case "epic": return "#ce93d8";
      case "rare": return "#42a5f5";
      default: return "#81c784";
    }
  }

  private drawIconBubble(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, img: HTMLImageElement | null | undefined, fallback: string): void {
    const glow = ctx.createRadialGradient(x, y, 2, x, y, size * 0.9);
    glow.addColorStop(0, color + "aa"); glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, size * 0.65, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.07)"; ctx.strokeStyle = color; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y, size * 0.45, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (img) ctx.drawImage(img, x - size * 0.32, y - size * 0.32, size * 0.64, size * 0.64);
    else { ctx.fillStyle = color; ctx.font = "bold 24px monospace"; ctx.textAlign = "center"; ctx.fillText(fallback, x, y + 8); }
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r); ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r); ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number): void {
    const words = text.split(""); let line = ""; let ly = y; const maxLines = 6; let lines = 0;
    for (let i = 0; i < words.length; i++) { const test = line + words[i]; if (ctx.measureText(test).width > maxW && line.length > 0) { ctx.fillText(line, x, ly); lines++; if (lines >= maxLines) { ctx.fillText("……", x, ly + lineH); return; } line = words[i]; ly += lineH; } else line = test; }
    ctx.fillText(line, x, ly);
  }
}

export class RacePanel {
  private cardW = 160;
  private cardH = 210;
  private gap = 18;
  private cardRects: { x: number; y: number; w: number; h: number; race: Race }[] = [];

  handleClick(cx: number, cy: number): Race | null {
    for (const r of this.cardRects) if (cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h) return r.race;
    return null;
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number, assets?: AssetLike): void {
    this.cardRects = [];
    const cols = Math.min(3, RACES.length);
    const rows = Math.ceil(RACES.length / cols);
    const totalH = rows * this.cardH + (rows - 1) * this.gap;
    const sy = h / 2 - totalH / 2 + 18;
    ctx.fillStyle = "#fff"; ctx.font = "bold 24px monospace"; ctx.textAlign = "center"; ctx.fillText("选择你的种族", w / 2, sy - 52);
    ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.font = "11px monospace"; ctx.fillText("种族决定身体底子、体型、前后期成长和天赋", w / 2, sy - 30);
    for (let i = 0; i < RACES.length; i++) {
      const race = RACES[i]; const row = Math.floor(i / cols); const col = i % cols; const countInRow = Math.min(cols, RACES.length - row * cols); const rowW = countInRow * this.cardW + (countInRow - 1) * this.gap; const cx = (w - rowW) / 2 + col * (this.cardW + this.gap); const cy = sy + row * (this.cardH + this.gap);
      this.cardRects.push({ x: cx, y: cy, w: this.cardW, h: this.cardH, race });
      ctx.fillStyle = "#1a1a2e"; ctx.strokeStyle = race.color; ctx.lineWidth = 2; this.roundRect(ctx, cx, cy, this.cardW, this.cardH, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = race.color; ctx.font = "bold 17px monospace"; ctx.textAlign = "center"; ctx.fillText(race.name, cx + this.cardW / 2, cy + 28);
      this.drawRacePortrait(ctx, cx + this.cardW / 2, cy + 66, race.color, assets?.get("races", race.id), race.name.slice(0, 1));
      ctx.fillStyle = "#aaa"; ctx.font = "10px monospace"; ctx.fillText(race.description, cx + this.cardW / 2, cy + 105);
      ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.font = "10px monospace"; ctx.fillText(`成长：${this.growthLabel(race.growth)}`, cx + this.cardW / 2, cy + 126);
      ctx.textAlign = "left"; ctx.fillStyle = "#888"; ctx.font = "9px monospace"; ctx.fillText(`生命 x${race.hpMod}`, cx + 14, cy + 151); ctx.fillText(`速度 x${race.spdMod}`, cx + 14, cy + 167); ctx.fillText(`伤害 x${race.dmgMod}`, cx + 14, cy + 183); ctx.fillText(`体型 x${race.radiusMod}`, cx + 14, cy + 199);
      ctx.textAlign = "right"; ctx.fillStyle = race.color; ctx.font = "9px monospace"; ctx.fillText(race.talentName, cx + this.cardW - 14, cy + 199);
    }
    ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.font = "12px monospace"; ctx.fillText("点击选择", w / 2, sy + totalH + 34);
  }

  private drawRacePortrait(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, img: HTMLImageElement | null | undefined, fallback: string): void {
    ctx.fillStyle = "rgba(255,255,255,0.06)"; ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 25, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (img) ctx.drawImage(img, x - 24, y - 24, 48, 48); else { ctx.fillStyle = color; ctx.font = "bold 22px monospace"; ctx.textAlign = "center"; ctx.fillText(fallback, x, y + 8); }
  }

  private growthLabel(growth: Race["growth"]): string {
    switch (growth) { case "early": return "前期强"; case "late": return "后期强"; case "agile": return "敏捷"; case "brute": return "体魄"; default: return "均衡"; }
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r); ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r); ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
  }
}

export class SchoolPanel {
  private cardW = 210;
  private cardH = 150;
  private gap = 16;
  private cardRects: { x: number; y: number; w: number; h: number; school: School }[] = [];

  handleClick(cx: number, cy: number): School | null {
    for (const r of this.cardRects) if (cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h) return r.school;
    return null;
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    this.cardRects = [];
    const totalW = 3 * this.cardW + 2 * this.gap;
    const sx = (w - totalW) / 2;
    const sy = h / 2 - this.cardH / 2;
    ctx.fillStyle = "#fff"; ctx.font = "bold 24px monospace"; ctx.textAlign = "center"; ctx.fillText("选择你的体系", w / 2, sy - 44);
    ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.font = "11px monospace"; ctx.fillText("体系决定可用武器类型：古武用冷兵器，魔法用魔法媒介，科技用装置", w / 2, sy - 22);
    for (let i = 0; i < SCHOOLS.length; i++) { const school = SCHOOLS[i]; const cx = sx + i * (this.cardW + this.gap); const cy = sy; this.cardRects.push({ x: cx, y: cy, w: this.cardW, h: this.cardH, school }); this.drawCard(ctx, cx, cy, this.cardW, this.cardH, school.color, school.icon, school.name, school.description, school.theme); }
    ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.font = "12px monospace"; ctx.fillText("点击选择体系", w / 2, sy + this.cardH + 40);
  }

  private drawCard(ctx: CanvasRenderingContext2D, x: number, y: number, cw: number, ch: number, color: string, icon: string, title: string, desc: string, theme: string): void {
    ctx.fillStyle = "#1a1a2e"; ctx.strokeStyle = color; ctx.lineWidth = 2; this.roundRect(ctx, x, y, cw, ch, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = color; ctx.font = "bold 20px monospace"; ctx.textAlign = "center"; ctx.fillText(icon, x + cw / 2, y + 30); ctx.font = "bold 17px monospace"; ctx.fillText(title, x + cw / 2, y + 55); ctx.fillStyle = "#aaa"; ctx.font = "12px monospace"; ctx.fillText(desc, x + cw / 2, y + 80); ctx.fillStyle = "#777"; ctx.font = "10px monospace"; this.wrapTextCenter(ctx, theme, x + cw / 2, y + 105, cw - 24, 15);
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r); ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r); ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
  }

  private wrapTextCenter(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number): void {
    const words = text.split(""); let line = ""; let ly = y;
    for (let i = 0; i < words.length; i++) { const test = line + words[i]; if (ctx.measureText(test).width > maxW && line.length > 0) { ctx.fillText(line, x, ly); line = words[i]; ly += lineH; } else line = test; }
    ctx.fillText(line, x, ly);
  }
}

export class WeaponPanel {
  private cardW = 220;
  private cardH = 154;
  private gap = 14;
  private page = 0;
  private readonly pageSize = 9;
  private cardRects: { x: number; y: number; w: number; h: number; weapon: Weapon }[] = [];
  private pageButtons = { prev: { x: 0, y: 0, w: 0, h: 0 }, next: { x: 0, y: 0, w: 0, h: 0 } };
  private weapons: Weapon[] = [];
  private lastRenderAt = 0;
  private lastWheelAt = 0;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("wheel", (e) => {
        const now = performance.now();
        if (now - this.lastRenderAt > 420) return;
        if (now - this.lastWheelAt < 120) return;
        this.lastWheelAt = now;
        this.handleWheel(e.deltaY);
        e.preventDefault();
      }, { passive: false });
    }
  }

  setSchool(school: SkillSchool | null): void {
    this.weapons = getWeaponsBySchool(school);
    this.page = 0;
  }

  handleClick(cx: number, cy: number): Weapon | null {
    if (this.inRect(cx, cy, this.pageButtons.prev)) { this.prevPage(); return null; }
    if (this.inRect(cx, cy, this.pageButtons.next)) { this.nextPage(); return null; }
    for (const r of this.cardRects) if (cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h) return r.weapon;
    return null;
  }

  handleWheel(deltaY: number): void {
    if (deltaY > 0) this.nextPage();
    if (deltaY < 0) this.prevPage();
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number, assets?: AssetLike): void {
    this.lastRenderAt = performance.now();
    this.cardRects = [];
    const totalPages = this.totalPages();
    this.page = Math.max(0, Math.min(this.page, totalPages - 1));
    const visible = this.weapons.slice(this.page * this.pageSize, this.page * this.pageSize + this.pageSize);
    const cols = 3;
    const rows = 3;
    const gridH = rows * this.cardH + (rows - 1) * this.gap;
    const sy = Math.max(86, h / 2 - gridH / 2 + 14);

    ctx.fillStyle = "#fff"; ctx.font = "bold 24px monospace"; ctx.textAlign = "center"; ctx.fillText("选择你的武器", w / 2, sy - 52);
    ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.font = "11px monospace"; ctx.fillText("每页 9 把 · 鼠标滚轮 / 点击按钮翻页 · 武器重量决定基础攻速、伤害和范围", w / 2, sy - 30);

    for (let i = 0; i < visible.length; i++) {
      const weapon = visible[i]; const row = Math.floor(i / cols); const col = i % cols; const countInRow = Math.min(cols, visible.length - row * cols); const rowW = countInRow * this.cardW + (countInRow - 1) * this.gap; const cx = (w - rowW) / 2 + col * (this.cardW + this.gap); const cy = sy + row * (this.cardH + this.gap);
      this.cardRects.push({ x: cx, y: cy, w: this.cardW, h: this.cardH, weapon });
      this.drawWeapon(ctx, cx, cy, weapon, assets?.get("weapons", weapon.id));
    }

    const by = sy + gridH + 28;
    this.drawPageButton(ctx, w / 2 - 150, by, 112, 34, "上一页", this.page > 0);
    this.drawPageButton(ctx, w / 2 + 38, by, 112, 34, "下一页", this.page < totalPages - 1);
    this.pageButtons.prev = { x: w / 2 - 150, y: by, w: 112, h: 34 };
    this.pageButtons.next = { x: w / 2 + 38, y: by, w: 112, h: 34 };
    ctx.fillStyle = "rgba(255,255,255,0.45)"; ctx.font = "12px monospace"; ctx.textAlign = "center"; ctx.fillText(`第 ${this.page + 1} / ${totalPages} 页`, w / 2, by + 23);
  }

  private drawWeapon(ctx: CanvasRenderingContext2D, x: number, y: number, weapon: Weapon, img?: HTMLImageElement | null): void {
    ctx.fillStyle = "#1a1a2e"; ctx.strokeStyle = weapon.color; ctx.lineWidth = 2; this.roundRect(ctx, x, y, this.cardW, this.cardH, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = weapon.color; ctx.font = "bold 16px monospace"; ctx.textAlign = "center"; ctx.fillText(weapon.name, x + this.cardW / 2, y + 24);
    this.drawWeaponIcon(ctx, x + this.cardW / 2, y + 58, weapon, img);
    ctx.fillStyle = "rgba(255,255,255,0.78)"; ctx.font = "11px monospace"; ctx.fillText(`${getWeaponWeightLabel(weapon)} · ${this.attackModeLabel(weapon)}`, x + this.cardW / 2, y + 96);
    ctx.fillStyle = "#777"; ctx.font = "10px monospace"; this.wrapTextCenter(ctx, weapon.theme, x + this.cardW / 2, y + 116, this.cardW - 24, 14, 2);
  }

  private drawWeaponIcon(ctx: CanvasRenderingContext2D, x: number, y: number, weapon: Weapon, img?: HTMLImageElement | null): void {
    const glow = ctx.createRadialGradient(x, y, 2, x, y, 34); glow.addColorStop(0, weapon.color + "99"); glow.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, 32, 0, Math.PI * 2); ctx.fill();
    if (img) ctx.drawImage(img, x - 22, y - 22, 44, 44); else { ctx.fillStyle = weapon.color; ctx.font = "bold 26px monospace"; ctx.textAlign = "center"; ctx.fillText(weapon.icon, x, y + 8); }
  }

  private attackModeLabel(weapon: Weapon): string {
    switch (weapon.attackMode) { case "melee_thrust": return "刺击"; case "melee_slash": return "斩击"; case "melee_slam": return "重击"; case "short_returning_blade": return "回旋"; case "orbit": return "环绕"; case "summon": return "召唤"; default: return "远程"; }
  }

  private totalPages(): number { return Math.max(1, Math.ceil(this.weapons.length / this.pageSize)); }
  private prevPage(): void { this.page = Math.max(0, this.page - 1); }
  private nextPage(): void { this.page = Math.min(this.totalPages() - 1, this.page + 1); }
  private inRect(cx: number, cy: number, r: { x: number; y: number; w: number; h: number }): boolean { return cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h; }

  private drawPageButton(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, text: string, enabled: boolean): void {
    ctx.fillStyle = enabled ? "rgba(255,213,79,0.12)" : "rgba(255,255,255,0.04)"; ctx.strokeStyle = enabled ? "#ffd54f" : "rgba(255,255,255,0.16)"; ctx.lineWidth = 1.4; this.roundRect(ctx, x, y, w, h, 10); ctx.fill(); ctx.stroke(); ctx.fillStyle = enabled ? "#ffd54f" : "rgba(255,255,255,0.28)"; ctx.font = "bold 12px monospace"; ctx.textAlign = "center"; ctx.fillText(text, x + w / 2, y + 22);
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r); ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r); ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
  }

  private wrapTextCenter(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number, maxLines = 4): void {
    const words = text.split(""); let line = ""; let ly = y; let lines = 0;
    for (let i = 0; i < words.length; i++) { const test = line + words[i]; if (ctx.measureText(test).width > maxW && line.length > 0) { ctx.fillText(line, x, ly); lines++; if (lines >= maxLines) { ctx.fillText("……", x, ly + lineH); return; } line = words[i]; ly += lineH; } else line = test; }
    ctx.fillText(line, x, ly);
  }
}
