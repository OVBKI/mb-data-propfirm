'use client'
// CountUpNumber — Counts from 0 to `to` over `duration` ms with an ease-out
// curve, kicked off the first time the element enters the viewport. Uses
// requestAnimationFrame; never reads window outside useEffect. If the value
// isn't purely numeric (e.g. "$0" or "100%"), we still animate the numeric
// part and re-attach the prefix / suffix from the original string.

import { useEffect, useRef, useState } from 'react'

// Parse "11", "$0", "100%", "2" → { prefix, num, suffix }
function splitValue(v) {
  const s = String(v).trim()
  const m = s.match(/^(\D*)(-?\d+(?:\.\d+)?)(.*)$/)
  if (!m) return { prefix: '', num: null, suffix: s }
  return { prefix: m[1] || '', num: parseFloat(m[2]), suffix: m[3] || '' }
}

// easeOutCubic — feels natural for counter-ups without overshoot.
const easeOut = (t) => 1 - Math.pow(1 - t, 3)

export default function CountUpNumber({
  value,
  duration = 1200,
  style,
}) {
  const { prefix, num, suffix } = splitValue(value)
  const ref = useRef(null)
  const [display, setDisplay] = useState(num === null ? value : `${prefix}0${suffix}`)
  const startedRef = useRef(false)

  useEffect(() => {
    if (num === null) return // non-numeric, nothing to animate
    if (!ref.current) return
    const reduce = typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setDisplay(`${prefix}${num}${suffix}`)
      return
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !startedRef.current) {
          startedRef.current = true
          const t0 = performance.now()
          const isInt = Number.isInteger(num)
          const tick = (now) => {
            const t = Math.min(1, (now - t0) / duration)
            const v = num * easeOut(t)
            const out = isInt ? Math.round(v) : v.toFixed(1)
            setDisplay(`${prefix}${out}${suffix}`)
            if (t < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
          obs.disconnect()
        }
      })
    }, { threshold: 0.4 })
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [num, prefix, suffix, duration])

  return <span ref={ref} style={style}>{display}</span>
}
