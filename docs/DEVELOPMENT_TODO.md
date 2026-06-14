# 近期开发任务清单

这份清单用于协调多个 AI / 人工协作者并行开发，避免重复改同一块代码。

## 当前优先级 P0：稳定性与结构清理

### 1. 编译与构建守门

状态：已完成。

内容：

```text
package.json 增加 npm run typecheck / npm run check。
GitHub Actions 增加 Typecheck and Build workflow。
每次 push / pull_request 自动执行 npm ci、npm run typecheck、npm run build。
```

### 2. 移除事故调试遗留

状态：进行中。

已完成：

```text
main.ts 中已移除 runtime-debug-panel、runId、canvas clone、旧实例运行锁。
GameOpeningFlowFix.ts 已移除 render monkey patch。
```

待完成：

```text
把 GameOpeningFlowFix.ts 剩余的 selectRace / selectWeapon / startNextWave 流程修正正式合并回 Game.ts。
删除 GameOpeningFlowFix.ts。
main.ts 移除 installGameOpeningFlowFix import 和调用。
```

### 3. 开局流程正式化

目标流程：

```text
营地
↓
开始远征
↓
选择种族
↓
选择体系
↓
选择武器
↓
进入第 1 波战斗
```

Game.ts 内部应该正式实现：

```text
selectRace：只设置种族并进入 school_choice，不生成敌人。
selectSchool：设置体系，刷新 WeaponPanel，进入 weapon_choice。
selectWeapon：设置武器，应用属性，开第 1 波，进入 playing。
startNextWave：前 1-2 波敌人刷在玩家附近，确保开局有反馈。
```

## 当前优先级 P1：核心体验

### 1. 营地重做

现状：营地 UI 仍偏面板化。

目标：

```text
营地应该是可移动的小地图；
工坊、药房、任务板、合成台、远征门都应该是建筑物；
玩家靠近建筑后按 E 交互；
不是纯文字面板。
```

### 2. 局内选择体验

目标：

```text
武器选择、体系选择、升级选择都要有清晰遮罩；
选择阶段不能显示战斗残留画面；
选择后必须有明确确认反馈。
```

### 3. 自动开火选项

规则：

```text
自动开火默认关闭；
F 切换自动开火；
鼠标左键 / J / 空格为手动攻击；
禁止写 shooting = true || ...。
```

## 当前优先级 P2：玩法扩展

### 1. 局内补给

已有方向：

```text
磁铁
护盾
急速药剂
攻击药剂
治疗包
```

要求：

```text
这些是局内小补给，不应该从宝箱里开出。
```

### 2. 宝箱与材料

规则：

```text
精英怪概率掉小宝箱；
Boss 必掉大宝箱；
宝箱主要产出材料和珍贵资源；
不要把普通药剂这种垃圾塞进宝箱。
```

材料方向：

```text
神话生物骨骼
异种残核
裂土印记
古代符文
机械遗芯
灵魂碎晶
```

### 3. 局外成长

方向：

```text
通用物品：货币、基础资源，用于购买普通天赋和槽位。
特殊物品：稀有材料，用于神话武器、永久药剂、高阶合成。
```

### 4. 天赋槽位

规则：

```text
开局免费送 1 个天赋槽；
新手引导到指定等级时再赠送 1 个；
后续天赋槽位需要用局内带出的资源购买；
天赋名统一四个字。
```

## 协作规则

```text
不要两个人同时大改 Game.ts。
改 Game.ts 前先通知另一个协作者。
每次改核心逻辑前先跑 npm run typecheck。
修 bug 优先看 Console 和 TypeScript 错误。
不要用 main.ts 绕过 Game/Input 做临时玩法。
```
