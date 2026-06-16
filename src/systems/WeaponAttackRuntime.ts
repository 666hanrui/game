import type { ProjectileKind } from "../entities/Projectile";
import type { Weapon, WeaponAttackMode } from "../data/weapons";

export type MeleeAttackType = "none" | "thrust" | "slash" | "slam";

export interface WeaponAttackProfile {
  weaponId: string;
  attackMode: WeaponAttackMode;
  projectileKind?: ProjectileKind;
  projectileSpeed: number;
  meleeType: MeleeAttackType;
  meleeRange: number;
  meleeWidth: number;
  meleeArc: number;
  meleeDamageMultiplier: number;
  visualColor: string;
}

const DEFAULT_PROFILE: WeaponAttackProfile = {
  weaponId: "bow",
  attackMode: "ranged_projectile",
  projectileKind: "arrow",
  projectileSpeed: 600,
  meleeType: "none",
  meleeRange: 0,
  meleeWidth: 0,
  meleeArc: 0,
  meleeDamageMultiplier: 1,
  visualColor: "#ffd54f",
};

const PROFILE_BY_WEAPON: Record<string, Omit<WeaponAttackProfile, "weaponId" | "attackMode">> = {
  bow: {
    projectileKind: "arrow",
    projectileSpeed: 600,
    meleeType: "none",
    meleeRange: 0,
    meleeWidth: 0,
    meleeArc: 0,
    meleeDamageMultiplier: 1,
    visualColor: "#ffd54f",
  },
  wand: {
    projectileKind: "magic",
    projectileSpeed: 560,
    meleeType: "none",
    meleeRange: 0,
    meleeWidth: 0,
    meleeArc: 0,
    meleeDamageMultiplier: 1,
    visualColor: "#ce93d8",
  },
  staff: {
    projectileKind: "heavy_magic",
    projectileSpeed: 500,
    meleeType: "none",
    meleeRange: 0,
    meleeWidth: 0,
    meleeArc: 0,
    meleeDamageMultiplier: 1,
    visualColor: "#ab47bc",
  },
  orb: {
    projectileKind: "magic",
    projectileSpeed: 460,
    meleeType: "none",
    meleeRange: 0,
    meleeWidth: 0,
    meleeArc: 0,
    meleeDamageMultiplier: 0.75,
    visualColor: "#90caf9",
  },
  energy_core: {
    projectileKind: "energy",
    projectileSpeed: 650,
    meleeType: "none",
    meleeRange: 0,
    meleeWidth: 0,
    meleeArc: 0,
    meleeDamageMultiplier: 1,
    visualColor: "#4dd0e1",
  },
  drone_core: {
    projectileKind: "drone",
    projectileSpeed: 620,
    meleeType: "none",
    meleeRange: 0,
    meleeWidth: 0,
    meleeArc: 0,
    meleeDamageMultiplier: 1,
    visualColor: "#42a5f5",
  },
  flying_blade: {
    projectileKind: "blade",
    projectileSpeed: 520,
    meleeType: "none",
    meleeRange: 0,
    meleeWidth: 0,
    meleeArc: 0,
    meleeDamageMultiplier: 0.92,
    visualColor: "#ef5350",
  },
  spear: {
    projectileSpeed: 0,
    meleeType: "thrust",
    meleeRange: 108,
    meleeWidth: 32,
    meleeArc: 0.26,
    meleeDamageMultiplier: 1.18,
    visualColor: "#ffb74d",
  },
  mace: {
    projectileSpeed: 0,
    meleeType: "slam",
    meleeRange: 74,
    meleeWidth: 92,
    meleeArc: 1.18,
    meleeDamageMultiplier: 1.36,
    visualColor: "#bc8f5a",
  },
};

export function getWeaponAttackProfile(weapon: Weapon | null | undefined): WeaponAttackProfile {
  if (!weapon) return { ...DEFAULT_PROFILE };
  const profile = PROFILE_BY_WEAPON[weapon.id] ?? DEFAULT_PROFILE;
  return {
    weaponId: weapon.id,
    attackMode: weapon.attackMode,
    ...profile,
  };
}

export function isMeleeProfile(profile: WeaponAttackProfile): boolean {
  return profile.meleeType !== "none";
}

export function isPointInMeleeArc(
  originX: number,
  originY: number,
  aimX: number,
  aimY: number,
  targetX: number,
  targetY: number,
  profile: WeaponAttackProfile,
): boolean {
  if (!isMeleeProfile(profile)) return false;

  const dx = targetX - originX;
  const dy = targetY - originY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > profile.meleeRange) return false;

  const aimLen = Math.sqrt(aimX * aimX + aimY * aimY) || 1;
  const targetLen = Math.sqrt(dx * dx + dy * dy) || 1;
  const dot = (aimX / aimLen) * (dx / targetLen) + (aimY / aimLen) * (dy / targetLen);
  const angle = Math.acos(Math.max(-1, Math.min(1, dot)));

  if (profile.meleeType === "thrust") {
    const side = Math.abs((dx / targetLen) * (-aimY / aimLen) + (dy / targetLen) * (aimX / aimLen)) * dist;
    return angle <= profile.meleeArc || side <= profile.meleeWidth;
  }

  return angle <= profile.meleeArc;
}
