# 协作任务分工

这份文档用于当前阶段多人协作。任务尽量拆开，避免同时改同一文件造成冲突。

## A 线：主流程与稳定性

负责范围：

```text
src/core/Game.ts
src/main.ts
src/core/GameOpeningFlowFix.ts
```

当前目标：

```text
1. 将 GameOpeningFlowFix.ts 里的剩余流程修正合并回 Game.ts。
2. 删除 GameOpeningFlowFix.ts。
3. main.ts 移除 installGameOpeningFlowFix。
4. 确保流程为：营地 -> 种族 -> 体系 -> 武器 -> 第 1 波。
5. 本地运行 npm run typecheck 和 npm run build。
```

注意：A 线进行时，其他协作者不要同时修改 `Game.ts`。

## B 线：营地建筑化与美术辨识度

负责范围：

```text
src/ui/HubCampPanel.ts
src/data/hubCampLayout.ts
src/data/hubModules.ts
src/data/weaponAnchors.ts
public/assets/sprites/
scripts/clean-hub-sprites.mjs
scripts/clean-character-sprites.mjs
scripts/check-hub-layout.mjs
scripts/check-art-assets.mjs
scripts/check-weapon-anchors.mjs
```

当前状态：

```text
1. 营地已经从文字面板升级为 2.5D 可移动据点地图。
2. 地面层使用 camp-ground.png。
3. 建筑使用 *_back.png / *_front.png 分层。
4. 建筑 back 层和玩家一起 Y-sort。
5. 建筑 front 层最后绘制，用于遮挡玩家。
6. 玩家靠近建筑 interactPoint 后显示 “E 交互”。
7. 建筑主体 solidRects 已接入，玩家不能从侧边钻进建筑内部。
8. 边界迷雾已接入，用于遮盖地图硬边。
9. 营地主角已改为人族 walk sheet，不再使用蓝色占位小人。
10. 人族武器挂点表已建立并接入 Player.ts。
11. 营地建筑、角色 walk sheet、怪物 PNG 均有零依赖资源清理脚本。
12. 营地建筑坐标、资源路径、碰撞框已抽离到 src/data/hubCampLayout.ts。
13. B 线已有统一检查入口 npm run check:b-line。
```

关键文档：

```text
docs/HUB_2_5D_HANDOFF.md
docs/HUB_ART_CLEANUP.md
docs/CHARACTER_ART_CLEANUP.md
docs/WEAPON_ANCHOR_TUNING.md
docs/B_LINE_VISUAL_ACCEPTANCE.md
docs/ART_ASSET_STANDARDS.md
```

维护规则：

```text
1. 不要把 HubCampPanel.ts 改回旧的 drawRoads / drawDistrictLabels 节点式界面。
2. 调建筑坐标、图片大小、footprint、solidRects、interactPoint、depthY 时优先改 src/data/hubCampLayout.ts。
3. 调建筑碰撞时优先改 solidRects，不要删除整体碰撞系统。
4. 调建筑交互时优先改 interactPoint 和 interactRadius。
5. 调遮挡关系时优先改 depthY。
6. 调人族武器姿势时优先改 src/data/weaponAnchors.ts，不要直接改 Player.ts 的通用武器数学逻辑。
7. 清理营地建筑资源运行 npm run clean:hub-art。
8. 清理角色和怪物资源运行 npm run clean:character-art。
9. 一次性清理全部美术资源运行 npm run clean:art。
10. 提交 B 线改动前运行 npm run check:b-line。
```

注意：B 线不要修改 `Game.ts`，只改营地 UI、美术资源、资源清理脚本和视觉挂点数据。

## C 线：局内补给与宝箱

负责范围：

```text
src/systems/RunSupplyRuntime.ts
src/data/runItems.ts
src/systems/runSupplyConfig.ts
src/entities/Pickup.ts
```

当前目标：

```text
1. 检查磁铁、护盾、急速药剂、攻击药剂、治疗包是否稳定。
2. 普通补给只从局内掉落或事件刷新，不放进宝箱。
3. 设计宝箱实体和掉落规则。
4. 精英怪概率小宝箱，Boss 必掉大宝箱。
5. 宝箱产出材料，不产出普通药剂垃圾。
```

注意：C 线不要绕过 Game/Input 直接改玩家移动或射击。

## D 线：材料与局外成长

负责范围：

```text
src/data/
src/systems/MetaProgress.ts
未来的合成系统 / 材料仓库 UI
```

当前目标：

```text
1. 区分通用物品和特殊物品。
2. 通用物品用于普通天赋、天赋槽位购买。
3. 特殊物品用于神话武器、永久药剂、高阶合成。
4. 设计材料表：神话生物骨骼、异种残核、裂土印记、古代符文、机械遗芯、灵魂碎晶等。
5. 设计基础合成配方表。
```

## 统一规则

所有协作者都必须遵守：

```bash
npm run typecheck
npm run build
```

美术资源更新后建议额外执行：

```bash
npm run clean:art
npm run check:b-line
```

提交前确认：

```text
没有 TypeScript 错误；
没有 Console 运行时报错；
没有新增 main.ts 绕过核心系统的临时玩法；
没有硬写自动开火；
没有长期保留 monkey patch；
没有把营地 2.5D 改回文字面板；
没有提交带白底/棋盘格的美术资源。
```
