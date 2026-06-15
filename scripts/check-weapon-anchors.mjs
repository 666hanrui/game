import { existsSync, readFileSync } from "node:fs";

const WEAPONS_FILE = "src/data/weapons.ts";
const ANCHORS_FILE = "src/data/weaponAnchors.ts";

let failed = false;

function fail(message) {
  failed = true;
  console.error(`❌ ${message}`);
}

function ok(message) {
  console.log(`✅ ${message}`);
}

function warn(message) {
  console.warn(`⚠️ ${message}`);
}

function read(path) {
  if (!existsSync(path)) {
    fail(`找不到文件：${path}`);
    return "";
  }
  return readFileSync(path, "utf8");
}

const weapons = read(WEAPONS_FILE);
const anchors = read(ANCHORS_FILE);

const weaponIds = [...weapons.matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1]);
const anchorIds = [...anchors.matchAll(/^\s*([a-zA-Z0-9_]+):\s*directional\(/gm)].map((m) => m[1]);

const weaponSet = new Set(weaponIds);
const anchorSet = new Set(anchorIds);

if (weaponIds.length === 0) fail("没有从 weapons.ts 中解析到武器 id");
else ok(`解析武器 id：${weaponIds.length} 个`);

if (anchorIds.length === 0) fail("没有从 weaponAnchors.ts 中解析到人族挂点 id");
else ok(`解析人族挂点 id：${anchorIds.length} 个`);

for (const id of weaponSet) {
  if (!anchorSet.has(id)) warn(`武器缺少人族精细挂点，将使用默认挂点：${id}`);
}

for (const id of anchorSet) {
  if (!weaponSet.has(id)) warn(`挂点表中存在未在 weapons.ts 注册的武器：${id}`);
}

const requiredFields = [
  "handRadius",
  "handOffsetY",
  "rotationOffset",
  "size",
  "fistOffsetX",
  "fistOffsetY",
];
for (const field of requiredFields) {
  if (!anchors.includes(field)) fail(`weaponAnchors.ts 缺少关键字段：${field}`);
}

const directionKeys = ["down", "up", "left", "right"];
for (const direction of directionKeys) {
  if (!anchors.includes(`${direction}: frames`)) fail(`weaponAnchors.ts directional() 可能缺少方向：${direction}`);
}

if (failed) {
  console.error("武器挂点检查失败。请先修复上面的问题。");
  process.exit(1);
}

console.log("武器挂点检查完成：没有发现结构性错误。缺少挂点的武器会走默认姿势，但建议后续补齐。");
