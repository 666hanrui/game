import type { Enemy } from "../entities/Enemy";
import type { Projectile } from "../entities/Projectile";
import type { Vec2 } from "../utils/math";
import { SpatialHashGrid } from "./SpatialHashGrid";

interface GameLike {
  w: number;
  h: number;
  gameTime: number;
  player: { pos: Vec2 };
  camera: { pos: Vec2 };
  enemies: Enemy[];
  projectiles: Projectile[];
}

type PrivateGame = GameLike & Record<string, unknown>;

export class CombatPerformanceRuntime {
  private readonly enemyGrid = new SpatialHashGrid<Enemy>(180);
  private patched = false;
  private readonly maxEnemyProjectiles = 150;
  private readonly maxShockwaves = 38;
  private readonly farMargin = 620;

  beforeGameUpdate(game: GameLike): void {
    this.enemyGrid.rebuild(game.enemies);
    this.installPatches(game as PrivateGame);
  }

  afterGameUpdate(game: GameLike): void {
    this.trimProjectiles(game);
  }

  private installPatches(game: PrivateGame): void {
    if (this.patched) return;
    this.patched = true;

    const self = this;
    game.__perfOriginalFindNearestEnemy = game.findNearestEnemy;
    game.findNearestEnemy = function patchedFindNearestEnemy(x: number, y: number, maxDist: number): Enemy | null {
      return self.findNearestFromGrid({ x, y }, maxDist);
    };

    game.__perfOriginalUpdateTrackingArrows = game.updateTrackingArrows;
    game.updateTrackingArrows = function patchedUpdateTrackingArrows(dt: number): void {
      self.updateTrackingArrows(this as PrivateGame, dt);
    };
  }

  private updateTrackingArrows(game: PrivateGame, dt: number): void {
    const hasSkill = game.hasSkill as ((id: string) => boolean) | undefined;
    if (!hasSkill?.call(game, "tracking")) return;

    const activeSynergies = game.activeSynergies as (() => Set<string>) | undefined;
    const skillCount = game.skillCount as ((id: string) => number) | undefined;
    const synergies = activeSynergies?.call(game) ?? new Set<string>();
    const guided = synergies.has("tech_tracking_arrow");
    const trackingLevel = skillCount?.call(game, "tracking") ?? 1;
    const interval = guided ? 0.055 : 0.095;
    const now = game.gameTime;

    this.enemyGrid.rebuild(game.enemies);

    for (const p of game.projectiles) {
      if (!p.alive || p.fromEnemy || p.kind !== "arrow") continue;
      let target = this.enemyByIndex(game, p.cachedTargetIndex);
      if (!target || p.nextTrackAt <= now) {
        target = this.findNearestFromGrid(p.pos, guided ? 640 : 420);
        p.cachedTargetIndex = target ? game.enemies.indexOf(target) : -1;
        p.nextTrackAt = now + interval + Math.random() * 0.025;
      }
      if (!target) continue;

      const dx = target.pos.x - p.pos.x;
      const dy = target.pos.y - p.pos.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const speed = Math.sqrt(p.vel.x * p.vel.x + p.vel.y * p.vel.y) || 600;
      const blend = Math.min(1, dt * (guided ? 8 + trackingLevel * 1.6 : 4.4 + trackingLevel * 1.15));
      p.vel.x += ((dx / len) * speed - p.vel.x) * blend;
      p.vel.y += ((dy / len) * speed - p.vel.y) * blend;
    }
  }

  private findNearestFromGrid(pos: Vec2, maxDist: number): Enemy | null {
    const candidates = this.enemyGrid.queryCircle(pos, maxDist);
    let bestSq = maxDist * maxDist;
    let best: Enemy | null = null;
    for (const enemy of candidates) {
      if (!enemy.alive) continue;
      const dx = enemy.pos.x - pos.x;
      const dy = enemy.pos.y - pos.y;
      const d = dx * dx + dy * dy;
      if (d < bestSq) { bestSq = d; best = enemy; }
    }
    return best;
  }

  private enemyByIndex(game: GameLike, index: number): Enemy | null {
    if (index < 0) return null;
    const enemy = game.enemies[index];
    return enemy?.alive ? enemy : null;
  }

  private trimProjectiles(game: GameLike): void {
    const enemyProjectiles: Projectile[] = [];
    const shockwaves: Projectile[] = [];
    const farLimit = Math.max(game.w, game.h) * 0.62 + this.farMargin;
    const cx = game.camera.pos.x;
    const cy = game.camera.pos.y;

    for (const p of game.projectiles) {
      if (!p.alive) continue;
      const dx = p.pos.x - cx;
      const dy = p.pos.y - cy;
      if (dx * dx + dy * dy > farLimit * farLimit) {
        p.alive = false;
        continue;
      }
      if (p.fromEnemy) enemyProjectiles.push(p);
      if (p.kind === "shockwave") shockwaves.push(p);
    }

    this.keepNearest(game.player.pos, enemyProjectiles, this.maxEnemyProjectiles);
    this.keepNearest(game.player.pos, shockwaves, this.maxShockwaves);
    if (game.projectiles.length > 520) this.keepNearest(game.player.pos, game.projectiles.filter((p) => p.alive), 520);
  }

  private keepNearest(origin: Vec2, items: Projectile[], maxCount: number): void {
    if (items.length <= maxCount) return;
    items.sort((a, b) => this.distSq(a.pos, origin) - this.distSq(b.pos, origin));
    for (let i = maxCount; i < items.length; i++) items[i].alive = false;
  }

  private distSq(a: Vec2, b: Vec2): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
  }
}
