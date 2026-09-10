// src/HeroLoop.jsx — la boucle du hero : deux mains de bronze qui se referment
// doucement autour de la pièce gravée, qui tourne et flotte. Tout est RENDU PAR
// BLENDER (Cycles), une image par frame ; ici on ne fait que rejouer la séquence
// et l'encoder — aucun rendu 3D dans le navigateur.
//
// La boucle est parfaite par construction : toutes les animations de la scène
// sont périodiques sur `durationInFrames`, donc l'image N est identique à
// l'image 0.
import React from 'react'
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion'

// Le « bloom » — le halo lumineux sur les hautes lumières du bronze — est fait
// ICI, pas dans Blender : Cycles n'en a pas, et Remotion rend dans Chrome, où un
// flou + fusion « screen » d'une copie de l'image donne exactement ça. Le halo
// déborde sur les zones transparentes avec une alpha partielle : c'est voulu,
// il se pose en douceur sur le fond de la page.
export const HeroLoop = () => {
  const frame = useCurrentFrame()
  const src = staticFile(`frames/frame_${String(frame).padStart(4, '0')}.png`)
  const fill = { position: 'absolute', inset: 0, width: '100%', height: '100%' }
  return (
    <AbsoluteFill style={{ background: 'transparent' }}>
      <Img src={src} style={fill} />
      <Img src={src} style={{ ...fill, filter: 'blur(22px) brightness(1.35) saturate(1.2)', mixBlendMode: 'screen', opacity: 0.55 }} />
    </AbsoluteFill>
  )
}
