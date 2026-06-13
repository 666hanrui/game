import { Skill, SkillRarity, SkillSchool, ALL_SKILLS } from "../data/skills";
import { getSchool } from "../data/schools";
import { getWeapon } from "../data/weapons";

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

type ModKey = keyof Skill["mods"];

const RARITY_RANK: Record<SkillRarity, number> = {
  common: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
  diamond: 4,
};

const RARITY_MULT: Record<SkillRarity, number> = {
  common: 1,
  rare: 1.45,
  epic: 2.1,
  legendary: 3.25,
  diamond: 5.5,
};

const DIAMOND_PITY_THRESHOLD = 8;

export class LuckyUpgradePanel {
  cards: Skill[] = [];
  selected: Skill | null = null;

  private cardW = 206;
  private cardH = 286;
  private gap = 18;
  private cardRects: { x: number; y: number; w: number; h: number; skill: Skill }[] = [];
  private refreshRect = { x: 0, y: 0, w: 140, h: 38 };
  private ownedIds: string[] = [];
  private playerSchool: SkillSchool | null = null;
  private weaponId: string | null = null;
  private refreshesLeft = 1;
  private upgradesSinceDiamond = 0;

  generateChoices(playerSchool: SkillSchool | null, ownedIds: string[], weaponId: string | null = null): Skill[] {
    this.playerSchool = playerSchool;
    this.weaponId = weaponId;
    this.ownedIds = [...ownedIds];
    this.refreshesLeft = 1;
    this.rollChoices();
    return this.cards;
  }

  recordChosen(skill: Skill): void {
    if (skill.rarity === "diamond") this.upgradesSinceDiamond = 0;
    else this.upgradesSinceDiamond = Math.min(DIAMOND_PITY_THRESHOLD, this.upgradesSinceDiamond + 1);
  }

  handleClick(canvasX: number, canvasY: number): Skill | null {
    if (this.inRect(canvasX, canvasY, this.refreshRect)) {
      if (this.refreshesLeft > 0) {
        this.refreshesLeft--;
        this.rollChoices();
      }
      return null;
    }

    for (const rect of this.cardRects) {
      if (this.inRect(canvasX, canvasY, rect)) {
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
    const idealY = h / 2 - this.cardH / 2 + 12;
    const startY = Math.max(124, Math.min(idealY, h - this.cardH - 104));

    ctx.fillStyle = "#ffeb3b";
    ctx.font = "bold 22px monospace";
    ctx.textAlign = "center";
    ctx.fillText("⬆ 升级！选择一项强化", w / 2, startY - 74);

    ctx.fillStyle = "rgba(255,255,255,0.38)";
    ctx.font = "11px monospace";
    ctx.fillText("强化会随机出现不同稀有度：普通 / 稀有 / 史诗 / 传说 / 钻石", w / 2, startY - 52);

    this.drawLuckyHeat(ctx, w / 2, startY - 27);

    for (let i = 0; i < this.cards.length; i++) {
      const skill = this.cards[i];
      const cx = startX + i * (this.cardW + this.gap);
      const cy = startY;
      const meta = this.getSkillMeta(skill);
      const level = this.ownedIds.filter((id) => id === skill.id).length;
      const levelText = skill.maxLevel === 1 ? "唯一" : `Lv.${level + 1}/${skill.maxLevel}`;
      const sprite = assets?.get(meta.assetGroup ?? "", meta.assetId);
      const color = this.getRarityColor(skill.rarity);
      const label = this.getRarityLabel(skill.rarity);
      const isDiamond = skill.rarity === "diamond";

      this.cardRects.push({ x: cx, y: cy, w: this.cardW, h: this.cardH, skill });

      const glow = this.getRarityGlow(skill.rarity);
      ctx.fillStyle = glow;
      this.roundRect(ctx, cx - 5, cy - 5, this.cardW + 10, this.cardH + 10, 14);
      ctx.fill();

      if (isDiamond) this.drawDiamondHalo(ctx, cx, cy, this.cardW, this.cardH);

      ctx.fillStyle = isDiamond ? "#101c2a" : "#151525";
      ctx.strokeStyle = color;
      ctx.lineWidth = isDiamond ? 4.5 : skill.rarity === "legendary" ? 3 : 2;
      this.roundRect(ctx, cx, cy, this.cardW, this.cardH, 12);
      ctx.fill();
      ctx.stroke();

      if (isDiamond) this.drawDiamondFrame(ctx, cx, cy, this.cardW, this.cardH);

      ctx.fillStyle = color;
      ctx.fillRect(cx, cy, this.cardW, isDiamond ? 8 : 6);

      ctx.fillStyle = meta.color;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(meta.icon + " " + meta.name, cx + 12, cy + 28);

      ctx.textAlign = "right";
      ctx.fillStyle = isDiamond ? "#e1f5fe" : "rgba(255,255,255,0.58)";
      ctx.fillText(levelText, cx + this.cardW - 12, cy + 28);

      this.drawIconBubble(ctx, cx + this.cardW / 2, cy + 68, 45, meta.color, sprite, meta.icon, skill.rarity);

      ctx.fillStyle = "#fff";
      ctx.font = isDiamond ? "bold 17px monospace" : "bold 16px monospace";
      ctx.textAlign = "center";
      ctx.fillText(skill.name, cx + this.cardW / 2, cy + 112);

      ctx.fillStyle = color;
      ctx.font = "bold 12px monospace";
      ctx.fillText(`${label} · x${RARITY_MULT[skill.rarity].toFixed(skill.rarity === "common" ? 0 : 2)}`, cx + this.cardW / 2, cy + 134);

      const dividerY = isDiamond ? cy + 166 : cy + 148;
      if (isDiamond) {
        this.drawDiamondBadge(ctx, cx + this.cardW / 2, cy + 150);
      }

      ctx.strokeStyle = isDiamond ? "rgba(179,229,252,0.34)" : "rgba(255,255,255,0.14)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + 12, dividerY);
      ctx.lineTo(cx + this.cardW - 12, dividerY);
      ctx.stroke();

      ctx.fillStyle = isDiamond ? "#dff7ff" : "#aaa";
      ctx.font = isDiamond ? "11px monospace" : "12px monospace";
      ctx.textAlign = "left";
      this.wrapText(ctx, skill.description, cx + 12, isDiamond ? cy + 185 : cy + 170, this.cardW - 24, isDiamond ? 16 : 17);

      ctx.fillStyle = isDiamond ? "rgba(179,229,252,0.85)" : "#555";
      ctx.font = "bold 20px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${i + 1}`, cx + this.cardW / 2, cy + this.cardH + 24);
    }

    this.refreshRect = { x: w / 2 - 70, y: startY + this.cardH + 42, w: 140, h: 38 };
    this.drawRefreshButton(ctx);

    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    ctx.fillText("点击选择  ·  键盘 1/2/3 快速选择", w / 2, startY + this.cardH + 96);
  }

  private rollChoices(): void {
    const available = ALL_SKILLS.filter((s: Skill) => {
      const ownedCount = this.ownedIds.filter((id) => id === s.id).length;
      return ownedCount < s.maxLevel;
    });

    const weaponPool = available.filter((s: Skill) => s.school === this.playerSchool && s.weapon === this.weaponId);
    const schoolPool = available.filter((s: Skill) => s.school === this.playerSchool && !s.weapon);
    const neutralPool = available.filter((s: Skill) => s.school === "neutral");
    const otherPool = available.filter((s: Skill) => s.school !== this.playerSchool && s.school !== "neutral");

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

      if (roll < 0.74) pick = pickFrom(weaponPool);
      if (!pick && roll < 0.86) pick = pickFrom(schoolPool);
      if (!pick && roll < 0.96) pick = pickFrom(neutralPool);
      if (!pick) pick = pickFrom(otherPool);
      if (!pick) pick = pickFrom(available);

      if (pick) {
        const lucky = this.applyLuckyRarity(pick);
        result.push(lucky);
        picked.add(pick.id);
      }
    }

    if (result.length > 0 && this.upgradesSinceDiamond >= DIAMOND_PITY_THRESHOLD && !result.some((s) => s.rarity === "diamond")) {
      const index = this.bestDiamondCandidateIndex(result);
      result[index] = this.applySpecificRarity(result[index], "diamond");
    }

    this.cards = result;
    this.selected = null;
  }

  private bestDiamondCandidateIndex(result: Skill[]): number {
    const weaponIndex = result.findIndex((s) => s.weapon === this.weaponId);
    if (weaponIndex >= 0) return weaponIndex;
    const schoolIndex = result.findIndex((s) => s.school === this.playerSchool);
    if (schoolIndex >= 0) return schoolIndex;
    return 0;
  }

  private applyLuckyRarity(base: Skill): Skill {
    return this.applySpecificRarity(base, this.rollRarity(base.rarity));
  }

  private applySpecificRarity(base: Skill, rolled: SkillRarity): Skill {
    const rarity = RARITY_RANK[rolled] < RARITY_RANK[base.rarity] ? base.rarity : rolled;
    const mult = RARITY_MULT[rarity];
    const mods: Skill["mods"] = {};

    for (const key of Object.keys(base.mods) as ModKey[]) {
      const value = base.mods[key];
      if (typeof value !== "number") continue;
      const scaled = value * mult;
      if (key === "critChance" || key === "critMultiplier" || key === "lifesteal") {
        mods[key] = Number(scaled.toFixed(3));
      } else if (key === "attackCooldown") {
        mods[key] = Number(scaled.toFixed(3));
      } else {
        mods[key] = Math.max(1, Math.round(scaled));
      }
    }

    const label = this.getRarityLabel(rarity);
    const diamondText = rarity === "diamond" ? "｜钻石质变：会启动当前路线的超载效果" : "";
    return {
      ...base,
      rarity,
      name: rarity === base.rarity && rarity !== "diamond" ? base.name : `${label}·${base.name}`,
      description: `${base.description}｜本次为${label}强化，数值倍率 x${mult.toFixed(rarity === "common" ? 0 : 2)}${diamondText}`,
      mods,
    };
  }

  private rollRarity(minRarity: SkillRarity): SkillRarity {
    const heat = Math.min(DIAMOND_PITY_THRESHOLD, this.upgradesSinceDiamond);
    const diamondChance = Math.min(0.16, 0.01 + heat * 0.015);
    const legendaryChance = Math.min(0.22, diamondChance + 0.05 + heat * 0.005);
    const epicChance = Math.min(0.38, legendaryChance + 0.12 + heat * 0.006);
    const rareChance = Math.min(0.62, epicChance + 0.27);

    const r = Math.random();
    let rarity: SkillRarity = "common";
    if (r < diamondChance) rarity = "diamond";
    else if (r < legendaryChance) rarity = "legendary";
    else if (r < epicChance) rarity = "epic";
    else if (r < rareChance) rarity = "rare";

    return RARITY_RANK[rarity] < RARITY_RANK[minRarity] ? minRarity : rarity;
  }

  private drawRefreshButton(ctx: CanvasRenderingContext2D): void {
    const r = this.refreshRect;
    const active = this.refreshesLeft > 0;
    ctx.fillStyle = active ? "rgba(66,165,245,0.12)" : "rgba(255,255,255,0.05)";
    ctx.strokeStyle = active ? "#42a5f5" : "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = active ? "#90caf9" : "rgba(255,255,255,0.32)";
    ctx.font = "bold 13px monospace";
    ctx.fillText(active ? `刷新强化 ×${this.refreshesLeft}` : "刷新已用完", r.x + r.w / 2, r.y + 24);
  }

  private drawLuckyHeat(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const full = this.upgradesSinceDiamond >= DIAMOND_PITY_THRESHOLD;
    const heat = Math.min(DIAMOND_PITY_THRESHOLD, this.upgradesSinceDiamond);
    const pct = heat / DIAMOND_PITY_THRESHOLD;
    const w = full ? 392 : 360;
    const h = 22;

    ctx.save();
    ctx.fillStyle = full ? "rgba(128,222,234,0.16)" : "rgba(128,222,234,0.08)";
    ctx.strokeStyle = full ? "#b3e5fc" : "rgba(128,222,234,0.45)";
    ctx.lineWidth = full ? 2 : 1;
    this.roundRect(ctx, x - w / 2, y - h / 2, w, h, 11);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    this.roundRect(ctx, x - w / 2 + 9, y + 3, w - 18, 4, 2);
    ctx.fill();
    ctx.fillStyle = full ? "#e1f5fe" : "#80deea";
    this.roundRect(ctx, x - w / 2 + 9, y + 3, (w - 18) * pct, 4, 2);
    ctx.fill();

    ctx.textAlign = "center";
    ctx.font = "bold 11px monospace";
    ctx.fillStyle = full ? "#e1f5fe" : "rgba(179,229,252,0.82)";
    ctx.fillText(full ? "幸运热度已满 · 本次必出钻石候选" : `幸运热度 ${heat}/${DIAMOND_PITY_THRESHOLD} · 连续未选钻石会提高概率`, x, y - 3);
    ctx.restore();
  }

  private drawDiamondHalo(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    ctx.save();
    const glow = ctx.createLinearGradient(x, y, x + w, y + h);
    glow.addColorStop(0, "rgba(255,255,255,0.32)");
    glow.addColorStop(0.42, "rgba(128,222,234,0.22)");
    glow.addColorStop(1, "rgba(66,165,245,0.18)");
    ctx.fillStyle = glow;
    this.roundRect(ctx, x - 10, y - 10, w + 20, h + 20, 18);
    ctx.fill();
    ctx.restore();
  }

  private drawDiamondFrame(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.lineWidth = 1.2;
    this.roundRect(ctx, x + 5, y + 5, w - 10, h - 10, 9);
    ctx.stroke();

    ctx.strokeStyle = "rgba(179,229,252,0.82)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 18, y + 18);
    ctx.lineTo(x + 48, y + 6);
    ctx.moveTo(x + w - 18, y + h - 18);
    ctx.lineTo(x + w - 48, y + h - 6);
    ctx.moveTo(x + w - 18, y + 18);
    ctx.lineTo(x + w - 48, y + 6);
    ctx.moveTo(x + 18, y + h - 18);
    ctx.lineTo(x + 48, y + h - 6);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.78)";
    for (const p of [
      [x + 27, y + 38],
      [x + w - 34, y + 58],
      [x + 35, y + h - 44],
      [x + w - 38, y + h - 60],
    ]) {
      ctx.beginPath();
      ctx.arc(p[0], p[1], 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawDiamondBadge(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const w = 166;
    const h = 20;
    ctx.save();
    const grad = ctx.createLinearGradient(x - w / 2, y, x + w / 2, y);
    grad.addColorStop(0, "rgba(179,229,252,0.18)");
    grad.addColorStop(0.5, "rgba(255,255,255,0.22)");
    grad.addColorStop(1, "rgba(128,222,234,0.18)");
    ctx.fillStyle = grad;
    ctx.strokeStyle = "#b3e5fc";
    ctx.lineWidth = 1.4;
    this.roundRect(ctx, x - w / 2, y - h / 2, w, h, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#e1f5fe";
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.fillText("◇ 钻石质变 · 路线超载", x, y + 4);
    ctx.restore();
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

  private getRarityLabel(rarity: SkillRarity): string {
    switch (rarity) {
      case "diamond": return "钻石";
      case "legendary": return "传说";
      case "epic": return "史诗";
      case "rare": return "稀有";
      default: return "普通";
    }
  }

  private getRarityColor(rarity: SkillRarity): string {
    switch (rarity) {
      case "diamond": return "#b3e5fc";
      case "legendary": return "#ffca28";
      case "epic": return "#ce93d8";
      case "rare": return "#42a5f5";
      default: return "#81c784";
    }
  }

  private getRarityGlow(rarity: SkillRarity): string {
    switch (rarity) {
      case "diamond": return "rgba(179,229,252,0.32)";
      case "legendary": return "rgba(255,202,40,0.18)";
      case "epic": return "rgba(206,147,216,0.14)";
      case "rare": return "rgba(66,165,245,0.1)";
      default: return "rgba(255,255,255,0.035)";
    }
  }

  private drawIconBubble(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, img: HTMLImageElement | null | undefined, fallback: string, rarity: SkillRarity): void {
    const rarityColor = this.getRarityColor(rarity);
    const glow = ctx.createRadialGradient(x, y, 2, x, y, size * 1.05);
    glow.addColorStop(0, rarityColor + "cc");
    glow.addColorStop(0.45, color + "66");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.72, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.07)";
    ctx.strokeStyle = rarityColor;
    ctx.lineWidth = rarity === "diamond" ? 2.8 : 1.5;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.47, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (rarity === "diamond") {
      ctx.strokeStyle = "rgba(255,255,255,0.76)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y - size * 0.63);
      ctx.lineTo(x + size * 0.16, y - size * 0.47);
      ctx.lineTo(x, y - size * 0.31);
      ctx.lineTo(x - size * 0.16, y - size * 0.47);
      ctx.closePath();
      ctx.stroke();
    }

    if (img) {
      ctx.drawImage(img, x - size * 0.32, y - size * 0.32, size * 0.64, size * 0.64);
    } else {
      ctx.fillStyle = color;
      ctx.font = "bold 24px monospace";
      ctx.textAlign = "center";
      ctx.fillText(fallback, x, y + 8);
    }
  }

  private inRect(cx: number, cy: number, r: { x: number; y: number; w: number; h: number }): boolean {
    return cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h;
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
