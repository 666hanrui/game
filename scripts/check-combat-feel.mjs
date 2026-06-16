import { existsSync, readFileSync } from "node:fs";

const CHECKS = [
  {
    file: "src/entities/Projectile.ts",
    includes: [
      "spear_beam",
      "sword_wave",
      "shockwave",
      "renderArrow",
      "renderArcaneBolt",
      "renderRuneBolt",
      "renderEnergy",
      "renderDronePulse",
      "renderSpearBeam",
      "renderSwordWave",
      "renderShockwave",
      "玩家侧投射物不再被通用资源图覆盖",
    ],
  },
  {
    file: "src/data/weapons.ts",
    includes: [
      "WeaponAttackMode",
      "ranged_projectile",
      "melee_thrust",
      "melee_slam",
      "short_returning_blade",
      "attackMode",
    ],
  },
  {
    file: "src/data/skills.ts",
    includes: [
      "tags?: string[]",
      "spear_beam",
      "mace_shockwave",
      "projectile_unlock",
      "shockwave",
    ],
  },
  {
    file: "src/data/metaTalents.ts",
    includes: [
      "雷纹共鸣",
      "炎脉涌动",
      "霜息凝痕",
      "毒蚀蔓延",
      "奥术星环",
      "机巧制导",
      "lightning",
      "fire",
      "ice",
      "poison",
      "arcane",
      "tech",
    ],
  },
  {
    file: "src/data/synergies.ts",
    includes: [
      "雷羽分裂",
      "雷贯枪芒",
      "熔岩地裂",
      "毒刃回旋",
      "奥术无人机",
      "getSynergyHintsForSkill",
    ],
  },
  {
    file: "src/systems/SynergyRuntime.ts",
    includes: [
      "buildActiveSynergyIdSet",
      "getSkillSynergyHintText",
      "MetaTalentProgress",
      "选择后联动",
      "已激活联动",
    ],
  },
  {
    file: "src/systems/WeaponAttackRuntime.ts",
    includes: [
      "WeaponAttackProfile",
      "MeleeAttackType",
      "getWeaponAttackProfile",
      "isPointInMeleeArc",
      "meleeRange",
      "meleeDamageMultiplier",
    ],
  },
  {
    file: "src/core/Game.ts",
    includes: [
      "buildActiveSynergyIdSet",
      "releaseSpearBeam",
      "releaseMaceQuake",
      "releaseMaceShockwaves",
      "applyProjectileSynergy",
      "chainLightningFrom",
      "performMeleeAttack",
      "renderMeleeFlashes",
    ],
  },
  {
    file: "src/ui/LuckyUpgradePanel.ts",
    includes: [
      "getSkillSynergyHintText",
      "synergyText",
      "synergySuffix",
    ],
  },
  {
    file: "docs/COMBAT_FEEL_REWORK_PLAN.md",
    includes: [
      "升级卡负责武器机制",
      "天赋负责元素倾向",
      "联动由代码自动触发",
      "不要额外新增",
    ],
  },
];

let failed = false;

function fail(message) {
  failed = true;
  console.error(`❌ ${message}`);
}

function ok(message) {
  console.log(`✅ ${message}`);
}

for (const check of CHECKS) {
  if (!existsSync(check.file)) {
    fail(`找不到文件：${check.file}`);
    continue;
  }
  const text = readFileSync(check.file, "utf8");
  for (const needle of check.includes) {
    if (!text.includes(needle)) fail(`${check.file} 缺少关键内容：${needle}`);
  }
}

if (failed) {
  console.error("战斗爽感检查失败：请确认攻击形态、升级派生、天赋标签、隐藏联动和升级提示没有被覆盖。 ");
  process.exit(1);
}

ok("战斗爽感前四阶段关键点检查通过。");
