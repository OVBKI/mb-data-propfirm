'use client'
// Champ d'étoiles 3D interactif avec parallax souris.
// React Three Fiber (R3F) + drei pour le rendu WebGL.
//
// COMPORTEMENT :
//   - 1500 étoiles distribuées dans une sphère 3D
//   - Mix bleu Quantara (1100) + blanc cassé (400) pour la profondeur
//   - Caméra dérive très lentement (rotation idle)
//   - Mouvement souris → caméra translate subtilement → parallax 3D naturel
//   - Étoiles proches bougent plus que lointaines (vraie 3D)
//
// PERF :
//   - Points + PointMaterial = render le plus efficace pour 1000+ particules WebGL
//   - dpr capé à 1.5
//   - antialias off (étoiles trop petites pour bénéficier)
//
// ACCESSIBILITÉ :
//   - prefers-reduced-motion : rend null → fallback CSS via parent

import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'

// ============================================================================
// MOUSE TRACKER (window-level pour fonctionner même si couche au-dessus
// capture les events, ex: ParticlesField 2D)
// ============================================================================

const mouseRef = { x: 0, y: 0 }
if (typeof window !== 'undefined') {
  window.addEventListener('mousemove', (e) => {
    mouseRef.x = (e.clientX / window.innerWidth) * 2 - 1
    mouseRef.y = -(e.clientY / window.innerHeight) * 2 + 1
  }, { passive: true })
}

// ============================================================================
// GROUPE D'ÉTOILES (réutilisable pour deux teintes)
// ============================================================================

function StarGroup({ count, color, size, radiusInner, radiusOuter, rotSpeed }) {
  const ref = useRef()

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      // Distribution sphérique uniforme (Marsaglia)
      const u = Math.random() * 2 - 1
      const theta = Math.random() * Math.PI * 2
      const r = radiusInner + Math.random() * (radiusOuter - radiusInner)
      const sqrt = Math.sqrt(1 - u * u)
      arr[i * 3]     = r * sqrt * Math.cos(theta)
      arr[i * 3 + 1] = r * sqrt * Math.sin(theta)
      arr[i * 3 + 2] = r * u
    }
    return arr
  }, [count, radiusInner, radiusOuter])

  useFrame((state, delta) => {
    if (!ref.current) return
    ref.current.rotation.y += delta * rotSpeed
    ref.current.rotation.x += delta * rotSpeed * 0.4
  })

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={color}
        size={size}
        sizeAttenuation
        depthWrite={false}
        opacity={0.85}
      />
    </Points>
  )
}

// ============================================================================
// PARALLAX CAMÉRA (souris bouge la caméra → vraie profondeur 3D)
// ============================================================================

function ParallaxCamera() {
  useFrame((state) => {
    const targetX = mouseRef.x * 0.8
    const targetY = mouseRef.y * 0.5
    state.camera.position.x += (targetX - state.camera.position.x) * 0.04
    state.camera.position.y += (targetY - state.camera.position.y) * 0.04
    state.camera.lookAt(0, 0, 0)
  })
  return null
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function StarField3D() {
  // Respecte prefers-reduced-motion → pas de rendu 3D animé
  if (typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return null
  }

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 0,
    }}>
      <Canvas
        camera={{ position: [0, 0, 1], fov: 75, near: 0.1, far: 100 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          {/* Étoiles bleues Quantara — profondes, nombreuses */}
          <StarGroup
            count={1100}
            color="#4d8fff"
            size={0.013}
            radiusInner={2}
            radiusOuter={9}
            rotSpeed={0.015}
          />
          {/* Étoiles blanches — moins nombreuses, plus proches → pop visuel */}
          <StarGroup
            count={400}
            color="#e8f0ff"
            size={0.018}
            radiusInner={1.2}
            radiusOuter={5}
            rotSpeed={0.025}
          />
          <ParallaxCamera />
        </Suspense>
      </Canvas>
    </div>
  )
}
