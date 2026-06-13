import { vec2, Vec2, direction, randRange } from "../utils/math";

type EnemyType = "slime" | "spider" | "skeleton";

interface EnemyDef {
  color: string;
  strokeColor: string;
  radius: number;
  hpBase: number;
  spdBase: number;
}

const DEFS: Record<EnemyType, EnemyDef> = {
  slime:   { color: "#66bb6a", strokeColor: "#388e3c", radius: 13, hpBase: 35, spdBase: 70 },
  spider:  { color: "#8d6e63", strokeColor: "#4e342e", radius: 15, hpBase: 55, spdBase: 90 },
  skeleton:{ color: "#cfd8dc", strokeColor: "#78909c", radius: 14, hpBase: 65, spdBase: 60 },
};

const TYPES: EnemyType[] = ["slime", "spider", "skeleton"];

export class Enemy {
  pos: Vec2;
  radius: number;
  speed: number;
  hp: number;
  maxHp: number;
  damage = 10;
  alive = true;
  private type: EnemyType;
  private def: EnemyDef;
  private hitFlash = 0;
  private anim = 0;
  private slowTimer = 0;
  private slowFactor = 1;

  constructor(worldW: number, worldH: number, hpMult: number, spdMult: number) {
    const margin = 80;
    const side = Math.floor(Math.random() * 4);
    switch (side) {
      case 0: this.pos = vec2(randRange(margin, worldW - margin), margin); break;
      case 1: this.pos = vec2(worldW - margin, randRange(margin, worldH - margin)); break;
      case 2: this.pos = vec2(randRange(margin, worldW - margin), worldH - margin); break;
      default: this.pos = vec2(margin, randRange(margin, worldH - margin)); break;
    }

    this.type = TYPES[Math.floor(Math.random() * TYPES.length)];
    this.def = DEFS[this.type];
    this.radius = this.def.radius;
    this.hp = Math.floor(this.def.hpBase * hpMult);
    this.maxHp = this.hp;
    this.speed = randRange(this.def.spdBase * 0.8, this.def.spdBase * 1.2) * spdMult;
  }

  update(dt: number, playerPos: Vec2): void {
    if (!this.alive) return;

    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) this.slowFactor = 1;
    }

    const d = direction(this.pos, playerPos);
    this.pos.x += d.x * this.speed * this.slowFactor * dt;
    this.pos.y += d.y * this.speed * this.slowFactor * dt;
    this.anim += dt * 5;
    if (this.hitFlash > 0) this.hitFlash -= dt;
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

  renderAt(ctx: CanvasRenderingContext2D, sx: number, sy: number): void {
    const def = this.def;
    const slowed = this.slowTimer > 0;
    const fill = this.hitFlash > 0 ? "#fff" : slowed ? "#90caf9" : def.color;

    if (slowed) {
      ctx.strokeStyle = "rgba(144,202,249,0.55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, this.radius + 6 + Math.sin(this.anim) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 身体
    ctx.fillStyle = fill;
    ctx.strokeStyle = def.strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();

    switch (this.type) {
      case "slime":
        // 歪圆
        this.ellipse(ctx, sx, sy, this.radius, this.radius * 0.8 + Math.sin(this.anim) * 2);
        break;
      case "spider":
        // 六边形
        this.polygon(ctx, sx, sy, this.radius, 6);
        break;
      case "skeleton":
        // 菱形
        this.polygon(ctx, sx, sy, this.radius, 4);
        break;
    }
    ctx.fill();
    ctx.stroke();

    // 类型标志
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    const label = this.type === "slime" ? "●" : this.type === "spider" ? "✶" : "✚";
    ctx.fillText(label, sx, sy + 4);

    // 血条
    if (this.hp < this.maxHp) {
      const bw = 24, bh = 3, py = sy - this.radius - 6, pct = Math.max(0, this.hp / this.maxHp);
      ctx.fillStyle = "#222";
      ctx.fillRect(sx - bw / 2, py, bw, bh);
      ctx.fillStyle = "#ef5350";
      ctx.fillRect(sx - bw / 2, py, bw * pct, bh);
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
