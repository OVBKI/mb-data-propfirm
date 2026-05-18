'use client'
// Grille de cards features qui se révèlent au scroll avec un flip 3D + hover tilt.
// Utilise framer-motion + IntersectionObserver pour les triggers de scroll.

import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

const C = {
  surface: '#141720',
  surface2: '#1c2030',
  border: 'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.13)',
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#565e78',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
}

function FeatureCard({ feature, index }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [spotlight, setSpotlight] = useState({ x: -200, y: -200, active: false })

  function onMove(e) {
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: y * -8, y: x * 8 }) // inversion intentionnelle pour effet naturel
    // Spotlight position en pixels (pas normalisée) pour radial-gradient
    setSpotlight({ x: e.clientX - rect.left, y: e.clientY - rect.top, active: true })
  }
  function onLeave() {
    setTilt({ x: 0, y: 0 })
    setSpotlight(prev => ({ ...prev, active: false }))
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60, rotateX: -20 }}
      animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
      transition={{
        type: 'spring',
        stiffness: 90,
        damping: 18,
        delay: (index % 3) * 0.1,
      }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: 28,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
    >
      <motion.div
        animate={{ rotateX: tilt.x, rotateY: tilt.y }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Halo blob qui suit la souris (visuel uniquement) */}
        <div style={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          background: `radial-gradient(circle, ${C.blue}20, transparent 70%)`,
          filter: 'blur(40px)',
          opacity: 0.6,
          pointerEvents: 'none',
        }} />

        {/* SPOTLIGHT — curseur lumineux qui suit la souris dans la card (effet premium) */}
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: spotlight.active ? 1 : 0,
          transition: 'opacity 0.4s cubic-bezier(0.16,1,0.3,1)',
          background: `radial-gradient(280px circle at ${spotlight.x}px ${spotlight.y}px, ${C.blueLight}25, transparent 60%)`,
          pointerEvents: 'none',
          borderRadius: 16,
        }} />

        {/* Border glow accent qui apparait au hover */}
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: spotlight.active ? 1 : 0,
          transition: 'opacity 0.4s cubic-bezier(0.16,1,0.3,1)',
          borderRadius: 16,
          padding: 1,
          background: `radial-gradient(280px circle at ${spotlight.x}px ${spotlight.y}px, ${C.blueLight}60, transparent 50%)`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          pointerEvents: 'none',
        }} />

        {/* Icon avec un fond gradient subtle */}
        <div style={{
          width: 56, height: 56,
          borderRadius: 14,
          background: `linear-gradient(135deg, ${C.surface2}, ${C.surface})`,
          border: `1px solid ${C.border2}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          marginBottom: 20,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
        }}>{feature.icon}</div>

        <h3 style={{
          fontSize: 17,
          fontWeight: 700,
          marginBottom: 10,
          color: C.text,
          letterSpacing: '-0.01em',
        }}>{feature.title}</h3>

        <p style={{
          fontSize: 13,
          color: C.text2,
          lineHeight: 1.65,
        }}>{feature.desc}</p>

        {/* Ligne lumineuse en bas qui se révèle */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.8, delay: (index % 3) * 0.1 + 0.4 }}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 28,
            right: 28,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${C.blueLight}, transparent)`,
            transformOrigin: 'left',
          }}
        />
      </motion.div>
    </motion.div>
  )
}

export default function FlipFeatureCards({ features }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: 18,
    }}>
      {features.map((f, i) => (
        <FeatureCard key={f.title} feature={f} index={i} />
      ))}
    </div>
  )
}
