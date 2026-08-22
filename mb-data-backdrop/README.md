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
