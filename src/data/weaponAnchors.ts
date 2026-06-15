export type AnchorDirection = "down" | "up" | "left" | "right";

export interface WeaponAnchorFrame {
  handRadius: number;
  handOffsetX: number;
  handOffsetY: number;
  spriteOffsetX: number;
  spriteOffsetY: number;
  rotationOffset: number;
  size: number;
  fistOffsetX: number;
  fistOffsetY: number;
}

export type WeaponAnchorSet = Partial<Record<AnchorDirection, WeaponAnchorFrame[]>>;

const DEFAULT_FRAME: WeaponAnchorFrame = {
  handRadius: 15,
  handOffsetX: 0,
  handOffsetY: 2,
  spriteOffsetX: 0,
  spriteOffsetY: 0,
  rotationOffset: 0,
  size: 42,
  fistOffsetX: -0.14,
  fistOffsetY: 0.04,
};

export const HUMAN_WEAPON_ANCHORS: Record<string, WeaponAnchorSet> = {
  bow: {
    down: [
      { ...DEFAULT_FRAME, handRadius: 16, handOffsetY: 3, rotationOffset: 0.02, size: 44 },
      { ...DEFAULT_FRAME, handRadius: 16, handOffsetY: 4, rotationOffset: 0.04, size: 44 },
      { ...DEFAULT_FRAME, handRadius: 15, handOffsetY: 2, rotationOffset: -0.02, size: 44 },
      { ...DEFAULT_FRAME, handRadius: 16, handOffsetY: 3, rotationOffset: 0.01, size: 44 },
    ],
  },
  mace: {
    down: [
      { ...DEFAULT_FRAME, handRadius: 18, handOffsetY: 5, spriteOffsetX: 4, spriteOffsetY: -2, rotationOffset: 0.12, size: 50 },
      { ...DEFAULT_FRAME, handRadius: 18, handOffsetY: 6, spriteOffsetX: 4, spriteOffsetY: -1, rotationOffset: 0.16, size: 50 },
      { ...DEFAULT_FRAME, handRadius: 17, handOffsetY: 4, spriteOffsetX: 3, spriteOffsetY: -2, rotationOffset: 0.09, size: 50 },
      { ...DEFAULT_FRAME, handRadius: 18, handOffsetY: 5, spriteOffsetX: 4, spriteOffsetY: -2, rotationOffset: 0.12, size: 50 },
    ],
  },
  staff: {
    down: [
      { ...DEFAULT_FRAME, handRadius: 17, handOffsetY: 4, spriteOffsetX: 3, spriteOffsetY: -1, rotationOffset: -0.05, size: 56 },
      { ...DEFAULT_FRAME, handRadius: 17, handOffsetY: 5, spriteOffsetX: 3, spriteOffsetY: 0, rotationOffset: -0.03, size: 56 },
      { ...DEFAULT_FRAME, handRadius: 16, handOffsetY: 3, spriteOffsetX: 2, spriteOffsetY: -1, rotationOffset: -0.07, size: 56 },
      { ...DEFAULT_FRAME, handRadius: 17, handOffsetY: 4, spriteOffsetX: 3, spriteOffsetY: -1, rotationOffset: -0.05, size: 56 },
    ],
  },
  spear: {
    down: [
      { ...DEFAULT_FRAME, handRadius: 18, handOffsetY: 3, spriteOffsetX: 8, spriteOffsetY: 0, rotationOffset: 0.02, size: 60 },
      { ...DEFAULT_FRAME, handRadius: 18, handOffsetY: 4, spriteOffsetX: 8, spriteOffsetY: 1, rotationOffset: 0.04, size: 60 },
      { ...DEFAULT_FRAME, handRadius: 17, handOffsetY: 3, spriteOffsetX: 7, spriteOffsetY: 0, rotationOffset: 0, size: 60 },
      { ...DEFAULT_FRAME, handRadius: 18, handOffsetY: 3, spriteOffsetX: 8, spriteOffsetY: 0, rotationOffset: 0.02, size: 60 },
    ],
  },
};

export function getHumanWeaponAnchor(weaponId: string, direction: AnchorDirection, frame: number): WeaponAnchorFrame {
  const set = HUMAN_WEAPON_ANCHORS[weaponId];
  const frames = set?.[direction] ?? set?.down;
  if (!frames || frames.length === 0) return DEFAULT_FRAME;
  return frames[Math.max(0, frame) % frames.length] ?? DEFAULT_FRAME;
}
