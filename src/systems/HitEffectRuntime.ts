import type { ProjectileKind } from "../entities/Projectile";

export interface HitEffectStyle {
  name: string;
  color: string;
  sparkCount: number;
  sparkSize: number;
  force: number;
  textPrefix: string;
  ring: boolean;
}

export function getHitEffectStyle(kind: ProjectileKind, critical = false, synergyIds: Set<string> = new Set()): HitEffectStyle {
  const base = baseStyle(kind);
  const extra = synergyStyle(synergyIds);
  return {
    name: extra?.name ?? base.name,
    color: extra?.color ?? base.color,
    sparkCount: base.sparkCount + (extra ? 5 : 0) + (critical ? 8 : 0),
    sparkSize: base.sparkSize + (critical ? 1.2 : 0),
    force: base.force + (extra ? 36 : 0) + (critical ? 80 : 0),
    textPrefix: critical ? "暴击 " : base.textPrefix,
    ring: base.ring || Boolean(extra) || critical,
  };
}

function baseStyle(kind: ProjectileKind): HitEffectStyle {
  switch (kind) {
    case "arrow": return style("箭矢", "#fff9c4", 7, 2.6, 120, false);
    case "magic": return style("奥术", "#ce93d8", 10, 3.1, 150, true);
    case "heavy_magic": return style("符文", "#b39ddb", 14, 3.5, 175, true);
    case "energy": return style("电子", "#4dd0e1", 11, 2.8, 165, true);
    case "drone": return style("脉冲", "#80deea", 9, 2.4, 155, false);
    case "blade": return style("切割", "#ffcc80", 10, 2.5, 170, false);
    case "hammer": return style("重击", "#bc8f5a", 13, 3.4, 190, true);
    case "spear_beam": return style("枪芒", "#90caf9", 11, 2.7, 175, false);
    case "sword_wave": return style("剑气", "#e1bee7", 11, 2.8, 170, false);
    case "shockwave": return style("地裂", "#bc8f5a", 14, 3.5, 205, true);
    default: return style("命中", "#ffffff", 7, 2.5, 120, false);
  }
}

function style(name: string, color: string, sparkCount: number, sparkSize: number, force: number, ring: boolean): HitEffectStyle {
  return { name, color, sparkCount, sparkSize, force, textPrefix: "", ring };
}

function synergyStyle(ids: Set<string>): { name: string; color: string } | null {
  if (ids.has("lightning_split_arrow") || ids.has("lightning_spear_beam")) return { name: "电弧", color: "#90caf9" };
  if (ids.has("fire_explosive_arrow") || ids.has("fire_mace_quake")) return { name: "火焰", color: "#ff7043" };
  if (ids.has("ice_frost_arrow") || ids.has("ice_spear_beam") || ids.has("ice_mace_quake")) return { name: "冰霜", color: "#80deea" };
  if (ids.has("poison_blade_whirl")) return { name: "毒蚀", color: "#81c784" };
  if (ids.has("arcane_drone")) return { name: "奥术", color: "#b39ddb" };
  return null;
}
