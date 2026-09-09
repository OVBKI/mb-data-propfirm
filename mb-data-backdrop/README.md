# mb-data-backdrop — le fond animé du dashboard

Projet **Remotion** séparé. Il ne fait qu'une chose : produire
`mb-data-web/public/backdrop.webm`, la boucle vidéo jouée derrière l'app.

## Pourquoi un projet à part

Remotion est un outil de BUILD, pas une dépendance d'exécution. L'installer dans
`mb-data-web` ajouterait ~250 paquets et un Chrome de 92 Mo à un projet qui ne
s'en sert jamais au runtime. L'app ne connaît que le fichier produit.

## Régénérer la vidéo

```bash
cd mb-data-backdrop
npm install
npx remotion browser ensure          # chrome-headless-shell, ~92 Mo, une fois
npx remotion render src/index.js Backdrop out/backdrop.webm --codec=vp9 --crf=40
cp out/backdrop.webm ../mb-data-web/public/backdrop.webm
```

## Les trois décisions à ne pas défaire

1. **La boucle doit être FERMÉE.** Chaque blob suit une figure de Lissajous dont
   la période divise la durée totale, si bien que l'image 600 est identique à
   l'image 0. Vérifié : 1/255 d'écart maximum. Un fond qui saute toutes les 20 s
   est pire que pas de fond animé.

2. **960×540, pas 1080p.** L'image n'a aucun détail fin — c'est un dégradé flou.
   Étirée en plein écran, elle reste identique à l'œil. Rendre en 1080p
   quadruplerait le poids pour rien.

3. **WebM seul, pas de MP4.** Le même contenu pèse 52 ko en VP9 contre 893 ko en
   H.264 — un dégradé lisse est le pire cas pour H.264. Safari ne lit pas ce
   WebM et retombe sur le halo CSS, qui est l'apparence actuelle de l'app : une
   dégradation propre, pas un écran cassé.

## Budget de poids

`mb-data-web/lib/assets.test.js` échoue si le fichier dépasse 200 ko. C'est le
garde-fou contre un rendu en haute résolution livré sans qu'on s'en aperçoive.

---

## HeroLoop — la boucle 3D de la landing (`mb-data-web/landing-3d`)

Deuxième composition, tout autre budget : ici il y a du DÉTAIL FIN (une pièce
gravée du logo), donc 1280×720 et un WebM VP9 **avec alpha**.

Le partage des rôles, qui rend le rendu faisable sur un simple CPU :

| Étape | Outil | Ce qu'il produit |
|---|---|---|
| `blender/make_mask.py` | Blender (`pip install bpy`) | `logo_mask.png` — le relief du logo, lu dans le canal **alpha** du WebP (le fond est transparent : la luminance est vide) |
| `blender/scene.py` | Blender, Cycles CPU | la main-statue (une image, elle ne bouge pas) et la pièce (150 images, un tour complet) |
| `src/HeroLoop.jsx` | Remotion | recompose main + pièce, image par image — aucun rendu 3D dans le navigateur |
| `render_hero.sh` | Remotion CLI | `mb-data-web/landing-3d/assets/hero-loop.webm` |

```bash
pip install bpy numpy                    # Blender en module Python, sans interface
python3 blender/make_mask.py -- blender/logo_mask.png
./blender/render_frames.sh               # ~1 h sur 4 cœurs ; relançable, saute l'existant
./render_hero.sh                         # → ../mb-data-web/landing-3d/assets/hero-loop.webm
cd ../mb-data-web && python3 landing-3d/build_landing.py dist/index.html
```

Ce qui a été essayé et abandonné, pour ne pas y retourner :
- **Métaballes** pour la main : des fragments, jamais une main. La main est faite
  de primitives (capsules, palme = cube biseauté) jointes puis **remesh voxel
  0.022 → lissage correctif 30 → subsurf**.
- **Gravure par luminance** du logo : pièce lisse — voir le masque alpha ci-dessus.
- **Rendre la pièce à chaque image avec la main** : ~55 s/image. Le mode
  `--layer coin` ne construit pas la main, rend une zone limitée à la pièce
  (`use_border`, mesurée sur les images) et enchaîne une plage d'images par
  processus : ~20 s/image en agrégé sur 4 processus à 1 thread.
- **`--browser-executable` vers le Chromium de Playwright** : Remotion échoue au
  lancement ; son propre chrome-headless-shell fonctionne.
- **Three.js dans le navigateur** (`@react-three/fiber` + `@remotion/three`) :
  faisable, mais l'app ne charge alors pas une vidéo mais un moteur 3D et un
  modèle — et la main procédurale n'existe qu'en Blender. Écarté ; les
  dépendances n'ont pas été gardées.
