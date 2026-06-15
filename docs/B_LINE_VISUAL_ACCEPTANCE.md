# B 线视觉验收清单

这份清单用于统一验收“美术辨识度 + 营地建筑化 + 角色资源清理 + 武器挂点”相关改动。

## 一、拉取后命令检查

推荐顺序：

```bash
git pull
npm run clean:art
npm run check:b-line
npm run build
npm run dev
```

如果只想先看营地布局坐标，也可以执行：

```bash
npm run export:hub-preview
```

会生成：

```text
docs/generated/hub-layout-preview.svg
```

其中：

```text
clean:art          清理营地建筑、角色 walk sheet、怪物 PNG 的白底污染
check:hub-layout   检查营地布局数据、资源路径、建筑 id、碰撞矩形
check:art          检查 assetManifest 资源、营地 back/front、walk sheet、怪物 PNG
check:anchors      检查武器挂点表结构
check:copy         检查营地玩家可见文案是否混入开发术语
check:b-line       串起布局、美术、挂点、文案、TypeScript 检查
export:hub-preview 导出营地布局 SVG 预览图
```

GitHub Actions 已新增 B 线检查工作流：

```text
.github/workflows/b-line-visual-check.yml
```

修改营地、美术资源、武器挂点或检查脚本时，会自动跑 `npm run check:b-line` 和 `npm run build`。

## 二、营地地图验收

进入游戏后先看营地。

### 1. 画面边界

检查：

```text
地图边界是否还有突兀纯绿色硬边；
迷雾是否能自然遮住边缘；
右侧和下侧是否还露底；
大屏和小屏下是否都能接受。
```

### 2. 建筑白底污染

重点看：

```text
铁匠工坊
材料仓库
资源仓库
符文合成台
任务公告栏
宝箱陈列台
```

检查：

```text
建筑周围是否还有白色方框；
是否还有棋盘格透明预览底；
建筑内部是否有明显不属于画面的白块；
清理脚本是否误删了建筑真实白色装饰。
```

### 3. 建筑遮挡

检查：

```text
玩家走到建筑后方时，是否能被 front 层遮住；
玩家走到建筑前方时，是否能压在建筑前；
屋檐、门框、柱子遮挡是否自然；
是否有建筑永远盖住玩家或永远被玩家盖住。
```

如果遮挡不对，优先调：

```text
src/data/hubCampLayout.ts -> depthY
```

### 4. 建筑碰撞

逐个建筑检查：

```text
远征城门
天赋祭坛
资源仓库
材料仓库
铁匠工坊
药剂屋
任务公告栏
符文合成台
宝箱陈列台
收复沙盘
异种档案馆
```

要求：

```text
可以靠近门口；
门口能显示 E 交互；
不能从侧边钻进建筑内部；
不能卡死在建筑边缘；
不能越过地图边界。
```

如果挡得太死或能钻进去，优先调：

```text
src/data/hubCampLayout.ts -> solidRects
```

### 5. 交互动作

靠近每个建筑按 E：

```text
远征门 -> start
合成台 -> open_crafting
材料仓库 -> open_material_storage
资源仓库 -> open_economy_storage
天赋祭坛 -> open_talents
任务板 -> open_quests
道具工坊 -> open_workshop
药房 -> open_apothecary
战利品台 -> open_loot
收复地图 -> open_map
异种档案 -> open_archive
```

`HubCampPanel` 只负责返回动作，真正打开面板由 `HubSubPanelManager` 负责。

### 6. 玩家可见文案

检查底部建筑说明：

```text
不要出现 open_xxx；
不要出现 HubSubPanelManager；
不要出现具体类名；
不要出现 game.metaXXX 这种内部存储名；
应该像真正游戏里的建筑说明。
```

如果不确定，运行：

```bash
npm run check:copy
```

## 三、局内角色验收

### 1. 营地主角

营地主角应该是人族 walk sheet，不应该再是蓝色圆形小人。

检查：

```text
站立帧正常；
上下左右移动帧正常；
脚底锚点稳定；
没有原地踏步但坐标不动的问题。
```

### 2. 非人族白框

重点检查：

```text
哥布林
灵族
精灵
兽人
```

要求：

```text
人物周围没有白色方框；
没有浅灰背景板；
黑色描边没有被清理脚本误删；
角色眼睛、高光、透明发光区域没有被挖空。
```

如果仍有白框：

```bash
npm run clean:character-art
```

如果被误删细节：

```text
从 public/assets/sprites/races/_originals_walk/ 恢复对应图片，然后手工导出透明 PNG。
```

### 3. 人族武器姿势

重点测试：

```text
bow
spear
mace
wand
staff
flying_blade
orb
energy_core
drone_core
```

要求：

```text
武器不要飘在身体外；
拳头尽量压在握柄附近；
上下左右移动时武器不要大幅抖动；
瞄准左侧时武器不要倒立；
狼牙棒不要插进身体，也不要离手太远。
```

如果某把武器姿势怪，优先改：

```text
src/data/weaponAnchors.ts
```

不要优先改 `Player.ts` 的通用武器数学逻辑。

## 四、敌人与掉落物辨识度

检查：

```text
普通怪、快怪、坦克怪、远程怪、精英、Boss 是否轮廓明显不同；
爆炸怪、召唤怪、治疗怪是否一眼能分辨；
经验晶体是否仍是小蓝色菱形；
局内补给不要和宝箱材料混淆。
```

重点原则：

```text
不要只靠颜色区分；
小尺寸下一眼能看懂；
危险单位要比普通单位更明显；
支援单位要有清晰图标或轮廓提示。
```

## 五、回归风险点

每次 B 线更新后重点确认：

```text
没有改 Game.ts；
没有改 main.ts；
没有改 GameOpeningFlowFix.ts；
没有改怪物行为逻辑；
没有把局内补给写进宝箱奖励；
没有把 HubCampPanel 改回旧文字面板；
没有删除 HubSubPanelManager 的动作接入方式。
```

## 六、推荐反馈格式

如果发现问题，截图时尽量说明：

```text
1. 当前建筑 / 角色 / 武器名称；
2. 玩家站在地图的大概位置；
3. 是碰撞问题、白边问题、遮挡问题还是交互问题；
4. 是否运行过 npm run clean:art；
5. 是否运行过 npm run check:b-line。
```

这样可以直接定位到：

```text
hubCampLayout.ts
weaponAnchors.ts
资源 PNG
清理脚本
HubCampPanel.ts 渲染层
```
