#!/usr/bin/env python3
"""
Generate placeholder assets for the KCM AR Museum demo.

Creates:
  - Overlay textures (semi-transparent PNGs) for schoolhouse, barn, derrick
  - Historical photo placeholders (sepia-toned JPGs)
  - AR tracking test target (high-contrast geometric pattern)

Requires: Pillow (pip install Pillow)
"""

import math
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
TEXTURES_DIR = os.path.join(SCRIPT_DIR, "textures")
IMAGES_DIR = os.path.join(SCRIPT_DIR, "images")
TARGETS_DIR = os.path.join(SCRIPT_DIR, "targets")


def _ensure_dirs():
    for d in (TEXTURES_DIR, IMAGES_DIR, TARGETS_DIR):
        os.makedirs(d, exist_ok=True)


def _get_font(size: int):
    """Return a TrueType font at the requested size, falling back to default."""
    candidates = [
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/SFNSMono.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


def _draw_centered_text(draw, text, y, width, font, fill):
    """Draw horizontally-centred text at vertical position *y*."""
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    x = (width - tw) // 2
    draw.text((x, y), text, font=font, fill=fill)


# ---------------------------------------------------------------------------
# Overlay generators (RGBA PNGs with transparent backgrounds)
# ---------------------------------------------------------------------------

def generate_schoolhouse_overlay():
    """800x600 semi-transparent overlay — schoolhouse scene."""
    W, H = 800, 600
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # --- Title ---
    font_title = _get_font(36)
    _draw_centered_text(draw, "Schoolhouse Scene", 20, W, font_title, (60, 40, 20, 220))

    # --- Schoolhouse building ---
    # Main body
    draw.rectangle([100, 180, 350, 380], fill=(139, 90, 43, 140), outline=(80, 50, 20, 200), width=3)
    # Roof (triangle)
    draw.polygon([(80, 180), (225, 100), (370, 180)], fill=(160, 60, 40, 160), outline=(80, 30, 20, 200))
    # Door
    draw.rectangle([195, 290, 255, 380], fill=(80, 50, 30, 180), outline=(50, 30, 10, 220), width=2)
    # Windows
    for wx in [130, 290]:
        draw.rectangle([wx, 220, wx + 40, 270], fill=(180, 210, 240, 140), outline=(60, 40, 20, 200), width=2)
        draw.line([(wx + 20, 220), (wx + 20, 270)], fill=(60, 40, 20, 180), width=1)
        draw.line([(wx, 245), (wx + 40, 245)], fill=(60, 40, 20, 180), width=1)
    # Bell tower
    draw.rectangle([200, 70, 250, 100], fill=(139, 90, 43, 160), outline=(80, 50, 20, 200), width=2)
    draw.polygon([(195, 70), (225, 45), (255, 70)], fill=(160, 60, 40, 180))
    # Bell
    draw.ellipse([215, 75, 235, 95], fill=(200, 180, 50, 180))

    # --- Children silhouettes (simple stick figures at desks) ---
    desk_y = 430
    for cx in [450, 550, 650]:
        # Desk
        draw.rectangle([cx - 30, desk_y, cx + 30, desk_y + 10], fill=(120, 80, 40, 160))
        draw.line([(cx - 25, desk_y + 10), (cx - 25, desk_y + 50)], fill=(120, 80, 40, 160), width=2)
        draw.line([(cx + 25, desk_y + 10), (cx + 25, desk_y + 50)], fill=(120, 80, 40, 160), width=2)
        # Child (head + body)
        head_y = desk_y - 35
        draw.ellipse([cx - 10, head_y, cx + 10, head_y + 20], fill=(70, 50, 30, 180))
        draw.line([(cx, head_y + 20), (cx, desk_y)], fill=(70, 50, 30, 180), width=3)
        # Arms reaching to desk
        draw.line([(cx, head_y + 28), (cx - 15, desk_y - 2)], fill=(70, 50, 30, 160), width=2)
        draw.line([(cx, head_y + 28), (cx + 15, desk_y - 2)], fill=(70, 50, 30, 160), width=2)

    # --- Chalkboard ---
    draw.rectangle([430, 180, 720, 330], fill=(40, 60, 40, 160), outline=(120, 90, 50, 200), width=4)
    font_chalk = _get_font(22)
    draw.text((470, 210), "ABC  123", font=font_chalk, fill=(220, 220, 200, 180))
    draw.text((470, 260), "Kern County", font=font_chalk, fill=(220, 220, 200, 180))

    # --- Ground line ---
    draw.line([(0, 500), (W, 500)], fill=(100, 80, 50, 100), width=2)

    # --- Subtitle ---
    font_sub = _get_font(18)
    _draw_centered_text(draw, "KCM Interactive Demo — Placeholder", H - 40, W, font_sub, (80, 60, 40, 150))

    path = os.path.join(TEXTURES_DIR, "schoolhouse-overlay.png")
    img.save(path, "PNG")
    print(f"  Created: {path}")


def generate_barn_overlay():
    """1000x720 semi-transparent overlay — pioneer barn scene."""
    W, H = 1000, 720
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # --- Title ---
    font_title = _get_font(40)
    _draw_centered_text(draw, "Pioneer Barn Scene", 20, W, font_title, (80, 40, 20, 220))

    # --- Barn ---
    # Main body
    draw.rectangle([120, 250, 450, 520], fill=(180, 60, 40, 150), outline=(100, 30, 20, 200), width=4)
    # Roof
    draw.polygon([(100, 250), (285, 130), (470, 250)], fill=(120, 50, 30, 170), outline=(80, 30, 15, 200))
    # Barn doors (double)
    draw.rectangle([220, 370, 280, 520], fill=(140, 45, 30, 180), outline=(80, 25, 15, 220), width=2)
    draw.rectangle([290, 370, 350, 520], fill=(140, 45, 30, 180), outline=(80, 25, 15, 220), width=2)
    # Hay loft window
    draw.polygon([(250, 190), (285, 165), (320, 190)], fill=(60, 40, 20, 160))
    draw.rectangle([260, 190, 310, 230], fill=(60, 40, 20, 160), outline=(80, 30, 15, 200), width=2)
    # Cross beams on doors
    draw.line([(220, 370), (280, 520)], fill=(100, 35, 20, 140), width=2)
    draw.line([(280, 370), (220, 520)], fill=(100, 35, 20, 140), width=2)
    draw.line([(290, 370), (350, 520)], fill=(100, 35, 20, 140), width=2)
    draw.line([(350, 370), (290, 520)], fill=(100, 35, 20, 140), width=2)

    # --- Fence ---
    for fx in range(480, 900, 60):
        draw.rectangle([fx, 420, fx + 8, 520], fill=(160, 130, 80, 140))
    for fy in [440, 490]:
        draw.line([(480, fy), (900, fy)], fill=(160, 130, 80, 140), width=4)

    # --- Cow silhouette ---
    cx, cy = 620, 380
    # Body
    draw.ellipse([cx - 50, cy - 25, cx + 50, cy + 25], fill=(70, 50, 30, 160))
    # Head
    draw.ellipse([cx + 40, cy - 35, cx + 80, cy - 5], fill=(70, 50, 30, 160))
    # Legs
    for lx in [cx - 35, cx - 15, cx + 15, cx + 35]:
        draw.rectangle([lx - 4, cy + 20, lx + 4, cy + 55], fill=(70, 50, 30, 160))
    # Horns
    draw.line([(cx + 52, cy - 35), (cx + 45, cy - 50)], fill=(70, 50, 30, 140), width=2)
    draw.line([(cx + 68, cy - 35), (cx + 75, cy - 50)], fill=(70, 50, 30, 140), width=2)

    # --- Chicken silhouettes ---
    for chx in [780, 830]:
        # Body
        draw.ellipse([chx - 12, 480, chx + 12, 510], fill=(70, 50, 30, 150))
        # Head
        draw.ellipse([chx + 8, 470, chx + 22, 488], fill=(70, 50, 30, 150))
        # Beak
        draw.polygon([(chx + 22, 478), (chx + 30, 480), (chx + 22, 482)], fill=(200, 150, 50, 160))
        # Legs
        draw.line([(chx - 4, 510), (chx - 8, 525)], fill=(200, 150, 50, 140), width=2)
        draw.line([(chx + 4, 510), (chx + 8, 525)], fill=(200, 150, 50, 140), width=2)

    # --- Hay bales ---
    for bx in [500, 560]:
        draw.rectangle([bx, 490, bx + 50, 520], fill=(200, 180, 80, 140), outline=(160, 140, 50, 180), width=2)
        # Straw lines
        for sy in range(495, 518, 6):
            draw.line([(bx + 5, sy), (bx + 45, sy)], fill=(180, 160, 60, 100), width=1)

    # --- Ground ---
    draw.line([(0, 540), (W, 540)], fill=(100, 80, 50, 100), width=2)

    # --- Windmill (far background) ---
    wmx, wmy = 880, 200
    draw.rectangle([wmx - 6, wmy, wmx + 6, wmy + 160], fill=(100, 80, 60, 100), outline=(70, 50, 30, 140), width=2)
    # Blades
    for angle in [0, 90, 180, 270]:
        rad = math.radians(angle + 20)
        ex = wmx + int(60 * math.cos(rad))
        ey = wmy + int(60 * math.sin(rad))
        draw.line([(wmx, wmy), (ex, ey)], fill=(100, 80, 60, 120), width=3)

    # --- Subtitle ---
    font_sub = _get_font(18)
    _draw_centered_text(draw, "KCM Interactive Demo — Placeholder", H - 40, W, font_sub, (80, 60, 40, 150))

    path = os.path.join(TEXTURES_DIR, "barn-overlay.png")
    img.save(path, "PNG")
    print(f"  Created: {path}")


def generate_derrick_overlay():
    """600x1000 semi-transparent overlay — oil derrick scene."""
    W, H = 600, 1000
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # --- Title ---
    font_title = _get_font(32)
    _draw_centered_text(draw, "Oil Derrick Scene", 20, W, font_title, (60, 40, 20, 220))

    # --- Oil derrick tower (lattice structure) ---
    # Main legs (tapered)
    top_x = W // 2
    top_y = 100
    base_left = top_x - 120
    base_right = top_x + 120
    base_y = 750

    leg_color = (60, 60, 60, 180)
    cross_color = (80, 80, 80, 140)

    # Left leg
    draw.line([(top_x - 8, top_y), (base_left, base_y)], fill=leg_color, width=5)
    # Right leg
    draw.line([(top_x + 8, top_y), (base_right, base_y)], fill=leg_color, width=5)

    # Crown block at top
    draw.rectangle([top_x - 20, top_y - 15, top_x + 20, top_y + 10], fill=(50, 50, 50, 200))

    # Cross braces
    num_braces = 12
    for i in range(num_braces):
        t1 = i / num_braces
        t2 = (i + 1) / num_braces
        lx1 = top_x - 8 + (base_left - (top_x - 8)) * t1
        lx2 = top_x - 8 + (base_left - (top_x - 8)) * t2
        rx1 = top_x + 8 + (base_right - (top_x + 8)) * t1
        rx2 = top_x + 8 + (base_right - (top_x + 8)) * t2
        y1 = top_y + (base_y - top_y) * t1
        y2 = top_y + (base_y - top_y) * t2
        # Horizontal
        draw.line([(lx1, y1), (rx1, y1)], fill=cross_color, width=2)
        # X braces
        if i % 2 == 0:
            draw.line([(lx1, y1), (rx2, y2)], fill=cross_color, width=2)
        else:
            draw.line([(rx1, y1), (lx2, y2)], fill=cross_color, width=2)
    # Bottom horizontal
    draw.line([(base_left, base_y), (base_right, base_y)], fill=cross_color, width=3)

    # --- Walking beam (pump) ---
    beam_pivot_x = top_x + 140
    beam_pivot_y = 680
    # Support post
    draw.rectangle([beam_pivot_x - 8, beam_pivot_y, beam_pivot_x + 8, base_y], fill=(70, 60, 50, 170), width=2)
    # Beam
    draw.line([(beam_pivot_x - 80, beam_pivot_y - 20), (beam_pivot_x + 80, beam_pivot_y + 10)],
              fill=(80, 70, 60, 190), width=6)
    # Horse head
    draw.arc([beam_pivot_x - 100, beam_pivot_y - 45, beam_pivot_x - 60, beam_pivot_y - 5],
             start=180, end=360, fill=(80, 70, 60, 180), width=4)

    # --- Oil puddle ---
    draw.ellipse([base_left - 30, base_y + 10, base_right + 30, base_y + 50],
                 fill=(20, 20, 20, 100))

    # --- Ground ---
    draw.line([(0, base_y + 30), (W, base_y + 30)], fill=(120, 100, 60, 120), width=2)

    # --- Small derricks in background ---
    for sx, scale in [(80, 0.3), (500, 0.25)]:
        sh = int(400 * scale)
        sy_top = base_y - sh
        sl = sx - int(40 * scale)
        sr = sx + int(40 * scale)
        draw.line([(sx, sy_top), (sl, base_y)], fill=(60, 60, 60, 80), width=2)
        draw.line([(sx, sy_top), (sr, base_y)], fill=(60, 60, 60, 80), width=2)
        for j in range(4):
            t = j / 4
            ly = sy_top + (base_y - sy_top) * t
            llx = sx + (sl - sx) * t
            lrx = sx + (sr - sx) * t
            draw.line([(llx, ly), (lrx, ly)], fill=(60, 60, 60, 60), width=1)

    # --- Subtitle ---
    font_sub = _get_font(16)
    _draw_centered_text(draw, "KCM Interactive Demo — Placeholder", H - 35, W, font_sub, (80, 60, 40, 150))

    path = os.path.join(TEXTURES_DIR, "derrick-overlay.png")
    img.save(path, "PNG")
    print(f"  Created: {path}")


# ---------------------------------------------------------------------------
# Historical photo generators (sepia-toned JPGs)
# ---------------------------------------------------------------------------

def _make_sepia_base(width, height):
    """Create a sepia-toned base image."""
    # Warm brownish background with slight noise-like variation
    img = Image.new("RGB", (width, height), (210, 185, 155))
    draw = ImageDraw.Draw(img)

    # Add a subtle vignette / aged look
    for i in range(0, width, 4):
        for j in range(0, height, 4):
            # Distance from centre, normalised
            dx = (i - width / 2) / (width / 2)
            dy = (j - height / 2) / (height / 2)
            dist = min(1.0, math.sqrt(dx * dx + dy * dy))
            darken = int(40 * dist * dist)
            r = max(0, 210 - darken + (((i * 7 + j * 13) % 11) - 5))
            g = max(0, 185 - darken + (((i * 11 + j * 7) % 9) - 4))
            b = max(0, 155 - darken + (((i * 13 + j * 11) % 7) - 3))
            draw.rectangle([i, j, i + 3, j + 3], fill=(r, g, b))

    return img, draw


def _add_sepia_frame(draw, width, height):
    """Add a decorative border that looks like an old photograph."""
    border = 15
    # Outer dark border
    draw.rectangle([0, 0, width - 1, height - 1], outline=(120, 100, 70), width=3)
    # Inner lighter border
    draw.rectangle([border, border, width - border - 1, height - border - 1],
                   outline=(170, 150, 120), width=2)
    # Corner decorations (small squares)
    cs = 8
    for x, y in [(border, border), (width - border - cs, border),
                 (border, height - border - cs), (width - border - cs, height - border - cs)]:
        draw.rectangle([x, y, x + cs, y + cs], fill=(140, 120, 90))


def generate_historical_norris():
    """640x400 sepia placeholder — Norris School."""
    W, H = 640, 400
    img, draw = _make_sepia_base(W, H)

    # Simple schoolhouse silhouette
    sc = (100, 80, 55)  # dark sepia
    # Building
    draw.rectangle([180, 160, 380, 300], fill=(170, 145, 115), outline=sc, width=3)
    # Roof
    draw.polygon([(165, 160), (280, 90), (395, 160)], fill=(155, 130, 100), outline=sc)
    # Door
    draw.rectangle([260, 230, 300, 300], fill=sc)
    # Windows
    for wx in [200, 340]:
        draw.rectangle([wx, 190, wx + 30, 230], fill=(190, 170, 140), outline=sc, width=2)
    # Bell tower
    draw.rectangle([265, 65, 295, 90], fill=(165, 140, 110), outline=sc, width=2)
    draw.polygon([(260, 65), (280, 45), (300, 65)], fill=(155, 130, 100), outline=sc)

    # Ground
    draw.line([(40, 300), (600, 300)], fill=sc, width=2)

    # Title text
    font_title = _get_font(26)
    _draw_centered_text(draw, "Norris School \u2014 Historical Photo", 330, W, font_title, (90, 70, 45))

    font_sm = _get_font(14)
    _draw_centered_text(draw, "Placeholder \u2014 KCM Interactive Demo", 365, W, font_sm, (130, 110, 80))

    _add_sepia_frame(draw, W, H)

    path = os.path.join(IMAGES_DIR, "norris-historical.jpg")
    img.save(path, "JPEG", quality=90)
    print(f"  Created: {path}")


def generate_historical_barn():
    """640x400 sepia placeholder — Pioneer Barn."""
    W, H = 640, 400
    img, draw = _make_sepia_base(W, H)

    sc = (100, 80, 55)
    # Barn body
    draw.rectangle([150, 170, 420, 310], fill=(175, 150, 120), outline=sc, width=3)
    # Roof
    draw.polygon([(135, 170), (285, 100), (435, 170)], fill=(160, 135, 105), outline=sc)
    # Barn doors
    draw.rectangle([250, 230, 320, 310], fill=(140, 115, 85), outline=sc, width=2)
    draw.line([(285, 230), (285, 310)], fill=sc, width=2)
    # Hay loft
    draw.ellipse([265, 130, 305, 165], fill=(140, 115, 85), outline=sc, width=2)

    # Fence
    for fx in range(440, 590, 35):
        draw.rectangle([fx, 260, fx + 5, 310], fill=sc)
    draw.line([(440, 275), (590, 275)], fill=sc, width=3)
    draw.line([(440, 295), (590, 295)], fill=sc, width=3)

    # Ground
    draw.line([(40, 310), (600, 310)], fill=sc, width=2)

    font_title = _get_font(26)
    _draw_centered_text(draw, "Pioneer Barn \u2014 Historical Photo", 330, W, font_title, (90, 70, 45))

    font_sm = _get_font(14)
    _draw_centered_text(draw, "Placeholder \u2014 KCM Interactive Demo", 365, W, font_sm, (130, 110, 80))

    _add_sepia_frame(draw, W, H)

    path = os.path.join(IMAGES_DIR, "barn-historical.jpg")
    img.save(path, "JPEG", quality=90)
    print(f"  Created: {path}")


def generate_historical_derrick():
    """640x400 sepia placeholder — Oil Derrick."""
    W, H = 640, 400
    img, draw = _make_sepia_base(W, H)

    sc = (100, 80, 55)
    # Derrick tower
    tx = 320
    ty_top = 60
    ty_base = 290
    bl = tx - 70
    br = tx + 70
    draw.line([(tx, ty_top), (bl, ty_base)], fill=sc, width=4)
    draw.line([(tx, ty_top), (br, ty_base)], fill=sc, width=4)
    # Crown
    draw.rectangle([tx - 12, ty_top - 8, tx + 12, ty_top + 5], fill=sc)
    # Cross bracing
    for i in range(8):
        t1 = i / 8
        t2 = (i + 1) / 8
        y1 = ty_top + (ty_base - ty_top) * t1
        y2 = ty_top + (ty_base - ty_top) * t2
        lx1 = tx + (bl - tx) * t1
        rx1 = tx + (br - tx) * t1
        lx2 = tx + (bl - tx) * t2
        rx2 = tx + (br - tx) * t2
        draw.line([(lx1, y1), (rx1, y1)], fill=sc, width=1)
        if i % 2 == 0:
            draw.line([(lx1, y1), (rx2, y2)], fill=sc, width=1)
        else:
            draw.line([(rx1, y1), (lx2, y2)], fill=sc, width=1)

    # Base platform
    draw.rectangle([bl - 20, ty_base, br + 20, ty_base + 15], fill=(160, 135, 105), outline=sc, width=2)

    # Small pump jack to the right
    pjx = 480
    draw.rectangle([pjx - 4, 250, pjx + 4, ty_base], fill=sc)
    draw.line([(pjx - 40, 245), (pjx + 40, 255)], fill=sc, width=4)
    draw.arc([pjx - 55, 225, pjx - 25, 260], start=180, end=360, fill=sc, width=3)

    # Ground
    draw.line([(40, ty_base + 15), (600, ty_base + 15)], fill=sc, width=2)

    font_title = _get_font(26)
    _draw_centered_text(draw, "Oil Derrick \u2014 Historical Photo", 330, W, font_title, (90, 70, 45))

    font_sm = _get_font(14)
    _draw_centered_text(draw, "Placeholder \u2014 KCM Interactive Demo", 365, W, font_sm, (130, 110, 80))

    _add_sepia_frame(draw, W, H)

    path = os.path.join(IMAGES_DIR, "derrick-historical.jpg")
    img.save(path, "JPEG", quality=90)
    print(f"  Created: {path}")


# ---------------------------------------------------------------------------
# AR tracking test target
# ---------------------------------------------------------------------------

def generate_test_target():
    """800x800 high-contrast AR tracking target with 'KCM' in the centre."""
    W, H = 800, 800
    img = Image.new("RGB", (W, H), (255, 255, 255))
    draw = ImageDraw.Draw(img)

    cx, cy = W // 2, H // 2

    # --- Outer frame ---
    draw.rectangle([0, 0, W - 1, H - 1], outline=(0, 0, 0), width=8)
    draw.rectangle([20, 20, W - 21, H - 21], outline=(0, 0, 0), width=4)

    # --- Corner markers (nested squares — good for feature detection) ---
    marker_size = 80
    marker_inner = 40
    corners = [(40, 40), (W - 40 - marker_size, 40),
               (40, H - 40 - marker_size), (W - 40 - marker_size, H - 40 - marker_size)]
    for (mx, my) in corners:
        draw.rectangle([mx, my, mx + marker_size, my + marker_size], fill=(0, 0, 0))
        offset = (marker_size - marker_inner) // 2
        draw.rectangle([mx + offset, my + offset,
                        mx + offset + marker_inner, my + offset + marker_inner], fill=(255, 255, 255))
        inner2 = 16
        offset2 = (marker_size - inner2) // 2
        draw.rectangle([mx + offset2, my + offset2,
                        mx + offset2 + inner2, my + offset2 + inner2], fill=(0, 0, 0))

    # --- Concentric circles (great for tracking) ---
    radii = [180, 150, 120, 90, 60]
    for i, r in enumerate(radii):
        color = (0, 0, 0) if i % 2 == 0 else (255, 255, 255)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color)

    # --- Radial lines (provide orientation cues) ---
    num_lines = 24
    for i in range(num_lines):
        angle = (2 * math.pi * i) / num_lines
        inner_r = 195
        outer_r = 280
        x1 = cx + int(inner_r * math.cos(angle))
        y1 = cy + int(inner_r * math.sin(angle))
        x2 = cx + int(outer_r * math.cos(angle))
        y2 = cy + int(outer_r * math.sin(angle))
        lw = 4 if i % 3 == 0 else 2
        draw.line([(x1, y1), (x2, y2)], fill=(0, 0, 0), width=lw)

    # --- Asymmetric notch (prevents rotational ambiguity) ---
    draw.polygon([(cx + 285, cy - 15), (cx + 320, cy), (cx + 285, cy + 15)],
                 fill=(0, 0, 0))

    # --- Checkerboard ring ---
    ring_r = 300
    ring_w = 30
    num_checks = 32
    for i in range(num_checks):
        a1 = (2 * math.pi * i) / num_checks
        a2 = (2 * math.pi * (i + 1)) / num_checks
        if i % 2 == 0:
            # Draw filled arc segment
            points = []
            steps = 8
            for s in range(steps + 1):
                a = a1 + (a2 - a1) * s / steps
                points.append((cx + int((ring_r) * math.cos(a)),
                                cy + int((ring_r) * math.sin(a))))
            for s in range(steps, -1, -1):
                a = a1 + (a2 - a1) * s / steps
                points.append((cx + int((ring_r + ring_w) * math.cos(a)),
                                cy + int((ring_r + ring_w) * math.sin(a))))
            if len(points) >= 3:
                draw.polygon(points, fill=(0, 0, 0))

    # --- Outer decorative triangles (unique features) ---
    tri_positions = [
        (cx, 42, 0),          # top
        (cx, H - 42, 180),    # bottom
        (42, cy, 270),        # left
        (W - 42, cy, 90),     # right
    ]
    for tx, ty, rot in tri_positions:
        sz = 25
        rad = math.radians(rot)
        pts = []
        for a in [0, 120, 240]:
            ar = math.radians(a) + rad
            pts.append((tx + int(sz * math.cos(ar)), ty + int(sz * math.sin(ar))))
        draw.polygon(pts, fill=(0, 0, 0))

    # --- "KCM" text in the center ---
    # White circle background for text
    draw.ellipse([cx - 48, cy - 28, cx + 48, cy + 28], fill=(255, 255, 255))
    draw.ellipse([cx - 48, cy - 28, cx + 48, cy + 28], outline=(0, 0, 0), width=3)

    font_kcm = _get_font(38)
    _draw_centered_text(draw, "KCM", cy - 20, W, font_kcm, (0, 0, 0))

    # --- Small unique asymmetric shapes in each quadrant ---
    # Top-left: small cross
    draw.rectangle([160, 160, 190, 170], fill=(0, 0, 0))
    draw.rectangle([170, 150, 180, 180], fill=(0, 0, 0))
    # Top-right: small diamond
    draw.polygon([(620, 150), (635, 165), (620, 180), (605, 165)], fill=(0, 0, 0))
    # Bottom-left: small circle
    draw.ellipse([155, 610, 185, 640], fill=(0, 0, 0))
    # Bottom-right: small triangle
    draw.polygon([(620, 615), (640, 645), (600, 645)], fill=(0, 0, 0))

    # --- Dot grid around border (additional tracking features) ---
    for i in range(10):
        x = 50 + i * (W - 100) // 9
        draw.ellipse([x - 4, 30, x + 4, 38], fill=(0, 0, 0))  # top
        draw.ellipse([x - 4, H - 38, x + 4, H - 30], fill=(0, 0, 0))  # bottom
    for j in range(10):
        y = 50 + j * (H - 100) // 9
        draw.ellipse([30, y - 4, 38, y + 4], fill=(0, 0, 0))  # left
        draw.ellipse([W - 38, y - 4, W - 30, y + 4], fill=(0, 0, 0))  # right

    path = os.path.join(TARGETS_DIR, "test-target.jpg")
    img.save(path, "JPEG", quality=95)
    print(f"  Created: {path}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("Generating KCM AR Museum placeholder assets...\n")
    _ensure_dirs()

    print("[Overlay textures]")
    generate_schoolhouse_overlay()
    generate_barn_overlay()
    generate_derrick_overlay()

    print("\n[Historical photo placeholders]")
    generate_historical_norris()
    generate_historical_barn()
    generate_historical_derrick()

    print("\n[AR tracking test target]")
    generate_test_target()

    print("\nDone! All placeholder assets have been generated.")


if __name__ == "__main__":
    main()
