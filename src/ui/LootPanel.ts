import { PlaceholderHubPanel } from "./PlaceholderHubPanel";

export class LootPanel extends PlaceholderHubPanel {
  constructor() {
    super({
      title: "宝箱陈列台",
      subtitle: "本局战利品、宝箱记录和带出物展示入口",
      icon: "▤",
      sections: [
        {
          title: "计划功能",
          lines: [
            "展示小宝箱、大宝箱、神话宝箱的产出记录。",
            "区分局内临时补给和可带出局材料。",
            "精英怪概率小宝箱，Boss 必掉大宝箱。",
          ],
        },
        {
          title: "数据来源",
          lines: [
            "读取 src/systems/ChestDropSystem.ts 的奖励结果。",
            "材料奖励进入 MaterialInventory。",
            "通用经济奖励进入 EconomyInventory。",
          ],
        },
      ],
    });
  }
}
