# 局外天赋系统设计

相关代码：

```text
src/data/metaTalents.ts
src/systems/MetaTalentProgress.ts
src/data/economy.ts
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
talentProgress.equipTalent("combo_chase");
talentProgress.unequipTalent("combo_chase");
talentProgress.getState().talentSlots;
talentProgress.addTalentSlot(1);
talentProgress.setTalentSlots(3);
```

## 后续接入点

### 1. 天赋选择 UI

建议新增：

```text
src/ui/MetaTalentPanel.ts
```

功能：

```text
显示已解锁天赋。
显示未解锁天赋和所需资源。
显示已装备天赋槽位。
支持装备、卸下、购买。
```

### 2. 营地接入

建议由营地建筑打开：

```text
天赋祭坛 / 训练所 / 战术大厅
```

不要在 `main.ts` 里硬塞天赋 UI。

### 3. 战斗属性接入

后续需要把已装备天赋转成战斗修正：

```text
伤害倍率
攻速倍率
生命修正
护盾修正
宝箱收益倍率
召唤物规则
职业路线倾向
风险负面效果
```

建议新增：

```text
src/systems/MetaTalentRuntime.ts
```

由它读取：

```ts
new MetaTalentProgress().getEquippedTalents()
```

然后输出战斗修正，避免在 `Game.ts` 里堆天赋逻辑。

## 协作注意

```text
src/data/metaTalents.ts 属于天赋数据层。
src/systems/MetaTalentProgress.ts 属于天赋状态层。
未来的 MetaTalentPanel 属于 UI 层。
未来的 MetaTalentRuntime 属于战斗运行时转译层。
不要把天赋购买、装备和战斗效果全部塞进 Game.ts。
```
