# 战斗爽感第一批执行说明

本文件记录 `docs/COMBAT_FEEL_REWORK_PLAN.md` 第一批落地内容。

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

这一步先把“哪些武器天生远程，哪些武器前期必须近战”的数据边界立起来。

## 尚未完成

第一批里还有这几项需要继续推进：

```text
1. Game.ts / 战斗运行时根据 attackMode 区分远程和近战。
2. 长枪初始改成真正近战刺击。
3. 狼牙棒初始改成真正近战重击。
4. 飞刃改成短距离回旋或返回机制。
5. 剑系武器目前尚未进入武器表，后续新增剑时应使用 melee_slash。
6. 近战命中特效和近战判定还需要接入运行时。
```

## 重要边界

不要新增玩家可见的新卡种。

枪芒、剑气、地裂、震荡波都只是普通升级卡的效果，不是单独的“形态解锁卡”。

元素不要进入局内升级卡池，元素倾向后续由天赋提供。

## 本地建议检查

```bash
npm run typecheck
npm run build
```

进入游戏后优先观察：

```text
弓箭是否看起来像箭；
魔法弹是否明显区别于箭；
科技弹是否明显区别于魔法；
无人机弹是否像三角脉冲；
飞刃是否不再像普通球；
狼牙棒相关 projectile 是否更像冲击圈。
```
