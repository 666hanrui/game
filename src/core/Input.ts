import { vec2, Vec2 } from "../utils/math";

export interface InputState {
  moveDir: Vec2;
  aimDir: Vec2;
  shooting: boolean;
}

interface Stick {
  id: number;
  baseX: number;
  baseY: number;
  knobX: number;
  knobY: number;
}

export class Input {
  private keys = new Set<string>();
  private canvas: HTMLCanvasElement;

  private mouseScreenX = 0;
  private mouseScreenY = 0;
  private mouseDown = false;

  private leftStick: Stick | null = null;
  private rightStick: Stick | null = null;

  public isMobile = false;
  private readonly stickRadius = 60;

  public state: InputState = {
    moveDir: vec2(0, 0),
    aimDir: vec2(1, 0),
    shooting: false,
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.isMobile = "ontouchstart" in window || navigator.maxTouchPoints > 0;

    if (!this.isMobile) {
      this.setupKeyboard();
      this.setupMouse();
    }
    this.setupTouch();
  }

  private setupKeyboard(): void {
    window.addEventListener("keydown", (e) => this.keys.add(e.key.toLowerCase()));
    window.addEventListener("keyup", (e) => this.keys.delete(e.key.toLowerCase()));
  }

  private setupMouse(): void {
    this.canvas.addEventListener("mousemove", (e) => {
      const r = this.canvas.getBoundingClientRect();
      this.mouseScreenX = e.clientX - r.left;
      this.mouseScreenY = e.clientY - r.top;
    });
    this.canvas.addEventListener("mousedown", (e) => { if (e.button === 0) this.mouseDown = true; });
    this.canvas.addEventListener("mouseup", (e) => { if (e.button === 0) this.mouseDown = false; });
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  private cssWidth(): number {
    return this.canvas.getBoundingClientRect().width || window.innerWidth;
  }

  private cssHeight(): number {
    return this.canvas.getBoundingClientRect().height || window.innerHeight;
  }

  private toCanvasPos(t: Touch): Vec2 {
    const r = this.canvas.getBoundingClientRect();
    return vec2(t.clientX - r.left, t.clientY - r.top);
  }

  private setupTouch(): void {
    this.canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      const halfW = this.cssWidth() / 2;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const pos = this.toCanvasPos(t);
        if (this.leftStick && this.rightStick) break;
        if (pos.x < halfW && !this.leftStick) {
          this.leftStick = { id: t.identifier, baseX: pos.x, baseY: pos.y, knobX: pos.x, knobY: pos.y };
        } else if (pos.x >= halfW && !this.rightStick) {
          this.rightStick = { id: t.identifier, baseX: pos.x, baseY: pos.y, knobX: pos.x, knobY: pos.y };
        }
      }
    }, { passive: false });

    const onMove = (e: TouchEvent) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (this.leftStick && t.identifier === this.leftStick.id) {
          const pos = this.toCanvasPos(t);
          const dx = pos.x - this.leftStick.baseX;
          const dy = pos.y - this.leftStick.baseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > this.stickRadius) {
            this.leftStick.knobX = this.leftStick.baseX + (dx / dist) * this.stickRadius;
            this.leftStick.knobY = this.leftStick.baseY + (dy / dist) * this.stickRadius;
          } else {
            this.leftStick.knobX = pos.x;
            this.leftStick.knobY = pos.y;
          }
        }
        if (this.rightStick && t.identifier === this.rightStick.id) {
          const pos = this.toCanvasPos(t);
          const dx = pos.x - this.rightStick.baseX;
          const dy = pos.y - this.rightStick.baseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > this.stickRadius) {
            this.rightStick.knobX = this.rightStick.baseX + (dx / dist) * this.stickRadius;
            this.rightStick.knobY = this.rightStick.baseY + (dy / dist) * this.stickRadius;
          } else {
            this.rightStick.knobX = pos.x;
            this.rightStick.knobY = pos.y;
          }
        }
      }
    };
    this.canvas.addEventListener("touchmove", onMove, { passive: false });

    const onEnd = (e: TouchEvent) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (this.leftStick && t.identifier === this.leftStick.id) this.leftStick = null;
        if (this.rightStick && t.identifier === this.rightStick.id) this.rightStick = null;
      }
    };
    this.canvas.addEventListener("touchend", onEnd);
    this.canvas.addEventListener("touchcancel", onEnd);
  }

  update(): void {
    if (this.isMobile) {
      this.updateMobile();
    } else {
      this.updatePC();
    }
  }

  private updatePC(): void {
    let dx = 0, dy = 0;
    if (this.keys.has("w") || this.keys.has("arrowup"))    dy -= 1;
    if (this.keys.has("s") || this.keys.has("arrowdown"))  dy += 1;
    if (this.keys.has("a") || this.keys.has("arrowleft"))  dx -= 1;
    if (this.keys.has("d") || this.keys.has("arrowright")) dx += 1;

    const len = Math.sqrt(dx * dx + dy * dy);
    this.state.moveDir = len > 0 ? vec2(dx / len, dy / len) : vec2(0, 0);

    const cx = this.cssWidth() / 2;
    const cy = this.cssHeight() / 2;
    const aimDx = this.mouseScreenX - cx;
    const aimDy = this.mouseScreenY - cy;
    const aimLen = Math.sqrt(aimDx * aimDx + aimDy * aimDy);
    if (aimLen > 4) {
      this.state.aimDir = vec2(aimDx / aimLen, aimDy / aimLen);
    }
    this.state.shooting = this.mouseDown;
  }

  private updateMobile(): void {
    if (this.leftStick) {
      const dx = (this.leftStick.knobX - this.leftStick.baseX) / this.stickRadius;
      const dy = (this.leftStick.knobY - this.leftStick.baseY) / this.stickRadius;
      const len = Math.sqrt(dx * dx + dy * dy);
      this.state.moveDir = len > 0.1 ? vec2(dx / len * Math.min(len, 1), dy / len * Math.min(len, 1)) : vec2(0, 0);
    } else {
      this.state.moveDir = vec2(0, 0);
    }

    if (this.rightStick) {
      const dx = this.rightStick.knobX - this.rightStick.baseX;
      const dy = this.rightStick.knobY - this.rightStick.baseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 5) {
        this.state.aimDir = vec2(dx / dist, dy / dist);
        this.state.shooting = true;
      } else {
        this.state.shooting = false;
      }
    } else {
      this.state.shooting = false;
    }
  }

  isKeyDown(key: string): boolean {
    if (this.isMobile) return false;
    return this.keys.has(key.toLowerCase());
  }

  renderSticks(ctx: CanvasRenderingContext2D): void {
    if (!this.isMobile) return;
    const rd = (stick: Stick | null, color: string) => {
      if (!stick) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(stick.baseX, stick.baseY, this.stickRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(stick.knobX, stick.knobY, 18, 0, Math.PI * 2);
      ctx.fill();
    };
    rd(this.leftStick, "rgba(79,195,247,0.5)");
    rd(this.rightStick, "rgba(255,152,0,0.5)");
  }
}
