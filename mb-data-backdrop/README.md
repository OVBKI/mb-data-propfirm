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
gravée du logo, du bronze), donc 1440×648 et un WebM VP9 **avec alpha**.

La scène, d'après *La Cathédrale* de Rodin : deux mains de bronze qui sortent
du sol (poignets sous le cadre) et viennent enrouler la pièce, qui flotte en vue
3/4 — même matière bronze pour les deux. 120 images à 24 i/s = 5 s, 1440×648
(20:9, la vidéo court sur toute la largeur du hero), boucle parfaite (toutes les
animations sont périodiques sur la durée). Le bloom est ajouté par Remotion
(copie floutée en fusion « screen » dans `HeroLoop.jsx`).

| Étape | Outil | Ce qu'il produit |
|---|---|---|
| `blender/make_mask.py` | Blender (`pip install bpy`) | `logo_mask.png` — le relief du logo, lu dans le canal **alpha** du WebP (le fond est transparent : la luminance est vide) |
| `blender/scene_hands.py` | Blender, Cycles CPU | les 120 images : mains libhand animées (ouvertes → enroulées) + pièce gravée en vue 3/4 |
| `src/HeroLoop.jsx` | Remotion | rejoue la séquence image par image et ajoute le bloom — aucun rendu 3D dans le navigateur |
| `render_hero.sh` | Remotion CLI | `mb-data-web/landing-3d/assets/hero-loop.webm` |

```bash
pip install bpy numpy                    # Blender en module Python, sans interface
python3 blender/make_mask.py -- blender/logo_mask.png
./blender/render_frames.sh               # clone libhand, ~30 min sur 4 cœurs ; relançable
./render_hero.sh                         # → ../mb-data-web/landing-3d/assets/hero-loop.webm
cd ../mb-data-web && python3 landing-3d/build_landing.py dist/index.html
```

### La main : libhand (CC BY 3.0)
`github.com/libhand/libhand` — une main humaine réaliste, 35 000 sommets, rig
complet (`finger1..5joint1..3`). C'est le seul modèle de main trouvé sur GitHub
qui soit à la fois réaliste, riggé et sous licence permissive ; la mention
d'attribution est dans le pied de page de la landing. Le `.blend` (10 Mo) n'est
pas versionné : `render_frames.sh` le clone.

Trois pièges de ce fichier (Blender 2.5x) :
- **L'objet Armature est en rotation QUATERNION** : `rotation_euler` est ignoré
  sans `rotation_mode = "XYZ"` d'abord. Une heure perdue à voir des mains à
  l'envers.
- **Un angle NÉGATIF sur X fléchit un doigt vers la paume** ; positif, il le plie
  en arrière.
- Le matériau `skin` n'a plus de texture branchée après conversion : on
  reconstruit le matériau (ici, du bronze).

Repère du modèle : doigts vers -X, paume vers -Z, poignet vers +X. Avec
`rotation_euler = (0, +90°, 0)` les doigts pointent vers +Z et la paume vers -X
(main de droite) ; la main de gauche est son miroir (`scale.x = -1` sur le pivot).

### Ce qui a été essayé et abandonné, pour ne pas y retourner
- **Une main procédurale** (capsules + remesh voxel, `scene_pointing.py`, gardé
  pour mémoire) : lisible mais pas belle — c'est ce qui a motivé la recherche
  d'un vrai modèle.
- **Mains robotiques** : Shadow Dexterous Hand, LEAP, Allegro
  (`google-deepmind/mujoco_menagerie`, posées via MuJoCo) et NASA Robonaut 2
  (`gkjohnson/nasa-urdf-robots`, domaine public, COLLADA converti à la main
  faute d'importeur dans le `bpy` pip). Rendues et proposées ; l'utilisateur a
  finalement choisi la composition Rodin avec des mains humaines.
- **`--browser-executable` vers le Chromium de Playwright** : Remotion échoue au
  lancement ; son propre chrome-headless-shell fonctionne.
- **Three.js dans le navigateur** (`@react-three/fiber` + `@remotion/three`) :
  faisable, mais l'app chargerait un moteur 3D et un modèle au lieu d'une vidéo
  de quelques centaines de ko. Écarté.
