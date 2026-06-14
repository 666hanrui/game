# Roguelike Game

一个以“弓箭手大作战 / Roguelike 生存割草”为基础方向的实验游戏项目。

当前核心方向：

```text
种族体系
武器体系
局内成长
局外营地
天赋与材料
补给与宝箱
异种占领土地的收复目标
```

## 本地运行

```bash
npm install
npm run dev
```

## 静态检查

每次修改核心逻辑前，必须先运行：

```bash
npm run typecheck
```

等价命令：

```bash
npm run check
```

## 构建

```bash
npm run build
```

## AI 协作开发纪律

继续开发前必须阅读：

```text
docs/AI_DEVELOPMENT_DISCIPLINE.md
```

这份文档记录了一次严重调试事故后的教训，包括：

```text
先跑 TypeScript 静态检查；
先看浏览器控制台异常；
先搜索缺失方法；
不要根据画面直接猜输入或状态机；
不要用 main.ts 绕过 Game/Input 做保底移动；
不要硬写自动开火；
不要长期保留 monkey patch；
不要让旧 requestAnimationFrame 循环干扰新实例。
```

## 推荐开发顺序

```text
1. npm run typecheck
2. 检查浏览器 Console
3. 搜索报错符号
4. 再检查 phase / selectedWeapon / input / player / camera
5. 最后才改体验逻辑和视觉表现
```

## 核心架构边界

```text
main.ts
只负责初始化、主循环、顶层模式切换。

Input.ts
只负责输入采集，输出 moveDir / aimDir / shooting / autoFire。

Game.ts
负责状态机、玩家移动、攻击、波次、实体更新、局内渲染。

entities/
负责玩家、敌人、弹体、掉落物等实体。

ui/
负责界面显示和选择面板。

systems/
负责波次、目标、局内补给、局外成长等系统。
```
