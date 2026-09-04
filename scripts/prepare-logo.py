"""Prepare the Notely logo: crop black surround, round corners, resize."""
from PIL import Image, ImageDraw

SRC = "Codex Image Sep 3, 2026, 11_56_17 PM.png"
OUT = "public/logo.png"
SIZE = 512
CORNER = 112  # radius on the 512px canvas, echoing the tile's own rounding

img = Image.open(SRC).convert("RGB")

# Bounding box of the non-black tile (threshold to ignore near-black glow)
gray = img.convert("L").point(lambda v: 255 if v > 24 else 0)
bbox = gray.getbbox()
if bbox:
    img = img.crop(bbox)

# Square-crop to the centered tile with a hair of margin removed
w, h = img.size
side = min(w, h)
img = img.crop(((w - side) // 2, (h - side) // 2, (w + side) // 2, (h + side) // 2))
img = img.resize((SIZE, SIZE), Image.LANCZOS)

# Rounded-corner alpha mask
mask = Image.new("L", (SIZE, SIZE), 0)
draw = ImageDraw.Draw(mask)
draw.rounded_rectangle([0, 0, SIZE, SIZE], radius=CORNER, fill=255)

out = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
out.paste(img, (0, 0), mask)
out.save(OUT, optimize=True)
print("saved", OUT, out.size)
