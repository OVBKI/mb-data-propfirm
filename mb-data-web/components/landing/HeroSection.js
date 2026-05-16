'use client'
// Hero animé : logo Quantara avec glow qui suit la souris + tagline en spring sequence.
// PERF : useMotionValue au lieu de useState pour le mouse tracking → 0 re-render React
// (les motion values updatent le DOM directement, sans repasser par React)

import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import AnimatedQLogo from './AnimatedQLogo'

const C = {
  text: '#f0ede8',
  text2: '#9098b0',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
}

// Props:
//   - children : CTA buttons (passés depuis page.js)
//   - hideLogo : si true, le logo 2D + ses halos sont remplacés par un simple
//     spacer (utilisé quand on affiche un logo/planète 3D via StarField3D).
export default function HeroSection({ children, hideLogo = false }) {
  const ref = useRef(null)

  // PERF : motion values évitent les re-renders à chaque mousemove
  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)
  // Spring smoothing direct côté framer-motion (pas de re-render React)
  const glowX = useSpring(useTransform(mouseX, v => (v - 0.5) * 40), { stiffness: 80, damping: 20 })
  const glowY = useSpring(useTransform(mouseY, v => (v - 0.5) * 40), { stiffness: 80, damping: 20 })

  useEffect(() => {
    let rafId
    let pendingX = 0.5
    let pendingY = 0.5
    let needsUpdate = false

    function onMove(e) {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      pendingX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      pendingY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
      needsUpdate = true
    }

    // Throttle via rAF → max 60 updates/sec au lieu de 1000+ events/sec
    function tick() {
      if (needsUpdate) {
        mouseX.set(pendingX)
        mouseY.set(pendingY)
        needsUpdate = false
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    window.addEventListener('mousemove', onMove, { passive: true })

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onMove)
    }
  }, [mouseX, mouseY])

  const words = ['Track.', 'Analyze.', 'Grow.']
  const wordColors = [C.blue, C.blueLight, '#7ba9ff']

  return (
    <div ref={ref} style={{
      position: 'relative', zIndex: 2,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '120px 24px 80px', textAlign: 'center',
    }}>
      {/* Logo 2D + halos — caché quand on utilise une planète 3D (StarField3D).
          Quand caché, on remplace par un spacer pour réserver l'espace vertical. */}
      {hideLogo ? (
        <div style={{ height: 280, marginBottom: 28 }} aria-hidden="true" />
      ) : (
      <motion.div
        initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 160, damping: 14, delay: 0.1 }}
        whileHover={{ scale: 1.05 }}
        style={{ position: 'relative', marginBottom: 8, cursor: 'pointer' }}
      >
        {/* Halo qui suit la souris — motion values directes (pas de re-render React) */}
        <motion.div
          style={{
            x: glowX,
            y: glowY,
            position: 'absolute', inset: 0,
            width: 180, height: 180,
            marginLeft: 'auto', marginRight: 'auto',
            top: -30, left: -30,
            background: `radial-gradient(circle,
              rgba(77,143,255,0.35) 0%,
              rgba(77,143,255,0.28) 12%,
              rgba(77,143,255,0.20) 25%,
              rgba(77,143,255,0.13) 38%,
              rgba(77,143,255,0.07) 52%,
              rgba(77,143,255,0.03) 68%,
              rgba(77,143,255,0.01) 82%,
              transparent 100%)`,
            filter: 'blur(20px)',
            zIndex: -1,
            pointerEvents: 'none',
          }}
        />
        {/* Idle pulse — second halo plus large, smooth gradient */}
        <motion.div
          animate={{
            scale: [1, 1.18, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            position: 'absolute', inset: 0,
            width: 220, height: 220,
            marginLeft: 'auto', marginRight: 'auto',
            top: -50, left: -50,
            background: `radial-gradient(circle,
              rgba(77,143,255,0.18) 0%,
              rgba(77,143,255,0.13) 15%,
              rgba(77,143,255,0.08) 30%,
              rgba(77,143,255,0.04) 50%,
              rgba(77,143,255,0.015) 70%,
              transparent 90%)`,
            filter: 'blur(30px)',
            zIndex: -2,
            pointerEvents: 'none',
          }}
        />
        {/* Logo Q SVG animé (Q icon seul, sans wordmark).
            Le wordmark QUANTARA est rendu en texte juste en dessous (spring framer-motion). */}
        <AnimatedQLogo size={220} />
      </motion.div>
      )}

      {/* QUANTARA wordmark — réactivé puisque le nouveau SVG est Q-only.
          Spring animation framer-motion + lettré 0.08em pour effet premium. */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 22, delay: 0.3 }}
        style={{
          fontSize: 'clamp(38px, 7vw, 64px)',
          fontWeight: 800,
          letterSpacing: '0.08em',
          color: C.text,
          marginBottom: 14,
        }}
      >QUANTARA</motion.div>

      {/* Tagline 3 mots avec spring sequence */}
      <div style={{
        display: 'flex', gap: 'clamp(8px, 2vw, 18px)',
        flexWrap: 'wrap', justifyContent: 'center',
        marginBottom: 28,
      }}>
        {words.map((word, i) => (
          <motion.span
            key={word}
            initial={{ opacity: 0, y: 30, scale: 0.7 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              type: 'spring',
              stiffness: 220,
              damping: 12,
              delay: 0.55 + i * 0.13,
            }}
            style={{
              fontSize: 'clamp(20px, 3.5vw, 30px)',
              fontWeight: 700,
              color: wordColors[i],
              letterSpacing: '0.05em',
            }}
          >{word}</motion.span>
        ))}
      </div>

      {/* Sous-titre */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.0 }}
        style={{
          fontSize: 'clamp(15px, 1.8vw, 18px)',
          color: C.text2,
          maxWidth: 600,
          lineHeight: 1.6,
          marginBottom: 40,
        }}
      >
        Le journal de trading pensé pour les traders PropFirm futures.<br />
        Drawdown trailing, profit split, payouts — tout est tracké automatiquement.
      </motion.p>

      {/* CTA children (boutons passés depuis le parent) */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.15 }}
      >{children}</motion.div>
    </div>
  )
}
