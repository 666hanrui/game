import type { Weapon, WeaponWeightClass } from "../data/weapons";

export interface WeaponStatProfile {
  weightClass: WeaponWeightClass;
  label: string;
  damageAdd: number;
  damageMultiplier: number;
  cooldownAdd: number;
  cooldownMultiplier: number;
  critChanceAdd: number;
  critMultiplierAdd: number;
  rangeMultiplier: number;
  projectileSpeedMultiplier: number;
}

const PROFILE_BY_WEIGHT: Record<WeaponWeightClass, Omit<WeaponStatProfile, "weightClass">> = {
  light: {
    label: "轻武器",
    damageAdd: -2,
    damageMultiplier: 0.84,
    cooldownAdd: -0.055,
    cooldownMultiplier: 0.72,
    critChanceAdd: 0.06,
    critMultiplierAdd: 0.08,
    rangeMultiplier: 0.9,
    projectileSpeedMultiplier: 1.08,
  },
  standard: {
    label: "均衡武器",
    damageAdd: 0,
    damageMultiplier: 1,
    cooldownAdd: 0,
    cooldownMultiplier: 1,
    critChanceAdd: 0,
    critMultiplierAdd: 0,
    rangeMultiplier: 1,
    projectileSpeedMultiplier: 1,
  },
  heavy: {
    label: "重武器",
    damageAdd: 8,
    damageMultiplier: 1.36,
    cooldownAdd: 0.07,
    cooldownMultiplier: 1.28,
    critChanceAdd: -0.015,
    critMultiplierAdd: 0.28,
    rangeMultiplier: 1.18,
    projectileSpeedMultiplier: 0.92,
  },
  massive: {
    label: "超重武器",
    damageAdd: 16,
    damageMultiplier: 1.78,
    cooldownAdd: 0.12,
    cooldownMultiplier: 1.68,
    critChanceAdd: -0.025,
    critMultiplierAdd: 0.45,
    rangeMultiplier: 1.34,
    projectileSpeedMultiplier: 0.84,
  },
};

export function getWeaponWeightClass(weapon: Weapon | null | undefined): WeaponWeightClass {
  if (!weapon) return "standard";
  return weapon.weightClass ?? inferWeightClass(weapon);
}

export function getWeaponStatProfile(weapon: Weapon | null | undefined): WeaponStatProfile {
  const weightClass = getWeaponWeightClass(weapon);
  const base = PROFILE_BY_WEIGHT[weightClass];
  const sub = weapon?.subCategory ?? "";
  const attackMode = weapon?.attackMode ?? "ranged_projectile";
  const tags = weapon?.tags ?? [];
  let profile: WeaponStatProfile = { weightClass, ...base };

  if (sub.includes("combo") || tags.includes("crit")) {
    profile = { ...profile, cooldownAdd: profile.cooldownAdd - 0.015, critChanceAdd: profile.critChanceAdd + 0.035 };
  }
  if (sub.includes("pierce") || tags.includes("pierce")) {
    profile = { ...profile, projectileSpeedMultiplier: profile.projectileSpeedMultiplier + 0.08, rangeMultiplier: profile.rangeMultiplier + 0.06 };
  }
  if (sub.includes("field") || tags.includes("control")) {
    profile = { ...profile, cooldownMultiplier: profile.cooldownMultiplier + 0.12, rangeMultiplier: profile.rangeMultiplier + 0.12 };
  }
  if (attackMode === "summon") {
    profile = { ...profile, damageMultiplier: profile.damageMultiplier * 0.92, cooldownMultiplier: profile.cooldownMultiplier * 1.1 };
  }
  if (attackMode === "orbit") {
    profile = { ...profile, damageMultiplier: profile.damageMultiplier * 0.82, cooldownMultiplier: profile.cooldownMultiplier * 0.9 };
  }

  return profile;
}

export function getWeaponWeightLabel(weapon: Weapon | null | undefined): string {
  return getWeaponStatProfile(weapon).label;
}

function inferWeightClass(weapon: Weapon): WeaponWeightClass {
  const tags = weapon.tags ?? [];
  const text = `${weapon.subCategory ?? ""} ${tags.join(" ")}`;
  if (text.includes("massive") || text.includes("beacon")) return "massive";
  if (text.includes("heavy") || text.includes("slam") || text.includes("cleave")) return "heavy";
  if (text.includes("combo") || text.includes("return") || text.includes("swarm") || text.includes("speed")) return "light";
  return "standard";
}
