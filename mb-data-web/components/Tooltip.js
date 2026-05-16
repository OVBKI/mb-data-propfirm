'use client'
// Tooltip réutilisable — survol/clic mobile pour afficher une explication.
//
// Usage :
//   <Tooltip text="Le drawdown trailing suit ton balance peak puis se fige au balance initial.">
//     Drawdown trailing
//   </Tooltip>
//
//   ou pour un icône d'aide :
//   <Tooltip text="...">
//     <span style={{cursor:'help'}}>ⓘ</span>
//   </Tooltip>

import { useState, useRef, useEffect } from 'react'

const C = {
  surface3: '#222637',
  border2: 'rgba(255,255,255,0.13)',
  text: '#f0ede8',
  text2: '#9098b0',
}

export default function Tooltip({ text, children, maxWidth = 280, position = 'top', style = {} }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const tooltipRef = useRef(null)
  const [coords, setCoords] = useState({ left: 0, top: 0, placement: position })

  // Repositionne le tooltip dynamiquement (et flip si dépasse de l'écran)
  useEffect(() => {
    if (!open || !triggerRef.current || typeof window === 'undefined') return
    const rect = triggerRef.current.getBoundingClientRect()
    const tooltipH = tooltipRef.current?.offsetHeight || 60
    const tooltipW = Math.min(maxWidth, tooltipRef.current?.offsetWidth || maxWidth)
    let placement = position
    let top, left

    // Auto-flip si pas la place en haut
    if (position === 'top' && rect.top < tooltipH + 12) placement = 'bottom'
    if (position === 'bottom' && (window.innerHeight - rect.bottom) < tooltipH + 12) placement = 'top'

    if (placement === 'top') {
      top = rect.top - tooltipH - 8
      left = rect.left + rect.width / 2 - tooltipW / 2
    } else {
      top = rect.bottom + 8
      left = rect.left + rect.width / 2 - tooltipW / 2
    }

    // Empêche de sortir de l'écran horizontalement
    if (left < 8) left = 8
    if (left + tooltipW > window.innerWidth - 8) left = window.innerWidth - tooltipW - 8

    setCoords({ left, top, placement })
  }, [open, maxWidth, position])

  // Ferme au scroll/resize
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(o => !o)} // mobile-friendly (tap)
        style={{
          cursor: 'help',
          borderBottom: '1px dotted rgba(144,152,176,0.4)',
          ...style,
        }}
      >
        {children}
      </span>

      {open && typeof window !== 'undefined' && (
        <div
          ref={tooltipRef}
          role="tooltip"
          style={{
            position: 'fixed',
            zIndex: 9999,
            top: coords.top,
            left: coords.left,
            maxWidth,
            padding: '10px 14px',
            background: C.surface3,
            border: `1px solid ${C.border2}`,
            borderRadius: 8,
            fontSize: 12,
            color: C.text,
            lineHeight: 1.55,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            pointerEvents: 'none',
            animation: 'tooltipFadeIn 0.15s ease-out',
          }}
        >
          {text}
        </div>
      )}

      <style jsx global>{`
        @keyframes tooltipFadeIn {
          from { opacity: 0; transform: translateY(2px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}

// Helper : juste un icône ⓘ avec tooltip — pour mettre à côté d'un label
export function TooltipIcon({ text, maxWidth = 280 }) {
  return (
    <Tooltip text={text} maxWidth={maxWidth} style={{ borderBottom: 'none' }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 14, height: 14, borderRadius: '50%',
        background: 'rgba(144,152,176,0.15)', color: C.text2,
        fontSize: 9, fontWeight: 700, marginLeft: 4,
        cursor: 'help', verticalAlign: 'middle',
      }}>?</span>
    </Tooltip>
  )
}
