import type { EconomyItemId } from "../systems/EconomyInventory";
import type { MaterialId } from "./materials";

export type QuestCategory = "tutorial" | "reclaim" | "boss" | "material" | "elite" | "camp" | "challenge";
export type QuestDifficulty = "easy" | "normal" | "hard" | "nightmare";
export type QuestRepeat = "once" | "daily" | "weekly" | "repeatable";
export type QuestTargetType = "run_count" | "wave_reach" | "kill_enemy" | "kill_elite" | "kill_boss" | "collect_material" | "open_chest" | "craft_item" | "upgrade_camp" | "reclaim_region";

export interface QuestTarget {
  type: QuestTargetType;
  label: string;
  required: number;
  id?: string;
}

export interface QuestReward {
  economy?: Partial<Record<EconomyItemId, number>>;
  materials?: Partial<Record<MaterialId, number>>;
  unlockTalentIds?: string[];
  unlockRecipeIds?: string[];
  talentSlots?: number;
}

export interface QuestDefinition {
  id: string;
  name: string;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  repeat: QuestRepeat;
  description: string;
  story: string;
  targets: QuestTarget[];
  rewards: QuestReward;
  unlockHint: string;
}

export const QUESTS: QuestDefinition[] = [
  {
    id: "tutorial_first_expedition",
    name: "初入荒原",
    category: "tutorial",
    difficulty: "easy",
    repeat: "once",
    description: "完成第一次远征，熟悉移动、攻击和经验成长。",
    story: "营地外的土地已经被异种占据。先活着回来，比什么都重要。",
    targets: [{ type: "run_count", label: "完成远征", required: 1 }],
    rewards: { economy: { expedition_coin: 80, soul_crystal: 8 } },
    unlockHint: "新建角色后自动出现。",
  },
  {
    id: "tutorial_first_talent_slot",
    name: "初识天赋",
    category: "tutorial",
    difficulty: "easy",
    repeat: "once",
    description: "抵达第 3 波，解锁第二个天赋槽。",
    story: "真正的远征者不只依靠武器，也依靠战前选择。",
    targets: [{ type: "wave_reach", label: "抵达第 3 波", required: 3 }],
    rewards: { economy: { expedition_coin: 120 }, talentSlots: 1 },
    unlockHint: "完成第一次远征后出现。",
  },
  {
    id: "reclaim_broken_field",
    name: "收复裂田",
    category: "reclaim",
    difficulty: "normal",
    repeat: "once",
    description: "在裂田区域完成收复目标，夺回第一块被异种占领的土地。",
    story: "那里曾经是营地的粮仓，现在只剩裂痕和异种巢。",
    targets: [
      { type: "wave_reach", label: "抵达第 8 波", required: 8 },
      { type: "kill_elite", label: "击败精英", required: 2 },
    ],
    rewards: { economy: { expedition_coin: 260, land_mark: 3 }, materials: { rift_mark: 3, alien_core: 1 } },
    unlockHint: "完成初入荒原后出现。",
  },
  {
    id: "boss_slime_king",
    name: "讨伐黏王",
    category: "boss",
    difficulty: "normal",
    repeat: "repeatable",
    description: "击败盘踞在湿地边缘的史莱姆首领。",
    story: "它不强，但它在不断吞食土地。放任它，湿地会变成一整片活泥。",
    targets: [{ type: "kill_boss", label: "击败史莱姆首领", required: 1, id: "slime_king" }],
    rewards: { economy: { expedition_coin: 180, soul_crystal: 14 }, materials: { alien_core: 2, spirit_shard: 1 } },
    unlockHint: "抵达第一个 Boss 波后出现。",
  },
  {
    id: "elite_hunter_01",
    name: "猎杀异锋",
    category: "elite",
    difficulty: "normal",
    repeat: "daily",
    description: "击败若干精英异种，降低周边区域压力。",
    story: "精英异种会指挥低阶怪物围杀远征者，必须先剪掉它们。",
    targets: [{ type: "kill_elite", label: "击败精英怪", required: 5 }],
    rewards: { economy: { expedition_coin: 160, mutant_core: 2 }, materials: { alien_core: 1 } },
    unlockHint: "遇到精英怪后出现。",
  },
  {
    id: "material_myth_bone",
    name: "巨骨样本",
    category: "material",
    difficulty: "hard",
    repeat: "weekly",
    description: "收集神话生物骨骼，用于高阶古武装备研究。",
    story: "工坊老板说，只要有足够坚硬的骨头，他能把狼牙棒做成传说。",
    targets: [{ type: "collect_material", label: "收集神话生物骨骼", required: 3, id: "myth_bone" }],
    rewards: { economy: { expedition_coin: 360, ancient_part: 2 }, materials: { blood_amber: 2 } },
    unlockHint: "获得神话生物骨骼后出现。",
  },
  {
    id: "camp_build_forge",
    name: "扩建工坊",
    category: "camp",
    difficulty: "normal",
    repeat: "once",
    description: "升级道具工坊，解锁更多武器合成路线。",
    story: "收复土地只是第一步，营地必须能把战利品变成真正的战斗力。",
    targets: [{ type: "upgrade_camp", label: "升级道具工坊", required: 1, id: "forge_lv2" }],
    rewards: { economy: { expedition_coin: 220, camp_supply: 120, turret_plan: 1 }, materials: { machine_core: 1 } },
    unlockHint: "获得工坊扩建配方后出现。",
  },
  {
    id: "challenge_one_hp",
    name: "绝境试炼",
    category: "challenge",
    difficulty: "nightmare",
    repeat: "repeatable",
    description: "携带高风险天赋完成挑战，证明你能用极端构筑活下来。",
    story: "有人说，一滴血也够了，只要敌人比你先死。",
    targets: [
      { type: "wave_reach", label: "携带孤注一击抵达第 10 波", required: 10, id: "solo_strike" },
      { type: "kill_boss", label: "击败任意 Boss", required: 1 },
    ],
    rewards: { economy: { soul_crystal: 50, hunter_badge: 1 }, materials: { star_metal: 1 } },
    unlockHint: "解锁孤注一击后出现。",
  },
];

export function getQuest(id: string): QuestDefinition | undefined {
  return QUESTS.find((quest) => quest.id === id);
}

export function getQuestsByCategory(category: QuestCategory): QuestDefinition[] {
  return QUESTS.filter((quest) => quest.category === category);
}
