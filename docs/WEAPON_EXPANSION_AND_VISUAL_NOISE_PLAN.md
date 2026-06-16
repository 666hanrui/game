# 武器扩展与战斗视觉降噪说明

本文件记录本轮“大量武器扩展 + 战斗视觉降噪 + 枪芒方向修正计划”的执行状态。

## 已完成

### 1. 三体系武器扩展数据

新增：

```text
src/data/weaponExpansion.ts
```

三大体系各新增 10 把武器：

```text
冷兵器 / 武技：
单手剑、双手剑、匕首、战斧、弩、锁链镰、拳爪、盾刃、太刀、轮刃

魔法：
符文书、雷典、冰晶、火印、暗影灯、召唤书、星盘、藤蔓秘典、时砂漏、魂铃

科技：
电磁枪、散射炮、激光棱镜、榴弹核心、炮台控制器、纳米蜂群、轨道信标、机械弩、特斯拉线圈、等离子刃
```

每把新武器由统一模板生成 10 张升级卡，合计：

```text
30 把新武器
300 张新升级卡
```

升级卡模板包括：

```text
核心强化
节奏优化
副击模块
弱点打击
穿透结构
控场改造
爆发窗口
护身结构
专精
大成式
```

这些先作为数据层接入，用来扩充选择池和流派点数。后续可以再对重点武器手写专属机制。

### 2. 接入 weapons.ts

修改：

```text
src/data/weapons.ts
```

现有 `WEAPONS` 已变为：

```text
核心武器 + EXTRA_WEAPONS
```

并为武器增加可选字段：

```text
category
subCategory
visualRole
tags
```

其中 `visualRole` 用于限制战斗特效语义：

```text
none：不常驻画特效
aura：淡淡附魔光晕
burst：短暂爆发
field：允许画小范围场域提示
orbit：允许小半径环绕提示
trail：只应体现在攻击轨迹或弹体尾迹
```

### 3. 接入 skills.ts

修改：

```text
src/data/skills.ts
```

`SKILL_POOL` 已包含扩展技能：

```text
martial: 旧冷兵器技能 + 新冷兵器升级卡
magic: 旧魔法技能 + 新魔法升级卡
tech: 旧科技技能 + 新科技升级卡
```

### 4. 新武器通用攻击 profile

修改：

```text
src/systems/WeaponAttackRuntime.ts
```

旧武器仍保留专属 profile。

新武器如果没有专属 profile，会根据：

```text
attackMode
school
subCategory
```

生成通用 profile，避免所有新武器都退回默认弓箭。

### 5. BuildEffectOverlay 视觉降噪

修改：

```text
src/ui/BuildEffectOverlay.ts
```

旧版本问题：

```text
常驻大圆圈
常驻大斜线
常驻大轨道
人物被特效盖住
```

新规则：

```text
普通流派成型只显示小徽标 + 淡脚底气息。
只有 visualRole = field 的武器允许小范围场域提示。
只有 visualRole = orbit 的武器允许小半径环绕提示。
杂交大成只显示短脉冲，不再铺满屏幕。
```

目标：

```text
特效更少，但语义更准。
人物主体不能被常驻光效盖住。
```

### 6. SoundSystem 兼容方法

修改：

```text
src/systems/SoundSystem.ts
```

补充：

```text
click()
shoot() -> attack()
enemyDeath() -> kill()
```

用于兼容已有调用，降低 typecheck 风险。

### 7. 扩展武器纳入流派统计

修改：

```text
src/systems/BuildProgressRuntime.ts
```

现在新增武器不会全部落到 neutral。

例如：

```text
弩 / 机械弩 -> bow 路线
单手剑 / 双手剑 / 匕首 / 太刀 / 轮刃 / 锁链镰 / 拳爪 / 等离子刃 -> blade 路线
战斧 / 盾刃 -> mace 路线
魔法新武器 -> magic 路线
科技新武器 -> tech 路线
```

## 尚未完全完成 / 需要下一步继续

### 1. GameWithSound 私有方法冲突

当前仓库仍需要重点验证：

```text
Game.ts 里有 private releaseMaceQuake(...)
GameWithSound.ts 里也有 private releaseMaceQuake(...)
```

这可能导致 TypeScript 子类私有成员冲突。

建议下一步将 `GameWithSound.ts` 里的构筑用地裂方法改名为：

```text
releaseMaceQuakeFX
```

并同步更新调用点。

### 2. 枪芒不能自动攻击

当前设计目标：

```text
枪芒只能由玩家长枪刺击触发。
不能由流派大成定时自动触发。
枪芒方向必须等于玩家长枪刺击方向。
```

需要重点检查 `GameWithSound.ts` 中：

```text
triggerDiamondMartial
releaseWeaponAura
```

这些定时构筑火力是否还会自动发 spear_beam。

如果会，应改成“强化下一次长枪刺击”，而不是系统自动攻击。

### 3. 枪芒视觉与命中范围一致

当前目标：

```text
枪芒视觉是长条，命中也应该是线段 / 胶囊判定。
不能看起来打到了，实际只命中中间一个点。
```

建议下一步新增：

```text
ProjectileHitShape = circle | capsule | arc | field
```

然后给：

```text
spear_beam -> capsule
shockwave -> wide / field
arrow -> circle 或 narrow capsule
```

### 4. 300 张升级卡目前是模板卡

本轮已满足“每把新武器至少 10 张升级卡”的数据量要求。

但这 300 张卡目前是模板化升级，后续最好挑每把武器的 2~3 张核心卡手写专属机制。

优先手写：

```text
单手剑：剑气、连斩、居合
弩：重弩、穿甲弩、连发弩
符文书：奥术法阵、双重符文、法阵收束
雷典：连锁雷标、雷瀑、感电回流
电磁枪：磁轨穿透、过载枪膛、电磁爆头
炮台控制器：轻型炮台、双炮部署、过载炮塔
```

## 本地测试重点

```bash
npm run typecheck
npm run build
npm run dev
```

### 必测 1：选择池

```text
进入体系选择后：
冷兵器是否显示新增武器。
魔法是否显示新增武器。
科技是否显示新增武器。
```

### 必测 2：升级池

```text
选择任意新增武器后，升级卡是否能刷出该武器专属卡。
每把新武器是否能刷到至少 10 类升级卡。
```

### 必测 3：视觉降噪

```text
普通武器不应再出现巨大常驻圆圈和斜线。
field 类武器可以有小范围提示，但不能盖住人物。
orbit 类武器可以有小半径环绕点，但不能铺满屏幕。
杂交大成只应是短脉冲，不应遮挡人物。
```

### 必测 4：长枪

```text
没有枪芒升级前，只能近战刺击。
拿到枪芒后，只能在攻击时释放枪芒。
枪芒方向必须和玩家攻击方向一致。
流派大成不应自动替玩家发枪芒。
```

### 必测 5：编译问题

如果 typecheck 仍报：

```text
releaseMaceQuake 私有成员冲突
```

下一步优先只修 `GameWithSound.ts` 方法重命名，不继续加功能。
