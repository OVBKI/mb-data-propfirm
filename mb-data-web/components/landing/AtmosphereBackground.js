'use client'
// Background atmosphère luxury : 1 mesh gradient TRÈS subtil + grain noise + vignette.
// Volontairement minimal — la beauté vient de la restraint, pas de l'effet.
// Aucune particule, aucun mouvement excessif.

import { motion } from 'framer-motion'

export default function AtmosphereBackground() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none',
      overflow: 'hidden',
    }}>
      {/* Mesh gradient ultra subtil — 2 blobs très lents */}
      <motion.div
        animate={{ x: [0, 80, -40, 0], y: [0, -60, 40, 0] }}
        transition={{ duration: 40, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: '15%', left: '60%',
          width: 700, height: 700,
          background: 'radial-gradient(circle, rgba(45,111,255,0.10), transparent 65%)',
          filter: 'blur(120px)',
        }}
      />
      <motion.div
        animate={{ x: [0, -60, 30, 0], y: [0, 40, -50, 0] }}
        transition={{ duration: 50, repeat: Infinity, ease: 'easeInOut', delay: 10 }}
        style={{
          position: 'absolute',
          top: '60%', left: '5%',
          width: 600, height: 600,
          background: 'radial-gradient(circle, rgba(77,143,255,0.06), transparent 65%)',
          filter: 'blur(100px)',
        }}
      />

      {/* Grain noise (très faible opacity, signal luxury) */}
      <div style={{
        position: 'absolute', inset: 0,
        opacity: 0.035,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`,
        mixBlendMode: 'overlay',
      }} />

      {/* Vignette subtile (assombrit les coins) */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)',
      }} />
    </div>
  )
}
