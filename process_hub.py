import os
from PIL import Image, ImageDraw

base_in = "/Users/hanrui/Documents/短剧/MISSROLA/营地文件夹"
base_out = "/Users/hanrui/roguelike-game/public/assets/sprites/hub"

if not os.path.exists(base_out):
    os.makedirs(base_out)

mapping = {
    "1": ["campGround"],
    "2": ["expedition"],
    "3": ["talents"],
    "4": ["economyStorage", "materialStorage"],
    "5": ["workshop"],
    "6": ["apothecary"],
    "7": ["quests", "loot"],
    "8": ["crafting"],
    "9": ["regionMap", "archive"],
}

def remove_bg(img):
    img = img.convert("RGBA")
    temp = img.convert("RGB")
    # Floodfill from corners
    ImageDraw.floodfill(temp, (0, 0), (255, 0, 255), thresh=30)
    ImageDraw.floodfill(temp, (temp.width-1, 0), (255, 0, 255), thresh=30)
    ImageDraw.floodfill(temp, (0, temp.height-1), (255, 0, 255), thresh=30)
    ImageDraw.floodfill(temp, (temp.width-1, temp.height-1), (255, 0, 255), thresh=30)
    
    # Also floodfill from top-center and bottom-center just in case it's split
    ImageDraw.floodfill(temp, (temp.width//2, 0), (255, 0, 255), thresh=30)
    ImageDraw.floodfill(temp, (temp.width//2, temp.height-1), (255, 0, 255), thresh=30)

    img_data = img.getdata()
    temp_data = temp.getdata()
    
    new_data = []
    for i in range(len(img_data)):
        if temp_data[i] == (255, 0, 255):
            new_data.append((0, 0, 0, 0))
        else:
            new_data.append(img_data[i])
            
    img.putdata(new_data)
    return img

for num_str, names in mapping.items():
    filename = f"ChatGPT Image 2026年6月15日 21_01_3{num_str if int(num_str) < 8 else int(num_str)} ({num_str}).png"
    if num_str == "8": filename = "ChatGPT Image 2026年6月15日 21_01_37 (8).png"
    if num_str == "9": filename = "ChatGPT Image 2026年6月15日 21_01_37 (9).png"
    if num_str == "10": filename = "ChatGPT Image 2026年6月15日 21_01_38 (10).png"
    # Actually just listdir and match (X).png
    
for filename in os.listdir(base_in):
    if not filename.endswith(".png"): continue
    
    # parse out the (X)
    import re
    m = re.search(r'\((\d+)\)\.png$', filename)
    if not m: continue
    
    num = m.group(1)
    if num not in mapping: continue
    
    img_path = os.path.join(base_in, filename)
    print(f"Processing {filename} ...")
    
    if num == "1":
        # Just copy campGround
        img = Image.open(img_path).convert("RGBA")
        img.save(os.path.join(base_out, "camp-ground.png"))
        continue
        
    # Other images: remove bg, split left and right
    img = Image.open(img_path)
    img_transparent = remove_bg(img)
    
    w, h = img_transparent.size
    mid = w // 2
    
    back_img = img_transparent.crop((0, 0, mid, h))
    front_img = img_transparent.crop((mid, 0, w, h))
    
    # Save them for all mapped names
    names = mapping[num]
    for name in names:
        # e.g. expedition_back.png, expedition_front.png
        # BUT camelCase to snake_case?
        # Our HUB_ART_PATHS expects specific files!
        # wait, HUB_ART_PATHS: expeditionBack: "/assets/sprites/hub/expedition_back.png"
        
        # let's write a simple snake_case converter
        snake_name = re.sub(r'(?<!^)(?=[A-Z])', '_', name).lower()
        
        back_img.save(os.path.join(base_out, f"{snake_name}_back.png"))
        front_img.save(os.path.join(base_out, f"{snake_name}_front.png"))

print("All done!")
