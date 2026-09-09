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

export const HeroLoop = () => {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill style={{ background: 'transparent' }}>
      <Img src={staticFile(`frames/frame_${String(frame).padStart(4, '0')}.png`)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    </AbsoluteFill>
  )
}
