export type MaterialRarity = "common" | "uncommon" | "rare" | "epic" | "mythic";
export type MaterialKind = "currency" | "common" | "special";
export type MaterialTag = "alien" | "myth" | "magic" | "martial" | "tech" | "land" | "soul" | "beast" | "craft";

export interface MaterialDefinition {
  id: string;
  name: string;
  icon: string;
  rarity: MaterialRarity;
  kind: MaterialKind;
  tags: MaterialTag[];
  description: string;
  source: string;
  use: string;
}

export const MATERIALS: MaterialDefinition[] = [
  {
    id: "gold_leaf",
    name: "金叶",
    icon: "🟡",
    rarity: "common",
    kind: "currency",
    tags: ["craft"],
    description: "营地通用货币，来自收复区域的基础收益。",
    source: "普通战斗、日常任务、区域结算。",
    use: "购买普通天赋、基础天赋槽位、药房消耗品。",
  },
  {
    id: "soul_crystal",
    name: "魂晶",
    icon: "◆",
    rarity: "uncommon",
    kind: "currency",
    tags: ["soul", "craft"],
    description: "能够带出局的稳定灵魂结晶。",
    source: "本局结算、Boss 战、收复目标奖励。",
    use: "局外强化、部分高级天赋解锁、稀有配方手续费。",
  },
  {
    id: "alien_core",
    name: "异种残核",
    icon: "◈",
    rarity: "rare",
    kind: "special",
    tags: ["alien", "craft"],
    description: "异种体内残留的能量核心，仍会轻微跳动。",
    source: "精英怪宝箱、Boss 宝箱、异种巢穴事件。",
    use: "神话武器合成、区域净化装置、异种档案研究。",
  },
  {
    id: "myth_bone",
    name: "神话生物骨骼",
    icon: "🦴",
    rarity: "epic",
    kind: "special",
    tags: ["myth", "beast", "craft"],
    description: "古老巨兽或神话生物遗留的骨质材料，坚硬到近乎金属。",
    source: "Boss 大宝箱、古代遗迹事件、兽巢首领。",
    use: "狼牙棒、长枪、弓箭等古武神话路线合成。",
  },
  {
    id: "ancient_rune",
    name: "古代符文",
    icon: "ᛟ",
    rarity: "epic",
    kind: "special",
    tags: ["magic", "myth", "craft"],
    description: "刻有失落文字的碎片，能稳定魔力结构。",
    source: "法师塔遗迹、Boss 大宝箱、魔法区域任务。",
    use: "魔杖、法杖、法球的高阶合成和永久性魔药。",
  },
  {
    id: "machine_core",
    name: "机械遗芯",
    icon: "⚙",
    rarity: "epic",
    kind: "special",
    tags: ["tech", "craft"],
    description: "旧时代自动机械留下的核心芯片，可作为高阶机械组装基础。",
    source: "机械废墟、科技精英怪、Boss 大宝箱。",
    use: "无人机核心、能量核心、炮塔模块、自动化营地设施。",
  },
  {
    id: "rift_mark",
    name: "裂土印记",
    icon: "▣",
    rarity: "rare",
    kind: "special",
    tags: ["land", "alien", "craft"],
    description: "被异种污染土地上的刻印碎片，是收复区域的重要证明。",
    source: "完成区域收复目标、地图事件、Boss 战。",
    use: "解锁新区域、升级营地建筑、制作区域净化道具。",
  },
  {
    id: "spirit_shard",
    name: "灵魂碎晶",
    icon: "✦",
    rarity: "rare",
    kind: "special",
    tags: ["soul", "magic", "craft"],
    description: "灵魂能量凝成的碎晶，可用于强化成长性能力。",
    source: "灵体敌人、灵族事件、Boss 宝箱。",
    use: "永久性提升药、灵族成长路线、复活类天赋材料。",
  },
  {
    id: "blood_amber",
    name: "血色琥珀",
    icon: "⬢",
    rarity: "rare",
    kind: "special",
    tags: ["beast", "martial", "craft"],
    description: "封存着狂暴生命力的红色琥珀。",
    source: "兽人区域、兽类精英、狂化事件。",
    use: "吸血天赋、生命药剂、重武器破甲强化。",
  },
  {
    id: "star_metal",
    name: "星陨金属",
    icon: "✧",
    rarity: "mythic",
    kind: "special",
    tags: ["myth", "tech", "martial", "craft"],
    description: "从天外陨落的金属，能同时承载魔力与机械能量。",
    source: "高难度 Boss、噩梦以上宝箱、稀有地图事件。",
    use: "神话武器最终合成、跨体系装备、顶级营地设施。",
  },
];

export type MaterialId = typeof MATERIALS[number]["id"];

export function getMaterial(id: string): MaterialDefinition | undefined {
  return MATERIALS.find((material) => material.id === id);
}

export function getMaterialsByKind(kind: MaterialKind): MaterialDefinition[] {
  return MATERIALS.filter((material) => material.kind === kind);
}

export function getMaterialsByTag(tag: MaterialTag): MaterialDefinition[] {
  return MATERIALS.filter((material) => material.tags.includes(tag));
}
