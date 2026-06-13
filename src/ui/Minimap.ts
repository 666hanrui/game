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

export class Minimap {
  private seenEnemies = new WeakSet<object>();
  private spawnWarnings: SpawnWarning[] = [];
  private lastRenderAt = 0;

  render(ctx: CanvasRenderingContext2D, data: MinimapData): void {
    this.updateSpawnWarnings(data);
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

    // 当前屏幕视野框
    const viewLeft = data.cameraPos.x - data.screenW / 2;
    const viewTop = data.cameraPos.y - data.screenH / 2;
    ctx.strokeStyle = "rgba(255,255,255,0.42)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + viewLeft * sx, y + viewTop * sy, data.screenW * sx, data.screenH * sy);

    // 掉落物
    for (const p of data.pickups.slice(0, 80)) {
      const px = x + p.pos.x * sx;
      const py = y + p.pos.y * sy;
      ctx.fillStyle = p.type === "health" ? "#66bb6a" : "#42a5f5";
      ctx.globalAlpha = 0.78;
      ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
    }

    // 敌人
    ctx.globalAlpha = 0.95;
    for (const e of data.enemies.slice(0, 140)) {
      const px = x + e.pos.x * sx;
      const py = y + e.pos.y * sy;
      const boss = e.role === "boss";
      const elite = e.role === "elite";
      ctx.fillStyle = boss ? "#ffeb3b" : elite ? "#ef5350" : "#ff8a65";
      ctx.beginPath();
      ctx.arc(px, py, boss ? 3.4 : elite ? 2.7 : 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 玩家
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
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText("MAP", x + 10, y + 18);

    ctx.restore();
  }

  renderBoundaryWarning(ctx: CanvasRenderingContext2D, playerPos: Vec2, worldW: number, worldH: number): void {
    const margin = 180;
    const parts: string[] = [];
    if (playerPos.x < margin) parts.push("左侧边界");
    if (worldW - playerPos.x < margin) parts.push("右侧边界");
    if (playerPos.y < margin) parts.push("上方边界");
    if (worldH - playerPos.y < margin) parts.push("下方边界");
    if (parts.length <= 0) return;

    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "bold 13px monospace";
    ctx.fillStyle = "rgba(0,0,0,0.42)";
    ctx.fillRect(ctx.canvas.width / 2 - 150, 138, 300, 30);
    ctx.strokeStyle = "rgba(255,183,77,0.65)";
    ctx.strokeRect(ctx.canvas.width / 2 - 150, 138, 300, 30);
    ctx.fillStyle = "#ffb74d";
    ctx.fillText(`接近${parts.join(" / ")}`, ctx.canvas.width / 2, 158);
    ctx.restore();
  }

  private updateSpawnWarnings(data: MinimapData): void {
    const now = performance.now() / 1000;
    const dt = this.lastRenderAt <= 0 ? 0.016 : Math.min(0.08, now - this.lastRenderAt);
    this.lastRenderAt = now;

    for (const warning of this.spawnWarnings) warning.life -= dt;
    this.spawnWarnings = this.spawnWarnings.filter((warning) => warning.life > 0);

    const newcomers: MinimapEnemy[] = [];
    for (const enemy of data.enemies) {
      const key = enemy as object;
      if (this.seenEnemies.has(key)) continue;
      this.seenEnemies.add(key);
      newcomers.push(enemy);
    }

    if (newcomers.length <= 0) return;

    let avgX = 0;
    let avgY = 0;
    let role: "normal" | "elite" | "boss" = "normal";
    for (const enemy of newcomers) {
      avgX += enemy.pos.x - data.playerPos.x;
      avgY += enemy.pos.y - data.playerPos.y;
      if (enemy.role === "boss") role = "boss";
      else if (enemy.role === "elite" && role !== "boss") role = "elite";
    }

    avgX /= newcomers.length;
    avgY /= newcomers.length;

    const angle = Math.atan2(avgY, avgX || 0.001);
    const label = this.directionLabel(avgX, avgY);
    const maxLife = role === "boss" ? 2.7 : role === "elite" ? 2.1 : 1.55;
    this.spawnWarnings.push({
      angle,
      label,
      count: newcomers.length,
      role,
      life: maxLife,
      maxLife,
    });

    if (this.spawnWarnings.length > 4) this.spawnWarnings = this.spawnWarnings.slice(-4);
  }

  private renderSpawnWarnings(ctx: CanvasRenderingContext2D): void {
    if (this.spawnWarnings.length <= 0) return;

    ctx.save();

    for (let i = 0; i < this.spawnWarnings.length; i++) {
      const warning = this.spawnWarnings[i];
      const alpha = Math.max(0, Math.min(1, warning.life / Math.min(warning.maxLife, 0.65)));
      const edge = this.clampToScreenEdge(
        ctx.canvas.width / 2 + Math.cos(warning.angle) * 9999,
        ctx.canvas.height / 2 + Math.sin(warning.angle) * 9999,
        ctx.canvas.width,
        ctx.canvas.height,
        64 + i * 18,
      );

      const color = warning.role === "boss" ? "#ffeb3b" : warning.role === "elite" ? "#ef5350" : "#ffb74d";
      const title = warning.role === "boss" ? "Boss 波来袭" : warning.role === "elite" ? "精英敌潮出现" : "敌潮出现";
      const pulse = warning.role === "boss" || warning.life > warning.maxLife - 0.55;

      this.drawThreatArrow(ctx, edge.x, edge.y, warning.angle, warning.role === "boss" ? 24 : 18, color, alpha, pulse);

      ctx.globalAlpha = alpha;
      ctx.textAlign = "center";
      ctx.font = "bold 12px monospace";
      const text = `${title} · ${warning.label} ×${warning.count}`;
      const boxW = Math.min(250, Math.max(142, text.length * 12));
      const tx = Math.max(boxW / 2 + 12, Math.min(ctx.canvas.width - boxW / 2 - 12, edge.x));
      const ty = Math.max(78, Math.min(ctx.canvas.height - 78, edge.y + (edge.y < ctx.canvas.height / 2 ? 34 : -30)));

      ctx.fillStyle = "rgba(0,0,0,0.56)";
      ctx.fillRect(tx - boxW / 2, ty - 14, boxW, 24);
      ctx.strokeStyle = warning.role === "boss" ? "rgba(255,235,59,0.72)" : "rgba(255,183,77,0.55)";
      ctx.strokeRect(tx - boxW / 2, ty - 14, boxW, 24);
      ctx.fillStyle = color;
      ctx.fillText(text, tx, ty + 3);
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  private directionLabel(dx: number, dy: number): string {
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);

    if (ax > ay * 1.45) return dx >= 0 ? "右侧" : "左侧";
    if (ay > ax * 1.45) return dy >= 0 ? "下方" : "上方";

    const vertical = dy >= 0 ? "下" : "上";
    const horizontal = dx >= 0 ? "右" : "左";
    return `${vertical}${horizontal}`;
  }

  private renderOffscreenThreats(ctx: CanvasRenderingContext2D, data: MinimapData): void {
    const margin = 38;
    const left = data.cameraPos.x - data.screenW / 2;
    const top = data.cameraPos.y - data.screenH / 2;
    const right = left + data.screenW;
    const bottom = top + data.screenH;
    const threats: OffscreenThreat[] = [];

    for (const enemy of data.enemies) {
      const ex = enemy.pos.x;
      const ey = enemy.pos.y;
      const offscreen = ex < left || ex > right || ey < top || ey > bottom;
      if (!offscreen) continue;

      const dx = ex - data.playerPos.x;
      const dy = ey - data.playerPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const isSpecial = enemy.role === "boss" || enemy.role === "elite";
      if (!isSpecial && dist > 980) continue;

      const screenX = ex - data.cameraPos.x + data.screenW / 2;
      const screenY = ey - data.cameraPos.y + data.screenH / 2;
      threats.push({ enemy, dist, angle: Math.atan2(dy, dx), screenX, screenY });
    }

    threats.sort((a, b) => {
      const aw = this.threatWeight(a);
      const bw = this.threatWeight(b);
      if (aw !== bw) return bw - aw;
      return a.dist - b.dist;
    });

    const visible = threats.slice(0, 8);
    if (visible.length <= 0) return;

    ctx.save();

    const nearCount = threats.filter((t) => t.dist < 520 || t.enemy.role === "boss").length;
    if (nearCount >= 4) {
      ctx.strokeStyle = "rgba(239,83,80,0.24)";
      ctx.lineWidth = 6;
      ctx.strokeRect(5, 5, ctx.canvas.width - 10, ctx.canvas.height - 10);
    }

    for (const t of visible) {
      const pos = this.clampToScreenEdge(t.screenX, t.screenY, ctx.canvas.width, ctx.canvas.height, margin);
      const color = t.enemy.role === "boss" ? "#ffeb3b" : t.enemy.role === "elite" ? "#ef5350" : "#ff8a65";
      const size = t.enemy.role === "boss" ? 18 : t.enemy.role === "elite" ? 15 : 12;
      const alpha = Math.max(0.45, 1 - Math.min(t.dist, 900) / 1200);
      this.drawThreatArrow(ctx, pos.x, pos.y, t.angle, size, color, alpha, t.enemy.role === "boss");
    }

    const bossThreat = visible.find((t) => t.enemy.role === "boss");
    if (bossThreat) {
      ctx.textAlign = "center";
      ctx.font = "bold 12px monospace";
      ctx.fillStyle = "rgba(0,0,0,0.48)";
      ctx.fillRect(ctx.canvas.width / 2 - 88, 104, 176, 24);
      ctx.fillStyle = "#ffeb3b";
      ctx.fillText("Boss 在屏幕外", ctx.canvas.width / 2, 121);
    }

    ctx.restore();
  }

  private threatWeight(t: OffscreenThreat): number {
    if (t.enemy.role === "boss") return 10000;
    if (t.enemy.role === "elite") return 6000;
    return 1000 - Math.min(999, t.dist);
  }

  private clampToScreenEdge(x: number, y: number, w: number, h: number, margin: number): Vec2 {
    const cx = w / 2;
    const cy = h / 2;
    const dx = x - cx;
    const dy = y - cy;
    const scaleX = dx === 0 ? Infinity : (dx > 0 ? (w - margin - cx) / dx : (margin - cx) / dx);
    const scaleY = dy === 0 ? Infinity : (dy > 0 ? (h - margin - cy) / dy : (margin - cy) / dy);
    const scale = Math.max(0, Math.min(scaleX, scaleY));
    return {
      x: Math.max(margin, Math.min(w - margin, cx + dx * scale)),
      y: Math.max(margin, Math.min(h - margin, cy + dy * scale)),
    };
  }

  private drawThreatArrow(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, size: number, color: string, alpha: number, pulse: boolean): void {
    const pulseSize = pulse ? Math.sin(performance.now() / 120) * 2.4 : 0;
    const s = size + pulseSize;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalAlpha = alpha;

    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.beginPath();
    ctx.arc(0, 0, s + 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(s, 0);
    ctx.lineTo(-s * 0.72, -s * 0.58);
    ctx.lineTo(-s * 0.38, 0);
    ctx.lineTo(-s * 0.72, s * 0.58);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
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
