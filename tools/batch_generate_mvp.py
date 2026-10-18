import urllib.request
import json
import base64
import os
import time
from PIL import Image

PROMPTS = [
    {
        "id": "tower_sniper_jagunco",
        "category": "towers",
        "prompt": (
            "Full-body game character concept art in 3/4 top-down perspective, 19th-century Brazilian sertanejo jagunço defender from the War of Canudos. "
            "Sun-hardened mestizo fighter wearing traditional artisanal tan leather half-moon hat (chapéu de couro de vaqueiro), weathered leather gibão jacket, "
            "raw cotton shirt, crossed ammunition bandoliers over chest, holding antique percussion Comblain rifle with wooden stock. "
            "Stylized gritty historical illustration, sharp outlines, rich arid earth tones, legible silhouette, isolated on solid plain neutral light gray background"
        ),
        "width": 768,
        "height": 1024,
        "steps": 5
    },
    {
        "id": "tower_barricade_taipa",
        "category": "towers",
        "prompt": (
            "2D tactical game structure asset in 3/4 top-down perspective, defensive fortification trench and barricade from the War of Canudos. "
            "Constructed from rough timber logs, sun-baked red mud-and-wattle (taipa de mão), stacked river stones, and dry sandbags. "
            "Antique gunpowder horn and rustic wooden crucifix resting against the trench wall. Gritty historical illustration style, "
            "sharp contour lines, isolated on clean solid plain neutral light gray background"
        ),
        "width": 896,
        "height": 896,
        "steps": 5
    },
    {
        "id": "enemy_soldier_republican",
        "category": "enemies",
        "prompt": (
            "Full-body game sprite concept art in 3/4 top-down perspective, 1897 Brazilian Republican army infantry soldier marching in formation. "
            "Weary recruit wearing navy blue and khaki wool uniform stained with red sertão dust, dark kepi cap with brass republic insignia, "
            "leather gaiters, holding bolt-action Mauser rifle with fixed bayonet forward. Dynamic march pose, sharp line art, clean game asset style, "
            "isolated on clean plain neutral light gray background"
        ),
        "width": 768,
        "height": 1024,
        "steps": 5
    },
    {
        "id": "tile_ground_caatinga",
        "category": "tilesets",
        "prompt": (
            "Top-down seamless 2D game tile texture, arid Bahia sertão ground from Canudos. "
            "Reddish-orange cracked dry earth, scattered tiny desert pebbles, sparse dry yellow straw grass patches, natural direct sunlight. "
            "Clean hand-drawn historical aesthetic, no shadows, seamless pattern, game texture"
        ),
        "width": 768,
        "height": 768,
        "steps": 4
    },
    {
        "id": "tile_road_dirt",
        "category": "tilesets",
        "prompt": (
            "Top-down seamless 2D game tile texture, arid dirt pathway road in the Brazilian caatinga desert. "
            "Packed dry earth, wagon wheel ruts, footprints in dust, pale ocre and reddish clay tones. "
            "Clean hand-drawn historical style, seamless texture"
        ),
        "width": 768,
        "height": 768,
        "steps": 4
    },
    {
        "id": "prop_cactus_mandacaru",
        "category": "props",
        "prompt": (
            "2D game asset prop in 3/4 top-down perspective, tall majestic Brazilian Mandacaru cactus with green ribbed columns and white thorns, "
            "flanked by spiky xique-xique scrub and dry desert rock on red soil. Historical stylized game illustration, sharp outlines, "
            "isolated on clean solid plain neutral light gray background"
        ),
        "width": 768,
        "height": 1024,
        "steps": 5
    },
    {
        "id": "objective_church_canudos",
        "category": "props",
        "prompt": (
            "2D tactical game structure asset in 3/4 top-down perspective, the unfinished Catholic church of Bom Jesus in Arraial de Canudos. "
            "Rustic adobe walls, exposed raw brick towers, wooden scaffolding, rustic wooden bells, arid caatinga setting. "
            "Stylized historical concept art, sharp silhouette, isolated on clean solid plain neutral light gray background"
        ),
        "width": 896,
        "height": 896,
        "steps": 5
    }
]

def generate_asset(item):
    url = "http://127.0.0.1:7860/sdapi/v1/txt2img"
    payload = {
        "prompt": item["prompt"],
        "negative_prompt": "blurry, low quality, deformed, fantasy armor, modern weapons, neon, plastic, cartoon anime, 3d render",
        "steps": item.get("steps", 5),
        "cfg_scale": 1.0,
        "width": item.get("width", 768),
        "height": item.get("height", 1024),
        "sampler_name": "Euler",
        "scheduler": "Simple"
    }
    
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    
    print(f"\n==========================================")
    print(f"Generating asset: {item['id']} ({item['category']})...")
    print(f"==========================================")
    
    try:
        with urllib.request.urlopen(req, timeout=600) as response:
            result = json.loads(response.read().decode('utf-8'))
            image_base64 = result['images'][0]
            
            raw_dir = os.path.join("assets", "raw")
            os.makedirs(raw_dir, exist_ok=True)
            output_path = os.path.join(raw_dir, f"{item['id']}.png")
            
            with open(output_path, "wb") as f:
                f.write(base64.b64decode(image_base64))
            print(f"-> Saved raw: {output_path}")
            return output_path
    except Exception as e:
        print(f"Error generating {item['id']}: {e}")
        return None

def process_to_sprite(raw_path, item):
    if not os.path.exists(raw_path):
        return
    try:
        from rembg import remove
        
        print(f"-> Processing transparency and grid alignment for {item['id']}...")
        img = Image.open(raw_path)
        
        # Don't remove background for terrain tiles
        if item["category"] != "tilesets":
            img = remove(img)
            bbox = img.getbbox()
            if bbox:
                img = img.crop(bbox)
        
        target_size = (128, 128) if item["category"] in ["towers", "enemies"] else (64, 64) if item["category"] == "tilesets" else (192, 192)
        img.thumbnail(target_size, Image.Resampling.LANCZOS)
        
        final_canvas = Image.new("RGBA", target_size, (0, 0, 0, 0) if item["category"] != "tilesets" else (0,0,0,255))
        offset = ((target_size[0] - img.size[0]) // 2, target_size[1] - img.size[1]) # anchor to bottom
        final_canvas.paste(img, offset)
        
        out_dir = os.path.join("assets", "sprites", item["category"])
        os.makedirs(out_dir, exist_ok=True)
        final_path = os.path.join(out_dir, f"{item['id']}.png")
        final_canvas.save(final_path, "PNG")
        print(f"-> Saved final game sprite: {final_path}")
    except Exception as e:
        print(f"Error processing sprite for {item['id']}: {e}")

if __name__ == "__main__":
    print(f"Starting continuous batch generation of {len(PROMPTS)} game assets...")
    for item in PROMPTS:
        raw = generate_asset(item)
        if raw:
            process_to_sprite(raw, item)
        time.sleep(2)
    print("\nBatch generation complete!")
