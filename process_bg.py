from rembg import remove
from PIL import Image
import os

images = {
    "human_walk.png": "ChatGPT Image 2026年6月14日 19_31_26.png",
    "goblin_walk.png": "ChatGPT Image 2026年6月14日 19_53_25 (1).png",
    "elf_walk.png": "ChatGPT Image 2026年6月14日 19_53_25 (2).png",
    "orc_walk.png": "ChatGPT Image 2026年6月14日 19_53_26 (3).png",
    "spirit_walk.png": "ChatGPT Image 2026年6月14日 19_53_26 (4).png"
}

input_dir = "/Users/hanrui/Documents/短剧/MISSROLA/1"
output_dir = "/Users/hanrui/roguelike-game/public/assets/sprites/races"

os.makedirs(output_dir, exist_ok=True)

for out_name, in_name in images.items():
    in_path = os.path.join(input_dir, in_name)
    out_path = os.path.join(output_dir, out_name)
    
    if os.path.exists(in_path):
        print(f"Processing {in_name} -> {out_name}...")
        try:
            inp = Image.open(in_path)
            out = remove(inp)
            out.save(out_path)
            print(f"Saved {out_name}.")
        except Exception as e:
            print(f"Error processing {in_name}: {e}")
    else:
        print(f"File not found: {in_path}")

print("Done.")
