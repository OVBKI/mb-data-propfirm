'use client'
// Scène 3D du hero Quantara : champ d'étoiles parallax + planète centrale avec logo.
//
// COMPOSITION :
//   1. Champ d'étoiles 3D (1500 points en sphère, mix bleu/blanc)
//   2. Planète centrale : sphère sombre + 2 halos atmosphériques + logo Q en façade
//   3. Caméra qui parallax avec la souris (vraie 3D = étoiles proches bougent plus)
//   4. Rotation idle continue de la planète + du champ d'étoiles
//
// PERF :
//   - Une seule WebGL Canvas pour tout (étoiles + planète) = un seul context GPU
//   - dpr capé à 1.5 (pas besoin de 4K natif sur du rendu spatial)
//   - antialias off (étoiles trop petites pour bénéficier)
//   - Sphères avec 32-64 segments (smooth sans excès)
//
// ACCESSIBILITÉ :
//   - prefers-reduced-motion : rend null → fallback au logo 2D standard

import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial, useTexture } from '@react-three/drei'
import * as THREE from 'three'

// ============================================================================
// MOUSE TRACKER (window-level pour fonctionner même si une couche au-dessus
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
// ÉTOILES (deux groupes pour donner de la profondeur)
// ============================================================================

function StarGroup({ count, color, size, radiusInner, radiusOuter, rotSpeed }) {
  const ref = useRef()

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
// PLANÈTE CENTRALE — sphère sombre + 2 halos atmosphériques + logo Q en façade
// ============================================================================

function Planet() {
  // useTexture est suspense-compatible (suspends jusqu'au chargement)
  const logoTexture = useTexture('/quantara-logo.png')

  const planetRef = useRef()
  const haloInnerRef = useRef()
  const haloOuterRef = useRef()

  useFrame((state, delta) => {
    // Rotation continue lente de la planète (effet "planète qui tourne sur elle-même")
    if (planetRef.current) {
      planetRef.current.rotation.y += delta * 0.12
    }
    // Halos respirent doucement (scale 1.0 ↔ 1.05 sur 4 secondes)
    const t = state.clock.elapsedTime
    const breathe = 1 + Math.sin(t * 1.5) * 0.025
    if (haloInnerRef.current) {
      haloInnerRef.current.scale.setScalar(breathe)
    }
    if (haloOuterRef.current) {
      haloOuterRef.current.scale.setScalar(1 + Math.sin(t * 1.0 + 1.2) * 0.04)
    }
  })

  return (
    <group position={[0, 0.35, 0]}>
      {/* HALO EXTERNE — atmosphère lointaine, très subtil */}
      <mesh ref={haloOuterRef}>
        <sphereGeometry args={[0.52, 32, 32]} />
        <meshBasicMaterial
          color="#4d8fff"
          transparent
          opacity={0.04}
          depthWrite={false}
        />
      </mesh>

      {/* HALO INTERNE — atmosphère proche, plus intense */}
      <mesh ref={haloInnerRef}>
        <sphereGeometry args={[0.42, 32, 32]} />
        <meshBasicMaterial
          color="#4d8fff"
          transparent
          opacity={0.10}
          depthWrite={false}
        />
      </mesh>

      {/* PLANÈTE — sphère sombre métallique qui tourne */}
      <mesh ref={planetRef}>
        <sphereGeometry args={[0.32, 64, 64]} />
        <meshStandardMaterial
          color="#0a1428"
          metalness={0.55}
          roughness={0.35}
          emissive="#1a3060"
          emissiveIntensity={0.45}
        />
      </mesh>

      {/* LOGO Q — plan en façade, ne tourne PAS avec la planète, blending additif
          pour que le fond sombre du PNG disparaisse (seul le Q lumineux apparaît).
          depthWrite false pour que le logo se compose proprement par-dessus la sphère. */}
      <mesh position={[0, 0, 0.33]}>
        <planeGeometry args={[0.55, 0.55]} />
        <meshBasicMaterial
          map={logoTexture}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          opacity={1}
        />
      </mesh>
    </group>
  )
}

// ============================================================================
// PARALLAX CAMÉRA — translate la caméra avec la souris pour effet de profondeur
// ============================================================================

function ParallaxCamera() {
  useFrame((state) => {
    const targetX = mouseRef.x * 0.6
    const targetY = mouseRef.y * 0.4
    state.camera.position.x += (targetX - state.camera.position.x) * 0.04
    state.camera.position.y += (targetY - state.camera.position.y) * 0.04
    state.camera.lookAt(0, 0.35, 0) // regarde vers le centre de la planète
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
        camera={{ position: [0, 0.35, 1.5], fov: 60, near: 0.1, far: 100 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          {/* Lumières : ambient pour visibilité globale + directionnelle pour modeler
              la planète + point bleue pour rim light côté gauche */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[3, 2, 4]} intensity={1.1} color="#ffffff" />
          <pointLight position={[-2.5, -1, 1.5]} intensity={0.6} color="#4d8fff" />

          {/* Champ d'étoiles bleues (profondes, nombreuses) */}
          <StarGroup
            count={1100}
            color="#4d8fff"
            size={0.013}
            radiusInner={2}
            radiusOuter={9}
            rotSpeed={0.015}
          />
          {/* Étoiles blanches plus proches (pop visuel) */}
          <StarGroup
            count={400}
            color="#e8f0ff"
            size={0.018}
            radiusInner={1.2}
            radiusOuter={5}
            rotSpeed={0.025}
          />

          {/* Planète centrale Quantara */}
          <Planet />

          <ParallaxCamera />
        </Suspense>
      </Canvas>
    </div>
  )
}
