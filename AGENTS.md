# AI 代理开发守则

本项目允许 AI 协作开发，但必须遵守以下规则。

## 开发前硬性检查

在修改核心逻辑前，先执行：

```bash
npm run typecheck
```

如果出现 TypeScript 错误，不允许先改输入、相机、状态机或 UI 体验。必须先修编译错误。

## 调试顺序

遇到不能移动、不能攻击、画面异常、状态不同步时，必须按顺序排查：

```text
1. npm run typecheck
2. 浏览器 DevTools Console
3. 搜索报错符号
4. 检查 phase / selectedWeapon / input / player / camera
5. 最后才改体验逻辑
```

## 禁止行为

```text
禁止在 main.ts 里绕过 Game/Input 直接移动玩家。
禁止写 shooting = true || ... 这种硬开火逻辑。
禁止长期保留 Game.prototype monkey patch。
禁止只根据画面猜测状态机问题。
禁止在未跑 typecheck 的情况下连续提交核心逻辑修改。
```

## 架构边界

```text
main.ts：初始化、主循环、顶层模式切换。
Input.ts：输入采集，输出 moveDir / aimDir / shooting / autoFire。
Game.ts：状态机、移动、攻击、波次、实体更新、局内渲染。
entities/：实体数据和绘制。
ui/：界面显示和点击选择。
systems/：波次、目标、补给、局外成长等系统。
```

## 事故教训

曾经因为 `Game.ts` 调用了 `Minimap.ts` 中不存在的 `renderBoundaryWarning` 方法，导致 TypeScript 编译失败和运行时渲染崩溃。由于没有第一时间跑 `npm run typecheck`，排查方向错误地转向输入系统、状态机和热更新残留，浪费了大量时间。

以后必须先处理编译错误和控制台异常，再分析游戏逻辑。

完整复盘见：

```text
docs/AI_DEVELOPMENT_DISCIPLINE.md
```
