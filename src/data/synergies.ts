import type { MetaTalentDef } from "./metaTalents";

export type SynergyEffectId =
  | "split_arrow_chain_lightning"
  | "frost_arrow_ice_trail"
  | "tracking_arrow_guided"
  | "explosive_arrow_burning_ground"
  | "spear_beam_chain_lightning"
  | "spear_beam_frost_trail"
  | "sword_wave_chain_lightning"
  | "sword_wave_poison_trail"
  | "mace_quake_lava"
  | "mace_quake_ice"
  | "blade_poison_trail"
  | "drone_arcane_bolt";

export interface SynergyDef {
  id: string;
  name: string;
  requires: {
    upgrades: string[];
    talentTags: string[];
  };
  effect: SynergyEffectId;
  description: string;
  hint: string;
}

export const SYNERGIES: SynergyDef[] = [
  {
    id: "lightning_split_arrow",
    name: "雷羽分裂",
    requires: { upgrades: ["multi_arrow"], talentTags: ["lightning"] },
    effect: "split_arrow_chain_lightning",
    description: "多重箭 / 分裂类箭矢命中后，会向附近敌人跳出短电弧。",
    hint: "雷纹天赋会让多重箭产生电弧联动。",
  },
  {
    id: "ice_frost_arrow",
    name: "霜痕箭路",
    requires: { upgrades: ["frost_arrow"], talentTags: ["ice"] },
    effect: "frost_arrow_ice_trail",
    description: "冰霜箭命中时减速更明显，并产生冰蓝碎片反馈。",
    hint: "霜息天赋会强化冰霜箭的减速和冰痕反馈。",
  },
  {
    id: "tech_tracking_arrow",
    name: "制导箭",
    requires: { upgrades: ["tracking"], talentTags: ["tech"] },
    effect: "tracking_arrow_guided",
    description: "追踪箭锁定范围和转向强度提高。",
    hint: "机巧制导会让追踪箭获得更强锁定。",
  },
  {
    id: "fire_explosive_arrow",
    name: "炎爆箭",
    requires: { upgrades: ["fireball"], talentTags: ["fire"] },
    effect: "explosive_arrow_burning_ground",
    description: "爆裂箭命中后的爆炸范围更亮，并追加火焰粒子。",
    hint: "炎脉天赋会让爆裂箭产生炎爆联动。",
  },
  {
    id: "lightning_spear_beam",
    name: "雷贯枪芒",
    requires: { upgrades: ["spear_shadow"], talentTags: ["lightning"] },
    effect: "spear_beam_chain_lightning",
    description: "枪芒命中后会向附近敌人跳电。",
    hint: "雷纹天赋会让枪芒贯穿后跳电。",
  },
  {
    id: "ice_spear_beam",
    name: "寒星枪芒",
    requires: { upgrades: ["spear_shadow"], talentTags: ["ice"] },
    effect: "spear_beam_frost_trail",
    description: "枪芒命中后附加减速和冰蓝碎片。",
    hint: "霜息天赋会让枪芒留下寒霜。",
  },
  {
    id: "lightning_sword_wave",
    name: "雷鸣剑气",
    requires: { upgrades: ["sword_wave"], talentTags: ["lightning"] },
    effect: "sword_wave_chain_lightning",
    description: "剑气命中后向附近敌人跳电。",
    hint: "雷纹天赋会让剑气获得电弧联动。",
  },
  {
    id: "poison_sword_wave",
    name: "腐蚀剑气",
    requires: { upgrades: ["sword_wave"], talentTags: ["poison"] },
    effect: "sword_wave_poison_trail",
    description: "剑气路径留下毒雾。",
    hint: "毒蚀天赋会让剑气留下毒雾。",
  },
  {
    id: "fire_mace_quake",
    name: "熔岩地裂",
    requires: { upgrades: ["earthquake"], talentTags: ["fire"] },
    effect: "mace_quake_lava",
    description: "地裂波命中后产生更强火焰爆裂。",
    hint: "炎脉天赋会把地裂升级为熔岩地裂。",
  },
  {
    id: "ice_mace_quake",
    name: "冰裂大地",
    requires: { upgrades: ["earthquake"], talentTags: ["ice"] },
    effect: "mace_quake_ice",
    description: "地裂波命中后减速并产生碎冰。",
    hint: "霜息天赋会把地裂升级为冰裂大地。",
  },
  {
    id: "poison_blade_whirl",
    name: "毒刃回旋",
    requires: { upgrades: ["whirl_blade"], talentTags: ["poison"] },
    effect: "blade_poison_trail",
    description: "飞刃命中后造成腐蚀反馈，并短暂减速敌人。",
    hint: "毒蚀天赋会让回旋飞刃带毒雾。",
  },
  {
    id: "arcane_drone",
    name: "奥术无人机",
    requires: { upgrades: ["drone"], talentTags: ["arcane"] },
    effect: "drone_arcane_bolt",
    description: "无人机弹体获得奥术视觉和更强命中反馈。",
    hint: "奥术天赋会让无人机发射奥术弹。",
  },
];

export function getTalentTags(talents: MetaTalentDef[]): Set<string> {
  const tags = new Set<string>();
  for (const talent of talents) {
    for (const tag of talent.tags) tags.add(tag);
  }
  return tags;
}

export function getActiveSynergies(upgradeIds: string[], talentTags: Set<string>): SynergyDef[] {
  return SYNERGIES.filter((synergy) => {
    const hasUpgrades = synergy.requires.upgrades.every((id) => upgradeIds.includes(id));
    const hasTalentTags = synergy.requires.talentTags.every((tag) => talentTags.has(tag));
    return hasUpgrades && hasTalentTags;
  });
}

export function getSynergyHintsForSkill(skillId: string, ownedIds: string[], talentTags: Set<string>): { active: SynergyDef[]; pending: SynergyDef[] } {
  const withSelected = [...ownedIds, skillId];
  const active = getActiveSynergies(ownedIds, talentTags).filter((synergy) => synergy.requires.upgrades.includes(skillId));
  const pending = getActiveSynergies(withSelected, talentTags)
    .filter((synergy) => synergy.requires.upgrades.includes(skillId))
    .filter((synergy) => !active.some((item) => item.id === synergy.id));
  return { active, pending };
}
