import React from 'react'
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion'
import { QLogo } from './QLogo'

const C = {
  card: 'rgba(26,31,44,0.72)', card2: 'rgba(32,38,54,0.8)',
  line: 'rgba(255,255,255,0.08)', text: '#f0ede8', text2: '#9aa3bd', text3: '#6b748c',
  blue: '#2d6fff', blueLt: '#4d8fff', green: '#19c37d', red: '#e8504a', amber: '#f5b651',
}
const MONO = 'ui-monospace, "SF Mono", "Roboto Mono", monospace'
const fmt = n => Math.round(n).toLocaleString('fr-FR')

const rise = (frame, fps, delay) => {
  const s = spring({ frame: frame - delay, fps, config: { damping: 200 } })
  return { opacity: interpolate(s, [0, 1], [0, 1]), transform: `translateY(${interpolate(s, [0, 1], [26, 0])}px)` }
}

const FIRMS = [
  { n: 'Topstep', l: 'T', c: '#e8b34a', net: '+6 305 €', up: true },
  { n: 'Apex', l: 'A', c: '#5b8def', net: '+3 330 €', up: true },
  { n: 'MyFundedFutures', l: 'M', c: '#a06bff', net: '+2 235 €', up: true },
  { n: 'Bulenox', l: 'B', c: '#27c2a0', net: '-360 €', up: false },
]
const EQ = [40, 44, 42, 50, 48, 56, 60, 58, 66, 72, 70, 78, 84, 82, 90, 96, 94, 104, 112, 120]

export const Dashboard = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const net = interpolate(frame, [10, 55], [0, 48320], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const win = interpolate(frame, [18, 60], [0, 68.4], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const pay = interpolate(frame, [22, 64], [0, 11400], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const w = 1500, h = 838
  const eqW = 1260, eqH = 150
  const min = Math.min(...EQ), max = Math.max(...EQ), rng = max - min
  const pts = EQ.map((d, i) => [(i / (EQ.length - 1)) * eqW, eqH - ((d - min) / rng) * (eqH - 14) - 7])
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')
  const drawP = interpolate(frame, [40, 110], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const KPI = [
    { label: 'NET CONSOLIDÉ · 6 COMPTES', value: '+' + fmt(net) + ' €', color: C.green, d: 6 },
    { label: 'COMPTES FUNDED', value: '3 / 5', color: C.blueLt, d: 12 },
    { label: 'WIN RATE', value: win.toFixed(1).replace('.', ',') + ' %', color: C.blueLt, d: 18 },
    { label: 'PAYOUTS ENCAISSÉS', value: fmt(pay) + ' €', color: C.green, d: 24 },
  ]

  return (
    <div style={{
      width: w, height: h, borderRadius: 22, overflow: 'hidden',
      background: 'linear-gradient(160deg, rgba(16,20,30,0.96), rgba(10,13,20,0.98))',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 60px 140px -40px rgba(0,0,0,0.8), 0 0 0 1px rgba(45,111,255,0.1), 0 0 120px -40px rgba(45,111,255,0.4)',
      display: 'flex', fontFamily: 'system-ui, sans-serif',
    }}>
      {/* sidebar rail */}
      <div style={{ width: 78, background: 'rgba(8,10,15,0.7)', borderRight: '1px solid ' + C.line, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px 0', gap: 10 }}>
        <QLogo size={30} color={C.blueLt} />
        <div style={{ height: 14 }} />
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{ width: 44, height: 44, borderRadius: 12, background: i === 0 ? 'linear-gradient(135deg,' + C.blue + ',' + C.blueLt + ')' : 'rgba(255,255,255,0.04)' }} />
        ))}
      </div>
      {/* main */}
      <div style={{ flex: 1, padding: '26px 30px' }}>
        {/* header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, ...rise(frame, fps, 0) }}>
          <div>
            <div style={{ fontSize: 13, letterSpacing: 3, color: C.blueLt, fontWeight: 700 }}>TABLEAU DE BORD</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: C.text, marginTop: 6, letterSpacing: -0.5 }}>Bonjour, Alex</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ padding: '9px 16px', borderRadius: 10, border: '1px solid ' + C.line, color: C.text2, fontSize: 14, fontFamily: MONO }}>USD / EUR</div>
            <div style={{ padding: '11px 20px', borderRadius: 10, background: 'linear-gradient(135deg,' + C.blue + ',' + C.blueLt + ')', color: '#fff', fontSize: 15, fontWeight: 700 }}>+ Ajouter une PropFirm</div>
          </div>
        </div>
        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 18 }}>
          {KPI.map((k, i) => (
            <div key={i} style={{ background: C.card, border: '1px solid ' + C.line, borderRadius: 16, padding: '18px 20px', ...rise(frame, fps, k.d) }}>
              <div style={{ fontSize: 11.5, color: C.text3, fontWeight: 700, letterSpacing: 1.4 }}>{k.label}</div>
              <div style={{ fontSize: 30, fontWeight: 800, color: k.color, marginTop: 12, fontFamily: MONO, letterSpacing: -1 }}>{k.value}</div>
            </div>
          ))}
        </div>
        {/* equity card */}
        <div style={{ background: C.card, border: '1px solid ' + C.line, borderRadius: 18, padding: '20px 22px', marginBottom: 18, ...rise(frame, fps, 30) }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Courbe d’équité</div>
            <div style={{ fontSize: 13, color: C.green, fontFamily: MONO, fontWeight: 700 }}>▲ +12,4 % ce mois</div>
          </div>
          <svg width={eqW} height={eqH} viewBox={`0 0 ${eqW} ${eqH}`} style={{ width: '100%', height: eqH }}>
            <defs>
              <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.blue} stopOpacity="0.35" /><stop offset="100%" stopColor={C.blue} stopOpacity="0" /></linearGradient>
              <linearGradient id="el" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={C.blueLt} /><stop offset="100%" stopColor={C.green} /></linearGradient>
            </defs>
            <path d={`${line} L${eqW} ${eqH} L0 ${eqH} Z`} fill="url(#eg)" opacity={interpolate(frame, [55, 95], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} />
            <path d={line} fill="none" stroke="url(#el)" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - drawP} />
          </svg>
        </div>
        {/* firm row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          {FIRMS.map((f, i) => (
            <div key={i} style={{ background: C.card, border: '1px solid ' + C.line, borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, ...rise(frame, fps, 70 + i * 6) }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: f.c + '2e', color: f.c, fontWeight: 800, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{f.l}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.n}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: f.up ? C.green : C.red, fontFamily: MONO, marginTop: 2 }}>{f.net}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
