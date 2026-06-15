from PIL import Image
import os

races = ["goblin", "elf", "orc", "spirit"]
base_dir = "/Users/hanrui/roguelike-game/public/assets/sprites/races"

for race in races:
    path = os.path.join(base_dir, f"{race}_walk.png")
    if not os.path.exists(path):
        continue
    img = Image.open(path)
    
    # Extract the top-left 627x627 quadrant (assuming 1254x1254 2x2 grid)
    w, h = img.size
    quad_w = w // 2
    quad_h = h // 2
    top_left = img.crop((0, 0, quad_w, quad_h))
    
    # Scale it down by half so we can tile it 4x4 into the original size
    # Wait, if we scale it by half, it becomes quad_w/2, which is w/4.
    frame_w = w // 4
    frame_h = h // 4
    char_frame = top_left.resize((frame_w, frame_h), Image.Resampling.LANCZOS)
    
    # Create a new image of the original size
    new_img = Image.new("RGBA", (w, h), (0,0,0,0))
    
    # Tile the character 4x4
    for row in range(4):
        for col in range(4):
            new_img.paste(char_frame, (col * frame_w, row * frame_h))
            
    # Save the new fixed image
    new_img.save(path)
    print(f"Fixed {race}_walk.png")

print("All done!")
