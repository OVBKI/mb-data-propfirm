#!/bin/bash
# La boucle vidéo du hero de la landing 3D : Remotion recompose la main
# (public/hand.png) et les 150 images de la pièce (public/coin/) rendues par
# blender/render_frames.sh, en WebM VP9 AVEC canal alpha — la page peut donc
# la poser sur n'importe quel fond.
#
# ⚠️ Ne PAS passer --browser-executable : le chrome-headless-shell que Remotion
# installe lui-même fonctionne ; forcer un Chromium externe échoue au lancement.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
OUT="$HERE/../mb-data-web/landing-3d/assets/hero-loop.webm"
n=$(ls "$HERE/public/coin" 2>/dev/null | wc -l)
[ "$n" -eq 150 ] || { echo "il manque des images de pièce ($n/150) — lance blender/render_frames.sh"; exit 1; }
cd "$HERE" && npx remotion render src/index.js HeroLoop "$OUT" --codec=vp9 --pixel-format=yuva420p --image-format=png --crf=32 --log=error
ls -la "$OUT"
