'use client'
// Tutoriel INTERACTIF pour Quantara — guide l'user pas à pas en attendant qu'il
// effectue réellement chaque action (créer firme, ajouter compte, logger trade,
// passer en Financé, faire payout).
//
// Déclenchement :
//   - OnboardingModal (3ème option pour les nouveaux users)
//   - Bouton "🎓 Lancer le tutoriel" en bas de la sidebar
//
// 2 modes d'étapes :
//   - mode = (rien)  → étape passive : user clique "Suivant" pour avancer
//   - mode = 'action' → étape interactive : user doit RÉELLEMENT faire l'action,
//                       le tutoriel détecte la complétion via la fonction waitFor(state, initialState)
//                       et auto-advance avec une petite animation "✓ Validé".
//
// 3 visuels selon le contexte :
//   - 'modal' passif      → backdrop full-screen + carte centrée
//   - 'spot' passif       → 4 rectangles dim + pulse ring + tooltip
//   - mode='action'       → mini panneau flottant bottom-right + pulse ring sur target (clics autorisés)
//
// Persistance : localStorage 'quantara_tutorial_done'

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
  amber: '#fac775',
}

const TOUR_DONE_KEY = 'quantara_tutorial_done'

const STEPS = [
  // ============================ INTRO ============================
  {
    id: 'welcome',
    type: 'modal',
    icon: '🎯',
    title: 'Tutoriel interactif Quantara',
    desc: "Je vais te guider pas à pas. Tu vas RÉELLEMENT créer ta firme, ajouter un compte, logger un trade, faire passer ton compte en Financé et enregistrer un payout. Au total ~5 min.",
    cta: "C'est parti !",
  },
  // ============================ SIDEBAR ============================
  {
    id: 'sidebar',
    type: 'spot',
    target: '[data-tour="sidebar"]',
    page: 'dashboard',
    placement: 'right',
    icon: '🧭',
    title: 'Navigation principale',
    desc: "À gauche se trouvent toutes les sections : Tableau de bord, Journal de trading, Analytics, Calendrier économique, Règles des firmes…",
  },
  // ============================ ACTION 1 : ADD FIRM ============================
  {
    id: 'add-firm',
    type: 'spot',
    target: '[data-tour="add-firm-btn"]',
    page: 'dashboard',
    placement: 'bottom',
    mode: 'action',
    icon: '🏢',
    badge: 'Étape 1/5',
    title: 'Ajoute ta 1ère PropFirm',
    desc: "👆 Clique sur ce bouton. Tape ou choisis une firme dans les suggestions (ex : Topstep) puis valide.",
    actionHint: "En attente que tu crées une firme…",
    waitFor: (s, i) => s.firmsCount > i.firmsCount,
  },
  // ============================ ACTION 2 : ADD ACCOUNT ============================
  // Note : après createFirm(), l'app ouvre automatiquement le modal "Nouveau compte"
  // → on enchaîne directement sur la création du compte
  {
    id: 'add-account',
    type: 'modal',
    mode: 'action',
    icon: '📂',
    badge: 'Étape 2/5',
    title: 'Configure ton 1er compte',
    desc: "Quantara t'a ouvert automatiquement le formulaire \"Nouveau compte\". Les règles (drawdown, profit split, payout target, prix du challenge) sont déjà pré-remplies selon ta firme. Garde le statut \"Challenge\" et clique sur \"Enregistrer\".",
    actionHint: "En attente que tu crées le compte…",
    waitFor: (s, i) => s.accountsCount > i.accountsCount,
  },
  // ============================ ACTION 4 : GO TO JOURNAL ============================
  {
    id: 'goto-journal',
    type: 'spot',
    target: '[data-tour="nav-journal"]',
    page: 'dashboard',
    placement: 'right',
    mode: 'action',
    icon: '📔',
    title: 'Direction le Journal',
    desc: "👆 Clique sur \"Journal trading\" dans la sidebar pour logger ton premier trade.",
    actionHint: "En attente que tu cliques sur Journal trading…",
    waitFor: (s) => s.page === 'journal',
  },
  // ============================ ACTION 5 : ADD TRADE ============================
  {
    id: 'add-trade',
    type: 'modal',
    mode: 'action',
    icon: '📝',
    badge: 'Étape 3/5',
    title: 'Logge ton 1er trade',
    desc: "Si tu as plusieurs comptes, sélectionne celui que tu viens de créer en haut. Puis clique sur \"+ Ajouter trade\". Entre une date, un PnL (ex : +250 pour un gain, -120 pour une perte), un instrument optionnel, et valide.",
    actionHint: "En attente que tu ajoutes un trade…",
    waitFor: (s, i) => s.tradesCount > i.tradesCount,
  },
  // ============================ INFO : EQUITY CURVE ============================
  {
    id: 'equity-info',
    type: 'modal',
    icon: '📈',
    title: "Ta courbe d'equity est née",
    desc: "Bravo ! Ta courbe de balance et la ligne de drawdown apparaissent maintenant en temps réel. Plus tu logges de trades, plus le graph se précise. Le DD est calculé selon le type de ta firme (Static / EOD / Trailing intraday).",
  },
  // ============================ ACTION 6 : BACK TO DASHBOARD ============================
  {
    id: 'back-dashboard',
    type: 'spot',
    target: '[data-tour="nav-dashboard"]',
    page: 'journal',
    placement: 'right',
    mode: 'action',
    icon: '⬅️',
    title: 'Retour au tableau de bord',
    desc: "👆 Clique sur \"Tableau de bord\" pour gérer le statut de ton compte (passage Challenge → Financé).",
    actionHint: "En attente que tu reviennes au dashboard…",
    waitFor: (s) => s.page === 'dashboard',
  },
  // ============================ ACTION 7 : PROMOTE TO FINANCÉ ============================
  {
    id: 'promote-financed',
    type: 'modal',
    mode: 'action',
    icon: '🚀',
    badge: 'Étape 4/5',
    title: 'Passe ton compte en Financé',
    desc: "Ouvre ta firme → clique sur ton compte → bouton vert \"🚀 J'ai passé le challenge — Passer en Financé\" en haut du drawer → remplis les règles funded (payout target, jours min, profit split…) → valide. Le journal se réinitialise automatiquement et les mensualités s'arrêtent.",
    actionHint: "En attente que ton compte passe en Financé…",
    waitFor: (s, i) => s.financedCount > i.financedCount,
  },
  // ============================ ACTION 8 : ADD PAYOUT ============================
  {
    id: 'add-payout',
    type: 'modal',
    mode: 'action',
    icon: '💰',
    badge: 'Étape 5/5',
    title: 'Enregistre ton 1er payout',
    desc: "Toujours dans le panneau du compte (maintenant en Financé), clique sur \"+ Ajouter payout\". Entre le montant BRUT demandé (ex : 2000). Quantara calcule le NET reçu (brut × profit split) et déduit le BRUT du compte.",
    actionHint: "En attente que tu enregistres un payout…",
    waitFor: (s, i) => s.payoutsCount > i.payoutsCount,
  },
  // ============================ DONE ============================
  {
    id: 'done',
    type: 'modal',
    icon: '🎉',
    title: "Bravo ! Tu maîtrises Quantara",
    desc: "Tu as créé une firme, ajouté un compte, loggé un trade, fait passer ton compte en Financé et enregistré un payout. Tu connais maintenant les bases. Tu peux relancer ce tutoriel à tout moment via le bouton « 🎓 Lancer le tutoriel » en bas du menu de gauche. Bon trading !",
    cta: 'Terminer',
  },
]

export default function Tutorial({ onClose, onPageChange, state }) {
  const [idx, setIdx] = useState(0)
  const [rect, setRect] = useState(null)
  const [ready, setReady] = useState(false)
  const [actionValidated, setActionValidated] = useState(false) // flash "✓ Validé"
  const initialStateRef = useRef(null)
  const advanceTimerRef = useRef(null)
  const step = STEPS[idx]

  // Snapshot l'état initial au changement d'étape
  useEffect(() => {
    initialStateRef.current = { ...state }
    setActionValidated(false)
    return () => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current)
        advanceTimerRef.current = null
      }
    }
  }, [idx])

  // Switch page si l'étape l'exige
  useEffect(() => {
    if (step.page) onPageChange?.(step.page)
  }, [idx])

  // Auto-advance pour les étapes 'action' quand waitFor(state, initial) est vrai
  useEffect(() => {
    if (step.mode !== 'action' || !step.waitFor) return
    if (!initialStateRef.current) return
    if (actionValidated) return
    if (step.waitFor(state, initialStateRef.current)) {
      setActionValidated(true)
      // Petit délai pour montrer le "✓ Validé" avant d'avancer
      advanceTimerRef.current = setTimeout(() => {
        setIdx(i => Math.min(STEPS.length - 1, i + 1))
      }, 1100)
    }
  }, [state, idx, actionValidated])

  // Mesure la position de l'élément cible (avec retry pour les éléments pas encore montés)
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
        if (attempts < 30) setTimeout(measure, 100) // retry jusqu'à 3s
        return
      }
      const r = el.getBoundingClientRect()
      // L'élément existe mais est masqué (ex: sidebar mobile en display:none) → retry
      if (r.width === 0 && r.height === 0) {
        attempts++
        if (attempts < 30) setTimeout(measure, 100)
        return
      }
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
      setReady(true)
      if (r.top < 60 || r.bottom > window.innerHeight - 60) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' })
        setTimeout(() => {
          if (cancelled) return
          const r2 = el.getBoundingClientRect()
          setRect({ top: r2.top, left: r2.left, width: r2.width, height: r2.height })
        }, 350)
      }
    }

    const timer = setTimeout(measure, 250)
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
  const isAction = step.mode === 'action'
  const TT_W = 380

  // Position du tooltip
  function tooltipStyle() {
    // Mode action : panneau flottant bottom-right (toujours visible, n'interfère pas avec l'UI)
    if (isAction) {
      return { bottom: '20px', right: '20px' }
    }
    // Mode modal passif : centré
    if (step.type !== 'spot' || !rect) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    }
    // Mode spot passif : à côté de la cible
    const TT_H_EST = 240
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
    } else {
      top = rect.top + rect.height + gap
      left = rect.left + rect.width / 2 - TT_W / 2
    }

    if (left < 20) left = 20
    if (left + TT_W > vw - 20) left = vw - TT_W - 20
    if (top < 20) top = rect.top + rect.height + gap
    if (top + TT_H_EST > vh - 20) {
      const alt = rect.top - TT_H_EST - gap
      if (alt >= 20) top = alt
      else top = vh - TT_H_EST - 20
    }
    return { top: `${top}px`, left: `${left}px` }
  }

  if (!ready) return null

  return (
    <>
      {/* === Backdrop modal passif uniquement === */}
      {step.type === 'modal' && !isAction && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.82)',
          backdropFilter: 'blur(8px)',
          pointerEvents: 'auto',
          zIndex: 9998,
        }} />
      )}

      {/* === Spotlight passif (4 rectangles sombres + click blocker) === */}
      {step.type === 'spot' && !isAction && rect && (
        <>
          <div style={{ position:'fixed', top:0, left:0, right:0, height: Math.max(0, rect.top - 8), background:'rgba(0,0,0,0.78)', backdropFilter:'blur(2px)', zIndex: 9998, transition:'all 0.3s ease' }} />
          <div style={{ position:'fixed', top: rect.top + rect.height + 8, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.78)', backdropFilter:'blur(2px)', zIndex: 9998, transition:'all 0.3s ease' }} />
          <div style={{ position:'fixed', top: rect.top - 8, left:0, width: Math.max(0, rect.left - 8), height: rect.height + 16, background:'rgba(0,0,0,0.78)', backdropFilter:'blur(2px)', zIndex: 9998, transition:'all 0.3s ease' }} />
          <div style={{ position:'fixed', top: rect.top - 8, left: rect.left + rect.width + 8, right:0, height: rect.height + 16, background:'rgba(0,0,0,0.78)', backdropFilter:'blur(2px)', zIndex: 9998, transition:'all 0.3s ease' }} />
          <div style={{ position:'fixed', top: rect.top - 8, left: rect.left - 8, width: rect.width + 16, height: rect.height + 16, background:'transparent', cursor:'help', zIndex: 9998 }} />
        </>
      )}

      {/* === Pulse ring (toujours présent quand on a une target) === */}
      {rect && (step.type === 'spot' || isAction) && (
        <div style={{
          position: 'fixed',
          top: rect.top - 8, left: rect.left - 8,
          width: rect.width + 16, height: rect.height + 16,
          borderRadius: 12,
          border: `2px solid ${actionValidated ? C.green : C.blueLight}`,
          pointerEvents: 'none',
          animation: actionValidated ? 'qtSuccess 1s ease-in-out' : 'qtPulse 2s ease-in-out infinite',
          zIndex: 9999,
          transition: 'all 0.3s ease',
        }} />
      )}

      {/* === Tooltip / Panneau === */}
      <div style={{
        position: 'fixed',
        width: TT_W,
        maxWidth: 'calc(100vw - 40px)',
        background: C.surface,
        border: `1px solid ${actionValidated ? C.green : C.border2}`,
        borderRadius: 14,
        padding: 22,
        boxShadow: isAction
          ? '0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(45,111,255,0.2)'
          : '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(45,111,255,0.2)',
        zIndex: 10000,
        color: C.text,
        fontFamily: 'inherit',
        transition: 'all 0.3s ease',
        ...tooltipStyle(),
      }}>
        {/* Header : étape + skip */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: 10, fontWeight: 700, color: C.text3,
          textTransform: 'uppercase', letterSpacing: '0.6px',
          marginBottom: 14,
        }}>
          <span style={{ display:'flex', gap:6, alignItems:'center' }}>
            <span>Étape {idx + 1} / {STEPS.length}</span>
            {step.badge && (
              <span style={{
                padding:'2px 8px', borderRadius: 99,
                background:'rgba(45,111,255,0.16)', color: C.blueLight,
                fontSize: 9, fontWeight: 700,
              }}>{step.badge}</span>
            )}
          </span>
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

        {/* Titre */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 30, lineHeight: 1, flexShrink: 0 }}>{step.icon}</span>
          <h3 style={{
            fontSize: 17, fontWeight: 700, color: C.text,
            lineHeight: 1.3, margin: 0,
          }}>{step.title}</h3>
        </div>

        {/* Description */}
        <p style={{
          fontSize: 13, color: C.text2, lineHeight: 1.65,
          marginBottom: 18,
        }}>{step.desc}</p>

        {/* Bandeau "Action attendue" pour les étapes interactives */}
        {isAction && (
          <div style={{
            padding: '10px 12px',
            background: actionValidated ? 'rgba(29,184,122,0.12)' : 'rgba(250,199,117,0.08)',
            border: `1px solid ${actionValidated ? C.green : 'rgba(250,199,117,0.3)'}`,
            borderRadius: 8,
            fontSize: 12, fontWeight: 600,
            color: actionValidated ? C.green : C.amber,
            marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 8,
            transition: 'all 0.3s ease',
          }}>
            <span style={{
              fontSize: 14,
              animation: actionValidated ? 'none' : 'qtBlink 1.4s ease-in-out infinite',
            }}>{actionValidated ? '✓' : '⏳'}</span>
            <span>{actionValidated ? 'Action validée ! Étape suivante…' : (step.actionHint || 'En attente de ton action…')}</span>
          </div>
        )}

        {/* Barre de progression */}
        <div style={{
          height: 4, background: C.surface2, borderRadius: 99,
          marginBottom: 16, overflow: 'hidden',
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
        <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {!isFirst && (
              <button
                onClick={prev}
                style={{
                  padding: '8px 14px', fontSize: 12, fontWeight: 500,
                  background: 'transparent', border: `1px solid ${C.border2}`,
                  color: C.text2, borderRadius: 8, cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = C.surface2; e.currentTarget.style.color = C.text }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.text2 }}
              >← Retour</button>
            )}
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {isAction && !actionValidated && (
              <button
                onClick={next}
                title="Passer cette étape (si tu l'as déjà fait)"
                style={{
                  background: 'transparent', border: 'none', color: C.text3,
                  fontSize: 11, cursor: 'pointer', textDecoration: 'underline',
                  fontFamily: 'inherit', padding: '8px 4px',
                }}
                onMouseEnter={e => e.currentTarget.style.color = C.text2}
                onMouseLeave={e => e.currentTarget.style.color = C.text3}
              >Sauter l'étape →</button>
            )}
            {!isAction && (
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
            )}
          </div>
        </div>
      </div>

      {/* Keyframes */}
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
        @keyframes qtSuccess {
          0% { box-shadow: 0 0 0 0 rgba(29,184,122,0.6), 0 0 20px rgba(29,184,122,0.5); transform: scale(1); }
          50% { box-shadow: 0 0 0 24px rgba(29,184,122,0), 0 0 40px rgba(29,184,122,0.3); transform: scale(1.02); }
          100% { box-shadow: 0 0 0 0 rgba(29,184,122,0), 0 0 20px rgba(29,184,122,0.4); transform: scale(1); }
        }
        @keyframes qtBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </>
  )
}
