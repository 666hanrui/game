# 战斗爽感第五六七阶段执行说明

本文件记录 `docs/COMBAT_FEEL_REWORK_PLAN.md` 的第五、六、七阶段落地内容。

## 阶段 5：升级面板联动提示与阶段成长

新增：

```text
src/systems/SkillStageRuntime.ts
```

修改：

```text
src/ui/LuckyUpgradePanel.ts
```

现在升级卡描述会合并三类信息：

```text
1. 当前等级 / 本次选择等级。
2. 当前效果与下一级效果。
3. 已激活联动或选择后可激活联动。
```

示例：

```text
枪芒
当前：尚未获得，本次会解锁机制。
下一级：I：长枪刺击后释放一道枪芒。
选择后联动：雷贯枪芒。
```

重复抽到同一张升级卡时，不再只显示数值倍率，而是会告诉玩家下一段会变成什么。

## 阶段 6：命中反馈第一版

新增：

```text
src/systems/HitEffectRuntime.ts
```

该文件集中维护 projectile / 联动 / 暴击对应的命中反馈参数：

```text
颜色
粒子数量
粒子大小
冲击力度
是否需要冲击环
```

当前覆盖：

```text
arrow
magic
heavy_magic
energy
drone
blade
hammer
spear_beam
sword_wave
shockwave
```

以及联动倾向：

```text
lightning_split_arrow
lightning_spear_beam
fire_explosive_arrow
fire_mace_quake
ice_frost_arrow
ice_spear_beam
ice_mace_quake
poison_blade_whirl
arcane_drone
```

注意：当前阶段先把命中反馈参数统一成运行时表，便于后续 Game.ts 继续把所有命中特效调用收口到该 runtime。

## 阶段 7：流派成型和杂交大成

新增：

```text
src/systems/BuildProgressRuntime.ts
```

修改：

```text
src/ui/BuildEffectOverlay.ts
src/ui/StatsPanel.ts
```

### 流派点数

现在会统计：

```text
bow
spear
blade
mace
magic
tech
martial
neutral
```

阶段规则：

```text
2 点：初成
4 点：成型
7 点：大成
```

稀有度会影响点数：

```text
common = 1
rare = 1.15
epic = 1.35
legendary = 1.8
diamond = 2.6
```

### 杂交大成

现在会根据主路线阶段 + 已激活隐藏联动，识别：

```text
雷羽箭阵
熔岩地裂
雷贯枪阵
毒刃风暴
奥术无人机群
霜痕箭雨
杂交大成
```

### UI 表现

`BuildEffectOverlay` 现在会：

```text
显示当前流派名。
显示联动数量。
成型后增强角色周围路线光效。
杂交大成后显示额外彩色光环。
```

`StatsPanel` 现在会显示：

```text
流派名
阶段点数
隐藏联动数量
已激活联动名
杂交大成描述
```

## 当前没有做的事

为了避免直接改爆战斗主循环，本阶段没有重构 `Game.ts` 的所有命中特效调用。

当前做法是：

```text
1. 已建立 HitEffectRuntime 统一规则表。
2. 已让 UI 和流派系统开始统一读取 BuildProgressRuntime。
3. 后续如果继续推进，可以把 Game.ts 中 spawnParticles / addText 的命中反馈逐步迁移到 HitEffectRuntime。
```

## 本地建议检查

```bash
npm run check:combat-feel
npm run check:b-line
npm run typecheck
npm run build
```

## 本地重点验证

```text
1. 升级面板是否显示当前 / 下一级效果。
2. 重复抽到同一张升级卡时，是否能看出强化阶段变化。
3. 左侧属性面板是否显示阶段点数和隐藏联动数量。
4. 成型后角色周围 BuildEffectOverlay 是否更明显。
5. 形成雷羽箭阵 / 熔岩地裂 / 雷贯枪阵等条件后，是否出现杂交大成名称。
6. 页面是否因为新文字过长导致卡牌严重溢出。
```
