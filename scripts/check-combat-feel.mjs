import { existsSync, readFileSync } from "node:fs";

const CHECKS = [
  { file: "src/entities/Projectile.ts", includes: ["ProjectileHitShape", "ProjectileHitProfile", "ProjectileRenderQuality", "hitProfile", "hitsCircle", "distToSegmentSq", "capsule", "wide_wave", "perf", "fullDraws", "simpleDraws", "takeSpawnToken", "takeShockVisualSlot", "renderCheap", "nextTrackAt", "cachedTargetIndex"] },
  { file: "src/systems/SpatialHashGrid.ts", includes: ["SpatialHashGrid", "rebuild", "queryCircle", "cellSize"] },
  { file: "src/systems/CombatPerformanceRuntime.ts", includes: ["CombatPerformanceRuntime", "beforeGameUpdate", "afterGameUpdate", "SpatialHashGrid", "patch", "updateTrackingArrows", "maxEnemyProjectiles", "maxShockwaves", "trimProjectiles", "keepNearest"] },
  { file: "src/main.ts", includes: ["CombatPerformanceRuntime", "combatPerformance.beforeGameUpdate(game)", "combatPerformance.afterGameUpdate(game)"] },
  { file: "src/systems/CombatSystem.ts", includes: ["p.hitsCircle(e.pos, e.radius)"] },
  { file: "src/data/weapons.ts", includes: ["WeaponAttackMode", "WeaponWeightClass", "weightClass", "EXTRA_WEAPONS", "visualRole"] },
  { file: "src/data/weaponExpansion.ts", includes: ["EXTRA_WEAPONS", "EXTRA_SKILLS", "MARTIAL_WEAPON_SEEDS", "MAGIC_WEAPON_SEEDS", "TECH_WEAPON_SEEDS", "UPGRADE_TEMPLATE"] },
  { file: "src/systems/WeaponStatRuntime.ts", includes: ["WeaponStatProfile", "getWeaponStatProfile", "getWeaponWeightClass", "getWeaponWeightLabel", "damageMultiplier", "cooldownMultiplier", "light", "standard", "heavy", "massive"] },
  { file: "src/systems/WeaponAttackRuntime.ts", includes: ["MeleeHitShape", "hitShape", "visualLength", "visualWidth", "visualArc", "stats.damageMultiplier", "meleeDamageMultiplier", "isPointInMeleeArc"] },
  { file: "src/ui/UpgradePanel.ts", includes: ["pageSize = 9", "handleWheel", "lastRenderAt", "addEventListener(\"wheel\"", "getWeaponWeightLabel", "上一页", "下一页"] },
  { file: "src/data/skills.ts", includes: ["EXTRA_SKILLS", "tags?: string[]", "spear_beam", "mace_shockwave", "projectile_unlock", "shockwave"] },
  { file: "src/data/metaTalents.ts", includes: ["thunder_mark", "flame_vein", "frost_breath", "poison_spread", "arcane_ring", "guided_core"] },
  { file: "src/data/synergies.ts", includes: ["lightning_split_arrow", "lightning_spear_beam", "fire_mace_quake", "poison_blade_whirl", "arcane_drone"] },
  { file: "src/systems/SynergyRuntime.ts", includes: ["buildActiveSynergyIdSet", "getSkillSynergyHintText", "MetaTalentProgress"] },
  { file: "src/systems/BuildProgressRuntime.ts", includes: ["buildBuildProgress", "getWeapon", "crossbow", "plasma_blade", "thunder_arrow_array"] },
  { file: "src/core/Game.ts", includes: ["buildActiveSynergyIdSet", "releaseSpearBeam", "releaseMaceQuake", "releaseMaceShockwaves", "applyProjectileSynergy", "renderMeleeFlashes"] },
  { file: "src/ui/BuildEffectOverlay.ts", includes: ["buildBuildProgress", "renderSubtleAura", "renderHybridPulse", "visualRole"] },
  { file: "docs/WEAPON_EXPANSION_AND_VISUAL_NOISE_PLAN.md", includes: ["30 把新武器", "300 张新升级卡", "视觉降噪", "枪芒不能自动攻击"] },
  { file: "docs/PROJECTILE_PERFORMANCE_REWORK.md", includes: ["Projectile performance rework", "Spatial hash grid", "Tracking throttle", "Local validation"] },
];

let failed = false;
function fail(message) { failed = true; console.error(`missing: ${message}`); }

for (const check of CHECKS) {
  if (!existsSync(check.file)) { fail(check.file); continue; }
  const text = readFileSync(check.file, "utf8");
  for (const needle of check.includes) if (!text.includes(needle)) fail(`${check.file} -> ${needle}`);
}

const overlayText = readFileSync("src/ui/BuildEffectOverlay.ts", "utf8");
if (overlayText.includes("fillText(label")) fail("overlay label text still exists");
if (overlayText.includes("renderBuildBadge")) fail("overlay badge still exists");

const weaponPanelText = readFileSync("src/ui/UpgradePanel.ts", "utf8");
if (weaponPanelText.includes("const rows = Math.ceil(count / cols)")) fail("weapon panel still uses unbounded rows");

if (failed) process.exit(1);
console.log("combat feel checks ok");
