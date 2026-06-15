import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const LAYOUT_FILE = "src/data/hubCampLayout.ts";
const OUT_FILE = "docs/generated/hub-layout-preview.svg";

function read(path) {
  if (!existsSync(path)) throw new Error(`找不到文件：${path}`);
  return readFileSync(path, "utf8");
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function rectAttrs(rect) {
  return `x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}"`;
}

function parseNumber(source, name, fallback = 0) {
  return Number(source.match(new RegExp(`export const ${name} = (\\d+)`))?.[1] ?? fallback);
}

function parseRect(text) {
  const m = text.match(/\{\s*x:\s*(-?\d+(?:\.\d+)?),\s*y:\s*(-?\d+(?:\.\d+)?),\s*w:\s*(-?\d+(?:\.\d+)?),\s*h:\s*(-?\d+(?:\.\d+)?)\s*\}/);
  if (!m) return null;
  return { x: Number(m[1]), y: Number(m[2]), w: Number(m[3]), h: Number(m[4]) };
}

function parsePoint(text) {
  const m = text.match(/interactPoint:\s*\{\s*x:\s*(-?\d+(?:\.\d+)?),\s*y:\s*(-?\d+(?:\.\d+)?)\s*\}/);
  if (!m) return null;
  return { x: Number(m[1]), y: Number(m[2]) };
}

function parseBuildings(source) {
  const rows = source
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("{ id:"));

  return rows.map((line) => {
    const id = line.match(/id:\s*"([^"]+)"/)?.[1] ?? "unknown";
    const name = line.match(/name:\s*"([^"]+)"/)?.[1] ?? id;
    const icon = line.match(/icon:\s*"([^"]+)"/)?.[1] ?? "";
    const x = Number(line.match(/x:\s*(-?\d+(?:\.\d+)?)/)?.[1] ?? 0);
    const y = Number(line.match(/y:\s*(-?\d+(?:\.\d+)?)/)?.[1] ?? 0);
    const w = Number(line.match(/w:\s*(-?\d+(?:\.\d+)?)/)?.[1] ?? 0);
    const h = Number(line.match(/h:\s*(-?\d+(?:\.\d+)?)/)?.[1] ?? 0);
    const footprint = parseRect(line.match(/footprint:\s*(\{[^}]+\})/)?.[1] ?? "");
    const interactPoint = parsePoint(line);
    const solidRectsRaw = line.match(/solidRects:\s*\[(.*?)\],\s*interactPoint/)?.[1] ?? "";
    const solidRects = [...solidRectsRaw.matchAll(/\{[^}]+\}/g)]
      .map((m) => parseRect(m[0]))
      .filter(Boolean);
    return { id, name, icon, x, y, w, h, footprint, interactPoint, solidRects };
  });
}

const source = read(LAYOUT_FILE);
const campW = parseNumber(source, "CAMP_W", 1320);
const campH = parseNumber(source, "CAMP_H", 860);
const buildings = parseBuildings(source);

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${campW}" height="${campH}" viewBox="0 0 ${campW} ${campH}">
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="${campW}" height="${campH}" fill="#315a2f"/>
  <rect width="${campW}" height="${campH}" fill="url(#grid)"/>
  <rect x="24" y="24" width="${campW - 48}" height="${campH - 48}" fill="none" stroke="#d6ff9f" stroke-width="2" stroke-dasharray="10 8" opacity="0.65"/>
  <text x="28" y="38" fill="#fff8dc" font-size="24" font-family="monospace" font-weight="700">Hub Layout Preview</text>
  <text x="28" y="64" fill="#d9f2c7" font-size="14" font-family="monospace">yellow=building image, blue=footprint, red=solid collision, cyan=interact point</text>

${buildings.map((b) => {
  const labelX = b.x + b.w / 2;
  const labelY = b.y - 8;
  return `  <g id="${escapeXml(b.id)}">
    <rect ${rectAttrs(b)} fill="rgba(255, 202, 40, 0.12)" stroke="#ffca28" stroke-width="2"/>
    ${b.footprint ? `<rect ${rectAttrs(b.footprint)} fill="rgba(33, 150, 243, 0.18)" stroke="#40c4ff" stroke-width="2"/>` : ""}
    ${b.solidRects.map((r) => `<rect ${rectAttrs(r)} fill="rgba(255, 82, 82, 0.20)" stroke="#ff5252" stroke-width="2"/>`).join("\n    ")}
    ${b.interactPoint ? `<circle cx="${b.interactPoint.x}" cy="${b.interactPoint.y}" r="7" fill="#00e5ff" stroke="#003b46" stroke-width="2"/>` : ""}
    <text x="${labelX}" y="${labelY}" text-anchor="middle" fill="#fff8dc" font-size="16" font-family="monospace" font-weight="700">${escapeXml(b.icon)} ${escapeXml(b.name)}</text>
    <text x="${labelX}" y="${labelY + 18}" text-anchor="middle" fill="#d9f2c7" font-size="11" font-family="monospace">${escapeXml(b.id)}</text>
  </g>`;
}).join("\n")}
</svg>
`;

mkdirSync(dirname(OUT_FILE), { recursive: true });
writeFileSync(OUT_FILE, svg, "utf8");
console.log(`已导出营地布局预览：${OUT_FILE}`);
console.log(`建筑数量：${buildings.length}`);
