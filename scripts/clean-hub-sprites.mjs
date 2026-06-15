import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync, inflateSync } from "node:zlib";

const HUB_DIR = "public/assets/sprites/hub";
const BACKUP_DIR = join(HUB_DIR, "_originals");
const CLEAN_TARGET = /_(back|front)\.png$/i;

const EDGE_NEAR_WHITE = { r: 230, g: 230, b: 230 };
const GLOBAL_NEAR_WHITE = { r: 246, g: 246, b: 246 };
const CHECKER_NEUTRAL_DELTA = 18;
const CHECKER_LIGHT = 188;
const CHECKER_DARK = 70;

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
}

const CRC_TABLE = makeCrcTable();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data = Buffer.alloc(0)) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function parsePng(buf) {
  if (!buf.subarray(0, 8).equals(PNG_SIGNATURE)) throw new Error("不是有效 PNG 文件");

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idats = [];

  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.subarray(offset + 4, offset + 8).toString("ascii");
    const data = buf.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === "IDAT") {
      idats.push(data);
    } else if (type === "IEND") {
      break;
    }
  }

  if (bitDepth !== 8) throw new Error(`暂不支持 bitDepth=${bitDepth}`);
  if (colorType !== 6 && colorType !== 2) throw new Error(`暂不支持 colorType=${colorType}，仅支持 RGB/RGBA PNG`);

  return { width, height, colorType, raw: inflateSync(Buffer.concat(idats)) };
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function unfilter({ width, height, colorType, raw }) {
  const channels = colorType === 6 ? 4 : 3;
  const stride = width * channels;
  const out = Buffer.alloc(height * stride);
  let src = 0;

  for (let y = 0; y < height; y++) {
    const filter = raw[src++];
    const rowStart = y * stride;
    const prevStart = rowStart - stride;

    for (let x = 0; x < stride; x++) {
      const left = x >= channels ? out[rowStart + x - channels] : 0;
      const up = y > 0 ? out[prevStart + x] : 0;
      const upLeft = y > 0 && x >= channels ? out[prevStart + x - channels] : 0;
      const v = raw[src++];
      let result = v;
      if (filter === 1) result = (v + left) & 0xff;
      else if (filter === 2) result = (v + up) & 0xff;
      else if (filter === 3) result = (v + Math.floor((left + up) / 2)) & 0xff;
      else if (filter === 4) result = (v + paeth(left, up, upLeft)) & 0xff;
      else if (filter !== 0) throw new Error(`未知 PNG filter=${filter}`);
      out[rowStart + x] = result;
    }
  }

  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0, j = 0; i < out.length; i += channels, j += 4) {
    rgba[j] = out[i];
    rgba[j + 1] = out[i + 1];
    rgba[j + 2] = out[i + 2];
    rgba[j + 3] = channels === 4 ? out[i + 3] : 255;
  }
  return rgba;
}

function isNearWhite(r, g, b, threshold) {
  return r >= threshold.r && g >= threshold.g && b >= threshold.b;
}

function isCheckerPollution(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min > CHECKER_NEUTRAL_DELTA) return false;
  return max >= CHECKER_LIGHT || max <= CHECKER_DARK;
}

function cleanRgba(rgba, width, height) {
  const total = width * height;
  const seen = new Uint8Array(total);
  const stack = [];
  let removed = 0;

  const idxToOffset = (idx) => idx * 4;
  const isEdgeGarbage = (idx) => {
    const o = idxToOffset(idx);
    const a = rgba[o + 3];
    if (a === 0) return true;
    const r = rgba[o];
    const g = rgba[o + 1];
    const b = rgba[o + 2];
    return isNearWhite(r, g, b, EDGE_NEAR_WHITE) || isCheckerPollution(r, g, b);
  };

  const pushIf = (idx) => {
    if (idx < 0 || idx >= total || seen[idx]) return;
    if (!isEdgeGarbage(idx)) return;
    seen[idx] = 1;
    stack.push(idx);
  };

  for (let x = 0; x < width; x++) {
    pushIf(x);
    pushIf((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    pushIf(y * width);
    pushIf(y * width + width - 1);
  }

  while (stack.length > 0) {
    const idx = stack.pop();
    const x = idx % width;
    const y = Math.floor(idx / width);
    if (x > 0) pushIf(idx - 1);
    if (x < width - 1) pushIf(idx + 1);
    if (y > 0) pushIf(idx - width);
    if (y < height - 1) pushIf(idx + width);
  }

  for (let idx = 0; idx < total; idx++) {
    const o = idxToOffset(idx);
    const r = rgba[o];
    const g = rgba[o + 1];
    const b = rgba[o + 2];
    const a = rgba[o + 3];
    const globalWhite = a > 0 && isNearWhite(r, g, b, GLOBAL_NEAR_WHITE);
    if ((seen[idx] || globalWhite) && rgba[o + 3] !== 0) {
      rgba[o + 3] = 0;
      removed++;
    }
  }

  return removed;
}

function encodeRgbaPng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const scanlines = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    const rowOut = y * (stride + 1);
    scanlines[rowOut] = 0;
    rgba.copy(scanlines, rowOut + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    PNG_SIGNATURE,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(scanlines, { level: 9 })),
    chunk("IEND"),
  ]);
}

function cleanFile(file) {
  const source = join(HUB_DIR, file);
  const backup = join(BACKUP_DIR, file);
  if (!existsSync(backup)) copyFileSync(source, backup);

  const parsed = parsePng(readFileSync(source));
  const rgba = unfilter(parsed);
  const removed = cleanRgba(rgba, parsed.width, parsed.height);
  writeFileSync(source, encodeRgbaPng(parsed.width, parsed.height, rgba));
  return { file, removed, total: parsed.width * parsed.height };
}

if (!existsSync(HUB_DIR)) {
  console.error(`找不到目录：${HUB_DIR}`);
  process.exit(1);
}
mkdirSync(BACKUP_DIR, { recursive: true });

const files = readdirSync(HUB_DIR).filter((file) => CLEAN_TARGET.test(file));
if (files.length === 0) {
  console.log("没有找到需要清理的营地建筑 PNG。目标格式：*_back.png / *_front.png");
  process.exit(0);
}

let totalRemoved = 0;
for (const file of files) {
  try {
    const result = cleanFile(file);
    totalRemoved += result.removed;
    console.log(`${result.file}: 清理 ${result.removed}/${result.total} 像素`);
  } catch (error) {
    console.warn(`${file}: 跳过，${error instanceof Error ? error.message : String(error)}`);
  }
}
console.log(`完成：共清理 ${files.length} 张建筑图，透明化像素 ${totalRemoved} 个。原图备份在 ${BACKUP_DIR}`);
