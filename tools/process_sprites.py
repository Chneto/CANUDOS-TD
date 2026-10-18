import os
import sys
import glob
import shutil
from PIL import Image

def process_and_crop(raw_image_path, output_path, target_size=(128, 128), remove_bg=True):
    from rembg import remove
    print(f"Processing {raw_image_path}...")
    img = Image.open(raw_image_path)
    
    if remove_bg:
        img = remove(img)
    
    # Trim transparent borders
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    # Fit into target_size keeping aspect ratio
    img.thumbnail(target_size, Image.Resampling.LANCZOS)
    
    # Create final transparent canvas
    final_canvas = Image.new("RGBA", target_size, (0, 0, 0, 0))
    offset = ((target_size[0] - img.size[0]) // 2, (target_size[1] - img.size[1]) // 2)
    final_canvas.paste(img, offset)
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    final_canvas.save(output_path, "PNG")
    print(f"Saved processed game asset: {output_path}")

if __name__ == "__main__":
    raw_images = glob.glob("assets/raw/*.png")
    for raw in raw_images:
        name = os.path.splitext(os.path.basename(raw))[0]
        out = os.path.join("assets", "sprites", f"{name}_sprite.png")
        process_and_crop(raw, out, target_size=(128, 128), remove_bg=True)
