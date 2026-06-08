import React from 'react'
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'
import { QLogo } from './components/QLogo'
import { Dashboard } from './components/Dashboard'

const BG = '#070a10'
const T = '#f3f1ec', T2 = '#9aa3bd', BLUE = '#2d6fff', BLUELT = '#4d8fff', GREEN = '#19c37d'
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

// ---------- shared animated background ----------
const Background = () => {
  const frame = useCurrentFrame()
  const dots = Array.from({ length: 46 }, (_, i) => {
    const seed = (i * 9301 + 49297) % 233280 / 233280
    const seed2 = (i * 4099 + 7919) % 233280 / 233280
    const x = seed * 1920
    const y = (seed2 * 1080 + frame * (0.2 + seed * 0.5)) % 1080
    const s = 1 + seed2 * 2.4
    const o = 0.12 + seed * 0.3
    return { x, y, s, o, c: seed > 0.7 ? GREEN : BLUELT }
  })
  return (
    <AbsoluteFill style={{ background: `radial-gradient(1200px 700px at 80% -10%, rgba(45,111,255,0.16), transparent 60%), radial-gradient(900px 650px at 0% 30%, rgba(25,195,125,0.10), transparent 60%), ${BG}` }}>
      {dots.map((d, i) => (
        <div key={i} style={{ position: 'absolute', left: d.x, top: d.y, width: d.s, height: d.s, borderRadius: '50%', background: d.c, opacity: d.o, boxShadow: `0 0 ${d.s * 3}px ${d.c}` }} />
      ))}
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(7,10,16,0.6) 100%)' }} />
    </AbsoluteFill>
  )
}

const sceneFade = (frame, dur) =>
  Math.min(interpolate(frame, [0, 14], [0, 1], { extrapolateRight: 'clamp' }), interpolate(frame, [dur - 14, dur], [1, 0], { extrapolateLeft: 'clamp' }))

// ---------- Scene 1 : Intro ----------
const Intro = () => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig()
  const s = spring({ frame, fps, config: { damping: 14, mass: 0.8 } })
  const sc = interpolate(s, [0, 1], [0.4, 1])
  const wordO = interpolate(frame, [22, 40], [0, 1], { extrapolateRight: 'clamp' })
  const subO = interpolate(frame, [38, 56], [0, 1], { extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: sceneFade(frame, 80), fontFamily: FONT }}>
      <div style={{ transform: `scale(${sc})` }}><QLogo size={210} color={BLUELT} glow={interpolate(frame, [0, 30], [0, 60], { extrapolateRight: 'clamp' })} /></div>
      <div style={{ fontSize: 78, fontWeight: 800, color: T, letterSpacing: 14, marginTop: 24, opacity: wordO, transform: `translateY(${interpolate(wordO, [0, 1], [16, 0])}px)` }}>QUANTARA</div>
      <div style={{ fontSize: 22, fontWeight: 600, color: T2, letterSpacing: 8, marginTop: 14, opacity: subO }}>TRACK · ANALYZE · GROW</div>
    </AbsoluteFill>
  )
}

// ---------- Scene 2 : Pitch ----------
const Pitch = () => {
  const frame = useCurrentFrame()
  const l1 = interpolate(frame, [4, 22], [0, 1], { extrapolateRight: 'clamp' })
  const l2 = interpolate(frame, [16, 36], [0, 1], { extrapolateRight: 'clamp' })
  const sub = interpolate(frame, [34, 54], [0, 1], { extrapolateRight: 'clamp' })
  const up = v => `translateY(${interpolate(v, [0, 1], [40, 0])}px)`
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', opacity: sceneFade(frame, 110), fontFamily: FONT, padding: '0 160px' }}>
      <div style={{ fontSize: 84, fontWeight: 800, color: T, letterSpacing: -2, lineHeight: 1.05, opacity: l1, transform: up(l1) }}>Tous tes comptes PropFirm.</div>
      <div style={{ fontSize: 84, fontWeight: 800, letterSpacing: -2, lineHeight: 1.1, opacity: l2, transform: up(l2), background: `linear-gradient(120deg, ${BLUELT}, ${GREEN})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginTop: 6 }}>Un seul tableau de bord.</div>
      <div style={{ fontSize: 27, color: T2, marginTop: 34, lineHeight: 1.5, maxWidth: 1080, opacity: sub }}>Challenges, comptes funded, payouts et dépenses — réunis, calculés, et clairs. Le journal de trading pensé pour les prop traders.</div>
    </AbsoluteFill>
  )
}

// ---------- Scene 3 : Dashboard ----------
const DashScene = () => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig()
  const s = spring({ frame: frame - 6, fps, config: { damping: 200 } })
  const sc = interpolate(s, [0, 1], [0.92, 1])
  const head = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: sceneFade(frame, 330), fontFamily: FONT }}>
      <div style={{ fontSize: 36, fontWeight: 800, color: T, marginBottom: 22, letterSpacing: -0.5, opacity: head, transform: `translateY(${interpolate(head, [0, 1], [-14, 0])}px)` }}>
        Ton trading prop, <span style={{ color: BLUELT }}>en un coup d’œil</span>
      </div>
      <div style={{ transform: `scale(${sc})` }}><Dashboard /></div>
    </AbsoluteFill>
  )
}

// ---------- Scene 4 : Features ----------
const ic = (paths) => <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths.map((d, i) => <path key={i} d={d} />)}</svg>
const FEATURES = [
  { t: 'Multi-PropFirms', d: 'Topstep, Apex, Bulenox, MFFU… tous tes comptes sur un écran.', c: BLUELT, i: ic(['M3 21h18', 'M5 21V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v16', 'M13 9h5a1 1 0 0 1 1 1v11']) },
  { t: 'Journal & analytics', d: 'Chaque trade daté, taggé. Ton edge se dessine, jour après jour.', c: GREEN, i: ic(['M3 3v18h18', 'M19 9l-5 5-3-3-4 4']) },
  { t: 'Payouts & dépenses', d: 'Frais, resets, abonnements vs payouts. Ton vrai net, sans illusion.', c: '#f5b651', i: ic(['M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M16 13h.01', 'M3 9h18']) },
  { t: 'Drawdown Guardian', d: 'Trailing, EOD, intraday par firm. Alerte avant la casse.', c: '#e8504a', i: ic(['M12 3l8 3v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z', 'M9.5 12.5l1.8 1.8 3.4-3.6']) },
]
const Features = () => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig()
  const head = interpolate(frame, [0, 16], [0, 1], { extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: sceneFade(frame, 220), fontFamily: FONT }}>
      <div style={{ fontSize: 40, fontWeight: 800, color: T, marginBottom: 40, opacity: head }}>Le copilote de ta carrière prop</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 22, width: 1180 }}>
        {FEATURES.map((f, i) => {
          const s = spring({ frame: frame - 12 - i * 8, fps, config: { damping: 200 } })
          return (
            <div key={i} style={{ background: 'rgba(26,31,44,0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '28px 30px', display: 'flex', gap: 20, alignItems: 'center', opacity: s, transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)` }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: f.c + '22', color: f.c, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{f.i}</div>
              <div>
                <div style={{ fontSize: 25, fontWeight: 700, color: T }}>{f.t}</div>
                <div style={{ fontSize: 17, color: T2, marginTop: 6, lineHeight: 1.45 }}>{f.d}</div>
              </div>
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

// ---------- Scene 5 : Outro ----------
const Outro = () => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig()
  const s = spring({ frame, fps, config: { damping: 16 } })
  const sc = interpolate(s, [0, 1], [0.7, 1])
  const cta = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: 'clamp' })
  const url = interpolate(frame, [36, 56], [0, 1], { extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: sceneFade(frame, 160), fontFamily: FONT }}>
      <div style={{ transform: `scale(${sc})` }}><QLogo size={130} color={BLUELT} glow={40} /></div>
      <div style={{ fontSize: 60, fontWeight: 800, color: T, marginTop: 22, letterSpacing: -1, opacity: cta, transform: `translateY(${interpolate(cta, [0, 1], [20, 0])}px)` }}>Commence gratuitement.</div>
      <div style={{ fontSize: 24, color: T2, marginTop: 14, opacity: cta }}>Aucune carte requise · gratuit pour toujours sur l’essentiel</div>
      <div style={{ marginTop: 30, padding: '16px 34px', borderRadius: 14, background: `linear-gradient(135deg, ${BLUE}, ${BLUELT})`, color: '#fff', fontSize: 24, fontWeight: 700, opacity: url, boxShadow: `0 14px 40px -8px ${BLUE}` }}>quantara.tech</div>
    </AbsoluteFill>
  )
}

export const QuantaraPromo = () => (
  <AbsoluteFill style={{ background: BG }}>
    <Background />
    <Sequence from={0} durationInFrames={80}><Intro /></Sequence>
    <Sequence from={80} durationInFrames={110}><Pitch /></Sequence>
    <Sequence from={190} durationInFrames={330}><DashScene /></Sequence>
    <Sequence from={520} durationInFrames={220}><Features /></Sequence>
    <Sequence from={740} durationInFrames={160}><Outro /></Sequence>
  </AbsoluteFill>
)
