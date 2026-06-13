import { vec2, Vec2 } from "../utils/math";

// 相机：跟随玩家，世界坐标 → 屏幕坐标
export class Camera {
  pos: Vec2 = vec2(0, 0);
  private target: Vec2 = vec2(0, 0);
  private smoothFactor = 0.1; // 平滑跟随

  // 世界大小
  worldW: number;
  worldH: number;

  constructor(worldW: number, worldH: number) {
    this.worldW = worldW;
    this.worldH = worldH;
  }

  follow(targetX: number, targetY: number): void {
    this.target.x = targetX;
    this.target.y = targetY;
  }

  update(): void {
    this.pos.x += (this.target.x - this.pos.x) * this.smoothFactor;
    this.pos.y += (this.target.y - this.pos.y) * this.smoothFactor;
  }

  // 世界坐标 → 屏幕坐标
  worldToScreen(wx: number, wy: number, screenW: number, screenH: number): Vec2 {
    return vec2(
      wx - this.pos.x + screenW / 2,
      wy - this.pos.y + screenH / 2,
    );
  }
}
