# Projectile performance rework

This note records the first performance foundation pass for bullet-heavy combat.

## Implemented

### Enemy projectile pacing

`src/entities/Projectile.ts` now has an internal spawn-token gate for enemy projectiles.

Purpose:

- prevent ranged enemies and bosses from flooding the frame with unlimited new projectiles
- keep burst pressure, but avoid runaway projectile creation when many shooters are alive

The current values are stored in:

```ts
Projectile.perf.maxEnemyTokens
Projectile.perf.enemyRefill
```

### Projectile render degradation

`Projectile.renderAt()` now resolves a render quality per frame:

```ts
ProjectileRenderQuality = "full" | "simple" | "minimal"
```

When too many projectiles are rendered in one frame:

- early projectiles use full visual rendering
- later projectiles use simple line / dot rendering
- overflow projectiles use minimal rendering

This keeps the visual identity while reducing expensive Canvas work such as gradients, shadows, and large transparent fills.

### Shockwave visual window

`shockwave` projectiles now have a visual window budget.

If too many shockwaves are created inside a short window, later shockwaves are downgraded to minimal visuals instead of drawing many large transparent ellipses.

Important:

- this is a visual budget, not a direct damage nerf
- the projectile still exists and can still use its hit profile

### Shorter heavy visual lifetime

`shockwave` and `hammer` projectile lifetimes were reduced from the older long-lived visual duration to a shorter duration.

Purpose:

- lower the number of large transparent circles on screen
- reduce overdraw cost
- keep the hit/feel but avoid persistent visual clutter

### Spatial hash grid foundation

New file:

```text
src/systems/SpatialHashGrid.ts
```

It provides:

```ts
rebuild(items)
queryCircle(pos, radius)
```

This is the foundation for replacing projectile-by-every-enemy collision with nearby-cell queries.

Current note:

- the grid exists and is covered by the combat-feel check script
- `Game.ts` still needs to be wired to use it for projectile collision and target search

### Tracking throttle fields

`Projectile` now has:

```ts
nextTrackAt
cachedTargetIndex
```

These fields prepare tracking-arrow and auto-target throttling.

Current note:

- the fields exist on projectile instances
- `Game.updateTrackingArrows()` still needs to use them to avoid full retargeting every frame

## Still open

The following parts require a focused `Game.ts` patch:

1. Rebuild a `SpatialHashGrid<Enemy>` once per frame.
2. Use `grid.queryCircle()` for projectile-vs-enemy checks.
3. Use `grid.queryCircle()` or cached targets for `findNearestEnemy()` heavy callers.
4. Use `Projectile.nextTrackAt` in `updateTrackingArrows()`.
5. Skip rendering offscreen projectiles before calling `Projectile.renderAt()`.

## Local validation

Run locally:

```bash
npm run check:combat-feel
npm run typecheck
npm run build
npm run dev
```

Manual stress checks:

1. Spawn many enemy projectiles and watch whether FPS remains steadier.
2. Use mace shockwave builds and check whether the screen no longer fills with expensive persistent ellipses.
3. Use arrow tracking builds and verify gameplay still works; full throttle wiring is still pending in `Game.ts`.
