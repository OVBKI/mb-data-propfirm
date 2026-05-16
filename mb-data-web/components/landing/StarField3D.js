'use client'
// Champ d'étoiles 3D interactif avec parallax souris.
// Utilise React Three Fiber (R3F) + drei pour le rendu WebGL.
//
// COMPORTEMENT :
//   - 1500 étoiles distribuées dans une sphère 3D
//   - Mix de 2 teintes : ~70% bleu clair Quantara + 30% blanc cassé pour la profondeur
//   - Caméra dérive très lentement (rotation idle)
//   - Mouvement souris → la caméra translate très subtilement → parallax 3D naturel
//   - Les étoiles proches bougent plus que les étoiles lointaines (vraie 3D)
//
// PERF :
//   - Points + PointMaterial : la façon la plus efficace de render 1000+ particules en WebGL
//   - dpr capé à 1.5 (full retina sur 4K = trop lourd pour zéro gain visuel)
//   - antialiasing OFF (les étoiles sont si petites que l'AA n'apporte rien)
//   - alpha: true pour fond transparent (laisse passer les blobs CSS dessous)
//   - frameloop 'always' pour l'idle rotation mais R3F est ultra-optimisé
//
// ACCESSIBILITÉ :
//   - prefers-reduced-motion : composant rend null → fallback CSS via parent

import { useRef, useMemo, useEffect, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'

// Tracker souris au niveau window — fonctionne même si une couche au-dessus
// (comme ParticlesField avec pointerEvents auto) capture les événements souris.
// Coordonnées normalisées [-1, 1] comme R3F state.mouse.
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

  // Génère les positions UNE seule fois (pas de re-render à chaque frame)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      // Distribution sphérique uniforme (méthode Marsaglia)
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

  // Rotation idle subtle (rend la scène vivante sans souris)
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
    // On utilise mouseRef (tracker window-level) au lieu de state.mouse
    // pour fonctionner même si une couche au-dessus capture les events souris.
    // Lerp = smoothing : la caméra rattrape la souris en douceur.
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
  // Bail out si l'user a "reduced motion" — pas de fond 3D animé
  if (typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return null
  }

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none', // jamais bloquer les clics du contenu
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
          {/* Étoiles bleues Quantara — plus nombreuses, profondes */}
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
