import { getActiveSynergies, getSynergyHintsForSkill, getTalentTags, SynergyDef } from "../data/synergies";
import type { MetaTalentDef } from "../data/metaTalents";
import { MetaTalentProgress } from "./MetaTalentProgress";

export interface SynergyRuntimeSnapshot {
  talentTags: Set<string>;
  activeSynergies: SynergyDef[];
  activeIds: Set<string>;
}

export class SynergyRuntime {
  private talentProgress = new MetaTalentProgress();

  buildSnapshot(upgradeIds: string[]): SynergyRuntimeSnapshot {
    return buildSynergySnapshot(upgradeIds, this.talentProgress.getEquippedTalents());
  }
}

export function buildSynergySnapshot(upgradeIds: string[], equippedTalents: MetaTalentDef[]): SynergyRuntimeSnapshot {
  const talentTags = getTalentTags(equippedTalents);
  const activeSynergies = getActiveSynergies(upgradeIds, talentTags);
  return {
    talentTags,
    activeSynergies,
    activeIds: new Set(activeSynergies.map((synergy) => synergy.id)),
  };
}

export function buildActiveSynergyIdSet(upgradeIds: string[]): Set<string> {
  const progress = new MetaTalentProgress();
  return buildSynergySnapshot(upgradeIds, progress.getEquippedTalents()).activeIds;
}

export function getEquippedTalentTags(): Set<string> {
  const progress = new MetaTalentProgress();
  return getTalentTags(progress.getEquippedTalents());
}

export function getSkillSynergyHintText(skillId: string, ownedIds: string[]): string {
  const hints = getSynergyHintsForSkill(skillId, ownedIds, getEquippedTalentTags());
  if (hints.active[0]) return `已激活联动：${hints.active[0].name}。${hints.active[0].hint}`;
  if (hints.pending[0]) return `选择后联动：${hints.pending[0].name}。${hints.pending[0].hint}`;
  return "";
}
