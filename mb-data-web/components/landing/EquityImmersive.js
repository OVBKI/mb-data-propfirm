'use client'
// Section signature : equity curve immersive, full-bleed, qui se dessine au scroll.
// Le "memorable moment" du site — un seul truc, fait parfaitement.

import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { useRef } from 'react'

const C = {
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#565e78',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
  green: '#1db87a',
  red: '#e8504a',
  border: 'rgba(255,255,255,0.06)',
}

const LUXURY_EASE = [0.16, 1, 0.3, 1]

// Points data réalistes (challenge → financé → payouts)
const PTS = [
  [0, 70], [4, 68], [8, 72], [12, 65], [16, 60], [20, 62],
  [24, 55], [28, 50], [32, 52], [36, 42], [40, 38], [44, 30], [48, 25],
  [52, 28], [56, 22], [60, 18], [64, 22], [68, 15], [72, 12], [76, 14],
  [80, 8], [84, 10], [88, 5], [92, 8], [96, 4], [100, 2],
]
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

export default function EquityImmersive() {
  const sectionRef = useRef(null)
  const svgRef = useRef(null)
  const inView = useInView(sectionRef, { once: true, margin: '-150px' })

  // Scroll-linked progress pour dessiner la courbe au fur et à mesure du scroll
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end center'],
  })
  const pathLength = useTransform(scrollYProgress, [0.1, 0.9], [0, 1])

  const path = smoothPath(PTS)
  const ddPath = smoothPath(PTS.map(([x, y]) => [x, Math.min(98, y + 18)]))
  const areaPath = `${path} L 100 100 L 0 100 Z`

  return (
    <section ref={sectionRef} style={{
      padding: 'clamp(80px, 14vh, 160px) clamp(24px, 6vw, 96px)',
      maxWidth: 1400,
      margin: '0 auto',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 60 }}>
        {/* Heading row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          alignItems: 'end',
          gap: 60,
          rowGap: 30,
        }}
        className="equity-heading"
        >
          <div>
            <motion.div
              initial={{ opacity: 0, x: -12 }}
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
              }}
            >
              <span style={{ width: 28, height: 1, background: C.blueLight, opacity: 0.6 }} />
              <span>Live equity tracking</span>
            </motion.div>
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 'clamp(44px, 7vw, 92px)',
              lineHeight: 0.95,
              letterSpacing: '-0.04em',
              color: C.text,
              maxWidth: 600,
            }}>
              Chaque trade, dessiné.
            </h2>
          </div>
          <div style={{ maxWidth: 380 }}>
            <p style={{
              fontFamily: 'var(--font-geist-sans)',
              fontSize: 'clamp(15px, 1.3vw, 17px)',
              color: C.text2,
              lineHeight: 1.7,
            }}>
              Ligne de balance et drawdown trailing mis à jour à chaque trade enregistré. Le DD s'adapte automatiquement aux règles de ta firme — <em style={{ fontFamily: 'var(--font-serif)', color: C.text }}>Static, End of Day, ou Intraday Trailing</em>.
            </p>
          </div>
        </div>

        {/* The chart itself — pleine largeur, sobre */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.2, delay: 0.2, ease: LUXURY_EASE }}
          style={{
            position: 'relative',
            background: 'rgba(20,23,32,0.4)',
            border: `1px solid ${C.border}`,
            borderRadius: 4,
            padding: 'clamp(24px, 4vw, 48px)',
            backdropFilter: 'blur(20px)',
            overflow: 'hidden',
          }}
        >
          {/* Header data row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 32,
            flexWrap: 'wrap',
            gap: 20,
          }}>
            <div>
              <div style={{
                fontFamily: 'var(--font-geist-mono)',
                fontSize: 10,
                color: C.text3,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}>Lucid Trading · 50K · Financé</div>
              <div style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: 'clamp(36px, 5vw, 56px)',
                fontWeight: 400,
                letterSpacing: '-0.03em',
                color: C.text,
                lineHeight: 1,
              }}>$57,500</div>
              <div style={{
                fontFamily: 'var(--font-geist-mono)',
                fontSize: 13,
                color: C.green,
                marginTop: 6,
              }}>+$7,500 · +15.0%</div>
            </div>
            <div style={{
              display: 'flex', gap: 32,
              fontFamily: 'var(--font-geist-mono)',
              fontSize: 11,
              color: C.text3,
            }}>
              <div>
                <div style={{ letterSpacing: '0.1em', marginBottom: 4 }}>DD MAX</div>
                <div style={{ color: C.text, fontSize: 14 }}>$2,000</div>
              </div>
              <div>
                <div style={{ letterSpacing: '0.1em', marginBottom: 4 }}>TYPE</div>
                <div style={{ color: C.text, fontSize: 14 }}>EOD</div>
              </div>
              <div>
                <div style={{ letterSpacing: '0.1em', marginBottom: 4 }}>JOURS</div>
                <div style={{ color: C.text, fontSize: 14 }}>12 / 5</div>
              </div>
            </div>
          </div>

          {/* SVG */}
          <svg
            ref={svgRef}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ width: '100%', height: 'clamp(280px, 40vh, 480px)', display: 'block' }}
          >
            <defs>
              <linearGradient id="immersiveLineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={C.blue} stopOpacity="0.7" />
                <stop offset="50%" stopColor={C.blueLight} />
                <stop offset="100%" stopColor={C.green} />
              </linearGradient>
              <linearGradient id="immersiveAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.blueLight} stopOpacity="0.18" />
                <stop offset="100%" stopColor={C.blueLight} stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Grid horizontal */}
            {[20, 40, 60, 80].map(y => (
              <line key={y} x1="0" y1={y} x2="100" y2={y}
                stroke="rgba(255,255,255,0.04)" strokeWidth="0.15" />
            ))}

            {/* Area fill — apparait après que la ligne soit dessinée */}
            <motion.path
              d={areaPath}
              fill="url(#immersiveAreaGrad)"
              style={{ pathLength }}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 1, delay: 1, ease: LUXURY_EASE }}
            />

            {/* DD line (pointillée rouge subtile) */}
            <motion.path
              d={ddPath}
              fill="none"
              stroke={C.red}
              strokeWidth="0.4"
              strokeDasharray="1.5 1"
              style={{ pathLength, opacity: useTransform(pathLength, [0.5, 1], [0, 0.5]) }}
            />

            {/* Main line — scroll-linked path drawing */}
            <motion.path
              d={path}
              fill="none"
              stroke="url(#immersiveLineGrad)"
              strokeWidth="0.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ pathLength, filter: 'drop-shadow(0 0 3px rgba(77,143,255,0.5))' }}
            />

            {/* Point final */}
            <motion.circle
              cx={PTS[PTS.length - 1][0]}
              cy={PTS[PTS.length - 1][1]}
              r="0.9"
              fill={C.green}
              style={{ opacity: useTransform(pathLength, [0.95, 1], [0, 1]) }}
            />
          </svg>

          {/* Légende */}
          <div style={{
            display: 'flex',
            gap: 24,
            marginTop: 28,
            flexWrap: 'wrap',
            fontFamily: 'var(--font-geist-mono)',
            fontSize: 10,
            letterSpacing: '0.1em',
            color: C.text3,
            textTransform: 'uppercase',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 14, height: 1.5, background: `linear-gradient(90deg, ${C.blue}, ${C.green})` }} />
              Balance
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 14, borderTop: `1px dashed ${C.red}`, height: 0 }} />
              Drawdown
            </span>
          </div>
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .equity-heading {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  )
}
