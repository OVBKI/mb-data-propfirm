'use client'
// MeshBackground — fixed full-viewport pastel mesh gradient that slowly cycles.
// Uses pure CSS (radial-gradient layers + animated background-position + hue-rotate)
// so it stays GPU-cheap and works without JS after the first paint.

import { mist } from './tokens'

export default function MeshBackground() {
  return (
    <>
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          pointerEvents: 'none',
          background: mist.bg,
          overflow: 'hidden',
        }}
      >
        <div
          className="mist-mesh-layer"
          style={{
            position: 'absolute',
            // Oversize so the slow background-position pan never reveals an edge.
            inset: '-25%',
            // Three soft radial blobs blended over the cream base. The 200% sizing
            // lets `background-position` animation actually move them around.
            backgroundImage: `
              radial-gradient(ellipse 60% 50% at 20% 30%, ${mist.rose} 0%, transparent 60%),
              radial-gradient(ellipse 55% 55% at 80% 25%, ${mist.lavender} 0%, transparent 60%),
              radial-gradient(ellipse 60% 60% at 60% 80%, ${mist.sky} 0%, transparent 60%),
              radial-gradient(ellipse 70% 70% at 30% 80%, ${mist.cream} 0%, transparent 70%)
            `,
            backgroundSize: '200% 200%, 200% 200%, 200% 200%, 200% 200%',
            filter: 'blur(40px) saturate(1.05)',
            // Faint to keep contrast on text.
            opacity: 0.85,
            animation: 'mistMeshDrift 80s ease-in-out infinite, mistHueCycle 120s linear infinite',
          }}
        />
      </div>
      <style>{`
        @keyframes mistMeshDrift {
          0%   { background-position:   0%   0%,  100%  0%,  50% 100%,   0% 50%; }
          25%  { background-position:  30%  20%,   70% 30%,  80%  70%,  20% 30%; }
          50%  { background-position: 100% 100%,    0% 80%,  20%  10%,  80% 80%; }
          75%  { background-position:  60%  40%,   40% 50%,  60%  40%,  40% 60%; }
          100% { background-position:   0%   0%,  100%  0%,  50% 100%,   0% 50%; }
        }
        @keyframes mistHueCycle {
          0%   { filter: blur(40px) saturate(1.05) hue-rotate(0deg); }
          50%  { filter: blur(40px) saturate(1.10) hue-rotate(12deg); }
          100% { filter: blur(40px) saturate(1.05) hue-rotate(0deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .mist-mesh-layer { animation: none !important; }
        }
      `}</style>
    </>
  )
}
