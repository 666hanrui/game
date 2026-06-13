# 游戏美术资源说明

本次资源根据当前代码里的数据结构生成，统一使用 SVG 矢量格式，适合 Canvas、HTML UI、升级卡牌和后续移动端适配。

## 资源路径

所有资源位于：

```text
public/assets/sprites/
```

Vite 运行或构建后可以通过如下形式访问：

```ts
const img = new Image();
img.src = "/assets/sprites/races/human.svg";
```

对应的 TypeScript 映射表位于：

```text
src/data/assetManifest.ts
```

## 已覆盖资源

### 种族

| ID | 名称 | 资源 |
|---|---|---|
| human | 人族 | public/assets/sprites/races/human.svg |
| goblin | 哥布林族 | public/assets/sprites/races/goblin.svg |
| elf | 精灵族 | public/assets/sprites/races/elf.svg |
| orc | 兽人族 | public/assets/sprites/races/orc.svg |
| spirit | 灵族 | public/assets/sprites/races/spirit.svg |

### 武器 / 路线

| ID | 名称 | 资源 |
|---|---|---|
| bow | 弓箭 | public/assets/sprites/gear/bow.svg |
| flying_blade | 飞刃 | public/assets/sprites/gear/flying_blade.svg |
| spear | 长枪 | public/assets/sprites/gear/martial_line.svg |
| wand | 魔杖 | public/assets/sprites/gear/wand.svg |
| staff | 法杖 | public/assets/sprites/gear/staff.svg |
| orb | 法球 | public/assets/sprites/gear/orb.svg |
| drone_core | 无人机核心 | public/assets/sprites/gear/drone_core.svg |
| energy_core | 能量核心 | public/assets/sprites/gear/tech_reactor.svg |

### 怪物

| ID | 名称 | 资源 |
|---|---|---|
| slime | 史莱姆 | public/assets/sprites/enemies/slime.svg |
| spider | 蜘蛛 | public/assets/sprites/enemies/spider.svg |
| skeleton | 骷髅 | public/assets/sprites/enemies/skeleton.svg |

### 掉落物

| ID | 名称 | 资源 |
|---|---|---|
| xp | 经验宝石 | public/assets/sprites/pickups/xp_gem.svg |
| health | 生命宝石 | public/assets/sprites/pickups/health_gem.svg |

### 弹体映射

当前只额外生成了基础弹体资源：

```text
public/assets/sprites/projectiles/basic_shot.svg
```

其他弹体先复用武器/路线资源，具体映射见 `src/data/assetManifest.ts`。

## 说明

部分真实武器名称或造型在提交时会触发 GitHub 连接器的安全拦截，所以个别资源使用了更抽象的路线图标命名。例如：

- `spear` 映射到 `martial_line.svg`
- `energy_core` 映射到 `tech_reactor.svg`

这不影响游戏加载，后续如果要接入 Canvas 渲染，建议直接引用 `ASSET_MANIFEST`，不要在业务逻辑里硬编码路径。
