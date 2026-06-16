import type { EconomyItemDef } from "./economy";

export type MetaTalentRarity = "common" | "rare" | "epic" | "legendary";
export type MetaTalentCategory = "offense" | "survival" | "growth" | "summon" | "tech" | "magic" | "martial" | "risk";

export interface MetaTalentCost {
  itemId: EconomyItemDef["id"];
  amount: number;
}

export interface MetaTalentDef {
  id: string;
  name: string;
  category: MetaTalentCategory;
  rarity: MetaTalentRarity;
  color: string;
  description: string;
  downside?: string;
  unlockCosts: MetaTalentCost[];
  upgradeCosts: MetaTalentCost[];
  tags: string[];
}

// 局外天赋：名称必须是四个字。
// 普通天赋主要消耗通用物品；职业天赋和高阶突破才消耗特殊物品。
// lightning / fire / ice / poison / arcane / tech 等英文标签是隐藏联动条件，不会作为局内卡种暴露给玩家。
export const META_TALENTS: MetaTalentDef[] = [
  {
    id: "combo_chase",
    name: "连斩追击",
    category: "offense",
    rarity: "common",
    color: "#ffcc80",
    description: "连续击杀会短暂提高攻击速度和伤害，适合高频清怪路线。",
    unlockCosts: [
      { itemId: "expedition_coin", amount: 120 },
      { itemId: "soul_crystal", amount: 20 },
    ],
    upgradeCosts: [
      { itemId: "expedition_coin", amount: 80 },
      { itemId: "soul_crystal", amount: 12 },
    ],
    tags: ["连击", "攻速", "清怪", "combo", "speed"],
  },
  {
    id: "blood_return",
    name: "血影回流",
    category: "survival",
    rarity: "rare",
    color: "#ef9a9a",
    description: "击杀或暴击时回复少量生命，适合持续作战。",
    unlockCosts: [
      { itemId: "expedition_coin", amount: 220 },
      { itemId: "mutant_core", amount: 18 },
    ],
    upgradeCosts: [
      { itemId: "expedition_coin", amount: 140 },
      { itemId: "mutant_core", amount: 10 },
    ],
    tags: ["吸血", "续航", "暴击", "lifesteal", "crit"],
  },
  {
    id: "solo_strike",
    name: "孤注一击",
    category: "risk",
    rarity: "legendary",
    color: "#ff7043",
    description: "攻击力大幅提高。",
    downside: "最大生命固定为 1，受到伤害后立刻失败。",
    unlockCosts: [
      { itemId: "expedition_coin", amount: 900 },
      { itemId: "king_core", amount: 2 },
    ],
    upgradeCosts: [
      { itemId: "expedition_coin", amount: 520 },
      { itemId: "king_core", amount: 1 },
    ],
    tags: ["风险", "高伤", "高手", "risk", "damage"],
  },
  {
    id: "bone_array",
    name: "亡骸归阵",
    category: "summon",
    rarity: "epic",
    color: "#cfd8dc",
    description: "击杀敌人有概率生成短时亡灵随从。",
    unlockCosts: [
      { itemId: "expedition_coin", amount: 520 },
      { itemId: "crown_shard", amount: 1 },
      { itemId: "myth_bone", amount: 1 },
    ],
    upgradeCosts: [
      { itemId: "soul_crystal", amount: 120 },
      { itemId: "crown_shard", amount: 1 },
    ],
    tags: ["死灵", "召唤", "滚雪球", "summon"],
  },
  {
    id: "turret_matrix",
    name: "炮台矩阵",
    category: "tech",
    rarity: "epic",
    color: "#4dd0e1",
    description: "每隔一段时间部署临时炮塔，炮塔会自动攻击附近敌人。",
    unlockCosts: [
      { itemId: "expedition_coin", amount: 520 },
      { itemId: "turret_plan", amount: 1 },
      { itemId: "star_marrow", amount: 1 },
    ],
    upgradeCosts: [
      { itemId: "soul_crystal", amount: 120 },
      { itemId: "turret_plan", amount: 1 },
    ],
    tags: ["机械", "炮塔", "阵地", "tech", "turret"],
  },
  {
    id: "treasure_greed",
    name: "贪宝成瘾",
    category: "growth",
    rarity: "rare",
    color: "#ffd54f",
    description: "宝箱材料奖励提高。",
    downside: "精英怪和特殊怪出现率提高。",
    unlockCosts: [
      { itemId: "expedition_coin", amount: 300 },
      { itemId: "land_mark", amount: 8 },
    ],
    upgradeCosts: [
      { itemId: "expedition_coin", amount: 180 },
      { itemId: "land_mark", amount: 4 },
    ],
    tags: ["宝箱", "材料", "风险", "loot", "risk"],
  },
  {
    id: "reverse_frenzy",
    name: "逆命狂热",
    category: "risk",
    rarity: "epic",
    color: "#ef5350",
    description: "生命越低，攻击速度和移动速度越高。",
    downside: "治疗效果降低。",
    unlockCosts: [
      { itemId: "expedition_coin", amount: 420 },
      { itemId: "king_core", amount: 1 },
    ],
    upgradeCosts: [
      { itemId: "expedition_coin", amount: 260 },
      { itemId: "mutant_core", amount: 18 },
    ],
    tags: ["低血", "狂战", "风险", "risk", "speed"],
  },
  {
    id: "shield_echo",
    name: "晶盾回响",
    category: "survival",
    rarity: "rare",
    color: "#80deea",
    description: "护盾破裂时对周围敌人造成冲击。",
    downside: "最大生命小幅降低。",
    unlockCosts: [
      { itemId: "expedition_coin", amount: 260 },
      { itemId: "soul_crystal", amount: 60 },
    ],
    upgradeCosts: [
      { itemId: "expedition_coin", amount: 160 },
      { itemId: "soul_crystal", amount: 28 },
    ],
    tags: ["护盾", "反击", "生存", "shield", "survival"],
  },
  {
    id: "element_surge",
    name: "元素涌动",
    category: "magic",
    rarity: "epic",
    color: "#ce93d8",
    description: "冰、火、雷、奥术类效果触发时，有概率追加一次元素爆发。",
    unlockCosts: [
      { itemId: "expedition_coin", amount: 500 },
      { itemId: "element_page", amount: 1 },
      { itemId: "star_marrow", amount: 1 },
    ],
    upgradeCosts: [
      { itemId: "soul_crystal", amount: 110 },
      { itemId: "element_page", amount: 1 },
    ],
    tags: ["魔法", "元素", "爆发", "lightning", "fire", "ice", "arcane"],
  },
  {
    id: "martial_legacy",
    name: "古武传承",
    category: "martial",
    rarity: "epic",
    color: "#d7a86e",
    description: "冷兵器路线更容易获得破甲、剑气、枪芒类强化。",
    unlockCosts: [
      { itemId: "expedition_coin", amount: 500 },
      { itemId: "ancient_part", amount: 1 },
      { itemId: "myth_bone", amount: 1 },
    ],
    upgradeCosts: [
      { itemId: "soul_crystal", amount: 110 },
      { itemId: "ancient_part", amount: 1 },
    ],
    tags: ["古武", "破甲", "武技", "martial", "armor_break"],
  },
  {
    id: "hunter_oath",
    name: "猎王誓印",
    category: "offense",
    rarity: "epic",
    color: "#aed581",
    description: "对精英、支援怪和 Boss 的伤害提高。",
    unlockCosts: [
      { itemId: "expedition_coin", amount: 480 },
      { itemId: "hunter_badge", amount: 1 },
    ],
    upgradeCosts: [
      { itemId: "soul_crystal", amount: 100 },
      { itemId: "hunter_badge", amount: 1 },
    ],
    tags: ["游侠", "精英", "Boss", "boss", "elite"],
  },
  {
    id: "thunder_mark",
    name: "雷纹共鸣",
    category: "magic",
    rarity: "rare",
    color: "#90caf9",
    description: "提供雷电倾向。分裂箭、枪芒、剑气等升级会自动获得跳电或电弧联动。",
    unlockCosts: [
      { itemId: "expedition_coin", amount: 260 },
      { itemId: "element_page", amount: 1 },
    ],
    upgradeCosts: [
      { itemId: "soul_crystal", amount: 70 },
      { itemId: "element_page", amount: 1 },
    ],
    tags: ["雷电", "联动", "元素", "lightning"],
  },
  {
    id: "flame_vein",
    name: "炎脉涌动",
    category: "magic",
    rarity: "rare",
    color: "#ff8a65",
    description: "提供火焰倾向。爆裂箭和地裂类升级会自动获得燃烧、熔岩或爆燃联动。",
    unlockCosts: [
      { itemId: "expedition_coin", amount: 260 },
      { itemId: "element_page", amount: 1 },
    ],
    upgradeCosts: [
      { itemId: "soul_crystal", amount: 70 },
      { itemId: "element_page", amount: 1 },
    ],
    tags: ["火焰", "联动", "元素", "fire"],
  },
  {
    id: "frost_breath",
    name: "霜息凝痕",
    category: "magic",
    rarity: "rare",
    color: "#80deea",
    description: "提供冰霜倾向。冰霜箭、枪芒和地裂类升级会自动获得冰痕、减速或冻结联动。",
    unlockCosts: [
      { itemId: "expedition_coin", amount: 260 },
      { itemId: "element_page", amount: 1 },
    ],
    upgradeCosts: [
      { itemId: "soul_crystal", amount: 70 },
      { itemId: "element_page", amount: 1 },
    ],
    tags: ["冰霜", "联动", "元素", "ice"],
  },
  {
    id: "poison_spread",
    name: "毒蚀蔓延",
    category: "magic",
    rarity: "rare",
    color: "#81c784",
    description: "提供毒蚀倾向。飞刃、剑气和多段命中类升级会自动获得毒雾或腐蚀联动。",
    unlockCosts: [
      { itemId: "expedition_coin", amount: 260 },
      { itemId: "mutant_core", amount: 12 },
    ],
    upgradeCosts: [
      { itemId: "soul_crystal", amount: 70 },
      { itemId: "mutant_core", amount: 8 },
    ],
    tags: ["毒蚀", "联动", "元素", "poison"],
  },
  {
    id: "arcane_ring",
    name: "奥术星环",
    category: "magic",
    rarity: "rare",
    color: "#b39ddb",
    description: "提供奥术倾向。无人机、法阵和能量类升级会自动获得奥术弹体或符文爆发联动。",
    unlockCosts: [
      { itemId: "expedition_coin", amount: 280 },
      { itemId: "star_marrow", amount: 1 },
    ],
    upgradeCosts: [
      { itemId: "soul_crystal", amount: 80 },
      { itemId: "star_marrow", amount: 1 },
    ],
    tags: ["奥术", "联动", "元素", "arcane"],
  },
  {
    id: "guided_core",
    name: "机巧制导",
    category: "tech",
    rarity: "rare",
    color: "#4dd0e1",
    description: "提供科技制导倾向。追踪箭、能量弹和无人机类升级会自动获得锁定或目标分配联动。",
    unlockCosts: [
      { itemId: "expedition_coin", amount: 280 },
      { itemId: "turret_plan", amount: 1 },
    ],
    upgradeCosts: [
      { itemId: "soul_crystal", amount: 80 },
      { itemId: "turret_plan", amount: 1 },
    ],
    tags: ["科技", "制导", "联动", "tech"],
  },
];

export function getMetaTalent(id: string): MetaTalentDef | undefined {
  return META_TALENTS.find((talent) => talent.id === id);
}

export function getMetaTalentsByCategory(category: MetaTalentCategory): MetaTalentDef[] {
  return META_TALENTS.filter((talent) => talent.category === category);
}
