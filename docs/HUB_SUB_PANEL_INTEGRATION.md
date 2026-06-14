# 营地子面板集成说明

相关代码：

```text
src/data/hubModules.ts
src/data/hubActions.ts
src/ui/HubSubPanelManager.ts
src/ui/CraftingPanel.ts
src/ui/MaterialStoragePanel.ts
src/ui/EconomyStoragePanel.ts
src/ui/MetaTalentPanel.ts
src/ui/QuestBoardPanel.ts
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
  | "quests";
```

对应关系：

```text
crafting -> CraftingPanel
material_storage -> MaterialStoragePanel
economy_storage -> EconomyStoragePanel
talents -> MetaTalentPanel
quests -> QuestBoardPanel
```

## 营地建筑动作

已新增统一动作映射：

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

建筑模块到动作的映射由 `HUB_ACTIONS` 管理。后续 `HubCampPanel` 不要手写零散字符串，优先使用：

```ts
getHubActionByModule(moduleId);
getHubAction(action);
getHubSubPanelId(action);
```

## 基础用法

```ts
const subPanels = new HubSubPanelManager();

subPanels.open("crafting");
subPanels.open("material_storage");
subPanels.open("economy_storage");
subPanels.open("talents");
subPanels.open("quests");

subPanels.handleClick(x, y);
subPanels.render(ctx, w, h);
subPanels.close();
```

## 接入营地的推荐方式

后续 `HubCampPanel` 做成可移动营地地图后，建筑交互可以返回 `HubCampAction`。

例如：

```ts
const actionDef = getHubActionByModule(nearestBuilding.moduleId);
return actionDef?.action ?? null;
```

上层接入时：

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
HubSubPanelManager 文件已新增。
hubActions.ts 动作映射已新增。
子面板 open/close/render/handleClick 已统一。
各子面板仍保持独立，不直接依赖 Game.ts。
```

尚未完成：

```text
还没有接入 HubCampPanel。
还没有接入 main.ts。
还没有处理键盘 Esc 返回。
workshop / apothecary / loot / map / archive 还只是预留动作，没有对应子面板。
```

## 协作注意

```text
HubSubPanelManager 属于 UI 路由层。
hubActions.ts 属于营地建筑动作映射层。
它们不应该直接修改 Game.ts。
它们不应该移动玩家。
它们不应该决定战斗开始。
它们只负责局外 UI 子面板的打开、关闭、点击和渲染。
```

后续同事做营地建筑化时，可以只让建筑返回打开动作，不需要知道每个面板内部怎么扣材料、怎么领任务奖励。
