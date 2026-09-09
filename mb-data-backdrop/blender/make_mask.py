# make_mask.py — le masque de relief gravé sur la pièce, tiré du logo.
#
#   python3 make_mask.py -- logo_mask.png
#
# ⚠️ Le logo (mb-data-web/public/quantara-logo.webp) a un FOND TRANSPARENT :
# ses canaux RVB sont vides là où il n'y a rien, donc un masque tiré de la
# luminance donnait une pièce lisse. Le motif est dans le canal ALPHA — c'est
# lui qu'on lit (blanc = motif = relief).
#
# Un léger flou adoucit la pente de gravure ; sans lui l'arête est en marche
# d'escalier et scintille d'une image à l'autre quand la pièce tourne.
import bpy, numpy as np, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
LOGO = os.path.join(HERE, "..", "..", "mb-data-web", "public", "quantara-logo.webp")
OUT = sys.argv[-1] if "--" in sys.argv else os.path.join(HERE, "logo_mask.png")

img = bpy.data.images.load(LOGO); w, h = img.size
a = np.array(img.pixels[:]).reshape(h, w, 4)[..., 3]

def blur(m, r=2):
    k = np.ones(2 * r + 1) / (2 * r + 1)
    m = np.apply_along_axis(lambda v: np.convolve(v, k, mode="same"), 0, m)
    return np.apply_along_axis(lambda v: np.convolve(v, k, mode="same"), 1, m)

m = blur(a, 2).clip(0, 1)
out = bpy.data.images.new("mask", w, h, alpha=False, float_buffer=False)
out.pixels.foreach_set(np.dstack([m, m, m, np.ones_like(m)]).astype(np.float32).ravel())
out.filepath_raw = OUT; out.file_format = "PNG"; out.save()
print("MASK_OK couverture motif %", round(100 * (a > 0.5).mean(), 1), OUT)
