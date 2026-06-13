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

  generateChoices(playerSchool: SkillSchool | null, ownedIds: string[], weaponId: string | null = null): Skill[] {
    this.playerSchool = playerSchool;
    this.weaponId = weaponId;
    this.ownedIds = [...ownedIds];
    this.refreshesLeft = 1;
    this.rollChoices();
    return this.cards;
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
    const startY = h / 2 - this.cardH / 2;

    ctx.fillStyle = "#ffeb3b";
    ctx.font = "bold 22px monospace";
    ctx.textAlign = "center";
    ctx.fillText("⬆ 升级！选择一项强化", w / 2, startY - 42);

    ctx.fillStyle = "rgba(255,255,255,0.38)";
    ctx.font = "11px monospace";
    ctx.fillText("强化会随机出现不同稀有度：普通 / 稀有 / 史诗 / 传说 / 钻石", w / 2, startY - 20);

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

      this.cardRects.push({ x: cx, y: cy, w: this.cardW, h: this.cardH, skill });

      const glow = this.getRarityGlow(skill.rarity);
      ctx.fillStyle = glow;
      this.roundRect(ctx, cx - 5, cy - 5, this.cardW + 10, this.cardH + 10, 14);
      ctx.fill();

      ctx.fillStyle = "#151525";
      ctx.strokeStyle = color;
      ctx.lineWidth = skill.rarity === "diamond" ? 4 : skill.rarity === "legendary" ? 3 : 2;
      this.roundRect(ctx, cx, cy, this.cardW, this.cardH, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.fillRect(cx, cy, this.cardW, 6);

      ctx.fillStyle = meta.color;
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(meta.icon + " " + meta.name, cx + 12, cy + 28);

      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(255,255,255,0.58)";
      ctx.fillText(levelText, cx + this.cardW - 12, cy + 28);

      this.drawIconBubble(ctx, cx + this.cardW / 2, cy + 68, 45, meta.color, sprite, meta.icon, skill.rarity);

      ctx.fillStyle = "#fff";
      ctx.font = skill.rarity === "diamond" ? "bold 17px monospace" : "bold 16px monospace";
      ctx.textAlign = "center";
      ctx.fillText(skill.name, cx + this.cardW / 2, cy + 112);

      ctx.fillStyle = color;
      ctx.font = "bold 12px monospace";
      ctx.fillText(`${label} · x${RARITY_MULT[skill.rarity].toFixed(skill.rarity === "common" ? 0 : 2)}`, cx + this.cardW / 2, cy + 134);

      ctx.strokeStyle = "rgba(255,255,255,0.14)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + 12, cy + 148);
      ctx.lineTo(cx + this.cardW - 12, cy + 148);
      ctx.stroke();

      ctx.fillStyle = "#aaa";
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      this.wrapText(ctx, skill.description, cx + 12, cy + 170, this.cardW - 24, 17);

      ctx.fillStyle = "#555";
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

    this.cards = result;
    this.selected = null;
  }

  private applyLuckyRarity(base: Skill): Skill {
    const rolled = this.rollRarity(base.rarity);
    const mult = RARITY_MULT[rolled];
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

    const label = this.getRarityLabel(rolled);
    return {
      ...base,
      rarity: rolled,
      name: rolled === base.rarity && rolled !== "diamond" ? base.name : `${label}·${base.name}`,
      description: `${base.description}｜本次为${label}强化，数值倍率 x${mult.toFixed(rolled === "common" ? 0 : 2)}`,
      mods,
    };
  }

  private rollRarity(minRarity: SkillRarity): SkillRarity {
    const r = Math.random();
    let rarity: SkillRarity = "common";
    if (r < 0.01) rarity = "diamond";
    else if (r < 0.06) rarity = "legendary";
    else if (r < 0.18) rarity = "epic";
    else if (r < 0.45) rarity = "rare";

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
      case "diamond": return "#80deea";
      case "legendary": return "#ffca28";
      case "epic": return "#ce93d8";
      case "rare": return "#42a5f5";
      default: return "#81c784";
    }
  }

  private getRarityGlow(rarity: SkillRarity): string {
    switch (rarity) {
      case "diamond": return "rgba(128,222,234,0.22)";
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
    ctx.lineWidth = rarity === "diamond" ? 2.4 : 1.5;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.47, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

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
