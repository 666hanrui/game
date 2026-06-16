import type { Vec2 } from "../utils/math";

export interface SpatialItemLike {
  pos: Vec2;
  radius: number;
  alive?: boolean;
}

export class SpatialHashGrid<T extends SpatialItemLike> {
  private readonly cellSize: number;
  private cells = new Map<string, T[]>();

  constructor(cellSize = 160) {
    this.cellSize = cellSize;
  }

  clear(): void {
    this.cells.clear();
  }

  rebuild(items: T[]): void {
    this.clear();
    for (const item of items) this.insert(item);
  }

  insert(item: T): void {
    if (item.alive === false) return;
    const minX = Math.floor((item.pos.x - item.radius) / this.cellSize);
    const maxX = Math.floor((item.pos.x + item.radius) / this.cellSize);
    const minY = Math.floor((item.pos.y - item.radius) / this.cellSize);
    const maxY = Math.floor((item.pos.y + item.radius) / this.cellSize);
    for (let cy = minY; cy <= maxY; cy++) {
      for (let cx = minX; cx <= maxX; cx++) {
        const key = this.key(cx, cy);
        let bucket = this.cells.get(key);
        if (!bucket) {
          bucket = [];
          this.cells.set(key, bucket);
        }
        bucket.push(item);
      }
    }
  }

  queryCircle(pos: Vec2, radius: number): T[] {
    const result: T[] = [];
    const seen = new Set<T>();
    const minX = Math.floor((pos.x - radius) / this.cellSize);
    const maxX = Math.floor((pos.x + radius) / this.cellSize);
    const minY = Math.floor((pos.y - radius) / this.cellSize);
    const maxY = Math.floor((pos.y + radius) / this.cellSize);
    for (let cy = minY; cy <= maxY; cy++) {
      for (let cx = minX; cx <= maxX; cx++) {
        const bucket = this.cells.get(this.key(cx, cy));
        if (!bucket) continue;
        for (const item of bucket) {
          if (seen.has(item)) continue;
          seen.add(item);
          if (item.alive !== false) result.push(item);
        }
      }
    }
    return result;
  }

  private key(x: number, y: number): string {
    return `${x},${y}`;
  }
}
