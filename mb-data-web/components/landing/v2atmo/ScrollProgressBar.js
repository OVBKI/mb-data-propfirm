'use client'
// ScrollProgressBar — Thin coral bar fixed at the very top of the page.
// Width grows linearly with the scroll percentage. SSR-safe (no window
// access outside useEffect), uses requestAnimationFrame to avoid layout
// thrash on scroll-heavy pages.

import { useEffect, useState } from 'react'
import { ATMO } from './atmoTheme'

export default function ScrollProgressBar() {
  const [pct, setPct] = useState(0)

  useEffect(() => {
    let raf = 0
    const compute = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - doc.clientHeight
      const next = max > 0 ? (doc.scrollTop || window.scrollY) / max : 0
      setPct(Math.max(0, Math.min(1, next)))
      raf = 0
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute)
    }
    compute()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      height: 1.5, zIndex: 100, pointerEvents: 'none',
    }}>
      <div style={{
        width: `${pct * 100}%`,
        height: '100%',
        background: ATMO.accent,
        boxShadow: `0 0 8px ${ATMO.accentGlow}`,
        transition: 'width 0.08s linear',
      }} />
    </div>
  )
}
