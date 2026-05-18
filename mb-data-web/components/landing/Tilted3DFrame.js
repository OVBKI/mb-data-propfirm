'use client'
// Tilted3DFrame — wrapper réutilisable qui présente le contenu (mockup de page produit)
// dans un cadre macOS-like incliné en 3D avec perspective.
//
// COMPORTEMENT :
//   - Tilt de base au repos : rotateX(5deg) rotateY(-12deg) → effet "produit
//     posé sur un bureau, vu de 3/4"
//   - Au mouse move : la souris module le tilt subtilement (±8 deg) pour donner
//     un effet "interactif vivant" sans être agressif
//   - Au mouse leave : retour smooth au tilt de base via spring
//
// USAGE :
//   <Tilted3DFrame title="quantara.tech/app" intensity={1}>
//     <DashboardMockup />
//   </Tilted3DFrame>
//
// PROPS :
//   - children : le mockup de page à afficher
//   - title : texte affiché dans la barre macOS (défaut "quantara.tech")
//   - intensity : multiplicateur de l'effet parallax souris (défaut 1)
//   - flip : si true, incline dans l'autre sens (rotateY positif) pour
//     alterner gauche/droite dans une séquence de sections
//
// PERF :
//   - Pure CSS transform 3D (GPU accelerated, 60fps natif)
//   - Pas de WebGL, pas de framer-motion sur le tilt (juste transition CSS)
//   - mousemove throttle naturel via React batching

import { useRef, useState } from 'react'

const C = {
  surface: '#141720',
  surface2: '#1c2030',
  border: 'rgba(255,255,255,0.07)',
  text3: '#5a6275',
}

const mono = 'ui-monospace, SFMono-Regular, Menlo, Monaco, "Courier New", monospace'

export default function Tilted3DFrame({
  children,
  title = 'quantara.tech/app',
  intensity = 1,
  flip = false,
}) {
  const ref = useRef(null)
  // Tilt par défaut : léger 3/4, inclinaison vers la droite OU gauche (flip)
  const BASE_RX = 4
  const BASE_RY = flip ? 10 : -10
  const [tilt, setTilt] = useState({ rx: BASE_RX, ry: BASE_RY })

  const handleMove = (e) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({
      rx: BASE_RX - y * 6 * intensity,
      ry: BASE_RY + x * 8 * intensity,
    })
  }

  const handleLeave = () => setTilt({ rx: BASE_RX, ry: BASE_RY })

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="t3d-wrapper"
      style={{
        perspective: '2200px',
        perspectiveOrigin: '50% 50%',
        padding: '40px 0',
        // Sur mobile, on neutralise le tilt 3D pour que le mockup soit lisible plein écran.
      }}
    >
      {/* Sur mobile : on désactive le tilt 3D (imperceptible sur petit écran)
          et on REDUIT le mockup avec `zoom` pour qu'il rentre entier dans la viewport
          (pas de scroll horizontal). Zoom shrink aussi la bounding box, donc le
          conteneur s'adapte naturellement à la nouvelle taille. */}
      <style>{`
        @media (max-width: 900px) {
          .t3d-wrapper { padding: 12px 0 !important; perspective: none !important; }
          .t3d-tilt {
            transform: none !important;
            border-radius: 10px !important;
            box-shadow: 0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.05) inset !important;
            zoom: 0.75;
          }
        }
        @media (max-width: 700px) {
          .t3d-tilt { zoom: 0.6; }
        }
        @media (max-width: 480px) {
          .t3d-tilt { zoom: 0.46; }
        }
        @media (max-width: 380px) {
          .t3d-tilt { zoom: 0.38; }
        }
      `}</style>
      <div
        className="t3d-tilt"
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          transformStyle: 'preserve-3d',
          transformOrigin: '50% 50%',
          // Ombre dramatique (style Linear / Stripe)
          boxShadow: [
            '0 60px 120px rgba(0, 0, 0, 0.45)',
            '0 30px 60px rgba(0, 0, 0, 0.25)',
            '0 0 0 1px rgba(255, 255, 255, 0.06) inset',
            '0 0 80px rgba(45, 111, 255, 0.08)',
          ].join(', '),
          borderRadius: 14,
          overflow: 'hidden',
          background: C.surface,
          // Léger glow bleu autour
          willChange: 'transform',
        }}
      >
        {/* Chrome macOS-style en haut */}
        <div style={{
          padding: '12px 16px',
          background: C.surface2,
          borderBottom: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          position: 'relative',
          zIndex: 2,
        }}>
          {/* Boutons macOS (red/yellow/green) */}
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }} />
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
          </div>

          {/* URL bar centrée (style Safari/Chrome) */}
          <div style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
          }}>
            <div style={{
              padding: '4px 14px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 6,
              fontSize: 11,
              fontFamily: mono,
              color: C.text3,
              letterSpacing: '0.02em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <span style={{ fontSize: 9 }}>🔒</span>
              {title}
            </div>
          </div>

          {/* Spacer droit pour balance le layout */}
          <div style={{ width: 54 }} />
        </div>

        {/* Contenu de la page produit (sur mobile : permet scroll-x interne sans casser le layout) */}
        <div className="t3d-content" style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  )
}
