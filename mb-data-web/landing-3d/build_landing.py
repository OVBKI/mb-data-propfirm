# build_landing.py — assemble la landing 3D en UN fichier HTML autonome.
#
#   python3 build_landing.py dist/index.html
#
# index.html est un gabarit : {{LOGO}}, {{HERO_POSTER}} et {{HERO_VIDEO}} sont
# remplacés par des data-URI, si bien que la page tient dans un seul fichier
# qu'on peut ouvrir, envoyer ou publier telle quelle, sans serveur ni chemins
# relatifs à casser. Sans vidéo (assets/hero-loop.webm absent), le hero reste
# sur l'image fixe : la page fonctionne, elle est juste immobile.
import base64, sys, os, mimetypes
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "index.html")
LOGO = os.path.join(HERE, "..", "public", "quantara-logo.webp")
POSTER = os.path.join(HERE, "assets", "hero-poster.png")
VIDEO = os.path.join(HERE, "assets", "hero-loop.webm")
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "dist", "index.html")

def uri(p):
    mt = mimetypes.guess_type(p)[0] or "application/octet-stream"
    return f"data:{mt};base64," + base64.b64encode(open(p, "rb").read()).decode()

h = open(SRC, encoding="utf-8").read().replace("{{LOGO}}", uri(LOGO)).replace("{{HERO_POSTER}}", uri(POSTER))
h = h.replace("{{HERO_VIDEO}}", uri(VIDEO) if os.path.exists(VIDEO) else "")
os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
open(out, "w", encoding="utf-8").write(h)
print("landing assemblée :", out, round(os.path.getsize(out) / 1e6, 2), "Mo", "(avec vidéo)" if os.path.exists(VIDEO) else "(image fixe)")
