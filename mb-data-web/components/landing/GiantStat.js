'use client'
// Stat unique en pleine page — typography énorme, asymmetric placement.
// Pas de "grid de 4 KPIs" générique. Une stat impactante par bloc.

import { motion, useInView } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'

const C = {
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#565e78',
  blueLight: '#4d8fff',
  green: '#1db87a',
}

const LUXURY_EASE = [0.16, 1, 0.3, 1]

// Animated number counter
function AnimatedNumber({ value, suffix = '', prefix = '', duration = 2 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    const start = Date.now()
    const numericValue = parseFloat(value) || 0
    const tick = () => {
      const elapsed = (Date.now() - start) / 1000
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(numericValue * eased)
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [inView, value, duration])

  return (
    <span ref={ref}>
      {prefix}{Math.floor(display).toLocaleString('fr-FR')}{suffix}
    </span>
  )
}

export default function GiantStat({ value, label, sublabel, align = 'left', accent = 'blue' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const accentColor = accent === 'green' ? C.green : C.blueLight

  // Parse value to detect if it's a number or string
  const isNumeric = typeof value === 'number' || (typeof value === 'string' && /^[\d.,]+/.test(value))

  return (
    <section ref={ref} style={{
      padding: 'clamp(80px, 14vh, 160px) clamp(24px, 6vw, 96px)',
      maxWidth: 1400,
      margin: '0 auto',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start',
        textAlign: align,
      }}>
        <div style={{ maxWidth: 900 }}>
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, x: align === 'right' ? 20 : -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: LUXURY_EASE }}
            style={{
              fontFamily: 'var(--font-geist-mono)',
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: C.text3,
              marginBottom: 28,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
            }}
          >
            {align !== 'right' && <span style={{ width: 28, height: 1, background: accentColor, opacity: 0.6 }} />}
            <span>{label}</span>
            {align === 'right' && <span style={{ width: 28, height: 1, background: accentColor, opacity: 0.6 }} />}
          </motion.div>

          {/* Giant number */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1.2, delay: 0.15, ease: LUXURY_EASE }}
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 'clamp(72px, 13vw, 180px)',
              lineHeight: 0.9,
              letterSpacing: '-0.04em',
              color: C.text,
              marginBottom: 24,
            }}
          >
            {isNumeric && typeof value === 'string' && /^\d/.test(value) ? (
              // Détecte les chiffres et anime le compteur
              (() => {
                const match = value.match(/^([\d.,]+)(.*)$/)
                const num = match ? match[1].replace(/[.,]/g, '') : value
                const suffix = match ? match[2] : ''
                return <><AnimatedNumber value={Number(num)} suffix={suffix} duration={2} /></>
              })()
            ) : value}
          </motion.div>

          {/* Sublabel */}
          {sublabel && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1, delay: 0.4, ease: LUXURY_EASE }}
              style={{
                fontFamily: 'var(--font-geist)',
                fontSize: 'clamp(16px, 1.4vw, 20px)',
                lineHeight: 1.5,
                color: C.text2,
                maxWidth: 540,
                marginLeft: align === 'right' ? 'auto' : 0,
                marginRight: align === 'center' ? 'auto' : 0,
              }}
            >
              {sublabel}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  )
}
