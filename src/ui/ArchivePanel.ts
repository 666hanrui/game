import { PlaceholderHubPanel } from "./PlaceholderHubPanel";

export class ArchivePanel extends PlaceholderHubPanel {
  constructor() {
    super({
      title: "异种档案馆",
      subtitle: "怪物图鉴、Boss 档案、材料来源和世界观记录入口",
      icon: "?",
      sections: [
        {
          title: "计划功能",
          lines: [
            "记录已遭遇的史莱姆、蜘蛛、骷髅、精英和 Boss。",
            "展示怪物行为、弹幕方式、掉落倾向和应对建议。",
            "记录材料来源、区域故事和职业路线传承。",
          ],
        },
        {
          title: "接入方向",
          lines: [
            "后续由击杀、首次遭遇、打开宝箱和完成任务逐步解锁档案。",
            "档案馆只展示信息，不直接修改战斗属性。",
          ],
        },
      ],
    });
  }
}
