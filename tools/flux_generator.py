import urllib.request
import json
import base64
import os
import sys

def generate_image(prompt, filename, width=896, height=1152, steps=5, cfg_scale=1.0):
    url = "http://127.0.0.1:7860/sdapi/v1/txt2img"
    
    payload = {
        "prompt": prompt,
        "negative_prompt": "blurry, low quality, deformed, fantasy armor, modern weapons, neon, plastic, cartoon anime, 3d render",
        "steps": steps,
        "cfg_scale": cfg_scale,
        "width": width,
        "height": height,
        "sampler_name": "Euler",
        "scheduler": "Simple",
        "override_settings": {
            "sd_model_checkpoint": "flux1-schnell-fp8.safetensors"
        }
    }
    
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    
    print(f"Sending prompt to FLUX for '{filename}'...")
    try:
        with urllib.request.urlopen(req, timeout=300) as response:
            result = json.loads(response.read().decode('utf-8'))
            image_base64 = result['images'][0]
            
            output_path = os.path.join("assets", "raw", f"{filename}.png")
            with open(output_path, "wb") as f:
                f.write(base64.b64decode(image_base64))
            print(f"Successfully generated and saved to {output_path}")
            return output_path
    except Exception as e:
        print(f"Error during generation: {e}")
        return None

if __name__ == "__main__":
    test_prompt = (
        "Full-body game concept art of a 19th-century Brazilian jagunço warrior from Canudos war, "
        "wearing a traditional curved leather hat, weathered leather gibão jacket, raw cotton trousers, "
        "holding an antique percussion rifle, standing on dry caatinga dirt, sharp outlines, "
        "historical illustration style, isolated on clean solid neutral gray background"
    )
    generate_image(test_prompt, "test_jagunco", width=896, height=1152, steps=4)
