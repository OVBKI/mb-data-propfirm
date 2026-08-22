'use client'
// components/dashboard/DashboardBackdrop.js — le halo Abyss, en mouvement.
//
// Le fond est une BOUCLE VIDÉO produite par Remotion (voir mb-data-backdrop/).
// Composer l'animation en React avec un contrôle à l'image près permet une
// boucle mathématiquement fermée — vérifiée à 1/255 d'écart entre la première
// et la dernière image. Une vidéo de fond qui saute toutes les 20 secondes est
// pire que pas de vidéo du tout.
//
// Ce que ce choix COÛTE, et qu'il faut assumer :
//   • le fond ne réagit plus aux données (il est cuit dans le fichier)
//   • il ne suit pas le thème : il est sombre, donc masqué en thème clair
//   • le décodage vidéo consomme plus qu'un transform CSS
// Ce qu'il apporte : un mouvement de dégradés impossible à écrire en CSS sans
// empiler des filtres coûteux.
//
// PAS DE MP4. Safari ne lit pas ce WebM et retombe alors sur le halo CSS, qui
// est exactement l'apparence actuelle de l'app — une dégradation propre. Livrer
// un MP4 de secours pesait 893 ko contre 52 ko pour le WebM, pour un fond que
// l'utilisateur ne regarde pas.

import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../ThemeProvider'

export default function DashboardBackdrop() {
  const videoRef = useRef(null)
  const { theme } = useTheme()
  const [live, setLive] = useState(false)
  const [reduced, setReduced] = useState(true)

  // Le réglage système peut changer sans rechargement : on l'écoute.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduced(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  // Un onglet en arrière-plan ne doit pas décoder de vidéo. Le composant
  // précédent laissait tourner une boucle d'animation à 60 i/s indéfiniment.
  useEffect(() => {
    function onVis() {
      const v = videoRef.current
      if (!v) return
      if (document.hidden) v.pause()
      else v.play().catch(() => {})
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  // La vidéo est dessinée pour le sombre : en clair elle serait une tache noire.
  const dark = theme !== 'light'
  if (!dark || reduced) return null

  return (
    <div
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}
    >
      <video
        ref={videoRef}
        // `autoPlay muted playsInline` : les trois sont nécessaires ensemble,
        // sinon iOS et Chrome refusent la lecture automatique.
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onPlaying={() => setLive(true)}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%', objectFit: 'cover',
          // On ne révèle la vidéo qu'une fois qu'elle PEINT vraiment. Avant, le
          // halo CSS reste seul : pas de rectangle noir pendant le chargement.
          opacity: live ? 1 : 0,
          transition: 'opacity 1.2s ease',
        }}
      >
        <source src="/backdrop.webm" type="video/webm" />
      </video>
      {/* Tant que la vidéo n'est pas en lecture, le halo CSS assure. Dès qu'elle
          l'est, on le retire : les deux superposés doubleraient l'intensité. */}
      <style>{live ? 'body::before{opacity:0;transition:opacity 1.2s ease}' : ''}</style>
    </div>
  )
}
