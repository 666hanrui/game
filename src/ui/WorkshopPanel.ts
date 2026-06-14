import { PlaceholderHubPanel } from "./PlaceholderHubPanel";

export class WorkshopPanel extends PlaceholderHubPanel {
  constructor() {
    super({
      title: "铁匠工坊",
      subtitle: "神话武器、装备强化和武器路线进阶入口",
      icon: "⚒",
      sections: [
        {
          title: "计划功能",
          lines: [
            "展示弓箭、长枪、狼牙棒、法杖、无人机核心等武器路线。",
            "接入神话武器配方：裂骨狼牙、星纹法杖、蜂巢中枢。",
            "根据材料库存判断是否可打造。",
          ],
        },
        {
          title: "数据来源",
          lines: [
            "读取 src/data/recipes.ts 的 weapon 类配方。",
            "读取 MetaProgress 的 game.materials。",
            "后续和 CraftingPanel 共享合成消耗逻辑。",
          ],
        },
      ],
    });
  }
}
