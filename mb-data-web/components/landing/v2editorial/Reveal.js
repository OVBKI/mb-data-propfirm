'use client'
// Reveal — fades + lifts a block 20px on viewport intersect, once.
// Used for paragraphs, blockquotes, eyebrows — anything that isn't a headline.

import { useEffect, useRef, useState } from 'react'
import { editorial } from './tokens'

export default function Reveal({
  children,
  delay = 0,
  as: Tag = 'div',
  style,
  threshold = 0.15,
}) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const reduce = typeof window !== 'undefined'
      && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setVisible(true)
      return undefined
    }

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
          break
        }
      }
    }, { threshold })

    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold])

  return (
    <Tag
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 600ms ${editorial.easeOut} ${delay}ms, transform 600ms ${editorial.easeOut} ${delay}ms`,
        willChange: visible ? 'auto' : 'opacity, transform',
        ...style,
      }}
    >
      {children}
    </Tag>
  )
}
