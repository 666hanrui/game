# 局外天赋系统设计

相关代码：

```text
src/data/metaTalents.ts
src/data/economy.ts
src/systems/EconomyInventory.ts
src/systems/MetaTalentProgress.ts
src/systems/MetaTalentRuntime.ts
src/ui/MetaTalentPanel.ts
```

## 基础规则

```text
天赋名称必须是四个字。
开局默认 1 个天赋槽。
后续天赋槽通过新手引导、局外购买、合成或特殊奖励获得。
天赋可以有强正面效果，也可以有负面代价。
```

## 天赋数据

天赋定义在：

```text
src/data/metaTalents.ts
```

当前已有示例：

```text
连斩追击
血影回流
孤注一击
亡骸归阵
炮台矩阵
贪宝成瘾
逆命狂热
晶盾回响
元素涌动
古武传承
猎王誓印
```

其中 `孤注一击` 对应高风险玩法：

```text
攻击力大幅提高；
最大生命固定为 1，受到伤害后立刻失败。
```

这类天赋应该被归入 `risk` 类。

## 经济库存

经济物品定义在：

```text
src/data/economy.ts
```

经济库存由以下文件管理：

```text
src/systems/EconomyInventory.ts
```

存储键：

```text
game.economyItems
```

可用方法：

```ts
const inventory = EconomyInventory.load();

inventory.get("expedition_coin");
inventory.add("expedition_coin", 100);
inventory.addMany({ expedition_coin: 100, soul_crystal: 20 });
inventory.canAfford(talent.unlockCosts);
inventory.spend(talent.unlockCosts);
inventory.entries();
inventory.save();
```

注意：`economy.ts` 和 `materials.ts` 目前是两套数据。短期不强行合并，避免破坏已有系统。天赋消耗先走 `EconomyInventory`，合成材料先走 `MaterialInventory`。

## 天赋状态

天赋状态由以下文件管理：

```text
src/systems/MetaTalentProgress.ts
```

存储键：

```text
game.metaTalentState
```

结构：

```ts
{
  unlockedTalentIds: string[],
  equippedTalentIds: string[],
  talentSlots: number
}
```

默认值：

```ts
{
  unlockedTalentIds: [],
  equippedTalentIds: [],
  talentSlots: 1
}
```

## 可用方法

```ts
const talentProgress = new MetaTalentProgress();

talentProgress.getState();
talentProgress.setState(state);
talentProgress.getUnlockedTalents();
talentProgress.getEquippedTalents();
talentProgress.getAvailableTalents();
talentProgress.isUnlocked("combo_chase");
talentProgress.isEquipped("combo_chase");
talentProgress.unlockTalent("combo_chase");
talentProgress.purchaseUnlockTalent("combo_chase");
talentProgress.equipTalent("combo_chase");
talentProgress.unequipTalent("combo_chase");
talentProgress.getState().talentSlots;
talentProgress.addTalentSlot(1);
talentProgress.setTalentSlots(3);
```

其中：

```text
unlockTalent(id)：临时/直接解锁，不扣资源，适合调试或任务奖励。
purchaseUnlockTalent(id)：真实购买解锁，会调用 EconomyInventory.spend(talent.unlockCosts)。
```

## 天赋选择 UI

已新增：

```text
src/ui/MetaTalentPanel.ts
```

当前能力：

```text
显示当前天赋槽位。
显示已装备天赋。
按全部、进攻、生存、成长、召唤、机械、魔法、古武、风险筛选天赋。
显示天赋详情、四字名称、稀有度、负面代价、标签、解锁消耗。
支持临时解锁、装备、卸下。
```

注意：当前 `MetaTalentPanel` 是 UI 骨架。它为了方便测试支持“临时解锁”。正式购买按钮后续应调用 `purchaseUnlockTalent(id)`。

## 天赋运行时修正

已新增：

```text
src/systems/MetaTalentRuntime.ts
```

它负责把“已装备天赋”转成统一战斗修正对象，不直接改玩家、不直接生成炮塔、不直接生成亡灵。

用法：

```ts
const snapshot = new MetaTalentRuntime().buildSnapshot();

snapshot.equippedTalents;
snapshot.bonuses;
snapshot.notes;
```

当前 `bonuses` 包含：

```text
伤害倍率
攻速倍率
移速倍率
生命倍率 / 固定生命 / 一击失败
治疗倍率
击杀回血
护盾倍率
护盾破裂伤害倍率
宝箱奖励倍率
精英出现倍率
对精英/Boss伤害倍率
亡灵召唤概率
炮塔数量和部署频率
魔法触发概率
魔法伤害倍率
古武强化倾向
破甲倍率
低血攻速 / 低血移速
```

已为当前天赋写入基础转译：

```text
连斩追击
血影回流
孤注一击
亡骸归阵
炮台矩阵
贪宝成瘾
逆命狂热
晶盾回响
元素涌动
古武传承
猎王誓印
```

尚未接入 `Game.ts`。后续接入时，`Game.ts` 只应该读取 `snapshot.bonuses`，不要重新写一套天赋 if/else。

## 后续接入点

### 1. 营地接入

建议由营地建筑打开：

```text
天赋祭坛 / 训练所 / 战术大厅
```

不要在 `main.ts` 里硬塞天赋 UI。

### 2. 天赋购买消耗

当前基础已完成：

```text
src/systems/EconomyInventory.ts
MetaTalentProgress.purchaseUnlockTalent(id)
```

后续需要：

```text
让 MetaTalentPanel 区分“临时解锁”和“购买解锁”。
给经济库存接入远征结算、任务奖励、宝箱奖励。
```

### 3. 战斗属性接入

当前基础已完成：

```text
src/systems/MetaTalentRuntime.ts
```

后续需要：

```text
把 MetaTalentRuntime.bonuses 接到玩家基础属性、掉落、宝箱、召唤物和特殊机制。
保持 Game.ts 只做薄调用，不在里面堆天赋细节。
```

## 协作注意

```text
src/data/metaTalents.ts 属于天赋数据层。
src/data/economy.ts 属于经济物品数据层。
src/systems/EconomyInventory.ts 属于经济库存层。
src/systems/MetaTalentProgress.ts 属于天赋状态层。
src/systems/MetaTalentRuntime.ts 属于战斗运行时转译层。
src/ui/MetaTalentPanel.ts 属于 UI 层。
不要把天赋购买、装备和战斗效果全部塞进 Game.ts。
```
