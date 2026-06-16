import { existsSync, readFileSync } from "node:fs";

const CHECKS = [
  { file: "src/entities/Projectile.ts", includes: ["spear_beam", "sword_wave", "shockwave", "renderArrow", "renderArcaneBolt", "renderEnergy", "renderShockwave"] },
  { file: "src/data/weapons.ts", includes: ["WeaponAttackMode", "EXTRA_WEAPONS", "visualRole", "melee_thrust", "melee_slam", "short_returning_blade"] },
  { file: "src/data/weaponExpansion.ts", includes: ["EXTRA_WEAPONS", "EXTRA_SKILLS", "MARTIAL_WEAPON_SEEDS", "MAGIC_WEAPON_SEEDS", "TECH_WEAPON_SEEDS", "UPGRADE_TEMPLATE", "turret_controller", "plasma_blade", "rune_book"] },
  { file: "src/data/skills.ts", includes: ["EXTRA_SKILLS", "tags?: string[]", "spear_beam", "mace_shockwave", "projectile_unlock", "shockwave"] },
  { file: "src/data/metaTalents.ts", includes: ["thunder_mark", "flame_vein", "frost_breath", "poison_spread", "arcane_ring", "guided_core"] },
  { file: "src/data/synergies.ts", includes: ["lightning_split_arrow", "lightning_spear_beam", "fire_mace_quake", "poison_blade_whirl", "arcane_drone"] },
  { file: "src/systems/SynergyRuntime.ts", includes: ["buildActiveSynergyIdSet", "getSkillSynergyHintText", "MetaTalentProgress"] },
  { file: "src/systems/SkillStageRuntime.ts", includes: ["getSkillStageInfo", "currentText", "nextText", "spear_shadow", "earthquake", "mace_shockwave"] },
  { file: "src/systems/HitEffectRuntime.ts", includes: ["getHitEffectStyle", "spear_beam", "shockwave", "synergyStyle"] },
  { file: "src/systems/BuildProgressRuntime.ts", includes: ["buildBuildProgress", "getWeapon", "crossbow", "plasma_blade", "thunder_arrow_array"] },
  { file: "src/systems/WeaponAttackRuntime.ts", includes: ["buildGenericProfile", "WeaponAttackProfile", "MeleeAttackType", "getWeaponAttackProfile", "isPointInMeleeArc"] },
  { file: "src/core/Game.ts", includes: ["buildActiveSynergyIdSet", "releaseSpearBeam", "releaseMaceQuake", "releaseMaceShockwaves", "applyProjectileSynergy", "renderMeleeFlashes"] },
  { file: "src/ui/LuckyUpgradePanel.ts", includes: ["getSkillSynergyHintText", "getSkillStageInfo", "stageText", "synergySuffix"] },
  { file: "src/ui/BuildEffectOverlay.ts", includes: ["buildBuildProgress", "renderBuildBadge", "renderSubtleAura", "renderHybridPulse", "visualRole"] },
  { file: "src/ui/StatsPanel.ts", includes: ["buildBuildProgress", "activeSynergyCount", "build.hybrid"] },
  { file: "docs/WEAPON_EXPANSION_AND_VISUAL_NOISE_PLAN.md", includes: ["30 把新武器", "300 张新升级卡", "视觉降噪", "枪芒不能自动攻击"] },
];

let failed = false;
function fail(message) { failed = true; console.error(`missing: ${message}`); }

for (const check of CHECKS) {
  if (!existsSync(check.file)) { fail(check.file); continue; }
  const text = readFileSync(check.file, "utf8");
  for (const needle of check.includes) {
    if (!text.includes(needle)) fail(`${check.file} -> ${needle}`);
  }
}

if (failed) process.exit(1);
console.log("combat feel checks ok");
