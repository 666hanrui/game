# AI 角色动画图（序列帧）处理与导入指南

本文档记录了如何将 AI（如 DALL-E、Midjourney）生成的包含多个角色变体的图表，转化为游戏中能够完美解析的 `4x4` 动画序列帧。

## 问题背景

在游戏中，人物走路动画需要的是一张 `4行4列` 的标准动画序列帧图片（每个方向占1行，一共4个方向，每个方向4帧动作）。

然而，使用 AI 绘图工具生成的角色图，通常是一张包含了 4 个静态设计变体的大图（通常以 `2x2` 的排版呈现，且带有白色或纯色背景）。如果直接导入游戏：
1. **坐标错乱：** 游戏按 `4x4` 切割，会把完整的变体一切为四，导致在游戏中隐形或只显示局部碎片。
2. **抽搐闪烁：** 游戏快速播放这 4 个截然不同的变体，会产生高频的“左右乱晃”和抽搐感。

## 标准化处理流程

当您生成了一张新的角色图片，并希望加入游戏时，请按照以下步骤处理：

### 第一步：AI 辅助去背景与平铺填充

项目根目录下提供了一个专门处理此类图片的 Python 脚本。
此脚本会自动执行以下两件事：
1. **无损去背景（Flood Fill）：** 针对带有纯色/白色背景的 AI 生成图，脚本通过从边缘灌水的算法（Flood Fill）完美去除背景，100% 保留所有像素，不会像部分 AI 抠图（如 rembg）那样误删掉角色的下半身。
2. **提取并转换格式：** 脚本会自动提取图表左上角的第一个变体角色，将其精准缩放至标准的单元格尺寸（例如缩小到整体尺寸的四分之一），然后在这个画板上进行 `4x4` 平铺填充。
   - *平铺的结果是：该变体将填满 `4x4` 的格子。虽然动画会变成相对静态的平移，但由于游戏底层有上下呼吸与浮动补偿（Bobbing），实际效果依然是非常流畅的移动。*

### 第二步：执行处理脚本

如果你想要加入一张新的种族图，例如 `demon_walk.png`，请参照游戏根目录中曾经运行过的 `make_transparent.py` 等相似处理脚本。

一个标准的处理脚本结构如下，你可以直接要求 AI 助手去执行：

```python
from PIL import Image, ImageDraw

def process_ai_sprite(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    
    # 1. 精准去白底 (Flood Fill)
    temp = img.convert("RGB")
    ImageDraw.floodfill(temp, (0, 0), (255, 0, 255), thresh=30)
    ImageDraw.floodfill(temp, (temp.width-1, 0), (255, 0, 255), thresh=30)
    ImageDraw.floodfill(temp, (0, temp.height-1), (255, 0, 255), thresh=30)
    ImageDraw.floodfill(temp, (temp.width-1, temp.height-1), (255, 0, 255), thresh=30)
    
    img_data = img.getdata()
    temp_data = temp.getdata()
    
    new_data = []
    for i in range(len(img_data)):
        if temp_data[i] == (255, 0, 255):
            new_data.append((0, 0, 0, 0)) # 变透明
        else:
            new_data.append(img_data[i])
    img.putdata(new_data)
    
    # 2. 提取 2x2 网格的左上角角色
    w, h = img.size
    quad_w, quad_h = w // 2, h // 2
    top_left = img.crop((0, 0, quad_w, quad_h))
    
    # 3. 缩放至四分之一以适应 4x4 网格
    frame_w, frame_h = w // 4, h // 4
    char_frame = top_left.resize((frame_w, frame_h), Image.Resampling.LANCZOS)
    
    # 4. 平铺成标准的 4x4 序列帧
    new_img = Image.new("RGBA", (w, h), (0,0,0,0))
    for row in range(4):
        for col in range(4):
            new_img.paste(char_frame, (col * frame_w, row * frame_h))
            
    new_img.save(output_path)
```

### 第三步：配置与加载

处理完成后，将生成的图片放入 `public/assets/sprites/races/` 文件夹中。
并在 `src/data/assetManifest.ts` 中的 `raceWalkSheets` 组别内进行登记，即可完美上线！

---

> 📝 **给 AI 的特别备注**： 以后每当 USER 抛来新的种族角色素材，无论它是一张 2x2 还是多角色的合集图，请严格参考上述脚本，将它统一转为标准 4x4 的带透明度网格图，再进入游戏进行渲染。
