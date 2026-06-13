import { vec2, Vec2, direction, randRange, distance } from "../utils/math";

export type EnemyRole = "basic" | "fast" | "tank" | "ranged" | "elite" | "boss";
type EnemyType = "slime" | "spider" | "skeleton";

interface EnemyDef {
  color: string;
  strokeColor: string;
  radius: number;
  hpBase: number;
  spdBase: number;
  label: string;
}

const DEFS: Record<EnemyType, EnemyDef> = {
  slime:    { color: "#66bb6a", strokeColor: "#388e3c", radius: 15, hpBase: 42, spdBase: 82, label: "●" },
  spider:   { color: "#8d6e63", strokeColor: "#4e342e", radius: 17, hpBase: 64, spdBase: 104, label: "✶" },
  skeleton: { color: "#cfd8dc", strokeColor: "#78909c", radius: 16, hpBase: 76, spdBase: 72, label: "✚" },
};

const TYPES: EnemyType[] = ["slime", "spider", "skeleton"];

const ROLE_LABEL: Record<EnemyRole, string> = {
  basic: "",
  fast: "迅",
  tank: "厚",
  ranged: "射",
  elite: "精",
  boss: "王",
};

export class Enemy {
  pos: Vec2;
  radius: number;
  speed: number;
  hp: number;
  maxHp: number;
  damage = 12;
  alive = true;
  role: EnemyRole;
  private type: EnemyType;
  private def: EnemyDef;
  private hitFlash = 0;
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

    switch (role) {
      case "fast": radiusMod = 0.82; hpMod = 0.7; spdRoleMod = 1.95; dmgMod = 0.9; break;
      case "tank": radiusMod = 1.42; hpMod = 2.65; spdRoleMod = 0.68; dmgMod = 1.38; break;
      case "ranged": radiusMod = 1.02; hpMod = 1.05; spdRoleMod = 0.9; dmgMod = 1.05; break;
      case "elite": radiusMod = 1.55; hpMod = 3.8; spdRoleMod = 1.22; dmgMod = 1.9; break;
      case "boss": radiusMod = 2.55; hpMod = 15; spdRoleMod = 0.78; dmgMod = 2.75; break;
    }

    this.radius = Math.floor(this.def.radius * radiusMod);
    this.hp = Math.floor(this.def.hpBase * hpMult * hpMod);
    this.maxHp = this.hp;
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

    if (this.role === "ranged" || this.role === "boss") {
      const desired = this.role === "boss" ? 300 : 255;
      if (dist < desired * 0.65) {
        this.pos.x -= d.x * speed * 0.92 * dt;
        this.pos.y -= d.y * speed * 0.92 * dt;
      } else if (dist > desired * 1.22) {
        this.pos.x += d.x * speed * dt;
        this.pos.y += d.y * speed * dt;
      } else {
        this.pos.x += sideX * speed * (this.role === "boss" ? 0.58 : 0.68) * dt;
        this.pos.y += sideY * speed * (this.role === "boss" ? 0.58 : 0.68) * dt;
      }
    } else if (this.role === "fast" || this.role === "elite") {
      // 快怪/精英不再只会直冲，会绕侧施压，形成简单围杀。
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

  takeDamage(dmg: number): boolean {
    this.hp -= dmg;
    this.hitFlash = 0.08;
    if (this.hp <= 0) { this.alive = false; return true; }
    return false;
  }

  get rewardMultiplier(): number {
    switch (this.role) {
      case "fast": return 1.15;
      case "tank": return 1.65;
      case "ranged": return 1.5;
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

    ctx.fillStyle = "rgba(0,0,0,0.52)";
    ctx.font = `${this.role === "boss" ? 14 : 10}px monospace`;
    ctx.textAlign = "center";
    const roleText = ROLE_LABEL[this.role];
    if (roleText) ctx.fillText(roleText, sx, sy + 4);

    if (this.hp < this.maxHp || this.role === "elite" || this.role === "boss") {
      const bw = this.role === "boss" ? 70 : this.role === "elite" ? 42 : 24;
      const bh = this.role === "boss" ? 6 : 3;
      const py = sy - this.radius - 10;
      const pct = Math.max(0, this.hp / this.maxHp);
      ctx.fillStyle = "#222";
      ctx.fillRect(sx - bw / 2, py, bw, bh);
      ctx.fillStyle = this.role === "boss" ? "#ffd54f" : "#ef5350";
      ctx.fillRect(sx - bw / 2, py, bw * pct, bh);
    }
  }

  private roleColor(base: string): string {
    switch (this.role) {
      case "fast": return "#ffee58";
      case "tank": return "#78909c";
      case "ranged": return "#42a5f5";
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
