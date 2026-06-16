import { existsSync, readFileSync } from "node:fs";

const CHECKS = [
  { file: "src/entities/Projectile.ts", includes: ["spear_beam", "sword_wave", "shockwave", "renderArrow", "renderArcaneBolt", "renderEnergy", "renderShockwave"] },
  { file: "src/data/weapons.ts", includes: ["WeaponAttackMode", "ranged_projectile", "melee_thrust", "melee_slam", "short_returning_blade"] },
  { file: "src/data/skills.ts", includes: ["tags?: string[]", "spear_beam", "mace_shockwave", "projectile_unlock", "shockwave"] },
  { file: "src/data/metaTalents.ts", includes: ["thunder_mark", "flame_vein", "frost_breath", "poison_spread", "arcane_ring", "guided_core"] },
  { file: "src/data/synergies.ts", includes: ["lightning_split_arrow", "lightning_spear_beam", "fire_mace_quake", "poison_blade_whirl", "arcane_drone"] },
  { file: "src/systems/SynergyRuntime.ts", includes: ["buildActiveSynergyIdSet", "getSkillSynergyHintText", "MetaTalentProgress"] },
  { file: "src/systems/SkillStageRuntime.ts", includes: ["getSkillStageInfo", "currentText", "nextText", "spear_shadow", "earthquake", "mace_shockwave"] },
  { file: "src/systems/HitEffectRuntime.ts", includes: ["getHitEffectStyle", "spear_beam", "shockwave", "synergyStyle"] },
  { file: "src/systems/BuildProgressRuntime.ts", includes: ["buildBuildProgress", "starter", "formed", "complete", "thunder_arrow_array", "lava_quake", "thunder_spear_array"] },
  { file: "src/systems/WeaponAttackRuntime.ts", includes: ["WeaponAttackProfile", "MeleeAttackType", "getWeaponAttackProfile", "isPointInMeleeArc"] },
  { file: "src/core/Game.ts", includes: ["buildActiveSynergyIdSet", "releaseSpearBeam", "releaseMaceQuake", "releaseMaceShockwaves", "applyProjectileSynergy", "renderMeleeFlashes"] },
  { file: "src/ui/LuckyUpgradePanel.ts", includes: ["getSkillSynergyHintText", "getSkillStageInfo", "stageText", "synergySuffix"] },
  { file: "src/ui/BuildEffectOverlay.ts", includes: ["buildBuildProgress", "renderBuildBadge", "renderHybridAura", "activeSynergyCount"] },
  { file: "src/ui/StatsPanel.ts", includes: ["buildBuildProgress", "activeSynergyCount", "build.hybrid"] },
  { file: "docs/COMBAT_FEEL_REWORK_PLAN.md", includes: ["UpgradeTags", "TalentTags", "SynergyRegistry", "BuildStageRuntime", "HitFeedbackRuntime"] },
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
