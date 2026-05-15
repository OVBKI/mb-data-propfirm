'use client'
// Composant invisible qui injecte les keyframes CSS globales utilisées par la landing.
// Aussi : respecte prefers-reduced-motion en désactivant les animations si demandé.

export default function LandingScrollEffects() {
  return (
    <style>{`
      @keyframes qtFloat {
        0%, 100% { transform: translate(-50%, 0); opacity: 0.6; }
        50%      { transform: translate(-50%, 8px); opacity: 1; }
      }

      /* Smooth scroll natif */
      html {
        scroll-behavior: smooth;
      }

      /* Custom scrollbar pour un look pro */
      ::-webkit-scrollbar {
        width: 10px;
      }
      ::-webkit-scrollbar-track {
        background: #0d0f14;
      }
      ::-webkit-scrollbar-thumb {
        background: rgba(45, 111, 255, 0.25);
        border-radius: 5px;
        border: 2px solid #0d0f14;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: rgba(45, 111, 255, 0.5);
      }

      /* Sélection de texte aux couleurs Quantara */
      ::selection {
        background: rgba(45, 111, 255, 0.4);
        color: #fff;
      }

      /* Reduced motion : désactive les animations infinies pour l'accessibilité */
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
