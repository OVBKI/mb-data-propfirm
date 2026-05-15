'use client'
// Hero animé : logo Quantara avec glow qui suit la souris + tagline en spring sequence.
// Utilise framer-motion pour les ressorts physiques (pas des CSS transitions plates).

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Logo from '../Logo'

const C = {
  text: '#f0ede8',
  text2: '#9098b0',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
}

export default function HeroSection({ children }) {
  const ref = useRef(null)
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 }) // normalisé 0-1

  useEffect(() => {
    function onMove(e) {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height
      setMouse({ x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) })
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  // Glow position calculée depuis la souris (offset par rapport au centre)
  const glowX = (mouse.x - 0.5) * 40 // ±20px max
  const glowY = (mouse.y - 0.5) * 40

  const words = ['Track.', 'Analyze.', 'Grow.']
  const wordColors = [C.blue, C.blueLight, '#7ba9ff']

  return (
    <div ref={ref} style={{
      position: 'relative', zIndex: 2,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '120px 24px 80px', textAlign: 'center',
    }}>
      {/* Logo + glow réactif souris + idle pulse + scale au hover */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 160, damping: 14, delay: 0.1 }}
        whileHover={{ scale: 1.05 }}
        style={{ position: 'relative', marginBottom: 28, cursor: 'pointer' }}
      >
        {/* Halo qui suit la souris (le grand, principal) */}
        <motion.div
          animate={{ x: glowX, y: glowY }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          style={{
            position: 'absolute', inset: 0,
            width: 120, height: 120, marginLeft: 'auto', marginRight: 'auto',
            background: `radial-gradient(circle, ${C.blueLight}55, ${C.blue}20 40%, transparent 70%)`,
            filter: 'blur(30px)',
            zIndex: -1,
            pointerEvents: 'none',
          }}
        />
        {/* Idle pulse — second halo qui pulse doucement quand l'user bouge pas la souris */}
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            position: 'absolute', inset: 0,
            width: 140, height: 140,
            marginLeft: 'auto', marginRight: 'auto',
            top: -10, left: -10,
            background: `radial-gradient(circle, ${C.blueLight}30, transparent 60%)`,
            filter: 'blur(40px)',
            zIndex: -2,
            pointerEvents: 'none',
          }}
        />
        <Logo size={120} glow="strong" />
      </motion.div>

      {/* QUANTARA wordmark */}
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
