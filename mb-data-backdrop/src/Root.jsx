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
// 120 images à 24 i/s = 5 s : un tour complet de la pièce et une respiration
// des mains, rendus par Blender ; l'image 120 est l'image 0, la boucle est
// parfaite. 1024×576 : il y a du détail fin (la gravure, le bronze) — l'inverse
// du Backdrop — mais le hero n'est jamais affiché plus large. Voir ../render_hero.sh.
export const RemotionRoot = () => (<>
  <Composition
    id="HeroLoop"
    component={HeroLoop}
    durationInFrames={120}
    fps={24}
    width={1024}
    height={576}
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
