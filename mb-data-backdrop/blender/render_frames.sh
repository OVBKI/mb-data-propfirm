#!/bin/bash
# Rend les couches du hero avec Blender (module pip `bpy`, Cycles CPU) :
#   • hand.png             — la main-statue, immobile : UNE image, à 160 échantillons ;
#   • coin/coin_0000..0149 — la pièce, un tour complet sur 150 images (boucle parfaite).
# Sortie dans ../public/, là où HeroLoop.jsx (Remotion) les recompose.
#
#   ./render_frames.sh            # tout
#   ./render_frames.sh coin       # seulement la pièce (reprend où elle s'est arrêtée)
#
# La pièce est rendue par 4 processus à 1 thread chacun sur des plages
# d'images : Cycles ne monte pas linéairement avec les threads, et chaque
# processus ne construit la scène qu'une fois. Une image existante est sautée,
# donc on peut relancer après une interruption sans rien perdre.
set -e
HERE=$(cd "$(dirname "$0")" && pwd); PUB="$HERE/../public"; mkdir -p "$PUB/coin"
WHAT=${1:-all}
if [ "$WHAT" != "coin" ]; then
  python3 "$HERE/scene.py" -- --layer hand --samples 160 --out "$PUB/hand.png"
fi
for r in "0 37" "38 75" "76 112" "113 149"; do set -- $r
  python3 "$HERE/scene.py" -- --layer coin --frame $1 --to $2 --samples 40 --threads 1 --out "$PUB/coin/coin_XXXX.png" > "$HERE/coin_$1.log" 2>&1 &
done
wait
ls "$PUB/coin" | wc -l | xargs -I{} echo "{} images de pièce dans $PUB/coin"
