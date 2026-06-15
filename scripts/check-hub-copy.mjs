import { existsSync, readFileSync } from "node:fs";

const FILES = [
  "src/data/hubModules.ts",
  "src/data/hubCampLayout.ts",
];

const FORBIDDEN_PATTERNS = [
  /open_[a-z_]+/,
  /HubSubPanelManager/,
  /MetaTalentPanel/,
  /CraftingPanel/,
  /MaterialStoragePanel/,
  /EconomyStoragePanel/,
  /QuestBoardPanel/,
  /WorkshopPanel/,
  /ApothecaryPanel/,
  /LootPanel/,
  /RegionMapPanel/,
  /ArchivePanel/,
  /game\.[a-zA-Z0-9_]+/,
  /return\s+[a-zA-Z0-9_]+/,
];

let failed = false;

function fail(message) {
  failed = true;
  console.error(`❌ ${message}`);
}

function ok(message) {
  console.log(`✅ ${message}`);
}

for (const file of FILES) {
  if (!existsSync(file)) {
    fail(`找不到文件：${file}`);
    continue;
  }

  const lines = readFileSync(file, "utf8").split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isPlayerFacing = /description:|unlockHint:|line:|name:/.test(line);
    if (!isPlayerFacing) continue;
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(line)) {
        fail(`${file}:${i + 1} 玩家文案疑似混入开发术语：${line.trim()}`);
      }
    }
  }
}

if (failed) {
  console.error("营地文案检查失败：请把玩家可见文字改成世界观/玩法描述，不要写内部类名或动作 id。 ");
  process.exit(1);
}

ok("营地玩家可见文案未发现明显开发术语。");
