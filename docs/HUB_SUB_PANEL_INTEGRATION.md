# 营地子面板集成说明

相关代码：

```text
src/main.ts
src/data/hubModules.ts
src/data/hubActions.ts
src/ui/HubCampPanel.ts
src/ui/HubSubPanelManager.ts
src/ui/PlaceholderHubPanel.ts
src/ui/CraftingPanel.ts
src/ui/MaterialStoragePanel.ts
src/ui/EconomyStoragePanel.ts
src/ui/MetaTalentPanel.ts
src/ui/QuestBoardPanel.ts
src/ui/WorkshopPanel.ts
src/ui/ApothecaryPanel.ts
src/ui/LootPanel.ts
src/ui/RegionMapPanel.ts
src/ui/ArchivePanel.ts
```

## 目标

营地里后续会有很多建筑：

```text
合成台
材料仓库
资源仓库
天赋祭坛
任务板
战利品台
药房
道具工坊
收复沙盘
档案馆
远征门
```

如果每个建筑都直接在 `HubCampPanel` 或 `main.ts` 里处理一个面板，会很快变成一坨。`HubSubPanelManager` 的作用就是统一管理这些局外子面板。

## 已支持的子面板

```ts
export type HubSubPanelId =
  | "crafting"
  | "material_storage"
  | "economy_storage"
  | "talents"
  | "quests"
  | "workshop"
  | "apothecary"
  | "loot"
  | "region_map"
  | "archive";
```

对应关系：

```text
crafting -> CraftingPanel
material_storage -> MaterialStoragePanel
economy_storage -> EconomyStoragePanel
talents -> MetaTalentPanel
quests -> QuestBoardPanel
workshop -> WorkshopPanel
apothecary -> ApothecaryPanel
loot -> LootPanel
region_map -> RegionMapPanel
archive -> ArchivePanel
```

其中 `WorkshopPanel / ApothecaryPanel / LootPanel / RegionMapPanel / ArchivePanel` 目前是占位面板，共用：

```text
src/ui/PlaceholderHubPanel.ts
```

后续可以逐个替换为完整功能面板。

## 营地建筑动作

统一动作映射：

```text
src/data/hubActions.ts
```

当前动作：

```ts
export type HubCampAction =
  | "start"
  | "open_crafting"
  | "open_material_storage"
  | "open_economy_storage"
  | "open_talents"
  | "open_quests"
  | "open_workshop"
  | "open_apothecary"
  | "open_loot"
  | "open_map"
  | "open_archive";
```

建筑模块到动作的映射由 `HUB_ACTIONS` 管理。`HubCampPanel` 不要手写零散字符串，优先使用：

```ts
getHubActionByModule(moduleId);
getHubAction(action);
getHubSubPanelId(action);
```

## 当前主入口接入

`src/main.ts` 已经完成最小桥接：

```text
HubCampPanel 负责营地移动、建筑点击、E 交互。
HubCampPanel 返回 HubCampAction。
main.ts 用 getHubSubPanelId(action) 转成 HubSubPanelId。
HubSubPanelManager 负责打开对应局外面板。
```

当前行为：

```text
点击建筑 / 靠近建筑按 E：打开对应子面板。
点击远征城门 / 开始远征按钮：进入局内流程。
子面板打开时：点击事件交给 HubSubPanelManager。
子面板打开时：暂停 HubCampPanel.update，避免营地角色继续移动。
子面板打开时：渲染交给 HubSubPanelManager。
Esc：关闭当前子面板，返回营地地图。
```

## 基础用法

```ts
const subPanels = new HubSubPanelManager();

subPanels.open("crafting");
subPanels.open("material_storage");
subPanels.open("economy_storage");
subPanels.open("talents");
subPanels.open("quests");
subPanels.open("workshop");
subPanels.open("apothecary");
subPanels.open("loot");
subPanels.open("region_map");
subPanels.open("archive");

subPanels.handleClick(x, y);
subPanels.render(ctx, w, h);
subPanels.close();
```

## 接入营地的推荐方式

`HubCampPanel` 的建筑交互返回 `HubCampAction`。

例如：

```ts
const actionDef = getHubActionByModule(nearestBuilding.moduleId);
return actionDef?.action ?? null;
```

上层接入：

```ts
const subPanelId = getHubSubPanelId(action);
if (subPanelId) subPanels.open(subPanelId);
else if (action === "start") startExpedition();
```

这样新增建筑时只需要维护 `hubActions.ts`，不用到处改判断。

当子面板打开时：

```text
点击事件先交给 HubSubPanelManager。
渲染也先交给 HubSubPanelManager。
不要继续让营地地图响应移动/交互，避免输入穿透。
```

## 当前状态

已完成：

```text
HubCampPanel 已经建筑化，并能返回 HubCampAction。
HubSubPanelManager 文件已新增。
hubActions.ts 动作映射已新增。
PlaceholderHubPanel 通用占位面板已新增。
10 个营地子面板 open/close/render/handleClick 已统一。
main.ts 已完成最小桥接。
Esc 关闭子面板已接入。
各子面板仍保持独立，不直接依赖 Game.ts。
```

尚未完成：

```text
workshop / apothecary / loot / region_map / archive 目前仍是占位内容。
还没有把任务进度、宝箱、合成、天赋运行时接入真实战斗结算。
GameOpeningFlowFix 仍未正式迁回 Game.ts。
```

## 协作注意

```text
HubSubPanelManager 属于 UI 路由层。
hubActions.ts 属于营地建筑动作映射层。
PlaceholderHubPanel 属于占位 UI 层。
main.ts 只做入口桥接，不写具体面板逻辑。
这些文件不应该直接修改 Game.ts。
这些文件不应该移动玩家。
这些文件不应该决定战斗规则。
```

后续继续做具体功能面板时，不需要再改 `main.ts`，优先替换对应子面板内部实现。
