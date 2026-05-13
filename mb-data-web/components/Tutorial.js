'use client'
// Tutoriel guidé "spotlight" pour les nouveaux users de Quantara.
// Affiche une zone éclairée autour d'un élément clé (data-tour="<key>") avec un
// tooltip à côté + animation pulse. Navigation pas à pas via boutons.
//
// Déclenché par :
//   - OnboardingModal (3ème option pour les nouveaux users)
//   - Bouton "🎓 Lancer le tutoriel" en bas de la sidebar
//
// Persistance : localStorage 'quantara_tutorial_done' (info uniquement, pas de gating).
//
// Steps :
//   - type='modal' → carte centrée plein écran (intro / outro)
//   - type='spot'  → spotlight sur un élément ciblé via querySelector(target)
//                    + tooltip positionné selon placement (top/bottom/left/right)

import { useState, useEffect, useRef } from 'react'

const C = {
  surface: '#141720',
  surface2: '#1c2030',
  surface3: '#222637',
  border: 'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.13)',
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#565e78',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
  green: '#1db87a',
}

const TOUR_DONE_KEY = 'quantara_tutorial_done'

const STEPS = [
  {
    type: 'modal',
    icon: '🎯',
    title: 'Démarrons ensemble',
    desc: "Quantara est ton journal de trading PropFirm. Je vais te montrer les fonctionnalités principales en 9 étapes rapides — moins de 2 minutes.",
    cta: "C'est parti !",
  },
  {
    type: 'spot',
    target: '[data-tour="sidebar"]',
    page: 'dashboard',
    placement: 'right',
    icon: '🧭',
    title: 'Navigation principale',
    desc: "Sur la gauche se trouvent toutes les sections : Tableau de bord, Journal de trading, Analytics, Calendrier économique, Règles des firmes…",
  },
  {
    type: 'spot',
    target: '[data-tour="stats-cards"]',
    page: 'dashboard',
    placement: 'bottom',
    icon: '📊',
    title: "Vue d'ensemble en un coup d'œil",
    desc: "Total dépensé en challenges, payouts reçus, résultat net : tout est calculé automatiquement à partir de tes comptes et de tes payouts.",
  },
  {
    type: 'spot',
    target: '[data-tour="add-firm-btn"]',
    page: 'dashboard',
    placement: 'bottom',
    icon: '🏢',
    title: 'Ajouter une PropFirm',
    desc: "Clique sur ce bouton pour ajouter une firme (Topstep, Apex, Lucid…). Les règles drawdown, payout target et profit split sont pré-remplies pour 10 firmes.",
  },
  {
    type: 'spot',
    target: '[data-tour="firms-grid"]',
    page: 'dashboard',
    placement: 'top',
    icon: '🗂',
    title: 'Tes PropFirms',
    desc: "Chaque carte affiche tes comptes (Challenge / Financé / Échoué) avec leur statut et profit net. Clique sur une carte pour gérer comptes, payouts et certificats.",
  },
  {
    type: 'spot',
    target: '[data-tour="nav-journal"]',
    page: 'dashboard',
    placement: 'right',
    icon: '📔',
    title: 'Journal de trading',
    desc: "Ici tu logges chaque trade : PnL, prix entry/exit, side, screenshot. La courbe d'equity et la ligne de drawdown s'affichent en temps réel selon le type de DD de ta firme.",
  },
  {
    type: 'spot',
    target: '[data-tour="nav-calendar"]',
    page: 'dashboard',
    placement: 'right',
    icon: '📅',
    title: 'Calendrier économique',
    desc: "Toutes les news macro à fort impact (NFP, FOMC, CPI…) filtrées par devise. Indispensable pour éviter de trader pendant un événement à risque.",
  },
  {
    type: 'spot',
    target: '[data-tour="nav-rules"]',
    page: 'dashboard',
    placement: 'right',
    icon: '⚖️',
    title: 'Comparateur de firmes',
    desc: "Compare les règles et prix des 10 PropFirms (drawdown, profit split, payout target, prix du challenge) pour choisir celle qui colle à ton style.",
  },
  {
    type: 'modal',
    icon: '🎉',
    title: 'Tu es prêt !',
    desc: "Tu connais maintenant les bases de Quantara. Tu peux relancer ce tutoriel à tout moment via le bouton « 🎓 Lancer le tutoriel » en bas du menu de gauche. Bon trading !",
    cta: 'Commencer à trader',
  },
]

export default function Tutorial({ onClose, onPageChange }) {
  const [idx, setIdx] = useState(0)
  const [rect, setRect] = useState(null)
  const [ready, setReady] = useState(false)
  const step = STEPS[idx]

  // Switch page when step requires it
  useEffect(() => {
    if (step.page) onPageChange?.(step.page)
  }, [idx])

  // Measure target element position — with retry for elements not yet mounted
  useEffect(() => {
    setReady(false)
    if (step.type !== 'spot') {
      setRect(null)
      setReady(true)
      return
    }

    let cancelled = false
    let attempts = 0

    function measure() {
      if (cancelled) return
      const el = document.querySelector(step.target)
      if (!el) {
        attempts++
        if (attempts < 20) setTimeout(measure, 100) // retry up to 2s
        return
      }
      const r = el.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
      setReady(true)
      // Scroll target into view if off-screen
      if (r.top < 60 || r.bottom > window.innerHeight - 60) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' })
        // Re-measure after scroll
        setTimeout(() => {
          if (cancelled) return
          const r2 = el.getBoundingClientRect()
          setRect({ top: r2.top, left: r2.left, width: r2.width, height: r2.height })
        }, 350)
      }
    }

    const timer = setTimeout(measure, 250) // wait for page transition
    function onResize() { measure() }
    function onScroll() { measure() }
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      cancelled = true
      clearTimeout(timer)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [idx])

  function next() {
    if (idx < STEPS.length - 1) setIdx(idx + 1)
    else finish()
  }
  function prev() { if (idx > 0) setIdx(idx - 1) }
  function finish() {
    try { localStorage.setItem(TOUR_DONE_KEY, '1') } catch {}
    onClose?.()
  }

  const isLast = idx === STEPS.length - 1
  const isFirst = idx === 0
  const TT_W = 380
  const TT_H_EST = 240

  // Compute tooltip position
  function tooltipStyle() {
    if (step.type !== 'spot' || !rect) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    }
    const vw = window.innerWidth, vh = window.innerHeight
    const gap = 18
    let top, left

    if (step.placement === 'right') {
      left = rect.left + rect.width + gap
      top = rect.top + rect.height / 2 - TT_H_EST / 2
    } else if (step.placement === 'left') {
      left = rect.left - TT_W - gap
      top = rect.top + rect.height / 2 - TT_H_EST / 2
    } else if (step.placement === 'top') {
      top = rect.top - TT_H_EST - gap
      left = rect.left + rect.width / 2 - TT_W / 2
    } else { // bottom
      top = rect.top + rect.height + gap
      left = rect.left + rect.width / 2 - TT_W / 2
    }

    // Clamp to viewport with 20px margin
    if (left < 20) left = 20
    if (left + TT_W > vw - 20) left = vw - TT_W - 20
    if (top < 20) {
      // Flip from top → bottom if no room above
      top = rect.top + rect.height + gap
    }
    if (top + TT_H_EST > vh - 20) {
      // Flip from bottom → top if no room below
      const alt = rect.top - TT_H_EST - gap
      if (alt >= 20) top = alt
      else top = vh - TT_H_EST - 20
    }
    return { top: `${top}px`, left: `${left}px` }
  }

  if (!ready) return null

  return (
    <>
      {/* === Spotlight (mode 'spot') === */}
      {step.type === 'spot' && rect && (
        <>
          {/* 4 rectangles autour de la cible — bloquent les clics partout sauf sur la cible */}
          <div style={{ position:'fixed', top:0, left:0, right:0, height: Math.max(0, rect.top - 8), background:'rgba(0,0,0,0.78)', backdropFilter:'blur(2px)', zIndex: 9998, transition:'all 0.3s ease' }} />
          <div style={{ position:'fixed', top: rect.top + rect.height + 8, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.78)', backdropFilter:'blur(2px)', zIndex: 9998, transition:'all 0.3s ease' }} />
          <div style={{ position:'fixed', top: rect.top - 8, left:0, width: Math.max(0, rect.left - 8), height: rect.height + 16, background:'rgba(0,0,0,0.78)', backdropFilter:'blur(2px)', zIndex: 9998, transition:'all 0.3s ease' }} />
          <div style={{ position:'fixed', top: rect.top - 8, left: rect.left + rect.width + 8, right:0, height: rect.height + 16, background:'rgba(0,0,0,0.78)', backdropFilter:'blur(2px)', zIndex: 9998, transition:'all 0.3s ease' }} />

          {/* Click-blocker transparent sur la cible — empêche d'interagir directement */}
          <div style={{ position:'fixed', top: rect.top - 8, left: rect.left - 8, width: rect.width + 16, height: rect.height + 16, background:'transparent', cursor:'help', zIndex: 9998 }} />

          {/* Pulse ring (visuel uniquement) */}
          <div style={{
            position:'fixed',
            top: rect.top - 8, left: rect.left - 8,
            width: rect.width + 16, height: rect.height + 16,
            borderRadius: 12,
            border: `2px solid ${C.blueLight}`,
            pointerEvents: 'none',
            animation: 'qtPulse 2s ease-in-out infinite',
            zIndex: 9999,
            transition: 'all 0.3s ease',
          }} />
        </>
      )}

      {/* === Modal full-screen (mode 'modal') === */}
      {step.type === 'modal' && (
        <div style={{
          position:'fixed', inset:0,
          background:'rgba(0,0,0,0.82)',
          backdropFilter:'blur(8px)',
          pointerEvents:'auto',
          zIndex: 9998,
        }} />
      )}

      {/* === Tooltip / Carte === */}
      <div style={{
        position: 'fixed',
        width: TT_W,
        maxWidth: 'calc(100vw - 40px)',
        background: C.surface,
        border: `1px solid ${C.border2}`,
        borderRadius: 14,
        padding: 22,
        boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(45,111,255,0.2)',
        zIndex: 10000,
        color: C.text,
        fontFamily: 'inherit',
        ...tooltipStyle(),
      }}>
        {/* Header: étape + skip */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: 10, fontWeight: 700, color: C.text3,
          textTransform: 'uppercase', letterSpacing: '0.6px',
          marginBottom: 14,
        }}>
          <span>Étape {idx + 1} / {STEPS.length}</span>
          <button
            onClick={finish}
            style={{
              background: 'transparent', border: 'none', color: C.text3,
              fontSize: 11, cursor: 'pointer', textDecoration: 'underline',
              fontFamily: 'inherit', letterSpacing: '0.5px', padding: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.color = C.text}
            onMouseLeave={e => e.currentTarget.style.color = C.text3}
          >Passer le tutoriel</button>
        </div>

        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 30, lineHeight: 1, flexShrink: 0 }}>{step.icon}</span>
          <h3 style={{
            fontSize: 18, fontWeight: 700, color: C.text,
            lineHeight: 1.3, margin: 0,
          }}>{step.title}</h3>
        </div>

        {/* Description */}
        <p style={{
          fontSize: 13, color: C.text2, lineHeight: 1.65,
          marginBottom: 20,
        }}>{step.desc}</p>

        {/* Progress bar */}
        <div style={{
          height: 4, background: C.surface2, borderRadius: 99,
          marginBottom: 18, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${((idx + 1) / STEPS.length) * 100}%`,
            background: `linear-gradient(90deg, ${C.blue}, ${C.blueLight})`,
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            borderRadius: 99,
          }} />
        </div>

        {/* Boutons navigation */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
          {!isFirst && (
            <button
              onClick={prev}
              style={{
                padding: '9px 16px', fontSize: 13, fontWeight: 500,
                background: 'transparent', border: `1px solid ${C.border2}`,
                color: C.text2, borderRadius: 8, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.surface2; e.currentTarget.style.color = C.text }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.text2 }}
            >← Retour</button>
          )}
          <button
            onClick={next}
            style={{
              padding: '10px 20px', fontSize: 13, fontWeight: 600,
              background: `linear-gradient(135deg, ${C.blue}, ${C.blueLight})`,
              border: 'none', color: '#fff', borderRadius: 8, cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 6px 18px rgba(45,111,255,0.4)',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 22px rgba(45,111,255,0.5)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(45,111,255,0.4)' }}
          >
            {isLast ? (step.cta || 'Terminer') : (step.cta || 'Suivant')}
            {!isLast && <span style={{ fontSize: 14 }}>→</span>}
          </button>
        </div>
      </div>

      {/* Keyframes pulse */}
      <style>{`
        @keyframes qtPulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(77,143,255,0.55), 0 0 20px rgba(77,143,255,0.4);
            border-color: ${C.blueLight};
          }
          50% {
            box-shadow: 0 0 0 16px rgba(77,143,255,0), 0 0 30px rgba(77,143,255,0.2);
            border-color: ${C.blue};
          }
        }
      `}</style>
    </>
  )
}
