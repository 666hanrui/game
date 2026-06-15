from PIL import Image, ImageDraw
import os
import sys

def remove_white_bg(img_path, out_path):
    img = Image.open(img_path).convert("RGBA")
    
    # We want to make the background transparent.
    # The background is mostly near (254, 254, 254).
    # We can flood fill the background with a specific key color (e.g., magenta),
    # then make all magenta pixels transparent.
    
    # Create a mask image to perform flood fill
    # Flood fill requires RGB image
    temp = img.convert("RGB")
    ImageDraw.floodfill(temp, (0, 0), (255, 0, 255), thresh=30)
    ImageDraw.floodfill(temp, (temp.width-1, 0), (255, 0, 255), thresh=30)
    ImageDraw.floodfill(temp, (0, temp.height-1), (255, 0, 255), thresh=30)
    ImageDraw.floodfill(temp, (temp.width-1, temp.height-1), (255, 0, 255), thresh=30)
    
    # Now wherever temp is magenta, make img transparent
    img_data = img.getdata()
    temp_data = temp.getdata()
    
    new_data = []
    for i in range(len(img_data)):
        if temp_data[i] == (255, 0, 255):
            new_data.append((0, 0, 0, 0))
        else:
            new_data.append(img_data[i])
            
    img.putdata(new_data)
    img.save(out_path)
    print("Saved", out_path)

base_in = "/Users/hanrui/Documents/短剧/MISSROLA/未命名文件夹"
base_out = "/Users/hanrui/roguelike-game/public/assets/sprites/races"

mapping = {
    "ChatGPT Image 2026年6月14日 19_53_25 (1).png": "goblin_walk.png",
    "ChatGPT Image 2026年6月14日 19_53_25 (2).png": "elf_walk.png",
    "ChatGPT Image 2026年6月14日 19_53_26 (3).png": "orc_walk.png",
    "ChatGPT Image 2026年6月14日 19_53_26 (4).png": "spirit_walk.png"
}

for in_name, out_name in mapping.items():
    in_path = os.path.join(base_in, in_name)
    out_path = os.path.join(base_out, out_name)
    if os.path.exists(in_path):
        remove_white_bg(in_path, out_path)
        
print("All done!")
