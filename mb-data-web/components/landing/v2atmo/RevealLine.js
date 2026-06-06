'use client'
// RevealLine — Draws a thin coral vertical line on the left of a section,
// then fades the inner content up. Triggered when the wrapper enters the
// viewport using IntersectionObserver (once-only).
//
// The line uses transform: scaleY(0→1) with transform-origin: top so the
// draw motion goes downward. Content fade respects prefers-reduced-motion.

import { useEffect, useRef, useState } from 'react'
import { ATMO } from './atmoTheme'

export default function RevealLine({ children, lineHeight = 80, delay = 0 }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!ref.current) return
    // Respect reduced motion — skip the animation entirely.
    const reduce = typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setVisible(true)
      return
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      })
    }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' })
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', paddingLeft: 28 }}>
      <span
        aria-hidden
        style={{
          position: 'absolute',
          left: 0, top: 0,
          width: 1.5, height: lineHeight,
          background: ATMO.accent,
          boxShadow: `0 0 12px ${ATMO.accentGlow}`,
          transformOrigin: 'top',
          transform: visible ? 'scaleY(1)' : 'scaleY(0)',
          transition: `transform 800ms ${ATMO.ease} ${delay}ms`,
        }}
      />
      <div style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: `opacity 700ms ${ATMO.ease} ${delay + 250}ms, transform 700ms ${ATMO.ease} ${delay + 250}ms`,
      }}>
        {children}
      </div>
    </div>
  )
}
