import type { Vec2 } from "../utils/math";

export interface MinimapEnemy {
  pos: Vec2;
  role?: string;
}

export interface MinimapPickup {
  pos: Vec2;
  type: string;
}

export interface MinimapData {
  worldW: number;
  worldH: number;
  screenW: number;
  screenH: number;
  cameraPos: Vec2;
  playerPos: Vec2;
  enemies: MinimapEnemy[];
  pickups: MinimapPickup[];
}

interface OffscreenThreat {
  enemy: MinimapEnemy;
  dist: number;
  angle: number;
  screenX: number;
  screenY: number;
}

interface SpawnWarning {
  angle: number;
  label: string;
  count: number;
  role: "normal" | "elite" | "boss";
  life: number;
  maxLife: number;
}

interface ScreenImpact {
  color: string;
  strength: number;
  life: number;
  maxLife: number;
  label: string;
}

export class Minimap {
  private seenEnemies = new WeakSet<object>();
  private spawnWarnings: SpawnWarning[] = [];
  private lastRenderAt = 0;
  private previousEnemyCount = -1;
  private impact: ScreenImpact | null = null;

  render(ctx: CanvasRenderingContext2D, data: MinimapData): void {
    const dt = this.updateSpawnWarnings(data);
    this.updateCombatImpact(data, dt);
    this.renderScreenImpact(ctx);
    this.renderOffscreenThreats(ctx, data);
    this.renderSpawnWarnings(ctx);

    const size = 154;
    const pad = 16;
    const x = ctx.canvas.width - size - pad;
    const y = ctx.canvas.height - size - pad;
    const sx = size / data.worldW;
    const sy = size / data.worldH;

    ctx.save();

    ctx.fillStyle = "rgba(0,0,0,0.44)";
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    this.roundRect(ctx, x, y, size, size, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fillRect(x + 8, y + 8, size - 16, size - 16);

    const viewLeft = data.cameraPos.x - data.screenW / 2;
    const viewTop = data.cameraPos.y - data.screenH / 2;
    ctx.strokeStyle = "rgba(255,255,255,0.42)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + viewLeft * sx, y + viewTop * sy, data.screenW * sx, data.screenH * sy);

    for (const p of data.pickups.slice(0, 80)) {
      const px = x + p.pos.x * sx;
      const py = y + p.pos.y * sy;
      ctx.fillStyle = p.type === "health" ? "#66bb6a" : "#42a5f5";
      ctx.globalAlpha = 0.78;
      ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
    }

    ctx.globalAlpha = 0.95;
    for (const e of data.enemies.slice(0, 140)) {
      const px = x + e.pos.x * sx;
      const py = y + e.pos.y * sy;
      const boss = e.role === "boss";
      const elite = e.role === "elite";
      const support = e.role === "healer" || e.role === "summoner";
      const bomber = e.role === "bomber";
      ctx.fillStyle = boss ? "#ffeb3b" : elite ? "#ef5350" : support ? "#81c784" : bomber ? "#ff7043" : "#ff8a65";
      ctx.beginPath();
      ctx.arc(px, py, boss ? 3.4 : elite || support ? 2.7 : bomber ? 2.4 : 2, 0, Math.PI * 2);
      ctx.fill();
    }

    const playerX = x + data.playerPos.x * sx;
    const playerY = y + data.playerPos.y * sy;
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#4fc3f7";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(playerX, playerY, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.font = "10px monospace";
    ctx.fillStyle = "rgba(255,255,255,0.48)";
    ctx.fillText("小地图", x + 10, y + size - 10);

    ctx.restore();
  }

  private updateSpawnWarnings(data: MinimapData): number {
    const now = performance.now() / 1000;
    const dt = this.lastRenderAt > 0 ? Math.min(0.1, now - this.lastRenderAt) : 0.016;
    this.lastRenderAt = now;

    for (const warning of this.spawnWarnings) warning.life -= dt;
    this.spawnWarnings = this.spawnWarnings.filter((w) => w.life > 0);

    let newEnemies = 0;
    const buckets = new Map<string, { angle: number; count: number; role: "normal" | "elite" | "boss" }>();
    for (const enemy of data.enemies) {
      if (this.seenEnemies.has(enemy as object)) continue;
      this.seenEnemies.add(enemy as object);
      newEnemies++;

      const dx = enemy.pos.x - data.playerPos.x;
      const dy = enemy.pos.y - data.playerPos.y;
      const angle = Math.atan2(dy, dx);
      const bucket = Math.round(angle / (Math.PI / 6));
      const role = enemy.role === "boss" ? "boss" : enemy.role === "elite" ? "elite" : "normal";
      const key = `${bucket}-${role}`;
      const item = buckets.get(key) ?? { angle, count: 0, role };
      item.count++;
      buckets.set(key, item);
    }

    if (this.previousEnemyCount >= 0 && newEnemies >= 3) {
      for (const item of buckets.values()) {
        this.spawnWarnings.push({
          angle: item.angle,
          label: item.role === "boss" ? "BOSS" : item.role === "elite" ? "精英" : "敌群",
          count: item.count,
          role: item.role,
          life: item.role === "boss" ? 2.5 : 1.45,
          maxLife: item.role === "boss" ? 2.5 : 1.45,
        });
      }
    }
    this.previousEnemyCount = data.enemies.length;

    return dt;
  }

  private updateCombatImpact(data: MinimapData, dt: number): void {
    if (this.impact) {
      this.impact.life -= dt;
      if (this.impact.life <= 0) this.impact = null;
    }

    const bossNear = data.enemies.some((e) => e.role === "boss" && this.dist(e.pos, data.playerPos) < 520);
    const eliteNear = data.enemies.some((e) => e.role === "elite" && this.dist(e.pos, data.playerPos) < 360);
    const supportNear = data.enemies.some((e) => (e.role === "healer" || e.role === "summoner") && this.dist(e.pos, data.playerPos) < 430);
    const bomberNear = data.enemies.some((e) => e.role === "bomber" && this.dist(e.pos, data.playerPos) < 260);

    if (bossNear) this.impact = { color: "#ffd54f", strength: 1, life: 0.18, maxLife: 0.18, label: "BOSS 压迫" };
    else if (bomberNear) this.impact = { color: "#ff7043", strength: 0.72, life: 0.16, maxLife: 0.16, label: "爆炸怪靠近" };
    else if (supportNear) this.impact = { color: "#81c784", strength: 0.48, life: 0.16, maxLife: 0.16, label: "支援怪出现" };
    else if (eliteNear) this.impact = { color: "#ef5350", strength: 0.55, life: 0.16, maxLife: 0.16, label: "精英接近" };
  }

  private renderScreenImpact(ctx: CanvasRenderingContext2D): void {
    if (!this.impact) return;
    const pct = Math.max(0, this.impact.life / this.impact.maxLife);
    ctx.save();
    ctx.globalAlpha = pct * 0.12 * this.impact.strength;
    ctx.strokeStyle = this.impact.color;
    ctx.lineWidth = 18;
    ctx.strokeRect(9, 9, ctx.canvas.width - 18, ctx.canvas.height - 18);
    ctx.restore();
  }

  private renderOffscreenThreats(ctx: CanvasRenderingContext2D, data: MinimapData): void {
    const threats: OffscreenThreat[] = [];
    const margin = 72;
    for (const enemy of data.enemies) {
      const sx = enemy.pos.x - data.cameraPos.x + data.screenW / 2;
      const sy = enemy.pos.y - data.cameraPos.y + data.screenH / 2;
      const off = sx < -30 || sx > data.screenW + 30 || sy < -30 || sy > data.screenH + 30;
      if (!off) continue;
      const d = this.dist(enemy.pos, data.playerPos);
      if (enemy.role !== "boss" && enemy.role !== "elite" && enemy.role !== "summoner" && enemy.role !== "healer" && d > 780) continue;
      const angle = Math.atan2(enemy.pos.y - data.playerPos.y, enemy.pos.x - data.playerPos.x);
      const ix = this.clamp(data.screenW / 2 + Math.cos(angle) * (data.screenW / 2 - margin), margin, data.screenW - margin);
      const iy = this.clamp(data.screenH / 2 + Math.sin(angle) * (data.screenH / 2 - margin), margin, data.screenH - margin);
      threats.push({ enemy, dist: d, angle, screenX: ix, screenY: iy });
    }

    threats.sort((a, b) => {
      const scoreA = a.enemy.role === "boss" ? -10000 : a.enemy.role === "elite" ? -5000 : (a.enemy.role === "summoner" || a.enemy.role === "healer") ? -3500 : 0;
      const scoreB = b.enemy.role === "boss" ? -10000 : b.enemy.role === "elite" ? -5000 : (b.enemy.role === "summoner" || b.enemy.role === "healer") ? -3500 : 0;
      return (a.dist + scoreA) - (b.dist + scoreB);
    });

    ctx.save();
    for (const t of threats.slice(0, 6)) {
      const boss = t.enemy.role === "boss";
      const elite = t.enemy.role === "elite";
      const support = t.enemy.role === "summoner" || t.enemy.role === "healer";
      ctx.translate(t.screenX, t.screenY);
      ctx.rotate(t.angle);
      ctx.fillStyle = boss ? "#ffd54f" : elite ? "#ef5350" : support ? "#81c784" : "rgba(255,138,101,0.82)";
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(-8, -8);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-8, 8);
      ctx.closePath();
      ctx.fill();
      ctx.rotate(-t.angle);
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(boss ? "B" : elite ? "E" : support ? "S" : "!", 0, -13);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    ctx.restore();
  }

  private renderSpawnWarnings(ctx: CanvasRenderingContext2D): void {
    if (this.spawnWarnings.length <= 0) return;
    const cx = ctx.canvas.width / 2;
    const cy = ctx.canvas.height / 2;

    ctx.save();
    for (const w of this.spawnWarnings) {
      const pct = Math.max(0, w.life / w.maxLife);
      const r = Math.min(ctx.canvas.width, ctx.canvas.height) * 0.42;
      const x = cx + Math.cos(w.angle) * r;
      const y = cy + Math.sin(w.angle) * r;
      ctx.globalAlpha = pct;
      ctx.fillStyle = w.role === "boss" ? "#ffd54f" : w.role === "elite" ? "#ef5350" : "#ff8a65";
      ctx.font = `bold ${w.role === "boss" ? 16 : 12}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText(`${w.label}${w.count > 1 ? ` x${w.count}` : ""}`, x, y);
    }
    ctx.restore();
  }

  private dist(a: Vec2, b: Vec2): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
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
