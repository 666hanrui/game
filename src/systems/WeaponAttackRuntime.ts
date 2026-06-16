import type { ProjectileKind } from "../entities/Projectile";
import type { Weapon, WeaponAttackMode } from "../data/weapons";
import { getWeaponStatProfile } from "./WeaponStatRuntime";

export type MeleeAttackType = "none" | "thrust" | "slash" | "slam";
export type MeleeHitShape = "none" | "thrust_capsule" | "slash_arc" | "slam_circle" | "slam_cone";

export interface WeaponAttackProfile {
  weaponId: string;
  attackMode: WeaponAttackMode;
  projectileKind?: ProjectileKind;
  projectileSpeed: number;
  meleeType: MeleeAttackType;
  hitShape: MeleeHitShape;
  meleeRange: number;
  meleeWidth: number;
  meleeArc: number;
  visualLength: number;
  visualWidth: number;
  visualArc: number;
  meleeDamageMultiplier: number;
  visualColor: string;
}

type PartialProfile = Omit<WeaponAttackProfile, "weaponId" | "attackMode">;

const DEFAULT_PROFILE: WeaponAttackProfile = {
  weaponId: "bow",
  attackMode: "ranged_projectile",
  projectileKind: "arrow",
  projectileSpeed: 600,
  meleeType: "none",
  hitShape: "none",
  meleeRange: 0,
  meleeWidth: 0,
  meleeArc: 0,
  visualLength: 0,
  visualWidth: 0,
  visualArc: 0,
  meleeDamageMultiplier: 1,
  visualColor: "#ffd54f",
};

const PROFILE_BY_WEAPON: Record<string, PartialProfile> = {
  bow: ranged("arrow", 600, "#ffd54f"),
  wand: ranged("magic", 560, "#ce93d8"),
  staff: ranged("heavy_magic", 500, "#ab47bc"),
  orb: ranged("magic", 460, "#90caf9", 0.75),
  energy_core: ranged("energy", 650, "#4dd0e1"),
  drone_core: ranged("drone", 620, "#42a5f5"),
  flying_blade: ranged("blade", 520, "#ef5350", 0.92),
  spear: melee("thrust", "thrust_capsule", 108, 32, 0.26, 1.18, "#ffb74d"),
  mace: melee("slam", "slam_circle", 82, 104, Math.PI, 1.36, "#bc8f5a"),
};

export function getWeaponAttackProfile(weapon: Weapon | null | undefined): WeaponAttackProfile {
  if (!weapon) return { ...DEFAULT_PROFILE };
  const specific = PROFILE_BY_WEAPON[weapon.id];
  const raw = specific ?? buildGenericProfile(weapon);
  const stats = getWeaponStatProfile(weapon);
  const rangeMul = stats.rangeMultiplier;
  return {
    weaponId: weapon.id,
    attackMode: weapon.attackMode,
    ...raw,
    projectileSpeed: Math.max(120, raw.projectileSpeed * stats.projectileSpeedMultiplier),
    meleeRange: raw.meleeRange * rangeMul,
    meleeWidth: raw.meleeWidth * rangeMul,
    meleeArc: raw.meleeArc,
    visualLength: raw.visualLength * rangeMul,
    visualWidth: raw.visualWidth * rangeMul,
    visualArc: raw.visualArc,
  };
}

function ranged(projectileKind: ProjectileKind, projectileSpeed: number, visualColor: string, meleeDamageMultiplier = 1): PartialProfile {
  return { projectileKind, projectileSpeed, meleeType: "none", hitShape: "none", meleeRange: 0, meleeWidth: 0, meleeArc: 0, visualLength: 0, visualWidth: 0, visualArc: 0, meleeDamageMultiplier, visualColor };
}

function melee(meleeType: MeleeAttackType, hitShape: MeleeHitShape, range: number, width: number, arc: number, damage: number, color: string): PartialProfile {
  return { projectileSpeed: 0, meleeType, hitShape, meleeRange: range, meleeWidth: width, meleeArc: arc, visualLength: range, visualWidth: width, visualArc: arc, meleeDamageMultiplier: damage, visualColor: color };
}

function buildGenericProfile(weapon: Weapon): PartialProfile {
  const color = weapon.color;
  const stats = getWeaponStatProfile(weapon);
  const heavy = stats.weightClass === "heavy" || stats.weightClass === "massive";
  const light = stats.weightClass === "light";

  if (weapon.attackMode === "melee_thrust") {
    return melee("thrust", "thrust_capsule", light ? 82 : 102, light ? 24 : 32, light ? 0.22 : 0.26, light ? 0.92 : 1.12, color);
  }
  if (weapon.attackMode === "melee_slash") {
    return melee("slash", "slash_arc", heavy ? 112 : light ? 72 : 88, heavy ? 98 : light ? 56 : 76, heavy ? 1.18 : light ? 0.72 : 0.92, heavy ? 1.24 : light ? 0.86 : 1.08, color);
  }
  if (weapon.attackMode === "melee_slam") {
    const circle = weapon.subCategory === "counter" || weapon.subCategory === "mace";
    return melee("slam", circle ? "slam_circle" : "slam_cone", heavy ? 96 : 78, heavy ? 118 : 96, circle ? Math.PI : heavy ? 1.25 : 1.08, heavy ? 1.38 : 1.2, color);
  }
  if (weapon.attackMode === "short_returning_blade") return ranged("blade", 520, color, light ? 0.86 : 0.92);
  if (weapon.attackMode === "orbit") return ranged(weapon.school === "tech" ? "energy" : "magic", 440, color, 0.78);
  if (weapon.attackMode === "summon") return ranged(weapon.school === "magic" ? "magic" : "drone", 600, color, 0.9);
  if (weapon.school === "magic") return ranged(weapon.subCategory === "fire" || weapon.subCategory === "field" ? "heavy_magic" : "magic", weapon.subCategory === "time" ? 420 : 560, color);
  if (weapon.school === "tech") return ranged(weapon.subCategory === "crossbow" ? "arrow" : "energy", weapon.subCategory === "gun" ? 820 : weapon.subCategory === "shotgun" ? 560 : 660, color);
  return ranged("arrow", 620, color);
}

export function isMeleeProfile(profile: WeaponAttackProfile): boolean {
  return profile.meleeType !== "none" && profile.hitShape !== "none";
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
  if (dist > profile.meleeRange + profile.meleeWidth * 0.5) return false;

  const aimLen = Math.sqrt(aimX * aimX + aimY * aimY) || 1;
  const nx = aimX / aimLen;
  const ny = aimY / aimLen;

  if (profile.hitShape === "slam_circle") return dist <= profile.meleeRange + profile.meleeWidth * 0.28;

  const targetLen = Math.sqrt(dx * dx + dy * dy) || 1;
  const tx = dx / targetLen;
  const ty = dy / targetLen;
  const dot = nx * tx + ny * ty;
  const angle = Math.acos(Math.max(-1, Math.min(1, dot)));

  if (profile.hitShape === "thrust_capsule") {
    const forward = dx * nx + dy * ny;
    if (forward < -profile.meleeWidth * 0.35 || forward > profile.meleeRange) return false;
    const side = Math.abs(dx * -ny + dy * nx);
    return side <= profile.meleeWidth * 0.5;
  }

  if (profile.hitShape === "slash_arc" || profile.hitShape === "slam_cone") return angle <= profile.meleeArc;
  return false;
}
