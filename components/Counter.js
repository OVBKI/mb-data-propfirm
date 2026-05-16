'use client'
import { useEffect, useRef, useState } from 'react'

// Compteur animé : monte de 0 à `to` quand l'élément entre dans le viewport.
// Si `to` n'est pas un nombre, affiche la valeur telle quelle (ex: '∞', '100%').
//
// Usage :
//   <Counter to={8} suffix="" duration={1200} />
//   <Counter to={100} suffix="%" />
//   <Counter to="∞" />   (statique, juste affiché)

export default function Counter({
  to,
  suffix = '',
  prefix = '',
  duration = 1400,
  decimals = 0,
  style = {},
  className = '',
}) {
  const ref = useRef(null)
  const [val, setVal] = useState(typeof to === 'number' ? 0 : to)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (typeof to !== 'number') return // pas d'anim pour les strings
    const el = ref.current
    if (!el || started) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started) {
            setStarted(true)
            const startTime = performance.now()
            const animate = (now) => {
              const t = Math.min((now - startTime) / duration, 1)
              // easeOutCubic
              const eased = 1 - Math.pow(1 - t, 3)
              setVal(Number((eased * to).toFixed(decimals)))
              if (t < 1) requestAnimationFrame(animate)
              else setVal(to)
            }
            requestAnimationFrame(animate)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.4 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [to, duration, decimals, started])

  const display = typeof val === 'number'
    ? val.toLocaleString('fr-FR', { maximumFractionDigits: decimals })
    : val

  return (
    <span ref={ref} className={className} style={style}>
      {prefix}{display}{suffix}
    </span>
  )
}
