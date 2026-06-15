# 营地导航交接说明

## 新增能力

营地现在支持三种找建筑方式：

```text
1. Tab 切换当前目标建筑。
2. Shift + Tab 反向切换目标建筑。
3. 点击右上角小地图选择目标建筑。
```

## 视觉反馈

当前目标建筑会有三处反馈：

```text
1. 小地图建筑点高亮。
2. 玩家附近出现目标方向箭头。
3. 建筑门口出现目标交互光圈。
```

靠近建筑交互点后：

```text
1. 方向箭头消失。
2. 出现 E 交互提示。
3. 小地图状态变成“可交互”。
```

## 文件位置

```text
src/ui/HubCampPanel.ts
src/ui/HubCampMinimap.ts
scripts/check-hub-navigation.mjs
```

## 检查命令

```bash
npm run check:nav
npm run check:b-line
```

## 注意

点击远处建筑现在只会切换目标，不会隔空打开建筑面板。

只有玩家已经靠近建筑交互点时，点击建筑或按 E 才会返回对应交互动作。

不要把小地图交互写进战斗主流程。营地导航只属于 HubCampPanel。
