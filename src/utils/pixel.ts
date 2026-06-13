// 像素风渲染工具：提供 blocky 绘制函数
const PX = 3; // 像素块大小

// 绘制"像素圆"——用一组方块近似圆形
export function fillPixelCircle(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, radius: number, color: string,
): void {
  const r = Math.floor(radius / PX);
  ctx.fillStyle = color;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= r * r) {
        ctx.fillRect(cx + dx * PX, cy + dy * PX, PX, PX);
      }
    }
  }
}

// 像素弓
export function drawPixelBow(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, angle: number, color: string,
): void {
  ctx.fillStyle = color;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  // 弓的弧：两组像素点
  for (let i = -3; i <= 3; i++) {
    const rx = Math.floor((cx + cos * 10 + cos * i * 2) / PX) * PX;
    const ry = Math.floor((cy + sin * 10 + sin * i * 2) / PX) * PX;
    ctx.fillRect(rx, ry, PX * 2, PX * 2);
  }
}

// 像素拖尾
export function drawPixelTail(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number, color: string,
): void {
  ctx.fillStyle = color;
  const steps = 5;
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const px = Math.floor((x1 + (x2 - x1) * t) / PX) * PX;
    const py = Math.floor((y1 + (y2 - y1) * t) / PX) * PX;
    ctx.fillRect(px, py, PX, PX);
  }
}

// 像素十字（血包）
export function drawPixelCross(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, size: number, color: string,
): void {
  ctx.fillStyle = color;
  const s = Math.floor(size / PX);
  const bx = Math.floor(cx / PX) * PX;
  const by = Math.floor(cy / PX) * PX;
  // 竖
  ctx.fillRect(bx - PX, by - s * PX, PX * 2, s * PX * 2);
  // 横
  ctx.fillRect(bx - s * PX, by - PX, s * PX * 2, PX * 2);
}
