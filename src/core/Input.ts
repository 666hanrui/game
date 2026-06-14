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
  private hasMouseAim = false;
  private autoFire = false;
  private autoFireToggleDown = false;

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

    this.setupKeyboard();
    this.setupMouse();
    this.setupTouch();
  }

  isAutoFireEnabled(): boolean {
    return this.autoFire;
  }

  private rememberKey(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();
    const code = e.code.toLowerCase();
    this.keys.add(key);
    this.keys.add(code);
  }

  private forgetKey(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();
    const code = e.code.toLowerCase();
    this.keys.delete(key);
    this.keys.delete(code);
  }

  private setupKeyboard(): void {
    window.addEventListener("keydown", (e) => {
      this.rememberKey(e);
      const key = e.key.toLowerCase();
      const code = e.code.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", " ", "j", "f"].includes(key) ||
          ["keyw", "keya", "keys", "keyd", "space", "keyj", "keyf"].includes(code)) {
        e.preventDefault();
      }
    });
    window.addEventListener("keyup", (e) => this.forgetKey(e));
    window.addEventListener("blur", () => {
      this.keys.clear();
      this.mouseDown = false;
      this.leftStick = null;
      this.rightStick = null;
      this.autoFireToggleDown = false;
      this.state.moveDir = vec2(0, 0);
      this.state.shooting = false;
    });
  }

  private setupMouse(): void {
    const syncMouse = (e: MouseEvent) => {
      const r = this.canvas.getBoundingClientRect();
      this.mouseScreenX = e.clientX - r.left;
      this.mouseScreenY = e.clientY - r.top;
      this.hasMouseAim = true;
    };

    this.canvas.addEventListener("mousemove", syncMouse);
    this.canvas.addEventListener("mouseenter", syncMouse);
    this.canvas.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      syncMouse(e);
      this.mouseDown = true;
      e.preventDefault();
    });
    window.addEventListener("mouseup", (e) => {
      if (e.button === 0) this.mouseDown = false;
    });
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
    let moveDir = this.getKeyboardMoveDir();
    this.updateAutoFireToggle();
    let shooting = this.autoFire || this.mouseDown || this.hasAny(["j", "keyj", " ", "space"]);
    let aimDir = this.getMouseAimDir() ?? this.state.aimDir;

    if (this.leftStick) {
      const dx = (this.leftStick.knobX - this.leftStick.baseX) / this.stickRadius;
      const dy = (this.leftStick.knobY - this.leftStick.baseY) / this.stickRadius;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0.1) moveDir = vec2(dx / len * Math.min(len, 1), dy / len * Math.min(len, 1));
    }

    if (this.rightStick) {
      const dx = this.rightStick.knobX - this.rightStick.baseX;
      const dy = this.rightStick.knobY - this.rightStick.baseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 5) {
        aimDir = vec2(dx / dist, dy / dist);
        shooting = true;
      }
    }

    this.state.moveDir = moveDir;
    this.state.aimDir = aimDir;
    this.state.shooting = shooting;
  }

  private updateAutoFireToggle(): void {
    const down = this.hasAny(["f", "keyf"]);
    if (down && !this.autoFireToggleDown) this.autoFire = !this.autoFire;
    this.autoFireToggleDown = down;
  }

  private hasAny(keys: string[]): boolean {
    return keys.some((key) => this.keys.has(key));
  }

  private getKeyboardMoveDir(): Vec2 {
    let dx = 0, dy = 0;
    if (this.hasAny(["w", "keyw", "arrowup"])) dy -= 1;
    if (this.hasAny(["s", "keys", "arrowdown"])) dy += 1;
    if (this.hasAny(["a", "keya", "arrowleft"])) dx -= 1;
    if (this.hasAny(["d", "keyd", "arrowright"])) dx += 1;
    const len = Math.sqrt(dx * dx + dy * dy);
    return len > 0 ? vec2(dx / len, dy / len) : vec2(0, 0);
  }

  private getMouseAimDir(): Vec2 | null {
    if (!this.hasMouseAim) return null;
    const cx = this.cssWidth() / 2;
    const cy = this.cssHeight() / 2;
    const aimDx = this.mouseScreenX - cx;
    const aimDy = this.mouseScreenY - cy;
    const aimLen = Math.sqrt(aimDx * aimDx + aimDy * aimDy);
    if (aimLen <= 4) return null;
    return vec2(aimDx / aimLen, aimDy / aimLen);
  }

  isKeyDown(key: string): boolean {
    const lower = key.toLowerCase();
    if (lower === " ") return this.hasAny([" ", "space"]);
    if (lower.length === 1 && lower >= "a" && lower <= "z") return this.hasAny([lower, `key${lower}`]);
    return this.keys.has(lower);
  }

  renderSticks(ctx: CanvasRenderingContext2D): void {
    if (!this.isMobile && !this.leftStick && !this.rightStick) return;
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
