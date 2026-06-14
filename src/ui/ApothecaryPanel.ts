import { PlaceholderHubPanel } from "./PlaceholderHubPanel";

export class ApothecaryPanel extends PlaceholderHubPanel {
  constructor() {
    super({
      title: "药剂屋",
      subtitle: "永久药剂、局外药剂和生命成长入口",
      icon: "✚",
      sections: [
        {
          title: "计划功能",
          lines: [
            "制作固本药剂等永久提升药。",
            "展示生命、恢复、护盾相关的局外成长。",
            "不出售磁铁、攻速药剂、攻击药剂这类局内临时补给。",
          ],
        },
        {
          title: "数据来源",
          lines: [
            "读取 src/data/recipes.ts 的 potion 类配方。",
            "消耗 MaterialInventory 的灵魂碎晶、血色琥珀等材料。",
            "后续把永久药剂结果写入 MetaProgress。",
          ],
        },
      ],
    });
  }
}
