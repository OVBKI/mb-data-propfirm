'use client'
// Stats avec compteurs qui s'animent au scroll into view.
// Préserve le design existant (gradient text, layout 4 colonnes).

import { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'

const C = {
  surface: '#141720',
  text: '#f0ede8',
  text3: '#565e78',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
}

// Easing cubic out — smooth pro
const easeOutCubic = t => 1 - Math.pow(1 - t, 3)

function StatItem({ stat, index }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  const [display, setDisplay] = useState(stat.v)

  useEffect(() => {
    if (!inView) return
    // Détecte si le stat est numérique (peut être animé) ou non (∞, 100%)
    const numericMatch = String(stat.v).match(/^(\d+)/)
    if (!numericMatch) {
      setDisplay(stat.v)
      return
    }
    const targetNum = parseInt(numericMatch[1], 10)
    const suffix = String(stat.v).slice(numericMatch[1].length) // ex: "+" pour "10+"
    const duration = 1500
    const start = Date.now()
    let rafId
    function tick() {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeOutCubic(progress)
      const current = Math.floor(targetNum * eased)
      setDisplay(`${current}${suffix}`)
      if (progress < 1) rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => rafId && cancelAnimationFrame(rafId)
  }, [inView, stat.v])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      style={{ textAlign: 'center' }}
    >
      <div style={{
        fontSize: 'clamp(28px, 4vw, 42px)',
        fontWeight: 800,
        background: `linear-gradient(135deg, ${C.blue}, ${C.blueLight})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        marginBottom: 6,
        letterSpacing: '-0.02em',
        fontVariantNumeric: 'tabular-nums', // chiffres de même largeur (évite le saut)
      }}>{display}</div>
      <div style={{
        fontSize: 12, color: C.text3,
        textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600,
      }}>
        {stat.l}
      </div>
    </motion.div>
  )
}

export default function AnimatedStats({ stats }) {
  return (
    <section style={{
      padding: '60px 24px',
      position: 'relative',
      background: `linear-gradient(180deg, transparent, ${C.surface}40, transparent)`,
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 24,
      }}>
        {stats.map((s, i) => (
          <StatItem key={i} stat={s} index={i} />
        ))}
      </div>
    </section>
  )
}
