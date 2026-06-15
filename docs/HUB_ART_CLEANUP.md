# 营地建筑资源清理说明

## 目标

营地建筑图目前来自生成图或手工切图，容易残留：

- 白色背景板
- 棋盘格透明预览底
- 建筑外圈白边
- 浅灰半透明污染

`HubCampPanel.ts` 已经有一层运行时清理兜底，但最稳定的方案仍然是把 PNG 本体处理成真正透明图。

## 使用命令

```bash
npm run clean:hub-art
```

脚本位置：

```text
scripts/clean-hub-sprites.mjs
```

处理范围：

```text
public/assets/sprites/hub/*_back.png
public/assets/sprites/hub/*_front.png
```

不会处理：

```text
public/assets/sprites/hub/camp-ground.png
```

因为地面图本身不应该变透明。

## 备份规则

第一次执行时，脚本会把原始图复制到：

```text
public/assets/sprites/hub/_originals/
```

该目录已加入 `.gitignore`，不要提交备份图。

## 清理逻辑

脚本不依赖 `sharp` 或 `jimp`，使用 Node 内置能力解析 PNG。

主要清理：

1. 从图片边缘开始 flood fill，移除连通到边缘的白底、棋盘格、灰白污染。
2. 移除明显接近纯白的背景像素。
3. 输出标准 RGBA PNG。

## 注意

如果某张建筑图里真正需要保留的大面积白色装饰也被误删，需要回退该单张图，再重新导出透明 PNG。

推荐流程：

```bash
npm run clean:hub-art
npm run typecheck
npm run build
```

然后进入营地重点检查：

- 建筑边缘是否还有白色方块
- 棋盘格是否消失
- 建筑内部是否被误挖空
- 前后层遮挡是否仍然正常
