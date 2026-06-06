'use client'
// HairlineRule — a 1px horizontal rule that draws itself from left to right
// when scrolled into view. Used to separate sections in the editorial layout.

import { useEffect, useRef, useState } from 'react'
import { editorial } from './tokens'

export default function HairlineRule({ marginY = 0, strong = false }) {
  const ref = useRef(null)
  const [drawn, setDrawn] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const reduce = typeof window !== 'undefined'
      && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setDrawn(true)
      return undefined
    }

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setDrawn(true)
          observer.disconnect()
          break
        }
      }
    }, { threshold: 0.5 })

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        width: '100%',
        height: 1,
        margin: `${marginY}px 0`,
        background: strong ? editorial.ruleStrong : editorial.rule,
        transform: drawn ? 'scaleX(1)' : 'scaleX(0)',
        transformOrigin: 'left center',
        transition: `transform 1200ms ${editorial.easeOut}`,
      }}
    />
  )
}
