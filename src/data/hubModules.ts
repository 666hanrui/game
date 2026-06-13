export type HubModuleId =
  | "expedition"
  | "talents"
  | "workshop"
  | "apothecary"
  | "quests"
  | "crafting"
  | "storage"
  | "map"
  | "archive";

export interface HubModuleDef {
  id: HubModuleId;
  name: string;
  icon: string;
  description: string;
  unlockHint: string;
}

export const HUB_MODULES: HubModuleDef[] = [
  {
    id: "expedition",
    name: "远征入口",
    icon: "▲",
    description: "开始新一局远征，选择区域、难度、种族、体系、武器和已携带天赋。",
    unlockHint: "默认开放。",
  },
  {
    id: "talents",
    name: "天赋殿堂",
    icon: "✦",
    description: "查看、解锁、购买、装备天赋。新手引导会赠送第一个天赋槽，后续槽位需要材料购买。",
    unlockHint: "完成新手引导后开放。",
  },
  {
    id: "workshop",
    name: "道具工坊",
    icon: "⚒",
    description: "强化局内补给池，例如磁铁范围、护盾强度、诱饵人偶和临时炮台。",
    unlockHint: "带回第一批工坊材料后开放。",
  },
  {
    id: "apothecary",
    name: "药房",
    icon: "✚",
    description: "研究药剂类局内补给，例如血包、回春露、急速药剂、攻击药剂、暴击药剂。",
    unlockHint: "完成基础远征任务后开放。",
  },
  {
    id: "quests",
    name: "任务系统",
    icon: "☰",
    description: "领取清剿、精英、Boss、材料、体系试炼和区域收复任务。",
    unlockHint: "默认开放。",
  },
  {
    id: "crafting",
    name: "合成系统",
    icon: "◇",
    description: "把材料合成为更高级材料、职业核心、天赋解锁物、区域钥印或工坊升级物。",
    unlockHint: "获得第一份合成配方后开放。",
  },
  {
    id: "storage",
    name: "材料仓库",
    icon: "▣",
    description: "查看所有可以带出局的材料、来源、用途、数量和可合成目标。",
    unlockHint: "默认开放。",
  },
  {
    id: "map",
    name: "收复地图",
    icon: "◎",
    description: "查看被异种占领的区域、收复进度、区域 Boss、特殊材料和推荐难度。",
    unlockHint: "完成新手远征后开放。",
  },
  {
    id: "archive",
    name: "异种档案",
    icon: "?",
    description: "记录已遭遇的怪物、Boss、材料、职业路线和区域故事。",
    unlockHint: "首次击败异种后开放。",
  },
];

export function getHubModule(id: HubModuleId): HubModuleDef | undefined {
  return HUB_MODULES.find((module) => module.id === id);
}
