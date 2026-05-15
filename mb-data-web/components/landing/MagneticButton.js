'use client'
// Bouton avec effet magnétique : se déplace légèrement vers la souris quand elle s'approche.
// + Ripple effect au clic.
// + Glow qui pulse en idle.

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useClickSound } from './useClickSound'

const C = {
  text: '#f0ede8',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
  border2: 'rgba(255,255,255,0.13)',
}

export default function MagneticButton({
  href, children, primary = false, large = false, target,
}) {
  const ref = useRef(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [ripples, setRipples] = useState([])
  // Sound : pop subtle au clic (frequency selon primary/secondary pour différencier)
  const playPop = useClickSound({ frequency: primary ? 720 : 540, volume: 0.06 })

  useEffect(() => {
    function onMove(e) {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      const maxDist = 80 // rayon d'activation magnétique
      if (dist < maxDist) {
        const strength = (1 - dist / maxDist) * 0.4 // 40% de la distance souris→centre
        setOffset({ x: dx * strength, y: dy * strength })
      } else {
        setOffset({ x: 0, y: 0 })
      }
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  function onClick(e) {
    if (!ref.current) return
    // Sound effect (subtle pop)
    playPop()
    const rect = ref.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now() + Math.random()
    setRipples(prev => [...prev, { id, x, y }])
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 700)
  }

  const padding = large ? '15px 30px' : '11px 22px'
  const fontSize = large ? 14 : 12.5
  const radius = 10 // square-ish, pas de pill — moins AI-default

  // Primary : INVERSÉ (off-white sur fond sombre) — plus premium, casse le pattern AI "blue gradient pill"
  const primaryStyle = {
    background: C.text, // #f0ede8 (off-white)
    color: '#0a0c10',
    border: '1px solid transparent',
    boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 8px 24px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.2)',
  }
  // Secondary : ghost subtle avec border 0.5px
  const secondaryStyle = {
    background: 'rgba(255,255,255,0.025)',
    color: C.text,
    border: '0.5px solid rgba(255,255,255,0.18)',
    backdropFilter: 'blur(12px)',
    boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset',
  }

  const Wrapper = href ? Link : 'button'
  const wrapperProps = href ? { href, target } : { onClick }

  return (
    <motion.div
      animate={{ x: offset.x, y: offset.y }}
      transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      style={{ display: 'inline-block' }}
    >
      <Wrapper
        ref={ref}
        {...wrapperProps}
        onClick={(e) => { onClick(e); wrapperProps.onClick?.(e) }}
        className="qt-mag-btn"
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          padding,
          fontSize,
          fontWeight: 500,
          letterSpacing: '0.005em',
          borderRadius: radius,
          cursor: 'pointer',
          fontFamily: 'inherit',
          textDecoration: 'none',
          overflow: 'hidden',
          transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s, background 0.25s',
          ...(primary ? primaryStyle : secondaryStyle),
        }}
      >
        {/* Subtle highlight top — mimétisme matière (premium feel) */}
        {primary && (
          <span style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: '50%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.5), transparent)',
            opacity: 0.35,
            borderRadius: `${radius}px ${radius}px 0 0`,
            pointerEvents: 'none',
            zIndex: 0,
          }} />
        )}
        {/* Ripples au clic */}
        {ripples.map(r => (
          <span
            key={r.id}
            style={{
              position: 'absolute',
              left: r.x,
              top: r.y,
              width: 0,
              height: 0,
              borderRadius: '50%',
              background: primary ? 'rgba(45,111,255,0.5)' : 'rgba(77,143,255,0.4)',
              transform: 'translate(-50%, -50%)',
              animation: 'qtRipple 0.7s ease-out',
              pointerEvents: 'none',
            }}
          />
        ))}
        <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
        {/* Arrow qui glisse au hover (plus lisible qu'un emoji) */}
        <span className="qt-mag-arrow" style={{
          position: 'relative',
          zIndex: 1,
          display: 'inline-block',
          transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1)',
          fontFamily: 'monospace',
          fontWeight: 400,
          fontSize: fontSize - 1,
          opacity: 0.85,
        }}>→</span>
      </Wrapper>
      <style>{`
        @keyframes qtRipple {
          0% { width: 0; height: 0; opacity: 0.5; }
          100% { width: 400px; height: 400px; opacity: 0; }
        }
        .qt-mag-btn:hover { transform: translateY(-1px); }
        .qt-mag-btn:hover .qt-mag-arrow { transform: translateX(3px); }
        .qt-mag-btn:active { transform: translateY(0); }
      `}</style>
    </motion.div>
  )
}
