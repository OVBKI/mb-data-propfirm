'use client'
import { useEffect, useRef } from 'react'

// Wrapper qui fade-in son contenu quand il entre dans le viewport.
// Utilise IntersectionObserver — pas de lib externe.
//
// Usage :
//   <Reveal delay={150}>...</Reveal>
//   <Reveal as="section" delay={300} threshold={0.2}>...</Reveal>

export default function Reveal({
  children,
  delay = 0,
  threshold = 0.12,
  as: Tag = 'div',
  style = {},
  className = '',
  ...props
}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Si IntersectionObserver pas dispo (vieux navigateur) → on affiche tout de suite
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('reveal-visible')
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // delay via setTimeout pour pouvoir réutiliser la classe sans transition-delay
            setTimeout(() => entry.target.classList.add('reveal-visible'), delay)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold, rootMargin: '0px 0px -10% 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [delay, threshold])

  return (
    <Tag
      ref={ref}
      className={`reveal ${className}`.trim()}
      style={style}
      {...props}
    >
      {children}
    </Tag>
  )
}
