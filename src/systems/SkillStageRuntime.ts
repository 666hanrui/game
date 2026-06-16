import type { Skill } from "../data/skills";

export interface SkillStageInfo {
  ownedLevel: number;
  nextLevel: number;
  maxLevel: number;
  currentText: string;
  nextText: string;
  cardText: string;
}

const STAGE_TEXT: Record<string, string[]> = {
  multi_arrow: [
    "I：额外射出箭矢，形成基础扇形火力。",
    "II：扇形更稳定，副箭伤害感更明显。",
    "III：进入箭雨雏形，小箭更容易继承联动效果。",
  ],
  tracking: [
    "I：箭矢获得轻微追踪。",
    "II：追踪范围扩大，转向更灵敏。",
    "III：命中后更容易二次索敌，配合制导天赋更明显。",
  ],
  fireball: [
    "I：命中产生小范围爆裂。",
    "II：爆裂范围扩大，火花更明显。",
    "III：爆裂可连带触发天赋联动，适合炎爆路线。",
  ],
  frost_arrow: [
    "I：命中减速敌人。",
    "II：减速更持久，冰霜反馈更明显。",
    "III：冰霜箭可配合霜息形成霜痕箭路。",
  ],
  spear_shadow: [
    "I：长枪刺击后释放一道枪芒。",
    "II：枪芒数量和伤害提升，远近结合成型。",
    "III：枪芒继承更多联动，雷贯或寒星路线质变。",
  ],
  pierce: [
    "I：穿刺伤害和暴击提升。",
    "II：穿刺后的范围反馈增强。",
    "III：直线穿刺更稳定，适合枪术大成。",
  ],
  earthquake: [
    "I：狼牙棒重击后释放地裂波。",
    "II：地裂更宽，击中反馈更重。",
    "III：地裂可形成熔岩或冰裂杂交大成。",
  ],
  mace_shockwave: [
    "I：重击时释放环形震荡。",
    "II：震荡范围扩大，清围更强。",
    "III：震荡更频繁，配合钝器大成开路。",
  ],
  whirl_blade: [
    "I：飞刃回旋感增强。",
    "II：飞刃贴身清怪更稳。",
    "III：可配合毒蚀形成毒刃风暴。",
  ],
  chain_lightning: [
    "I：击败敌人后弹射闪电。",
    "II：弹射伤害和范围提升。",
    "III：闪电更适合与雷系杂交构筑叠加。",
  ],
  drone: [
    "I：无人机开始自动协助攻击。",
    "II：无人机火力更密。",
    "III：可配合奥术星环形成奥术无人机群。",
  ],
  energy_refraction: [
    "I：能量弹产生折射副弹。",
    "II：折射副弹更稳定。",
    "III：科技过载时折射火力更明显。",
  ],
};

export function getSkillStageInfo(skill: Skill, ownedIds: string[]): SkillStageInfo {
  const ownedLevel = ownedIds.filter((id) => id === skill.id).length;
  const nextLevel = Math.min(skill.maxLevel, ownedLevel + 1);
  const stages = STAGE_TEXT[skill.id] ?? fallbackStages(skill);
  const currentText = ownedLevel <= 0
    ? "当前：尚未获得，本次会解锁机制。"
    : `当前：${stages[Math.min(stages.length - 1, ownedLevel - 1)]}`;
  const nextText = nextLevel >= skill.maxLevel
    ? `下一级：${stages[Math.min(stages.length - 1, nextLevel - 1)]}`
    : `下一级：${stages[Math.min(stages.length - 1, nextLevel - 1)]}`;
  const cardText = `${currentText}｜${nextText}`;
  return { ownedLevel, nextLevel, maxLevel: skill.maxLevel, currentText, nextText, cardText };
}

function fallbackStages(skill: Skill): string[] {
  const bits: string[] = [];
  if (skill.mods.damage) bits.push("伤害明显提高");
  if (skill.mods.attackCooldown) bits.push("攻击节奏改变");
  if (skill.mods.projectileCount) bits.push("弹体或派生数量增加");
  if (skill.mods.critChance || skill.mods.critMultiplier) bits.push("暴击路线增强");
  if (skill.mods.maxHp) bits.push("生存能力提高");
  if (bits.length <= 0) bits.push("机制效果增强");
  return [
    `I：${bits[0]}。`,
    `II：${bits.join("，")}，数值和手感更明显。`,
    `III：${skill.name}进入质变阶段，配合流派和联动效果更强。`,
  ];
}
