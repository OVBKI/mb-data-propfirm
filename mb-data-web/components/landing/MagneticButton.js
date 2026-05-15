'use client'
// Bouton avec effet magnétique : se déplace légèrement vers la souris quand elle s'approche.
// + Ripple effect au clic.
// + Glow qui pulse en idle.

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

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
    const rect = ref.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now() + Math.random()
    setRipples(prev => [...prev, { id, x, y }])
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 700)
  }

  const padding = large ? '16px 36px' : '11px 22px'
  const fontSize = large ? 16 : 13

  const primaryStyle = {
    background: `linear-gradient(135deg, ${C.blue} 0%, ${C.blueLight} 100%)`,
    color: '#fff',
    boxShadow: '0 8px 24px rgba(45,111,255,0.4), 0 0 0 1px rgba(77,143,255,0.3)',
  }
  const secondaryStyle = {
    background: 'rgba(255,255,255,0.04)',
    color: C.text,
    border: `1px solid ${C.border2}`,
    backdropFilter: 'blur(10px)',
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
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding,
          fontSize,
          fontWeight: 600,
          borderRadius: 99,
          cursor: 'pointer',
          fontFamily: 'inherit',
          textDecoration: 'none',
          overflow: 'hidden',
          transition: 'box-shadow 0.2s',
          ...(primary ? primaryStyle : secondaryStyle),
        }}
      >
        {/* Glow pulse en arrière-plan pour bouton primaire */}
        {primary && (
          <motion.div
            animate={{
              opacity: [0.4, 0.7, 0.4],
              scale: [1, 1.03, 1],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              inset: -2,
              background: `linear-gradient(135deg, ${C.blue}, ${C.blueLight}, ${C.blue})`,
              filter: 'blur(8px)',
              zIndex: -1,
              borderRadius: 99,
            }}
          />
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
              background: primary ? 'rgba(255,255,255,0.4)' : 'rgba(77,143,255,0.3)',
              transform: 'translate(-50%, -50%)',
              animation: 'qtRipple 0.7s ease-out',
              pointerEvents: 'none',
            }}
          />
        ))}
        <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
      </Wrapper>
      <style>{`
        @keyframes qtRipple {
          0% { width: 0; height: 0; opacity: 0.6; }
          100% { width: 400px; height: 400px; opacity: 0; }
        }
      `}</style>
    </motion.div>
  )
}
