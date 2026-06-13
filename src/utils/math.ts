// 2D 向量工具
export interface Vec2 {
  x: number;
  y: number;
}

export function vec2(x: number, y: number): Vec2 {
  return { x, y };
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s };
}

export function length(v: Vec2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function normalize(v: Vec2): Vec2 {
  const len = length(v);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export function distance(a: Vec2, b: Vec2): number {
  return length(sub(a, b));
}

export function direction(from: Vec2, to: Vec2): Vec2 {
  return normalize(sub(to, from));
}

// 随机工具
export function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function randInt(min: number, max: number): number {
  return Math.floor(randRange(min, max + 1));
}

export function randChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 碰撞：两个圆的碰撞检测
export function circleCollide(
  aPos: Vec2, aRad: number,
  bPos: Vec2, bRad: number,
): boolean {
  return distance(aPos, bPos) < aRad + bRad;
}

// 对象池：泛型对象池，避免 GC 抖动
export class Pool<T> {
  private items: T[] = [];
  private factory: () => T;
  private reset: (item: T) => void;

  constructor(factory: () => T, reset: (item: T) => void, initialSize = 50) {
    this.factory = factory;
    this.reset = reset;
    for (let i = 0; i < initialSize; i++) {
      this.items.push(factory());
    }
  }

  acquire(): T {
    if (this.items.length > 0) {
      return this.items.pop()!;
    }
    return this.factory();
  }

  release(item: T): void {
    this.reset(item);
    this.items.push(item);
  }
}
