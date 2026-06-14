import { PlaceholderHubPanel } from "./PlaceholderHubPanel";

export class RegionMapPanel extends PlaceholderHubPanel {
  constructor() {
    super({
      title: "收复沙盘",
      subtitle: "区域收复、污染土地、Boss 据点和推荐难度入口",
      icon: "◎",
      sections: [
        {
          title: "计划功能",
          lines: [
            "展示被异种占领的区域和收复进度。",
            "标记区域 Boss、精英巢穴、特殊材料来源。",
            "连接任务系统里的区域收复目标。",
          ],
        },
        {
          title: "世界观目标",
          lines: [
            "玩家远征的最终目的不是单纯刷怪，而是逐步收复被异种占领的土地。",
            "裂土印记、净土装置和区域任务都应该围绕收复土地展开。",
          ],
        },
      ],
    });
  }
}
