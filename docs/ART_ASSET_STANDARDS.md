# 美术资源规范

这份文档约束后续所有生成图、切图、透明导出、walk sheet 和营地建筑资源，避免再次出现白底、棋盘格、尺寸不统一、遮挡不稳定的问题。

## 一、目录规范

### 营地建筑

```text
public/assets/sprites/hub/
```

必须使用：

```text
camp-ground.png
<building>_back.png
<building>_front.png
```

示例：

```text
workshop_back.png
workshop_front.png
apothecary_back.png
apothecary_front.png
```

`camp-ground.png` 是完整地面，不透明。

`*_back.png` 和 `*_front.png` 必须是透明 PNG。

### 种族角色

```text
public/assets/sprites/races/
```

站立头像 / 图标：

```text
human.png
elf.png
goblin.png
orc.png
spirit.png
```

行走帧序列：

```text
human_walk.png
elf_walk.png
goblin_walk.png
orc_walk.png
spirit_walk.png
```

### 怪物资源

```text
public/assets/sprites/enemies/
```

推荐命名：

```text
slime.png
spider.png
skeleton.png
bomber.png
summoner.png
healer.png
boss_*.png
```

### 武器资源

```text
public/assets/sprites/gear/
```

推荐命名直接等于武器 id：

```text
bow.svg
staff.svg
spear.svg
mace.svg
```

如果新增 PNG 武器，也保持与 `src/data/weapons.ts` 中的 `id` 一致。

## 二、透明规范

所有角色、怪物、建筑前后层都必须是真透明 PNG。

禁止提交：

```text
白色背景板
灰色背景板
透明预览棋盘格
截图裁剪留下的白边
AI 生图输出的纯白底没抠干净版本
```

允许保留：

```text
角色眼睛高光
武器高光
灵族半透明发光
建筑真实白色装饰
```

所以不能简单粗暴“删除所有白色像素”。

## 三、营地建筑 back/front 分层规范

每个建筑必须拆成两层：

### back 层

包含：

```text
建筑主体后半部分
墙体
地基
玩家应该能站在前面的部分
```

### front 层

包含：

```text
屋檐
门框前景
柱子前景
柜台前沿
会盖住玩家的遮挡部分
```

原则：

```text
玩家在建筑后面时被 front 层自然遮住；
玩家在建筑前面时不要被整栋楼盖住；
front 层不要包含整张大白底；
front 层不要把交互门口完全盖死。
```

## 四、营地坐标规范

营地建筑坐标统一维护在：

```text
src/data/hubCampLayout.ts
```

不要把建筑坐标写回 `HubCampPanel.ts`。

调参优先级：

```text
建筑位置/大小 -> x / y / w / h
建筑底座 -> footprint
建筑主体碰撞 -> solidRects
交互点 -> interactPoint / interactRadius
遮挡顺序 -> depthY
资源路径 -> HUB_ART_PATHS
```

## 五、walk sheet 规范

角色行走图统一为 4×4：

```text
4 列：每个方向 4 帧
4 行：down / up / left / right
```

行顺序必须是：

```text
第 1 行：down
第 2 行：up
第 3 行：left
第 4 行：right
```

每一帧要求：

```text
脚底锚点尽量在同一水平线；
角色不要在格子里上下大跳；
人物不要贴边，至少留 2-4 像素透明边；
不要有白色方框；
不要带棋盘格。
```

## 六、像素尺寸建议

### 角色 walk sheet

推荐：

```text
单帧 64×64
整图 256×256
```

如果不是这个尺寸，也必须保证宽高都能被 4 整除。

### 营地建筑

建议单栋建筑资源不要超过：

```text
512×512
```

太大会导致运行时清理和渲染压力变高。

### 怪物图

普通怪建议：

```text
64×64 或 96×96
```

Boss 可以更大，但要确认小地图和局内缩放下仍然清楚。

## 七、脚本流程

资源提交前建议执行：

```bash
npm run clean:art
npm run check:art
npm run check:hub-layout
npm run check:b-line
```

如果只换营地建筑：

```bash
npm run clean:hub-art
npm run check:hub-layout
npm run check:art
```

如果只换角色或怪物：

```bash
npm run clean:character-art
npm run check:art
```

如果只改武器挂点：

```bash
npm run check:anchors
npm run typecheck
```

## 八、生图提示词约束

生成营地建筑时必须明确：

```text
transparent background
isolated building asset
pixel art game asset
no text
no watermark
no white background
no checkerboard background
front/back layer if needed
```

生成角色 walk sheet 时必须明确：

```text
4x4 sprite sheet
four directions: down, up, left, right
four frames per direction
consistent foot anchor
transparent background
pixel art game character
no white square background
```

生成怪物时必须明确：

```text
transparent background
small readable silhouette
not only color difference
clear role icon or outline
pixel art enemy sprite
```

## 九、禁止事项

不要提交：

```text
AI 生图原图直接丢进 hub 目录；
带白底的截图；
没有 back/front 的大型建筑；
不满足 4×4 的 walk sheet；
靠颜色区分但轮廓完全一样的怪物；
和 assetManifest.ts 不一致的资源路径；
和 weapons.ts 不一致的武器文件名。
```

## 十、出现问题时怎么定位

```text
建筑能钻进去 -> hubCampLayout.ts 的 solidRects
建筑不能靠近交互 -> interactPoint / interactRadius
玩家遮挡不对 -> depthY 或 front 图层
建筑白边 -> clean:hub-art 或重新导透明 PNG
角色白框 -> clean:character-art 或重新导透明 walk sheet
人族武器姿势怪 -> weaponAnchors.ts
资源丢失 -> check:art
布局数据错误 -> check:hub-layout
```
