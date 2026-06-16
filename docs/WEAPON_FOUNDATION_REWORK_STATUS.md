# Weapon foundation rework status

This note records the current weapon foundation rework. It is intentionally short and concrete, so future AI collaborators do not rebuild the same layer again.

## Implemented

### Weapon choice pagination

`src/ui/UpgradePanel.ts` now renders `WeaponPanel` as a paged 3 by 3 grid.

Rules:

- 9 weapons per page.
- Previous and next page buttons.
- Mouse wheel paging is handled inside `WeaponPanel` itself.
- The wheel listener only acts when the panel was rendered very recently, so normal combat screens should not be affected.

This solves the overflowing weapon list after adding many weapons.

### Weapon weight class

`src/data/weapons.ts` defines:

```ts
WeaponWeightClass = "light" | "standard" | "heavy" | "massive"
```

Core weapons now have `weightClass`.

Expanded weapons can still omit it for now. `WeaponStatRuntime` will infer weight from `subCategory` and `tags`.

### Weapon stat runtime

New file:

```text
src/systems/WeaponStatRuntime.ts
```

It provides one central place for weight-based stat identity:

- light: faster, shorter, lower damage, better crit feel
- standard: balanced
- heavy: slower, larger, stronger
- massive: very slow, very large, very strong

The runtime exposes:

```ts
getWeaponStatProfile(weapon)
getWeaponWeightClass(weapon)
getWeaponWeightLabel(weapon)
```

### Melee shape profiles

`src/systems/WeaponAttackRuntime.ts` now has:

```ts
MeleeHitShape = "none" | "thrust_capsule" | "slash_arc" | "slam_circle" | "slam_cone"
```

`WeaponAttackProfile` now includes:

```ts
hitShape
visualLength
visualWidth
visualArc
```

This makes the intended rule explicit:

- visual length should match hit length
- visual width should match hit width
- visual arc should match hit arc

### Weight applied to attack profile

`WeaponAttackRuntime` now reads `WeaponStatRuntime` and applies:

- `rangeMultiplier`
- `projectileSpeedMultiplier`
- `damageMultiplier`

So even if `Game.applyAllMods()` is not fully migrated yet, the attack profile already differentiates light, heavy, and massive weapons.

### Guard script updated

`script/check-combat-feel.mjs` now checks for:

- projectile hit profile
- melee hit shape
- visualLength / visualWidth / visualArc
- weapon weight class
- weapon stat runtime
- weapon panel pagination
- wheel paging inside weapon panel

## Still open

### Game.applyAllMods migration

`Game.applyAllMods()` still has old weapon ID specific branches for core weapons.

The target state is:

```text
Game.ts should not keep adding weaponId === xxx stat branches.
Weapon base stats should come from WeaponStatRuntime.
```

Recommended next step:

- import `getWeaponStatProfile` in `Game.ts`
- remove the old core weapon if branch block
- apply `damageAdd`, `damageMultiplier`, `cooldownAdd`, `cooldownMultiplier`, `critChanceAdd`, and `critMultiplierAdd`

### Melee flash render polish

`Game.renderMeleeFlashes()` still renders from `range`, `width`, and `arc`.

This is acceptable now because those values come from `WeaponAttackProfile`, but the next clean step is to store `hitShape`, `visualLength`, `visualWidth`, and `visualArc` directly on the flash object.

## Local validation commands

Run locally:

```bash
npm run check:combat-feel
npm run typecheck
npm run build
npm run dev
```

Manual checks:

1. Weapon choice should show 9 weapons per page.
2. Previous and next buttons should work.
3. Mouse wheel should page while the weapon panel is visible.
4. Weapon cards should show weight labels.
5. Heavy weapons should feel larger and stronger than light weapons.
6. Thrust, slash, and slam attacks should better match their visible shapes.
