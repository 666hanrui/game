# AI 协作开发与调试纪律

这份文档记录本项目在一次严重调试事故后沉淀下来的开发规则。以后任何 AI 或人工协作者继续开发本仓库时，都必须先看这份文档。

## 事故摘要

在一次修复“进入战斗后不能移动、不能攻击”的过程中，问题被误判为输入系统、状态机和渲染残留问题。实际根因之一是 `Game.ts` 调用了 `Minimap.ts` 中不存在的方法：

```ts
this.minimap.renderBoundaryWarning(ctx, this.player.pos, WORLD_W, WORLD_H);
```

由于 `Minimap` 类并没有实现 `renderBoundaryWarning`，项目会出现 TypeScript 编译错误，并在运行时进入渲染阶段时抛出：

```text
TypeError: this.minimap.renderBoundaryWarning is not a function
```

新游戏实例的渲染循环崩溃后，Vite 热更新过程中残留的旧 `requestAnimationFrame` 循环仍可能继续绘制旧画面，造成以下假象：

```text
画面上像是已经进入战斗、有怪物、有武器、有 HUD；
调试状态却显示 phase=weapon_choice、weapon=-、wave=0；
玩家无法移动，也无法攻击。
```

这个假象导致后续排查方向偏离，浪费了大量时间。

## 必须遵守的排查顺序

遇到“画面异常、不能移动、不能攻击、状态不同步、热更新后表现怪异”等问题时，不允许先凭画面猜测。必须按以下顺序执行。

### 1. 先跑静态检查

```bash
npm run typecheck
```

如果没有 `typecheck` 脚本，则必须先补上：

```json
"typecheck": "tsc --noEmit"
```

只有 TypeScript 无错误后，才允许继续判断运行时逻辑。

### 2. 再看浏览器控制台

必须先检查浏览器 DevTools Console 是否有：

```text
TypeError
ReferenceError
Cannot read properties of undefined
is not a function
```

如果存在运行时异常，优先修异常，不要先改输入、状态机、相机或美术。

### 3. 搜索报错符号

例如出现：

```text
renderBoundaryWarning is not a function
```

必须直接搜索：

```bash
grep -R "renderBoundaryWarning" src
```

确认调用方和定义方是否匹配。

### 4. 再检查状态机

只有在静态检查和控制台异常都清理干净后，才检查：

```text
phase
selectedRace
selectedSchool
selectedWeapon
waveNum
enemies.length
projectiles.length
input.state.moveDir
input.state.shooting
player.pos
camera.pos
```

### 5. 最后才改体验逻辑

输入、相机、自动开火、敌人刷新、营地交互、视觉反馈，都属于体验逻辑。它们不能用来掩盖编译错误或运行时异常。

## 禁止事项

### 禁止绕过系统补丁

不允许为了“看起来能动”而在 `main.ts` 里额外直接移动玩家，例如：

```ts
player.pos.x += ...
```

战斗移动必须走：

```text
Input -> Game.update -> Player.update
```

### 禁止硬写自动开火

自动开火必须是玩家可选项，不能写成：

```ts
shooting = true || ...
```

正确方向是：

```text
默认关闭；
鼠标左键 / J / 空格手动攻击；
F 切换自动开火。
```

### 禁止用 monkey patch 代替正式修复

临时 patch 可以用于验证，但不能长期保留为核心架构，例如：

```ts
Game.prototype.render = ...
Game.prototype.selectWeapon = ...
```

如果验证有效，应尽快把逻辑合并回对应类本体。

### 禁止只看画面下结论

Canvas 游戏在热更新后可能出现旧循环残留画面。画面不一定等于当前实例状态。必须结合：

```text
TypeScript 编译
浏览器控制台
运行时 debug
真实调用栈
```

一起判断。

## 开发前检查清单

每次修改核心逻辑前，必须至少做以下检查：

```bash
npm run typecheck
```

如果修改了渲染、输入、状态机、实体或 UI，还要人工检查：

```text
1. 是否新增了不存在的方法调用？
2. 是否修改了 phase 流程？
3. 是否引入了第二套移动/攻击逻辑？
4. 是否让 main.ts 承担了 Game 本体职责？
5. 是否可能产生多 requestAnimationFrame 循环？
6. 是否保留了临时 debug / monkey patch？
```

## 推荐架构边界

```text
main.ts
只负责初始化、主循环、顶层模式切换。不直接移动玩家，不直接生成战斗弹体。

Input.ts
只负责输入采集，输出 moveDir / aimDir / shooting / autoFire 状态。

Game.ts
负责游戏状态机、玩家移动、攻击、波次、实体更新、局内渲染。

Player.ts / Enemy.ts / Projectile.ts / Pickup.ts
负责实体自身数据和绘制。

UI 文件
只负责 UI 渲染和 UI 点击选择，不改变底层战斗规则。

RunSupplyRuntime.ts
只负责局内补给系统，不覆盖核心战斗输入链路。
```

## 本次教训

这次最大的问题不是某一个 bug，而是排查顺序错了。

正确做法应该是：

```text
先 typecheck；
再看 console；
再搜缺失方法；
再看状态机；
最后才动输入和体验逻辑。
```

错误做法是：

```text
根据画面猜测输入坏了；
根据状态面板猜测 phase 错了；
绕过 Input 加保底移动；
用 monkey patch 接管 Game 流程；
没有先验证 TypeScript 编译。
```

以后所有 AI 协作者必须避免重复这个错误。
