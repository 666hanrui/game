# 武器挂点调参说明

## 背景

人族使用 walk sheet 后，角色身体由帧序列控制，武器如果仍然只按固定半径挂在中心点，会出现：

- 武器像飘在身体外面
- 狼牙棒过远或过大
- 长枪不在手上
- 法杖和魔杖与拳头错位
- 移动帧里武器抖动不自然

因此新增：

```text
src/data/weaponAnchors.ts
```

`Player.ts` 渲染武器时会读取这里的挂点数据。

## 目前覆盖的武器

```text
bow
flying_blade
spear
mace
wand
staff
orb
drone_core
energy_core
```

目前只对 `raceId === "human"` 使用精细挂点。其他种族继续使用通用旧逻辑，避免一次性改坏哥布林、灵族、精灵、兽人已经顺畅的走路表现。

## 参数说明

每个武器挂点最终会落到 `WeaponAnchorFrame`：

```ts
interface WeaponAnchorFrame {
  handRadius: number;
  handOffsetX: number;
  handOffsetY: number;
  spriteOffsetX: number;
  spriteOffsetY: number;
  rotationOffset: number;
  size: number;
  fistOffsetX: number;
  fistOffsetY: number;
}
```

### handRadius

武器整体离角色中心的距离。

- 太大：武器飘在外面
- 太小：武器插进身体

### handOffsetX / handOffsetY

武器整体平移。

- `handOffsetX`：屏幕 X 方向微调
- `handOffsetY`：屏幕 Y 方向微调

常见用途：让武器更靠近手。

### spriteOffsetX / spriteOffsetY

只移动武器图片，不移动拳头。

常见用途：武器图片本身锚点不在中心时微调。

### rotationOffset

在瞄准方向基础上追加旋转。

- 正数：顺时针一点
- 负数：逆时针一点

### size

武器绘制尺寸。

- 狼牙棒通常更大
- 法杖、长枪通常更长
- 法球、核心类通常更小

### fistOffsetX / fistOffsetY

拳头在武器局部坐标里的偏移，使用 `size` 的倍率。

例如：

```ts
fistOffsetX: -0.18,
fistOffsetY: 0.03,
```

代表拳头放在武器中心偏左一点、稍微偏下一点。

## 调参建议

如果人族拿某把武器姿势怪，优先按下面顺序调：

1. `handRadius`：先让武器离身体的距离正常。
2. `handOffsetX/Y`：再让武器整体靠近手。
3. `spriteOffsetX/Y`：如果只有图片不对，再微调武器图本身。
4. `rotationOffset`：最后修角度。
5. `fistOffsetX/Y`：最后把拳头压到武器握柄上。

## 不建议做的事

不要为了修某一把武器，直接改 `Player.ts` 里的通用 `renderWeapon()` 数学逻辑。

正确做法是只改：

```text
src/data/weaponAnchors.ts
```

这样不会影响其他武器，也不会破坏攻击和子弹逻辑。

## 后续计划

如果后续发现精灵、兽人、哥布林拿武器也需要细调，可以把当前的人族挂点表扩展为：

```ts
RACE_WEAPON_ANCHORS[raceId][weaponId]
```

但目前不建议立刻做，因为其他种族的 walk sheet 已经较顺，先集中修人族武器姿势更安全。
