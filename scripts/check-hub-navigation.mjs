import { existsSync, readFileSync } from "node:fs";

const CHECKS = [
  {
    file: "src/ui/HubCampPanel.ts",
    includes: [
      "drawHubCampMinimap",
      "pickHubCampMinimapModule",
      "drawSelectedBuildingGuide",
      "drawTargetInteractMarker",
      "cycleSelectedBuilding",
      "targetCycleQueued",
      "Tab 切换目标",
    ],
  },
  {
    file: "src/ui/HubCampMinimap.ts",
    includes: [
      "pickHubCampMinimapModule",
      "getMinimapLayout",
      "miniToWorld",
      "可交互",
      "目标",
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
    if (!text.includes(needle)) fail(`${check.file} 缺少导航关键点：${needle}`);
  }
}

if (failed) {
  console.error("营地导航检查失败：请确认小地图、目标箭头、目标光圈和 Tab 切换没有被覆盖。 ");
  process.exit(1);
}

ok("营地导航关键点检查通过。");
