import { existsSync, readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";

const PUBLIC_ROOT = "public";
const ASSET_MANIFEST = "src/data/assetManifest.ts";
const HUB_DIR = "public/assets/sprites/hub";
const RACE_DIR = "public/assets/sprites/races";
const ENEMY_DIR = "public/assets/sprites/enemies";
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

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

function readText(path) {
  if (!existsSync(path)) {
    fail(`找不到文件：${path}`);
    return "";
  }
  return readFileSync(path, "utf8");
}

function readPngInfo(path) {
  const buf = readFileSync(path);
  if (!buf.subarray(0, 8).equals(PNG_SIGNATURE)) throw new Error("不是 PNG 文件");
  let offset = 8;
  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.subarray(offset + 4, offset + 8).toString("ascii");
    const data = buf.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      return {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        bitDepth: data[8],
        colorType: data[9],
      };
    }
    offset += 12 + length;
  }
  throw new Error("缺少 IHDR");
}

function publicPathToFile(path) {
  return join(PUBLIC_ROOT, path.replace(/^\//, ""));
}

function checkManifestPaths() {
  const manifest = readText(ASSET_MANIFEST);
  const paths = [...manifest.matchAll(/"(\/assets\/[^"]+)"/g)].map((m) => m[1]);
  const unique = [...new Set(paths)];
  let missing = 0;
  let invalidPng = 0;

  for (const path of unique) {
    const file = publicPathToFile(path);
    if (!existsSync(file)) {
      missing++;
      fail(`assetManifest 引用不存在：${path}`);
      continue;
    }
    if (extname(file).toLowerCase() === ".png") {
      try {
        const info = readPngInfo(file);
        if (info.bitDepth !== 8) warn(`${path} bitDepth=${info.bitDepth}，脚本清理可能不支持`);
        if (![2, 6].includes(info.colorType)) warn(`${path} colorType=${info.colorType}，脚本清理可能不支持`);
      } catch (error) {
        invalidPng++;
        fail(`${path} PNG 解析失败：${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  if (unique.length > 0 && missing === 0 && invalidPng === 0) ok(`assetManifest 资源存在且 PNG 可读：${unique.length} 个`);
}

function checkHubPairs() {
  if (!existsSync(HUB_DIR)) {
    fail(`找不到营地资源目录：${HUB_DIR}`);
    return;
  }
  const files = readdirSync(HUB_DIR);
  const backs = files.filter((f) => f.endsWith("_back.png"));
  let missing = 0;
  for (const back of backs) {
    const prefix = back.replace(/_back\.png$/, "");
    const front = `${prefix}_front.png`;
    if (!files.includes(front)) {
      missing++;
      fail(`营地建筑缺少 front 层：${front}`);
    }
  }
  const fronts = files.filter((f) => f.endsWith("_front.png"));
  for (const front of fronts) {
    const prefix = front.replace(/_front\.png$/, "");
    const back = `${prefix}_back.png`;
    if (!files.includes(back)) {
      missing++;
      fail(`营地建筑缺少 back 层：${back}`);
    }
  }
  if (backs.length > 0 && missing === 0) ok(`营地 back/front 成对：${backs.length} 组`);
}

function checkWalkSheets() {
  if (!existsSync(RACE_DIR)) {
    fail(`找不到种族资源目录：${RACE_DIR}`);
    return;
  }
  const files = readdirSync(RACE_DIR).filter((f) => f.endsWith("_walk.png"));
  let bad = 0;
  for (const file of files) {
    const path = join(RACE_DIR, file);
    try {
      const info = readPngInfo(path);
      if (info.width % 4 !== 0 || info.height % 4 !== 0) {
        bad++;
        fail(`${file} 不是标准 4×4 walk sheet：${info.width}×${info.height}`);
      }
      const frameW = info.width / 4;
      const frameH = info.height / 4;
      if (Math.abs(frameW - frameH) > Math.max(frameW, frameH) * 0.45) {
        warn(`${file} 单帧比例较怪：${frameW}×${frameH}`);
      }
    } catch (error) {
      bad++;
      fail(`${file} 解析失败：${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (files.length > 0 && bad === 0) ok(`种族 walk sheet 结构检查通过：${files.length} 张`);
}

function checkEnemyPngs() {
  if (!existsSync(ENEMY_DIR)) {
    warn(`找不到怪物资源目录：${ENEMY_DIR}`);
    return;
  }
  const files = readdirSync(ENEMY_DIR).filter((f) => f.endsWith(".png"));
  let bad = 0;
  for (const file of files) {
    try {
      readPngInfo(join(ENEMY_DIR, file));
    } catch (error) {
      bad++;
      fail(`${file} PNG 解析失败：${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (files.length > 0 && bad === 0) ok(`怪物 PNG 可读：${files.length} 张`);
}

checkManifestPaths();
checkHubPairs();
checkWalkSheets();
checkEnemyPngs();

if (failed) {
  console.error("美术资源检查失败，请先修复上面的资源问题。");
  process.exit(1);
}

console.log("美术资源总检查完成：未发现明显问题。");
