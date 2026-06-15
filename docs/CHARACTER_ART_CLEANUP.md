# 角色与怪物资源清理说明

## 目标

用于处理以下问题：

- 哥布林、灵族等 walk sheet 外面出现白色方框
- 角色 PNG 周围残留浅灰背景
- 怪物 PNG 边缘有白底污染

脚本：

```text
scripts/clean-character-sprites.mjs
```

命令：

```bash
npm run clean:character-art
```

也可以和营地建筑清理一起执行：

```bash
npm run clean:art
```

## 处理范围

```text
public/assets/sprites/races/*_walk.png
public/assets/sprites/enemies/*.png
```

## 和营地建筑清理的区别

角色图不能像建筑图那样粗暴全局删除白色像素，因为角色本身可能有：

- 眼睛高光
- 牙齿
- 魔法亮点
- 灵族发光区域
- 怪物身上的白色装饰

所以角色脚本只做：

```text
从图片边缘开始 flood fill，清理连通到边缘的白底 / 浅灰底 / 透明预览底。
```

不会全局删除图片内部白色像素。

## 备份目录

第一次执行时会备份原图：

```text
public/assets/sprites/races/_originals_walk/
public/assets/sprites/enemies/_originals_png/
```

这两个目录已加入 `.gitignore`，不要提交备份图。

## 推荐流程

```bash
npm run clean:art
npm run typecheck
npm run build
```

然后重点检查：

- 哥布林 walk sheet 是否还残留白色方框
- 灵族 walk sheet 是否还残留白色方框
- 怪物 PNG 是否还有白底边
- 角色眼睛和高光是否被误删

## 如果误删怎么办

从对应 `_originals_*` 目录恢复单张图，然后改用手工导出透明 PNG。

不要为了修某个资源，把脚本改成全局删除白色像素，否则很容易误伤角色细节。
