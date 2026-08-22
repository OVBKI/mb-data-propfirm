// src/Backdrop.jsx — le halo Abyss, animé.
//
// Rendu par Remotion vers une boucle vidéo : le navigateur ne calcule rien à
// l'exécution, il décode un fichier. C'est le compromis de cette approche —
// on gagne un mouvement impossible à écrire en CSS, on perd la réactivité aux
// données et la bascule de thème.
//
// LA CONTRAINTE QUI GOUVERNE TOUT : la boucle doit être PARFAITE. Une vidéo de
// fond qui saute toutes les 20 secondes est pire que pas de vidéo du tout. D'où
// des trajectoires fermées : chaque blob parcourt une figure de Lissajous dont
// la période divise exactement la durée totale, si bien que l'image 600 est
// rigoureusement identique à l'image 0.

import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'

// Les trois accents d'Abyss, repris de app/globals.css.
const BLOBS = [
  // couleur            alpha  taille    centre      amplitude   harmoniques
  { c: '90,176,255',  a: 0.34, r: 0.95, x: 0.86, y: -0.10, ax: 0.10, ay: 0.09, hx: 1, hy: 2 },
  { c: '61,219,168',  a: 0.20, r: 0.72, x: 0.10, y: 0.04,  ax: 0.09, ay: 0.07, hx: 2, hy: 1 },
  { c: '165,139,255', a: 0.16, r: 0.80, x: 0.50, y: 1.06,  ax: 0.12, ay: 0.06, hx: 1, hy: 3 },
]

export const Backdrop = () => {
  const frame = useCurrentFrame()
  const { width, height, durationInFrames } = useVideoConfig()

  // t ∈ [0,1[ sur la durée totale. Toutes les fonctions ci-dessous sont
  // périodiques de période 1 : c'est ce qui rend la boucle sans couture.
  const t = (frame / durationInFrames) * Math.PI * 2

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a1420' }}>
      {/* Le voile de base d'Abyss — fixe, il ancre la composition. */}
      <AbsoluteFill style={{
        background: 'linear-gradient(168deg, rgba(22,48,76,0.90) 0%, rgba(10,20,32,0) 64%)',
      }} />

      {BLOBS.map((b, i) => {
        const cx = (b.x + Math.sin(t * b.hx) * b.ax) * width
        const cy = (b.y + Math.cos(t * b.hy) * b.ay) * height
        // La respiration : le rayon oscille de ±6 %. Déphasée par blob, sinon
        // les trois pulsent ensemble et ça devient un battement de cœur.
        const rr = b.r * (1 + Math.sin(t + i * 2.1) * 0.06)
        return (
          <AbsoluteFill
            key={i}
            style={{
              background: `radial-gradient(${rr * width}px ${rr * height * 0.62}px at ${cx}px ${cy}px, rgba(${b.c},${b.a}), transparent 62%)`,
            }}
          />
        )
      })}

      {/* Grain. Il n'est pas décoratif : un dégradé radial de cette taille
          produit des ANNEAUX de banding, et la compression vidéo les aggrave en
          y ajoutant du blocking. Le bruit casse les deux. */}
      <AbsoluteFill style={{
        opacity: 0.045,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />
    </AbsoluteFill>
  )
}
