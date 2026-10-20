import math
import random
from PIL import Image, ImageDraw, ImageFilter

W, H = 1280, 720
img = Image.new('RGB', (W, H), (20, 14, 18))
draw = ImageDraw.Draw(img)

# 1. Dramatic Sertão Sunset Sky (Gradients of ochre, deep crimson, burnt orange, twilight purple)
for y in range(H):
    t = y / H
    if t < 0.35:
        # High twilight
        r = int(35 + (120 - 35) * (t / 0.35))
        g = int(20 + (50 - 20) * (t / 0.35))
        b = int(45 + (35 - 45) * (t / 0.35))
    elif t < 0.65:
        # Fiery horizon
        sub_t = (t - 0.35) / 0.30
        r = int(120 + (220 - 120) * sub_t)
        g = int(50 + (130 - 50) * sub_t)
        b = int(35 + (40 - 35) * sub_t)
    else:
        # Dusty ground horizon
        sub_t = (t - 0.65) / 0.35
        r = int(220 + (70 - 220) * sub_t)
        g = int(130 + (45 - 130) * sub_t)
        b = int(40 + (25 - 40) * sub_t)
    draw.line([(0, y), (W, y)], fill=(r, g, b))

# 2. Glowing Golden Sun rising / setting over the Caatinga hills
sun_x, sun_y = int(W * 0.42), int(H * 0.46)
sun_radius = 85
for rad in range(sun_radius * 3, 0, -2):
    alpha = max(0, int(180 * (1.0 - rad / (sun_radius * 3))**1.8))
    # Radial glow
    sun_col = (min(255, 235 + alpha//4), min(255, 140 + alpha//2), min(255, 50 + alpha))
    draw.ellipse([sun_x - rad, sun_y - rad, sun_x + rad, sun_y + rad], outline=None, fill=sun_col)

# 3. Distant Serras & Morros (Serra do Cambaio, Monte Santo)
random.seed(42)
def draw_mountain_range(base_y, height_amp, col, step=8):
    points = [(0, H)]
    x = 0
    while x <= W + step:
        nx = x * 0.003
        y = base_y - math.sin(nx * 3.5) * height_amp * 0.6 - math.cos(nx * 7.2) * height_amp * 0.3 - math.sin(nx * 15.0) * height_amp * 0.1
        points.append((x, int(y)))
        x += step
    points.append((W, H))
    draw.polygon(points, fill=col)

draw_mountain_range(int(H * 0.48), 60, (75, 35, 40))
draw_mountain_range(int(H * 0.54), 45, (55, 28, 30))
draw_mountain_range(int(H * 0.60), 35, (40, 22, 24))

# 4. Plateau of Belo Monte (Arraial ground)
ground_points = [(0, H), (0, int(H * 0.62))]
for x in range(0, W + 10, 10):
    gy = int(H * 0.62 + math.sin(x * 0.005) * 12 + math.sin(x * 0.02) * 5)
    ground_points.append((x, gy))
ground_points.append((W, H))
draw.polygon(ground_points, fill=(28, 16, 18))

# 5. Iconic Church of Bom Jesus of Canudos in silhouette with illuminated warm arched windows
ch_x = int(W * 0.68)
ch_y = int(H * 0.38)
ch_w = 160
ch_h = 190

# Towers and central nave
# Left tower
draw.rectangle([ch_x, ch_y + 20, ch_x + 36, ch_y + ch_h], fill=(18, 10, 12))
draw.polygon([(ch_x, ch_y + 20), (ch_x + 18, ch_y - 15), (ch_x + 36, ch_y + 20)], fill=(18, 10, 12))
# Cross on left tower
draw.line([(ch_x + 18, ch_y - 25), (ch_x + 18, ch_y - 15)], fill=(220, 180, 100), width=2)
draw.line([(ch_x + 13, ch_y - 22), (ch_x + 23, ch_y - 22)], fill=(220, 180, 100), width=2)

# Right tower
draw.rectangle([ch_x + ch_w - 36, ch_y + 20, ch_x + ch_w, ch_y + ch_h], fill=(18, 10, 12))
draw.polygon([(ch_x + ch_w - 36, ch_y + 20), (ch_x + ch_w - 18, ch_y - 15), (ch_x + ch_w, ch_y + 20)], fill=(18, 10, 12))
# Cross on right tower
draw.line([(ch_x + ch_w - 18, ch_y - 25), (ch_x + ch_w - 18, ch_y - 15)], fill=(220, 180, 100), width=2)
draw.line([(ch_x + ch_w - 23, ch_y - 22), (ch_x + ch_w - 13, ch_y - 22)], fill=(220, 180, 100), width=2)

# Central pediment & facade
draw.rectangle([ch_x + 36, ch_y + 50, ch_x + ch_w - 36, ch_y + ch_h], fill=(22, 12, 14))
draw.polygon([(ch_x + 36, ch_y + 50), (ch_x + ch_w // 2, ch_y + 15), (ch_x + ch_w - 36, ch_y + 50)], fill=(22, 12, 14))

# Glowing Arched Windows & Portal (candlelight from the vigil)
window_glow = (255, 200, 80)
# Tower windows
draw.rectangle([ch_x + 11, ch_y + 50, ch_x + 25, ch_y + 75], fill=window_glow)
draw.arc([ch_x + 11, ch_y + 40, ch_x + 25, ch_y + 60], 180, 360, fill=window_glow, width=2)
draw.rectangle([ch_x + ch_w - 25, ch_y + 50, ch_x + ch_w - 11, ch_y + 75], fill=window_glow)
# Rose window / Oculo central
oc_x, oc_y = ch_x + ch_w // 2, ch_y + 60
draw.ellipse([oc_x - 14, oc_y - 14, oc_x + 14, oc_y + 14], fill=window_glow)
# Main portal
draw.rectangle([ch_x + ch_w // 2 - 16, ch_y + ch_h - 45, ch_x + ch_w // 2 + 16, ch_y + ch_h], fill=window_glow)
draw.chord([ch_x + ch_w // 2 - 16, ch_y + ch_h - 60, ch_x + ch_w // 2 + 16, ch_y + ch_h - 30], 180, 360, fill=window_glow)

# 6. Silhouette of Adobe / Taipa Huts of the Arraial surrounding the church
for i, hx in enumerate([ch_x - 140, ch_x - 70, ch_x + ch_w + 20, ch_x + ch_w + 90, ch_x + ch_w + 160]):
    hw = 45 + (i * 7) % 20
    hh = 32 + (i * 5) % 15
    hy = int(H * 0.62) - hh + 10
    draw.rectangle([hx, hy, hx + hw, hy + hh], fill=(16, 9, 11))
    draw.polygon([(hx - 4, hy), (hx + hw // 2, hy - 14), (hx + hw + 4, hy)], fill=(14, 8, 10))
    # Small candlelit window in hut
    draw.rectangle([hx + 10, hy + 10, hx + 18, hy + 20], fill=(230, 160, 60))

# 7. Heroic Silhouette of Antônio Conselheiro in the foreground (left third)
con_x = int(W * 0.22)
con_y = int(H * 0.42)
con_scale = 1.35

# Túnica / Manto azul-escuro esvoaçante
tunic_pts = [
    (con_x, con_y + 50),
    (con_x - int(24 * con_scale), con_y + int(170 * con_scale)),
    (con_x + int(36 * con_scale), con_y + int(170 * con_scale)),
    (con_x + int(20 * con_scale), con_y + int(60 * con_scale)),
]
draw.polygon(tunic_pts, fill=(10, 6, 9))

# Cabeça e barba longa profética
head_y = con_y + 20
draw.ellipse([con_x - 12, head_y - 12, con_x + 12, head_y + 12], fill=(12, 7, 10))
# Barba longa
beard_pts = [(con_x - 8, head_y + 4), (con_x, head_y + 36), (con_x + 8, head_y + 4)]
draw.polygon(beard_pts, fill=(180, 175, 170))

# Bordão de Peregrino (cajado de madeira de jurema)
staff_x = con_x + int(32 * con_scale)
draw.line([(staff_x, con_y), (staff_x, con_y + int(175 * con_scale))], fill=(45, 28, 18), width=4)

# Crucifixo de madeira no peito
cross_y = head_y + 30
draw.line([(con_x, cross_y - 10), (con_x, cross_y + 16)], fill=(210, 170, 90), width=3)
draw.line([(con_x - 8, cross_y - 3), (con_x + 8, cross_y - 3)], fill=(210, 170, 90), width=3)

# 8. Caatinga Flora Silhouettes (Mandacaru, Xique-Xique, Juazeiro retorcido)
def draw_mandacaru(cx, cy, scale=1.0):
    w = int(8 * scale)
    h = int(70 * scale)
    # Tronco central
    draw.rectangle([cx - w//2, cy - h, cx + w//2, cy], fill=(10, 6, 8))
    # Braço esquerdo
    draw.line([(cx, cy - int(h*0.55)), (cx - int(20*scale), cy - int(h*0.55))], fill=(10, 6, 8), width=w)
    draw.line([(cx - int(20*scale), cy - int(h*0.55)), (cx - int(20*scale), cy - int(h*0.85))], fill=(10, 6, 8), width=w)
    # Braço direito
    draw.line([(cx, cy - int(h*0.4)), (cx + int(18*scale), cy - int(h*0.4))], fill=(10, 6, 8), width=w)
    draw.line([(cx + int(18*scale), cy - int(h*0.4)), (cx + int(18*scale), cy - int(h*0.75))], fill=(10, 6, 8), width=w)

draw_mandacaru(int(W * 0.08), int(H * 0.74), 1.4)
draw_mandacaru(int(W * 0.14), int(H * 0.70), 1.0)
draw_mandacaru(int(W * 0.90), int(H * 0.72), 1.3)
draw_mandacaru(int(W * 0.95), int(H * 0.76), 1.6)

# 9. Atmospheric Woodcut & Grain Vignette
vignette = Image.new('L', (W, H), 0)
vdraw = ImageDraw.Draw(vignette)
for r in range(min(W, H)//2, max(W, H), 15):
    val = int(min(255, ((r - min(W, H)//2) / (max(W, H)*0.6)) * 255))
    vdraw.ellipse([W//2 - r, H//2 - r, W//2 + r, H//2 + r], outline=val, width=16)
vignette = vignette.filter(ImageFilter.GaussianBlur(30))

# Blend subtle grain
img = Image.blend(img, Image.new('RGB', (W, H), (10, 5, 8)), 0.08)

# Save high quality JPEG
out_path1 = "Miguel/Canudos/capa.jpg"
out_path2 = "Miguel/Canudos_PC/jogo/capa.jpg"
img.save(out_path1, quality=94)
img.save(out_path2, quality=94)
print(f"Generated cover artwork: {out_path1} and {out_path2} ({W}x{H})")
