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

function frames(base: Partial<WeaponAnchorFrame>): WeaponAnchorFrame[] {
  return [
    { ...DEFAULT_FRAME, ...base },
    { ...DEFAULT_FRAME, ...base, handOffsetY: (base.handOffsetY ?? DEFAULT_FRAME.handOffsetY) + 1, rotationOffset: (base.rotationOffset ?? 0) + 0.02 },
    { ...DEFAULT_FRAME, ...base, handOffsetY: (base.handOffsetY ?? DEFAULT_FRAME.handOffsetY) - 1, rotationOffset: (base.rotationOffset ?? 0) - 0.02 },
    { ...DEFAULT_FRAME, ...base },
  ];
}

function directional(base: Partial<WeaponAnchorFrame>): WeaponAnchorSet {
  return {
    down: frames(base),
    up: frames({ ...base, handOffsetY: (base.handOffsetY ?? DEFAULT_FRAME.handOffsetY) - 2, spriteOffsetY: (base.spriteOffsetY ?? 0) - 1 }),
    left: frames({ ...base, handOffsetX: (base.handOffsetX ?? 0) - 2, rotationOffset: (base.rotationOffset ?? 0) - 0.04 }),
    right: frames({ ...base, handOffsetX: (base.handOffsetX ?? 0) + 2, rotationOffset: (base.rotationOffset ?? 0) + 0.04 }),
  };
}

export const HUMAN_WEAPON_ANCHORS: Record<string, WeaponAnchorSet> = {
  bow: directional({
    handRadius: 16,
    handOffsetY: 3,
    rotationOffset: 0.02,
    size: 44,
    fistOffsetX: -0.16,
    fistOffsetY: 0.05,
  }),
  flying_blade: directional({
    handRadius: 14,
    handOffsetY: 1,
    spriteOffsetX: 2,
    rotationOffset: 0.08,
    size: 40,
    fistOffsetX: -0.12,
    fistOffsetY: 0.05,
  }),
  spear: directional({
    handRadius: 18,
    handOffsetY: 3,
    spriteOffsetX: 8,
    rotationOffset: 0.02,
    size: 60,
    fistOffsetX: -0.18,
    fistOffsetY: 0.03,
  }),
  mace: directional({
    handRadius: 18,
    handOffsetY: 5,
    spriteOffsetX: 4,
    spriteOffsetY: -2,
    rotationOffset: 0.12,
    size: 50,
    fistOffsetX: -0.2,
    fistOffsetY: 0.08,
  }),
  wand: directional({
    handRadius: 16,
    handOffsetY: 3,
    spriteOffsetX: 2,
    rotationOffset: -0.02,
    size: 44,
    fistOffsetX: -0.15,
    fistOffsetY: 0.04,
  }),
  staff: directional({
    handRadius: 17,
    handOffsetY: 4,
    spriteOffsetX: 3,
    spriteOffsetY: -1,
    rotationOffset: -0.05,
    size: 56,
    fistOffsetX: -0.17,
    fistOffsetY: 0.03,
  }),
  orb: directional({
    handRadius: 14,
    handOffsetY: 1,
    spriteOffsetX: 3,
    spriteOffsetY: -2,
    rotationOffset: 0,
    size: 42,
    fistOffsetX: -0.1,
    fistOffsetY: 0.08,
  }),
  drone_core: directional({
    handRadius: 13,
    handOffsetY: 0,
    spriteOffsetX: 2,
    spriteOffsetY: -2,
    rotationOffset: 0,
    size: 42,
    fistOffsetX: -0.1,
    fistOffsetY: 0.08,
  }),
  energy_core: directional({
    handRadius: 13,
    handOffsetY: 0,
    spriteOffsetX: 2,
    spriteOffsetY: -2,
    rotationOffset: 0,
    size: 42,
    fistOffsetX: -0.1,
    fistOffsetY: 0.08,
  }),
};

export function getHumanWeaponAnchor(weaponId: string, direction: AnchorDirection, frame: number): WeaponAnchorFrame {
  const set = HUMAN_WEAPON_ANCHORS[weaponId];
  const frames = set?.[direction] ?? set?.down;
  if (!frames || frames.length === 0) return DEFAULT_FRAME;
  return frames[Math.max(0, frame) % frames.length] ?? DEFAULT_FRAME;
}
