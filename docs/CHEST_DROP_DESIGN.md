# 宝箱掉落系统设计

相关代码：

```text
src/data/chestLoot.ts
src/systems/ChestDropSystem.ts
src/data/materials.ts
src/systems/MaterialInventory.ts
```

## 基础规则

```text
普通怪：不掉宝箱。
精英怪：概率掉小宝箱。
Boss：必掉大宝箱。
地图事件：可直接给小宝箱或指定材料。
区域收复：可给大宝箱或裂土印记奖励。
```

## 宝箱等级

### 小宝箱 small

来源：

```text
精英怪概率掉落
普通地图事件
```

定位：

```text
少量魂晶
少量通用货币
中低阶特殊材料
```

### 大宝箱 large

来源：

```text
Boss 必掉
区域收复奖励
高级地图事件
```

定位：

```text
较多魂晶
稀有材料
高阶合成资源
低概率星陨金属
```

### 神话宝箱 mythic

来源：

```text
高难 Boss
噩梦 / 地狱难度
高波次
高运气升级
稀有事件
```

定位：

```text
神话武器合成材料
星陨金属
大量高阶特殊材料
```

## 设计原则

宝箱不要产出局内垃圾补给。

不应该出现在宝箱里的东西：

```text
治疗包
磁铁
攻速药剂
攻击药剂
护盾临时补给
```

这些属于局内补给，应该由局内掉落系统、地图事件或商店处理。

宝箱应该产出：

```text
魂晶
金叶
异种残核
神话生物骨骼
古代符文
机械遗芯
裂土印记
灵魂碎晶
血色琥珀
星陨金属
```

## 接入建议

后续接入 `Game.ts` 时，不要把掉落概率写死在 `onKill()` 里。

推荐方式：

```ts
const chestReward = chestDropSystem.rollChest({
  source: enemy.role === "boss" ? "boss" : enemy.role === "elite" ? "elite" : "event",
  wave: this.waveNum,
  difficulty: this.selectedDifficulty,
  luck: this.runLuck,
});
```

然后由局外系统或奖励面板处理：

```text
把材料加入 MaterialInventory；
弹出宝箱奖励面板；
记录本局带出物。
```

## 后续任务

```text
1. 新增 Chest 实体或宝箱奖励面板。
2. 将 ChestDropSystem 接入精英怪 / Boss 击杀。
3. 将 MaterialInventory 接入 MetaProgress 持久化。
4. 营地材料仓库读取 MaterialInventory。
5. 合成台读取 RECIPES 和 MaterialInventory。
```
