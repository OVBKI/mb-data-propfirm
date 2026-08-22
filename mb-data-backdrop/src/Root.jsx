import React from 'react'
import { Composition } from 'remotion'
import { Backdrop } from './Backdrop'

// 20 s à 30 i/s. Assez long pour qu'on ne perçoive pas la répétition, assez
// court pour que le fichier reste petit — le contenu est un dégradé lisse, il
// se compresse très bien.
//
// 960×540 suffit : l'image n'a AUCUN détail fin. Elle sera étirée en plein
// écran, et un dégradé flou agrandi reste un dégradé flou. Rendre en 1080p
// quadruplerait le poids pour un résultat identique à l'œil.
export const RemotionRoot = () => (
  <Composition
    id="Backdrop"
    component={Backdrop}
    durationInFrames={600}
    fps={30}
    width={960}
    height={540}
  />
)
