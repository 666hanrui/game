# 局内补给系统静态结构整理记录

本文件记录这次对局内补给运行时的静态整理和审查结果。

## 本次整理目标

`src/systems/RunSupplyRuntime.ts` 已经承载了掉落、拾取、持续效果、战术装置、视觉表现、刷新权重等多类逻辑。继续堆功能会让文件越来越难维护。

因此本次整理先做低风险拆分：

- 不改局内补给的玩法效果。
- 不改 `Game.ts`。
- 不改 `GameWithSound.ts`。
- 不改 `Enemy.ts`。
- 不改 `Projectile.ts`。
- 只把类型、配置、权重、颜色、名称、清理阶段拆出。

## 新增文件

### src/systems/runSupplyTypes.ts

集中保存运行时类型：

- `RuntimeSupplyId`
- `ConstructId`
- `RuntimeSupplyDrop`
- `RuntimeEffect`
- `RuntimeConstruct`
- `FloatingSupplyText`

这样后续如果要把视觉、掉落、持续效果拆成更多文件，可以直接复用这些类型。

### src/systems/runSupplyConfig.ts

集中保存运行时配置：

- 世界尺寸：`RUN_SUPPLY_WORLD`
- 补给中文名：`SUPPLY_LABELS`
- 补给颜色：`SUPPLY_COLORS`
- Boss 额外补给池：`BOSS_BONUS_SUPPLY_POOL`
- 阶段清理规则：`shouldClearRunSupplyOnPhase()`
- 普通刷新权重：`pickRuntimeSupplyId()`
- Boss 额外奖励选择：`pickBossBonusSupplyId()`

这样后续调数值不用翻完整运行时文件。

## 修改文件

### src/systems/RunSupplyRuntime.ts

本次主要变化：

- 移除文件顶部内联类型定义。
- 移除 `WORLD_W / WORLD_H` 硬编码常量。
- 移除 `labelFor()` 和 `colorFor()` 两个 switch。
- 移除 `pickBossBonusId()` 内联奖励池。
- 保留 `pickSpawnId()`，但内部改为调用配置函数。
- 所有颜色读取统一走 `getSupplyColor()`。
- 所有默认名称读取统一走 `getSupplyLabel()`。

## 静态审查结果

### 1. RuntimeSupplyId 覆盖情况

当前运行时正式接入 12 个补给：

- 磁铁：`magnet`
- 护盾：`shield`
- 急速药剂：`haste_potion`
- 攻击药剂：`power_potion`
- 血包：`health_pack`
- 回春露：`regen_dew`
- 暴击药剂：`crit_potion`
- 冰霜炸弹：`frost_bomb`
- 雷击符石：`thunder_stone`
- 地裂符石：`quake_stone`
- 诱饵人偶：`decoy_doll`
- 机械炮台：`turret_pack`

`src/data/runItems.ts` 里还有一些未接入运行时的预留补给，例如：

- `small_magnet`
- `cleanse_charm`
- `rage_potion`
- `merc_horn`
- `bone_horn`
- `harvest_mark`
- `soul_lantern`

这些目前没有放进 `RuntimeSupplyId`，属于后续批次，不是遗漏。

### 2. 宝箱边界

本次没有改宝箱逻辑。

当前局内补给仍然只服务单局战斗节奏，不应该进入宝箱主奖励池。

### 3. 击杀结算边界

雷击符石和机械炮台仍然使用玩家侧 `Projectile`。

地裂符石的伤害部分仍然使用玩家侧 `hammer` 弹体。

这些设计是为了避免绕过 `Game.ts` 原有击杀、经验、掉落结算。

### 4. 临时属性加成风险

当前 `RunSupplyRuntime` 使用以下流程处理临时属性：

```text
beforeGameUpdate(): 先移除上一帧临时加成
afterGameUpdate(): 最后重新施加当前帧临时加成
```

这可以避免伤害、攻速、暴击在每帧重复叠乘。

但仍建议本地重点验证：

- 连续拾取攻击药剂后，伤害是否稳定回落。
- 连续拾取急速药剂后，攻速是否稳定回落。
- 暴击药剂结束后，暴击率和暴击倍率是否恢复。
- 暂停、升级选择时，临时效果是否不会被意外清空。

### 5. 阶段清理规则

当前配置中会清理局内补给状态的阶段：

```text
menu
meta_upgrade
result
```

升级、选择体系、选择武器、暂停阶段不在清理列表中。

也就是说，暂停和升级选择不会消耗补给倒计时，也不会清空场上装置。

## 本地测试建议

请本地重点测试：

1. 进入游戏后补给是否正常刷新。
2. 拾取磁铁后经验晶体是否吸附。
3. 护盾是否能抵挡一次伤害。
4. 血包和回春露回血是否正常。
5. 攻击药剂、急速药剂、暴击药剂结束后属性是否恢复。
6. 冰霜炸弹是否减速周围敌人。
7. 雷击符石是否能发射能量弹。
8. 地裂符石是否能击退、破甲并释放环形钝击弹体。
9. 诱饵人偶是否会牵引怪物，且不会造成怪物明显抖动。
10. 机械炮台是否会自动攻击，且击杀后经验正常掉落。
11. 回主菜单、结算、局外强化后，补给效果和临时装置是否清空。

## 后续拆分建议

如果这版本地测试正常，下一步可以继续拆：

- `RunSupplyRenderer.ts`：专门负责补给、装置、状态条、光环渲染。
- `RunSupplyEffects.ts`：专门负责拾取后的效果触发。
- `RunSupplySpawner.ts`：专门负责刷新权重和掉落位置。

这次没有一步拆太狠，是为了避免在你本地测试前引入太多不确定性。
