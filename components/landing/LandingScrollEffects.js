'use client'
// Globals luxury : smooth scroll, custom scrollbar fine, selection couleur Quantara,
// reduced-motion respect, et keyframes utilitaires.

export default function LandingScrollEffects() {
  return (
    <style>{`
      @keyframes qtFloat {
        0%, 100% { transform: translate(-50%, 0); opacity: 0.6; }
        50%      { transform: translate(-50%, 6px); opacity: 1; }
      }

      /* Pas de scroll-behavior CSS — Lenis gère le smooth scroll
         (sinon conflit qui rend le scroll saccadé) */

      /* Custom scrollbar — fine et élégante */
      ::-webkit-scrollbar {
        width: 8px;
      }
      ::-webkit-scrollbar-track {
        background: #0d0f14;
      }
      ::-webkit-scrollbar-thumb {
        background: rgba(45, 111, 255, 0.2);
        border-radius: 4px;
        border: 2px solid #0d0f14;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: rgba(45, 111, 255, 0.4);
      }

      /* Sélection texte aux couleurs Quantara */
      ::selection {
        background: rgba(77, 143, 255, 0.35);
        color: #fff;
      }

      /* Bord-à-bord en cas de débordement horizontal */
      body {
        overflow-x: hidden;
      }

      /* Accessibilité : respecte prefers-reduced-motion */
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    `}</style>
  )
}
