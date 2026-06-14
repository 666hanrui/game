# 材料与合成体系设计

本项目的局外成长分为两类资源：

```text
通用物品：货币、基础资源，用于普通天赋、天赋槽位、基础消耗。
特殊物品：稀有材料，用于神话武器、永久药剂、高阶合成、营地建筑升级。
```

相关代码：

```text
src/data/materials.ts
src/data/recipes.ts
src/systems/MaterialInventory.ts
```

## 材料分类

### 通用货币

```text
金叶
魂晶
```

用途：

```text
普通天赋购买
天赋槽位解锁
基础局外强化
药房基础服务
```

### 特殊材料

```text
异种残核
神话生物骨骼
古代符文
机械遗芯
裂土印记
灵魂碎晶
血色琥珀
星陨金属
```

用途：

```text
神话武器合成
永久性提升药
高级天赋
营地建筑升级
区域收复装置
```

## 宝箱规则

宝箱不应该产出普通药剂、攻速药剂、攻击药剂、治疗包这类局内小补给。

推荐规则：

```text
普通怪：不掉宝箱，主要掉经验和局内小补给。
精英怪：概率掉小宝箱。
Boss：必掉大宝箱。
地图事件：概率给特殊材料或配方。
区域收复：给裂土印记和魂晶。
```

小宝箱产出：

```text
少量魂晶
异种残核
裂土印记
血色琥珀
灵魂碎晶
低概率古代符文 / 机械遗芯
```

大宝箱产出：

```text
大量魂晶
神话生物骨骼
古代符文
机械遗芯
星陨金属
神话武器配方线索
```

## 初始配方方向

已在 `src/data/recipes.ts` 中定义：

```text
第二天赋槽
连击嗜血
裂骨狼牙
星纹法杖
蜂巢中枢
固本药剂
工坊扩建
净土装置
```

## 后续接入点

### 1. 宝箱系统

建议新增：

```text
src/entities/Chest.ts
src/systems/ChestDropSystem.ts
```

不要把宝箱逻辑硬塞进 `Game.ts`。`Game.ts` 只负责在击杀精英 / Boss 时调用系统生成结果。

### 2. 材料仓库 UI

建议新增或扩展：

```text
src/ui/MaterialStoragePanel.ts
```

营地里“材料仓库”建筑靠近后按 E 打开。

### 3. 合成台 UI

建议新增：

```text
src/ui/CraftingPanel.ts
```

读取：

```text
RECIPES
MaterialInventory
```

展示：

```text
配方名称
分类
材料需求
是否可合成
合成结果
```

### 4. MetaProgress 持久化

后续需要把 `MaterialInventory` 接入：

```text
src/systems/MetaProgress.ts
```

建议存储结构：

```ts
{
  soulCrystals: number,
  materials: Record<string, number>,
  unlockedRecipes: string[],
  craftedItems: string[]
}
```

## 协作注意

```text
材料和配方属于数据层，允许 D 线协作者维护。
宝箱掉落属于 C 线。
营地建筑交互属于 B 线。
真正消费材料的永久成长属于 D 线。
Game.ts 只做最薄的调用，不直接堆材料规则。
```
