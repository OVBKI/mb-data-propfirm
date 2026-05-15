'use client'
// Hero luxury : asymmetric, typo serif italic ÉNORME, equity curve à droite.
// Pas de centering générique — composition magazine éditoriale.

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const C = {
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#565e78',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
  green: '#1db87a',
  border: 'rgba(255,255,255,0.08)',
}

// Easing luxury — slow ease-out cubic-bezier
const LUXURY_EASE = [0.16, 1, 0.3, 1]

// === Mini hero equity curve (immersive, big, draws on load) ===
function HeroEquityCurve() {
  // Points : courbe qui monte avec légère volatilité, finit haut
  const points = [
    [0, 70], [8, 68], [16, 72], [25, 65], [33, 60], [42, 62],
    [50, 55], [58, 50], [66, 52], [75, 42], [83, 38], [92, 30], [100, 25],
  ]
  // Build smooth Catmull-Rom path
  function smoothPath(pts) {
    let d = `M ${pts[0][0]} ${pts[0][1]}`
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)]
      const p1 = pts[i]
      const p2 = pts[i + 1]
      const p3 = pts[Math.min(pts.length - 1, i + 2)]
      const cp1x = p1[0] + (p2[0] - p0[0]) / 6
      const cp1y = p1[1] + (p2[1] - p0[1]) / 6
      const cp2x = p2[0] - (p3[0] - p1[0]) / 6
      const cp2y = p2[1] - (p3[1] - p1[1]) / 6
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`
    }
    return d
  }
  const path = smoothPath(points)
  const areaPath = `${path} L 100 100 L 0 100 Z`

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{
      width: '100%', height: '100%', display: 'block',
    }}>
      <defs>
        <linearGradient id="heroLineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={C.blue} stopOpacity="0.6" />
          <stop offset="50%" stopColor={C.blueLight} />
          <stop offset="100%" stopColor={C.green} />
        </linearGradient>
        <linearGradient id="heroAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.blueLight} stopOpacity="0.25" />
          <stop offset="100%" stopColor={C.blueLight} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines très subtiles */}
      {[25, 50, 75].map(y => (
        <line key={y} x1="0" y1={y} x2="100" y2={y}
          stroke="rgba(255,255,255,0.04)" strokeWidth="0.15" />
      ))}

      {/* Fill area */}
      <motion.path
        d={areaPath}
        fill="url(#heroAreaGrad)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 2.5, ease: LUXURY_EASE }}
      />

      {/* Line balance */}
      <motion.path
        d={path}
        fill="none"
        stroke="url(#heroLineGrad)"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 3, delay: 0.8, ease: LUXURY_EASE }}
        style={{ filter: 'drop-shadow(0 0 2px rgba(77,143,255,0.6))' }}
      />

      {/* Point final qui glow */}
      <motion.circle
        cx={points[points.length - 1][0]}
        cy={points[points.length - 1][1]}
        r="1"
        fill={C.green}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 3.6, ease: LUXURY_EASE }}
        style={{ filter: 'drop-shadow(0 0 4px rgba(29,184,122,0.8))' }}
      />
    </svg>
  )
}

export default function HeroLuxury({ children }) {
  return (
    <section style={{
      position: 'relative',
      minHeight: '100vh',
      padding: 'clamp(120px, 14vh, 180px) clamp(24px, 6vw, 96px) 80px',
      display: 'flex',
      alignItems: 'center',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 1280,
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)',
        gap: 'clamp(40px, 6vw, 90px)',
        alignItems: 'center',
      }}
      className="hero-grid"
      >
        {/* LEFT : type */}
        <div>
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: LUXURY_EASE }}
            style={{
              fontFamily: 'var(--font-geist-mono)',
              fontSize: 12,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: C.text3,
              marginBottom: 32,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{ width: 28, height: 1, background: C.blueLight, opacity: 0.7 }} />
            <span>Quantara — Beta 1.0</span>
          </motion.div>

          {/* Headline serif italic ÉNORME */}
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 'clamp(52px, 8.5vw, 124px)',
            lineHeight: 0.95,
            letterSpacing: '-0.03em',
            color: C.text,
            margin: 0,
            marginBottom: 28,
          }}>
            {['Track.', 'Analyze.', 'Grow.'].map((word, i) => (
              <motion.span
                key={word}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 1.1,
                  delay: 0.3 + i * 0.15,
                  ease: LUXURY_EASE,
                }}
                style={{
                  display: 'block',
                  background: i === 1
                    ? `linear-gradient(135deg, ${C.text} 30%, ${C.blueLight} 100%)`
                    : 'none',
                  WebkitBackgroundClip: i === 1 ? 'text' : 'unset',
                  WebkitTextFillColor: i === 1 ? 'transparent' : 'inherit',
                  backgroundClip: i === 1 ? 'text' : 'unset',
                }}
              >{word}</motion.span>
            ))}
          </h1>

          {/* Body */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.1, ease: LUXURY_EASE }}
            style={{
              fontFamily: 'var(--font-geist-sans)',
              fontSize: 'clamp(15px, 1.4vw, 18px)',
              lineHeight: 1.6,
              color: C.text2,
              maxWidth: 480,
              marginBottom: 40,
              fontWeight: 400,
            }}
          >
            Le journal de trading pensé pour les traders <span style={{ color: C.text, fontStyle: 'italic', fontFamily: 'var(--font-serif)' }}>PropFirm futures</span>. Drawdown trailing, profit split, payouts — tout est tracké automatiquement.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.3, ease: LUXURY_EASE }}
            style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}
          >
            {children}
          </motion.div>
        </div>

        {/* RIGHT : equity curve immersive */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.4, delay: 0.5, ease: LUXURY_EASE }}
          style={{
            position: 'relative',
            aspectRatio: '5 / 4',
            background: 'rgba(20,23,32,0.4)',
            border: `1px solid ${C.border}`,
            borderRadius: 4,
            padding: 24,
            backdropFilter: 'blur(20px)',
            overflow: 'hidden',
          }}
        >
          {/* Metadata header */}
          <div style={{
            position: 'absolute',
            top: 20, left: 24, right: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            zIndex: 2,
            fontFamily: 'var(--font-geist-mono)',
          }}>
            <div>
              <div style={{ fontSize: 9, color: C.text3, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>
                Topstep · 50K Challenge
              </div>
              <div style={{ fontSize: 24, fontWeight: 500, color: C.text, letterSpacing: '-0.02em' }}>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 3.2 }}
                >$60,000</motion.span>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 3.8, ease: LUXURY_EASE }}
              style={{
                padding: '4px 10px',
                borderRadius: 99,
                background: 'rgba(29,184,122,0.10)',
                border: `1px solid rgba(29,184,122,0.4)`,
                color: C.green,
                fontSize: 10,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}>+20.0% YTD</motion.div>
          </div>

          {/* The curve itself */}
          <div style={{ position: 'absolute', inset: '60px 0 0 0' }}>
            <HeroEquityCurve />
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator subtle bottom */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2.5 }}
        style={{
          position: 'absolute',
          bottom: 40,
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'var(--font-geist-mono)',
          fontSize: 10,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: C.text3,
          writingMode: 'horizontal-tb',
        }}
      >
        <motion.span
          animate={{ y: [0, 4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ display: 'inline-block' }}
        >↓  Scroll  ↓</motion.span>
      </motion.div>

      {/* Responsive : sur mobile la grid passe en colonne */}
      <style>{`
        @media (max-width: 900px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  )
}
