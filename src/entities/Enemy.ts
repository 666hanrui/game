import { vec2, Vec2, direction, randRange, distance } from "../utils/math";

export type EnemyRole = "basic" | "fast" | "tank" | "ranged" | "bomber" | "summoner" | "healer" | "elite" | "boss";
type EnemyType = "slime" | "spider" | "skeleton";

interface EnemyDef {
  color: string;
  strokeColor: string;
  radius: number;
  hpBase: number;
  spdBase: number;
  armorBase: number;
  label: string;
}

const DEFS: Record<EnemyType, EnemyDef> = {
  slime:    { color: "#66bb6a", strokeColor: "#388e3c", radius: 15, hpBase: 42, spdBase: 82, armorBase: 1, label: "●" },
  spider:   { color: "#8d6e63", strokeColor: "#4e342e", radius: 17, hpBase: 64, spdBase: 104, armorBase: 2, label: "✶" },
  skeleton: { color: "#cfd8dc", strokeColor: "#78909c", radius: 16, hpBase: 76, spdBase: 72, armorBase: 4, label: "✚" },
};

const TYPES: EnemyType[] = ["slime", "spider", "skeleton"];

const ROLE_LABEL: Record<EnemyRole, string> = {
  basic: "",
  fast: "迅",
  tank: "厚",
  ranged: "射",
  bomber: "爆",
  summoner: "召",
  healer: "疗",
  elite: "精",
  boss: "王",
};

export class Enemy {
  pos: Vec2;
  radius: number;
  speed: number;
  hp: number;
  maxHp: number;
  armor = 0;
  maxArmor = 0;
  damage = 12;
  alive = true;
  role: EnemyRole;
  private type: EnemyType;
  private def: EnemyDef;
  private hitFlash = 0;
  private armorFlash = 0;
  private healFlash = 0;
  private anim = 0;
  private slowTimer = 0;
  private slowFactor = 1;
  private shootTimer = 0;
  private strafeSign = Math.random() < 0.5 ? -1 : 1;
  private aggression = randRange(0.85, 1.18);

  constructor(worldW: number, worldH: number, hpMult: number, spdMult: number, role: EnemyRole = "basic") {
    const margin = 80;
    const side = Math.floor(Math.random() * 4);
    switch (side) {
      case 0: this.pos = vec2(randRange(margin, worldW - margin), margin); break;
      case 1: this.pos = vec2(worldW - margin, randRange(margin, worldH - margin)); break;
      case 2: this.pos = vec2(randRange(margin, worldW - margin), worldH - margin); break;
      default: this.pos = vec2(margin, randRange(margin, worldH - margin)); break;
    }

    this.role = role;
    this.type = TYPES[Math.floor(Math.random() * TYPES.length)];
    this.def = DEFS[this.type];

    let radiusMod = 1;
    let hpMod = 1;
    let spdRoleMod = 1;
    let dmgMod = 1;
    let armorMod = 1;

    switch (role) {
      case "fast": radiusMod = 0.82; hpMod = 0.7; spdRoleMod = 1.95; dmgMod = 0.9; armorMod = 0.35; break;
      case "tank": radiusMod = 1.42; hpMod = 2.65; spdRoleMod = 0.68; dmgMod = 1.38; armorMod = 3.6; break;
      case "ranged": radiusMod = 1.02; hpMod = 1.05; spdRoleMod = 0.9; dmgMod = 1.05; armorMod = 0.8; break;
      case "bomber": radiusMod = 0.95; hpMod = 0.8; spdRoleMod = 1.58; dmgMod = 1.95; armorMod = 0.55; break;
      case "summoner": radiusMod = 1.12; hpMod = 1.7; spdRoleMod = 0.74; dmgMod = 0.8; armorMod = 1.2; break;
      case "healer": radiusMod = 1.02; hpMod = 1.35; spdRoleMod = 0.82; dmgMod = 0.7; armorMod = 0.85; break;
      case "elite": radiusMod = 1.55; hpMod = 3.8; spdRoleMod = 1.22; dmgMod = 1.9; armorMod = 2.8; break;
      case "boss": radiusMod = 2.55; hpMod = 15; spdRoleMod = 0.78; dmgMod = 2.75; armorMod = 5.5; break;
    }

    this.radius = Math.floor(this.def.radius * radiusMod);
    this.hp = Math.floor(this.def.hpBase * hpMult * hpMod);
    this.maxHp = this.hp;
    this.maxArmor = Math.floor((this.def.armorBase + Math.sqrt(Math.max(1, hpMult)) * 2) * armorMod);
    this.armor = this.maxArmor;
    this.speed = randRange(this.def.spdBase * 0.86, this.def.spdBase * 1.24) * spdMult * spdRoleMod;
    this.damage = Math.floor(this.damage * dmgMod);
    this.shootTimer = randRange(0.35, 1.25);
  }

  get assetId(): string {
    return this.type;
  }

  update(dt: number, playerPos: Vec2): void {
    if (!this.alive) return;

    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) this.slowFactor = 1;
    }

    const d = direction(this.pos, playerPos);
    const dist = distance(this.pos, playerPos);
    const sideX = -d.y * this.strafeSign;
    const sideY = d.x * this.strafeSign;
    const speed = this.speed * this.slowFactor * this.aggression;

    if (this.role === "ranged" || this.role === "boss" || this.role === "summoner" || this.role === "healer") {
      const desired = this.role === "boss" ? 300 : this.role === "summoner" ? 285 : this.role === "healer" ? 235 : 255;
      if (dist < desired * 0.65) {
        this.pos.x -= d.x * speed * 0.92 * dt;
        this.pos.y -= d.y * speed * 0.92 * dt;
      } else if (dist > desired * 1.22) {
        this.pos.x += d.x * speed * dt;
        this.pos.y += d.y * speed * dt;
      } else {
        const strafe = this.role === "boss" ? 0.58 : this.role === "summoner" ? 0.52 : 0.68;
        this.pos.x += sideX * speed * strafe * dt;
        this.pos.y += sideY * speed * strafe * dt;
      }
    } else if (this.role === "bomber") {
      const approach = dist > 64 ? 1.16 : 0.42;
      const strafe = dist > 110 ? 0.32 : 0.08;
      this.pos.x += (d.x * speed * approach + sideX * speed * strafe) * dt;
      this.pos.y += (d.y * speed * approach + sideY * speed * strafe) * dt;
    } else if (this.role === "fast" || this.role === "elite") {
      const approach = dist > 105 ? 0.82 : 0.28;
      const strafe = this.role === "elite" ? 0.72 : 0.95;
      this.pos.x += (d.x * speed * approach + sideX * speed * strafe) * dt;
      this.pos.y += (d.y * speed * approach + sideY * speed * strafe) * dt;
    } else if (this.role === "tank") {
      this.pos.x += d.x * speed * 0.86 * dt;
      this.pos.y += d.y * speed * 0.86 * dt;
    } else {
      const strafe = dist < 160 ? 0.22 : 0.06;
      this.pos.x += (d.x * speed + sideX * speed * strafe) * dt;
      this.pos.y += (d.y * speed + sideY * speed * strafe) * dt;
    }

    this.anim += dt * 5;
    if (this.hitFlash > 0) this.hitFlash -= dt;
    if (this.armorFlash > 0) this.armorFlash -= dt;
    if (this.healFlash > 0) this.healFlash -= dt;
    if (this.role === "ranged" || this.role === "boss") this.shootTimer -= dt;
  }

  canShoot(): boolean {
    if (!this.alive) return false;
    if (this.role !== "ranged" && this.role !== "boss") return false;
    if (this.shootTimer > 0) return false;
    this.shootTimer = this.role === "boss" ? 0.58 : 1.12;
    return true;
  }

  applySlow(factor: number, duration: number): void {
    this.slowFactor = Math.min(this.slowFactor, factor);
    this.slowTimer = Math.max(this.slowTimer, duration);
  }

  heal(amount: number): number {
    if (!this.alive || this.hp >= this.maxHp) return 0;
    const before = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + Math.max(0, Math.floor(amount)));
    this.healFlash = 0.22;
    return this.hp - before;
  }

  breakArmor(amount: number): number {
    const before = this.armor;
    this.armor = Math.max(0, this.armor - Math.max(0, Math.floor(amount)));
    if (this.armor < before) this.armorFlash = 0.18;
    return before - this.armor;
  }

  takeDamage(dmg: number, armorPierce = 0): boolean {
    const mitigation = Math.max(0, this.armor - armorPierce);
    const effective = Math.max(1, Math.floor(dmg - mitigation));
    this.hp -= effective;
    this.hitFlash = 0.08;
    if (this.hp <= 0) { this.alive = false; return true; }
    return false;
  }

  get rewardMultiplier(): number {
    switch (this.role) {
      case "fast": return 1.15;
      case "tank": return 1.65;
      case "ranged": return 1.5;
      case "bomber": return 1.45;
      case "summoner": return 2.25;
      case "healer": return 1.9;
      case "elite": return 3.6;
      case "boss": return 12;
      default: return 1;
    }
  }

  renderAt(ctx: CanvasRenderingContext2D, sx: number, sy: number, sprite?: HTMLImageElement | null): void {
    const def = this.def;
    const slowed = this.slowTimer > 0;

    if (this.role === "elite" || this.role === "boss") {
      ctx.strokeStyle = this.role === "boss" ? "rgba(255,213,79,0.75)" : "rgba(239,83,80,0.6)";
      ctx.lineWidth = this.role === "boss" ? 4 : 3;
      ctx.beginPath();
      ctx.arc(sx, sy, this.radius + 9 + Math.sin(this.anim) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (this.role === "bomber") {
      ctx.strokeStyle = `rgba(255,87,34,${0.46 + Math.sin(this.anim * 2.4) * 0.22})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(sx, sy, this.radius + 9 + Math.sin(this.anim * 1.9) * 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (this.role === "summoner") {
      ctx.strokeStyle = "rgba(171,71,188,0.46)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, this.radius + 11, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (this.role === "healer") {
      ctx.strokeStyle = "rgba(102,187,106,0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, this.radius + 10 + Math.sin(this.anim * 1.4) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (this.healFlash > 0) {
      ctx.strokeStyle = "rgba(129,199,132,0.9)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sx, sy, this.radius + 8 + Math.sin(this.anim) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (this.armor > 0) {
      ctx.strokeStyle = this.armorFlash > 0 ? "rgba(255,255,255,0.95)" : "rgba(144,164,174,0.45)";
      ctx.lineWidth = this.armorFlash > 0 ? 3 : 2;
      ctx.beginPath();
      ctx.arc(sx, sy, this.radius + 4, -Math.PI * 0.7, Math.PI * 0.7);
      ctx.stroke();
    }

    if (slowed) {
      ctx.strokeStyle = "rgba(144,202,249,0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, this.radius + 6 + Math.sin(this.anim) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (sprite) {
      const size = this.radius * 2.45;
      ctx.save();
      if (this.hitFlash > 0) ctx.globalAlpha = 0.65;
      ctx.drawImage(sprite, sx - size / 2, sy - size / 2, size, size);
      ctx.restore();
    } else {
      const fill = this.hitFlash > 0 ? "#fff" : slowed ? "#90caf9" : this.roleColor(def.color);
      ctx.fillStyle = fill;
      ctx.strokeStyle = def.strokeColor;
      ctx.lineWidth = this.role === "boss" ? 3 : 2;
      ctx.beginPath();
      switch (this.type) {
        case "slime": this.ellipse(ctx, sx, sy, this.radius, this.radius * 0.8 + Math.sin(this.anim) * 2); break;
        case "spider": this.polygon(ctx, sx, sy, this.radius, 6); break;
        case "skeleton": this.polygon(ctx, sx, sy, this.radius, 4); break;
      }
      ctx.fill();
      ctx.stroke();
    }

    this.renderRoleMarker(ctx, sx, sy);

    ctx.fillStyle = "rgba(0,0,0,0.52)";
    ctx.font = `${this.role === "boss" ? 14 : 10}px monospace`;
    ctx.textAlign = "center";
    const roleText = ROLE_LABEL[this.role];
    if (roleText) ctx.fillText(roleText, sx, sy + 4);

    if (this.hp < this.maxHp || this.role === "elite" || this.role === "boss" || this.role === "summoner" || this.role === "healer") {
      const bw = this.role === "boss" ? 70 : this.role === "elite" ? 42 : this.role === "summoner" ? 38 : 24;
      const bh = this.role === "boss" ? 6 : 3;
      const py = sy - this.radius - 10;
      const pct = Math.max(0, this.hp / this.maxHp);
      ctx.fillStyle = "#222";
      ctx.fillRect(sx - bw / 2, py, bw, bh);
      ctx.fillStyle = this.role === "boss" ? "#ffd54f" : this.role === "healer" ? "#66bb6a" : this.role === "summoner" ? "#ab47bc" : "#ef5350";
      ctx.fillRect(sx - bw / 2, py, bw * pct, bh);

      if (this.maxArmor > 0 && this.armor > 0) {
        const armorPct = Math.max(0, this.armor / this.maxArmor);
        ctx.fillStyle = "rgba(69,90,100,0.95)";
        ctx.fillRect(sx - bw / 2, py + bh + 2, bw, 2);
        ctx.fillStyle = "#b0bec5";
        ctx.fillRect(sx - bw / 2, py + bh + 2, bw * armorPct, 2);
      }
    }
  }

  private renderRoleMarker(ctx: CanvasRenderingContext2D, sx: number, sy: number): void {
    if (this.role === "basic") return;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (this.role === "fast") {
      ctx.strokeStyle = "rgba(255,238,88,0.95)";
      ctx.lineWidth = 3;
      const r = this.radius + 5;
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(sx + dir * r, sy - 10);
        ctx.lineTo(sx + dir * (r + 10), sy);
        ctx.lineTo(sx + dir * r, sy + 10);
        ctx.stroke();
      }
    } else if (this.role === "tank") {
      ctx.strokeStyle = "rgba(207,216,220,0.9)";
      ctx.lineWidth = 4;
      const r = this.radius + 6;
      ctx.strokeRect(sx - r, sy - r, r * 2, r * 2);
      ctx.beginPath();
      ctx.moveTo(sx - r, sy);
      ctx.lineTo(sx + r, sy);
      ctx.moveTo(sx, sy - r);
      ctx.lineTo(sx, sy + r);
      ctx.stroke();
    } else if (this.role === "ranged") {
      ctx.strokeStyle = "rgba(144,202,249,0.95)";
      ctx.lineWidth = 3;
      const r = this.radius + 7;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.moveTo(sx - r - 5, sy);
      ctx.lineTo(sx - r + 7, sy);
      ctx.moveTo(sx + r - 7, sy);
      ctx.lineTo(sx + r + 5, sy);
      ctx.moveTo(sx, sy - r - 5);
      ctx.lineTo(sx, sy - r + 7);
      ctx.moveTo(sx, sy + r - 7);
      ctx.lineTo(sx, sy + r + 5);
      ctx.stroke();
    } else if (this.role === "bomber") {
      ctx.strokeStyle = "rgba(255,87,34,0.98)";
      ctx.fillStyle = "rgba(255,87,34,0.32)";
      ctx.lineWidth = 4;
      const r = this.radius + 9;
      ctx.beginPath();
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + this.anim * 0.16;
        const rr = i % 2 === 0 ? r + 7 : r - 3;
        const x = sx + Math.cos(a) * rr;
        const y = sy + Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = "rgba(255,235,59,0.9)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx + r * 0.15, sy - r - 8);
      ctx.quadraticCurveTo(sx + r * 0.72, sy - r - 22, sx + r * 0.9, sy - r - 3);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,235,59,0.9)";
      ctx.beginPath();
      ctx.arc(sx + r * 0.92, sy - r - 2, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.role === "summoner") {
      ctx.strokeStyle = "rgba(171,71,188,0.98)";
      ctx.fillStyle = "rgba(171,71,188,0.18)";
      ctx.lineWidth = 3;
      const r = this.radius + 10;
      ctx.beginPath();
      ctx.arc(sx, sy, r, this.anim * 0.22, this.anim * 0.22 + Math.PI * 1.35);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sx, sy, r + 7, -this.anim * 0.18, -this.anim * 0.18 + Math.PI * 1.1);
      ctx.stroke();

      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * 2 / 5) * Math.PI * 2;
        const x = sx + Math.cos(a) * (r - 2);
        const y = sy + Math.sin(a) * (r - 2);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "rgba(225,190,231,0.95)";
      for (let i = 0; i < 5; i++) {
        const a = this.anim * 0.18 + (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(sx + Math.cos(a) * (r + 7), sy + Math.sin(a) * (r + 7), 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (this.role === "healer") {
      ctx.strokeStyle = "rgba(102,187,106,0.98)";
      ctx.fillStyle = "rgba(102,187,106,0.18)";
      ctx.lineWidth = 4;
      const r = this.radius + 8;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(sx - r * 0.58, sy);
      ctx.lineTo(sx + r * 0.58, sy);
      ctx.moveTo(sx, sy - r * 0.58);
      ctx.lineTo(sx, sy + r * 0.58);
      ctx.stroke();

      ctx.strokeStyle = "rgba(200,230,201,0.85)";
      ctx.lineWidth = 2;
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(sx + dir * (r + 3), sy - r * 0.65, 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (this.role === "elite") {
      ctx.strokeStyle = "rgba(239,83,80,0.95)";
      ctx.fillStyle = "rgba(239,83,80,0.35)";
      ctx.lineWidth = 3;
      const r = this.radius + 10;
      ctx.beginPath();
      ctx.moveTo(sx, sy - r - 7);
      ctx.lineTo(sx + 8, sy - r + 5);
      ctx.lineTo(sx, sy - r + 1);
      ctx.lineTo(sx - 8, sy - r + 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx - r - 6, sy);
      ctx.lineTo(sx - r + 7, sy - 8);
      ctx.lineTo(sx - r + 3, sy);
      ctx.lineTo(sx - r + 7, sy + 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx + r + 6, sy);
      ctx.lineTo(sx + r - 7, sy - 8);
      ctx.lineTo(sx + r - 3, sy);
      ctx.lineTo(sx + r - 7, sy + 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (this.role === "boss") {
      ctx.strokeStyle = "rgba(255,213,79,0.98)";
      ctx.fillStyle = "rgba(255,213,79,0.22)";
      ctx.lineWidth = 5;
      const r = this.radius + 14;
      ctx.beginPath();
      ctx.moveTo(sx - r, sy - r * 0.68);
      ctx.lineTo(sx - r * 0.55, sy - r * 1.05);
      ctx.lineTo(sx, sy - r * 0.72);
      ctx.lineTo(sx + r * 0.55, sy - r * 1.05);
      ctx.lineTo(sx + r, sy - r * 0.68);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  private roleColor(base: string): string {
    switch (this.role) {
      case "fast": return "#ffee58";
      case "tank": return "#78909c";
      case "ranged": return "#42a5f5";
      case "bomber": return "#ff5722";
      case "summoner": return "#ab47bc";
      case "healer": return "#66bb6a";
      case "elite": return "#ef5350";
      case "boss": return "#ff8f00";
      default: return base;
    }
  }

  private ellipse(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number): void {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, ry / rx);
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.restore();
  }

  private polygon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, sides: number): void {
    ctx.moveTo(cx + r, cy);
    for (let i = 1; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2;
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.closePath();
  }
}
