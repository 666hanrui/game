# 任务系统设计

相关代码：

```text
src/data/quests.ts
src/systems/QuestProgress.ts
src/systems/EconomyInventory.ts
src/systems/MaterialInventory.ts
src/systems/MetaProgress.ts
src/systems/MetaTalentProgress.ts
```

## 任务类型

当前任务分类：

```text
tutorial：新手引导
reclaim：区域收复
boss：Boss 讨伐
material：材料收集
elite：精英狩猎
camp：营地建设
challenge：挑战任务
```

## 任务目标

当前支持目标类型：

```text
run_count：完成远征次数
wave_reach：抵达指定波次
kill_enemy：击杀普通敌人
kill_elite：击杀精英
kill_boss：击杀 Boss
collect_material：收集材料
open_chest：打开宝箱
craft_item：合成物品
upgrade_camp：升级营地建筑
reclaim_region：收复区域
```

## 初始任务

当前已有任务：

```text
初入荒原
初识天赋
收复裂田
讨伐黏王
猎杀异锋
巨骨样本
扩建工坊
绝境试炼
```

这些任务覆盖：

```text
新手引导
天赋槽赠送
区域收复
Boss 讨伐
精英狩猎
材料收集
营地建设
高风险构筑挑战
```

## 任务进度

任务进度由以下文件管理：

```text
src/systems/QuestProgress.ts
```

存储键：

```text
game.questState
```

基础结构：

```ts
{
  questId: string,
  claimed: boolean,
  progress: {
    type: QuestTargetType,
    id?: string,
    value: number
  }[]
}
```

## 可用方法

```ts
const quests = new QuestProgress();

quests.getVisibleQuests();
quests.getEntry("tutorial_first_expedition");
quests.isCompleted("tutorial_first_expedition");
quests.isClaimed("tutorial_first_expedition");

quests.addProgress("wave_reach", 1);
quests.addProgress("kill_boss", 1, "slime_king");
quests.setProgress("reclaim_broken_field", "wave_reach", 8);

quests.claimReward("tutorial_first_talent_slot");
quests.reset();
```

## 奖励流向

任务奖励可以写入：

```text
EconomyInventory：远征币、魂晶、职业材料、营地物资等。
MaterialInventory：神话骨骼、符文、星陨金属等合成材料。
MetaTalentProgress：天赋槽、天赋解锁。
MetaProgress：材料库存、合成配方解锁等。
```

注意：任务系统不应该自己直接操作 `localStorage` 以外的战斗对象，也不应该直接改 `Game.ts` 状态。

## 后续接入点

### 1. 任务板 UI

建议新增：

```text
src/ui/QuestBoardPanel.ts
```

功能：

```text
按任务类型筛选。
显示任务目标进度。
显示奖励预览。
支持领取奖励。
显示已完成 / 已领取 / 可重复。
```

### 2. 营地接入

由营地中的任务板建筑打开：

```text
任务板 / 指挥公告栏 / 收复地图
```

不要在 `main.ts` 里硬塞任务 UI。

### 3. 战斗结算接入

后续远征结算时，薄调用：

```ts
const questProgress = new QuestProgress();
questProgress.addProgress("run_count", 1);
questProgress.setProgress("some_quest", "wave_reach", waveNum);
questProgress.addProgress("kill_elite", eliteKills);
questProgress.addProgress("kill_boss", bossKills, bossId);
```

### 4. 宝箱 / 合成 / 营地接入

后续系统触发时补：

```text
打开宝箱 -> addProgress("open_chest", 1, chestTier)
合成物品 -> addProgress("craft_item", 1, recipe.result.id)
升级建筑 -> addProgress("upgrade_camp", 1, buildingId)
收复区域 -> addProgress("reclaim_region", 1, regionId)
```

## 协作注意

```text
src/data/quests.ts 属于任务数据层。
src/systems/QuestProgress.ts 属于任务进度层。
未来 QuestBoardPanel 属于 UI 层。
Game.ts 后续只做薄调用，不要把任务规则塞进 Game.ts。
```
