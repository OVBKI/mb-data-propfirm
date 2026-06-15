// ClickfundedBg — fond animé Remotion pour /landing/clickfunded.
// Noir + ambre : étoiles filantes le long de courbes chaotiques (la ligne n'apparaît
// que sur le passage du glow), particules scintillantes, halos qui respirent.
// Conçu pour BOUCLER : toutes les périodes divisent durationInFrames (300).

import React from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'

const W = 1440
const H = 900

const LINES = [
  { d: 'M-60 240 C 280 90, 520 380, 780 250 C 1000 140, 1220 360, 1520 230', cycle: 300, phase: 0.0 },
  { d: 'M-60 640 C 220 760, 500 520, 760 660 C 1010 790, 1240 560, 1520 700', cycle: 150, phase: 0.35 },
  { d: 'M260 -60 C 380 240, 240 470, 520 600 C 700 700, 760 920, 900 1000', cycle: 300, phase: 0.6 },
  { d: 'M1240 -60 C 1080 240, 1220 470, 940 600 C 760 700, 700 900, 560 1000', cycle: 150, phase: 0.15 },
  { d: 'M-60 440 C 320 360, 600 560, 900 440 C 1160 340, 1320 520, 1520 440', cycle: 100, phase: 0.8 },
  { d: 'M120 980 C 340 740, 240 520, 540 420 C 820 330, 980 160, 1180 -40', cycle: 300, phase: 0.45 },
]

const PARTS = Array.from({ length: 60 }, (_, i) => ({
  x: (i * 97 + 13) % 100,
  y: (i * 53 + 7) % 100,
  s: 1.4 + (i % 3) * 1.1,
  cycle: [60, 75, 100, 150][i % 4],
  phase: ((i * 7) % 10) / 10,
  gold: i % 3 === 0,
}))

const DASH = 16
const GAP = 200
const PATTERN = DASH + GAP

export const ClickfundedBg = () => {
  const frame = useCurrentFrame()

  const breathe = (period, lo, hi, ph = 0) => {
    const t = 0.5 + 0.5 * Math.sin(2 * Math.PI * ((frame / period) + ph))
    return lo + (hi - lo) * t
  }

  return (
    <AbsoluteFill style={{ background: '#050505' }}>
      <div style={{ position: 'absolute', left: '50%', top: -220, width: 760, height: 520, transform: 'translateX(-50%)', borderRadius: '50%', filter: 'blur(120px)', background: 'radial-gradient(ellipse at center, rgba(239,154,58,.20), transparent 70%)', opacity: breathe(150, 0.6, 1) }} />
      <div style={{ position: 'absolute', left: '50%', top: '44%', width: 640, height: 440, transform: 'translateX(-50%)', borderRadius: '50%', filter: 'blur(130px)', background: 'radial-gradient(ellipse at center, rgba(239,154,58,.09), transparent 70%)', opacity: breathe(150, 0.5, 0.9, 0.5) }} />

      <AbsoluteFill>
        {PARTS.map((p, i) => {
          const op = breathe(p.cycle, 0.08, 0.9, p.phase)
          const sc = breathe(p.cycle, 0.7, 1.2, p.phase)
          return (
            <div key={i} style={{
              position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
              width: p.s, height: p.s, borderRadius: '50%',
              background: p.gold ? 'rgba(247,189,102,0.95)' : 'rgba(255,255,255,0.8)',
              boxShadow: p.gold ? '0 0 8px rgba(247,189,102,0.8)' : '0 0 6px rgba(255,255,255,0.6)',
              opacity: op, transform: `scale(${sc})`,
            }} />
          )
        })}
      </AbsoluteFill>

      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <defs>
          <filter id="cfSoft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3.4" /></filter>
        </defs>
        {LINES.map((ln, i) => {
          const prog = ((((frame / ln.cycle) + ln.phase) % 1) + 1) % 1
          const dashoffset = PATTERN - prog * PATTERN
          return (
            <g key={i}>
              <path d={ln.d} pathLength={100} fill="none" strokeLinecap="round" strokeDashoffset={dashoffset} strokeDasharray={`${DASH} ${GAP}`} stroke="rgba(247,189,102,0.55)" strokeWidth={3.4} filter="url(#cfSoft)" />
              <path d={ln.d} pathLength={100} fill="none" strokeLinecap="round" strokeDashoffset={dashoffset} strokeDasharray={`${DASH * 0.6} ${PATTERN - DASH * 0.6}`} stroke="#ffe9c2" strokeWidth={1.4} />
            </g>
          )
        })}
      </svg>

      <AbsoluteFill style={{ background: 'radial-gradient(120% 80% at 50% 0%, transparent 45%, rgba(0,0,0,.5) 100%)' }} />
    </AbsoluteFill>
  )
}
