# 营地小地图与方向指引说明

## 相关文件

```text
src/ui/HubCampPanel.ts
src/ui/HubCampMinimap.ts
src/data/hubCampLayout.ts
```

## 当前功能

营地已经接入两个新的导航辅助：

```text
1. 右上角营地小地图；
2. 当前目标建筑方向箭头。
```

## 小地图规则

小地图由：

```text
src/ui/HubCampMinimap.ts
```

负责绘制。

它会显示：

```text
白点：玩家当前位置
彩色点：营地建筑
发光点：当前选中建筑或当前可交互建筑
```

为了避免小屏幕被 UI 挤满，小地图只在较大的画布尺寸下显示。

## 方向箭头规则

方向箭头在：

```text
HubCampPanel.ts -> drawSelectedBuildingGuide()
```

中绘制。

当玩家距离当前选中建筑较远，且不在任何建筑交互范围内时，会在玩家附近显示一个朝向目标建筑交互点的箭头。

这解决了玩家在营地里不知道往哪里走的问题。

## 调整方式

如果小地图挡住 UI：

```text
修改 src/ui/HubCampMinimap.ts 中的 panelW / panelH / x / y。
```

如果方向箭头太抢眼：

```text
修改 HubCampPanel.ts 中 drawSelectedBuildingGuide() 的透明度、距离阈值和箭头尺寸。
```

如果建筑点位不准：

```text
优先检查 src/data/hubCampLayout.ts 中建筑 x / y / w / h。
```

## 不要做的事

不要为了移动小地图去改营地世界坐标。

不要在小地图里写死某个建筑 id 的特殊逻辑。

不要让小地图负责交互动作，它只负责显示方位。
