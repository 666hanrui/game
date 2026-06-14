# 经济库存系统设计

相关代码：

```text
src/data/economy.ts
src/systems/EconomyInventory.ts
src/ui/EconomyStoragePanel.ts
```

## 与材料系统的区别

当前项目里有两套资源概念：

```text
EconomyInventory：远征币、魂晶、职业材料、天赋/工坊/药房/职业消耗。
MaterialInventory：神话骨骼、古代符文、星陨金属等合成材料。
```

短期不要强行合并两张数据表。

推荐边界：

```text
天赋解锁、天赋槽购买、营地基础消费：走 EconomyInventory。
神话武器、永久药剂、高阶合成：走 MaterialInventory。
```

## 经济物品

定义文件：

```text
src/data/economy.ts
```

当前物品包括：

```text
远征币
魂晶
异种残核
营地物资
裂土印记
神话生物骨骼
王骸晶核
星陨晶髓
古代兵装残片
亡者冠片
炮塔蓝图
元素残页
猎王徽记
```

## 经济库存

实现文件：

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
inventory.set("expedition_coin", 100);
inventory.add("expedition_coin", 100);
inventory.addMany({ expedition_coin: 100, soul_crystal: 20 });
inventory.canAfford(talent.unlockCosts);
inventory.spend(talent.unlockCosts);
inventory.entries();
inventory.save();
```

## 经济库存 UI

已新增：

```text
src/ui/EconomyStoragePanel.ts
```

当前能力：

```text
查看经济物品定义。
按全部、通用、特殊、天赋、槽位、工坊、药房、合成、职业、武器、区域筛选。
显示当前拥有数量。
显示来源和主要用途。
读取 EconomyInventory.load()。
```

后续可以由营地中的：

```text
资源仓库
战利品台
任务板奖励预览
天赋祭坛资源预览
```

打开或复用。

## 与天赋系统的关系

`src/data/metaTalents.ts` 中的：

```text
unlockCosts
upgradeCosts
```

使用的是 `economy.ts` 的物品 ID。

真实购买解锁方法：

```ts
new MetaTalentProgress().purchaseUnlockTalent("combo_chase");
```

内部会调用：

```ts
EconomyInventory.load().spend(talent.unlockCosts);
```

## 后续任务

```text
1. 把远征结算奖励写入 EconomyInventory。
2. 把任务奖励写入 EconomyInventory。
3. 把宝箱中的通用奖励和特殊经济物品写入 EconomyInventory。
4. 让 MetaTalentPanel 区分临时解锁和真实购买解锁。
5. 后续评估 economy.ts 与 materials.ts 是否需要统一映射。
```

## 协作注意

```text
不要把经济扣费写在 UI 里。
不要让 Game.ts 直接操作 localStorage。
UI 只展示和触发动作；库存增减由 EconomyInventory 处理。
天赋解锁由 MetaTalentProgress.purchaseUnlockTalent 处理。
```
