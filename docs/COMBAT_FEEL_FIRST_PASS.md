# 战斗爽感第一阶段执行说明

本文件记录 `docs/COMBAT_FEEL_REWORK_PLAN.md` 第一阶段落地内容。

## 当前已完成

### 1. 投射物视觉辨识度

已修改：

```text
src/entities/Projectile.ts
```

现在 `ProjectileKind` 支持：

```text
arrow
magic
heavy_magic
energy
blade
drone
hammer
spear_beam
sword_wave
shockwave
```

玩家侧投射物不再优先使用通用资源图，避免所有攻击又被画成圆球。

当前视觉规则：

```text
arrow：细长箭矢，带箭头、箭杆、尾羽和拖尾。
magic：紫蓝奥术弹，带粒子尾迹。
heavy_magic：符文飞弹，带六角符文和发光核心。
energy：蓝白菱形能量弹，带扫描线。
drone：小三角脉冲弹，带科技尾迹。
blade：旋转飞刃，短生命周期，偏近中距离。
hammer：狼牙棒冲击视觉，保留冲击圈。
spear_beam：枪芒视觉，作为后续普通升级卡“枪芒”的派生弹体。
sword_wave：剑气视觉，作为后续普通升级卡“剑气”的派生弹体。
shockwave：震荡波视觉，作为后续普通升级卡“震荡波”的派生效果。
```

### 2. 武器基础攻击形态数据

已修改：

```text
src/data/weapons.ts
```

新增：

```ts
export type WeaponAttackMode =
  | "ranged_projectile"
  | "melee_thrust"
  | "melee_slash"
  | "melee_slam"
  | "short_returning_blade"
  | "orbit"
  | "summon";
```

每把武器现在都标记了 `attackMode`。

当前设定：

```text
bow -> ranged_projectile
flying_blade -> short_returning_blade
spear -> melee_thrust
mace -> melee_slam
wand -> ranged_projectile
staff -> ranged_projectile
orb -> orbit
drone_core -> summon
energy_core -> ranged_projectile
```

### 3. 武器攻击运行时配置

已新增：

```text
src/systems/WeaponAttackRuntime.ts
```

这个文件集中维护：

```text
武器基础攻击形态
远程 projectile kind
远程 projectile speed
近战类型
近战距离
近战宽度 / 角度
近战伤害倍率
近战视觉颜色
```

主要导出：

```text
getWeaponAttackProfile()
isMeleeProfile()
isPointInMeleeArc()
```

### 4. 战斗主循环已接入近战基础攻击

已修改：

```text
src/core/Game.ts
```

现在 `fireWeapon()` 会先读取 `getWeaponAttackProfile()`。

如果是远程武器：

```text
继续生成 Projectile。
弓箭 -> arrow。
魔杖 -> magic。
法杖 -> heavy_magic。
能量核心 -> energy。
无人机核心 -> drone。
飞刃 -> blade。
```

如果是近战武器：

```text
不再生成初始远程圆球。
长枪 -> performMeleeAttack() 的 thrust 刺击判定。
狼牙棒 -> performMeleeAttack() 的 slam 重击判定。
```

近战命中仍然使用原本的伤害、暴击、onKill、经验和掉落结算链路，不绕过击杀奖励。

### 5. 近战视觉反馈

已在 `Game.ts` 内新增 `meleeFlashes`。

当前表现：

```text
长枪刺击：向瞄准方向出现细长刺击光。
狼牙棒重击：向瞄准方向出现扇形冲击圈，并带落点粒子。
```

这只是第一阶段的基础表现，后续“枪芒 / 地裂 / 震荡波”会作为普通升级卡继续扩展。

### 6. 战斗爽感检查命令

已新增：

```text
scripts/check-combat-feel.mjs
```

并接入：

```text
npm run check:combat-feel
npm run check:b-line
```

检查内容包括：

```text
Projectile 视觉类型是否还在。
WeaponAttackMode 是否还在。
WeaponAttackRuntime 是否还在。
Game.ts 是否接入 performMeleeAttack 和 renderMeleeFlashes。
重构文档是否还保留“升级卡 / 天赋 / 自动联动”的原则。
```

## 第一阶段已完成范围

```text
1. 弓箭、魔法、科技的弹体辨识度第一版完成。
2. 长枪初始攻击已经不再是远程弹体，而是近战刺击。
3. 狼牙棒初始攻击已经不再是远程弹体，而是近战重击。
4. 飞刃已改为更短生命周期的 blade projectile，视觉上不再是普通圆球。
5. 近战命中和击杀结算仍走原本链路。
6. 检查脚本已接入，避免后续回退。
```

## 后续阶段不要混淆

下一阶段不是新增卡种，而是把这些内容作为普通升级卡继续推进：

```text
枪芒：长枪刺击后额外释放远程枪芒。
剑气：剑系新增后，斩击后额外释放剑气。
地裂：狼牙棒重击后释放地裂波。
震荡波：狼牙棒重击或命中后释放环形震荡。
```

元素仍然不要进入局内升级卡池，元素倾向后续由天赋提供。

## 本地建议检查

```bash
npm run check:combat-feel
npm run check:b-line
npm run typecheck
npm run build
```

进入游戏后优先观察：

```text
弓箭是否看起来像箭。
魔法弹是否明显区别于箭。
科技弹是否明显区别于魔法。
无人机弹是否像三角脉冲。
飞刃是否不再像普通球。
长枪是否不能远程打怪，必须靠近刺击。
狼牙棒是否不能远程打怪，必须靠近重击。
长枪刺击是否有细长刺击光。
狼牙棒重击是否有扇形冲击圈和落点粒子。
击杀敌人后经验和掉落是否仍正常。
```
