import { vec2, Vec2 } from "../utils/math";
import { Input } from "../core/Input";
import { Projectile } from "./Projectile";
import { getHumanWeaponAnchor } from "../data/weaponAnchors";
import type { AnchorDirection } from "../data/weaponAnchors";

export type WalkDirection = "down" | "up" | "left" | "right";

export class Player {
  pos: Vec2;
  radius = 16;
  speed = 260;
  hp = 100;
  maxHp = 100;
  damage = 25;
  attackCooldown = 0.4;
  invulnerableUntil = 0;
  projectileExtra = 0;
  critChance = 0;
  critMultiplier = 1.5;

  walkTimer = 0;
  walkAnimTime = 0;
  walkDirection: WalkDirection = "down";
  recoilTimer = 0;
  isMoving = false;
  trail: { x: number; y: number; alpha: number; size: number; color: string }[] = [];
  private readonly cleanedWalkSheets = new WeakMap<HTMLImageElement, CanvasImageSource>();

  constructor(x: number, y: number) {
    this.pos = vec2(x, y);
  }

  update(dt: number, input: Input, worldW: number, worldH: number): void {
    const move = input.state.moveDir;
    this.pos.x += move.x * this.speed * dt;
    this.pos.y += move.y * this.speed * dt;
    this.pos.x = Math.max(this.radius, Math.min(worldW - this.radius, this.pos.x));
    this.pos.y = Math.max(this.radius, Math.min(worldH - this.radius, this.pos.y));

    this.isMoving = Math.abs(move.x) > 0.01 || Math.abs(move.y) > 0.01;
    if (this.isMoving) {
      this.walkTimer += dt * 13.5;
      this.walkAnimTime += dt;

      if (Math.abs(move.x) > Math.abs(move.y)) {
        this.walkDirection = move.x > 0 ? "right" : "left";
      } else {
        this.walkDirection = move.y > 0 ? "down" : "up";
      }
    } else {
      this.walkTimer = 0;
      this.walkAnimTime = 0;
    }

    if (this.recoilTimer > 0) {
      this.recoilTimer -= dt;
    }

    if (input.state.shooting && this.recoilTimer <= 0) {
      this.recoilTimer = 0.15;
    }

    // Spawn trail particles
    if (this.isMoving && Math.random() < 0.45) {
      this.trail.push({
        x: this.pos.x + (Math.random() - 0.5) * 12,
        y: this.pos.y + (Math.random() - 0.5) * 12 + 6,
        alpha: 0.65,
        size: Math.random() * 4 + 3,
        color: ""
      });
    }

    // Update trail particles
    for (const p of this.trail) {
      p.alpha -= dt * 1.8;
      p.size = Math.max(0, p.size - dt * 2.5);
    }
    this.trail = this.trail.filter((p) => p.alpha > 0);
  }

  shoot(aimDir: Vec2): Projectile {
    return new Projectile(this.pos.x, this.pos.y, aimDir.x * 600, aimDir.y * 600, false, this.damage);
  }

  renderAt(
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    aimDir: Vec2,
    color: string,
    weaponId = "bow",
    raceSprite?: HTMLImageElement | null,
    weaponSprite?: HTMLImageElement | null,
    raceId = "human",
    walkSheet?: HTMLImageElement | null,
  ): void {
    // Draw trail particles
    const offsetWtoS_X = sx - this.pos.x;
    const offsetWtoS_Y = sy - this.pos.y;
    for (const p of this.trail) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x + offsetWtoS_X, p.y + offsetWtoS_Y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Walk cycle parameters
    const walkCycle = this.walkTimer;
    const isMoving = this.isMoving;

    // Bobbing height when walking
    const bobY = isMoving ? Math.abs(Math.sin(walkCycle)) * 6.5 : 0;
    const renderY = sy - bobY;

    // Shadow scale and opacity based on jump height (shadow fades slightly when jumping)
    const shadowScaleX = isMoving ? 1.25 - (bobY / 6.5) * 0.15 : 1.25;
    const shadowScaleY = isMoving ? 0.46 - (bobY / 6.5) * 0.08 : 0.46;
    const shadowAlpha = isMoving ? 0.45 - (bobY / 6.5) * 0.15 : 0.45;

    // Soft Shadow at feet
    ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(sx, sy + this.radius + 2, this.radius * shadowScaleX, this.radius * shadowScaleY, 0, 0, Math.PI * 2);
    ctx.fill();

    const usedWalkSheet = this.renderWalkSheetBody(ctx, sx, sy, raceId, walkSheet);

    if (!usedWalkSheet) {
      const flip = aimDir.x < 0;

      // Squash & Stretch factors (Soul Knight procedural animation style)
      const stretchX = isMoving ? 1.0 - Math.abs(Math.sin(walkCycle)) * 0.08 : 1.0;
      const stretchY = isMoving ? 1.0 + Math.abs(Math.sin(walkCycle)) * 0.08 : 1.0;
      // Rotational sway (tilt back and forth when walking)
      const swayAngle = isMoving ? Math.sin(walkCycle) * 0.08 : 0;

      // Draw Character Body
      ctx.save();
      ctx.translate(sx, renderY);
      ctx.rotate(swayAngle);
      if (flip) {
        ctx.scale(-stretchX, stretchY);
      } else {
        ctx.scale(stretchX, stretchY);
      }

      // Outer Glow matching race color
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;

      const size = this.radius * 3.3; // Increased size to make the character noticeably larger and clearer

      // Setup boot/hand constants based on race
      let bootColor = "#795548"; // brown leather
      let bootStroke = "#4e342e";
      let bootW = size * 0.22;
      let bootH = size * 0.12;
      let bootRadius = size * 0.05;

      if (raceId === "goblin") {
        bootColor = "#3e2723";
        bootStroke = "#1a0c00";
        bootW = size * 0.18;
        bootH = size * 0.09;
        bootRadius = size * 0.04;
      } else if (raceId === "elf") {
        bootColor = "#a5d6a7";
        bootStroke = "#2e7d32";
        bootW = size * 0.20;
        bootH = size * 0.10;
        bootRadius = size * 0.04;
      } else if (raceId === "orc") {
        bootColor = "#37474f";
        bootStroke = "#212121";
        bootW = size * 0.28;
        bootH = size * 0.16;
        bootRadius = size * 0.06;
      }

      const fCycle = walkCycle;
      const strideX = size * 0.16;
      const strideY = size * 0.08;

      // Left foot position relative to center (0, 0)
      const lfx = -size * 0.16 + (isMoving ? Math.sin(fCycle) * strideX : 0);
      const lfy = size * 0.44 + (isMoving ? -Math.abs(Math.cos(fCycle)) * strideY : 0);

      // Right foot position relative to center (0, 0)
      const rfx = size * 0.16 + (isMoving ? -Math.sin(fCycle) * strideX : 0);
      const rfy = size * 0.44 + (isMoving ? -Math.abs(Math.sin(fCycle)) * strideY : 0);

      // 1. Draw Back Foot (Left Foot) if not spirit
      if (raceId !== "spirit") {
        ctx.save();
        ctx.fillStyle = bootColor;
        ctx.strokeStyle = bootStroke;
        ctx.lineWidth = 1.8;
        ctx.translate(lfx, lfy);
        if (isMoving) ctx.rotate(Math.sin(fCycle) * 0.18);
        ctx.beginPath();
        ctx.roundRect(-bootW / 2, -bootH / 2, bootW, bootH, bootRadius);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // 2. Draw Back Hand (Off-hand / Free hand)
      let handColor = "#ffcc80";
      if (raceId === "goblin") handColor = "#a1887f";
      else if (raceId === "orc") handColor = "#ef6c00";
      else if (raceId === "elf") handColor = "#ffe0b2";
      else if (raceId === "spirit") handColor = "rgba(186, 104, 200, 0.45)";

      const handRadius = size * 0.09;
      const offHandX = -size * 0.25 + (isMoving ? Math.sin(fCycle + Math.PI) * (size * 0.12) : 0);
      const offHandY = size * 0.08 + (isMoving ? Math.cos(fCycle) * (size * 0.05) : 0);

      ctx.save();
      ctx.fillStyle = handColor;
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineWidth = 1.6;
      ctx.translate(offHandX, offHandY);
      ctx.beginPath();
      ctx.arc(0, 0, handRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // highlight on hand
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(-handRadius * 0.25, -handRadius * 0.25, handRadius * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 3. Draw Body Sprite
      if (raceSprite) {
        ctx.drawImage(raceSprite, -size / 2, -size / 2, size, size);

        // Fine visual overlays to make the character look more detailed & realistic
        ctx.shadowBlur = 0; // turn off shadow blur for details

        // 1. Cheek Blush
        ctx.fillStyle = "rgba(240, 98, 146, 0.48)";
        ctx.beginPath();
        ctx.arc(-size * 0.14, size * 0.04, size * 0.06, 0, Math.PI * 2);
        ctx.arc(size * 0.14, size * 0.04, size * 0.06, 0, Math.PI * 2);
        ctx.fill();

        // 2. Eye glints/highlights for liveliness
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(-size * 0.1, -size * 0.05, 2, 0, Math.PI * 2);
        ctx.arc(size * 0.06, -size * 0.05, 2, 0, Math.PI * 2);
        ctx.fill();

        // 3. Cute headband ribbon tail / hair flow on the back
        ctx.fillStyle = color;
        ctx.strokeStyle = "rgba(0,0,0,0.25)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Wave ribbon depending on walkTimer
        const ribbonWave = Math.sin(this.walkTimer * 0.6) * 4;
        ctx.moveTo(-size * 0.35, -size * 0.1);
        ctx.quadraticCurveTo(-size * 0.55, -size * 0.08 + ribbonWave, -size * 0.62, size * 0.08 + ribbonWave * 1.5);
        ctx.lineTo(-size * 0.58, size * 0.12 + ribbonWave * 1.5);
        ctx.quadraticCurveTo(-size * 0.48, -size * 0.02 + ribbonWave, -size * 0.35, size * 0.02);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // Vector fallback
        ctx.fillStyle = color;
        ctx.strokeStyle = "rgba(255,255,255,0.85)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 1.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // 4. Draw Front Foot (Right Foot) if not spirit
      if (raceId !== "spirit") {
        ctx.save();
        ctx.fillStyle = bootColor;
        ctx.strokeStyle = bootStroke;
        ctx.lineWidth = 1.8;
        ctx.translate(rfx, rfy);
        if (isMoving) ctx.rotate(-Math.sin(fCycle) * 0.18);
        ctx.beginPath();
        ctx.roundRect(-bootW / 2, -bootH / 2, bootW, bootH, bootRadius);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      } else {
        // Spirit floating particles ring
        ctx.save();
        ctx.fillStyle = "rgba(186, 104, 200, 0.6)";
        for (let i = 0; i < 3; i++) {
          const t = fCycle * 0.35 + i * (Math.PI * 2 / 3);
          const px = Math.sin(t) * size * 0.38;
          const py = size * 0.42 + Math.cos(t * 2) * size * 0.06;
          ctx.beginPath();
          ctx.arc(px, py, size * 0.05, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      ctx.restore();
    }

    // Draw Weapon
    this.renderWeapon(ctx, sx, sy, aimDir, weaponId, weaponSprite, raceId);
  }

  private renderWeapon(
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    aimDir: Vec2,
    weaponId: string,
    weaponSprite?: HTMLImageElement | null,
    raceId = "human",
  ): void {
    if (!weaponId) return;

    const angle = Math.atan2(aimDir.y, aimDir.x);
    const frame = this.isMoving ? Math.floor(this.walkAnimTime * 8) % 4 : 0;
    const direction = this.walkDirection as AnchorDirection;
    const anchor = raceId === "human" ? getHumanWeaponAnchor(weaponId, direction, frame) : null;

    // Recoil offset (backwards along aiming line)
    let recoilDist = 0;
    if (this.recoilTimer > 0) {
      const progress = this.recoilTimer / 0.15;
      recoilDist = -Math.sin(progress * Math.PI) * 11;
    }

    // Calculate hand position offset from body center
    const handRadius = anchor?.handRadius ?? 15;
    const handX = Math.cos(angle) * handRadius + recoilDist * Math.cos(angle) + (anchor?.handOffsetX ?? 0);
    const handY = Math.sin(angle) * handRadius + recoilDist * Math.sin(angle) + (anchor?.handOffsetY ?? 2);

    ctx.save();
    ctx.translate(sx + handX, sy + handY);
    ctx.rotate(angle + (anchor?.rotationOffset ?? 0));

    // Auto flip vertically when aiming left to prevent the weapon from being upside down
    const angleDeg = (angle * 180) / Math.PI;
    const shouldFlip = angleDeg > 90 || angleDeg < -90;
    if (shouldFlip) {
      ctx.scale(1, -1);
    }

    const size = anchor?.size ?? (weaponId === "staff" ? 54 : weaponId === "spear" ? 58 : weaponId === "mace" ? 50 : 42);
    const spriteOffsetX = anchor?.spriteOffsetX ?? 0;
    const spriteOffsetY = anchor?.spriteOffsetY ?? 0;

    if (weaponSprite) {
      ctx.drawImage(weaponSprite, -size / 2 + spriteOffsetX, -size / 2 + spriteOffsetY, size, size);
    } else {
      ctx.save();
      ctx.translate(spriteOffsetX, spriteOffsetY);
      // Fallbacks
      if (weaponId === "wand") this.renderWandFallback(ctx, size, "#ce93d8");
      else if (weaponId === "staff") this.renderWandFallback(ctx, size, "#ab47bc");
      else if (weaponId === "flying_blade") this.renderBladeFallback(ctx, size);
      else if (weaponId === "energy_core" || weaponId === "drone_core") this.renderCoreFallback(ctx, size, weaponId);
      else this.renderBowFallback(ctx, size);
      ctx.restore();
    }

    // Draw floating fist holding the weapon (Soul Knight style!)
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.translate(size * (anchor?.fistOffsetX ?? -0.14), size * (anchor?.fistOffsetY ?? 0.04));
    ctx.fillStyle = raceId === "goblin" ? "#a1887f" : raceId === "orc" ? "#ef6c00" : raceId === "elf" ? "#ffe0b2" : "#ffcc80";
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // highlight on the fist
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(-1.5, -1.5, 1.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Firing Muzzle Flash / Spark Particles at the weapon tip
    if (this.recoilTimer > 0.08) {
      ctx.fillStyle = "#ffeb3b";
      ctx.beginPath();
      ctx.arc(size / 2 - 2 + spriteOffsetX, spriteOffsetY, Math.random() * 6 + 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ff5722";
      ctx.beginPath();
      ctx.arc(size / 2 - 2 + spriteOffsetX, spriteOffsetY, Math.random() * 4 + 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private renderBowFallback(ctx: CanvasRenderingContext2D, size: number): void {
    ctx.strokeStyle = "#c8a96e";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, -Math.PI / 2 - 0.5, Math.PI / 2 + 0.5);
    ctx.stroke();
    ctx.strokeStyle = "#f5f5f5";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.cos(-Math.PI / 2 - 0.5) * (size / 2), Math.sin(-Math.PI / 2 - 0.5) * (size / 2));
    ctx.lineTo(Math.cos(Math.PI / 2 + 0.5) * (size / 2), Math.sin(Math.PI / 2 + 0.5) * (size / 2));
    ctx.stroke();
  }

  private renderWandFallback(ctx: CanvasRenderingContext2D, size: number, color: string): void {
    ctx.strokeStyle = "#5d4037";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-size / 2, 0);
    ctx.lineTo(size / 2, 0);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(size / 2, 0, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderBladeFallback(ctx: CanvasRenderingContext2D, size: number): void {
    ctx.fillStyle = "#cfd8dc";
    ctx.strokeStyle = "#78909c";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(-size / 4, -size / 4);
    ctx.lineTo(-size / 2, 0);
    ctx.lineTo(-size / 4, size / 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  private renderCoreFallback(ctx: CanvasRenderingContext2D, size: number, weaponId: string): void {
    const color = weaponId === "drone_core" ? "#42a5f5" : "#4dd0e1";
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, size / 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  private renderWalkSheetBody(
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    raceId: string,
    walkSheet?: HTMLImageElement | null,
  ): boolean {
    if (!walkSheet) return false;
    if (!walkSheet.complete || walkSheet.naturalWidth <= 0) return false;

    const sheet = this.getCleanedWalkSheet(walkSheet, raceId);
    const sheetW = this.getDrawableWidth(sheet);
    const sheetH = this.getDrawableHeight(sheet);
    if (sheetW <= 0 || sheetH <= 0) return false;

    const cols = 4;
    const rows = 4;

    const frameW = sheetW / cols;
    const frameH = sheetH / rows;

    const fps = 8;
    const frame = this.isMoving
      ? Math.floor(this.walkAnimTime * fps) % 4
      : 0;

    const rowMap: Record<WalkDirection, number> = {
      down: 0,
      up: 1,
      left: 2,
      right: 3,
    };
    const row = rowMap[this.walkDirection];
    
    const srcX = frame * frameW;
    const srcY = row * frameH;

    const drawW = 58;
    const drawH = 58;

    ctx.save();

    // 关闭平滑，让像素风更清晰
    const oldSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;

    // 锚点放在脚底中心，而不是图片中心
    ctx.drawImage(
      sheet,
      srcX,
      srcY,
      frameW,
      frameH,
      sx - drawW / 2,
      sy - drawH + 18,
      drawW,
      drawH,
    );

    ctx.imageSmoothingEnabled = oldSmoothing;
    ctx.restore();

    return true;
  }

  private getCleanedWalkSheet(walkSheet: HTMLImageElement, raceId: string): CanvasImageSource {
    const cached = this.cleanedWalkSheets.get(walkSheet);
    if (cached) return cached;
    if (raceId === "human") {
      this.cleanedWalkSheets.set(walkSheet, walkSheet);
      return walkSheet;
    }

    const canvas = document.createElement("canvas");
    canvas.width = walkSheet.naturalWidth;
    canvas.height = walkSheet.naturalHeight;
    const cx = canvas.getContext("2d", { willReadFrequently: true });
    if (!cx) return walkSheet;
    cx.drawImage(walkSheet, 0, 0);
    const data = cx.getImageData(0, 0, canvas.width, canvas.height);
    const arr = data.data;
    for (let i = 0; i < arr.length; i += 4) {
      const r = arr[i];
      const g = arr[i + 1];
      const b = arr[i + 2];
      const a = arr[i + 3];
      const nearWhite = a > 0 && r > 238 && g > 238 && b > 238;
      const neutral = Math.max(r, g, b) - Math.min(r, g, b) <= 16;
      const checker = a > 0 && neutral && (Math.max(r, g, b) > 186 || Math.max(r, g, b) < 72);
      if (nearWhite || checker) arr[i + 3] = 0;
    }
    cx.putImageData(data, 0, 0);
    this.cleanedWalkSheets.set(walkSheet, canvas);
    return canvas;
  }

  private getDrawableWidth(drawable: CanvasImageSource): number {
    if (drawable instanceof HTMLImageElement) return drawable.naturalWidth;
    if (drawable instanceof HTMLCanvasElement) return drawable.width;
    return 0;
  }

  private getDrawableHeight(drawable: CanvasImageSource): number {
    if (drawable instanceof HTMLImageElement) return drawable.naturalHeight;
    if (drawable instanceof HTMLCanvasElement) return drawable.height;
    return 0;
  }
}
