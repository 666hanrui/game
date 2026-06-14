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

## B 线：营地建筑化

负责范围：

```text
src/ui/HubCampPanel.ts
src/data/hubModules.ts
public/assets/sprites/
```

当前目标：

```text
1. 把营地从文字面板改成可移动据点地图。
2. 远征入口做成传送门或城门。
3. 道具工坊做成铁匠铺 / 工坊建筑。
4. 药房做成药剂屋。
5. 任务系统做成告示牌。
6. 合成系统做成符文台或锻造台。
7. 材料仓库做成仓库建筑。
8. 玩家靠近建筑后显示 “E 交互”。
```

注意：B 线不要修改 `Game.ts`，只改营地 UI 和营地数据。

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

提交前确认：

```text
没有 TypeScript 错误；
没有 Console 运行时报错；
没有新增 main.ts 绕过核心系统的临时玩法；
没有硬写自动开火；
没有长期保留 monkey patch。
```
