'use client'
// Background atmosphérique du dashboard — rappelle l'espace de la landing.
// Couche fixed derrière tout le contenu, n'interfère JAMAIS avec la lisibilité ou l'interaction.
//
// Composé de :
//   1. Starfield : ~50 particules statiques (pas de mouvement → 0 cost CPU)
//   2. 2 blobs gradient mesh (mouvement ultra lent, blue subtle)
//   3. Vignette pour adoucir les bords
//   4. Subtle grain noise pour texture
//
// Volontairement minimal — la beauté vient de la restraint, pas de l'effet.

import { useEffect, useRef } from 'react'

export default function SpaceBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let dpr = 1
    let width = 0
    let height = 0
    let stars = []

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = width + 'px'
      canvas.style.height = height + 'px'
      ctx.scale(dpr, dpr)
      // Génère 50 étoiles avec opacity et taille aléatoires (mais consistent across resizes)
      stars = Array.from({ length: 50 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 0.9 + 0.3,
        opacity: Math.random() * 0.4 + 0.15,
        // Pulse léger asynchrone pour donner de la vie
        pulseSpeed: Math.random() * 0.0008 + 0.0002,
        pulseOffset: Math.random() * Math.PI * 2,
      }))
    }

    let rafId
    function draw(time) {
      ctx.clearRect(0, 0, width, height)
      // Additive blending pour glow naturel quand 2 étoiles se touchent
      ctx.globalCompositeOperation = 'lighter'
      stars.forEach(s => {
        // Pulse subtle de l'opacité (chaque étoile clignote différemment)
        const pulse = Math.sin(time * s.pulseSpeed + s.pulseOffset) * 0.15 + 0.85
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(180,200,255,${s.opacity * pulse})`
        ctx.fill()
      })
      ctx.globalCompositeOperation = 'source-over'
      rafId = requestAnimationFrame(draw)
    }

    resize()
    rafId = requestAnimationFrame(draw)
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
      overflow: 'hidden',
    }}>
      {/* Canvas starfield (animé) */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
        }}
      />

      {/* Mesh gradient blobs — animation CSS pure (pas de framer-motion → léger) */}
      <div className="dash-blob dash-blob-1" />
      <div className="dash-blob dash-blob-2" />

      {/* Vignette pour adoucir les bords + densifier le centre */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 100% 80% at 50% 30%, transparent 30%, rgba(13,15,20,0.6) 95%)',
      }} />

      {/* Grain noise très subtil pour texture (no mix-blend pour perf) */}
      <div style={{
        position: 'absolute', inset: 0,
        opacity: 0.012,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />

      <style>{`
        .dash-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.5;
          will-change: transform;
        }
        .dash-blob-1 {
          top: -10%;
          left: 60%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, var(--blue-bg) 0%, var(--blue-bg) 35%, transparent 70%);
          animation: dashBlobFloat1 50s ease-in-out infinite;
        }
        .dash-blob-2 {
          top: 50%;
          left: -10%;
          width: 700px;
          height: 700px;
          background: radial-gradient(circle, var(--blue-bg) 0%, var(--blue-bg) 40%, transparent 70%);
          animation: dashBlobFloat2 65s ease-in-out infinite;
        }
        @keyframes dashBlobFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%      { transform: translate(-80px, 40px) scale(1.1); }
          66%      { transform: translate(60px, -60px) scale(0.95); }
        }
        @keyframes dashBlobFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(50px, -40px) scale(1.05); }
        }
      `}</style>
    </div>
  )
}
