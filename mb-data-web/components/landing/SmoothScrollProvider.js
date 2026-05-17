'use client'
// Smooth scroll buttery via Lenis (la lib utilisée par Stripe, Vercel, Linear).
// Override le wheel event pour interpoler le scroll → effet "premium" instantanément.
// Respecte prefers-reduced-motion (skip si l'user veut désactiver les animations).

import { useEffect } from 'react'

export default function SmoothScrollProvider() {
  useEffect(() => {
    // Skip si reduced-motion (accessibilité)
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let lenis
    let rafId

    // Import dynamique pour pas plomber le bundle initial
    import('lenis').then(({ default: Lenis }) => {
      lenis = new Lenis({
        duration: 1.1,
        easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // ease-out exponential
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
      })

      function raf(time) {
        lenis.raf(time)
        rafId = requestAnimationFrame(raf)
      }
      rafId = requestAnimationFrame(raf)
    })

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      if (lenis) lenis.destroy()
    }
  }, [])

  return null
}
