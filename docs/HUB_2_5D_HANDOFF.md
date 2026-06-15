# 营地 2.5D 建筑化交接说明

## 当前状态

B 线营地建筑化已经从“文字面板 / 节点图”升级成 2.5D 据点地图。

核心文件：

```text
src/ui/HubCampPanel.ts
src/data/hubCampLayout.ts
```

`HubCampPanel.ts` 现在只负责：

```text
输入处理
玩家移动
碰撞调用
图片加载与运行时清理
Canvas 渲染
交互动作返回
```

`hubCampLayout.ts` 负责：

```text
营地尺寸
建筑资源路径
建筑坐标
建筑 footprint
建筑 solidRects
建筑 interactPoint
建筑 depthY
地图边界碰撞
建筑主体碰撞集合
```

相关资源：

```text
public/assets/sprites/hub/camp-ground.png
public/assets/sprites/hub/*_back.png
public/assets/sprites/hub/*_front.png
```

## 渲染层级

`HubCampPanel.ts` 当前渲染顺序为：

```text
1. drawGroundLayer        地面层，优先绘制 camp-ground.png
2. drawSceneLayer         建筑 back 层与玩家一起 Y-sort
3. drawFrontOverlayLayer  建筑 front 层，最后遮挡玩家
4. drawInteractionHints   E 交互提示
5. drawDebugFootprints    调试碰撞与交互点
6. drawEdgeFogOverlay     边界迷雾与暗角
7. drawHud                顶部说明
8. drawInteractionPanel   底部建筑说明
9. drawStartFallback      右下角开始远征兜底按钮
```

不要把旧的 `drawRoads / drawDistrictLabels / drawBuilding` 节点式 UI 逻辑重新接回来。

## 建筑数据结构

每个建筑在 `src/data/hubCampLayout.ts` 的 `CAMP_BUILDINGS` 中配置：

```ts
interface CampBuilding {
  id: HubModuleId;
  name: string;
  icon: string;
  x: number;
  y: number;
  w: number;
  h: number;
  footprint: Rect;
  solidRects?: Rect[];
  interactPoint: { x: number; y: number };
  interactRadius: number;
  depthY: number;
  art: { back: HubArtKey; front: HubArtKey };
  color: string;
  npc: string;
  line: string;
}
```

### x / y / w / h

建筑图片绘制位置和尺寸。

如果建筑图片显示偏移、大小不对，优先调这里。

### footprint

建筑底部脚印区域，用于遮挡阴影、底座阻挡和调试参考。

### solidRects

建筑主体阻挡区，防止玩家从侧边钻进建筑内部。

已经验证：

- 玩家可以靠近门口交互。
- 玩家不能越界。
- 玩家不能钻进建筑内部。

后续如果某个建筑挡得太死，优先微调 `solidRects`，不要删除整体碰撞系统。

### interactPoint

真正交互点，通常是门口或柜台前。

玩家靠近此点才显示：

```text
E 交互
```

### depthY

建筑 back 层参与 Y-sort 的深度。

如果玩家在建筑前后遮挡关系不对，优先调 `depthY`。

## 碰撞系统

当前碰撞由三部分组成，定义在 `src/data/hubCampLayout.ts`：

```text
HARD_SCENERY_COLLIDERS    地图边界 / 岩壁 / 大场景障碍
BUILDING_SOLID_COLLIDERS  建筑主体阻挡
footprint                 建筑底座阻挡
```

最终导出：

```text
CAMP_COLLIDERS
```

移动逻辑仍在 `HubCampPanel.ts`：

```text
tryMove()
collisionPressure()
```

其中 `collisionPressure()` 支持“脱困式移动”：

如果玩家已经在碰撞边缘里，只要下一步是在离开碰撞区域，就允许移动。这样可以避免出生点或建筑边缘卡死。

## 调试开关

调试开关定义在 `src/data/hubCampLayout.ts`：

```ts
export const DEBUG_HUB_FOOTPRINT = false;
export const DEBUG_HUB_COLLIDERS = false;
```

调坐标时可以临时改成：

```ts
export const DEBUG_HUB_FOOTPRINT = true;
export const DEBUG_HUB_COLLIDERS = true;
```

显示内容：

- 建筑 footprint
- 建筑 solidRects
- interactPoint 红点
- 硬场景碰撞框

调完必须改回 `false`。

## 布局静态检查

新增脚本：

```text
scripts/check-hub-layout.mjs
```

命令：

```bash
npm run check:hub-layout
```

它会检查：

```text
1. CAMP_W / CAMP_H 是否能解析；
2. hubCampLayout.ts 里引用的 hub 图片是否存在；
3. 建筑 id 是否重复；
4. 建筑 id 是否都有 hubActions 映射；
5. 明显非法的矩形尺寸和越界矩形。
```

调 `hubCampLayout.ts` 后建议执行：

```bash
npm run check:hub-layout
npm run typecheck
npm run build
```

## 边界迷雾

`drawEdgeFogOverlay()` 用于遮住地图边缘突兀的绿色硬边。

如果后续换了更大的 `camp-ground.png`，可以降低雾的透明度，但不建议直接删除迷雾，因为它还能增强营地纵深感。

## 营地主角

营地主角现在强制使用人族 walk sheet：

```text
/assets/sprites/races/human_walk.png
```

加载失败时才走 fallback 人形绘制。

不要重新恢复蓝色圆形占位小人。

## 交互动作

建筑动作通过：

```ts
getHubActionByModule(moduleId)
getHubSubPanelId(action)
```

不要在 `HubCampPanel.ts` 里手写散字符串动作。

当前动作包括：

```text
start
open_crafting
open_material_storage
open_economy_storage
open_talents
open_quests
open_workshop
open_apothecary
open_loot
open_map
open_archive
```

实际打开子面板由 `HubSubPanelManager` 负责，`HubCampPanel` 只返回动作。

## 资源清理

营地建筑资源有两层处理：

1. `HubCampPanel.ts` 中运行时兜底清理。
2. `npm run clean:hub-art` 对 PNG 本体进行批量透明清理。

相关文档：

```text
docs/HUB_ART_CLEANUP.md
```

推荐本地流程：

```bash
npm run clean:hub-art
npm run typecheck
npm run build
```

## 后续注意

不要随便改这些文件，除非明确负责 B 线：

```text
src/ui/HubCampPanel.ts
src/data/hubCampLayout.ts
public/assets/sprites/hub/
scripts/clean-hub-sprites.mjs
```

不要在营地 UI 里修改：

```text
src/core/Game.ts
src/main.ts
src/core/GameOpeningFlowFix.ts
```

否则容易和 A 线主流程冲突。
