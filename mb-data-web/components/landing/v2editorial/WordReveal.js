'use client'
// WordReveal — splits a string into words and reveals them one by one
// when the element enters the viewport. Uses IntersectionObserver + a CSS
// transition with a per-word stagger so the work happens on the GPU.
//
// requestIdleCallback is used to schedule the reveal off the main thread —
// the visual effect doesn't need to land on the next paint, only soon-ish.

import { useEffect, useRef, useState } from 'react'
import { editorial } from './tokens'

// Per-word stagger in ms. 60ms keeps the line feeling like one breath
// at 6–10 words, but never drags past ~1s for long lines.
const STAGGER_MS = 60
// Once the headline scrolls 20% into view, start the cascade.
const OBSERVER_THRESHOLD = 0.2

export default function WordReveal({
  text,
  as: Tag = 'h1',
  style,
  wordStyle,
  // delay (ms) added before the FIRST word starts — useful when the headline
  // is the hero and we want a beat after the page hydrates.
  initialDelay = 0,
}) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  // The text often contains explicit newlines (\n in i18n). Split on those
  // first so we can render <br/> between visual lines, then split each line
  // into words for the staggered reveal.
  const lines = (text || '').split('\n').map(line => line.trim()).filter(Boolean)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    // Respect users who asked the OS to slow down motion.
    const reduce = typeof window !== 'undefined'
      && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setVisible(true)
      return undefined
    }

    let cancelled = false
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          // Defer the state flip to idle time so we don't fight the scroll thread.
          const schedule = window.requestIdleCallback || ((cb) => setTimeout(cb, 1))
          schedule(() => { if (!cancelled) setVisible(true) })
          observer.disconnect()
          break
        }
      }
    }, { threshold: OBSERVER_THRESHOLD })

    observer.observe(node)
    return () => { cancelled = true; observer.disconnect() }
  }, [])

  // Cursor index across lines — keeps the stagger continuous across <br/>.
  let cursor = 0

  return (
    <Tag ref={ref} style={style}>
      {lines.map((line, lineIdx) => {
        const words = line.split(/\s+/)
        const rendered = words.map((word, wordIdx) => {
          const delay = initialDelay + cursor * STAGGER_MS
          cursor += 1
          return (
            <span
              key={`${lineIdx}-${wordIdx}`}
              style={{
                display: 'inline-block',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(0.4em)',
                transition: `opacity 700ms ${editorial.easeOut} ${delay}ms, transform 900ms ${editorial.easeOut} ${delay}ms`,
                willChange: visible ? 'auto' : 'opacity, transform',
                marginRight: wordIdx === words.length - 1 ? 0 : '0.25em',
                ...wordStyle,
              }}
            >
              {word}
            </span>
          )
        })
        return (
          <span key={lineIdx} style={{ display: 'block' }}>
            {rendered}
          </span>
        )
      })}
    </Tag>
  )
}
