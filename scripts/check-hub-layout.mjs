import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const LAYOUT_FILE = "src/data/hubCampLayout.ts";
const ACTION_FILE = "src/data/hubActions.ts";
const HUB_ROOT = "public";

function fail(message) {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
}

function ok(message) {
  console.log(`✅ ${message}`);
}

function read(path) {
  if (!existsSync(path)) {
    fail(`找不到文件：${path}`);
    return "";
  }
  return readFileSync(path, "utf8");
}

const layout = read(LAYOUT_FILE);
const actions = read(ACTION_FILE);

const campW = Number(layout.match(/export const CAMP_W = (\d+)/)?.[1] ?? 0);
const campH = Number(layout.match(/export const CAMP_H = (\d+)/)?.[1] ?? 0);
if (campW <= 0 || campH <= 0) fail("CAMP_W / CAMP_H 无法解析或不是正数");
else ok(`营地尺寸 ${campW}×${campH}`);

const artPaths = [...layout.matchAll(/"(\/assets\/sprites\/hub\/[^"]+)"/g)].map((m) => m[1]);
const uniqueArtPaths = [...new Set(artPaths)];
let missingArt = 0;
for (const artPath of uniqueArtPaths) {
  const filePath = join(HUB_ROOT, artPath.replace(/^\//, ""));
  if (!existsSync(filePath)) {
    missingArt++;
    fail(`资源不存在：${artPath}`);
  }
}
if (uniqueArtPaths.length > 0 && missingArt === 0) ok(`营地资源路径检查通过：${uniqueArtPaths.length} 个`);

const buildingIds = [...layout.matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1]);
const idCount = new Map();
for (const id of buildingIds) idCount.set(id, (idCount.get(id) ?? 0) + 1);
const duplicates = [...idCount.entries()].filter(([, count]) => count > 1);
if (duplicates.length > 0) {
  for (const [id, count] of duplicates) fail(`建筑 id 重复：${id} × ${count}`);
} else if (buildingIds.length > 0) {
  ok(`建筑 id 无重复：${buildingIds.length} 个`);
}

const actionModuleIds = [...actions.matchAll(/moduleId:\s*"([^"]+)"/g)].map((m) => m[1]);
const actionSet = new Set(actionModuleIds);
for (const id of buildingIds) {
  if (!actionSet.has(id)) fail(`建筑没有对应 hubAction 映射：${id}`);
}
if (buildingIds.length > 0 && buildingIds.every((id) => actionSet.has(id))) ok("建筑 action 映射完整");

const rects = [...layout.matchAll(/\{\s*x:\s*(-?\d+(?:\.\d+)?),\s*y:\s*(-?\d+(?:\.\d+)?),\s*w:\s*(-?\d+(?:\.\d+)?),\s*h:\s*(-?\d+(?:\.\d+)?)\s*\}/g)];
let badRects = 0;
for (const match of rects) {
  const [, xs, ys, ws, hs] = match;
  const x = Number(xs);
  const y = Number(ys);
  const w = Number(ws);
  const h = Number(hs);
  if (w <= 0 || h <= 0) {
    badRects++;
    fail(`矩形尺寸非法：x=${x}, y=${y}, w=${w}, h=${h}`);
  }
  if (campW > 0 && campH > 0 && (x < -100 || y < -100 || x + w > campW + 100 || y + h > campH + 100)) {
    badRects++;
    fail(`矩形明显超出营地范围：x=${x}, y=${y}, w=${w}, h=${h}`);
  }
}
if (rects.length > 0 && badRects === 0) ok(`矩形坐标检查通过：${rects.length} 个`);

if (!process.exitCode) {
  console.log("营地布局静态检查完成：未发现明显问题。源码修改后仍需 npm run typecheck 和 npm run build。");
}
