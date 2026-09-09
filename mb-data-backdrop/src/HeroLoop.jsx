// src/HeroLoop.jsx — la boucle du hero : une main-statue immobile, une pièce
// gravée qui tourne. Les deux couches sont RENDUES PAR BLENDER (Cycles) ; ici
// on ne rend rien en 3D, on COMPOSE. C'est le partage des rôles qui rend la
// chose faisable sur CPU : la main coûte cher et ne bouge pas, donc une seule
// image ; la pièce est petite et bouge, donc une image par frame.
//
// La boucle est parfaite par construction : la pièce fait exactement UN tour
// sur `durationInFrames`, donc l'image N est identique à l'image 0.
import React from 'react'
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'

export const HeroLoop = () => {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const t = frame / durationInFrames

  // Un balayage de lumière très discret sur la main, périodique lui aussi :
  // il évite qu'une couche immobile paraisse « collée » sur la vidéo.
  const sheen = 0.94 + 0.06 * Math.sin(2 * Math.PI * t)

  return (
    <AbsoluteFill style={{ background: 'transparent' }}>
      <Img src={staticFile('hand.png')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', filter: `brightness(${sheen})` }} />
      <Img src={staticFile(`coin/coin_${String(frame).padStart(4, '0')}.png`)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    </AbsoluteFill>
  )
}
