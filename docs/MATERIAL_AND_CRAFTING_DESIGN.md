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
src/data/chestLoot.ts
src/systems/MaterialInventory.ts
src/systems/ChestDropSystem.ts
src/systems/MetaProgress.ts
src/ui/CraftingPanel.ts
src/ui/MaterialStoragePanel.ts
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

## 持久化入口

`MetaProgress` 已经接入材料库存和合成结果持久化。

材料方法：

```ts
meta.getMaterials();
meta.setMaterials(inventory);
meta.getMaterialAmount("alien_core");
meta.addMaterial("alien_core", 1);
meta.addMaterials({ alien_core: 2, soul_crystal: 8 });
meta.spendRecipeMaterials(recipe);
```

合成结果方法：

```ts
meta.craftRecipe(recipe);
meta.getUnlockState();
meta.applyRecipeResult(recipe);
meta.hasCraftedItem("rune_staff");
meta.hasUnlockedRecipe("myth_weapon_rune_staff");
meta.getTalentSlots();
meta.addTalentSlot(1);
```

当前存储键：

```text
game.materials
game.metaUnlocks
```

`game.metaUnlocks` 当前结构：

```ts
{
  unlockedRecipes: string[],
  craftedItems: string[],
  talentSlots: number
}
```

注意：`soul_crystal` 同时存在于材料定义中，但当前旧系统仍有独立的 `game.soulCrystals`。短期内为了兼容旧 UI，魂晶仍保留旧存储；后续可以再做一次统一迁移。

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

## 材料仓库 UI

已新增：

```text
src/ui/MaterialStoragePanel.ts
```

当前能力：

```text
查看所有材料定义。
按全部、货币、通用、特殊、稀有、史诗、神话筛选。
显示当前拥有数量。
显示材料稀有度、来源、用途、描述。
读取 meta.getMaterials()。
```

注意：当前 `MaterialStoragePanel` 只是 UI 骨架，尚未接入营地建筑交互，也暂时没有滚动列表和排序。后续接入时，由材料仓库建筑打开该面板。

## 合成台 UI

已新增：

```text
src/ui/CraftingPanel.ts
```

当前能力：

```text
按分类查看配方：全部、天赋、武器、药剂、建筑、道具。
查看配方详情。
查看材料需求和当前拥有数量。
判断是否可合成。
调用 meta.craftRecipe(recipe) 消耗材料并写入合成结果。
显示合成成功或材料不足反馈。
显示当前天赋槽、已合成物、已解锁配方数量。
```

注意：当前 `CraftingPanel` 只是 UI 骨架，尚未接入营地建筑交互。合成结果已经不再由 UI 自己硬写，而是交给 `MetaProgress.craftRecipe()`。

## 后续接入点

### 1. 宝箱系统

已新增：

```text
src/data/chestLoot.ts
src/systems/ChestDropSystem.ts
```

不要把宝箱逻辑硬塞进 `Game.ts`。`Game.ts` 只负责在击杀精英 / Boss 时调用系统生成结果。

### 2. 材料仓库 UI

状态：已完成基础骨架。

接入营地时需要：

```text
给 HubCampPanel 增加 material_storage 交互类型。
靠近材料仓库建筑按 E 后打开 MaterialStoragePanel。
点击返回回到营地。
```

### 3. 合成台 UI

状态：已完成基础骨架，并已接入 MetaProgress 合成结果记录。

接入营地时需要：

```text
给 HubCampPanel 增加 crafting 交互类型。
靠近合成台建筑按 E 后打开 CraftingPanel。
点击返回回到营地。
```

### 4. MetaProgress 持久化

状态：已完成基础材料库存和合成结果接入。

当前已经能保存：

```ts
materials: Record<string, number>
metaUnlocks: {
  unlockedRecipes: string[],
  craftedItems: string[],
  talentSlots: number
}
```

后续还需要补：

```text
天赋装备栏
已装备天赋列表
神话武器实际解锁入口
永久药剂实际属性加成入口
营地建筑等级入口
```

## 协作注意

```text
材料和配方属于数据层，允许 D 线协作者维护。
宝箱掉落属于 C 线。
营地建筑交互属于 B 线。
真正消费材料的永久成长属于 D 线。
Game.ts 只做最薄的调用，不直接堆材料规则。
```
