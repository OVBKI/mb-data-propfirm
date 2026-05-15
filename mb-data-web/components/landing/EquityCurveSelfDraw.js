'use client'
// SVG equity curve qui se dessine elle-même au scroll avec stroke-dasharray.
// + Points qui apparaissent en cascade après le dessin.
// + Ligne de DD trailing en dessous qui suit.

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const C = {
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#565e78',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
  green: '#1db87a',
  red: '#e8504a',
  surface2: '#1c2030',
  border: 'rgba(255,255,255,0.07)',
}

// Données fictives mais réalistes pour la démo
// Balance qui monte progressivement avec quelques dips
const POINTS = [
  { x: 0, y: 100, label: 'Day 1', balance: 50000 },
  { x: 8, y: 105, label: 'Day 3', balance: 50500 },
  { x: 16, y: 95, label: 'Day 5', balance: 49500 },
  { x: 25, y: 115, label: 'Day 7', balance: 51500 },
  { x: 33, y: 110, label: 'Day 9', balance: 51000 },
  { x: 41, y: 130, label: 'Day 11', balance: 53000 },
  { x: 50, y: 125, label: 'Day 13', balance: 52500 },
  { x: 58, y: 150, label: 'Day 15', balance: 55000 },
  { x: 66, y: 145, label: 'Day 17', balance: 54500 },
  { x: 75, y: 175, label: 'Day 19', balance: 57500 },
  { x: 83, y: 170, label: 'Day 21', balance: 57000 },
  { x: 91, y: 195, label: 'Day 23', balance: 59500 },
  { x: 100, y: 200, label: 'Day 25', balance: 60000 },
]

const VIEW_W = 100
const VIEW_H = 200
// Inversion pour SVG (y haut = 0)
const points = POINTS.map(p => ({ x: p.x, y: VIEW_H - p.y, balance: p.balance }))

// Path balance (courbe lissée Catmull-Rom)
function buildPath(pts) {
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }
  return d
}

const balancePath = buildPath(points)
// Ligne de DD trailing (suit la courbe mais avec offset constant)
const ddPath = buildPath(points.map(p => ({ ...p, y: Math.min(VIEW_H, p.y + 30) })))
// Path closed pour fill area sous la balance
const balanceArea = `${balancePath} L ${points[points.length - 1].x} ${VIEW_H} L ${points[0].x} ${VIEW_H} Z`

export default function EquityCurveSelfDraw() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <div ref={ref} style={{
      background: 'rgba(20,23,32,0.6)',
      border: `1px solid ${C.border}`,
      borderRadius: 18,
      padding: 32,
      backdropFilter: 'blur(20px)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background mesh subtil */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(circle at 20% 50%, ${C.blue}10, transparent 50%),
          radial-gradient(circle at 80% 30%, ${C.green}08, transparent 50%)
        `,
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ position: 'relative', marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            style={{ fontSize: 11, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}
          >📈 Topstep · 50K Challenge</motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ fontSize: 28, fontWeight: 800, color: C.text }}
          >$60,000 <span style={{ fontSize: 14, color: C.green, fontWeight: 600, marginLeft: 8 }}>+$10,000 (+20%)</span></motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.3 }}
          style={{
            padding: '6px 12px',
            borderRadius: 99,
            background: 'rgba(29,184,122,0.12)',
            border: `1px solid ${C.green}`,
            color: C.green,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.5px',
          }}
        >✓ PAYOUT THRESHOLD ATTEINT</motion.div>
      </div>

      {/* SVG */}
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H + 10}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: 280, display: 'block', position: 'relative' }}
      >
        {/* Grid horizontal subtil */}
        {[0, 50, 100, 150, 200].map(y => (
          <line key={y} x1="0" y1={y} x2={VIEW_W} y2={y}
            stroke={C.border} strokeWidth="0.3" strokeDasharray="0.5 0.5" />
        ))}

        {/* Gradient pour l'area */}
        <defs>
          <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.blueLight} stopOpacity="0.4" />
            <stop offset="100%" stopColor={C.blueLight} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="balanceLineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={C.blue} />
            <stop offset="50%" stopColor={C.blueLight} />
            <stop offset="100%" stopColor={C.green} />
          </linearGradient>
        </defs>

        {/* Aire fill sous la courbe (apparait après le dessin) */}
        <motion.path
          d={balanceArea}
          fill="url(#balanceGradient)"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 1, delay: 2 }}
        />

        {/* Ligne DD (drawdown) — pointillée rouge, se dessine en 2ème */}
        <motion.path
          d={ddPath}
          fill="none"
          stroke={C.red}
          strokeWidth="0.6"
          strokeDasharray="2 1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={inView ? { pathLength: 1, opacity: 0.7 } : {}}
          transition={{ duration: 2.5, delay: 0.8, ease: 'easeInOut' }}
        />

        {/* Ligne balance (LA courbe principale qui se dessine) */}
        <motion.path
          d={balancePath}
          fill="none"
          stroke="url(#balanceLineGrad)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: 1 } : {}}
          transition={{ duration: 2.5, delay: 0.5, ease: 'easeInOut' }}
          style={{ filter: 'drop-shadow(0 0 4px rgba(77,143,255,0.5))' }}
        />

        {/* Points sur la courbe qui apparaissent en cascade */}
        {points.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="1.2"
            fill={C.blueLight}
            initial={{ scale: 0, opacity: 0 }}
            animate={inView ? { scale: 1, opacity: 1 } : {}}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 15,
              delay: 0.5 + (i / points.length) * 2.5,
            }}
            style={{ filter: 'drop-shadow(0 0 3px rgba(77,143,255,0.8))' }}
          />
        ))}
      </svg>

      {/* Légende */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5, delay: 3 }}
        style={{
          display: 'flex', gap: 18, marginTop: 16, fontSize: 11,
          color: C.text3, alignItems: 'center', flexWrap: 'wrap',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 16, height: 2, background: `linear-gradient(90deg, ${C.blue}, ${C.green})`, borderRadius: 2 }} />
          Balance live
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 16, height: 1, borderTop: `1.5px dashed ${C.red}` }} />
          DD trailing (EOD)
        </span>
        <span style={{ marginLeft: 'auto', color: C.text2 }}>Mise à jour temps réel à chaque trade</span>
      </motion.div>
    </div>
  )
}
