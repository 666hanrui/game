import type { Skill, SkillRarity } from "../data/skills";
import { buildSynergySnapshot } from "./SynergyRuntime";
import { MetaTalentProgress } from "./MetaTalentProgress";

export type BuildRouteId = "bow" | "spear" | "blade" | "mace" | "magic" | "tech" | "martial" | "neutral";
export type BuildStageId = "none" | "starter" | "formed" | "complete";

export interface RouteProgress {
  id: BuildRouteId;
  name: string;
  color: string;
  points: number;
  stage: BuildStageId;
  stageName: string;
}

export interface HybridBuildProgress {
  id: string;
  name: string;
  color: string;
  description: string;
  powerLevel: number;
}

export interface BuildProgressSnapshot {
  primary: RouteProgress;
  routes: RouteProgress[];
  activeSynergyNames: string[];
  activeSynergyCount: number;
  hybrid: HybridBuildProgress | null;
  label: string;
  color: string;
  score: number;
}

const ROUTE_META: Record<BuildRouteId, { name: string; color: string; starter: string; formed: string; complete: string }> = {
  bow: { name: "箭术", color: "#aed581", starter: "箭术初成", formed: "箭术成型", complete: "箭术大成" },
  spear: { name: "枪术", color: "#90caf9", starter: "长枪初成", formed: "枪术成型", complete: "枪术大成" },
  blade: { name: "飞刃", color: "#ffcc80", starter: "飞刃起势", formed: "飞刃成型", complete: "飞刃风暴" },
  mace: { name: "钝器", color: "#bc8f5a", starter: "钝器发力", formed: "钝器成型", complete: "钝器霸体" },
  magic: { name: "奥术", color: "#ce93d8", starter: "奥术入门", formed: "奥术成型", complete: "奥术大成" },
  tech: { name: "科技", color: "#4dd0e1", starter: "科技起势", formed: "科技成型", complete: "科技过载" },
  martial: { name: "武技", color: "#ffd180", starter: "武技初成", formed: "武技成型", complete: "武技大成" },
  neutral: { name: "通用", color: "#b0bec5", starter: "基础扎实", formed: "全能成型", complete: "全能大成" },
};

const RARITY_WEIGHT: Record<SkillRarity, number> = {
  common: 1,
  rare: 1.15,
  epic: 1.35,
  legendary: 1.8,
  diamond: 2.6,
};

export function buildBuildProgress(skills: Skill[], weaponId?: string | null): BuildProgressSnapshot {
  const routePoints = new Map<BuildRouteId, number>();
  for (const id of Object.keys(ROUTE_META) as BuildRouteId[]) routePoints.set(id, 0);

  if (weaponId) {
    const weaponRoute = routeFromWeapon(weaponId);
    routePoints.set(weaponRoute, (routePoints.get(weaponRoute) ?? 0) + 1);
  }

  for (const skill of skills) {
    const route = routeFromSkill(skill);
    const weight = RARITY_WEIGHT[skill.rarity] ?? 1;
    routePoints.set(route, (routePoints.get(route) ?? 0) + weight);

    if (skill.school === "martial" && route !== "martial") {
      routePoints.set("martial", (routePoints.get("martial") ?? 0) + weight * 0.35);
    }
  }

  const routes = [...routePoints.entries()]
    .map(([id, points]) => buildRouteProgress(id, points))
    .sort((a, b) => b.points - a.points);

  const primary = routes[0] ?? buildRouteProgress("neutral", 0);
  const skillIds = skills.map((skill) => skill.id);
  const equippedTalents = new MetaTalentProgress().getEquippedTalents();
  const synergySnapshot = buildSynergySnapshot(skillIds, equippedTalents);
  const hybrid = pickHybrid(primary, synergySnapshot.activeIds, synergySnapshot.activeSynergies.length);
  const label = hybrid?.name ?? primary.stageName;
  const color = hybrid?.color ?? primary.color;
  const score = primary.points + synergySnapshot.activeSynergies.length * 1.35 + (hybrid ? hybrid.powerLevel * 1.5 : 0);

  return {
    primary,
    routes,
    activeSynergyNames: synergySnapshot.activeSynergies.map((synergy) => synergy.name),
    activeSynergyCount: synergySnapshot.activeSynergies.length,
    hybrid,
    label,
    color,
    score,
  };
}

function buildRouteProgress(id: BuildRouteId, points: number): RouteProgress {
  const stage = stageFromPoints(points);
  const meta = ROUTE_META[id];
  const stageName = stage === "complete" ? meta.complete : stage === "formed" ? meta.formed : stage === "starter" ? meta.starter : "待成型";
  return { id, name: meta.name, color: meta.color, points, stage, stageName };
}

function stageFromPoints(points: number): BuildStageId {
  if (points >= 7) return "complete";
  if (points >= 4) return "formed";
  if (points >= 2) return "starter";
  return "none";
}

function routeFromWeapon(weaponId: string): BuildRouteId {
  if (weaponId === "bow") return "bow";
  if (weaponId === "spear") return "spear";
  if (weaponId === "flying_blade") return "blade";
  if (weaponId === "mace") return "mace";
  if (weaponId === "wand" || weaponId === "staff" || weaponId === "orb") return "magic";
  if (weaponId === "drone_core" || weaponId === "energy_core") return "tech";
  return "neutral";
}

function routeFromSkill(skill: Skill): BuildRouteId {
  if (skill.weapon) return routeFromWeapon(skill.weapon);
  if (skill.tags?.includes("bow")) return "bow";
  if (skill.tags?.includes("spear")) return "spear";
  if (skill.tags?.includes("blade")) return "blade";
  if (skill.tags?.includes("mace")) return "mace";
  if (skill.school === "magic") return "magic";
  if (skill.school === "tech") return "tech";
  if (skill.school === "martial") return "martial";
  return "neutral";
}

function pickHybrid(primary: RouteProgress, activeIds: Set<string>, synergyCount: number): HybridBuildProgress | null {
  const formed = primary.stage === "formed" || primary.stage === "complete";
  const complete = primary.stage === "complete";

  if (primary.id === "bow" && formed && activeIds.has("lightning_split_arrow")) {
    return {
      id: "thunder_arrow_array",
      name: complete ? "雷羽箭阵" : "雷羽成型",
      color: "#90caf9",
      description: "多重箭与雷纹共鸣产生连锁电弧，箭阵进入杂交成型。",
      powerLevel: complete ? 3 : 2,
    };
  }

  if (primary.id === "mace" && formed && activeIds.has("fire_mace_quake")) {
    return {
      id: "lava_quake",
      name: complete ? "熔岩地裂" : "熔岩重击",
      color: "#ff7043",
      description: "钝器地裂与炎脉联动，重击会形成熔岩裂缝感。",
      powerLevel: complete ? 3 : 2,
    };
  }

  if (primary.id === "spear" && formed && activeIds.has("lightning_spear_beam")) {
    return {
      id: "thunder_spear_array",
      name: complete ? "雷贯枪阵" : "雷贯枪芒",
      color: "#80deea",
      description: "枪芒与雷纹共鸣，贯穿后产生电链。",
      powerLevel: complete ? 3 : 2,
    };
  }

  if (primary.id === "blade" && formed && activeIds.has("poison_blade_whirl")) {
    return {
      id: "poison_blade_storm",
      name: complete ? "毒刃风暴" : "毒刃回旋",
      color: "#81c784",
      description: "飞刃路线与毒蚀联动，回旋路径带腐蚀反馈。",
      powerLevel: complete ? 3 : 2,
    };
  }

  if (primary.id === "tech" && formed && activeIds.has("arcane_drone")) {
    return {
      id: "arcane_drone_swarm",
      name: complete ? "奥术无人机群" : "奥术无人机",
      color: "#b39ddb",
      description: "无人机火力与奥术星环联动，科技弹体获得法术感。",
      powerLevel: complete ? 3 : 2,
    };
  }

  if (primary.id === "bow" && formed && activeIds.has("ice_frost_arrow")) {
    return {
      id: "frost_arrow_rain",
      name: complete ? "霜痕箭雨" : "霜痕箭路",
      color: "#80deea",
      description: "冰霜箭与霜息凝痕联动，箭路减速反馈更明显。",
      powerLevel: complete ? 3 : 2,
    };
  }

  if (synergyCount >= 3 && formed) {
    return {
      id: "hybrid_mastery",
      name: complete ? "杂交大成" : "杂交成型",
      color: "#ffd54f",
      description: "多条隐藏联动同时激活，体系已进入复合构筑。",
      powerLevel: complete ? 3 : 2,
    };
  }

  return null;
}
