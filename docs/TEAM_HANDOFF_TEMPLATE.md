# 给同事的任务交接模板

复制下面内容给另一个 AI / 协作者即可。

---

你现在协作开发仓库：

```text
666hanrui/game
```

开发前必须先读：

```text
AGENTS.md
docs/AI_DEVELOPMENT_DISCIPLINE.md
docs/DEVELOPMENT_TODO.md
docs/COLLABORATION_TASKS.md
```

硬性要求：

```bash
npm run typecheck
npm run build
```

不要犯这些错误：

```text
不要在 main.ts 里直接移动玩家或直接发射弹体。
不要写 shooting = true || ...。
不要长期保留 Game.prototype monkey patch。
不要只看画面猜状态机，先看 TypeScript 和 Console。
不要和另一个协作者同时大改 Game.ts。
```

当前推荐任务：

```text
走 B 线：营地建筑化。
```

任务范围：

```text
src/ui/HubCampPanel.ts
src/data/hubModules.ts
public/assets/sprites/
```

不要改：

```text
src/core/Game.ts
src/main.ts
src/core/GameOpeningFlowFix.ts
```

目标：

```text
1. 把营地从文字面板改成可移动据点地图。
2. 远征入口做成传送门或城门。
3. 道具工坊做成铁匠铺 / 工坊建筑。
4. 药房做成药剂屋。
5. 任务系统做成告示牌。
6. 合成系统做成符文台或锻造台。
7. 材料仓库做成仓库建筑。
8. 玩家靠近建筑后显示 “E 交互”。
```

完成后请汇报：

```text
改了哪些文件；
有没有跑 npm run typecheck；
有没有跑 npm run build；
还有哪些风险点。
```
