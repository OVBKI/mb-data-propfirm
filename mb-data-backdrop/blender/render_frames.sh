#!/bin/bash
# Rend les 120 images du hero « Cathédrale » avec Blender (module pip `bpy`,
# Cycles CPU) : deux mains de bronze qui se referment autour de la pièce gravée.
# Sortie dans ../public/frames/, là où HeroLoop.jsx (Remotion) les encode.
#
#   ./render_frames.sh
#
# La main est le modèle libhand (github.com/libhand/libhand, CC-BY 3.0) : son
# .blend de 10 Mo n'est pas versionné ici, il est cloné à la première exécution.
# Quatre processus à 1 thread sur des plages d'images : Cycles ne monte pas
# linéairement avec les threads, et chaque processus ne construit la scène qu'une
# fois. Une image existante est sautée : relançable après une interruption.
set -e
HERE=$(cd "$(dirname "$0")" && pwd); PUB="$HERE/../public/frames"; mkdir -p "$PUB"
[ -f "$HERE/libhand/hand_model/blender/hand.blend" ] || git clone -q --depth 1 https://github.com/libhand/libhand "$HERE/libhand"
for r in "0 29" "30 59" "60 89" "90 119"; do set -- $r
  python3 "$HERE/scene_hands.py" -- --frame $1 --to $2 --total 120 --samples 24 --w 1440 --h 648 --threads 1 --out "$PUB/frame_XXXX.png" > "$HERE/frames_$1.log" 2>&1 &
done
wait
ls "$PUB" | wc -l | xargs -I{} echo "{} images dans $PUB"
