# 武器扩展与战斗视觉降噪说明

本文件记录“大量武器扩展 + 战斗视觉降噪 + 命中范围一致性”的执行状态。

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

### 2. 武器视觉语义

`src/data/weapons.ts` 和 `src/data/weaponExpansion.ts` 中的武器支持：

```text
category
subCategory
visualRole
tags
```

`visualRole` 的含义：

```text
none：不常驻画特效
aura：淡淡附魔光晕
burst：短暂爆发
field：允许小范围场域提示
orbit：允许小半径环绕提示
trail：只应体现在攻击轨迹或弹体尾迹
```

硬规则：

```text
圈代表范围或场，不代表“我变强了”。
线代表攻击轨迹，不代表常驻状态。
流派信息属于 UI，不应该直接压在角色头顶。
```

### 3. 新武器通用攻击 profile

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

### 4. BuildEffectOverlay 视觉降噪

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
角色头顶出现流派名
```

新规则：

```text
不再在角色头顶显示流派名。
普通流派成型只显示非常淡的脚底气息。
只有 visualRole = field 的武器允许小范围场域提示。
只有 visualRole = orbit 的武器允许小半径环绕提示。
杂交大成只显示短脉冲，不再铺满屏幕。
```

目标：

```text
特效更少，但语义更准。
人物主体不能被常驻光效盖住。
流派名称只应在 StatsPanel / HUD / 升级界面显示。
```

### 5. Projectile 视觉与命中统一

修改：

```text
src/entities/Projectile.ts
src/systems/CombatSystem.ts
```

新增统一命中语义：

```text
ProjectileHitShape = circle | capsule | wide_wave
ProjectileHitProfile = shape + radius + length + width
```

现在不再只使用 `p.hitRadius` 小圆点命中。

`CombatSystem.projectileHitsEnemy()` 已统一改为：

```text
p.hitsCircle(e.pos, e.radius)
```

当前规则：

```text
arrow：窄胶囊，匹配箭矢长度
energy / drone / magic：胶囊或圆形，匹配视觉尾迹
spear_beam：长胶囊，匹配枪芒长条
sword_wave：宽胶囊，匹配剑气弧线
shockwave：wide_wave，匹配地裂 / 震荡视觉
hammer：扩张圆，匹配重击冲击圈
```

硬规则：

```text
以后任何新增 projectile 只要视觉不是圆，就必须配置 hitProfile。
视觉长度变大，hitProfile.length 必须同步变大。
视觉宽度变大，hitProfile.width 必须同步变大。
禁止只改 renderXXX() 不改 hitProfile。
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

### 8. 检查脚本防污染

修改：

```text
scripts/check-combat-feel.mjs
```

现在检查脚本会确认：

```text
ProjectileHitShape / ProjectileHitProfile / hitProfile / hitsCircle 存在。
CombatSystem 使用 p.hitsCircle(e.pos, e.radius)。
BuildEffectOverlay 不再包含 renderBuildBadge。
BuildEffectOverlay 不再调用 fillText(label...) 在角色头顶绘制流派名。
```

## 仍需继续重点验证

### 1. 枪芒不能自动攻击

设计目标：

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

### 2. 300 张升级卡目前是模板卡

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
npm run check:combat-feel
npm run typecheck
npm run build
npm run dev
```

### 必测 1：头顶文字

```text
角色头顶不应再出现“奥术入门 / 枪术大成 / 科技成型”等流派文字。
这些信息只应在左侧属性面板或 HUD 中出现。
```

### 必测 2：视觉与命中一致

```text
箭矢：擦到箭身应能命中，不再只认箭头小圆点。
枪芒：整条枪芒都应有判定。
剑气：弧线视觉覆盖处应更容易命中。
地裂 / 震荡波：波纹覆盖区域应有判定。
能量弹 / 魔法弹：尾迹明显时，判定不能过小。
```

### 必测 3：新增武器不污染

```text
新增武器可以有不同 visualRole。
但非 field 武器不应出现大场域圈。
非 orbit 武器不应出现常驻环绕圈。
新增 projectile 必须补 hitProfile。
```
