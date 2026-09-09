import React from 'react'
import { Composition } from 'remotion'
import { Backdrop } from './Backdrop'
import { HeroLoop } from './HeroLoop'

// 20 s à 30 i/s. Assez long pour qu'on ne perçoive pas la répétition, assez
// court pour que le fichier reste petit — le contenu est un dégradé lisse, il
// se compresse très bien.
//
// 960×540 suffit : l'image n'a AUCUN détail fin. Elle sera étirée en plein
// écran, et un dégradé flou agrandi reste un dégradé flou. Rendre en 1080p
// quadruplerait le poids pour un résultat identique à l'œil.
// HeroLoop : la boucle du hero de la landing 3D (mb-data-web/landing-3d).
// 150 images = un tour complet de la pièce rendu par Blender ; l'image 150
// est l'image 0, la boucle est parfaite. 1280×720 parce qu'ici il y a du
// détail fin (la gravure) — l'inverse du Backdrop. Voir ../render_hero.sh.
export const RemotionRoot = () => (<>
  <Composition
    id="HeroLoop"
    component={HeroLoop}
    durationInFrames={150}
    fps={30}
    width={1280}
    height={720}
  />
  <Composition
    id="Backdrop"
    component={Backdrop}
    durationInFrames={600}
    fps={30}
    width={960}
    height={540}
  />
</>)
