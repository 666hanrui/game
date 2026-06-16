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
  console.error("战斗爽感检查失败：请确认投射物视觉、武器攻击形态和重构文档没有被覆盖。 ");
  process.exit(1);
}

ok("战斗爽感第一批关键点检查通过。");
