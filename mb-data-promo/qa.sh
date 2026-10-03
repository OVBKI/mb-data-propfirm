#!/bin/bash
# qa.sh <tag> <frame…> — rend des images fixes de contrôle et une planche contact.
# COMP=QuantaraVertical ./qa.sh … pour le 9:16 (planche de 6 colonnes).
TAG=$1; shift; COMP=${COMP:-QuantaraPromo}
for fr in "$@"; do npx remotion still src/index.ts $COMP out/qa/$TAG-$fr.png --frame=$fr --log=error >/dev/null 2>&1 || echo "FAIL $fr"; done
python3 - "$TAG" "$@" <<'PY'
import sys
from PIL import Image, ImageDraw
tag, frames = sys.argv[1], sys.argv[2:]
first = Image.open(f"out/qa/{tag}-{frames[0]}.png"); vertical = first.height > first.width
W, H, cols = (300, 533, 6) if vertical else (640, 360, 3)
rows = (len(frames) + cols - 1) // cols
sheet = Image.new("RGB", (W * cols, (H + 18) * rows), (0, 0, 0)); d = ImageDraw.Draw(sheet)
for i, k in enumerate(frames):
    im = Image.open(f"out/qa/{tag}-{k}.png").convert("RGB").resize((W, H)); x, y = (i % cols) * W, (i // cols) * (H + 18)
    sheet.paste(im, (x, y + 18)); d.text((x + 4, y + 3), f"f{k}", fill=(255, 200, 100))
sheet.save(f"out/qa/sheet-{tag}.png")
PY
